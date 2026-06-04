# Discord Integration Guide

## Overview

The GITORC platform includes native Discord webhook integration for automated notifications across multiple event categories. This guide covers setup, configuration, and integration points.

## Table of Contents

1. [Prerequisites](#prerequisites)
2. [Discord Webhook Setup](#discord-webhook-setup)
3. [Configuration](#configuration)
4. [Event Types](#event-types)
5. [Integration Points](#integration-points)
6. [Message Format](#message-format)
7. [Testing](#testing)
8. [Troubleshooting](#troubleshooting)
9. [Best Practices](#best-practices)

---

## Prerequisites

- Discord server with administrator privileges
- GITORC platform deployed and running
- Ability to set environment variables in your deployment environment

---

## Discord Webhook Setup

### Step 1: Create a Discord Webhook

1. Open your Discord server
2. Go to the target channel where you want notifications
3. Click on the channel name → **Channel Settings** (gear icon)
4. Navigate to **Integrations** → **Webhooks**
5. Click **New Webhook**
6. Name the webhook: `GITORC Automation`
7. Optionally, upload an icon for the bot
8. Click **Copy Webhook URL**
9. Store the URL securely (see Configuration section)

**Webhook URL format:**
```
https://discord.com/api/webhooks/{WEBHOOK_ID}/{WEBHOOK_TOKEN}
```

### Step 2: Verify Webhook (Optional)

Test the webhook manually using curl:

```bash
curl -X POST https://discord.com/api/webhooks/{WEBHOOK_ID}/{WEBHOOK_TOKEN} \
  -H "Content-Type: application/json" \
  -d '{
    "content": "GITORC Test Message",
    "embeds": [{
      "title": "Test Notification",
      "description": "Discord integration is working!",
      "color": 255
    }]
  }'
```

---

## Configuration

### Environment Variables

Add the following environment variables to your deployment:

```bash
# Required: Discord webhook URL
DISCORD_WEBHOOK_URL=https://discord.com/api/webhooks/{WEBHOOK_ID}/{WEBHOOK_TOKEN}

# Optional: Enable/disable notifications (default: false)
DISCORD_NOTIFICATIONS_ENABLED=true

# Optional: Environment identifier for multi-environment setups
DISCORD_ENVIRONMENT=production
```

### Secure Credential Storage

**IMPORTANT:** Never store the webhook URL in code or version control.

#### Docker/Kubernetes
Use secrets management:

```yaml
# Kubernetes Secret
apiVersion: v1
kind: Secret
metadata:
  name: discord-webhook
type: Opaque
stringData:
  webhook-url: https://discord.com/api/webhooks/...
```

#### Docker Compose
```yaml
services:
  gitorc-gateway:
    environment:
      - DISCORD_WEBHOOK_URL=${DISCORD_WEBHOOK_URL}
      - DISCORD_NOTIFICATIONS_ENABLED=true
```

#### .env File (Development Only)
```bash
DISCORD_WEBHOOK_URL=https://discord.com/api/webhooks/...
DISCORD_NOTIFICATIONS_ENABLED=true
DISCORD_ENVIRONMENT=development
```

---

## Event Types

### Pipeline Events

Triggered during CI/CD pipeline execution.

**Types:**
- `pipeline.start` - Pipeline execution started
- `pipeline.success` - Pipeline completed successfully
- `pipeline.failure` - Pipeline failed

**Example Payload:**
```
Title: Pipeline success
Description: Pipeline execution completed with status: success
Fields:
  - Pipeline ID: pipe-abc123
  - Branch: main
  - Commit: abc123def456
  - Severity: info
```

### Deployment Events

Triggered during service deployments.

**Types:**
- `deployment.start` - Deployment initiated
- `deployment.success` - Deployment completed successfully
- `deployment.failure` - Deployment failed
- `deployment.rollback` - Rollback executed

**Example Payload:**
```
Title: Deployment success
Description: Service deployment completed with status: success
Fields:
  - Environment: production
  - Service: api-service
  - Version: v1.2.3
  - Severity: info
```

### Repository Events

Triggered by Git operations.

**Types:**
- `repo.created` - New repository created
- `branch.created` - New branch created
- `merge.completed` - Merge completed
- `commit.pushed` - Commit pushed

**Example Payload:**
```
Title: Repository Event: merged
Description: Repository action: merged
Fields:
  - Repository: my-repo
  - Details: Branch feature/auth merged into main
  - Severity: info
```

### Security Events

Triggered by security-related activities.

**Types:**
- `security.violation` - RBAC or permission violation
- `auth.failure` - Authentication failure
- `access.denied` - Access denied

**Example Payload:**
```
Title: Security Alert: RBAC violation
Description: Security event detected: RBAC violation
Fields:
  - Type: RBAC violation
  - Username: john.doe
  - Details: Attempted access to forbidden resource
  - Severity: critical
```

### System Health Events

Triggered by health checks and monitoring.

**Types:**
- `health.warning` - System warning threshold exceeded
- `health.critical` - Critical system issue detected
- `container.restart` - Container restarted unexpectedly

**Example Payload:**
```
Title: System Health: critical
Description: Health check alert: memory
Fields:
  - Component: memory
  - Metric: usage_percent
  - Value: 95.5
  - Severity: critical
```

### User Events

Triggered by user actions.

**Types:**
- `user.signup` - New user registration
- `access.request` - Access request submitted
- `access.approved` - Access request approved
- `access.denied` - Access request denied

**Example Payload:**
```
Title: User Event: signup
Description: User action: signup
Fields:
  - Username: john.doe
  - Email: john@example.com
  - Details: New user registration
  - Severity: info
```

---

## Integration Points

### In CI Service (gitorc-ci-service)

```go
import "github.com/gitorc/gitorcapi/internal/platform/discord"

func (ps *PipelineService) ExecutePipeline(ctx context.Context, pipelineID string) error {
    discordMgr := discord.GetManager()
    
    // Notify start
    discordMgr.NotifyPipelineEvent(ctx, "start", pipelineID, branch, commit, dashboardURL)
    
    // Execute pipeline...
    
    if err != nil {
        discordMgr.NotifyPipelineEvent(ctx, "failure", pipelineID, branch, commit, dashboardURL)
        return err
    }
    
    discordMgr.NotifyPipelineEvent(ctx, "success", pipelineID, branch, commit, dashboardURL)
    return nil
}
```

### In CD Service (gitorc-cd-service)

```go
func (ds *DeploymentService) Deploy(ctx context.Context, service, env, version string) error {
    discordMgr := discord.GetManager()
    
    discordMgr.NotifyDeploymentEvent(ctx, "start", env, service, version, dashboardURL)
    
    // Deploy...
    
    if err != nil {
        discordMgr.NotifyDeploymentEvent(ctx, "failure", env, service, version, dashboardURL)
        return err
    }
    
    discordMgr.NotifyDeploymentEvent(ctx, "success", env, service, version, dashboardURL)
    return nil
}
```

### In Git Service (gitorc-git-service)

```go
func (gs *GitService) OnMerge(ctx context.Context, repoName, source, target string) error {
    discordMgr := discord.GetManager()
    
    details := fmt.Sprintf("Branch %s merged into %s", source, target)
    discordMgr.NotifyRepositoryEvent(ctx, "merged", repoName, details, dashboardURL)
    
    return nil
}
```

### In Auth Layer (gatewayapi)

```go
func (ah *AuthHandler) OnAuthFailure(ctx context.Context, username string) error {
    discordMgr := discord.GetManager()
    
    discordMgr.NotifySecurityEvent(ctx, "auth_failure", "Failed authentication", 
        username, "Failed login attempt detected", dashboardURL)
    
    return nil
}
```

### In Health Checks (gitorc-analytics-service)

```go
func (hc *HealthChecker) CheckHealth(ctx context.Context) error {
    discordMgr := discord.GetManager()
    
    cpuUsage := getCPUUsage()
    if cpuUsage > 80 {
        discordMgr.NotifyHealthEvent(ctx, "warning", "CPU", "usage_percent", 
            fmt.Sprintf("%.2f", cpuUsage), dashboardURL)
    }
    
    return nil
}
```

---

## Message Format

All Discord notifications follow a consistent embed format:

### Standard Embed Structure

```
┌─────────────────────────────────────┐
│ Pipeline success                    │  ← Title
│                                     │
│ Pipeline execution completed with   │  ← Description
│ status: success                     │
│                                     │
│ Pipeline ID   │ pipe-abc123        │  ← Fields (up to 25)
│ Branch        │ main               │
│ Commit        │ abc123def          │
│ Severity      │ info               │
│ Event Type    │ pipeline.success   │
│ Dashboard     │ [View Details]     │  ← Clickable link
│                                     │
│ [timestamp]                         │  ← Timestamp (ISO 8601)
└─────────────────────────────────────┘
   ↑ Color indicates severity
   Green (success), Yellow (warning), Red (critical)
```

### Color Codes

| Severity | Color | Hex Code |
|----------|-------|----------|
| Success  | Green | #00AA00  |
| Warning  | Yellow| #FFAA00  |
| Critical | Red   | #FF0000  |
| Info     | Blue  | #0099FF  |

### Timestamp Format

All notifications include ISO 8601 timestamps (UTC):
```
2026-06-02T14:30:45Z
```

---

## Testing

### 1. Manual Testing with cURL

Test the webhook before full integration:

```bash
WEBHOOK_URL="https://discord.com/api/webhooks/YOUR_ID/YOUR_TOKEN"

curl -X POST "$WEBHOOK_URL" \
  -H "Content-Type: application/json" \
  -d '{
    "content": "GITORC Test",
    "embeds": [{
      "title": "Pipeline success",
      "description": "Pipeline execution completed",
      "color": 43520,
      "fields": [
        {"name": "Pipeline ID", "value": "test-123", "inline": true},
        {"name": "Branch", "value": "main", "inline": true},
        {"name": "Severity", "value": "info", "inline": true}
      ],
      "timestamp": "2026-06-02T14:30:45Z"
    }]
  }'
```

### 2. Unit Tests

Run Discord module tests:

```bash
cd gitorcapi/internal/platform/discord
go test -v
```

### 3. Integration Tests

Test with actual services:

```bash
# Set environment variables
export DISCORD_WEBHOOK_URL="https://discord.com/api/webhooks/..."
export DISCORD_NOTIFICATIONS_ENABLED=true

# Run service
go run ./cmd/gitorc-gateway/main.go

# Trigger events (pipeline, deployment, etc.)
# Check Discord channel for messages
```

### 4. Retry Mechanism Test

The webhook sender implements exponential backoff:
- Attempt 1: Immediate
- Attempt 2: 1 second delay
- Attempt 3: 2 second delay
- Attempt 4: 4 second delay (max 3 retries total)

Test failure scenarios:
```bash
# Simulate network failure
WEBHOOK_URL="https://invalid.url/webhook" \
go test -v ./internal/platform/discord
```

### 5. Validation Checklist

- [ ] Webhook URL is valid and accessible
- [ ] Message formatting renders correctly in Discord
- [ ] Color codes display as intended
- [ ] Timestamps are accurate
- [ ] Dashboard links are clickable
- [ ] No sensitive data leaks in messages
- [ ] Retry logic works on failure
- [ ] Notifications don't block pipeline/deployment
- [ ] Multiple events queue without duplication
- [ ] Environment variable loading works

---

## Troubleshooting

### Webhook Not Sending

**Check 1: Environment Variables**
```bash
# Verify webhook URL is set
echo $DISCORD_WEBHOOK_URL

# Verify enabled flag
echo $DISCORD_NOTIFICATIONS_ENABLED
```

**Check 2: Webhook URL Validity**
```bash
# Test webhook with simple message
curl -X POST "$DISCORD_WEBHOOK_URL" \
  -H "Content-Type: application/json" \
  -d '{"content":"Test"}'
```

**Check 3: Network Connectivity**
```bash
# Test DNS resolution
nslookup discord.com

# Test HTTPS connectivity
curl -v https://discord.com/api/webhooks/{ID}/{TOKEN}
```

### Messages Not Appearing

1. **Check webhook token hasn't expired:**
   - Regenerate webhook in Discord channel settings
   - Update environment variable

2. **Check Discord channel permissions:**
   - Webhook bot should have message send permissions
   - Check Discord role/channel restrictions

3. **Check payload format:**
   - Enable debug logging
   - Verify JSON structure with validator

### Rate Limiting

Discord has rate limits (10 requests per 10 seconds per webhook).

**Mitigation:**
- Batch related events
- Space out notifications
- Consider using Discord bots for higher limits

### Logs

Enable debug output:
```bash
# Check service logs
docker logs gitorc-gateway

# Look for Discord-related messages
docker logs gitorc-gateway | grep -i discord
```

---

## Best Practices

### 1. Security

- **Never commit webhook URLs** to version control
- Use **environment variables** or secrets management
- Rotate webhook tokens **quarterly**
- Restrict webhook permissions to **send messages only**
- **Audit** who has access to webhook settings

### 2. Message Content

- Keep descriptions **concise and actionable**
- Include **relevant IDs** for tracing (pipeline, deployment, user IDs)
- Never include **passwords, tokens, or secrets**
- Use **consistent naming** across event types
- Always provide **dashboard links** for drill-down

### 3. Performance

- Use `SendAsync` for **non-blocking** operations
- Retry logic is **non-blocking by default**
- Disable notifications in **development** if not needed
- Consider **batching** high-frequency events
- Monitor **Discord API quota** usage

### 4. Notification Frequency

- **Pipeline events:** Once per pipeline completion
- **Deployment events:** Once per deployment
- **Health events:** Throttle to once per 5 minutes per metric
- **Security events:** Real-time (critical)
- **Repository events:** Once per git operation

### 5. Channel Organization

Create separate Discord channels for different event types:

```
#gitorc-alerts-critical     (security, failures)
#gitorc-alerts-info         (deployments, pipelines)
#gitorc-health              (system metrics)
#gitorc-audit               (user actions, access)
```

Use multiple webhooks (one per channel) for organization:

```bash
export DISCORD_WEBHOOK_URL_CRITICAL="..."
export DISCORD_WEBHOOK_URL_INFO="..."
export DISCORD_WEBHOOK_URL_HEALTH="..."
```

### 6. Testing in Production

1. Use **private test channel** before production
2. Test **all event types** with realistic data
3. Verify **no sensitive data** appears in messages
4. Validate **retry behavior** under load
5. Monitor **error logs** for webhook failures

---

## API Reference

### WebhookClient

```go
type WebhookClient struct {
    webhookURL string
    httpClient *http.Client
    maxRetries int
}

// Create new client
client := discord.NewWebhookClient(url, enabled)

// Send synchronously (blocks until complete or error)
err := client.Send(ctx, payload)

// Send asynchronously (non-blocking)
err := client.SendAsync(ctx, payload)

// Check if enabled
enabled := client.IsEnabled()
```

### NotificationEvent

```go
// Create typed events
event := discord.NewPipelineEvent(status, id, branch, commit, url)
event := discord.NewDeploymentEvent(status, env, service, version, url)
event := discord.NewRepositoryEvent(action, repo, details, url)
event := discord.NewSecurityEvent(kind, type, user, details, url)
event := discord.NewHealthEvent(status, component, metric, value, url)
event := discord.NewUserEvent(action, user, email, details, url)

// Convert to Discord payload
payload := event.ToPayload()
```

### Manager (Global)

```go
// Get global manager
mgr := discord.GetManager()

// Notify events
mgr.NotifyPipelineEvent(ctx, status, id, branch, commit, url)
mgr.NotifyDeploymentEvent(ctx, status, env, service, version, url)
mgr.NotifyRepositoryEvent(ctx, action, repo, details, url)
mgr.NotifySecurityEvent(ctx, kind, type, user, details, url)
mgr.NotifyHealthEvent(ctx, status, component, metric, value, url)
mgr.NotifyUserEvent(ctx, action, user, email, details, url)
mgr.NotifyCustomEvent(ctx, event)
```

---

## Support

For issues or questions:

1. Check [Troubleshooting](#troubleshooting) section
2. Review logs: `docker logs <service>`
3. Test webhook manually with cURL
4. Check Discord webhook token validity
5. Review GITORC documentation

---

## Changelog

### v1.0.0 (2026-06-02)
- Initial Discord webhook integration
- Support for 6 event categories
- Retry logic with exponential backoff
- Embed formatting with colors
- Async/non-blocking notifications
- Comprehensive testing suite

---

*Last Updated: 2026-06-02*
*GITORC Platform Documentation*
