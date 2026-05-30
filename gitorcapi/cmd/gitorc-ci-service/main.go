package main

import (
	"context"
	"log"

	"github.com/atonixdev/gitorc/gitorcapi/internal/platform/app"
	"github.com/atonixdev/gitorc/gitorcapi/internal/platform/config"
)

func main() {
	err := app.Run(context.Background(), app.Config{
		Name:     "gitorc-ci-service",
		Role:     "ci-engine",
		Summary:  "Schedules pipeline jobs, streams logs to HBase, and stores artifacts in HDFS.",
		HTTPPort: config.String("GITORC_CI_HTTP_PORT", "8083"),
		GRPCPort: config.String("GITORC_CI_GRPC_PORT", "9083"),
	})
	if err != nil {
		log.Fatal(err)
	}
}
