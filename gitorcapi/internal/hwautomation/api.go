package hwautomation

import (
	"encoding/json"
	"net/http"
)

type Workflow struct {
	ID            string   `json:"id"`
	Name          string   `json:"name"`
	Status        string   `json:"status"`
	TargetPool    string   `json:"target_pool"`
	RequiredTags  []string `json:"required_tags"`
	LastRun       string   `json:"last_run"`
	FirmwareImage string   `json:"firmware_image"`
}

func Register(mux *http.ServeMux) {
	workflows := []Workflow{
		{ID: "hw-001", Name: "firmware-validation", Status: "ready", TargetPool: "arm-lab", RequiredTags: []string{"arm64", "serial-console", "lab-a"}, LastRun: "2026-06-04T10:12:00Z", FirmwareImage: "firmware/gitorc-controller-1.2.0.bin"},
		{ID: "hw-002", Name: "board-bringup", Status: "running", TargetPool: "fpga-bench", RequiredTags: []string{"fpga", "power-cycle", "lab-b"}, LastRun: "2026-06-04T10:18:00Z", FirmwareImage: "firmware/fpga-bringup-0.9.4.bit"},
	}

	mux.HandleFunc("/workflows", func(w http.ResponseWriter, r *http.Request) {
		respondJSON(w, http.StatusOK, map[string]any{
			"engine":    "hardware-automation",
			"workflows": workflows,
			"capabilities": []string{"flash-firmware", "reserve-device", "capture-telemetry", "collect-test-results"},
		})
	})

	mux.HandleFunc("/device-pools", func(w http.ResponseWriter, r *http.Request) {
		respondJSON(w, http.StatusOK, map[string]any{
			"pools": []map[string]any{
				{"name": "arm-lab", "healthy": 18, "busy": 5, "reserved": 2},
				{"name": "fpga-bench", "healthy": 6, "busy": 3, "reserved": 1},
			},
		})
	})
}

func respondJSON(w http.ResponseWriter, status int, payload any) {
	w.Header().Set("Content-Type", "application/json")
	w.WriteHeader(status)
	_ = json.NewEncoder(w).Encode(payload)
}