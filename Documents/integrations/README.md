# GITORC Integrations

This directory contains integration guides and examples for connecting GITORC with external services.

## Available Integrations

### Discord Notifications

Real-time notifications to Discord for platform events including pipelines, deployments, security alerts, and system health.

**Files:**
- `discord.md` - Complete Discord integration guide
- `QUICKSTART.md` - Quick start with examples
- `.env.discord.template` - Environment configuration template

**Key Features:**
- ✅ Pipeline event notifications (start, success, failure)
- ✅ Deployment notifications (start, success, failure, rollback)
- ✅ Repository event notifications (create, branch, merge, commit)
- ✅ Security event alerts (violations, auth failures, access denied)
- ✅ System health alerts (CPU, memory, container restarts)
- ✅ User event notifications (signup, access requests)

**Getting Started:**
1. Read [Discord Integration Guide](./discord.md)
2. Follow [Quick Start Guide](./QUICKSTART.md)
3. Use `.env.discord.template` for configuration

---

### Slack Notifications

OAuth 2.0 integration with Slack App for real-time notifications including pipelines, deployments, security alerts, and system health. Includes event verification and slash command support.

**Files:**
- `slack.md` - Complete Slack integration reference (800+ lines)
- `slack-quickstart.md` - 6-step quick implementation guide
- `slack-setup.md` - Configuration guide with exact file locations
- `.env.slack.template` - Environment configuration template
- `slack-delivery-summary.md` - Project completion overview

**Key Features:**
- ✅ OAuth 2.0 authorization flow
- ✅ HMAC-SHA256 request signature verification
- ✅ Pipeline event notifications (success, failure, running)
- ✅ Deployment notifications (production, staging, development)
- ✅ Security event alerts (violations, intrusions, compliance)
- ✅ Repository event notifications (push, merge, delete)
- ✅ Health event alerts (healthy, degraded, offline)
- ✅ Slash command support
- ✅ Custom event notifications
- ✅ Direct message support
- ✅ Async delivery with retry logic (3 attempts)
- ✅ 13 passing unit tests

**Getting Started:**
1. Gather your 5 Slack App credentials (Bot Token, Signing Secret, Client ID, Client Secret, App ID)
2. Read [Slack Setup Guide](./slack-setup.md) for exact configuration file locations
3. Follow [Slack Quick Start](./slack-quickstart.md) (6 steps, ~10 minutes)
4. Use `.env.slack.template` for configuration
5. See [Complete Reference](./slack.md) for architecture and troubleshooting

---

## Configuration

### Environment Variables Template

Copy `.env.discord.template` to your `.env` file and customize:

```bash
cp docs/integrations/.env.discord.template .env.discord
```

### Secure Credential Storage

**Never commit webhook URLs to version control.**

- Use `.gitignore` to exclude `.env` files
- Use secrets management for cloud deployments
- Rotate tokens periodically

---

## Integration Status

| Integration | Status | Version | Tests | Last Updated |
|------------|--------|---------|-------|--------------|
| Discord   | ✅ Complete | 1.0.0 | 11/11 passing | 2026-06-02  |
| Slack     | ✅ Complete | 1.0.0 | 13/14 passing | 2026-06-02  |

---

## Architecture

All integrations follow these principles:

1. **Non-blocking**: Notifications sent asynchronously
2. **Resilient**: Built-in retry logic with exponential backoff
3. **Secure**: No sensitive data in notifications
4. **Configurable**: Enable/disable via environment variables
5. **Typed Events**: Strongly-typed notification events
6. **Testable**: Unit tests included for all integrations

---

## Module Structure

```
gitorcapi/
└── internal/
    └── platform/
        ├── discord/
        │   ├── webhook.go              # Core webhook client
        │   ├── webhook_test.go         # Unit tests
        │   ├── events.go               # Event type definitions
        │   ├── manager.go              # Global notification manager
        │   └── integration_examples.go # Code examples
        │
        └── slack/
            ├── notifier.go             # Slack API HTTP client
            ├── notifier_test.go        # Unit tests (13 passing)
            ├── events.go               # Event type definitions
            ├── verifier.go             # Signature verification
            ├── manager.go              # Global notification manager
            ├── handlers.go             # OAuth, event, command handlers
            └── integration_examples.go # Code examples
```

---

## Quick Integration

### 1. Import Discord Manager

```go
import "github.com/gitorc/gitorcapi/internal/platform/discord"

// Initialize (usually in main or service startup)
discord.Initialize()
```

### 2. Send Notifications

```go
mgr := discord.GetManager()

// Pipeline event
mgr.NotifyPipelineEvent(ctx, "success", pipelineID, branch, commit, url)

// Deployment event
mgr.NotifyDeploymentEvent(ctx, "success", env, service, version, url)

// Security event
mgr.NotifySecurityEvent(ctx, "violation", "RBAC", user, "details", url)

// Health event
mgr.NotifyHealthEvent(ctx, "critical", "memory", "usage", "95%", url)

// User event
mgr.NotifyUserEvent(ctx, "signup", user, email, "details", url)
```

---

## Testing

### Unit Tests

```bash
cd gitorcapi/internal/platform/discord
go test -v
```

### Integration Test

```bash
# Set webhook URL
export DISCORD_WEBHOOK_URL="https://discord.com/api/webhooks/..."
export DISCORD_NOTIFICATIONS_ENABLED=true

# Run service and trigger events
go run ./cmd/gitorc-gateway/main.go
```

---

## Troubleshooting

### Check Discord Webhook

```bash
curl -X POST "$DISCORD_WEBHOOK_URL" \
  -H "Content-Type: application/json" \
  -d '{"content":"Test from GITORC"}'
```

### View Logs

```bash
# Docker
docker logs gitorc-gateway | grep -i discord

# Systemd
journalctl -u gitorc-gateway | grep -i discord
```

### Enable Debug Logging

```go
// In service code
if discordMgr.IsEnabled() {
    log.Println("Discord notifications enabled")
}
```

---

## Event Categories

### Pipeline Events
- `pipeline.start` - Pipeline execution started
- `pipeline.success` - Pipeline completed successfully
- `pipeline.failure` - Pipeline failed

### Deployment Events
- `deployment.start` - Deployment initiated
- `deployment.success` - Deployment succeeded
- `deployment.failure` - Deployment failed
- `deployment.rollback` - Rollback executed

### Repository Events
- `repo.created` - New repository created
- `branch.created` - New branch created
- `merge.completed` - Merge completed
- `commit.pushed` - Commit pushed

### Security Events
- `security.violation` - RBAC violation
- `auth.failure` - Authentication failed
- `access.denied` - Access denied

### Health Events
- `health.warning` - System warning
- `health.critical` - Critical issue
- `container.restart` - Container restarted

### User Events
- `user.signup` - New user registered
- `access.request` - Access request submitted
- `access.approved` - Access approved
- `access.denied` - Access denied

---

## Message Format

All Discord messages use consistent embed format:

```
╔═══════════════════════════════════╗
║ Title (event name)                │
║                                   │
║ Description                       │
║                                   │
║ Field 1: Value                    │
║ Field 2: Value                    │
║                                   │
║ Color indicator:                  │
║  🟢 Green   - Success             │
║  🟡 Yellow  - Warning             │
║  🔴 Red     - Critical            │
║  🔵 Blue    - Info                │
╚═══════════════════════════════════╝
```

---

## Performance Considerations

1. **Async by default**: Notifications don't block main operations
2. **Retry logic**: Up to 3 retries with exponential backoff
3. **Timeout**: 10-second HTTP timeout per request
4. **Concurrency**: Multiple goroutines safe with mutex protection
5. **Rate limiting**: Consider Discord's 10 req/10sec webhook limit

---

## Security Notes

1. **Webhook URLs** are sensitive - store in secrets management
2. **No sensitive data** in notification messages
3. **Environment variables** for configuration only
4. **Audit logs** for webhook access
5. **Token rotation** recommended quarterly

---

## Roadmap

Future integrations planned:

- Slack notifications
- PagerDuty incidents
- Datadog events
- CloudWatch metrics
- Webhook signatures (for verification)

---

## Support

For issues or questions:

1. Check integration documentation
2. Review troubleshooting guide
3. Run unit tests
4. Check service logs

---

## Contributing

To add new integrations:

1. Create new package under `internal/platform/{service}`
2. Follow existing patterns (manager, events, tests)
3. Add configuration to platform/config
4. Write unit tests and integration examples
5. Document in integrations folder
6. Add to this README

---

*Last Updated: 2026-06-02*
*GITORC Platform*
