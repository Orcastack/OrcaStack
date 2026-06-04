# Discord Integration - Implementation Guide

This guide shows how to add Discord notifications to your GITORC gateway and services with working code examples.

## Overview

The Discord integration is designed to be:
- **Non-blocking**: Async notifications don't delay user requests
- **Resilient**: Automatic retries on failure
- **Type-safe**: Strongly typed events and payloads
- **Simple**: Just import and call notification methods

## Step 1: Initialize Discord in Your Service

### In `cmd/gitorc-gateway/main.go`

```go
package main

import (
	"context"
	"log"

	"github.com/gitorc/gitorcapi/internal/gatewayapi"
	"github.com/gitorc/gitorcapi/internal/platform/app"
	"github.com/gitorc/gitorcapi/internal/platform/config"
	"github.com/gitorc/gitorcapi/internal/platform/discord"  // Add this import
)

func main() {
	// Initialize Discord notifications
	discord.Initialize()

	err := app.Run(context.Background(), app.WithServiceSecurity(app.Config{
		Name:               "gitorc-gateway",
		Role:               "api-gateway",
		Summary:            "Single entrypoint for projects, reviews, pipelines, deployments, and analytics.",
		RegisterHTTPRoutes: gatewayapi.Register,
		HTTPPort:           config.String("GITORC_GATEWAY_HTTP_PORT", "8080"),
		GRPCPort:           config.String("GITORC_GATEWAY_GRPC_PORT", "9080"),
	}, "GITORC_GATEWAY_IDENTITY", app.DefaultGatewayIdentity))
	if err != nil {
		log.Fatal(err)
	}
}
```

## Step 2: Add Discord to User Signup Handler

### Modify `internal/gatewayapi/api.go`

Add import:
```go
import "github.com/gitorc/gitorcapi/internal/platform/discord"
```

Add notification to handleSignup function:
```go
func handleSignup(w http.ResponseWriter, r *http.Request) {
	if r.Method != http.MethodPost {
		w.WriteHeader(http.StatusMethodNotAllowed)
		return
	}

	var request signupRequest
	if err := decodeJSON(r, &request); err != nil {
		writeError(w, http.StatusBadRequest, errors.New("invalid signup payload"))
		return
	}

	// Validate input
	if request.Username == "" || request.Email == "" || request.Password == "" {
		writeError(w, http.StatusBadRequest, errors.New("missing required fields"))
		return
	}

	// Create signup request record
	requestID := uuid.New().String()
	record := signupRequestRecord{
		ID:       requestID,
		Username: request.Username,
		Email:    request.Email,
		Status:   "pending",
	}

	if err := createSignupRequestRecord(r.Context(), record); err != nil {
		writeError(w, http.StatusInternalServerError, errors.New("failed to create signup request"))
		return
	}

	// Notify Discord of new signup request
	discordMgr := discord.GetManager()
	_ = discordMgr.NotifyUserEvent(r.Context(),
		"signup",
		request.Username,
		request.Email,
		fmt.Sprintf("New user registered - Request ID: %s", requestID),
		"https://gitorc.example.com/auth/signup-requests",
	)

	response := signupResponse{
		RequestID: requestID,
		Status:    "pending",
		Message:   "Signup request submitted for review",
	}

	writeJSON(w, response)
}
```

## Step 3: Add Discord to Access Request Approval

### Modify `internal/gatewayapi/signup_requests.go`

Add import:
```go
import "github.com/gitorc/gitorcapi/internal/platform/discord"
```

After the existing imports, add notification to request review:
```go
func handleSignupRequestReview(w http.ResponseWriter, r *http.Request, session sessionRecord) {
	if r.Method != http.MethodPut {
		w.WriteHeader(http.StatusMethodNotAllowed)
		return
	}

	// Extract request ID from URL
	parts := strings.Split(strings.TrimPrefix(r.URL.Path, "/api/auth/signup-requests/"), "/")
	if len(parts) == 0 || parts[0] == "" {
		writeError(w, http.StatusBadRequest, errors.New("missing request id"))
		return
	}

	requestID := parts[0]

	var decision signupDecisionRequest
	if err := decodeJSON(r, &decision); err != nil {
		writeError(w, http.StatusBadRequest, errors.New("invalid decision payload"))
		return
	}

	// Review the signup request
	record, err := reviewSignupRequestRecord(r.Context(), requestID, session.User.Username, decision)
	if err != nil {
		writeError(w, http.StatusInternalServerError, err)
		return
	}

	// Notify Discord of approval/rejection
	discordMgr := discord.GetManager()
	action := "access_request"
	if record.Status == "approved" {
		action = "access_approved"
	}

	_ = discordMgr.NotifyUserEvent(r.Context(),
		action,
		record.Username,
		record.Email,
		fmt.Sprintf("Access request %s by %s. Note: %s", record.Status, session.User.Username, decision.Note),
		"https://gitorc.example.com/auth/signup-requests/"+requestID,
	)

	writeJSON(w, record)
}
```

## Step 4: Add Discord to Auth Failure Handler

### Modify `internal/gatewayapi/auth_ldap.go`

Add import:
```go
import "github.com/gitorc/gitorcapi/internal/platform/discord"
```

Add notification to authentication failures:
```go
func authenticateLDAPUser(username, password string) (*AuthUser, error) {
	// ... existing LDAP authentication logic ...

	// If authentication fails
	if err != nil {
		// Notify Discord of auth failure
		discordMgr := discord.GetManager()
		_ = discordMgr.NotifySecurityEvent(context.Background(),
			"auth_failure",
			"Failed authentication attempt",
			username,
			fmt.Sprintf("Authentication failed: %v", err),
			"https://gitorc.example.com/security/audit",
		)
		return nil, errInvalidCredentials
	}

	// ... rest of authentication logic ...
}
```

## Step 5: Complete Example in Gateway

Here's a complete handler with Discord integration:

```go
package gatewayapi

import (
	"context"
	"errors"
	"fmt"
	"net/http"
	"strings"

	"github.com/google/uuid"
	"github.com/gitorc/gitorcapi/internal/platform/discord"
)

// handleSignupWithDiscord demonstrates full Discord integration
func handleSignupWithDiscord(w http.ResponseWriter, r *http.Request) {
	if r.Method != http.MethodPost {
		w.WriteHeader(http.StatusMethodNotAllowed)
		return
	}

	// Parse request
	var request signupRequest
	if err := decodeJSON(r, &request); err != nil {
		writeError(w, http.StatusBadRequest, errors.New("invalid request"))
		return
	}

	// Validate
	if request.Username == "" || request.Email == "" {
		writeError(w, http.StatusBadRequest, errors.New("missing fields"))
		return
	}

	// Create record
	requestID := uuid.New().String()
	record := signupRequestRecord{
		ID:       requestID,
		Username: request.Username,
		Email:    request.Email,
		Status:   "pending",
	}

	if err := createSignupRequestRecord(r.Context(), record); err != nil {
		writeError(w, http.StatusInternalServerError, err)
		return
	}

	// Get Discord manager (non-blocking)
	discordMgr := discord.GetManager()

	// Send notification asynchronously
	// This doesn't block the response
	_ = discordMgr.NotifyUserEvent(
		r.Context(),
		"signup",                                    // action
		request.Username,                             // username
		request.Email,                                // email
		fmt.Sprintf("Signup request: %s", requestID), // details
		"https://gitorc.example.com/requests/"+requestID, // dashboard URL
	)

	// Send response immediately (Discord notification is async)
	response := signupResponse{
		RequestID: requestID,
		Status:    "pending",
		Message:   "Request submitted for review",
	}
	writeJSON(w, response)
}
```

## Step 6: Testing Your Integration

### Unit Test

```go
package gatewayapi

import (
	"bytes"
	"context"
	"encoding/json"
	"net/http"
	"net/http/httptest"
	"testing"

	"github.com/gitorc/gitorcapi/internal/platform/discord"
)

func TestSignupWithDiscordNotification(t *testing.T) {
	// Setup test Discord webhook
	webhookCalled := false
	testServer := httptest.NewServer(http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		webhookCalled = true
		w.WriteHeader(http.StatusNoContent)
	}))
	defer testServer.Close()

	// Create Discord manager with test webhook
	discordMgr := discord.NewWebhookClient(testServer.URL, true)

	// Create request
	payload := discord.NewUserEvent(
		"signup",
		"testuser",
		"test@example.com",
		"Test signup",
		"https://gitorc.example.com",
	)

	// Send notification
	ctx := context.Background()
	err := discordMgr.Send(ctx, payload.ToPayload())
	if err != nil {
		t.Fatalf("Failed to send notification: %v", err)
	}

	// Verify webhook was called
	if !webhookCalled {
		t.Error("Discord webhook was not called")
	}
}

func TestSignupAPI(t *testing.T) {
	// Create signup request
	signupData := signupRequest{
		Username: "newuser",
		Email:    "new@example.com",
		Password: "secure_password",
	}

	payload, _ := json.Marshal(signupData)
	req := httptest.NewRequest("POST", "/api/auth/signup", bytes.NewReader(payload))
	w := httptest.NewRecorder()

	handleSignup(w, req)

	// Should return 200 OK
	if w.Code != http.StatusOK && w.Code != http.StatusCreated {
		t.Errorf("Expected 200/201, got %d", w.Code)
	}

	// Parse response
	var response signupResponse
	json.NewDecoder(w.Body).Decode(&response)

	if response.RequestID == "" {
		t.Error("Response missing request ID")
	}
}
```

### Integration Test

```bash
#!/bin/bash
set -e

# Configuration
export DISCORD_WEBHOOK_URL="https://discord.com/api/webhooks/YOUR_ID/YOUR_TOKEN"
export DISCORD_NOTIFICATIONS_ENABLED=true
export DISCORD_ENVIRONMENT=production

# Start service
cd /path/to/gitorc
go run ./cmd/gitorc-gateway/main.go &
SERVICE_PID=$!

# Wait for startup
sleep 2

# Test signup endpoint
curl -X POST http://localhost:8080/api/auth/signup \
  -H "Content-Type: application/json" \
  -d '{
    "username": "testuser",
    "email": "test@example.com",
    "password": "secure_pass"
  }' | jq .

# Check Discord for notification
sleep 1

# Cleanup
kill $SERVICE_PID

echo "✓ Integration test completed"
```

## Step 7: Environment Configuration

### Docker Compose

```yaml
version: '3.8'

services:
  gitorc-gateway:
    image: gitorc/gateway:latest
    ports:
      - "8080:8080"
      - "9080:9080"
    environment:
      # Discord Configuration
      - DISCORD_WEBHOOK_URL=${DISCORD_WEBHOOK_URL}
      - DISCORD_NOTIFICATIONS_ENABLED=true
      - DISCORD_ENVIRONMENT=production
      
      # Other settings
      - GITORC_GATEWAY_HTTP_PORT=8080
      - GITORC_GATEWAY_GRPC_PORT=9080
```

### Kubernetes Secrets

```yaml
apiVersion: v1
kind: Secret
metadata:
  name: discord-webhook
  namespace: gitorc
type: Opaque
stringData:
  webhook-url: https://discord.com/api/webhooks/YOUR_ID/YOUR_TOKEN
---
apiVersion: v1
kind: ConfigMap
metadata:
  name: discord-config
  namespace: gitorc
data:
  enabled: "true"
  environment: "production"
---
apiVersion: apps/v1
kind: Deployment
metadata:
  name: gitorc-gateway
spec:
  template:
    spec:
      containers:
      - name: gateway
        image: gitorc/gateway:latest
        env:
        - name: DISCORD_WEBHOOK_URL
          valueFrom:
            secretKeyRef:
              name: discord-webhook
              key: webhook-url
        - name: DISCORD_NOTIFICATIONS_ENABLED
          valueFrom:
            configMapKeyRef:
              name: discord-config
              key: enabled
        - name: DISCORD_ENVIRONMENT
          valueFrom:
            configMapKeyRef:
              name: discord-config
              key: environment
```

## Step 8: Monitoring and Logging

### Check if Discord is Enabled

```go
discordMgr := discord.GetManager()
if discordMgr.IsEnabled() {
    log.Println("Discord notifications are active")
} else {
    log.Println("Discord notifications are disabled")
}
```

### Log Notification Sends

```go
// In your handlers
_ = discordMgr.NotifyUserEvent(ctx, "signup", user, email, details, url)
// Note: Error is ignored because notification is async and non-blocking
// In production, you might want to log errors:
if err := discordMgr.NotifyUserEvent(ctx, "signup", user, email, details, url); err != nil {
    log.Printf("Discord notification failed: %v", err)
}
```

## Step 9: Custom Events

For events not covered by standard types:

```go
// Create custom event
event := &discord.NotificationEvent{
    EventType:    discord.EventType("custom.deployment"),
    Title:        "Custom Deployment Event",
    Description:  "Something custom happened",
    Severity:     discord.SeverityWarning,
    DashboardURL: "https://gitorc.example.com/custom",
    Timestamp:    time.Now(),
    Details: map[string]string{
        "CustomField1": "Value1",
        "CustomField2": "Value2",
    },
}

payload := event.ToPayload()
discordMgr.NotifyCustomEvent(ctx, event)
```

## Common Integration Points

| Component | Event Type | When to Trigger |
|-----------|-----------|-----------------|
| Auth Handler | `security.violation` | RBAC violation detected |
| Auth Handler | `auth.failure` | Authentication fails |
| Signup Handler | `user.signup` | New signup request |
| Request Reviewer | `access.approved` | Access granted |
| Signup Request | `access.request` | New request submitted |
| Pipeline Service | `pipeline.success` | Pipeline completes |
| Pipeline Service | `pipeline.failure` | Pipeline fails |
| Deployment Service | `deployment.success` | Deploy completes |
| Git Service | `merge.completed` | PR merged |
| Health Checker | `health.critical` | Alert threshold exceeded |

## Troubleshooting

### No notifications appearing?

1. Check webhook URL is valid
2. Verify `DISCORD_NOTIFICATIONS_ENABLED=true`
3. Check service logs: `docker logs gitorc-gateway | grep -i discord`
4. Test webhook manually

### Webhook URL missing?

```bash
echo $DISCORD_WEBHOOK_URL
# Should print the full webhook URL, not empty
```

### Wrong Discord channel?

Regenerate webhook from Discord channel settings and update environment variable.

---

*Last Updated: 2026-06-02*
