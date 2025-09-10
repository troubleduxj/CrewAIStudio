# CrewAI Studio Deployment Guide

## Overview

This guide covers the complete deployment process for CrewAI Studio, including database migration procedures, environment setup, and production deployment strategies.

## Table of Contents

1. [Prerequisites](#prerequisites)
2. [Environment Setup](#environment-setup)
3. [Database Migration Procedures](#database-migration-procedures)
4. [Development Deployment](#development-deployment)
5. [Production Deployment](#production-deployment)
6. [Docker Deployment](#docker-deployment)
7. [Troubleshooting](#troubleshooting)
8. [Rollback Procedures](#rollback-procedures)

## Prerequisites

### System Requirements

- **Python**: 3.8 or higher
- **Node.js**: 16.x or higher
- **Database**: SQLite (development) or PostgreSQL (production)
- **Docker**: Latest version (for containerized deployment)

### Required Tools

- Git
- Python pip
- Node.js npm/yarn
- Docker & Docker Compose (optional)

## Environment Setup

### 1. Clone Repository

```bash
git clone <repository-url>
cd crewai-studio
```

### 2. Backend Setup

```bash
cd backend

# Create virtual environment
python -m venv .venv

# Activate virtual environment
# Windows:
.venv\Scripts\activate
# Unix/Linux/Mac:
source .venv/bin/activate

# Install dependencies
pip install -r requirements.txt
```

### 3. Frontend Setup

```bash
cd frontend
npm install
```

### 4. Environment Configuration

Create environment files:

**Backend (.env)**:
```env
DATABASE_URL=sqlite:///./crewai_studio.db
SECRET_KEY=your-secret-key-here
DEBUG=True
CORS_ORIGINS=["http://localhost:3000"]
```

**Frontend (.env.local)**:
```env
NEXT_PUBLIC_API_URL=http://localhost:8000
```

## Database Migration Procedures

### Initial Setup

For new deployments, initialize the database with migrations:

```bash
cd backend

# Check migration status
alembic current

# Apply all migrations
alembic upgrade head
```

### Development Workflow

When making schema changes during development:

1. **Modify Models**: Edit SQLAlchemy models in `app/models/`

2. **Generate Migration**:
   ```bash
   # Using helper script (recommended)
   python -m scripts.migration_helpers generate -m "Add user preferences table"
   
   # Or directly with alembic
   alembic revision --autogenerate -m "Add user preferences table"
   ```

3. **Review Migration**: Always inspect the generated migration file in `alembic/versions/`

4. **Apply Migration**:
   ```bash
   # Using helper script
   python -m scripts.migration_helpers apply
   
   # Or directly with alembic
   alembic upgrade head
   ```

### Production Migration Workflow

For production deployments, follow these steps carefully:

#### Pre-Deployment Checklist

- [ ] Database backup completed and verified
- [ ] Migration tested on staging environment
- [ ] Rollback plan prepared
- [ ] Maintenance window scheduled (if needed)
- [ ] Team notified of deployment

#### Migration Steps

1. **Backup Database**:
   ```bash
   # PostgreSQL
   pg_dump -h localhost -U username -d crewai_studio > backup_$(date +%Y%m%d_%H%M%S).sql
   
   # SQLite
   cp crewai_studio.db crewai_studio_backup_$(date +%Y%m%d_%H%M%S).db
   ```

2. **Stop Application** (if required for migration):
   ```bash
   # Stop application servers
   systemctl stop crewai-studio
   # or
   docker compose down
   ```

3. **Apply Migrations**:
   ```bash
   cd backend
   
   # Check current status
   alembic current
   
   # Apply migrations
   alembic upgrade head
   
   # Verify migration success
   alembic current
   ```

4. **Verify Database Schema**:
   ```bash
   # Run validation script
   python -m scripts.migration_helpers validate
   ```

5. **Start Application**:
   ```bash
   # Start application servers
   systemctl start crewai-studio
   # or
   docker compose up -d
   ```

6. **Post-Deployment Verification**:
   - Check application logs for errors
   - Verify API endpoints are responding
   - Test critical functionality
   - Monitor performance metrics

## Development Deployment

### Local Development

1. **Start Backend**:
   ```bash
   cd backend
   python main.py
   ```

2. **Start Frontend**:
   ```bash
   cd frontend
   npm run dev
   ```

3. **Access Application**:
   - Frontend: http://localhost:3000
   - Backend API: http://localhost:8000
   - API Documentation: http://localhost:8000/docs

### Development with Docker

```bash
# Build and start all services
./deploy.ps1 build
./deploy.ps1 start

# Or using docker-compose directly
docker compose up --build
```

## Production Deployment

### Traditional Server Deployment

#### 1. Server Preparation

```bash
# Update system
sudo apt update && sudo apt upgrade -y

# Install Python and Node.js
sudo apt install python3 python3-pip nodejs npm postgresql-client -y

# Create application user
sudo useradd -m -s /bin/bash crewai
sudo su - crewai
```

#### 2. Application Setup

```bash
# Clone repository
git clone <repository-url> /home/crewai/crewai-studio
cd /home/crewai/crewai-studio

# Backend setup
cd backend
python3 -m venv .venv
source .venv/bin/activate
pip install -r requirements.txt

# Frontend setup
cd ../frontend
npm install
npm run build
```

#### 3. Database Setup

```bash
# Configure PostgreSQL connection in .env
DATABASE_URL=postgresql://username:password@localhost/crewai_studio

# Run migrations
cd backend
alembic upgrade head
```

#### 4. Process Management

Create systemd service files:

**Backend Service** (`/etc/systemd/system/crewai-backend.service`):
```ini
[Unit]
Description=CrewAI Studio Backend
After=network.target postgresql.service

[Service]
Type=simple
User=crewai
WorkingDirectory=/home/crewai/crewai-studio/backend
Environment=PATH=/home/crewai/crewai-studio/backend/.venv/bin
ExecStart=/home/crewai/crewai-studio/backend/.venv/bin/python main.py
Restart=always
RestartSec=3

[Install]
WantedBy=multi-user.target
```

**Frontend Service** (`/etc/systemd/system/crewai-frontend.service`):
```ini
[Unit]
Description=CrewAI Studio Frontend
After=network.target

[Service]
Type=simple
User=crewai
WorkingDirectory=/home/crewai/crewai-studio/frontend
ExecStart=/usr/bin/npm start
Restart=always
RestartSec=3

[Install]
WantedBy=multi-user.target
```

Enable and start services:
```bash
sudo systemctl enable crewai-backend crewai-frontend
sudo systemctl start crewai-backend crewai-frontend
```

### Cloud Deployment (Docker)

#### 1. Prepare Production Environment

Create production environment files:

**docker-compose.prod.yml**:
```yaml
version: '3.8'

services:
  backend:
    build: 
      context: ./backend
      dockerfile: Dockerfile
    environment:
      - DATABASE_URL=postgresql://postgres:password@db:5432/crewai_studio
      - DEBUG=False
    depends_on:
      - db
    restart: unless-stopped

  frontend:
    build:
      context: ./frontend
      dockerfile: Dockerfile
    environment:
      - NEXT_PUBLIC_API_URL=https://api.yourdomain.com
    restart: unless-stopped

  db:
    image: postgres:13
    environment:
      - POSTGRES_DB=crewai_studio
      - POSTGRES_USER=postgres
      - POSTGRES_PASSWORD=password
    volumes:
      - postgres_data:/var/lib/postgresql/data
    restart: unless-stopped

  nginx:
    image: nginx:alpine
    ports:
      - "80:80"
      - "443:443"
    volumes:
      - ./nginx.conf:/etc/nginx/nginx.conf
      - ./ssl:/etc/nginx/ssl
    depends_on:
      - backend
      - frontend
    restart: unless-stopped

volumes:
  postgres_data:
```

#### 2. Deploy with Migrations

```bash
# Build images
docker compose -f docker-compose.prod.yml build

# Start database first
docker compose -f docker-compose.prod.yml up -d db

# Wait for database to be ready
sleep 30

# Run migrations
docker compose -f docker-compose.prod.yml run --rm backend alembic upgrade head

# Start all services
docker compose -f docker-compose.prod.yml up -d
```

## Docker Deployment

### Using Provided Scripts

The project includes deployment scripts for easy Docker management:

```bash
# Build all services
./deploy.ps1 build

# Start services
./deploy.ps1 start

# Check status
./deploy.ps1 status

# View logs
./deploy.ps1 logs

# Stop services
./deploy.ps1 stop

# Clean up resources
./deploy.ps1 clean
```

### Manual Docker Commands

```bash
# Build and start
docker compose up --build -d

# View logs
docker compose logs -f

# Stop services
docker compose down

# Clean up
docker compose down -v --rmi all
```

## Troubleshooting

### Common Migration Issues

#### 1. "Target database is not up to date"

```bash
# Check current status
alembic current
alembic heads

# Apply missing migrations
alembic upgrade head
```

#### 2. "Multiple heads detected"

```bash
# List all heads
alembic heads

# Merge heads if needed
alembic merge -m "Merge migration branches" head1 head2
alembic upgrade head
```

#### 3. Migration fails with constraint errors

- Check for existing data that violates new constraints
- Add data cleanup to migration before adding constraints
- Consider making constraints nullable initially

#### 4. Database connection issues

```bash
# Test database connection
python -c "from app.core.database import engine; print(engine.execute('SELECT 1').scalar())"

# Check environment variables
echo $DATABASE_URL
```

### Application Issues

#### 1. Backend won't start

- Check Python virtual environment is activated
- Verify all dependencies are installed: `pip install -r requirements.txt`
- Check database connection in `.env` file
- Review application logs for specific errors

#### 2. Frontend build fails

- Clear node_modules and reinstall: `rm -rf node_modules && npm install`
- Check Node.js version compatibility
- Verify environment variables in `.env.local`

#### 3. Docker issues

- Check Docker daemon is running
- Verify docker-compose.yml syntax
- Check for port conflicts: `netstat -tulpn | grep :3000`
- Review container logs: `docker compose logs <service-name>`

## Rollback Procedures

### Application Rollback

#### 1. Code Rollback

```bash
# Rollback to previous commit
git log --oneline -10  # Find the commit to rollback to
git checkout <commit-hash>

# Or rollback to previous tag
git tag -l  # List available tags
git checkout <tag-name>
```

#### 2. Database Rollback

**⚠️ Warning**: Database rollbacks can result in data loss. Always backup before proceeding.

```bash
# Rollback one migration
alembic downgrade -1

# Rollback to specific revision
alembic downgrade <revision-id>

# Check rollback status
alembic current
```

#### 3. Full System Rollback

```bash
# Stop services
./deploy.ps1 stop

# Restore database backup
# PostgreSQL:
psql -h localhost -U username -d crewai_studio < backup_file.sql

# SQLite:
cp backup_file.db crewai_studio.db

# Rollback code
git checkout <previous-stable-commit>

# Rebuild and restart
./deploy.ps1 build
./deploy.ps1 start
```

### Emergency Procedures

#### 1. Complete System Recovery

If the system is completely broken:

```bash
# Stop all services
docker compose down

# Restore from backup
# ... restore database and code ...

# Reset to known good state
git checkout main  # or last known good commit
alembic upgrade head

# Restart services
docker compose up --build -d
```

#### 2. Data Recovery

If data is corrupted but application is working:

```bash
# Stop application to prevent further changes
./deploy.ps1 stop

# Restore database from backup
# ... restore procedures ...

# Verify data integrity
python -m scripts.migration_helpers validate

# Restart application
./deploy.ps1 start
```

## Monitoring and Maintenance

### Health Checks

Create monitoring scripts to check system health:

```bash
# Check application health
curl -f http://localhost:8000/health || echo "Backend down"
curl -f http://localhost:3000 || echo "Frontend down"

# Check database connectivity
python -c "from app.core.database import engine; engine.execute('SELECT 1')" || echo "Database down"
```

### Regular Maintenance

- **Daily**: Check application logs for errors
- **Weekly**: Review database performance and size
- **Monthly**: Update dependencies and security patches
- **Quarterly**: Full backup and disaster recovery testing

### Backup Strategy

- **Automated daily backups** of database
- **Weekly full system backups** including code and configuration
- **Monthly backup verification** and restore testing
- **Offsite backup storage** for disaster recovery

## Security Considerations

### Production Security Checklist

- [ ] Change default passwords and secret keys
- [ ] Enable HTTPS with valid SSL certificates
- [ ] Configure firewall rules
- [ ] Set up proper user permissions
- [ ] Enable database encryption
- [ ] Configure log rotation and monitoring
- [ ] Set up intrusion detection
- [ ] Regular security updates

### Environment Variables

Never commit sensitive information to version control:

```bash
# Use environment-specific .env files
.env.development
.env.staging  
.env.production

# Add to .gitignore
echo "*.env" >> .gitignore
echo ".env.*" >> .gitignore
```

## Support and Documentation

### Additional Resources

- [Migration Workflow Guide](../database/migration-workflow.md)
- [Migration Error Handling](../database/migration-errors.md)
- [Migration Utilities](../database/migration-utilities.md)
- [API Documentation](http://localhost:8000/docs)

### Getting Help

1. Check application logs first
2. Review this deployment guide
3. Check the troubleshooting section
4. Consult the project documentation
5. Contact the development team

### Useful Commands Reference

```bash
# Migration helpers
python -m scripts.migration_helpers status
python -m scripts.migration_helpers generate -m "message"
python -m scripts.migration_helpers apply
python -m scripts.migration_helpers rollback

# Docker management
./deploy.ps1 status
./deploy.ps1 logs
./deploy.ps1 restart

# System monitoring
docker compose ps
docker compose logs -f
systemctl status crewai-backend
systemctl status crewai-frontend
```