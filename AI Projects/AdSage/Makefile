.PHONY: bootstrap test lint format contract-check infra-up up down dev dev-token java-test python-test web-test data-test data-run seed

bootstrap:
	uv sync --project services/ai-orchestrator --all-groups
	uv sync --project pipelines --all-groups
	npm install --prefix apps/web
	mvn -q -f services/adsage-platform-service/pom.xml dependency:go-offline

test: java-test python-test data-test web-test contract-check

java-test:
	mvn -f services/adsage-platform-service/pom.xml test

python-test:
	PYTHONPATH=services/ai-orchestrator/src uv run --project services/ai-orchestrator pytest services/ai-orchestrator/tests

data-test:
	PYTHONPATH=pipelines/src uv run --project pipelines pytest pipelines/tests

seed:
	PYTHONPATH=pipelines/src uv run --project pipelines adsage-data generate

data-run:
	PYTHONPATH=pipelines/src uv run --project pipelines adsage-data run

web-test:
	npm test --prefix apps/web -- --run

lint:
	mvn -f services/adsage-platform-service/pom.xml spotless:check verify -DskipTests
	uv run --project services/ai-orchestrator ruff check services/ai-orchestrator scripts
	uv run --project services/ai-orchestrator mypy services/ai-orchestrator/src
	uv run --project pipelines ruff check pipelines
	uv run --project pipelines mypy --config-file pipelines/pyproject.toml pipelines/src
	npm run lint --prefix apps/web
	npm run typecheck --prefix apps/web

format:
	mvn -f services/adsage-platform-service/pom.xml spotless:apply
	uv run --project services/ai-orchestrator ruff format services/ai-orchestrator scripts
	uv run --project services/ai-orchestrator ruff check --fix services/ai-orchestrator scripts
	uv run --project pipelines ruff format pipelines
	uv run --project pipelines ruff check --fix pipelines
	npm run format --prefix apps/web

contract-check:
	uv run --project services/ai-orchestrator python scripts/validate_contracts.py

infra-up:
	docker compose up -d postgres redis neo4j minio minio-init

up:
	docker compose --profile app up --build -d

down:
	docker compose --profile app down

dev:
	@echo 'Terminal 1: SPRING_PROFILES_ACTIVE=local mvn -f services/adsage-platform-service/pom.xml spring-boot:run'
	@echo 'Terminal 2: uv run --project services/ai-orchestrator uvicorn adsage_ai.main:create_app --factory --app-dir services/ai-orchestrator/src --reload --port 8090'
	@echo 'Terminal 3: npm run dev --prefix apps/web'

dev-token:
	uv run --project services/ai-orchestrator python scripts/mint_dev_jwt.py
