from contextlib import asynccontextmanager

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from sqlalchemy.exc import SQLAlchemyError

from app.api.routes import router
from app.core.config import get_settings
from app.core.logging import configure_logging, logger
from app.database.init_db import init_database


configure_logging()
settings = get_settings()


@asynccontextmanager
async def lifespan(app: FastAPI):
    try:
        init_database()
        app.state.database_ready = True
    except SQLAlchemyError:
        app.state.database_ready = False
        logger.error("App started, but database initialization failed")
        if settings.environment == "test":
            raise
    yield


app = FastAPI(
    title=settings.app_name,
    description="Analyze resumes",
    version="1.0.0",
    lifespan=lifespan,
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.cors_origins,
    allow_credentials=False,
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.get("/")
def health_check() -> dict[str, str]:
    return {
        "message": "AI Resume Analyzer API is running",
        "docs": "/docs",
        "database": "ready" if getattr(app.state, "database_ready", False) else "not_ready",
    }


app.include_router(router)

