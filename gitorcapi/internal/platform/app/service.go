package app

import (
	"context"
	"encoding/json"
	"log"
	"net"
	"net/http"
	"os"
	"os/signal"
	"syscall"
	"time"

	"github.com/atonixdev/gitorc/gitorcapi/internal/platform/security"
	"google.golang.org/grpc"
	"google.golang.org/grpc/health"
	healthpb "google.golang.org/grpc/health/grpc_health_v1"
)

type Config struct {
	Name               string
	HTTPPort           string
	GRPCPort           string
	Role               string
	Summary            string
	RegisterHTTPRoutes func(mux *http.ServeMux)
	ComponentType      string
	ComponentIdentity  string
	RepositoryIdentity string
	BuildHash          string
	PrivateKeyPath     string
	PublicKeyPath      string
	EnforceSigning     bool
	EnforceDirectory   bool
	LDAP               security.LDAPConfig
	RBAC               security.RBACConfig
}

func Run(ctx context.Context, cfg Config) error {
	logger := log.New(os.Stdout, cfg.Name+" ", log.LstdFlags|log.Lmicroseconds)

	runtimePolicy, err := security.BuildRuntimePolicy(security.RuntimeOptions{
		RepositoryIdentity: cfg.RepositoryIdentity,
		ComponentType:      cfg.ComponentType,
		ComponentIdentity:  cfg.ComponentIdentity,
		BuildHash:          cfg.BuildHash,
		PrivateKeyPath:     cfg.PrivateKeyPath,
		PublicKeyPath:      cfg.PublicKeyPath,
		LDAP:               cfg.LDAP,
		RBAC:               cfg.RBAC,
		ExecutablePath:     security.ExecutablePath(),
		EnforceSigning:     cfg.EnforceSigning,
		EnforceDirectory:   cfg.EnforceDirectory,
	})
	if err != nil {
		return err
	}

	policyPayload, err := json.Marshal(runtimePolicy)
	if err != nil {
		return err
	}
	logger.Printf("runtime policy %s", policyPayload)

	httpMux := http.NewServeMux()
	if cfg.RegisterHTTPRoutes != nil {
		cfg.RegisterHTTPRoutes(httpMux)
	}
	httpMux.HandleFunc("/healthz", func(w http.ResponseWriter, _ *http.Request) {
		w.Header().Set("Content-Type", "application/json")
		_, _ = w.Write([]byte(`{"status":"ok","service":"` + cfg.Name + `","role":"` + cfg.Role + `","identity":"` + runtimePolicy.ComponentIdentity.Raw + `"}`))
	})
	httpMux.HandleFunc("/metadata", func(w http.ResponseWriter, _ *http.Request) {
		w.Header().Set("Content-Type", "application/json")
		_, _ = w.Write([]byte(`{"name":"` + cfg.Name + `","role":"` + cfg.Role + `","summary":"` + cfg.Summary + `","identity":"` + runtimePolicy.ComponentIdentity.Raw + `","repository_identity":"` + runtimePolicy.RepositoryIdentity.Raw + `","process_identity":"` + runtimePolicy.ProcessIdentity.Raw + `"}`))
	})
	httpMux.HandleFunc("/security/runtime", func(w http.ResponseWriter, _ *http.Request) {
		w.Header().Set("Content-Type", "application/json")
		_ = json.NewEncoder(w).Encode(runtimePolicy)
	})

	httpServer := &http.Server{
		Addr:              ":" + cfg.HTTPPort,
		Handler:           withCORS(httpMux),
		ReadHeaderTimeout: 5 * time.Second,
	}

	grpcServer := grpc.NewServer()
	healthServer := health.NewServer()
	healthServer.SetServingStatus("", healthpb.HealthCheckResponse_SERVING)
	healthpb.RegisterHealthServer(grpcServer, healthServer)

	grpcListener, err := net.Listen("tcp", ":"+cfg.GRPCPort)
	if err != nil {
		return err
	}

	errCh := make(chan error, 2)

	go func() {
		logger.Printf("http listening on %s", httpServer.Addr)
		if serveErr := httpServer.ListenAndServe(); serveErr != nil && serveErr != http.ErrServerClosed {
			errCh <- serveErr
		}
	}()

	go func() {
		logger.Printf("grpc listening on :%s", cfg.GRPCPort)
		if serveErr := grpcServer.Serve(grpcListener); serveErr != nil {
			errCh <- serveErr
		}
	}()

	shutdownCtx, stop := signal.NotifyContext(ctx, os.Interrupt, syscall.SIGTERM)
	defer stop()

	select {
	case <-shutdownCtx.Done():
		logger.Printf("shutdown requested")
	case serveErr := <-errCh:
		logger.Printf("service failure: %v", serveErr)
	}

	grpcServer.GracefulStop()

	httpShutdownCtx, cancel := context.WithTimeout(context.Background(), 5*time.Second)
	defer cancel()

	return httpServer.Shutdown(httpShutdownCtx)
}

func withCORS(next http.Handler) http.Handler {
	allowedHeaders := "Content-Type, Authorization"
	allowedMethods := "GET, POST, PUT, PATCH, DELETE, OPTIONS"

	return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		origin := r.Header.Get("Origin")
		if origin == "" {
			origin = "*"
		}

		w.Header().Set("Access-Control-Allow-Origin", origin)
		w.Header().Set("Vary", "Origin")
		w.Header().Set("Access-Control-Allow-Headers", allowedHeaders)
		w.Header().Set("Access-Control-Allow-Methods", allowedMethods)

		if r.Method == http.MethodOptions {
			w.WriteHeader(http.StatusNoContent)
			return
		}

		next.ServeHTTP(w, r)
	})
}
