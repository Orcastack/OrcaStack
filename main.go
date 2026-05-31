package main

import (
	"errors"
	"fmt"
	"net/http"
	"os"
	"os/exec"
	"path/filepath"
	"runtime"
	"strings"
	"time"
)

var (
	version = "dev"
	commit  = "unknown"
	date    = "unknown"
)

func main() {
	args := os.Args[1:]
	if len(args) == 0 {
		args = []string{"help"}
	}

	switch args[0] {
	case "help", "--help", "-h":
		printHelp()
	case "version", "--version", "-v":
		fmt.Printf("gitorc %s\ncommit: %s\nbuilt: %s\n", version, commit, date)
	case "serve":
		if err := runGateway(args[1:]); err != nil {
			fmt.Fprintf(os.Stderr, "gitorc serve: %v\n", err)
			os.Exit(1)
		}
	case "healthcheck":
		if err := healthcheck(); err != nil {
			fmt.Fprintf(os.Stderr, "gitorc healthcheck: %v\n", err)
			os.Exit(1)
		}
	default:
		fmt.Fprintf(os.Stderr, "unknown command %q\n\n", args[0])
		printHelp()
		os.Exit(1)
	}
}

func printHelp() {
	fmt.Println("GITORC launcher")
	fmt.Println()
	fmt.Println("Usage:")
	fmt.Println("  gitorc serve [gateway-args...]   Start the packaged gateway service")
	fmt.Println("  gitorc healthcheck               Check the configured gateway health endpoint")
	fmt.Println("  gitorc version                   Print build version")
	fmt.Println()
	fmt.Println("Environment:")
	fmt.Println("  GITORC_GATEWAY_BINARY            Override the packaged gitorc-gateway path")
	fmt.Println("  GITORC_GATEWAY_BASE              Override the healthcheck base URL (default http://127.0.0.1:8080)")
}

func runGateway(args []string) error {
	binaryPath, err := locateGatewayBinary()
	if err != nil {
		return err
	}

	cmd := exec.Command(binaryPath, args...)
	cmd.Stdout = os.Stdout
	cmd.Stderr = os.Stderr
	cmd.Stdin = os.Stdin
	cmd.Env = os.Environ()

	return cmd.Run()
}

func locateGatewayBinary() (string, error) {
	candidates := make([]string, 0, 6)
	if override := os.Getenv("GITORC_GATEWAY_BINARY"); override != "" {
		candidates = append(candidates, override)
	}

	if exePath, err := os.Executable(); err == nil {
		exeDir := filepath.Dir(exePath)
		candidates = append(candidates,
			filepath.Join(exeDir, "gitorc-gateway"),
			filepath.Join(exeDir, "..", "lib", "gitorc", "gitorc-gateway"),
		)
	}

	candidates = append(candidates,
		"/usr/lib/gitorc/gitorc-gateway",
		"/usr/local/lib/gitorc/gitorc-gateway",
		"gitorc-gateway",
	)

	for _, candidate := range candidates {
		if candidate == "" {
			continue
		}
		resolved := candidate
		if !filepath.IsAbs(candidate) {
			pathCandidate, err := exec.LookPath(candidate)
			if err != nil {
				continue
			}
			resolved = pathCandidate
		}

		info, err := os.Stat(resolved)
		if err == nil && !info.IsDir() {
			if runtime.GOOS == "windows" || info.Mode()&0o111 != 0 {
				return resolved, nil
			}
		}
	}

	return "", errors.New("packaged gitorc-gateway binary not found")
}

func healthcheck() error {
	base := os.Getenv("GITORC_GATEWAY_BASE")
	if base == "" {
		base = "http://127.0.0.1:8080"
	}

	base = strings.TrimRight(base, "/")
	client := &http.Client{Timeout: 5 * time.Second}
	resp, err := client.Get(base + "/healthz")
	if err != nil {
		return err
	}
	defer resp.Body.Close()

	if resp.StatusCode >= http.StatusBadRequest {
		return fmt.Errorf("unexpected status %s", resp.Status)
	}

	fmt.Println("gateway healthy")
	return nil
}