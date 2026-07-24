# Slack Integration Setup Guide

This guide shows **exactly where** to add your Slack App credentials in the ORCASTACK platform for automated notifications.

## Table of Contents
1. [Get Your Slack Credentials](#get-your-slack-credentials)
2. [Configuration Locations](#configuration-locations)
3. [Environment Variables](#environment-variables)
4. [Code Integration Points](#code-integration-points)
5. [Testing Your Setup](#testing-your-setup)
6. [Troubleshooting](#troubleshooting)

---

## Get Your Slack Credentials

Before adding credentials to ORCASTACK, you need 5 values from your Slack App:

### Required Credentials:
1. **Bot Token** - Starts with `xoxb-`
2. **Signing Secret** - Used for webhook verification
3. **Client ID** - OAuth application ID
4. **Client Secret** - OAuth application secret
5. **App ID** - Unique Slack app identifier

### Where to Find Them:

1. Go to [api.slack.com/apps](https://api.slack.com/apps)
2. Select your ORCASTACK app
3. Navigate to these sections:
   - **Bot Token**: `OAuth & Permissions` → `Bot User OAuth Token` (xoxb-...)
   - **Signing Secret**: `Basic Information` → `Signing Secret`
   - **Client ID**: `Basic Information` → `App Credentials` → `Client ID`
   - **Client Secret**: `Basic Information` → `App Credentials` → `Client Secret`
   - **App ID**: `Basic Information` → `App ID`

---

## Configuration Locations

You can add Slack credentials in three ways:

### Option 1: Environment Variables (Recommended for Production)
### Option 2: Docker Environment
### Option 3: Kubernetes Secrets

---

## Environment Variables

### Variable Names:
```
SLACK_BOT_TOKEN=xoxb-your-bot-token-here
SLACK_SIGNING_SECRET=your-signing-secret-here
SLACK_CLIENT_ID=your-client-id-here
SLACK_CLIENT_SECRET=your-client-secret-here
SLACK_NOTIFICATIONS_ENABLED=true
```

### Option 1A: System Environment Variables

**On Linux/macOS:**
```bash
# Edit /etc/environment or ~/.bashrc
export SLACK_BOT_TOKEN=xoxb-your-bot-token-here
export SLACK_SIGNING_SECRET=your-signing-secret-here
export SLACK_CLIENT_ID=your-client-id-here
export SLACK_CLIENT_SECRET=your-client-secret-here
export SLACK_NOTIFICATIONS_ENABLED=true
```

Then reload:
```bash
source ~/.bashrc  # or source /etc/environment
```

---

### Option 1B: Docker Environment File

Create `.env.slack` file in your project root:

```bash
# File: .env.slack
SLACK_BOT_TOKEN=xoxb-your-bot-token-here
SLACK_SIGNING_SECRET=your-signing-secret-here
SLACK_CLIENT_ID=your-client-id-here
SLACK_CLIENT_SECRET=your-client-secret-here
SLACK_NOTIFICATIONS_ENABLED=true
DISCORD_WEBHOOK_URL=
DISCORD_NOTIFICATIONS_ENABLED=false
```

Then use with Docker:
```bash
docker-compose --env-file .env.slack up
```

Or add to `docker-compose.yml`:
```yaml
services:
  orcastack:
    image: orcastack:latest
    env_file:
      - .env.slack
    environment:
      SLACK_BOT_TOKEN: ${SLACK_BOT_TOKEN}
      SLACK_SIGNING_SECRET: ${SLACK_SIGNING_SECRET}
      SLACK_CLIENT_ID: ${SLACK_CLIENT_ID}
      SLACK_CLIENT_SECRET: ${SLACK_CLIENT_SECRET}
      SLACK_NOTIFICATIONS_ENABLED: ${SLACK_NOTIFICATIONS_ENABLED}
```

---

### Option 1C: Docker Compose Environment Section

Edit `docker-compose.yml` directly:

```yaml
version: '3.8'

services:
  orcastack-gateway:
    image: orcastack/gateway:latest
    container_name: orcastack-gateway
    ports:
      - "8080:8080"
    environment:
      # Slack Configuration
      SLACK_BOT_TOKEN: "xoxb-your-bot-token-here"
      SLACK_SIGNING_SECRET: "your-signing-secret-here"
      SLACK_CLIENT_ID: "your-client-id-here"
      SLACK_CLIENT_SECRET: "your-client-secret-here"
      SLACK_NOTIFICATIONS_ENABLED: "true"
      
      # Discord Configuration (optional)
      DISCORD_WEBHOOK_URL: ""
      DISCORD_NOTIFICATIONS_ENABLED: "false"
    networks:
      - orcastack-network

networks:
  orcastack-network:
    driver: bridge
```

---

### Option 2: Kubernetes Secrets

Create a Kubernetes Secret for Slack credentials:

```bash
# Create the secret
kubectl create secret generic orcastack-slack-credentials \
  --from-literal=SLACK_BOT_TOKEN=xoxb-your-bot-token-here \
  --from-literal=SLACK_SIGNING_SECRET=your-signing-secret-here \
  --from-literal=SLACK_CLIENT_ID=your-client-id-here \
  --from-literal=SLACK_CLIENT_SECRET=your-client-secret-here \
  --from-literal=SLACK_NOTIFICATIONS_ENABLED=true \
  -n orcastack
```

Or create `slack-secret.yaml`:

```yaml
apiVersion: v1
kind: Secret
metadata:
  name: orcastack-slack-credentials
  namespace: orcastack
type: Opaque
data:
  SLACK_BOT_TOKEN: eG94Yi15b3VyLWJvdC10b2tlbi1oZXJl  # base64 encoded
  SLACK_SIGNING_SECRET: eW91ci1zaWduaW5nLXNlY3JldC1oZXJl  # base64 encoded
  SLACK_CLIENT_ID: eW91ci1jbGllbnQtaWQtaGVyZQ==  # base64 encoded
  SLACK_CLIENT_SECRET: eW91ci1jbGllbnQtc2VjcmV0LWhlcmU=  # base64 encoded
  SLACK_NOTIFICATIONS_ENABLED: dHJ1ZQ==  # base64 encoded "true"
```

Apply it:
```bash
kubectl apply -f slack-secret.yaml
```

Then reference in deployment:

```yaml
apiVersion: apps/v1
kind: Deployment
metadata:
  name: orcastack-gateway
  namespace: orcastack
spec:
  template:
    spec:
      containers:
      - name: gateway
        image: orcastack/gateway:latest
        envFrom:
        - secretRef:
            name: orcastack-slack-credentials
        ports:
        - containerPort: 8080
```

---

## Code Integration Points

### Location 1: Gateway Main Entry Point

**File**: `orcastackapi/cmd/orcastack-gateway/main.go`

Add this to initialize the Slack manager:

```go
package main

import (
	"github.com/orcastack/orcastackapi/internal/platform/slack"
	// ... other imports
)

func main() {
	// ... existing code ...
	
	// Initialize Slack notification manager
	if err := slack.Initialize(); err != nil {
		log.Printf("[Slack] Warning: Failed to initialize: %v", err)
		// Continue anyway - notifications disabled gracefully
	}
	
	// ... rest of startup code ...
}
```

**Exact line placement**: After database initialization, before HTTP server setup.

---

### Location 2: Gateway API Routes

**File**: `orcastackapi/internal/gatewayapi/api.go`

Add to the `Register()` function to set up OAuth and event handlers:

```go
package gatewayapi

import (
	"github.com/orcastack/orcastackapi/internal/platform/slack"
	// ... other imports
)

func (a *API) Register() {
	// ... existing routes ...
	
	// Slack Integration Handlers
	slackMgr := slack.GetManager()
	if slackMgr != nil {
		// OAuth flow endpoints
		a.router.HandleFunc("/api/integrations/slack/install", 
			slack.NewOAuthHandler().HandleInstall).Methods("GET")
		a.router.HandleFunc("/api/integrations/slack/oauth/callback", 
			slack.NewOAuthHandler().HandleCallback).Methods("GET")
		
		// Event handler (for Slack sending us events/messages)
		a.router.HandleFunc("/api/integrations/slack/events", 
			slack.NewEventHandler(slackMgr).Handle).Methods("POST")
		
		// Slash command handler
		a.router.HandleFunc("/api/integrations/slack/commands", 
			slack.NewSlashCommandHandler(slackMgr).Handle).Methods("POST")
	}
	
	// ... rest of routes ...
}
```

**Exact placement**: In the `Register()` function, after other integration routes.

---

### Location 3: Use in Your Services

Once initialized, send notifications from anywhere:

#### Pipeline Events:
```go
// File: internal/services/pipeline/pipeline.go

import "github.com/orcastack/orcastackapi/internal/platform/slack"

func (s *PipelineService) NotifyPipelineCompletion(pipelineID string, status string) {
	slackMgr := slack.GetManager()
	if slackMgr == nil {
		return
	}
	
	event := slack.NewPipelineEvent(
		status,                    // "success", "failure", "running"
		"my-project",              // project name
		pipelineID,                // pipeline ID
		"#devops",                 // channel
		"https://orcastack.example.com/pipelines/" + pipelineID,
	)
	
	slackMgr.NotifyPipelineEvent(event)
}
```

#### Deployment Events:
```go
// File: internal/services/deployment/deployment.go

import "github.com/orcastack/orcastackapi/internal/platform/slack"

func (s *DeploymentService) NotifyDeployment(status string) {
	slackMgr := slack.GetManager()
	if slackMgr == nil {
		return
	}
	
	event := slack.NewDeploymentEvent(
		status,                    // "success", "failure"
		"production",              // environment
		"api-service",             // service name
		"v1.2.3",                  // version
		"#deployments",            // channel
		"https://orcastack.example.com/deployments",
	)
	
	slackMgr.NotifyDeploymentEvent(event)
}
```

#### Security Events:
```go
// File: internal/services/security/security.go

import "github.com/orcastack/orcastackapi/internal/platform/slack"

func (s *SecurityService) NotifySecurityAlert(alertType string) {
	slackMgr := slack.GetManager()
	if slackMgr == nil {
		return
	}
	
	event := slack.NewSecurityEvent(
		alertType,                 // "violation", "intrusion", "compliance"
		"RBAC",                    // category
		"user123",                 // user ID
		"Unauthorized access attempt detected",  // description
		"#security",               // channel
		"https://orcastack.example.com/security",
	)
	
	slackMgr.NotifySecurityEvent(event)
}
```

---

## Testing Your Setup

### Step 1: Verify Environment Variables

```bash
# Check if variables are set
env | grep SLACK_

# Should output:
# SLACK_BOT_TOKEN=xoxb-...
# SLACK_SIGNING_SECRET=...
# SLACK_CLIENT_ID=...
# SLACK_CLIENT_SECRET=...
# SLACK_NOTIFICATIONS_ENABLED=true
```

### Step 2: Test with Docker

```bash
# Build and run with your credentials
docker-compose --env-file .env.slack up orcastack-gateway

# Check logs for initialization
docker logs orcastack-gateway | grep -i slack

# Should show:
# [Slack] Initializing notification manager
# [Slack] Notifications enabled
```

### Step 3: Test OAuth Flow

```bash
# Visit the OAuth install endpoint
curl http://localhost:8080/api/integrations/slack/install

# This redirects to Slack OAuth consent screen
# After authorization, you'll be redirected to callback with code
```

### Step 4: Test Event Receiving

```bash
# In Slack App settings, set up Event Subscriptions
# URL: https://your-orcastack-domain/api/integrations/slack/events

# Send a test event
curl -X POST http://localhost:8080/api/integrations/slack/events \
  -H "Content-Type: application/json" \
  -H "X-Slack-Request-Timestamp: $(date +%s)" \
  -d '{"type":"url_verification","challenge":"test123"}'

# Should respond with 200 OK
```

### Step 5: Test Sending Messages

Use the Go test command:

```bash
cd /Users/ofidohubvm/orcastack/orcastackapi

# Run Slack tests (13 should pass, 1 expected failure without real token)
go test -v ./internal/platform/slack/...

# Expected output:
# TestNotifierClientDisabled: PASS
# TestEventVerifierValidSignature: PASS
# TestNotificationEventToPipelineMessage: PASS
# ... 10 more tests ...
# TestNotifierClientSend: FAIL (expected - needs real token)
```

---

## Troubleshooting

### Issue: "invalid_auth" error when sending messages

**Cause**: Bot token is invalid, expired, or missing `chat:write` scope

**Solution**:
1. Verify token format starts with `xoxb-`
2. Check token hasn't been revoked in Slack App settings
3. Verify bot has `chat:write` permission in OAuth scopes
4. Regenerate token in Slack App settings

### Issue: "request_timeout_exceeded" errors

**Cause**: Slack API is slow or network issue

**Solution**: Built-in retry logic handles this (3 attempts with exponential backoff). Check:
1. Network connectivity to `slack.com`
2. Firewall rules allow HTTPS to Slack
3. Check `SLACK_NOTIFICATIONS_ENABLED=true`

### Issue: Slash commands not responding

**Cause**: Slack not configured to send requests to your endpoint

**Solution**:
1. In Slack App → Interactivity & Shortcuts → Request URL
2. Set to: `https://your-orcastack-domain/api/integrations/slack/commands`
3. Slack will send a verification challenge - your endpoint must respond with it

### Issue: Events not being received

**Cause**: Event subscription endpoint not configured or signature verification failing

**Solution**:
1. Verify Event Subscriptions URL: `https://your-orcastack-domain/api/integrations/slack/events`
2. Confirm signing secret is exactly correct (copy/paste from Slack, no spaces)
3. Check server logs for signature mismatch errors
4. Ensure endpoint is publicly accessible (not localhost for Slack)

### Issue: OAuth callback fails

**Cause**: Client ID, Secret, or Redirect URL mismatch

**Solution**:
1. Verify Client ID matches in code and Slack App settings
2. Verify Client Secret is correct (never expires, but can be regenerated)
3. Ensure Redirect URL in code matches exactly in Slack App settings:
   - Should be: `https://your-orcastack-domain/api/integrations/slack/oauth/callback`
4. Authorized Redirect URLs in Slack App settings must include this exact URL

### Issue: "command not found" when running Slack notifications

**Cause**: Slack manager not initialized or nil

**Solution**:
1. Ensure `slack.Initialize()` is called in `main.go`
2. Check `SLACK_NOTIFICATIONS_ENABLED` is set to `true`
3. Verify bot token is valid
4. Use defensive check:
```go
slackMgr := slack.GetManager()
if slackMgr == nil {
    log.Println("Slack notifications not available")
    return
}
```

---

## Production Deployment Checklist

- [ ] All 5 Slack credentials obtained and verified
- [ ] Environment variables set in deployment environment
- [ ] `slack.Initialize()` called in main.go
- [ ] Event handlers registered in gateway API
- [ ] OAuth handlers registered in gateway API
- [ ] Slack App settings updated:
  - [ ] OAuth Redirect URL configured
  - [ ] Event Subscriptions URL configured
  - [ ] Slash commands registered (if using them)
  - [ ] Required scopes enabled: `chat:write`, `commands`, `app_mentions:read`
- [ ] Tests passing (13/14 expected)
- [ ] Integration code added to your services
- [ ] Notifications tested in staging before production
- [ ] Monitoring set up for notification failures
- [ ] Documentation updated for your team

---

## Quick Reference

| Item | Value | Where It Goes |
|------|-------|---------------|
| Bot Token | `xoxb-...` | `SLACK_BOT_TOKEN` env var |
| Signing Secret | 32 hex chars | `SLACK_SIGNING_SECRET` env var |
| Client ID | Numbers and letters | `SLACK_CLIENT_ID` env var |
| Client Secret | 32+ chars | `SLACK_CLIENT_SECRET` env var |
| Initialize | Call `slack.Initialize()` | `cmd/orcastack-gateway/main.go` |
| Event Handler | `/api/integrations/slack/events` | `internal/gatewayapi/api.go` |
| OAuth Callback | `/api/integrations/slack/oauth/callback` | `internal/gatewayapi/api.go` |
| Send Message | `slackMgr.NotifyPipelineEvent(event)` | Your service code |

---

## Next Steps

1. Gather your 5 Slack credentials
2. Choose your configuration method (env vars, Docker, or K8s)
3. Add credentials using the exact file paths shown above
4. Integrate initialization into `main.go`
5. Add handlers to `gatewayapi/api.go`
6. Add notification calls to your services
7. Run tests to verify
8. Deploy to staging and test end-to-end
