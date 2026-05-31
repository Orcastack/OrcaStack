package gatewayapi

import (
	"crypto/rand"
	"encoding/hex"
	"encoding/json"
	"errors"
	"net/http"
	"strings"
	"sync"
	"time"
)

const authSessionTTL = 12 * time.Hour

type AuthUser struct {
	Username    string   `json:"username"`
	FullName    string   `json:"full_name"`
	Email       string   `json:"email"`
	Role        string   `json:"role"`
	Identity    string   `json:"identity"`
	RBACRealm   string   `json:"rbac_realm"`
	Permissions []string `json:"permissions"`
}

type AuthSession struct {
	Token     string   `json:"token,omitempty"`
	User      AuthUser `json:"user"`
	ExpiresAt string   `json:"expires_at"`
}

type loginRequest struct {
	Username string `json:"username"`
	Password string `json:"password"`
}

type signupRequest struct {
	Username string `json:"username"`
	Email    string `json:"email"`
	Password string `json:"password"`
}

type signupResponse struct {
	RequestID string `json:"request_id"`
	Status    string `json:"status"`
	Message   string `json:"message"`
}

var authSessions = struct {
	sync.RWMutex
	store map[string]sessionRecord
}{store: make(map[string]sessionRecord)}

type sessionRecord struct {
	User      AuthUser
	ExpiresAt time.Time
}

type Provider struct {
	ID        string `json:"id"`
	Name      string `json:"name"`
	Status    string `json:"status"`
	Repos     int    `json:"repos"`
	Latency   string `json:"latency"`
	Identity  string `json:"identity"`
	Connected bool   `json:"connected"`
}

type SecurityState struct {
	LDAPRegistered    bool `json:"ldap_registered"`
	RBACVerified      bool `json:"rbac_verified"`
	AttestationSigned bool `json:"attestation_signed"`
	Verified          bool `json:"verified"`
}

type Repository struct {
	ID            string        `json:"id"`
	ProviderID    string        `json:"provider_id"`
	Name          string        `json:"name"`
	Branch        string        `json:"branch"`
	DefaultBranch string        `json:"default_branch"`
	Commit        string        `json:"commit"`
	LastCommitAt  string        `json:"last_commit_at"`
	Reviewer      string        `json:"reviewer"`
	Summary       string        `json:"summary"`
	CloneURL      string        `json:"clone_url"`
	Identity      string        `json:"identity"`
	Security      SecurityState `json:"security"`
}

type CloneOperation struct {
	RepositoryID string `json:"repository_id"`
	Status       string `json:"status"`
	CloneURL     string `json:"clone_url"`
	Command      string `json:"command"`
	UPI          string `json:"upi"`
	UpdatedAt    string `json:"updated_at"`
}

type Review struct {
	ID                string   `json:"id"`
	RepositoryID      string   `json:"repository_id"`
	Title             string   `json:"title"`
	Status            string   `json:"status"`
	RequiredApprovals int      `json:"required_approvals"`
	Approvals         int      `json:"approvals"`
	Reviewers         []string `json:"reviewers"`
	LastUpdated       string   `json:"last_updated"`
}

type PipelineStage struct {
	Name   string `json:"name"`
	Status string `json:"status"`
}

type PipelineRun struct {
	ID        string `json:"id"`
	StartedAt string `json:"started_at"`
	Status    string `json:"status"`
	Trigger   string `json:"trigger"`
}

type Pipeline struct {
	ID           string          `json:"id"`
	RepositoryID string          `json:"repository_id"`
	Name         string          `json:"name"`
	Branch       string          `json:"branch"`
	LastRun      string          `json:"last_run"`
	Status       string          `json:"status"`
	Stages       []PipelineStage `json:"stages"`
	RunHistory   []PipelineRun   `json:"run_history"`
	LogChannel   string          `json:"log_channel"`
	UPI          string          `json:"upi"`
	Security     SecurityState   `json:"security"`
	UpdatedAt    string          `json:"updated_at"`
}

type Deployment struct {
	ID              string        `json:"id"`
	RepositoryID    string        `json:"repository_id"`
	ServiceName     string        `json:"service_name"`
	Version         string        `json:"version"`
	Environment     string        `json:"environment"`
	Status          string        `json:"status"`
	Cluster         string        `json:"cluster"`
	Artifact        string        `json:"artifact"`
	TargetCommit    string        `json:"target_commit"`
	PreviousVersion string        `json:"previous_version"`
	LogChannel      string        `json:"log_channel"`
	UPI             string        `json:"upi"`
	Security        SecurityState `json:"security"`
}

type Container struct {
	Name       string        `json:"name"`
	UPI        string        `json:"upi"`
	State      string        `json:"state"`
	Host       string        `json:"host"`
	Actions    []string      `json:"actions"`
	CPU        string        `json:"cpu"`
	Memory     string        `json:"memory"`
	Restarts   int           `json:"restarts"`
	MetricsURL string        `json:"metrics_url"`
	LogChannel string        `json:"log_channel"`
	Security   SecurityState `json:"security"`
}

type DashboardSecurity struct {
	RepositoryIdentity string        `json:"repository_identity"`
	UIProcessIdentity  string        `json:"ui_process_identity"`
	Directory          SecurityState `json:"directory"`
}

type Event struct {
	ID           string `json:"id"`
	Time         string `json:"time"`
	Component    string `json:"component"`
	Kind         string `json:"kind"`
	RepositoryID string `json:"repository_id"`
	Action       string `json:"action"`
	Result       string `json:"result"`
	UPI          string `json:"upi"`
	Summary      string `json:"summary"`
}

type Overview struct {
	Providers       []Provider        `json:"providers"`
	Repositories    []Repository      `json:"repositories"`
	CloneOperations []CloneOperation  `json:"clone_operations"`
	Reviews         []Review          `json:"reviews"`
	Pipelines       []Pipeline        `json:"pipelines"`
	Deployments     []Deployment      `json:"deployments"`
	Containers      []Container       `json:"containers"`
	Security        DashboardSecurity `json:"security"`
	Events          []Event           `json:"events"`
	UpdatedAt       string            `json:"updated_at"`
	Metrics         []Metric          `json:"metrics"`
	Activity        []string          `json:"activity"`
}

type Metric struct {
	Label string `json:"label"`
	Value string `json:"value"`
	Hint  string `json:"hint"`
}

func Register(mux *http.ServeMux) {
	mux.HandleFunc("/api/auth/login", handleLogin)
	mux.HandleFunc("/api/auth/signup", handleSignup)
	mux.HandleFunc("/api/auth/session", handleSession)
	mux.HandleFunc("/api/auth/logout", handleLogout)
	mux.HandleFunc("/git/", serveGitHTTP)

	mux.HandleFunc("/api/providers", requireAuth(func(w http.ResponseWriter, _ *http.Request, _ sessionRecord) {
		overview, err := overviewData()
		if err != nil {
			writeError(w, http.StatusInternalServerError, err)
			return
		}
		writeJSON(w, overview.Providers)
	}))
	mux.HandleFunc("/api/repositories", requireAuth(handleRepositories))
	mux.HandleFunc("/api/repositories/import", requireAuth(handleRepositoryImport))
	mux.HandleFunc("/api/reviews", requireAuth(func(w http.ResponseWriter, _ *http.Request, _ sessionRecord) {
		overview, err := overviewData()
		if err != nil {
			writeError(w, http.StatusInternalServerError, err)
			return
		}
		writeJSON(w, overview.Reviews)
	}))
	mux.HandleFunc("/api/pipelines", requireAuth(func(w http.ResponseWriter, _ *http.Request, _ sessionRecord) {
		overview, err := overviewData()
		if err != nil {
			writeError(w, http.StatusInternalServerError, err)
			return
		}
		writeJSON(w, overview.Pipelines)
	}))
	mux.HandleFunc("/api/deployments", requireAuth(func(w http.ResponseWriter, _ *http.Request, _ sessionRecord) {
		overview, err := overviewData()
		if err != nil {
			writeError(w, http.StatusInternalServerError, err)
			return
		}
		writeJSON(w, overview.Deployments)
	}))
	mux.HandleFunc("/api/containers", requireAuth(func(w http.ResponseWriter, _ *http.Request, _ sessionRecord) {
		overview, err := overviewData()
		if err != nil {
			writeError(w, http.StatusInternalServerError, err)
			return
		}
		writeJSON(w, overview.Containers)
	}))
	mux.HandleFunc("/api/overview", requireAuth(func(w http.ResponseWriter, _ *http.Request, _ sessionRecord) {
		overview, err := overviewData()
		if err != nil {
			writeError(w, http.StatusInternalServerError, err)
			return
		}
		writeJSON(w, overview)
	}))
}

func handleLogin(w http.ResponseWriter, r *http.Request) {
	if r.Method != http.MethodPost {
		w.WriteHeader(http.StatusMethodNotAllowed)
		return
	}

	var request loginRequest
	if err := decodeJSON(r, &request); err != nil {
		writeError(w, http.StatusBadRequest, errors.New("invalid login payload"))
		return
	}

	user, err := authenticateLDAPUser(request.Username, request.Password)
	if err != nil {
		if errors.Is(err, errInvalidCredentials) {
			writeError(w, http.StatusUnauthorized, err)
			return
		}
		writeError(w, http.StatusServiceUnavailable, err)
		return
	}

	token, err := generateToken()
	if err != nil {
		writeError(w, http.StatusInternalServerError, errors.New("failed to create session token"))
		return
	}

	expiresAt := time.Now().UTC().Add(authSessionTTL)
	authSessions.Lock()
	authSessions.store[token] = sessionRecord{User: user, ExpiresAt: expiresAt}
	authSessions.Unlock()

	writeJSON(w, AuthSession{Token: token, User: user, ExpiresAt: expiresAt.Format(time.RFC3339)})
}

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

	username := strings.TrimSpace(request.Username)
	email := strings.TrimSpace(request.Email)
	password := strings.TrimSpace(request.Password)

	if username == "" {
		writeError(w, http.StatusBadRequest, errors.New("username is required"))
		return
	}
	if email == "" {
		writeError(w, http.StatusBadRequest, errors.New("email is required"))
		return
	}
	if !strings.Contains(email, "@") {
		writeError(w, http.StatusBadRequest, errors.New("email must be valid"))
		return
	}
	if len(password) < 8 {
		writeError(w, http.StatusBadRequest, errors.New("password must be at least 8 characters"))
		return
	}

	requestID, err := generateToken()
	if err != nil {
		writeError(w, http.StatusInternalServerError, errors.New("failed to register account request"))
		return
	}

	writeJSONStatus(w, http.StatusAccepted, signupResponse{
		RequestID: requestID,
		Status:    "pending_review",
		Message:   "Account request submitted for administrator review.",
	})
}

func handleSession(w http.ResponseWriter, r *http.Request) {
	if r.Method != http.MethodGet {
		w.WriteHeader(http.StatusMethodNotAllowed)
		return
	}

	requireAuth(func(w http.ResponseWriter, _ *http.Request, session sessionRecord) {
		writeJSON(w, AuthSession{User: session.User, ExpiresAt: session.ExpiresAt.Format(time.RFC3339)})
	})(w, r)
}

func handleLogout(w http.ResponseWriter, r *http.Request) {
	if r.Method != http.MethodPost {
		w.WriteHeader(http.StatusMethodNotAllowed)
		return
	}

	token := bearerToken(r)
	if token != "" {
		authSessions.Lock()
		delete(authSessions.store, token)
		authSessions.Unlock()
	}

	w.WriteHeader(http.StatusNoContent)
}

func requireAuth(next func(w http.ResponseWriter, r *http.Request, session sessionRecord)) http.HandlerFunc {
	return func(w http.ResponseWriter, r *http.Request) {
		token := bearerToken(r)
		if token == "" {
			writeError(w, http.StatusUnauthorized, errors.New("missing bearer token"))
			return
		}

		session, ok := lookupSession(token)
		if !ok {
			writeError(w, http.StatusUnauthorized, errors.New("session expired or invalid"))
			return
		}

		next(w, r, session)
	}
}

func handleRepositories(w http.ResponseWriter, r *http.Request, _ sessionRecord) {
	switch r.Method {
	case http.MethodGet:
		overview, err := overviewData()
		if err != nil {
			writeError(w, http.StatusInternalServerError, err)
			return
		}
		writeJSON(w, overview.Repositories)
	case http.MethodPost:
		var req createRepositoryRequest
		if err := decodeJSON(r, &req); err != nil {
			writeError(w, http.StatusBadRequest, err)
			return
		}

		response, err := createRepository(req)
		if err != nil {
			status := http.StatusInternalServerError
			if err.Error() == "repository name is required" {
				status = http.StatusBadRequest
			}
			if isConflictError(err) {
				status = http.StatusConflict
			}
			writeError(w, status, err)
			return
		}

		w.WriteHeader(http.StatusCreated)
		writeJSON(w, response)
	default:
		w.WriteHeader(http.StatusMethodNotAllowed)
	}
}

func handleRepositoryImport(w http.ResponseWriter, r *http.Request, _ sessionRecord) {
	if r.Method != http.MethodPost {
		w.WriteHeader(http.StatusMethodNotAllowed)
		return
	}

	var req importRepositoryRequest
	if err := decodeJSON(r, &req); err != nil {
		writeError(w, http.StatusBadRequest, err)
		return
	}

	response, err := importRepository(req)
	if err != nil {
		status := http.StatusInternalServerError
		if err.Error() == "source repository URL is required" || err.Error() == "repository name is required" {
			status = http.StatusBadRequest
		}
		if isConflictError(err) {
			status = http.StatusConflict
		}
		writeError(w, status, err)
		return
	}

	w.WriteHeader(http.StatusCreated)
	writeJSON(w, response)
}

func lookupSession(token string) (sessionRecord, bool) {
	authSessions.RLock()
	session, ok := authSessions.store[token]
	authSessions.RUnlock()
	if !ok {
		return sessionRecord{}, false
	}
	if time.Now().UTC().After(session.ExpiresAt) {
		authSessions.Lock()
		delete(authSessions.store, token)
		authSessions.Unlock()
		return sessionRecord{}, false
	}
	return session, true
}

func bearerToken(r *http.Request) string {
	authorization := strings.TrimSpace(r.Header.Get("Authorization"))
	if authorization == "" {
		return ""
	}
	prefix := "Bearer "
	if !strings.HasPrefix(authorization, prefix) {
		return ""
	}
	return strings.TrimSpace(strings.TrimPrefix(authorization, prefix))
}

func generateToken() (string, error) {
	b := make([]byte, 24)
	if _, err := rand.Read(b); err != nil {
		return "", err
	}
	return hex.EncodeToString(b), nil
}

func writeJSON(w http.ResponseWriter, payload any) {
	w.Header().Set("Content-Type", "application/json")
	_ = json.NewEncoder(w).Encode(payload)
}

func writeJSONStatus(w http.ResponseWriter, status int, payload any) {
	w.Header().Set("Content-Type", "application/json")
	w.WriteHeader(status)
	_ = json.NewEncoder(w).Encode(payload)
}

func isConflictError(err error) bool {
	return strings.Contains(err.Error(), "already exists")
}
