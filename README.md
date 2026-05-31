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
