"""
OrcaStack Billing & Usage - Python Event Emission SDK

Usage:
    from billing_sdk import BillingSDK

    sdk = BillingSDK(
        endpoint='https://orcastack.org/api/billing/events/ingest/',
        api_key='<your-api-key>',
        service='compute',
    )

    sdk.emit({
        'event_type':      'vm.started',
        'organization_id': 'org-uuid-here',
        'units':           1.5,
        'unit_type':       'vm_hour',
        'metadata':        {'region': 'us-east-1'},
    })
"""

import hashlib
import json
import logging
import time
import threading
import uuid
from datetime import datetime, timezone
from queue import Empty, Queue
from typing import Any, Dict, List, Optional

try:
    import urllib.request as _urllib
    import urllib.error as _urllib_err
    _HAS_URLLIB = True
except ImportError:
    _HAS_URLLIB = False

log = logging.getLogger('orcastack.billing_sdk')

# ─────────────────────────────────────────────────────────────────────────────
# Schema
# ─────────────────────────────────────────────────────────────────────────────

REQUIRED_FIELDS = {'event_type', 'organization_id', 'units', 'unit_type'}
VALID_UNIT_TYPES = {
    'vm_hour', 'gb', 'email', 'domain', 'pipeline_run',
    'gb_transfer', 'agent_hour', 'api_call', 'key',
}
VALID_SERVICES = {
    'compute', 'storage', 'email', 'domain', 'pipeline',
    'networking', 'monitoring', 'auth', 'secrets',
}


def _validate_event(event: Dict[str, Any], service: str) -> None:
    """Raises ValueError on schema violation."""
    missing = REQUIRED_FIELDS - event.keys()
    if missing:
        raise ValueError(f'Missing required fields: {", ".join(sorted(missing))}')

    try:
        units = float(event['units'])
        if units < 0:
            raise ValueError('units must be >= 0')
    except (TypeError, ValueError) as exc:
        raise ValueError(f'units must be numeric: {exc}') from exc

    unit_type = event['unit_type']
    if unit_type not in VALID_UNIT_TYPES:
        raise ValueError(
            f'Invalid unit_type "{unit_type}". Valid: {", ".join(sorted(VALID_UNIT_TYPES))}'
        )

    if service not in VALID_SERVICES:
        raise ValueError(
            f'Invalid service "{service}". Valid: {", ".join(sorted(VALID_SERVICES))}'
        )

    if not str(event.get('organization_id', '')).strip():
        raise ValueError('organization_id must be a non-empty string')


# ─────────────────────────────────────────────────────────────────────────────
# HTTP Transport
# ─────────────────────────────────────────────────────────────────────────────

class _Transport:
    def __init__(self, endpoint: str, api_key: str, timeout: int = 10):
        self.endpoint = endpoint.rstrip('/')
        self.api_key  = api_key
        self.timeout  = timeout

    def send(self, payload: Dict[str, Any]) -> Dict[str, Any]:
        body    = json.dumps(payload).encode('utf-8')
        headers = {
            'Content-Type':  'application/json',
            'Authorization': f'Bearer {self.api_key}',
            'User-Agent':    'orcastack-billing-sdk/python/1.0',
        }
        req = _urllib.Request(self.endpoint + '/', data=body, headers=headers, method='POST')
        try:
            with _urllib.urlopen(req, timeout=self.timeout) as resp:
                return json.loads(resp.read().decode('utf-8'))
        except _urllib_err.HTTPError as exc:
            body = exc.read().decode('utf-8', errors='replace')
            raise RuntimeError(f'HTTP {exc.code}: {body}') from exc

    def send_batch(self, payloads: List[Dict[str, Any]]) -> List[Dict[str, Any]]:
        body    = json.dumps({'events': payloads}).encode('utf-8')
        headers = {
            'Content-Type':  'application/json',
            'Authorization': f'Bearer {self.api_key}',
            'User-Agent':    'orcastack-billing-sdk/python/1.0',
        }
        req = _urllib.Request(
            self.endpoint.replace('/ingest/', '/ingest/batch/') + '/',
            data=body, headers=headers, method='POST',
        )
        try:
            with _urllib.urlopen(req, timeout=self.timeout) as resp:
                return json.loads(resp.read().decode('utf-8'))
        except _urllib_err.HTTPError as exc:
            body = exc.read().decode('utf-8', errors='replace')
            raise RuntimeError(f'HTTP {exc.code}: {body}') from exc


# ─────────────────────────────────────────────────────────────────────────────
# Retry logic
# ─────────────────────────────────────────────────────────────────────────────

def _with_retry(fn, max_retries: int = 4, base_delay: float = 0.5):
    """Exponential backoff retry — does NOT retry on 4xx (client errors)."""
    delay = base_delay
    for attempt in range(max_retries + 1):
        try:
            return fn()
        except RuntimeError as exc:
            msg = str(exc)
            # 4xx = caller error, do not retry
            if msg.startswith('HTTP 4'):
                raise
            if attempt == max_retries:
                raise
            log.warning('billing_sdk retry %d/%d after error: %s', attempt + 1, max_retries, msg)
            time.sleep(delay)
            delay = min(delay * 2, 30.0)


# ─────────────────────────────────────────────────────────────────────────────
# Async batch worker
# ─────────────────────────────────────────────────────────────────────────────

class _AsyncWorker(threading.Thread):
    """Background thread that drains an in-memory queue in micro-batches."""

    def __init__(self, transport: _Transport, service: str,
                 batch_size: int = 50, flush_interval: float = 2.0):
        super().__init__(daemon=True, name='billing-sdk-worker')
        self._q              = Queue()
        self._transport      = transport
        self._service        = service
        self._batch_size     = batch_size
        self._flush_interval = flush_interval
        self._stop_event     = threading.Event()

    def enqueue(self, payload: Dict[str, Any]) -> None:
        self._q.put(payload)

    def flush(self) -> None:
        """Block until the queue is empty."""
        self._q.join()

    def stop(self) -> None:
        self._stop_event.set()
        self.flush()

    def run(self) -> None:
        while not self._stop_event.is_set():
            batch: List[Dict[str, Any]] = []
            deadline = time.monotonic() + self._flush_interval

            # Collect up to batch_size events or until flush_interval
            while len(batch) < self._batch_size:
                remaining = deadline - time.monotonic()
                if remaining <= 0:
                    break
                try:
                    item = self._q.get(timeout=min(remaining, 0.1))
                    batch.append(item)
                except Empty:
                    if time.monotonic() >= deadline:
                        break

            if batch:
                self._send_batch(batch)

        # Drain remaining on shutdown
        remaining: List[Dict[str, Any]] = []
        while not self._q.empty():
            try:
                remaining.append(self._q.get_nowait())
            except Empty:
                break
        if remaining:
            self._send_batch(remaining)

    def _send_batch(self, batch: List[Dict[str, Any]]) -> None:
        try:
            _with_retry(lambda: self._transport.send_batch(batch))
        except Exception as exc:  # noqa: BLE001
            log.error('billing_sdk async batch send failed (%d events): %s', len(batch), exc)
        finally:
            for _ in batch:
                self._q.task_done()


# ─────────────────────────────────────────────────────────────────────────────
# Public SDK
# ─────────────────────────────────────────────────────────────────────────────

class BillingSDK:
    """
    Thread-safe OrcaStack Billing SDK.

    Parameters
    ----------
    endpoint  : Full URL to the ingest endpoint
                e.g. 'https://orcastack.org/api/billing/events/ingest/'
    api_key   : Bearer token for the billing API
    service   : Service identifier (compute/storage/email/…)
    async_mode: If True, events are queued and sent in background batches.
                If False (default), each call blocks until the event is delivered.
    batch_size: Max events per async batch (default 50)
    max_retries: Retry attempts on transient failures (default 4)
    timeout   : HTTP request timeout in seconds (default 10)
    """

    def __init__(
        self,
        endpoint:    str,
        api_key:     str,
        service:     str,
        async_mode:  bool  = False,
        batch_size:  int   = 50,
        max_retries: int   = 4,
        timeout:     int   = 10,
    ):
        if service not in VALID_SERVICES:
            raise ValueError(f'Invalid service "{service}"')

        self._service     = service
        self._max_retries = max_retries
        self._transport   = _Transport(endpoint, api_key, timeout)
        self._async       = async_mode
        self._worker: Optional[_AsyncWorker] = None

        if async_mode:
            self._worker = _AsyncWorker(self._transport, service, batch_size)
            self._worker.start()

    # ------------------------------------------------------------------
    def emit(self, event: Dict[str, Any]) -> Optional[Dict[str, Any]]:
        """
        Emit a single usage event.

        Required fields in *event*:
          event_type      str  — e.g. 'vm.started'
          organization_id str  — org UUID
          units           num  — quantity consumed
          unit_type       str  — vm_hour / gb / email / …

        Optional:
          event_id   str   — idempotency key (auto-generated if omitted)
          user_id    str   — user who triggered the event
          project_id str   — project context
          metadata   dict  — arbitrary key/value pairs
          timestamp  str   — ISO8601 (defaults to now)

        Returns the API response dict in sync mode, None in async mode.
        """
        _validate_event(event, self._service)
        payload = self._build_payload(event)

        if self._async and self._worker:
            self._worker.enqueue(payload)
            return None
        return _with_retry(
            lambda: self._transport.send(payload),
            max_retries=self._max_retries,
        )

    def emit_batch(self, events: List[Dict[str, Any]]) -> Optional[List[Dict[str, Any]]]:
        """
        Emit a list of events as a single batch request (sync).

        No-op in async mode (events are already batched by the worker).
        """
        if self._async:
            for ev in events:
                self.emit(ev)
            return None

        validated = []
        for ev in events:
            _validate_event(ev, self._service)
            validated.append(self._build_payload(ev))

        return _with_retry(
            lambda: self._transport.send_batch(validated),
            max_retries=self._max_retries,
        )

    def flush(self) -> None:
        """Block until all async-queued events have been delivered."""
        if self._worker:
            self._worker.flush()

    def close(self) -> None:
        """Flush and shut down the async worker."""
        if self._worker:
            self._worker.stop()

    # ------------------------------------------------------------------
    def _build_payload(self, event: Dict[str, Any]) -> Dict[str, Any]:
        """Attach service identity, timestamp, and idempotency key."""
        payload = dict(event)
        payload['service'] = self._service

        # Idempotency key — deterministic from content if not supplied
        if 'event_id' not in payload:
            fingerprint = json.dumps(
                {k: payload[k] for k in sorted(payload)}, sort_keys=True, default=str
            )
            payload['event_id'] = str(
                uuid.UUID(hashlib.sha256(fingerprint.encode()).hexdigest()[:32])
            )

        # Timestamp
        if 'timestamp' not in payload:
            payload['timestamp'] = datetime.now(timezone.utc).isoformat()

        return payload

    # Context-manager support
    def __enter__(self):
        return self

    def __exit__(self, *_):
        self.close()
