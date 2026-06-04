package main

import (
	"context"
	"log"

	"github.com/gitorc/gitorcapi/internal/platform/app"
	"github.com/gitorc/gitorcapi/internal/platform/config"
	"github.com/gitorc/gitorcapi/internal/swautomation"
)

func main() {
	err := app.Run(context.Background(), app.WithServiceSecurity(app.Config{
		Name:               "gitorc-sw-automation",
		Role:               "software-automation",
		Summary:            "Executes software delivery workflows, package publication, deployment steps, and cloud-native automation jobs.",
		RegisterHTTPRoutes: swautomation.Register,
		HTTPPort:           config.String("GITORC_SW_AUTOMATION_HTTP_PORT", "8088"),
		GRPCPort:           config.String("GITORC_SW_AUTOMATION_GRPC_PORT", "9088"),
	}, "GITORC_SW_AUTOMATION_IDENTITY", app.DefaultSWAutoIdentity))
	if err != nil {
		log.Fatal(err)
	}
}