# gitorc

gitorc is a self-hosted Git-centric DevOps platform blueprint for local machines and private infrastructure.

## Monorepo structure

```text
gitorc/
├── gitorcapi/                  # Go services and protobuf contracts
│   ├── cmd/                    # Executable services
│   ├── internal/               # Shared runtime code
│   └── proto/                  # gRPC contracts
├── gitorcweb/                  # React/Vite control plane UI
├── infra/                      # Local runtime infrastructure and seed assets
│   ├── postgres/init/          # Metadata schema
│   ├── git/repos/              # Bare repositories storage
│   ├── artifacts/              # Local artifact staging
│   └── deploy/environments/    # Deployment targets
├── .gitorc-ci.yml              # Internal pipeline definition example
└── docker-compose.yml          # Local self-hosted stack
```

## Services

- `gitorc-git-service`: repository ownership, refs, commit/tree/file lookups, push ingestion.
- `gitorc-review-service`: changes, patchsets, comments, approvals, merge rules.
- `gitorc-ci-service`: pipeline orchestration, worker scheduling, logs and artifacts.
- `gitorc-cd-service`: deployments and rollback orchestration.
- `gitorc-analytics-service`: HBase/Hadoop-backed intelligence and metrics.
- `gitorc-gateway`: single API entrypoint for the UI and future external clients.

## Local quick start

1. Start infrastructure and services with `docker compose up --build`.
2. Open the UI at `http://localhost:5050`.
3. Check service health at `http://localhost:8080/healthz` through `http://localhost:8085/healthz`.
4. Extend the proto contracts in `gitorcapi/proto/gitorc/platform/v1/platform.proto` and implement handlers service by service.

## Current state

This commit establishes the platform skeleton and local runtime topology. It does not yet implement Git packfile handling, review persistence, pipeline execution, or HBase/HDFS writers. Those belong in the next implementation slices, but the repo is now structured around the intended platform instead of an unrelated application layout.

## Wiki

Project documentation now lives in the wiki pages under `docs/wiki`.

- `docs/wiki/Home.md`
- `docs/wiki/Architecture.md`
- `docs/wiki/Local-Development.md`
- `docs/wiki/Deployment.md`
- `docs/wiki/API-Contracts.md`
- `docs/wiki/Security-Directive.md`
- `docs/wiki/Roadmap.md`

Use `README/DOCUMENTATION_INDEX.md` as the navigation entrypoint.
