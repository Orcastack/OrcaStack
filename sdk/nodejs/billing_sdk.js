'use strict';
/**
 * OrcaStack Billing & Usage — Node.js Event Emission SDK
 *
 * Usage:
 *   const { BillingSDK } = require('./billing_sdk');
 *
 *   const sdk = new BillingSDK({
 *     endpoint:  'https://orcastack.org/api/billing/events/ingest/',
 *     apiKey:    process.env.BILLING_API_KEY,
 *     service:   'compute',
 *   });
 *
 *   await sdk.emit({
 *     eventType:      'vm.started',
 *     organizationId: 'org-uuid-here',
 *     units:           1.5,
 *     unitType:        'vm_hour',
 *     metadata:        { region: 'us-east-1' },
 *   });
 *
 *   await sdk.close();
 */

const crypto  = require('crypto');
const https   = require('https');
const http    = require('http');
const { URL } = require('url');

// ─────────────────────────────────────────────────────────────────────────────
// Schema constants
// ─────────────────────────────────────────────────────────────────────────────

const REQUIRED_FIELDS = ['eventType', 'organizationId', 'units', 'unitType'];

const VALID_UNIT_TYPES = new Set([
  'vm_hour', 'gb', 'email', 'domain', 'pipeline_run',
  'gb_transfer', 'agent_hour', 'api_call', 'key',
]);

const VALID_SERVICES = new Set([
  'compute', 'storage', 'email', 'domain', 'pipeline',
  'networking', 'monitoring', 'auth', 'secrets',
]);

// ─────────────────────────────────────────────────────────────────────────────
// Validation
// ─────────────────────────────────────────────────────────────────────────────

function validateEvent(event, service) {
  for (const field of REQUIRED_FIELDS) {
    if (event[field] === undefined || event[field] === null) {
      throw new Error(`Missing required field: ${field}`);
    }
  }
  const units = Number(event.units);
  if (isNaN(units) || units < 0) {
    throw new Error('units must be a non-negative number');
  }
  if (!VALID_UNIT_TYPES.has(event.unitType)) {
    throw new Error(`Invalid unitType "${event.unitType}". Valid: ${[...VALID_UNIT_TYPES].join(', ')}`);
  }
  if (!VALID_SERVICES.has(service)) {
    throw new Error(`Invalid service "${service}". Valid: ${[...VALID_SERVICES].join(', ')}`);
  }
  if (!String(event.organizationId || '').trim()) {
    throw new Error('organizationId must be a non-empty string');
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// HTTP transport (zero dependencies)
// ─────────────────────────────────────────────────────────────────────────────

function httpPost(endpoint, apiKey, body, timeoutMs = 10000) {
  return new Promise((resolve, reject) => {
    const parsed  = new URL(endpoint);
    const isHttps = parsed.protocol === 'https:';
    const driver  = isHttps ? https : http;
    const data    = Buffer.from(JSON.stringify(body), 'utf8');

    const req = driver.request(
      {
        hostname: parsed.hostname,
        port:     parsed.port || (isHttps ? 443 : 80),
        path:     parsed.pathname + (parsed.search || ''),
        method:   'POST',
        headers:  {
          'Content-Type':   'application/json',
          'Content-Length': data.length,
          'Authorization':  `Bearer ${apiKey}`,
          'User-Agent':     'orcastack-billing-sdk/nodejs/1.0',
        },
        timeout: timeoutMs,
      },
      (res) => {
        let raw = '';
        res.on('data', (chunk) => { raw += chunk; });
        res.on('end', () => {
          if (res.statusCode >= 400) {
            const err = new Error(`HTTP ${res.statusCode}: ${raw}`);
            err.statusCode = res.statusCode;
            return reject(err);
          }
          try { resolve(JSON.parse(raw)); }
          catch (_) { resolve(raw); }
        });
      },
    );

    req.on('timeout', () => { req.destroy(new Error('Request timed out')); });
    req.on('error', reject);
    req.end(data);
  });
}

// ─────────────────────────────────────────────────────────────────────────────
// Retry with exponential backoff
// ─────────────────────────────────────────────────────────────────────────────

async function withRetry(fn, maxRetries = 4, baseDelay = 500) {
  let delay = baseDelay;
  for (let attempt = 0; attempt <= maxRetries; attempt++) {
    try {
      return await fn();
    } catch (err) {
      // 4xx = client error, do not retry
      if (err.statusCode && err.statusCode >= 400 && err.statusCode < 500) throw err;
      if (attempt === maxRetries) throw err;
      await new Promise(r => setTimeout(r, delay));
      delay = Math.min(delay * 2, 30000);
    }
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// Deterministic event_id from content hash
// ─────────────────────────────────────────────────────────────────────────────

function deterministicId(payload) {
  const sorted = Object.keys(payload).sort().reduce((acc, k) => {
    acc[k] = payload[k]; return acc;
  }, {});
  const hash = crypto.createHash('sha256')
    .update(JSON.stringify(sorted))
    .digest('hex')
    .slice(0, 32);
  return `${hash.slice(0,8)}-${hash.slice(8,12)}-${hash.slice(12,16)}-${hash.slice(16,20)}-${hash.slice(20)}`;
}

// ─────────────────────────────────────────────────────────────────────────────
// Payload builder — maps camelCase JS API → snake_case API contract
// ─────────────────────────────────────────────────────────────────────────────

function buildPayload(event, service) {
  const payload = {
    event_type:      event.eventType,
    organization_id: event.organizationId,
    units:           event.units,
    unit_type:       event.unitType,
    service,
    timestamp:       event.timestamp || new Date().toISOString(),
  };
  if (event.eventId)    payload.event_id   = event.eventId;
  if (event.userId)     payload.user_id    = event.userId;
  if (event.projectId)  payload.project_id = event.projectId;
  if (event.metadata)   payload.metadata   = event.metadata;

  if (!payload.event_id) {
    payload.event_id = deterministicId(payload);
  }
  return payload;
}

// ─────────────────────────────────────────────────────────────────────────────
// Async batch worker
// ─────────────────────────────────────────────────────────────────────────────

class AsyncWorker {
  constructor({ transport, apiKey, batchSize = 50, flushInterval = 2000 }) {
    this._transport     = transport;
    this._apiKey        = apiKey;
    this._batchSize     = batchSize;
    this._flushInterval = flushInterval;
    this._queue         = [];
    this._pending       = 0;
    this._timer         = null;
    this._stopped       = false;
    this._drainCallbacks = [];
    this._schedule();
  }

  enqueue(payload) {
    this._queue.push(payload);
    this._pending++;
    if (this._queue.length >= this._batchSize) this._flush();
  }

  _schedule() {
    this._timer = setTimeout(() => {
      if (this._queue.length) this._flush();
      if (!this._stopped) this._schedule();
    }, this._flushInterval);
    if (this._timer.unref) this._timer.unref();
  }

  _flush() {
    if (!this._queue.length) return;
    const batch = this._queue.splice(0, this._batchSize);
    const batchApiKey = this._apiKey;
    const batchTransport = this._transport;

    withRetry(() => httpPost(
      batchTransport.replace('/ingest/', '/ingest/batch/'),
      batchApiKey,
      { events: batch },
    )).catch(err => {
      // Log but do not crash on async failure
      process.stderr.write(`[billing_sdk] async batch failed (${batch.length} events): ${err.message}\n`);
    }).finally(() => {
      this._pending -= batch.length;
      if (this._pending <= 0) {
        this._pending = 0;
        this._drainCallbacks.splice(0).forEach(cb => cb());
      }
    });
  }

  async drain() {
    if (this._pending <= 0) return;
    await new Promise(resolve => this._drainCallbacks.push(resolve));
  }

  async stop() {
    this._stopped = true;
    clearTimeout(this._timer);
    this._flush();
    await this.drain();
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// Public SDK
// ─────────────────────────────────────────────────────────────────────────────

class BillingSDK {
  /**
   * @param {object} options
   * @param {string} options.endpoint    - Ingest URL
   * @param {string} options.apiKey      - Bearer token
   * @param {string} options.service     - Service name (compute/storage/…)
   * @param {boolean} [options.asyncMode=false]
   * @param {number}  [options.batchSize=50]
   * @param {number}  [options.maxRetries=4]
   * @param {number}  [options.timeout=10000]
   */
  constructor({ endpoint, apiKey, service, asyncMode = false, batchSize = 50, maxRetries = 4, timeout = 10000 }) {
    if (!VALID_SERVICES.has(service)) {
      throw new Error(`Invalid service "${service}"`);
    }
    this._endpoint   = endpoint.replace(/\/$/, '') + '/';
    this._apiKey     = apiKey;
    this._service    = service;
    this._maxRetries = maxRetries;
    this._timeout    = timeout;
    this._worker     = asyncMode
      ? new AsyncWorker({ transport: this._endpoint, apiKey, batchSize })
      : null;
  }

  /**
   * Emit a single usage event.
   *
   * Event fields (camelCase):
   *   eventType       {string}  — e.g. 'vm.started'
   *   organizationId  {string}  — org UUID
   *   units           {number}  — quantity consumed
   *   unitType        {string}  — vm_hour / gb / …
   *   eventId?        {string}  — idempotency key (auto if omitted)
   *   userId?         {string}
   *   projectId?      {string}
   *   metadata?       {object}
   *   timestamp?      {string}  — ISO8601 (defaults to now)
   *
   * @returns {Promise<object|null>} API response in sync mode, null in async.
   */
  async emit(event) {
    validateEvent(event, this._service);
    const payload = buildPayload(event, this._service);

    if (this._worker) {
      this._worker.enqueue(payload);
      return null;
    }
    return withRetry(
      () => httpPost(this._endpoint, this._apiKey, payload, this._timeout),
      this._maxRetries,
    );
  }

  /**
   * Emit multiple events as a single batch (sync only).
   * In async mode each event is individually queued.
   *
   * @param {object[]} events
   * @returns {Promise<object[]|null>}
   */
  async emitBatch(events) {
    if (this._worker) {
      for (const ev of events) await this.emit(ev);
      return null;
    }
    const payloads = events.map(ev => {
      validateEvent(ev, this._service);
      return buildPayload(ev, this._service);
    });
    return withRetry(
      () => httpPost(
        this._endpoint.replace('/ingest/', '/ingest/batch/'),
        this._apiKey,
        { events: payloads },
        this._timeout,
      ),
      this._maxRetries,
    );
  }

  /** Block until all async-queued events have been sent. */
  async flush() {
    if (this._worker) await this._worker.drain();
  }

  /** Flush and shut down the async worker. */
  async close() {
    if (this._worker) await this._worker.stop();
  }
}

module.exports = { BillingSDK, VALID_SERVICES, VALID_UNIT_TYPES };
