# Deployment

## Deployment surfaces in this repository

orcastack currently has two practical deployment targets:

- GitHub Pages for the frontend documentation/control-plane shell
- Docker Compose for local self-hosted platform development

## GitHub Pages

The Pages workflow lives in `.github/workflows/jekyll-gh-pages.yml`.

Even though the workflow file started from GitHub's Jekyll sample, it now builds the Vite frontend instead of a Jekyll site. The important deployment behavior is:

- the workflow installs frontend dependencies with `npm ci`
- it builds `orcastackweb`
- it uploads `orcastackweb/dist`
- it deploys with GitHub Pages actions
- the frontend base path is derived from the repository name at workflow runtime
- it signs the deployed frontend artifact and publishes a public verification key alongside it

### Pages requirements

To publish successfully:

1. Push the repository to the GitHub owner that should host the site.
2. Enable GitHub Pages in repository settings.
3. Set the Pages source to GitHub Actions.
4. The default Pages build runs in static snapshot mode and does not call a live gateway.
5. Let the Pages workflow run on `main` or dispatch it manually.

If you later host a real gateway, set `VITE_ORCASTACK_GATEWAY_URL` during the frontend build to switch the UI from static snapshot mode to live API calls.

### Important owner rule

The site host comes from the GitHub owner, not from the repository contents. For example:

- `orcastack/orcastack` publishes under `https://orcastack.github.io/orcastack/`
- `atonixcorp/orcastack` publishes under `https://atonixcorp.github.io/orcastack/`

## Docker Compose

The local deployment topology is defined in `docker-compose.yml` and includes:

- Postgres
- Redpanda
- Hadoop NameNode
- Hadoop DataNode
- HBase
- Gateway
- Git Service
- Review Service
- CI Service
- CD Service
- Analytics Service
- Web UI

The Go services now also receive explicit identity, signing, LDAP, and RBAC configuration through a shared Compose environment block. Secret material is expected under `infra/security/` and is mounted read-only into `/run/secrets` inside the Go containers.

Expected secret file names:

- `infra/security/orca-signing-private.pem`
- `infra/security/orca-signing-public.pem`
- `infra/security/ldap-bind-password.txt`

### Start the stack

```bash
docker compose up --build
```

### Stop the stack

```bash
docker compose down
```

## Production readiness notes

This repository is not yet packaged as a hardened production deployment. The current compose file is best treated as a local integration environment because:

- Go services still build and fetch modules during container startup.
- The web service still uses the Vite development server path.
- Secrets and runtime configuration are still minimal.
- There is no production-grade auth, ingress, persistence strategy, or observability layer yet.

## Recommended next hardening steps

1. Add Dockerfiles for all Go services and build static binaries ahead of runtime.
2. Build the frontend into static assets and serve it with a small web server image.
3. Move service configuration into explicit environment files or a config service.
4. Add real health checks for all application containers.
5. Introduce authentication, authorization, and audit-safe secret handling.

## GitHub Actions signing

The validation workflow now builds backend binaries, generates repository-owned Ed25519 keys during the workflow run, signs binary attestations with `orcastack-secctl`, and uploads signed artifacts.

The Pages workflow does the same for the frontend site artifact and publishes:

- `orca-attestation.json`
- `orca-public.pem`