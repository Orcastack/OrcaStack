# gitorc

gitorc is a sovereign Git-centric automation platform for private cloud environments. This repository is the implementation base, bootstrap entry point, audit trail, and architecture reference for the platform.

## Monorepo structure

```text
gitorc/
├── gitorcapi/                         # Go services and protobuf contracts
├── gitorcweb/                         # Control plane UI
├── infra/                             # Private-cloud infrastructure and runtime policy
│   ├── terraform/                     # OpenStack + Kubernetes provisioning
│   ├── kubernetes/                    # Platform manifests for runners, ingress, storage, ops
│   ├── policy/                        # Runtime governance and attestation enforcement
│   ├── deploy/environments/           # Dev, stage, and prod promotion targets
│   ├── postgres/init/                 # Metadata bootstrap schema
│   ├── git/repos/                     # Local bootstrap repository storage
│   └── artifacts/                     # Artifact staging for local development
├── docs/                              # Architecture, deployment, and platform documentation
├── .gitorc-ci.yml                     # GITORC governed pipeline definition
├── .github/workflows/ci-cd.yml        # Validation and signed artifact workflow
├── .gitlab-ci.yml                     # GitLab validation workflow
└── docker-compose.yml                 # Local bootstrap stack
```

## Platform scope

GITORC includes:

- CLI and control plane APIs.
- Web UI.
- CI/CD runners and governed promotion lanes.
- OpenStack and Kubernetes private-cloud infrastructure.
- Keystone-linked identity, RBAC, signing, and runtime policy enforcement.

GITORC does not include operating-system installers, firmware, drivers, or device runtimes.

## Quick start

Local bootstrap:

```bash
make bootstrap-local
curl http://localhost:8080/healthz
```

Private-cloud validation:

```bash
make infra-validate
```

Private-cloud rollout:

```bash
terraform -chdir=infra/terraform/environments/private-cloud apply
make deploy-private-cloud
```

## Documentation

- [Platform architecture](docs/platform-architecture.md)
- [Private-cloud deployment](docs/Private-Cloud-Deployment.md)
- [CI/CD engine](docs/CI-CD-Engine.md)
- [Cloud automation workflows](docs/Cloud-Automation-Workflows.md)
- [Infrastructure overview](infra/README.md)
