# Docker Setup for Auto Stock Trading Platform

This document provides comprehensive instructions for running the Auto Stock Trading Platform using Docker.

## 🚀 Quick Start

### Prerequisites
- Docker Engine 20.10+
- Docker Compose 2.0+
- Make (optional, for convenience commands)

### Development Environment
```bash
# Clone the repository
git clone https://github.com/sonuafbrl/trading-boat.git
cd trading-boat

# Copy environment file and configure
cp .env.example .env
# Edit .env with your configuration

# Start development environment
make dev
# OR
docker-compose -f docker-compose.dev.yml up -d

# View logs
make dev-logs
```

### Production Environment
```bash
# Start production environment
make prod
# OR
docker-compose up -d

# View logs
make logs
```

## 📁 Docker Configuration Files

### Core Files
- `docker-compose.yml` - Production configuration
- `docker-compose.dev.yml` - Development configuration
- `backend/Dockerfile` - FastAPI backend container
- `frontend/Dockerfile` - React frontend container
- `frontend/nginx.conf` - Nginx configuration for frontend
- `backend/init.sql` - PostgreSQL database initialization

### Environment Files
- `.env.example` - Template for environment variables
- `.env` - Your local environment configuration (create from example)

## 🏗️ Architecture

### Services
1. **PostgreSQL Database** (`postgres`)
   - Port: 5432 (production), 5433 (development)
   - Database: `autotrader` / `autotrader_dev`
   - Persistent volume for data storage

2. **FastAPI Backend** (`backend`)
   - Port: 8000 (production), 8001 (development)
   - Python 3.12 with Poetry dependency management
   - Auto-reload enabled in development

3. **React Frontend** (`frontend`)
   - Port: 3000 (production), 3001 (development)
   - Nginx serving static files in production
   - Vite dev server in development

### Networking
- All services communicate through Docker internal network
- Frontend proxies API requests to backend via nginx
- Database is only accessible from backend service

## ⚙️ Configuration

### Environment Variables

#### Backend Configuration
```env
DATABASE_URL=postgresql://autotrader:password@postgres:5432/autotrader
SECRET_KEY=your-secret-key-change-in-production
SMTP_SERVER=smtp.gmail.com
SMTP_PORT=587
SMTP_USERNAME=your-email@gmail.com
SMTP_PASSWORD=your-app-password
FROM_EMAIL=your-email@gmail.com
TELEGRAM_BOT_TOKEN=your-telegram-bot-token
```

#### Frontend Configuration
```env
VITE_API_URL=http://localhost:8000
```

### Database Configuration
```env
POSTGRES_DB=autotrader
POSTGRES_USER=autotrader
POSTGRES_PASSWORD=autotrader_password
```

## 🔧 Available Commands

### Using Make (Recommended)
```bash
make help          # Show all available commands
make build         # Build all Docker images
make up            # Start production environment
make down          # Stop all services
make logs          # View logs from all services
make dev           # Start development environment
make clean         # Remove all containers and volumes
make health        # Check health of all services
make shell-backend # Open shell in backend container
make shell-db      # Open PostgreSQL shell
```

### Using Docker Compose Directly
```bash
# Production
docker-compose up -d
docker-compose down
docker-compose logs -f

# Development
docker-compose -f docker-compose.dev.yml up -d
docker-compose -f docker-compose.dev.yml down
docker-compose -f docker-compose.dev.yml logs -f
```

## 🏥 Health Checks

All services include health checks:
- **Backend**: `GET /healthz` endpoint
- **Frontend**: HTTP request to nginx
- **Database**: PostgreSQL ready check

Check service health:
```bash
make health
# OR
docker-compose ps
```

## 💾 Database Management

### Backup Database
```bash
make backup-db
# Creates backup_YYYYMMDD_HHMMSS.sql
```

### Restore Database
```bash
make restore-db FILE=backup_20240817_120000.sql
```

### Access Database Shell
```bash
make shell-db
# OR
docker-compose exec postgres psql -U autotrader -d autotrader
```

## 🔒 Security Features

### Container Security
- Non-root users in all containers
- Minimal base images (Alpine Linux)
- Read-only file systems where possible
- Resource limits configured

### Network Security
- Internal Docker network isolation
- No direct database access from outside
- Nginx reverse proxy for API requests

### Data Security
- Environment variables for sensitive data
- Encrypted broker credentials storage
- JWT token authentication
- Password hashing with bcrypt

## 🐛 Troubleshooting

### Common Issues

#### Services Won't Start
```bash
# Check logs
make logs

# Check service status
docker-compose ps

# Rebuild containers
make rebuild
```

#### Database Connection Issues
```bash
# Check database health
docker-compose exec postgres pg_isready -U autotrader -d autotrader

# View database logs
docker-compose logs postgres

# Reset database
docker-compose down -v
docker-compose up -d
```

#### Frontend Build Issues
```bash
# Rebuild frontend only
docker-compose build frontend
docker-compose up -d frontend

# Check frontend logs
docker-compose logs frontend
```

### Performance Optimization

#### Production Optimizations
- Multi-stage builds for smaller images
- Nginx gzip compression enabled
- PostgreSQL connection pooling
- Health checks for service monitoring

#### Development Optimizations
- Volume mounts for hot reloading
- Separate development configuration
- Debug logging enabled

## 📊 Monitoring

### Service Monitoring
```bash
# View resource usage
docker stats

# Check service health
make health

# View logs in real-time
make logs
```

### Application Monitoring
- Backend health endpoint: `http://localhost:8000/healthz`
- Frontend accessibility: `http://localhost:3000`
- Database connectivity via backend API

## 🚀 Deployment

### Production Deployment
1. Configure production environment variables
2. Build and start services: `make prod`
3. Verify health checks: `make health`
4. Monitor logs: `make logs`

### Scaling Services
```bash
# Scale backend instances
docker-compose up -d --scale backend=3

# Scale with load balancer (requires additional configuration)
```

## 📝 Development Workflow

### Local Development
1. Start development environment: `make dev`
2. Backend available at: `http://localhost:8001`
3. Frontend available at: `http://localhost:3001`
4. Database available at: `localhost:5433`

### Code Changes
- Backend: Auto-reload enabled, changes reflect immediately
- Frontend: Vite dev server with hot module replacement
- Database: Schema changes require container restart

### Testing
```bash
# Run tests in containers
make test

# Run specific tests
docker-compose exec backend python -m pytest tests/
docker-compose exec frontend npm test
```

This Docker setup provides a complete, production-ready environment for the Auto Stock Trading Platform with proper security, monitoring, and development workflow support.
