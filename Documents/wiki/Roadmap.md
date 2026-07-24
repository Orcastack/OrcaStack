# Roadmap

## Current maturity

orcastack is in the platform-foundation stage. The repository already expresses the intended system shape, but most domain behavior is still scaffolded rather than fully implemented.

## What is already in place

- Go service entrypoints for gateway, Git, review, CI, CD, and analytics
- Shared runtime behavior with health and metadata endpoints
- A protobuf contract for the first cross-service interface
- A React/Vite frontend shell
- A local stack with Postgres, Redpanda, Hadoop, and HBase
- GitHub Pages deployment for the frontend

## Highest-value next slices

### 1. Real Git service behavior

- repository initialization
- ref listing backed by storage
- commit and tree inspection against real repositories
- push ingestion and packfile handling

### 2. Review persistence and workflows

- store changes and patchsets in Postgres
- persist votes and labels
- implement merge rules and submit checks
- add inline comments and review timelines

### 3. Event backbone

- define domain events such as `push_event`, `change_updated`, and `pipeline_finished`
- publish and consume them through Redpanda
- create consistent event envelopes and idempotency rules

### 4. Real CI execution

- parse and execute `.orcastack-ci.yml`
- manage workers and step logs
- stream logs to HBase
- store artifacts in HDFS or an artifact abstraction

### 5. Delivery workflows

- implement deployment records and status transitions
- add environment definitions and promotion policy
- support rollback and audit trails

### 6. Analytics and intelligence

- derive branch health and delivery metrics
- compute risk and failure patterns
- expose project dashboards and trend APIs

## Operational hardening backlog

- replace runtime `go mod download` in containers with prebuilt images
- replace the dev-server-based web container with a production static serving image
- add stronger container health checks
- add authn/authz and secure secret handling
- add observability, tracing, and structured logs

## Documentation backlog

- architecture decision records
- schema reference for Postgres bootstrap tables
- event catalog
- service-by-service implementation notes
- operator runbook for HBase/Hadoop startup and troubleshooting