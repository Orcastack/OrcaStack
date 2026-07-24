package deviceorch

import (
	"encoding/json"
	"net/http"
	"strings"
)

type Device struct {
	ID           string   `json:"id"`
	Name         string   `json:"name"`
	Status       string   `json:"status"`
	Health       string   `json:"health"`
	Tags         []string `json:"tags"`
	Location     string   `json:"location"`
	Capabilities []string `json:"capabilities"`
	AssignedRun  string   `json:"assigned_run,omitempty"`
}

func Register(mux *http.ServeMux) {
	devices := []Device{
		{ID: "dev-001", Name: "arm-board-01", Status: "busy", Health: "healthy", Tags: []string{"arm64", "serial-console", "lab-a"}, Location: "rack-a3", Capabilities: []string{"flash", "power-cycle", "uart"}, AssignedRun: "pipe-001"},
		{ID: "dev-002", Name: "sensor-rig-07", Status: "idle", Health: "healthy", Tags: []string{"iot", "wifi", "lab-c"}, Location: "rack-c1", Capabilities: []string{"telemetry", "camera", "power-cycle"}},
		{ID: "dev-003", Name: "fpga-node-02", Status: "offline", Health: "degraded", Tags: []string{"fpga", "lab-b"}, Location: "rack-b2", Capabilities: []string{"jtag", "power-cycle"}},
	}

	mux.HandleFunc("/devices", func(w http.ResponseWriter, r *http.Request) {
		if r.URL.Path != "/devices" {
			http.NotFound(w, r)
			return
		}
		respondJSON(w, http.StatusOK, map[string]any{
			"devices": devices,
			"summary": map[string]int{"total": len(devices), "healthy": 2, "busy": 1, "offline": 1},
		})
	})

	mux.HandleFunc("/devices/", func(w http.ResponseWriter, r *http.Request) {
		id := strings.TrimPrefix(r.URL.Path, "/devices/")
		for _, device := range devices {
			if device.ID == id {
				respondJSON(w, http.StatusOK, device)
				return
			}
		}
		respondJSON(w, http.StatusNotFound, map[string]string{"error": "device not found"})
	})

	mux.HandleFunc("/allocations", func(w http.ResponseWriter, r *http.Request) {
		respondJSON(w, http.StatusOK, map[string]any{
			"allocations": []map[string]string{
				{"device_id": "dev-001", "pipeline_id": "pipe-001", "status": "active"},
			},
		})
	})
}

func respondJSON(w http.ResponseWriter, status int, payload any) {
	w.Header().Set("Content-Type", "application/json")
	w.WriteHeader(status)
	_ = json.NewEncoder(w).Encode(payload)
}