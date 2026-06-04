package swautomation

import (
	"encoding/json"
	"net/http"
)

func Register(mux *http.ServeMux) {
	mux.HandleFunc("/workflows", func(w http.ResponseWriter, r *http.Request) {
		respondJSON(w, http.StatusOK, map[string]any{
			"engine": "software-automation",
			"workflows": []map[string]any{
				{"id": "sw-001", "name": "kubernetes-rollout", "status": "ready", "target": "private-cloud/dev", "integrations": []string{"kubernetes", "helm", "registry"}},
				{"id": "sw-002", "name": "package-publish", "status": "running", "target": "apt-repo", "integrations": []string{"apt", "signing", "artifact-store"}},
			},
		})
	})

	mux.HandleFunc("/integrations", func(w http.ResponseWriter, r *http.Request) {
		respondJSON(w, http.StatusOK, map[string]any{
			"integrations": []map[string]any{
				{"name": "kubernetes", "status": "connected", "endpoint": "https://kubernetes.default.svc"},
				{"name": "registry", "status": "connected", "endpoint": "oci://registry.gitorc.local/platform"},
				{"name": "package-repo", "status": "degraded", "endpoint": "https://apt.gitorc.local"},
			},
		})
	})
}

func respondJSON(w http.ResponseWriter, status int, payload any) {
	w.Header().Set("Content-Type", "application/json")
	w.WriteHeader(status)
	_ = json.NewEncoder(w).Encode(payload)
}