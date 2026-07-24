# API Contracts

## Source of truth

The first shared service contract lives in:

`orcastackapi/proto/orcastack/platform/v1/platform.proto`

The protobuf package is `orcastack.platform.v1`.

## Service overview

### GitService

Operations currently defined:

- `CreateRepository`
- `ListRepositories`
- `ListRefs`
- `GetCommit`
- `GetFile`
- `DiffCommits`

This service establishes the core repository inspection surface for the platform.

### ReviewService

Operations currently defined:

- `UpsertChangeFromPush`
- `Vote`

This is the initial review workflow entrypoint.

### CIService

Operations currently defined:

- `StartPipeline`

This is the first orchestration surface for pipeline execution.

### CDService

Operations currently defined:

- `StartDeployment`

This service owns delivery actions from successful pipelines.

### AnalyticsService

Operations currently defined:

- `GetProjectAnalytics`

This is the first consumer-facing analytics surface.

## Core message types

### Repository

- `id`
- `name`
- `owner`
- `visibility`

### Change

- `id`
- `repository_id`
- `target_branch`
- `status`

### Pipeline

- `id`
- `repository_id`
- `commit_sha`
- `status`

### Deployment

- `id`
- `pipeline_id`
- `environment`
- `status`

### Commit

- `id`
- `author`
- `email`
- `message`
- `committed_at_epoch`

### Insight

- `key`
- `value`

## Design implications

- The current contract is intentionally thin and optimized for platform scaffolding.
- The next major expansion points are authentication, richer repository browsing, review comments, pipeline execution details, and deployment histories.
- The presence of both HTTP and gRPC service ports suggests an internal model where gRPC carries service-to-service traffic while HTTP supports health, metadata, and future external APIs.