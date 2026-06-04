package main

import (
	"context"
	"log"

	"github.com/gitorc/gitorcapi/internal/deviceorch"
	"github.com/gitorc/gitorcapi/internal/platform/app"
	"github.com/gitorc/gitorcapi/internal/platform/config"
)

func main() {
	err := app.Run(context.Background(), app.WithServiceSecurity(app.Config{
		Name:               "gitorc-device-orch",
		Role:               "device-orchestration",
		Summary:            "Maintains device inventory, health, reservation state, and allocation data for hardware-aware pipelines.",
		RegisterHTTPRoutes: deviceorch.Register,
		HTTPPort:           config.String("GITORC_DEVICE_ORCH_HTTP_PORT", "8089"),
		GRPCPort:           config.String("GITORC_DEVICE_ORCH_GRPC_PORT", "9089"),
	}, "GITORC_DEVICE_ORCH_IDENTITY", app.DefaultDeviceOrchIdentity))
	if err != nil {
		log.Fatal(err)
	}
}