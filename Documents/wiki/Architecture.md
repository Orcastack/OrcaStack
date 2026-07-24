# Architecture

## Design goals

orcastack is designed around one core idea: the Git host, code review system, CI/CD engine, and analytics layer should belong to the same self-hosted platform. Instead of bolting together disconnected tools, the repository defines one internal service model and one data flow.

## End-to-end flow

1. A developer creates or updates a repository in the Git Service.
2. A branch update or review upload emits an internal event.
3. Review Service creates or updates a change, patchset, and review state.
4. CI Service starts a pipeline from `.orcastack-ci.yml` or a future pipeline definition source.
5. CI logs and audit streams are written to HBase, while artifacts land in HDFS or a compatible artifact layer.
6. CD Service promotes approved artifacts into target environments.
7. Analytics Service computes branch, delivery, and risk insights from event history and operational records.

## Service responsibilities

### Gateway

- Exposes the main HTTP and gRPC entrypoint.
- Aggregates backend services for the control-plane UI.
- Will eventually handle auth, routing, and versioned external APIs.

### Git Service

- Owns repository registration and listing.
- Exposes refs, commit metadata, file reads, and diff operations.
- Will eventually own packfile ingestion and server-side Git protocol flows.

### Review Service

- Tracks changes and patchsets derived from pushes.
- Stores votes, labels, and merge policy decisions.
- Will evolve toward Gerrit-style submit rules and gated merges.

### CI Service

- Starts pipelines for commits and review events.
- Will schedule workers, manage logs, and track artifacts.
- Connects naturally to Redpanda for event-driven execution.

### CD Service

- Promotes artifacts across environments.
- Records deployment history and rollback state.
- Will eventually expose progressive delivery and policy checks.

### Analytics Service

- Serves project-level insights and platform metrics.
- Consumes high-volume data from the event and log streams.
- Is the natural place for delivery intelligence, risk scoring, and behavioral analytics.

## Storage model

### Postgres

Use Postgres for strongly relational control-plane data:

- users
- projects
- repositories
- changes
- patchsets
- pipeline runs
- deployments
- approval rules

### HBase

Use HBase for high-volume or append-heavy records:

- CI log lines
- inline review comments
- audit history
- activity streams
- derived event materializations

### HDFS

Use HDFS for:

- build artifacts
- archived logs
- large analytics inputs and outputs
- future snapshots and long-lived blobs

### Filesystem

The local development topology keeps bare repositories under `infra/git/repos`. This is intentionally simple for early development and can later move to dedicated object or block storage.

## Contracts

The first shared contract is defined in `orcastackapi/proto/orcastack/platform/v1/platform.proto` and currently covers:

- repository creation and listing
- ref listing
- commit lookup
- file retrieval
- commit diffing
- change upsert from push
- review voting
- pipeline start
- deployment start
- project analytics retrieval

## Frontend role

The current frontend is a React/Vite control-plane shell. It is intentionally thin right now and acts as a landing surface for:

- service visibility
- local endpoint discovery
- future project, review, and pipeline views

## Architectural constraints to know

- Docker Compose currently starts Go services by downloading modules at runtime, which is fragile under poor network conditions.
- The web service currently uses a development server in the container, which is acceptable for local iteration but not ideal for production packaging.
- HBase and Hadoop are heavy services and take longer to become ready than the rest of the stack.