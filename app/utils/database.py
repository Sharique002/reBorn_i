"""
reBorn_i — Database Session Management

Async database engine and session factory using SQLAlchemy 2.0.
"""

from contextlib import asynccontextmanager
from typing import AsyncGenerator

from sqlalchemy.ext.asyncio import AsyncSession, async_sessionmaker, create_async_engine

from app.config.settings import get_settings
from app.models.database import Base
from app.utils.logging import get_logger

logger = get_logger(__name__)

_engine = None
_session_factory = None


def get_engine():
    """Get or create the async database engine."""
    global _engine
    if _engine is None:
        settings = get_settings()
        url = settings.DATABASE_URL

        if url.startswith("sqlite"):
            # SQLite doesn't support pool_size / max_overflow
            from sqlalchemy.pool import StaticPool
            _engine = create_async_engine(
                url,
                echo=settings.DEBUG,
                connect_args={"check_same_thread": False},
                poolclass=StaticPool,
            )

            # SQLite optimizations: WAL mode, NORMAL synchronous, and foreign keys
            from sqlalchemy import event
            @event.listens_for(_engine.sync_engine, "connect")
            def set_sqlite_pragma(dbapi_connection, connection_record):
                cursor = dbapi_connection.cursor()
                try:
                    cursor.execute("PRAGMA journal_mode=WAL")
                    cursor.execute("PRAGMA synchronous=NORMAL")
                    cursor.execute("PRAGMA foreign_keys=ON")
                finally:
                    cursor.close()
        else:
            _engine = create_async_engine(
                url,
                pool_size=settings.DB_POOL_SIZE,
                max_overflow=settings.DB_MAX_OVERFLOW,
                echo=settings.DEBUG,
                pool_pre_ping=True,
            )
    return _engine


def get_session_factory():
    """Get or create the async session factory."""
    global _session_factory
    if _session_factory is None:
        _session_factory = async_sessionmaker(
            bind=get_engine(),
            class_=AsyncSession,
            expire_on_commit=False,
        )
    return _session_factory


async def get_db() -> AsyncGenerator[AsyncSession, None]:
    """FastAPI dependency for database sessions.

    Yields an async session and ensures cleanup.
    """
    factory = get_session_factory()
    async with factory() as session:
        try:
            yield session
            await session.commit()
        except Exception:
            await session.rollback()
            raise
        finally:
            await session.close()


async def init_db() -> None:
    """Create all database tables. Used during startup."""
    engine = get_engine()
    try:
        async with engine.begin() as conn:
            await conn.run_sync(Base.metadata.create_all)
        logger.info("database_initialized")
    except Exception as e:
        logger.error("database_init_failed", error=str(e))
        raise


async def close_db() -> None:
    """Dispose of the database engine. Used during shutdown."""
    global _engine, _session_factory
    if _engine:
        await _engine.dispose()
        _engine = None
        _session_factory = None
        logger.info("database_connection_closed")
