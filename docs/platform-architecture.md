# gitorc platform architecture

## Core flow

1. A developer pushes code into the Git Service.
2. Git Service emits an event for branch updates or review uploads.
3. Review Service creates or updates a Change and evaluates rules.
4. CI Service runs `.gitorc-ci.yml`, streams logs into HBase, and stores artifacts in HDFS.
5. CD Service promotes successful artifacts into target environments.
6. Analytics Service computes risk, quality, and productivity insights from the event and log stream.

## Storage model

- Postgres: users, projects, repositories, changes, pipelines, deployments, rules.
- HBase: CI logs, inline comments, audit events, and high-volume activity streams.
- HDFS: artifacts, archived logs, and analytics job inputs/outputs.
- Filesystem: bare Git repositories under `infra/git/repos` locally, later movable to dedicated storage.

## Internal contracts

The initial gRPC surface is declared in `gitorcapi/proto/gitorc/platform/v1/platform.proto` and includes:

- Repository creation and listing
- Refs and commit queries
- File and diff retrieval
- Review change upsert and voting
- Pipeline start
- Deployment start
- Project analytics retrieval

## Recommended next delivery slices

1. Implement repository initialization, ref listing, and commit inspection in `gitorc-git-service`.
2. Persist changes and patchsets in `gitorc-review-service` using Postgres.
3. Add an event publisher/consumer layer over Redpanda for `push_event`, `change_merged`, and `pipeline_finished`.
4. Build a job runner in `gitorc-ci-service` that interprets `.gitorc-ci.yml`.
5. Add HBase/HDFS adapters and analytics batch jobs.
