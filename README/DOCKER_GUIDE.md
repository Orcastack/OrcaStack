# Docker Guide

This guide covers the local container bootstrap for ORCASTACK. Docker Compose is only the local entry point; sovereign production deployment lives under `infra/terraform` and `infra/kubernetes`.

## Prerequisites

- Docker Engine
- Docker Compose v2
- Git

## Local bootstrap

```bash
make bootstrap-local
```

This starts:

- Postgres for metadata.
- Redpanda for event transport.
- NameNode, DataNode, and HBase for artifact and log-oriented storage.
- Gateway, Git, Review, CI, CD, and Analytics services.
- The web preview container.

## Key endpoints

- Gateway HTTP: `http://localhost:8080`
- Gateway gRPC: `localhost:9080`
- Git HTTP: `http://localhost:8081`
- CI service: `http://localhost:8083`
- CD service: `http://localhost:8084`
- Web preview: `http://localhost:5050`

## Common commands

```bash
docker compose up --build
docker compose logs -f gateway
docker compose logs -f ci-service
docker compose ps
docker compose down
```

## Local governance inputs

The local stack reads mounted secret references from `infra/security`:

- `orca-signing-private.pem`
- `orca-signing-public.pem`
- `ldap-bind-password.txt`

Do not commit real credentials.

## Promotion to private cloud

Use Docker Compose for local bootstrap only. For cluster deployment:

```bash
make infra-validate
terraform -chdir=infra/terraform/environments/private-cloud apply
make deploy-private-cloud
```
# Check if database is running
docker-compose ps

# Check database logs
docker-compose logs db

# Restart database
docker-compose restart db

# Rebuild database connection
docker-compose down -v
docker-compose up -d
```

### Frontend Not Loading

```bash
# Check frontend logs
docker-compose logs -f frontend

# Verify environment variables
docker-compose exec frontend env | grep REACT_APP

# Rebuild frontend
docker-compose build --no-cache frontend
docker-compose up -d frontend
```

### Static Files Not Loading

```bash
# Collect static files
docker-compose exec backend python manage.py collectstatic --noinput

# Check static volume
docker volume ls | grep static

# Restart nginx
docker-compose restart nginx
```

## Performance Optimization

### Database Optimization

```bash
# Access database
docker-compose exec db psql -U postgres personal_brand_hub

# Analyze tables
ANALYZE;

# Check index usage
SELECT * FROM pg_stat_user_indexes;
```

### Backend Optimization

```bash
# Scale workers
# Edit docker-compose.yml and change gunicorn workers:
# CMD ["gunicorn", "config.wsgi:application", "--workers", "8", "--bind", "0.0.0.0:8000"]

# Rebuild and restart
docker-compose build backend
docker-compose up -d backend
```

## Monitoring

### View Container Stats

```bash
# Real-time resource usage
docker stats

# Specific container
docker stats <container-name>
```

### Health Checks

```bash
# Check service health
docker-compose ps

# Manual health check
curl http://localhost:8000/health
curl http://localhost:3000
```

## Backup and Restore

### Backup Database

```bash
# Backup
docker-compose exec db pg_dump -U postgres personal_brand_hub > backup_$(date +%Y%m%d_%H%M%S).sql

# Backup with compression
docker-compose exec db pg_dump -U postgres personal_brand_hub | gzip > backup_$(date +%Y%m%d_%H%M%S).sql.gz
```

### Restore Database

```bash
# Restore from backup
cat backup.sql | docker-compose exec -T db psql -U postgres personal_brand_hub

# Restore from compressed backup
zcat backup.sql.gz | docker-compose exec -T db psql -U postgres personal_brand_hub
```

## Next Steps

1. **Monitor**: Set up monitoring with Docker Dashboard or Portainer
2. **SSL**: Add SSL certificates for HTTPS
3. **Backup**: Schedule automated database backups
4. **Scale**: Use Docker Swarm or Kubernetes for multi-server deployment
5. **CI/CD**: Integrate with GitHub Actions or GitLab CI for automated deployments
