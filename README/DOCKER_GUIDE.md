# Docker Commands Guide

This guide explains how to use Docker to build and deploy the gitorc project.

## Prerequisites

- Docker installed and running
- Docker Compose installed
- Git (for cloning the repository)

## Quick Start

### 1. Clone the Repository

```bash
git clone <repository-url>
cd gitorc
```

### 2. Configure Environment Variables

Copy the example environment file and customize it:

```bash
cp .env.example .env
```

Edit `.env` with your settings:
- Change `SECRET_KEY` to a secure value
- Update database credentials
- Configure `ALLOWED_HOSTS` and `CORS_ALLOWED_ORIGINS`

### 3. Build and Start Containers

```bash
# Build all services
docker-compose build

# Start all services in background
docker-compose up -d

# View logs
docker-compose logs -f
```

Services will be available at:
- **Backend API**: http://localhost:8000
- **Frontend**: http://localhost:3000
- **Database**: localhost:5432

## Common Docker Commands

### Building

```bash
# Build all services
docker-compose build

# Build specific service
docker-compose build backend
docker-compose build frontend

# Build with no cache
docker-compose build --no-cache
```

### Running

```bash
# Start all services in background
docker-compose up -d

# Start and view logs
docker-compose up

# Start specific service
docker-compose up -d backend
docker-compose up -d frontend

# Stop all services
docker-compose down

# Stop and remove volumes
docker-compose down -v
```

### Logs and Debugging

```bash
# View all logs
docker-compose logs

# Follow logs (live)
docker-compose logs -f

# Logs for specific service
docker-compose logs -f backend
docker-compose logs -f frontend
docker-compose logs -f db

# View last 100 lines
docker-compose logs --tail=100
```

### Database Management

```bash
# Access database shell
docker-compose exec db psql -U postgres -d personal_brand_hub

# Run migrations
docker-compose exec backend python manage.py migrate

# Create superuser
docker-compose exec backend python manage.py createsuperuser

# Add sample data
docker-compose exec backend python manage.py add_sample_discussions

# Backup database
docker-compose exec db pg_dump -U postgres personal_brand_hub > backup.sql
```

### Django Management

```bash
# Run shell
docker-compose exec backend python manage.py shell

# Collect static files
docker-compose exec backend python manage.py collectstatic

# Check deployment
docker-compose exec backend python manage.py check --deploy
```

### Container Operations

```bash
# List running containers
docker-compose ps

# Execute command in container
docker-compose exec backend bash
docker-compose exec frontend sh

# Restart services
docker-compose restart

# Restart specific service
docker-compose restart backend
```

### Cleaning Up

```bash
# Stop and remove containers
docker-compose down

# Remove all containers, volumes, and networks
docker-compose down -v

# Remove unused Docker resources
docker system prune

# Remove all Docker resources (be careful!)
docker system prune -a
```

## Production Deployment

### 1. Update Environment Variables

```bash
# Edit .env for production
DEBUG=False
SECRET_KEY=<generate-secure-key>
ALLOWED_HOSTS=yourdomain.com,www.yourdomain.com
CORS_ALLOWED_ORIGINS=https://yourdomain.com
REACT_APP_API_URL=https://yourdomain.com/api
NODE_ENV=production
```

### 2. Build Production Images

```bash
docker-compose -f docker-compose.yml build
```

### 3. Deploy to Server

```bash
# On your server, pull the latest code
git pull origin main

# Build and start services
docker-compose up -d

# Check status
docker-compose ps

# View logs
docker-compose logs -f
```

### 4. SSL/HTTPS Setup (Nginx)

Update nginx.conf with SSL certificates:

```nginx
server {
    listen 443 ssl http2;
    server_name yourdomain.com;

    ssl_certificate /path/to/cert.pem;
    ssl_certificate_key /path/to/key.pem;
    
    # ... rest of configuration
}
```

## Troubleshooting

### Port Already in Use

```bash
# Find process using port 8000
lsof -i :8000
# or on Windows
netstat -ano | findstr :8000

# Kill process
kill -9 <PID>
# or stop the container
docker-compose down
```

### Database Connection Error

```bash
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
