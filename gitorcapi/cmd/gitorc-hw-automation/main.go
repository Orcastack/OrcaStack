package main

import (
	"context"
	"log"

	"github.com/gitorc/gitorcapi/internal/hwautomation"
	"github.com/gitorc/gitorcapi/internal/platform/app"
	"github.com/gitorc/gitorcapi/internal/platform/config"
)

func main() {
	err := app.Run(context.Background(), app.WithServiceSecurity(app.Config{
		Name:               "gitorc-hw-automation",
		Role:               "hardware-automation",
		Summary:            "Executes firmware flashing, device pool management, hardware validation, and telemetry collection workflows.",
		RegisterHTTPRoutes: hwautomation.Register,
		HTTPPort:           config.String("GITORC_HW_AUTOMATION_HTTP_PORT", "8087"),
		GRPCPort:           config.String("GITORC_HW_AUTOMATION_GRPC_PORT", "9087"),
	}, "GITORC_HW_AUTOMATION_IDENTITY", app.DefaultHWAutoIdentity))
	if err != nil {
		log.Fatal(err)
	}
}