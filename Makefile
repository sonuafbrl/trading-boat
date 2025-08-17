# Auto Stock Trading Platform - Docker Commands

.PHONY: help build up down logs clean dev prod test

help: ## Show this help message
	@echo "Auto Stock Trading Platform - Docker Commands"
	@echo ""
	@echo "Available commands:"
	@grep -E '^[a-zA-Z_-]+:.*?## .*$$' $(MAKEFILE_LIST) | sort | awk 'BEGIN {FS = ":.*?## "}; {printf "\033[36m%-20s\033[0m %s\n", $$1, $$2}'

build: ## Build all Docker images
	docker compose build

up: ## Start all services in production mode
	docker compose up -d

down: ## Stop all services
	docker compose down

logs: ## View logs from all services
	docker compose logs -f

clean: ## Remove all containers, volumes, and images
	docker compose down -v --rmi all

dev: ## Start development environment
	docker compose -f docker-compose.dev.yml up -d

dev-logs: ## View development logs
	docker compose -f docker-compose.dev.yml logs -f

dev-down: ## Stop development environment
	docker compose -f docker-compose.dev.yml down

prod: ## Start production environment
	docker compose up -d

test: ## Run tests in containers
	docker compose exec backend python -m pytest
	docker compose exec frontend npm test

shell-backend: ## Open shell in backend container
	docker compose exec backend bash

shell-frontend: ## Open shell in frontend container
	docker compose exec frontend sh

shell-db: ## Open PostgreSQL shell
	docker compose exec postgres psql -U autotrader -d autotrader

backup-db: ## Backup database
	docker compose exec postgres pg_dump -U autotrader autotrader > backup_$(shell date +%Y%m%d_%H%M%S).sql

restore-db: ## Restore database (usage: make restore-db FILE=backup.sql)
	docker compose exec -T postgres psql -U autotrader autotrader < $(FILE)

health: ## Check health of all services
	docker compose ps
	@echo "\nHealth checks:"
	@docker compose exec backend curl -f http://localhost:8000/healthz || echo "Backend health check failed"
	@docker compose exec frontend curl -f http://localhost:80 || echo "Frontend health check failed"
	@docker compose exec postgres pg_isready -U autotrader -d autotrader || echo "Database health check failed"

restart: ## Restart all services
	docker compose restart

rebuild: ## Rebuild and restart all services
	docker compose down
	docker compose build --no-cache
	docker compose up -d
