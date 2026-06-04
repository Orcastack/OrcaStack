# gitorc Wiki

gitorc is a self-hosted Git-centric DevOps platform intended for local machines, lab environments, and private infrastructure. The project combines owned Git services, Gerrit-style review workflows, CI/CD orchestration, and a data layer built around Postgres, Redpanda, HDFS, and HBase.

## What gitorc is trying to become

- A Git hosting and review control plane you can run yourself.
- A pipeline and deployment system that does not depend on SaaS CI providers.
- A platform data model that keeps operational metadata in Postgres and high-volume activity in HBase/HDFS.
- A foundation for risk scoring, delivery analytics, and policy automation.

## Current status

The repository is a working platform skeleton. It already has:

- A Go monorepo backend with separate gateway, Git, review, CI, CD, and analytics services.
- A React/Vite frontend that acts as the control-plane UI.
- A local Docker Compose topology with Postgres, Redpanda, Hadoop NameNode/DataNode, and HBase.
- A shared protobuf contract that defines the first service surface.
- GitHub Pages deployment for the frontend.

It does not yet have full Git packfile ingestion, durable review persistence, or real pipeline execution workers. Those are the next implementation slices.

## Wiki map

- [Architecture](Architecture.md)
- [Local Development](Local-Development.md)
- [Deployment](Deployment.md)
- [API Contracts](API-Contracts.md)
- [Security Directive](Security-Directive.md)
- [Roadmap](Roadmap.md)

## Repository layout

```text
gitorc/
├── gitorcapi/                  # Go services and protobuf contracts
│   ├── cmd/                    # Service entrypoints
│   ├── internal/               # Shared runtime and config helpers
│   └── proto/                  # gRPC service definitions
├── gitorcweb/                  # React/Vite control plane UI
├── docs/wiki/                  # Project wiki
├── infra/                      # Local infrastructure state and seeds
│   ├── postgres/init/          # Metadata schema bootstrap
│   ├── git/repos/              # Bare repository storage
│   ├── artifacts/              # Artifact staging area
│   └── deploy/                 # Deployment-related assets
├── .github/workflows/          # CI and Pages workflows
├── .gitorc-ci.yml              # Example internal pipeline config
├── docker-compose.yml          # Local stack definition
└── Makefile                    # Common development commands
```

## Platform at a glance

### Control plane services

- `gitorc-gateway`: single HTTP/gRPC entrypoint for UI-facing and external traffic.
- `gitorc-git-service`: repository metadata, refs, commits, trees, and future push ingestion.
- `gitorc-review-service`: changes, patchsets, votes, and policy evaluation.
- `gitorc-ci-service`: pipeline orchestration and future worker control.
- `gitorc-cd-service`: deployment promotion and rollback orchestration.
- `gitorc-analytics-service`: analytics and intelligence APIs backed by large-volume event storage.

### Data and infrastructure services

- Postgres stores relational metadata such as users, projects, repositories, changes, and deployments.
- Redpanda carries internal event traffic.
- HDFS stores artifacts and large analytic inputs.
- HBase stores logs, comments, audit streams, and other high-volume records.

## Recommended reading order

1. Start with [Architecture](Architecture.md) to understand the platform model.
2. Use [Local Development](Local-Development.md) to run the stack locally.
3. Use [Deployment](Deployment.md) for GitHub Pages and container runtime notes.
4. Review [API Contracts](API-Contracts.md) before adding backend features.
5. Read [Security Directive](Security-Directive.md) before changing service identity, signing, or authorization behavior.
6. Use [Roadmap](Roadmap.md) to plan the next implementation slice.