# Discord Integration - Quick Start Guide

## Overview

This guide shows how to quickly integrate Discord notifications into your GITORC services.

## 1. Setup (2 minutes)

### Step 1: Create Discord Webhook

1. Open your Discord server
2. Right-click target channel → Edit channel → Integrations → Webhooks
3. Click "New Webhook" → Name: "GITORC Automation"
4. Copy the webhook URL

### Step 2: Set Environment Variable

```bash
export DISCORD_WEBHOOK_URL="https://discord.com/api/webhooks/YOUR_ID/YOUR_TOKEN"
export DISCORD_NOTIFICATIONS_ENABLED=true
```

### Step 3: Verify (Optional)

```bash
curl -X POST "$DISCORD_WEBHOOK_URL" \
  -H "Content-Type: application/json" \
  -d '{"content":"GITORC Integration Test"}' \
  && echo "✓ Webhook working!"
```

---

## 2. Integration Examples

### Example 1: Notify on User Signup

In `internal/gatewayapi/signup_requests.go`, add Discord notification:

```go
import "github.com/gitorc/gitorcapi/internal/platform/discord"

// In the function that handles signup approval
func approveSignup(ctx context.Context, username, email string) error {
    // ... existing signup logic ...
    
    // Notify Discord
    discordMgr := discord.GetManager()
    _ = discordMgr.NotifyUserEvent(ctx,
        "signup",
        username,
        email,
        "New user registered",
        "https://gitorc.example.com/users",
    )
    
    return nil
}
```

### Example 2: Notify on Access Requests

In signup request handlers:

```go
func handleAccessRequest(ctx context.Context, username, resources string) error {
    discordMgr := discord.GetManager()
    
    _ = discordMgr.NotifyUserEvent(ctx,
        "access_request",
        username,
        "",
        fmt.Sprintf("Requested access to: %s", resources),
        "https://gitorc.example.com/access-requests",
    )
    
    return nil
}
```

### Example 3: Notify on Security Events

In authentication handler (auth_ldap.go or similar):

```go
func handleAuthFailure(ctx context.Context, username string) {
    discordMgr := discord.GetManager()
    
    _ = discordMgr.NotifySecurityEvent(ctx,
        "auth_failure",
        "Failed authentication attempt",
        username,
        "Multiple failed login attempts",
        "https://gitorc.example.com/security",
    )
}
```

### Example 4: Notify on Project Operations

In projects.go:

```go
func (p *Project) OnRepositoryCreated(ctx context.Context) error {
    discordMgr := discord.GetManager()
    
    _ = discordMgr.NotifyRepositoryEvent(ctx,
        "created",
        p.Name,
        fmt.Sprintf("New project: %s", p.Name),
        fmt.Sprintf("https://gitorc.example.com/projects/%s", p.ID),
    )
    
    return nil
}
```

---

## 3. Service Integration (Detailed)

### For CI Service (gitorc-ci-service)

Add to main pipeline execution handler:

```go
package main

import "github.com/gitorc/gitorcapi/internal/platform/discord"

type CIPipeline struct {
    ID     string
    Branch string
    Status string
}

func (cp *CIPipeline) Execute(ctx context.Context) error {
    mgr := discord.GetManager()
    
    // Notify start
    mgr.NotifyPipelineEvent(ctx,
        "start",
        cp.ID,
        cp.Branch,
        "", // commit will be set during execution
        fmt.Sprintf("https://gitorc.example.com/pipelines/%s", cp.ID),
    )
    
    // ... run pipeline ...
    
    if err != nil {
        mgr.NotifyPipelineEvent(ctx,
            "failure",
            cp.ID,
            cp.Branch,
            cp.Status,
            fmt.Sprintf("https://gitorc.example.com/pipelines/%s", cp.ID),
        )
        return err
    }
    
    mgr.NotifyPipelineEvent(ctx,
        "success",
        cp.ID,
        cp.Branch,
        cp.Status,
        fmt.Sprintf("https://gitorc.example.com/pipelines/%s", cp.ID),
    )
    
    return nil
}
```

### For CD Service (gitorc-cd-service)

Add to deployment handler:

```go
package main

import "github.com/gitorc/gitorcapi/internal/platform/discord"

type Deployment struct {
    Service     string
    Environment string
    Version     string
}

func (d *Deployment) Deploy(ctx context.Context) error {
    mgr := discord.GetManager()
    
    // Notify start
    mgr.NotifyDeploymentEvent(ctx,
        "start",
        d.Environment,
        d.Service,
        d.Version,
        "https://gitorc.example.com/deployments",
    )
    
    // ... perform deployment ...
    
    if err != nil {
        mgr.NotifyDeploymentEvent(ctx,
            "failure",
            d.Environment,
            d.Service,
            d.Version,
            "https://gitorc.example.com/deployments",
        )
        return err
    }
    
    mgr.NotifyDeploymentEvent(ctx,
        "success",
        d.Environment,
        d.Service,
        d.Version,
        "https://gitorc.example.com/deployments",
    )
    
    return nil
}
```

### For Analytics Service (gitorc-analytics-service)

Add to health check handler:

```go
package main

import (
    "fmt"
    "github.com/gitorc/gitorcapi/internal/platform/discord"
)

type HealthMonitor struct{}

func (hm *HealthMonitor) CheckSystemHealth(ctx context.Context) error {
    mgr := discord.GetManager()
    
    // Check CPU
    cpuUsage := getSystemCPUUsage()
    if cpuUsage > 80 {
        mgr.NotifyHealthEvent(ctx,
            "warning",
            "CPU",
            "usage_percent",
            fmt.Sprintf("%.2f%%", cpuUsage),
            "https://gitorc.example.com/health",
        )
    }
    
    // Check Memory
    memUsage := getSystemMemoryUsage()
    if memUsage > 90 {
        mgr.NotifyHealthEvent(ctx,
            "critical",
            "Memory",
            "usage_percent",
            fmt.Sprintf("%.2f%%", memUsage),
            "https://gitorc.example.com/health",
        )
    }
    
    return nil
}
```

---

## 4. Testing Your Integration

### Unit Test Example

```go
package gatewayapi

import (
    "context"
    "testing"
    "github.com/gitorc/gitorcapi/internal/platform/discord"
)

func TestDiscordNotificationOnSignup(t *testing.T) {
    // Create manager
    mgr := discord.NewManager()
    
    // Send test notification
    event := discord.NewUserEvent(
        "signup",
        "testuser",
        "test@example.com",
        "Test signup notification",
        "https://gitorc.example.com/users",
    )
    
    payload := event.ToPayload()
    
    // Verify payload structure
    if len(payload.Embeds) != 1 {
        t.Fatalf("Expected 1 embed, got %d", len(payload.Embeds))
    }
    
    embed := payload.Embeds[0]
    if embed.Title != "User Event: signup" {
        t.Errorf("Unexpected title: %s", embed.Title)
    }
}
```

### Integration Test

```bash
#!/bin/bash
set -e

# Set webhook URL
export DISCORD_WEBHOOK_URL="https://discord.com/api/webhooks/YOUR_ID/YOUR_TOKEN"
export DISCORD_NOTIFICATIONS_ENABLED=true

# Run service
go run ./cmd/gitorc-gateway/main.go &
SERVICE_PID=$!

# Wait for service to start
sleep 2

# Trigger test events (e.g., signup)
curl -X POST http://localhost:8080/api/signup \
  -H "Content-Type: application/json" \
  -d '{
    "username": "testuser",
    "email": "test@example.com",
    "password": "secure_password"
  }'

# Wait for notification
sleep 1

# Kill service
kill $SERVICE_PID

echo "✓ Integration test completed"
```

---

## 5. Verification Checklist

Before deploying to production:

- [ ] Webhook URL is set in environment variables
- [ ] `DISCORD_NOTIFICATIONS_ENABLED=true`
- [ ] Test message appears in Discord channel
- [ ] Message formatting looks correct
- [ ] Timestamps are accurate
- [ ] Dashboard links are clickable
- [ ] No sensitive data in messages
- [ ] Async notifications don't block requests
- [ ] All event types trigger correctly
- [ ] Retry logic works (test with invalid URL)
- [ ] No errors in service logs

---

## 6. Troubleshooting

### Messages not appearing?

1. Check webhook URL: `curl -X POST "$DISCORD_WEBHOOK_URL" -d '{"content":"test"}'`
2. Check enabled flag: `echo $DISCORD_NOTIFICATIONS_ENABLED`
3. Check service logs: `docker logs gitorc-gateway | grep -i discord`
4. Verify Discord channel permissions for webhook bot

### Wrong channel?

1. Double-check webhook URL (copy from Discord settings)
2. Verify webhook wasn't moved to different channel
3. Regenerate webhook if needed

### Formatting issues?

1. Check JSON structure with curl test
2. Verify color codes are valid hex values
3. Check embed field counts (max 25 fields)

---

## 7. Configuration in Different Environments

### Docker Compose

```yaml
services:
  gitorc-gateway:
    environment:
      - DISCORD_WEBHOOK_URL=${DISCORD_WEBHOOK_URL}
      - DISCORD_NOTIFICATIONS_ENABLED=true
      - DISCORD_ENVIRONMENT=production
```

### Kubernetes

```yaml
apiVersion: v1
kind: Secret
metadata:
  name: discord-webhook
type: Opaque
stringData:
  webhook-url: https://discord.com/api/webhooks/...

---
apiVersion: v1
kind: ConfigMap
metadata:
  name: discord-config
data:
  enabled: "true"
  environment: "production"
```

### Systemd Service

```ini
[Service]
Environment="DISCORD_WEBHOOK_URL=https://discord.com/api/webhooks/..."
Environment="DISCORD_NOTIFICATIONS_ENABLED=true"
```

---

## 8. Next Steps

1. **Review** the full [Discord Integration Guide](./discord.md)
2. **Implement** in your services
3. **Test** with webhook and unit tests
4. **Monitor** Discord channel for events
5. **Iterate** based on team feedback

---

## Support

- Full documentation: `/docs/integrations/discord.md`
- Example code: `/gitorcapi/internal/platform/discord/integration_examples.go`
- Unit tests: `/gitorcapi/internal/platform/discord/webhook_test.go`
- Configuration template: `/docs/integrations/.env.discord.template`

---

*Last Updated: 2026-06-02*
