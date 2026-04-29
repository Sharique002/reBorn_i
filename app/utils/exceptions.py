"""
reBorn_i — Application Exceptions

Centralized exception hierarchy for clean error handling.
Each module raises specific exception types; the API layer catches and maps to HTTP responses.
"""

from typing import Any, Dict, List, Optional


class ReBornBaseError(Exception):
    """Base exception for all reBorn_i errors."""

    def __init__(self, message: str, details: Optional[Dict[str, Any]] = None):
        super().__init__(message)
        self.message = message
        self.details = details or {}


# ── File & Upload Errors ─────────────────────────────────────

class FileValidationError(ReBornBaseError):
    """Raised when uploaded file fails validation."""
    pass


class PDFExtractionError(ReBornBaseError):
    """Raised when PDF text extraction fails."""
    pass


class CorruptedFileError(ReBornBaseError):
    """Raised when a file is corrupted or unreadable."""
    pass


# ── Resume Processing Errors ────────────────────────────────

class ResumeProcessingError(ReBornBaseError):
    """Raised when resume processing pipeline fails."""
    pass


class ResumeNotFoundError(ReBornBaseError):
    """Raised when a resume ID is not found in the database."""
    pass


# ── Scoring & Analysis Errors ───────────────────────────────

class ScoringError(ReBornBaseError):
    """Raised when the rejection scoring engine encounters an error."""
    pass


class EmbeddingError(ReBornBaseError):
    """Raised when embedding generation fails."""
    pass


# ── LLM Errors ──────────────────────────────────────────────

class LLMError(ReBornBaseError):
    """Raised when an LLM API call fails after retries."""
    pass


class LLMResponseValidationError(ReBornBaseError):
    """Raised when LLM response does not match expected schema."""
    pass


class PromptInjectionError(ReBornBaseError):
    """Raised when prompt injection is detected in user input."""
    pass


# ── Market Radar Errors ─────────────────────────────────────

class MarketDataError(ReBornBaseError):
    """Raised when market data loading or processing fails."""
    pass


# ── Authentication Errors ───────────────────────────────────

class AuthenticationError(ReBornBaseError):
    """Raised for authentication failures."""
    pass


class AuthorizationError(ReBornBaseError):
    """Raised for authorization failures."""
    pass


# ── Simulation Errors ───────────────────────────────────────

class SimulationError(ReBornBaseError):
    """Raised when career simulation encounters an error."""
    pass


# ── Hiring Pipeline Errors ──────────────────────────────────

class HiringPipelineError(ReBornBaseError):
    """Raised when hiring pipeline simulation encounters a validation or runtime error."""
    pass


# ── Payment Errors ──────────────────────────────────────────

class PaymentError(ReBornBaseError):
    """Raised when payment processing or verification fails."""
    pass

