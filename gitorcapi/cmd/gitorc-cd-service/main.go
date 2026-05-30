package main

import (
	"context"
	"log"

	"github.com/atonixdev/gitorc/gitorcapi/internal/platform/app"
	"github.com/atonixdev/gitorc/gitorcapi/internal/platform/config"
)

func main() {
	err := app.Run(context.Background(), app.Config{
		Name:     "gitorc-cd-service",
		Role:     "cd-engine",
		Summary:  "Deploys verified artifacts to Kubernetes, Docker, OpenStack, or bare metal targets.",
		HTTPPort: config.String("GITORC_CD_HTTP_PORT", "8084"),
		GRPCPort: config.String("GITORC_CD_GRPC_PORT", "9084"),
	})
	if err != nil {
		log.Fatal(err)
	}
}
