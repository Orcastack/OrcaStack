# Local Development

## Prerequisites

- Go 1.23
- Node.js 20+
- npm
- Docker Desktop or a compatible Docker daemon
- Make

## Native development

### Backend

The backend lives under `gitorcapi`.

Common commands:

```bash
make api-build
make gateway
make git
make review
make ci
make cd
make analytics
```

### Frontend

The frontend lives under `gitorcweb`.

Common commands:

```bash
make web-install
cd gitorcweb && npm run dev
cd gitorcweb && npm run build
```

## Docker development

The full local stack is defined in `docker-compose.yml`.

Start it with:

```bash
make up
```

Stop it with:

```bash
make down
```

## Default endpoints

### Frontend and platform

- UI: `http://localhost:5050`
- Gateway HTTP: `http://localhost:8080`
- Gateway gRPC: `localhost:9080`

### Backend services

- Git Service HTTP: `http://localhost:8081`
- Git Service gRPC: `localhost:9081`
- Review Service HTTP: `http://localhost:8086`
- Review Service gRPC: `localhost:9082`
- CI Service HTTP: `http://localhost:8083`
- CI Service gRPC: `localhost:9083`
- CD Service HTTP: `http://localhost:8084`
- CD Service gRPC: `localhost:9084`
- Analytics Service HTTP: `http://localhost:8085`
- Analytics Service gRPC: `localhost:9085`

### Data and infrastructure

- Postgres: `localhost:5432`
- Redpanda external Kafka listener: `localhost:19092`
- NameNode UI: `http://localhost:9870`
- NameNode RPC: `localhost:9000`
- DataNode UI: `http://localhost:9864`
- HBase master UI: `http://localhost:16010`
- HBase Thrift/API surface: `localhost:9090`
- ZooKeeper: `localhost:2181`

## Health checks

The Go services expose `/healthz` and `/metadata` on their HTTP ports.

Examples:

```bash
curl http://localhost:8080/healthz
curl http://localhost:8081/metadata
curl http://localhost:8083/healthz
```

## Known local runtime caveats

- Go services currently execute `go mod download` in the container startup command, so transient TLS or proxy failures can delay service readiness.
- The frontend container currently runs `npm install` before starting Vite, which can slow first boot.
- HBase and Hadoop take substantially longer to settle than Postgres or Redpanda.

## Recommended development workflow

1. Build the backend with `make api-build` before changing service entrypoints.
2. Build the frontend with `cd gitorcweb && npm run build` before changing Pages or container deployment logic.
3. Use Docker Compose when you need the full Postgres, HDFS, and HBase topology.
4. Use native service execution when you only need fast iteration on one Go service or the frontend.