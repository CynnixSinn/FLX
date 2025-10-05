# FLX - Workflow Automation - Deployment Guide

This guide provides instructions for deploying the FLX Workflow Automation application to production.

## Prerequisites

- Docker and Docker Compose installed
- Domain name configured to point to your server
- SSL certificate (if using HTTPS)

## Environment Variables

Create a `.env` file in the root directory with the following variables:

```bash
# Application settings
NODE_ENV=production
PORT=5000
CLIENT_URL=https://yourdomain.com

# Database settings
DATABASE_URL="postgresql://flx_user:flx_password@db:5432/flx_db"

# Redis settings
REDIS_URL="redis://redis:6379"

# JWT settings
JWT_SECRET="your-super-secret-jwt-key-here-32-characters-at-least"
JWT_REFRESH_SECRET="your-super-secret-refresh-key-here"

# Security settings
RATE_LIMIT_WINDOW_MS=900000
RATE_LIMIT_MAX_REQUESTS=100

# Logging settings
LOG_LEVEL=info
```

## Docker Deployment

1. Build and start the services:
```bash
docker-compose up -d --build
```

2. Run database migrations (after first deployment):
```bash
# Access the app container
docker exec -it flx-app-1 bash

# Run Prisma migrations
npx prisma db push
npx prisma generate
```

3. View logs:
```bash
docker-compose logs -f
```

## SSL Configuration

To enable SSL:

1. Place your SSL certificate and key in the `ssl/` directory:
   - `ssl/cert.pem` - Your certificate
   - `ssl/key.pem` - Your private key

2. Update the nginx.conf to use SSL:
```nginx
server {
    listen 443 ssl;
    ssl_certificate /etc/nginx/ssl/cert.pem;
    ssl_certificate_key /etc/nginx/ssl/key.pem;
    
    # SSL settings
    ssl_protocols TLSv1.2 TLSv1.3;
    ssl_ciphers HIGH:!aNULL:!MD5;
    ssl_prefer_server_ciphers on;
}

# Redirect HTTP to HTTPS
server {
    listen 80;
    server_name yourdomain.com;
    return 301 https://$server_name$request_uri;
}
```

## Production Best Practices

1. **Security**:
   - Use strong, unique passwords for database and Redis
   - Keep JWT secrets secure and rotate them periodically
   - Regularly update Docker images
   - Monitor logs for suspicious activity

2. **Performance**:
   - Use a CDN for static assets
   - Optimize database queries
   - Implement caching strategies
   - Monitor resource usage

3. **Monitoring**:
   - Set up log aggregation
   - Monitor application health
   - Track error rates
   - Monitor database performance

## Backup and Recovery

### Database Backup
```bash
# Create backup
docker exec flx-db-1 pg_dump -U flx_user flx_db > backup.sql

# Restore backup
docker exec -i flx-db-1 psql -U flx_user flx_db < backup.sql
```

### Data Volumes
Docker volumes are used to persist data:
- PostgreSQL data at `postgres_data` volume
- Redis data at `redis_data` volume

## Scaling

For high availability, you can scale the app service:
```bash
docker-compose up -d --scale app=3
```

Note that for proper load balancing in a multi-instance setup, you might need:
- Sticky sessions for WebSocket connections
- Shared session storage (Redis)
- Proper database connection pooling

## Troubleshooting

### Common Issues

1. **Database Connection Issues**:
   - Verify environment variables
   - Check database container is running
   - Verify network connectivity between containers

2. **SSL Issues**:
   - Ensure certificates are properly formatted
   - Check file permissions
   - Verify certificate domain matches server name

3. **Performance Issues**:
   - Check resource utilization
   - Review database query performance
   - Monitor for memory leaks

### Useful Commands

```bash
# Check running containers
docker-compose ps

# View logs
docker-compose logs app
docker-compose logs db
docker-compose logs nginx

# Restart services
docker-compose restart app

# Stop services
docker-compose down
```

## Updating the Application

1. Pull the latest code:
```bash
git pull origin main
```

2. Rebuild and restart:
```bash
docker-compose up -d --build
```

3. Run any new database migrations:
```bash
# Access the app container
docker exec -it flx-app-1 bash

# Run Prisma migrations
npx prisma db push
npx prisma generate
```

## Health Checks

The application exposes a health check endpoint at:
- `GET /api/health`

This returns basic status information about the application and its dependencies.