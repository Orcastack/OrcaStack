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

type Repository struct {
	ID         string `json:"id"`
	ProviderID string `json:"provider_id"`
	Name       string `json:"name"`
	Branch     string `json:"branch"`
	Commit     string `json:"commit"`
	Reviewer   string `json:"reviewer"`
	Summary    string `json:"summary"`
	Identity   string `json:"identity"`
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

type Pipeline struct {
	ID           string `json:"id"`
	RepositoryID string `json:"repository_id"`
	Status       string `json:"status"`
	Transform    string `json:"transform"`
	Build        string `json:"build"`
	Deploy       string `json:"deploy"`
	Automate     string `json:"automate"`
	Containerize string `json:"containerize"`
	UpdatedAt    string `json:"updated_at"`
}

type Deployment struct {
	ID           string `json:"id"`
	RepositoryID string `json:"repository_id"`
	Environment  string `json:"environment"`
	Status       string `json:"status"`
	Cluster      string `json:"cluster"`
	Artifact     string `json:"artifact"`
}

type Container struct {
	Name       string `json:"name"`
	State      string `json:"state"`
	Action     string `json:"action"`
	CPU        string `json:"cpu"`
	Memory     string `json:"memory"`
	LogChannel string `json:"log_channel"`
}

type Overview struct {
	Providers    []Provider    `json:"providers"`
	Repositories []Repository  `json:"repositories"`
	Reviews      []Review      `json:"reviews"`
	Pipelines    []Pipeline    `json:"pipelines"`
	Deployments  []Deployment  `json:"deployments"`
	Containers   []Container   `json:"containers"`
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
		{ID: "core-platform", ProviderID: "gitorc", Name: "core-platform", Branch: "main", Commit: "9b3f8e2", Reviewer: "orca:agent:1b4e28ba-2fa1-41d2-883f-0016d3cca427", Summary: "Gateway hardening, policy routing, signed deployments", Identity: "orca:repo:3f6d8c3e-6c96-4d8c-a2d3-6f4a8f4b7f2a"},
		{ID: "review-automation", ProviderID: "gitlab", Name: "review-automation", Branch: "feature/transform-lane", Commit: "4ad09d1", Reviewer: "orca:agent:550e8400-e29b-41d4-a716-446655440000", Summary: "Review policy templates and transform pipeline orchestration", Identity: "orca:repo:cb234836-95bd-4d49-bd3a-4504227a8a3a"},
		{ID: "container-fabric", ProviderID: "github", Name: "container-fabric", Branch: "release/0.4", Commit: "2c4b6a7", Reviewer: "orca:service:9c858901-8a57-4791-81fe-4c455b099bc9", Summary: "Runtime graphs, signed manifests, cluster rollout controls", Identity: "orca:repo:1d74523b-4d56-4442-90d4-5256d0f8777a"},
	}

	reviews := []Review{
		{ID: "rvw-100", RepositoryID: "core-platform", Title: "Harden gateway security policy", Status: "approved", RequiredApprovals: 2, Approvals: 2, Reviewers: []string{"orca:agent:1b4e28ba-2fa1-41d2-883f-0016d3cca427", "orca:agent:6dd7a71b-9772-4d9b-8a4c-8607904dd6b0"}, LastUpdated: now},
		{ID: "rvw-101", RepositoryID: "review-automation", Title: "Transform stage normalization", Status: "pending", RequiredApprovals: 2, Approvals: 1, Reviewers: []string{"orca:agent:550e8400-e29b-41d4-a716-446655440000"}, LastUpdated: now},
		{ID: "rvw-102", RepositoryID: "container-fabric", Title: "Container rollout policy", Status: "changes-requested", RequiredApprovals: 3, Approvals: 1, Reviewers: []string{"orca:service:9c858901-8a57-4791-81fe-4c455b099bc9"}, LastUpdated: now},
	}

	pipelines := []Pipeline{
		{ID: "pipe-800", RepositoryID: "core-platform", Status: "running", Transform: "complete", Build: "running", Deploy: "queued", Automate: "queued", Containerize: "queued", UpdatedAt: now},
		{ID: "pipe-801", RepositoryID: "review-automation", Status: "review-gated", Transform: "ready", Build: "blocked", Deploy: "blocked", Automate: "blocked", Containerize: "blocked", UpdatedAt: now},
		{ID: "pipe-802", RepositoryID: "container-fabric", Status: "changes-requested", Transform: "blocked", Build: "blocked", Deploy: "blocked", Automate: "blocked", Containerize: "blocked", UpdatedAt: now},
	}

	deployments := []Deployment{
		{ID: "dep-210", RepositoryID: "core-platform", Environment: "staging", Status: "ready", Cluster: "cluster-west-1", Artifact: "gitorc-gateway:9b3f8e2"},
		{ID: "dep-211", RepositoryID: "review-automation", Environment: "integration", Status: "waiting-for-review", Cluster: "cluster-lab-2", Artifact: "review-automation:4ad09d1"},
		{ID: "dep-212", RepositoryID: "container-fabric", Environment: "prod-canary", Status: "blocked", Cluster: "cluster-edge-4", Artifact: "container-fabric:2c4b6a7"},
	}

	containers := []Container{
		{Name: "gateway", State: "running", Action: "Restart", CPU: "0.12", Memory: "128 MiB", LogChannel: "gateway/live"},
		{Name: "review-service", State: "gated", Action: "Open review", CPU: "0.05", Memory: "96 MiB", LogChannel: "review/live"},
		{Name: "ci-service", State: "running", Action: "View logs", CPU: "0.31", Memory: "208 MiB", LogChannel: "ci/live"},
		{Name: "analytics-service", State: "running", Action: "Open metrics", CPU: "0.27", Memory: "312 MiB", LogChannel: "analytics/live"},
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
		Reviews:      reviews,
		Pipelines:    pipelines,
		Deployments:  deployments,
		Containers:   containers,
		UpdatedAt:    now,
		Metrics:      metrics,
		Activity:     activity,
	}
}