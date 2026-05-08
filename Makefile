.PHONY: help dev build preview shell down clean

.DEFAULT_GOAL := help

help:
	@printf '%s\n' 'DailyStampMaker commands'
	@printf '%s\n' ''
	@printf '%-14s %s\n' 'make dev' 'Start Vite dev server with Docker Compose'
	@printf '%-14s %s\n' 'make build' 'Build static files inside Docker'
	@printf '%-14s %s\n' 'make preview' 'Preview built app inside Docker'
	@printf '%-14s %s\n' 'make shell' 'Open a shell in the app container'
	@printf '%-14s %s\n' 'make down' 'Stop Docker Compose services'
	@printf '%-14s %s\n' 'make clean' 'Stop services and remove Compose volumes'

dev:
	docker compose up --build

build:
	docker compose run --rm app npm run build

preview:
	docker compose run --rm --service-ports app npm run preview -- --host 0.0.0.0

shell:
	docker compose run --rm app sh

down:
	docker compose down --remove-orphans

clean:
	docker compose down --remove-orphans --volumes
