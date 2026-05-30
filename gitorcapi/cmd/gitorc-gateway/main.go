package main

import (
	"context"
	"log"

	"github.com/atonixdev/gitorc/gitorcapi/internal/platform/app"
	"github.com/atonixdev/gitorc/gitorcapi/internal/platform/config"
)

func main() {
	err := app.Run(context.Background(), app.Config{
		Name:     "gitorc-gateway",
		Role:     "api-gateway",
		Summary:  "Single entrypoint for projects, reviews, pipelines, deployments, and analytics.",
		HTTPPort: config.String("GITORC_GATEWAY_HTTP_PORT", "8080"),
		GRPCPort: config.String("GITORC_GATEWAY_GRPC_PORT", "9080"),
	})
	if err != nil {
		log.Fatal(err)
	}
}
