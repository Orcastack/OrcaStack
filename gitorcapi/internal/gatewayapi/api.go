package gatewayapi

import (
	"encoding/json"
	"net/http"
	"time"
)

type Provider struct {
	ID         string `json:"id"`
	Name       string `json:"name"`
	Status     string `json:"status"`
	Repos      int    `json:"repos"`
	Latency    string `json:"latency"`
	Identity   string `json:"identity"`
	Connected  bool   `json:"connected"`
}

type SecurityState struct {
	LDAPRegistered   bool `json:"ldap_registered"`
	RBACVerified     bool `json:"rbac_verified"`
	AttestationSigned bool `json:"attestation_signed"`
	Verified         bool `json:"verified"`
}

type Repository struct {
	ID         string `json:"id"`
	ProviderID string `json:"provider_id"`
	Name       string `json:"name"`
	Branch     string `json:"branch"`
	DefaultBranch string `json:"default_branch"`
	Commit     string `json:"commit"`
	LastCommitAt string `json:"last_commit_at"`
	Reviewer   string `json:"reviewer"`
	Summary    string `json:"summary"`
	CloneURL   string `json:"clone_url"`
	Identity   string `json:"identity"`
	Security   SecurityState `json:"security"`
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
	ID           string `json:"id"`
	RepositoryID string `json:"repository_id"`
	Name         string `json:"name"`
	Branch       string `json:"branch"`
	LastRun      string `json:"last_run"`
	Status       string `json:"status"`
	Stages       []PipelineStage `json:"stages"`
	RunHistory   []PipelineRun `json:"run_history"`
	LogChannel   string `json:"log_channel"`
	UPI          string `json:"upi"`
	Security     SecurityState `json:"security"`
	UpdatedAt    string `json:"updated_at"`
}

type Deployment struct {
	ID           string `json:"id"`
	RepositoryID string `json:"repository_id"`
	ServiceName  string `json:"service_name"`
	Version      string `json:"version"`
	Environment  string `json:"environment"`
	Status       string `json:"status"`
	Cluster      string `json:"cluster"`
	Artifact     string `json:"artifact"`
	TargetCommit string `json:"target_commit"`
	PreviousVersion string `json:"previous_version"`
	LogChannel   string `json:"log_channel"`
	UPI          string `json:"upi"`
	Security     SecurityState `json:"security"`
}

type Container struct {
	Name       string `json:"name"`
	UPI        string `json:"upi"`
	State      string `json:"state"`
	Host       string `json:"host"`
	Actions    []string `json:"actions"`
	CPU        string `json:"cpu"`
	Memory     string `json:"memory"`
	Restarts   int    `json:"restarts"`
	MetricsURL string `json:"metrics_url"`
	LogChannel string `json:"log_channel"`
	Security   SecurityState `json:"security"`
}

type DashboardSecurity struct {
	RepositoryIdentity string `json:"repository_identity"`
	UIProcessIdentity  string `json:"ui_process_identity"`
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
	Providers    []Provider    `json:"providers"`
	Repositories []Repository  `json:"repositories"`
	CloneOperations []CloneOperation `json:"clone_operations"`
	Reviews      []Review      `json:"reviews"`
	Pipelines    []Pipeline    `json:"pipelines"`
	Deployments  []Deployment  `json:"deployments"`
	Containers   []Container   `json:"containers"`
	Security     DashboardSecurity `json:"security"`
	Events       []Event       `json:"events"`
	UpdatedAt    string        `json:"updated_at"`
	Metrics      []Metric      `json:"metrics"`
	Activity     []string      `json:"activity"`
}

type Metric struct {
	Label string `json:"label"`
	Value string `json:"value"`
	Hint  string `json:"hint"`
}

func Register(mux *http.ServeMux) {
	mux.HandleFunc("/api/providers", func(w http.ResponseWriter, _ *http.Request) {
		writeJSON(w, data().Providers)
	})
	mux.HandleFunc("/api/repositories", func(w http.ResponseWriter, _ *http.Request) {
		writeJSON(w, data().Repositories)
	})
	mux.HandleFunc("/api/reviews", func(w http.ResponseWriter, _ *http.Request) {
		writeJSON(w, data().Reviews)
	})
	mux.HandleFunc("/api/pipelines", func(w http.ResponseWriter, _ *http.Request) {
		writeJSON(w, data().Pipelines)
	})
	mux.HandleFunc("/api/deployments", func(w http.ResponseWriter, _ *http.Request) {
		writeJSON(w, data().Deployments)
	})
	mux.HandleFunc("/api/containers", func(w http.ResponseWriter, _ *http.Request) {
		writeJSON(w, data().Containers)
	})
	mux.HandleFunc("/api/overview", func(w http.ResponseWriter, _ *http.Request) {
		writeJSON(w, data())
	})
}

func writeJSON(w http.ResponseWriter, payload any) {
	w.Header().Set("Content-Type", "application/json")
	_ = json.NewEncoder(w).Encode(payload)
}

func data() Overview {
	now := time.Now().UTC().Format(time.RFC3339)

	providers := []Provider{
		{ID: "github", Name: "GitHub", Status: "connected", Repos: 24, Latency: "42 ms", Identity: "orca:service:24d3a597-df6a-4ca0-97b8-f1b41f16af2f", Connected: true},
		{ID: "gitlab", Name: "GitLab", Status: "connected", Repos: 12, Latency: "55 ms", Identity: "orca:service:ce2d4468-4f59-433e-9ab6-7585185ef9d1", Connected: true},
		{ID: "gitea", Name: "Gitea", Status: "standby", Repos: 4, Latency: "91 ms", Identity: "orca:service:8a2d734d-fb74-4828-b8fd-68d1a40604ea", Connected: false},
		{ID: "bitbucket", Name: "Bitbucket", Status: "standby", Repos: 9, Latency: "73 ms", Identity: "orca:service:94b2ac82-b786-4eb1-a673-3eb4254a8ddc", Connected: false},
		{ID: "gitorc", Name: "GITORC Host", Status: "primary", Repos: 18, Latency: "14 ms", Identity: "orca:service:4c3f7ef4-bf28-4dc0-903c-b3cfd4fdd9b4", Connected: true},
	}

	repositories := []Repository{
		{ID: "core-platform", ProviderID: "gitorc", Name: "core-platform", Branch: "main", DefaultBranch: "main", Commit: "9b3f8e2", LastCommitAt: now, Reviewer: "orca:agent:1b4e28ba-2fa1-41d2-883f-0016d3cca427", Summary: "Gateway hardening, policy routing, signed deployments", CloneURL: "ssh://git@gitorc.local/core-platform.git", Identity: "orca:repo:3f6d8c3e-6c96-4d8c-a2d3-6f4a8f4b7f2a", Security: SecurityState{LDAPRegistered: true, RBACVerified: true, AttestationSigned: true, Verified: true}},
		{ID: "review-automation", ProviderID: "gitlab", Name: "review-automation", Branch: "feature/transform-lane", DefaultBranch: "main", Commit: "4ad09d1", LastCommitAt: now, Reviewer: "orca:agent:550e8400-e29b-41d4-a716-446655440000", Summary: "Review policy templates and transform pipeline orchestration", CloneURL: "ssh://git@gitlab.local/review-automation.git", Identity: "orca:repo:cb234836-95bd-4d49-bd3a-4504227a8a3a", Security: SecurityState{LDAPRegistered: true, RBACVerified: true, AttestationSigned: true, Verified: true}},
		{ID: "container-fabric", ProviderID: "github", Name: "container-fabric", Branch: "release/0.4", DefaultBranch: "main", Commit: "2c4b6a7", LastCommitAt: now, Reviewer: "orca:service:9c858901-8a57-4791-81fe-4c455b099bc9", Summary: "Runtime graphs, signed manifests, cluster rollout controls", CloneURL: "ssh://git@github.com/atonixdev/container-fabric.git", Identity: "orca:repo:1d74523b-4d56-4442-90d4-5256d0f8777a", Security: SecurityState{LDAPRegistered: true, RBACVerified: false, AttestationSigned: true, Verified: false}},
	}

	cloneOperations := []CloneOperation{
		{RepositoryID: "core-platform", Status: "completed", CloneURL: "ssh://git@gitorc.local/core-platform.git", Command: "rycli clone core-platform", UPI: "orca:process:0ecf2d45-6be6-4c3d-b6d7-2f0831e8c101", UpdatedAt: now},
		{RepositoryID: "review-automation", Status: "running", CloneURL: "ssh://git@gitlab.local/review-automation.git", Command: "rycli clone review-automation", UPI: "orca:process:e346f61c-40c6-4434-94ef-b2410890b8ef", UpdatedAt: now},
		{RepositoryID: "container-fabric", Status: "failed", CloneURL: "ssh://git@github.com/atonixdev/container-fabric.git", Command: "rycli clone container-fabric", UPI: "orca:process:3eb6ddc8-a829-4b8d-b791-9cf0d1d4c43a", UpdatedAt: now},
	}

	reviews := []Review{
		{ID: "rvw-100", RepositoryID: "core-platform", Title: "Harden gateway security policy", Status: "approved", RequiredApprovals: 2, Approvals: 2, Reviewers: []string{"orca:agent:1b4e28ba-2fa1-41d2-883f-0016d3cca427", "orca:agent:6dd7a71b-9772-4d9b-8a4c-8607904dd6b0"}, LastUpdated: now},
		{ID: "rvw-101", RepositoryID: "review-automation", Title: "Transform stage normalization", Status: "pending", RequiredApprovals: 2, Approvals: 1, Reviewers: []string{"orca:agent:550e8400-e29b-41d4-a716-446655440000"}, LastUpdated: now},
		{ID: "rvw-102", RepositoryID: "container-fabric", Title: "Container rollout policy", Status: "changes-requested", RequiredApprovals: 3, Approvals: 1, Reviewers: []string{"orca:service:9c858901-8a57-4791-81fe-4c455b099bc9"}, LastUpdated: now},
	}

	pipelines := []Pipeline{
		{ID: "pipe-800", RepositoryID: "core-platform", Name: "transform-main", Branch: "main", LastRun: now, Status: "running", Stages: []PipelineStage{{Name: "lint", Status: "passed"}, {Name: "test", Status: "passed"}, {Name: "build", Status: "running"}, {Name: "package", Status: "queued"}, {Name: "deploy", Status: "queued"}}, RunHistory: []PipelineRun{{ID: "run-8001", StartedAt: now, Status: "running", Trigger: "manual"}, {ID: "run-8000", StartedAt: now, Status: "passed", Trigger: "push"}}, LogChannel: "ci/core-platform", UPI: "orca:process:99537633-a279-4f29-a787-5d62907e4f2c", Security: SecurityState{LDAPRegistered: true, RBACVerified: true, AttestationSigned: true, Verified: true}, UpdatedAt: now},
		{ID: "pipe-801", RepositoryID: "review-automation", Name: "transform-review", Branch: "feature/transform-lane", LastRun: now, Status: "queued", Stages: []PipelineStage{{Name: "lint", Status: "passed"}, {Name: "test", Status: "queued"}, {Name: "build", Status: "blocked"}, {Name: "package", Status: "blocked"}, {Name: "deploy", Status: "blocked"}}, RunHistory: []PipelineRun{{ID: "run-8010", StartedAt: now, Status: "queued", Trigger: "review-approved"}, {ID: "run-8009", StartedAt: now, Status: "failed", Trigger: "manual"}}, LogChannel: "ci/review-automation", UPI: "orca:process:4d3250d6-9b7e-4b17-8343-41564b0f0da8", Security: SecurityState{LDAPRegistered: true, RBACVerified: true, AttestationSigned: true, Verified: true}, UpdatedAt: now},
		{ID: "pipe-802", RepositoryID: "container-fabric", Name: "release-canary", Branch: "release/0.4", LastRun: now, Status: "failed", Stages: []PipelineStage{{Name: "lint", Status: "passed"}, {Name: "test", Status: "failed"}, {Name: "build", Status: "blocked"}, {Name: "package", Status: "blocked"}, {Name: "deploy", Status: "blocked"}}, RunHistory: []PipelineRun{{ID: "run-8020", StartedAt: now, Status: "failed", Trigger: "push"}, {ID: "run-8019", StartedAt: now, Status: "passed", Trigger: "manual"}}, LogChannel: "ci/container-fabric", UPI: "orca:process:2d93aa22-185d-4a20-8f4c-49f2ff8559a7", Security: SecurityState{LDAPRegistered: true, RBACVerified: false, AttestationSigned: true, Verified: false}, UpdatedAt: now},
	}

	deployments := []Deployment{
		{ID: "dep-210", RepositoryID: "core-platform", ServiceName: "gateway", Version: "9b3f8e2", Environment: "staging", Status: "running", Cluster: "cluster-west-1", Artifact: "gitorc-gateway:9b3f8e2", TargetCommit: "9b3f8e2", PreviousVersion: "9b3f7d1", LogChannel: "deploy/gateway", UPI: "orca:process:9d94b79f-f6b4-43f3-b338-aa8f6a125a67", Security: SecurityState{LDAPRegistered: true, RBACVerified: true, AttestationSigned: true, Verified: true}},
		{ID: "dep-211", RepositoryID: "review-automation", ServiceName: "review-automation", Version: "4ad09d1", Environment: "staging", Status: "pending", Cluster: "cluster-lab-2", Artifact: "review-automation:4ad09d1", TargetCommit: "4ad09d1", PreviousVersion: "4ad08f0", LogChannel: "deploy/review-automation", UPI: "orca:process:004cf814-0325-4dbc-b718-fc61e0e087fa", Security: SecurityState{LDAPRegistered: true, RBACVerified: true, AttestationSigned: true, Verified: true}},
		{ID: "dep-212", RepositoryID: "container-fabric", ServiceName: "container-fabric", Version: "2c4b6a7", Environment: "prod", Status: "rolling-back", Cluster: "cluster-edge-4", Artifact: "container-fabric:2c4b6a7", TargetCommit: "2c4b6a7", PreviousVersion: "2c4b690", LogChannel: "deploy/container-fabric", UPI: "orca:process:883b4440-23d8-4de5-b0dc-c64d57867a5d", Security: SecurityState{LDAPRegistered: true, RBACVerified: false, AttestationSigned: true, Verified: false}},
	}

	containers := []Container{
		{Name: "gateway", UPI: "orca:process:6dc35594-5a72-4a22-b6b0-3d7d3c492da2", State: "running", Host: "node-a1", Actions: []string{"restart", "logs", "metrics"}, CPU: "0.12", Memory: "128 MiB", Restarts: 0, MetricsURL: "http://localhost:8085/metrics/gateway", LogChannel: "gateway/live", Security: SecurityState{LDAPRegistered: true, RBACVerified: true, AttestationSigned: true, Verified: true}},
		{Name: "review-service", UPI: "orca:process:2bf0ec03-a770-462a-a0dd-b117eb729b5a", State: "stopped", Host: "node-b4", Actions: []string{"start", "logs"}, CPU: "0.00", Memory: "0 MiB", Restarts: 2, MetricsURL: "http://localhost:8085/metrics/review-service", LogChannel: "review/live", Security: SecurityState{LDAPRegistered: true, RBACVerified: true, AttestationSigned: true, Verified: true}},
		{Name: "ci-service", UPI: "orca:process:16f1e918-56c0-4b3d-bded-e0cd7f1d8498", State: "running", Host: "node-ci2", Actions: []string{"stop", "restart", "logs", "metrics"}, CPU: "0.31", Memory: "208 MiB", Restarts: 1, MetricsURL: "http://localhost:8085/metrics/ci-service", LogChannel: "ci/live", Security: SecurityState{LDAPRegistered: true, RBACVerified: true, AttestationSigned: true, Verified: true}},
		{Name: "analytics-service", UPI: "orca:process:ec5ac6ce-c1a9-4c99-a9d8-263fc6c27419", State: "crashed", Host: "node-ana1", Actions: []string{"start", "logs", "metrics"}, CPU: "0.27", Memory: "312 MiB", Restarts: 4, MetricsURL: "http://localhost:8085/metrics/analytics-service", LogChannel: "analytics/live", Security: SecurityState{LDAPRegistered: true, RBACVerified: false, AttestationSigned: true, Verified: false}},
	}

	security := DashboardSecurity{
		RepositoryIdentity: "orca:repo:3f6d8c3e-6c96-4d8c-a2d3-6f4a8f4b7f2a",
		UIProcessIdentity:  "orca:process:3561f437-25f1-4f4b-87ed-89bc1b0932f0",
		Directory: SecurityState{LDAPRegistered: true, RBACVerified: true, AttestationSigned: true, Verified: true},
	}

	events := []Event{
		{ID: "evt-1", Time: now, Component: "core-platform", Kind: "repository", RepositoryID: "core-platform", Action: "cloned", Result: "success", UPI: "orca:process:0ecf2d45-6be6-4c3d-b6d7-2f0831e8c101", Summary: "Repository cloned through RYCLI using signed gateway intent."},
		{ID: "evt-2", Time: now, Component: "transform-main", Kind: "pipeline", RepositoryID: "core-platform", Action: "build", Result: "running", UPI: "orca:process:99537633-a279-4f29-a787-5d62907e4f2c", Summary: "Build stage is executing on node-ci2."},
		{ID: "evt-3", Time: now, Component: "gateway", Kind: "deployment", RepositoryID: "core-platform", Action: "deployed", Result: "success", UPI: "orca:process:9d94b79f-f6b4-43f3-b338-aa8f6a125a67", Summary: "Gateway promoted to staging with verified attestation."},
		{ID: "evt-4", Time: now, Component: "analytics-service", Kind: "process", RepositoryID: "container-fabric", Action: "restarted", Result: "failure", UPI: "orca:process:ec5ac6ce-c1a9-4c99-a9d8-263fc6c27419", Summary: "Analytics service restart failed after crash loop detection."},
		{ID: "evt-5", Time: now, Component: "review-automation", Kind: "repository", RepositoryID: "review-automation", Action: "review-opened", Result: "pending", UPI: "orca:process:ab32757b-a403-41e7-b07a-4b80fd4cb550", Summary: "Code review opened for transform lane before CI release."},
	}

	metrics := []Metric{
		{Label: "Repositories tracked", Value: "67", Hint: "Across GitHub, GitLab, Gitea, Bitbucket, and GITORC"},
		{Label: "Signed actions today", Value: "214", Hint: "Every UI action issues a process identity and attestation"},
		{Label: "Deploy success rate", Value: "98.4%", Hint: "Last 30 signed deployment lanes"},
		{Label: "Containers under control", Value: "32", Hint: "Running, pending, or gated by review"},
	}

	activity := []string{
		"Connect_Git_Provider accepted for GitLab with ORCA identity enforcement.",
		"Open_Code_Review on core-platform/main waiting for two approvals.",
		"Trigger_CI_Pipeline gated until review state changes to approved.",
		"Deploy lane linked to signed attestation and repository identity.",
		"Container orchestration flow attached to automation policy pack 07.",
	}

	return Overview{
		Providers:    providers,
		Repositories: repositories,
		CloneOperations: cloneOperations,
		Reviews:      reviews,
		Pipelines:    pipelines,
		Deployments:  deployments,
		Containers:   containers,
		Security:     security,
		Events:       events,
		UpdatedAt:    now,
		Metrics:      metrics,
		Activity:     activity,
	}
}