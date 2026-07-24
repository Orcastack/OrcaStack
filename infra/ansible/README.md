# ORCASTACK Cloud Automation Playbooks

These Ansible playbooks define the imperative automation layer that ORCASTACK executes from pipelines after Terraform provisions the required infrastructure primitives.

## Coverage

- Proxmox VE bootstrap for bare-metal and VM hosts.
- OpenStack control-plane preparation.
- OVN, OVS, and FRR network fabric configuration.
- Kubernetes cluster preparation and Rancher registration.
- Rancher lifecycle reconciliation for RBAC mapping, upgrades, and monitoring policy.
- GPU worker enablement.
- Prometheus and Grafana observability bootstrap.

## Entry points

- `playbooks/proxmox-bootstrap.yml`
- `playbooks/openstack-control-plane.yml`
- `playbooks/network-fabric.yml`
- `playbooks/kubernetes-cluster.yml`
- `playbooks/rancher-register.yml`
- `playbooks/rancher-lifecycle.yml`
- `playbooks/gpu-workers.yml`
- `playbooks/observability-stack.yml`