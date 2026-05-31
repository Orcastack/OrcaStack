# gitorc

GITORC is a Git-centric automation platform for private-cloud environments. This repository is the implementation base, bootstrap entry point, audit trail, and architecture reference for the platform.

## Platform overview

GITORC operates as the governed automation layer for private-cloud software delivery. It brings together Git workflows, CI/CD execution, policy enforcement, release movement, and infrastructure automation in one control surface for platform teams and operators.

## Repository composition

This repository is organized around a few clear platform domains rather than a loose folder tree:

| Domain | Purpose |
| --- | --- |
| `gitorcapi/` | Go services, gateway APIs, platform logic, and protobuf contracts. |
| `gitorcweb/` | Control-plane UI for operators, reviewers, and governed workflow execution. |
| `infra/` | Private-cloud infrastructure assets, deployment environments, runtime policy, bootstrap data, and artifact staging. |
| `docs/` | Platform architecture, installation, deployment guidance, and workflow documentation. |
| CI definitions | Governed validation and signed artifact workflows across GITORC CI, GitHub Actions, and GitLab CI. |
| Local runtime | Docker Compose and bootstrap assets for local platform bring-up. |

## Operating model

GITORC covers the core operating surface required to build, validate, promote, and deploy software into private-cloud environments:

- Git-centric repository workflows and control plane APIs.
- Web UI for platform operations and governed delivery.
- CI/CD runners, pipelines, and promotion lanes.
- OpenStack and Kubernetes automation for private-cloud rollout.
- Identity-linked RBAC, signing, attestation, and runtime policy enforcement.
- Linux packages, release artifacts, and delivery automation.

GITORC does not include firmware, drivers, or device runtimes.

## Quick start

Use the repository as the bootstrap entry point for local bring-up and private-cloud validation.

### Local bootstrap

```bash
make bootstrap-local
curl http://localhost:8080/healthz
```

### Private-cloud validation

```bash
make infra-validate
```

### Private-cloud rollout

```bash
terraform -chdir=infra/terraform/environments/private-cloud apply
make deploy-private-cloud
```

## Documentation

- [Platform architecture](docs/platform-architecture.md)
- [Private-cloud deployment](docs/Private-Cloud-Deployment.md)
- [CI/CD engine](docs/CI-CD-Engine.md)
- [Cloud automation workflows](docs/Cloud-Automation-Workflows.md)
- [Installation](docs/Installation.md)
- [Infrastructure overview](infra/README.md)

## Why this repository matters

This repository is not only source code. It is the implementation boundary, control-plane reference, deployment bootstrap, and documentation surface for the platform. For engineering teams, it is where GITORC is built and governed. For operators, it is where architecture, rollout mechanics, and release movement remain auditable.
