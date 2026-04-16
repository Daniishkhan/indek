SHELL := /bin/bash

PNPM ?= pnpm
FRONTEND_APP ?= web
BACKEND_DIR ?= apps/api

.PHONY: help install dev frontend-dev backend-dev build frontend-build backend-build lint frontend-lint backend-lint typecheck frontend-typecheck backend-typecheck clean structure

help:
	@echo "Indek development commands"
	@echo ""
	@echo "  make install            Install workspace dependencies"
	@echo "  make dev                Run the full local dev environment"
	@echo "  make frontend-dev       Run the frontend app"
	@echo "  make backend-dev        Run the backend app if present"
	@echo "  make build              Build all available apps"
	@echo "  make lint               Lint all available apps"
	@echo "  make typecheck          Typecheck all available apps"
	@echo "  make structure          Print the current app structure"
	@echo "  make clean              Remove generated build artifacts"

install:
	$(PNPM) install

dev:
	@if [ -f "$(BACKEND_DIR)/package.json" ]; then \
		echo "Starting frontend and backend..."; \
		trap 'kill 0' EXIT; \
		$(MAKE) frontend-dev & \
		$(MAKE) backend-dev & \
		wait; \
	else \
		echo "No standalone backend app found at $(BACKEND_DIR). Starting frontend only..."; \
		$(MAKE) frontend-dev; \
	fi

frontend-dev:
	$(PNPM) --filter $(FRONTEND_APP) dev

backend-dev:
	@if [ -f "$(BACKEND_DIR)/package.json" ]; then \
		$(PNPM) --dir $(BACKEND_DIR) dev; \
	else \
		echo "No backend app scaffolded yet."; \
	fi

build: frontend-build backend-build

frontend-build:
	$(PNPM) --filter $(FRONTEND_APP) build

backend-build:
	@if [ -f "$(BACKEND_DIR)/package.json" ]; then \
		$(PNPM) --dir $(BACKEND_DIR) build; \
	else \
		echo "Skipping backend build: no standalone backend app scaffolded yet."; \
	fi

lint: frontend-lint backend-lint

frontend-lint:
	$(PNPM) --filter $(FRONTEND_APP) lint

backend-lint:
	@if [ -f "$(BACKEND_DIR)/package.json" ]; then \
		$(PNPM) --dir $(BACKEND_DIR) lint; \
	else \
		echo "Skipping backend lint: no standalone backend app scaffolded yet."; \
	fi

typecheck: frontend-typecheck backend-typecheck

frontend-typecheck:
	$(PNPM) --filter $(FRONTEND_APP) typecheck

backend-typecheck:
	@if [ -f "$(BACKEND_DIR)/package.json" ]; then \
		$(PNPM) --dir $(BACKEND_DIR) typecheck; \
	else \
		echo "Skipping backend typecheck: no standalone backend app scaffolded yet."; \
	fi

structure:
	@echo "Frontend:"
	@echo "  - apps/web"
	@echo "Backend today:"
	@echo "  - Next.js server runtime inside apps/web"
	@echo "  - packages/domain for business logic"
	@echo "  - packages/db for data access and seed data"
	@echo "Shared:"
	@echo "  - packages/shared for shared types"
	@echo ""
	@echo "Planned dedicated backend location:"
	@echo "  - $(BACKEND_DIR)"

clean:
	find . -name ".next" -type d -prune -exec rm -rf {} +
	find . -name "dist" -type d -prune -exec rm -rf {} +
	find . -name "*.tsbuildinfo" -type f -delete
