# ORCASTACK Private-Cloud Infrastructure

The `infra/` tree contains the sovereign infrastructure definition for ORCASTACK. It is the source of truth for local bootstrap, private-cloud deployment, runtime governance, and operational policy.

## Layout

```text
infra/
├── artifacts/                       # Artifact staging and signed build outputs
├── deploy/
│   └── environments/                # Promotion targets and deployment policies
├── git/
│   └── repos/                       # Local bare repository storage for bootstrap
├── kubernetes/
│   ├── base/                        # Shared namespaces and platform primitives
│   └── platform/                    # Ingress, runners, monitoring, logging, storage, secrets
├── ansible/                         # Imperative cloud automation from ORCASTACK workflows
├── automation/
│   └── workflows/                   # Cloud bootstrap and release workflow definitions
├── policy/
│   ├── kyverno/                     # Admission and attestation enforcement
│   └── opa/                         # Runtime governance policies
├── postgres/
│   └── init/                        # Metadata bootstrap schema
├── security/                        # Mounted local secret references only
└── terraform/
    ├── environments/private-cloud/  # OpenStack + Kubernetes composition layer
    └── modules/                     # Provider modules for networking, identity, storage, runners, platform
```

## What This Stack Covers

- OpenStack networking: networks, subnets, routers, floating IPs, and load balancer attachment.
- Proxmox VE bootstrap for bare-metal and VM-hosted capacity.
- OpenStack identity: Keystone projects, service users, roles, and application credentials.
- OpenStack storage: Cinder classes, Barbican secrets, and Kubernetes storage integration points.
- OVN, OVS, and FRR network automation for routed cluster fabrics.
- Kubernetes platform modules: namespaces, storage classes, PVC-backed services, ingress, and service accounts.
- Rancher registration and cluster lifecycle automation.
- ORCASTACK self-hosting automation for bootstrap, upgrade, and self-monitoring.
- CI/CD runner infrastructure: dedicated runner pools, runner service accounts, and workload isolation.
- GPU worker enablement for accelerated workloads.
- Monitoring and logging: Prometheus/Loki-oriented manifests and scrape configuration.
- Secrets management: Barbican-backed secret references and CSI sync definitions.
- Runtime policy enforcement: Kyverno admission policy and OPA governance package.

## Deployment Model

1. Provision the private-cloud foundation with Terraform from `terraform/environments/private-cloud`.
2. Run the cloud bootstrap automation from `automation/workflows/cloud-bootstrap.yaml` using the Ansible playbooks in `ansible/`.
3. Apply the Kubernetes manifests from `kubernetes/base` and `kubernetes/platform` into the target cluster.
4. Reconcile self-hosting and platform upgrade flows from `automation/workflows/platform-self-hosting.yaml`.
5. Configure environment promotion in `deploy/environments/`.
6. Enforce artifact and runtime governance from `policy/`.

## Constraints

- This stack targets private OpenStack, private Kubernetes, Keystone-backed identity, and internal runtime governance.
- No hyperscaler resources are referenced.
- Do not commit real secrets into this repository.