package runnerapi

import (
	"encoding/json"
	"net/http"
	"strings"
	"time"
)

type Pipeline struct {
	ID          string   `json:"id"`
	Project     string   `json:"project"`
	Ref         string   `json:"ref"`
	Status      string   `json:"status"`
	StartedAt   string   `json:"started_at"`
	Trigger     string   `json:"trigger"`
	Jobs        []Job    `json:"jobs"`
	ArtifactURL string   `json:"artifact_url"`
	Labels      []string `json:"labels"`
}

type Job struct {
	ID          string `json:"id"`
	Name        string `json:"name"`
	Stage       string `json:"stage"`
	Status      string `json:"status"`
	Executor    string `json:"executor"`
	StartedAt   string `json:"started_at"`
	FinishedAt  string `json:"finished_at,omitempty"`
	LogEndpoint string `json:"log_endpoint"`
}

type RunnerSummary struct {
	Capacity        int    `json:"capacity"`
	BusyExecutors   int    `json:"busy_executors"`
	QueuedJobs      int    `json:"queued_jobs"`
	LiveUpdatesMode string `json:"live_updates_mode"`
}

func Register(mux *http.ServeMux) {
	pipelines := samplePipelines()
	jobs := flattenJobs(pipelines)
	summary := RunnerSummary{
		Capacity:        24,
		BusyExecutors:   9,
		QueuedJobs:      3,
		LiveUpdatesMode: "server-sent-events",
	}

	mux.HandleFunc("/pipelines", func(w http.ResponseWriter, r *http.Request) {
		if r.URL.Path != "/pipelines" {
			http.NotFound(w, r)
			return
		}
		respondJSON(w, http.StatusOK, map[string]any{"pipelines": pipelines, "summary": summary})
	})

	mux.HandleFunc("/pipelines/", func(w http.ResponseWriter, r *http.Request) {
		id := strings.TrimPrefix(r.URL.Path, "/pipelines/")
		for _, pipeline := range pipelines {
			if pipeline.ID == id {
				respondJSON(w, http.StatusOK, pipeline)
				return
			}
		}
		respondJSON(w, http.StatusNotFound, map[string]string{"error": "pipeline not found"})
	})

	mux.HandleFunc("/jobs", func(w http.ResponseWriter, r *http.Request) {
		respondJSON(w, http.StatusOK, map[string]any{"jobs": jobs, "summary": summary})
	})

	mux.HandleFunc("/events/stream", func(w http.ResponseWriter, r *http.Request) {
		w.Header().Set("Content-Type", "text/event-stream")
		w.Header().Set("Cache-Control", "no-cache")
		w.Header().Set("Connection", "keep-alive")

		flusher, ok := w.(http.Flusher)
		if !ok {
			http.Error(w, "streaming unsupported", http.StatusInternalServerError)
			return
		}

		events := []map[string]string{
			{"event": "pipeline-status", "data": `{"pipeline_id":"pipe-001","status":"running"}`},
			{"event": "job-status", "data": `{"job_id":"job-compile","status":"success"}`},
			{"event": "artifact-ready", "data": `{"pipeline_id":"pipe-001","artifact":"artifacts/gitorc/main.tar.gz"}`},
		}

		for _, event := range events {
			_, _ = w.Write([]byte("event: " + event["event"] + "\n"))
			_, _ = w.Write([]byte("data: " + event["data"] + "\n\n"))
			flusher.Flush()
		}
	})
}

func samplePipelines() []Pipeline {
	now := time.Now().UTC()
	return []Pipeline{
		{
			ID:        "pipe-001",
			Project:   "gitorc/platform",
			Ref:       "main",
			Status:    "running",
			StartedAt: now.Add(-4 * time.Minute).Format(time.RFC3339),
			Trigger:   "push",
			Jobs: []Job{
				{ID: "job-compile", Name: "compile", Stage: "build", Status: "success", Executor: "sw-automation", StartedAt: now.Add(-4 * time.Minute).Format(time.RFC3339), FinishedAt: now.Add(-2 * time.Minute).Format(time.RFC3339), LogEndpoint: "/jobs/job-compile/logs"},
				{ID: "job-hw-smoke", Name: "hw-smoke", Stage: "test", Status: "running", Executor: "hw-automation", StartedAt: now.Add(-90 * time.Second).Format(time.RFC3339), LogEndpoint: "/jobs/job-hw-smoke/logs"},
			},
			ArtifactURL: "/artifacts/pipe-001",
			Labels:      []string{"go", "hardware", "release"},
		},
		{
			ID:        "pipe-002",
			Project:   "gitorc/device-fleet",
			Ref:       "release/2026.06",
			Status:    "queued",
			StartedAt: now.Add(-30 * time.Second).Format(time.RFC3339),
			Trigger:   "manual",
			Jobs: []Job{
				{ID: "job-deploy", Name: "deploy", Stage: "deploy", Status: "queued", Executor: "sw-automation", StartedAt: now.Add(-30 * time.Second).Format(time.RFC3339), LogEndpoint: "/jobs/job-deploy/logs"},
			},
			ArtifactURL: "/artifacts/pipe-002",
			Labels:      []string{"deployment", "kubernetes"},
		},
	}
}

func flattenJobs(pipelines []Pipeline) []Job {
	jobs := make([]Job, 0)
	for _, pipeline := range pipelines {
		jobs = append(jobs, pipeline.Jobs...)
	}
	return jobs
}

func respondJSON(w http.ResponseWriter, status int, payload any) {
	w.Header().Set("Content-Type", "application/json")
	w.WriteHeader(status)
	_ = json.NewEncoder(w).Encode(payload)
}