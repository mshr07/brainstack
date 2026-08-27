FROM python:3.13.7-slim AS build
COPY --from=ghcr.io/astral-sh/uv:0.11.13 /uv /uvx /bin/
WORKDIR /app
COPY pyproject.toml uv.lock README.md ./
RUN uv sync --frozen --no-dev

FROM python:3.13.7-slim
RUN addgroup --system adsage && adduser --system --ingroup adsage adsage
WORKDIR /app
COPY --from=build /app/.venv /app/.venv
COPY src ./src
COPY prompts ./prompts
ENV PATH="/app/.venv/bin:$PATH" PYTHONPATH="/app/src" PYTHONDONTWRITEBYTECODE=1
USER adsage
EXPOSE 8090
ENTRYPOINT ["uvicorn", "adsage_ai.main:create_app", "--factory", "--host", "0.0.0.0", "--port", "8090"]
