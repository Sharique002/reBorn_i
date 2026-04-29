"""
reBorn_i — FastAPI Application Entry Point

Not a Resume Helper. From Rejection to Reinvention.

Initializes the FastAPI application with:
- CORS middleware
- All route registrations
- Startup/shutdown lifecycle events
- Global exception handlers
- Structured logging
"""

from contextlib import asynccontextmanager
from datetime import datetime, timezone

from fastapi import FastAPI, Request, status
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse

from app.api.routes import (
    analysis_router,
    auth_router,
    blueprint_router,
    health_router,
    hiring_pipeline_router,
    market_router,
    payment_router,
    resume_router,
    simulation_router,
)
from app.config.settings import get_settings
from app.utils.database import close_db, init_db
from app.utils.exceptions import (
    CorruptedFileError,
    FileValidationError,
    HiringPipelineError,
    LLMError,
    LLMResponseValidationError,
    MarketDataError,
    PaymentError,
    PDFExtractionError,
    PromptInjectionError,
    ReBornBaseError,
    ResumeProcessingError,
    ScoringError,
    SimulationError,
)
from app.utils.logging import get_logger, setup_logging

logger = get_logger(__name__)


# ── Application Lifecycle ────────────────────────────────────

@asynccontextmanager
async def lifespan(app: FastAPI):
    """Application startup and shutdown lifecycle."""
    # Startup
    setup_logging()
    logger.info("reborn_i_starting", version=get_settings().APP_VERSION)

    try:
        await init_db()
        logger.info("reborn_i_ready", environment=get_settings().ENVIRONMENT)
    except Exception as e:
        logger.error("startup_failed", error=str(e))
        # Don't crash — allow health checks to report status

    yield

    # Shutdown
    logger.info("reborn_i_shutting_down")
    await close_db()
    logger.info("reborn_i_stopped")


# ── Application Factory ─────────────────────────────────────

def create_app() -> FastAPI:
    """Create and configure the FastAPI application."""
    settings = get_settings()

    app = FastAPI(
        title="reBorn_i",
        description="Not a Resume Helper. From Rejection to Reinvention. "
        "AI-powered career intelligence platform for rejection risk analysis, "
        "market intelligence, career simulation, and reinvention blueprints.",
        version=settings.APP_VERSION,
        lifespan=lifespan,
        docs_url="/docs" if settings.ENVIRONMENT != "production" else None,
        redoc_url="/redoc" if settings.ENVIRONMENT != "production" else None,
    )

    # ── CORS Middleware ──────────────────────────────────────
    origins = settings.CORS_ORIGINS.split(",") if settings.CORS_ORIGINS != "*" else ["*"]
    app.add_middleware(
        CORSMiddleware,
        allow_origins=origins,
        allow_credentials=True,
        allow_methods=["*"],
        allow_headers=["*"],
    )

    # ── Register Routers ────────────────────────────────────
    prefix = settings.API_PREFIX

    app.include_router(health_router, prefix=prefix)
    app.include_router(auth_router, prefix=prefix)
    app.include_router(resume_router, prefix=prefix)
    app.include_router(analysis_router, prefix=prefix)
    app.include_router(market_router, prefix=prefix)
    app.include_router(simulation_router, prefix=prefix)
    app.include_router(blueprint_router, prefix=prefix)
    app.include_router(hiring_pipeline_router, prefix=prefix)
    app.include_router(payment_router, prefix=prefix)

    # ── Global Exception Handlers ────────────────────────────

    @app.exception_handler(ReBornBaseError)
    async def reborn_exception_handler(request: Request, exc: ReBornBaseError):
        """Handle all reBorn_i custom exceptions."""
        status_map = {
            FileValidationError: status.HTTP_400_BAD_REQUEST,
            PromptInjectionError: status.HTTP_400_BAD_REQUEST,
            SimulationError: status.HTTP_400_BAD_REQUEST,
            HiringPipelineError: status.HTTP_400_BAD_REQUEST,
            PaymentError: status.HTTP_400_BAD_REQUEST,
            CorruptedFileError: status.HTTP_422_UNPROCESSABLE_ENTITY,
            PDFExtractionError: status.HTTP_422_UNPROCESSABLE_ENTITY,
            ResumeProcessingError: status.HTTP_422_UNPROCESSABLE_ENTITY,
            LLMResponseValidationError: status.HTTP_422_UNPROCESSABLE_ENTITY,
            ScoringError: status.HTTP_500_INTERNAL_SERVER_ERROR,
            LLMError: status.HTTP_502_BAD_GATEWAY,
            MarketDataError: status.HTTP_500_INTERNAL_SERVER_ERROR,
        }

        http_status = status_map.get(type(exc), status.HTTP_500_INTERNAL_SERVER_ERROR)

        logger.error(
            "unhandled_reborn_error",
            error_type=type(exc).__name__,
            message=exc.message,
            path=str(request.url),
        )

        return JSONResponse(
            status_code=http_status,
            content={
                "error": type(exc).__name__,
                "message": exc.message,
                "details": exc.details if settings.DEBUG else {},
                "timestamp": datetime.now(timezone.utc).isoformat(),
            },
        )

    @app.exception_handler(Exception)
    async def global_exception_handler(request: Request, exc: Exception):
        """Catch-all for unhandled exceptions. Prevents system crash."""
        logger.error(
            "unhandled_exception",
            error_type=type(exc).__name__,
            message=str(exc),
            path=str(request.url),
        )

        return JSONResponse(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            content={
                "error": "InternalServerError",
                "message": "An unexpected error occurred. Please try again.",
                "timestamp": datetime.now(timezone.utc).isoformat(),
            },
        )

    return app


# ── Module-level application instance ────────────────────────
app = create_app()
