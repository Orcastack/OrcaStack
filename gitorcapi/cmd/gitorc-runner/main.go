package main

import (
	"context"
	"log"

	"github.com/gitorc/gitorcapi/internal/platform/app"
	"github.com/gitorc/gitorcapi/internal/platform/config"
	"github.com/gitorc/gitorcapi/internal/runnerapi"
)

func main() {
	err := app.Run(context.Background(), app.WithServiceSecurity(app.Config{
		Name:               "gitorc-runner",
		Role:               "pipeline-runner",
		Summary:            "Coordinates pipeline execution, live job events, artifacts, and workload dispatch.",
		RegisterHTTPRoutes: runnerapi.Register,
		HTTPPort:           config.String("GITORC_RUNNER_HTTP_PORT", "8086"),
		GRPCPort:           config.String("GITORC_RUNNER_GRPC_PORT", "9086"),
	}, "GITORC_RUNNER_IDENTITY", app.DefaultRunnerIdentity))
	if err != nil {
		log.Fatal(err)
	}
}