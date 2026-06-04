package main

import (
	"context"
	"log"

	"github.com/gitorc/gitorcapi/internal/gitapi"
	"github.com/gitorc/gitorcapi/internal/platform/app"
	"github.com/gitorc/gitorcapi/internal/platform/config"
)

func main() {
	err := app.Run(context.Background(), app.WithServiceSecurity(app.Config{
		Name:               "gitorc-git-service",
		Role:               "git-rpc",
		Summary:            "Owns repository storage, refs, packfile ingestion, and Git metadata queries.",
		RegisterHTTPRoutes: gitapi.Register,
		HTTPPort:           config.String("GITORC_GIT_HTTP_PORT", "8081"),
		GRPCPort:           config.String("GITORC_GIT_GRPC_PORT", "9081"),
	}, "GITORC_GIT_IDENTITY", app.DefaultGitIdentity))
	if err != nil {
		log.Fatal(err)
	}
}
