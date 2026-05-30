package main

import (
	"context"
	"log"

	"github.com/atonixdev/gitorc/gitorcapi/internal/platform/app"
	"github.com/atonixdev/gitorc/gitorcapi/internal/platform/config"
)

func main() {
	err := app.Run(context.Background(), app.Config{
		Name:     "gitorc-analytics-service",
		Role:     "analytics",
		Summary:  "Computes failure patterns, risky modules, branch health, and developer activity metrics.",
		HTTPPort: config.String("GITORC_ANALYTICS_HTTP_PORT", "8085"),
		GRPCPort: config.String("GITORC_ANALYTICS_GRPC_PORT", "9085"),
	})
	if err != nil {
		log.Fatal(err)
	}
}
