"""
reBorn_i — Structured Logging

Configures structlog for consistent, machine-readable log output.
Sensitive data (passwords, tokens, PII) is never logged.
"""

import logging
import sys
from typing import Any, Dict

import structlog

from app.config.settings import get_settings

# Fields that must NEVER appear in logs
SENSITIVE_FIELDS = frozenset({
    "password",
    "hashed_password",
    "access_token",
    "token",
    "secret",
    "api_key",
    "authorization",
    "cookie",
    "ssn",
    "credit_card",
})


def sanitize_log_event(
    logger: Any, method_name: str, event_dict: Dict[str, Any]
) -> Dict[str, Any]:
    """Remove sensitive fields from log events."""
    for key in list(event_dict.keys()):
        if key.lower() in SENSITIVE_FIELDS:
            event_dict[key] = "***REDACTED***"
    return event_dict


def setup_logging() -> None:
    """Configure structured logging for the application."""
    settings = get_settings()

    # Configure structlog
    structlog.configure(
        processors=[
            structlog.contextvars.merge_contextvars,
            structlog.stdlib.filter_by_level,
            structlog.stdlib.add_logger_name,
            structlog.stdlib.add_log_level,
            structlog.stdlib.PositionalArgumentsFormatter(),
            structlog.processors.TimeStamper(fmt="iso"),
            structlog.processors.StackInfoRenderer(),
            structlog.processors.UnicodeDecoder(),
            sanitize_log_event,
            structlog.processors.JSONRenderer()
            if settings.ENVIRONMENT == "production"
            else structlog.dev.ConsoleRenderer(),
        ],
        context_class=dict,
        logger_factory=structlog.stdlib.LoggerFactory(),
        wrapper_class=structlog.stdlib.BoundLogger,
        cache_logger_on_first_use=True,
    )

    # Configure standard library logging
    logging.basicConfig(
        format="%(message)s",
        stream=sys.stdout,
        level=getattr(logging, settings.LOG_LEVEL),
    )


def get_logger(name: str) -> structlog.stdlib.BoundLogger:
    """Get a named structured logger instance."""
    return structlog.get_logger(name)
