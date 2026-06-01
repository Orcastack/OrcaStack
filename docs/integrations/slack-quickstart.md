# Slack Integration - Quick Implementation Guide

This guide shows how to quickly integrate Slack notifications into your GITORC services.

## Table of Contents
1. [Prerequisites](#prerequisites)
2. [Step 1: Gather Slack Credentials](#step-1-gather-slack-credentials)
3. [Step 2: Set Environment Variables](#step-2-set-environment-variables)
4. [Step 3: Initialize Slack Manager](#step-3-initialize-slack-manager)
5. [Step 4: Register Event Handlers](#step-4-register-event-handlers)
6. [Step 5: Add Notifications to Services](#step-5-add-notifications-to-services)
7. [Step 6: Test](#step-6-test)

---

## Prerequisites

- Slack workspace with admin access
- Created a Slack App for GITORC (https://api.slack.com/apps)
- GITORC gateway service running
- Basic understanding of Go environment variables

---

## Step 1: Gather Slack Credentials

From your Slack App dashboard (https://api.slack.com/apps):

1. **Bot Token**:
   - Go to `OAuth & Permissions`
   - Copy the `Bot User OAuth Token` (starts with `xoxb-`)

2. **Signing Secret**:
   - Go to `Basic Information`
   - Copy the `Signing Secret`

3. **Client ID**:
   - Go to `Basic Information` → `App Credentials`
   - Copy the `Client ID`

4. **Client Secret**:
   - Go to `Basic Information` → `App Credentials`
   - Copy the `Client Secret`

5. **App ID**:
   - Go to `Basic Information`
   - Note the `App ID`

---

## Step 2: Set Environment Variables

### Option A: Docker Compose

## Edit your `.env` file or `docker-compose.yml`:

```bash
SLACK_BOT_TOKEN=xoxb-... # replace with your Slack bot token
SLACK_SIGNING_SECRET=... # replace with your signing secret
SLACK_CLIENT_ID=... # replace with your client ID
SLACK_CLIENT_SECRET=... # replace with your client secret
SLACK_NOTIFICATIONS_ENABLED=true
```

### Option B: Kubernetes

```bash
kubectl create secret generic gitorc-slack-credentials \
  --from-literal=SLACK_BOT_TOKEN=xoxb-... \
  --from-literal=SLACK_SIGNING_SECRET=... \
  --from-literal=SLACK_CLIENT_ID=... \
  --from-literal=SLACK_CLIENT_SECRET=... \
  --from-literal=SLACK_NOTIFICATIONS_ENABLED=true
```

### Option C: System Environment

```bash
export SLACK_BOT_TOKEN=xoxb-...
export SLACK_SIGNING_SECRET=...
export SLACK_CLIENT_ID=...
export SLACK_CLIENT_SECRET=...
export SLACK_NOTIFICATIONS_ENABLED=true
```

---

## Step 3: Initialize Slack Manager

Add to `gitorcapi/cmd/gitorc-gateway/main.go`:

```go
package main

import (
	"log"
	"github.com/gitorc/gitorcapi/internal/platform/slack"
	// ... other imports
)

func main() {
	// ... existing initialization ...
	
	// Initialize Slack notification manager
	if err := slack.Initialize(); err != nil {
		log.Printf("[Slack] Warning: Failed to initialize: %v", err)
		// Continues with notifications disabled gracefully
	}
	
	// ... rest of your startup code ...
}
```

---

## Step 4: Register Event Handlers

Add to `gitorcapi/internal/gatewayapi/api.go` in the `Register()` function:

```go
package gatewayapi

import (
	"github.com/gitorc/gitorcapi/internal/platform/slack"
	// ... other imports
)

func (a *API) Register() {
	// ... existing routes ...
	
	// Register Slack integration handlers
	slackMgr := slack.GetManager()
	if slackMgr != nil {
		// OAuth endpoints
		a.router.HandleFunc("/api/integrations/slack/install",
			slack.NewOAuthHandler().HandleInstall).Methods("GET")
		a.router.HandleFunc("/api/integrations/slack/oauth/callback",
			slack.NewOAuthHandler().HandleCallback).Methods("GET")
		
		// Event handler (Slack events → GITORC)
		a.router.HandleFunc("/api/integrations/slack/events",
			slack.NewEventHandler(slackMgr).Handle).Methods("POST")
		
		// Slash command handler
		a.router.HandleFunc("/api/integrations/slack/commands",
			slack.NewSlashCommandHandler(slackMgr).Handle).Methods("POST")
	}
	
	// ... rest of your routes ...
}
```

---

## Step 5: Add Notifications to Services

### Example 1: Pipeline Service

In `internal/services/pipeline/pipeline.go`:

```go
package pipeline

import (
	"github.com/gitorc/gitorcapi/internal/platform/slack"
	// ... other imports
)

type PipelineService struct {
	// ... existing fields ...
}

func (s *PipelineService) CompletePipeline(pipelineID string, status string) error {
	// ... existing pipeline completion logic ...
	
	// Send Slack notification
	slackMgr := slack.GetManager()
	if slackMgr != nil {
		event := slack.NewPipelineEvent(
			status,                 // "success", "failure", "running"
			"my-project",           // project name
			pipelineID,             // pipeline ID
			"#devops",              // channel
			"https://gitorc.example.com/pipelines/" + pipelineID,
		)
		slackMgr.NotifyPipelineEvent(event)
	}
	
	return nil
}
```

### Example 2: Deployment Service

In `internal/services/deployment/deployment.go`:

```go
package deployment

import (
	"github.com/gitorc/gitorcapi/internal/platform/slack"
	// ... other imports
)

func (s *DeploymentService) Deploy(env string, service string, version string) error {
	// ... deployment logic ...
	
	// Send deployment notification
	slackMgr := slack.GetManager()
	if slackMgr != nil {
		event := slack.NewDeploymentEvent(
			"success",              // "success" or "failure"
			env,                    // "production", "staging", etc.
			service,                // service name
			version,                // version tag
			"#deployments",         // channel
			"https://gitorc.example.com/deployments",
		)
		slackMgr.NotifyDeploymentEvent(event)
	}
	
	return nil
}
```

### Example 3: Security Service

In `internal/services/security/security.go`:

```go
package security

import (
	"github.com/gitorc/gitorcapi/internal/platform/slack"
	// ... other imports
)

func (s *SecurityService) DetectViolation(userID string, action string) {
	// ... security check logic ...
	
	// Send security alert
	slackMgr := slack.GetManager()
	if slackMgr != nil {
		event := slack.NewSecurityEvent(
			"violation",                            // event type
			"RBAC",                                 // category
			userID,                                 // user ID
			"Unauthorized " + action + " attempt",  // description
			"#security",                            // channel
			"https://gitorc.example.com/security",
		)
		slackMgr.NotifySecurityEvent(event)
	}
}
```

### Example 4: Custom Notifications

Send any custom message:

```go
import "github.com/gitorc/gitorcapi/internal/platform/slack"

slackMgr := slack.GetManager()
if slackMgr != nil {
	event := slack.NewCustomEvent(
		"Custom Alert",                    // title
		"Something important happened",    // description
		slack.SeverityWarning,             // severity: Info, Warning, Critical
		"#alerts",                         // channel
		map[string]string{
			"Status": "Active",
			"Count": "5",
		},
		"https://gitorc.example.com/alerts",
	)
	slackMgr.NotifyCustomEvent(event)
}
```

---

## Step 6: Test

### Unit Tests

```bash
cd /Users/ofidohubvm/gitorc/gitorcapi

# Run Slack tests (13 should pass)
go test -v ./internal/platform/slack/...

# Expected output:
# === RUN   TestNotifierClientDisabled
# --- PASS: TestNotifierClientDisabled (0.00s)
# === RUN   TestEventVerifierValidSignature
# --- PASS: TestEventVerifierValidSignature (0.00s)
# ... 11 more PASS ...
# PASS    github.com/gitorc/gitorcapi/internal/platform/slack
```

### Integration Test

1. **Start GITORC with Slack enabled**:
```bash
docker-compose --env-file .env.slack up gitorc-gateway
```

2. **Verify initialization**:
```bash
docker logs gitorc-gateway | grep -i slack

# Should show:
# [Slack] Initializing notification manager
# [Slack] Notifications enabled
```

3. **Send a test pipeline event**:
```bash
# In your code or via direct call:
slackMgr := slack.GetManager()
event := slack.NewPipelineEvent("success", "test-project", "pipeline-123", "#test", "https://gitorc.example.com")
slackMgr.NotifyPipelineEvent(event)

# Should see message appear in your #test Slack channel
```

4. **Verify in Slack**:
   - Open your Slack workspace
   - Go to the #test channel
   - You should see:
     - Header: "Pipeline success"
     - Project: test-project
     - Pipeline ID: pipeline-123
     - Link to GITORC

---

## Verification Checklist

- [ ] All 5 Slack credentials obtained
- [ ] Environment variables set
- [ ] `slack.Initialize()` called in main.go
- [ ] Handlers registered in api.go
- [ ] Tests passing (13/14)
- [ ] Service integration code added
- [ ] Test message received in Slack
- [ ] Message formatting looks correct
- [ ] Multiple services sending notifications
- [ ] Ready for production deployment

---

## Troubleshooting

| Problem | Solution |
|---------|----------|
| "invalid_auth" error | Verify bot token is correct (xoxb-...) and hasn't been revoked |
| No messages appearing | Check SLACK_NOTIFICATIONS_ENABLED=true and channel is correct |
| Event handler not responding | Verify endpoint URL in Slack App settings matches your server |
| OAuth flow failing | Check Client ID, Secret, and Redirect URL match Slack App settings |
| Timeout errors | Built-in retry (3 attempts) handles temporary network issues |

---

## Next Steps

1. Follow Steps 1-6 above
2. Test with sample notifications
3. Deploy to staging
4. Run end-to-end tests with real Slack workspace
5. Deploy to production
6. Monitor notification delivery

For detailed setup including all configuration options, see [slack-setup.md](slack-setup.md).
