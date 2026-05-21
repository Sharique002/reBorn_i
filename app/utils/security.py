"""
reBorn_i — Input Sanitization & Security Utilities

Validates file uploads, sanitizes text inputs, and detects prompt injection.
"""

import re

from fastapi import UploadFile

from app.config.settings import get_settings
from app.utils.exceptions import FileValidationError, PromptInjectionError
from app.utils.logging import get_logger

logger = get_logger(__name__)

# ── Prompt Injection Patterns ────────────────────────────────
INJECTION_PATTERNS: list[re.Pattern] = [
    re.compile(r"ignore\s+(all\s+)?previous\s+instructions", re.IGNORECASE),
    re.compile(r"ignore\s+(all\s+)?above\s+instructions", re.IGNORECASE),
    re.compile(r"disregard\s+(all\s+)?previous", re.IGNORECASE),
    re.compile(r"you\s+are\s+now\s+a", re.IGNORECASE),
    re.compile(r"act\s+as\s+if\s+you\s+are", re.IGNORECASE),
    re.compile(r"system\s*:\s*", re.IGNORECASE),
    re.compile(r"<\s*system\s*>", re.IGNORECASE),
    re.compile(r"\[INST\]", re.IGNORECASE),
    re.compile(r"```\s*system", re.IGNORECASE),
    re.compile(r"override\s+(your\s+)?instructions", re.IGNORECASE),
    re.compile(r"forget\s+(your\s+)?(previous\s+)?instructions", re.IGNORECASE),
    re.compile(r"new\s+instructions?\s*:", re.IGNORECASE),
]


def sanitize_text(text: str) -> str:
    """Sanitize user-provided text input.

    - Strips leading/trailing whitespace
    - Removes null bytes
    - Normalizes excessive whitespace
    - Does NOT remove legitimate punctuation or formatting

    Args:
        text: Raw user input text.

    Returns:
        Sanitized text string.
    """
    if not text:
        return ""

    # Remove null bytes
    text = text.replace("\x00", "")

    # Normalize line endings
    text = text.replace("\r\n", "\n").replace("\r", "\n")

    # Collapse multiple spaces (but preserve newlines)
    text = re.sub(r"[^\S\n]+", " ", text)

    # Collapse more than 3 consecutive newlines
    text = re.sub(r"\n{4,}", "\n\n\n", text)

    return text.strip()


def check_prompt_injection(text: str) -> None:
    """Check text for common prompt injection patterns.

    Args:
        text: The text to inspect.

    Raises:
        PromptInjectionError: If a prompt injection pattern is detected.
    """
    for pattern in INJECTION_PATTERNS:
        if pattern.search(text):
            logger.warning(
                "prompt_injection_detected",
                pattern=pattern.pattern,
                text_preview=text[:100],
            )
            raise PromptInjectionError(
                message="Input contains potentially unsafe content.",
                details={"matched_pattern": pattern.pattern},
            )




async def validate_upload_file(file: UploadFile) -> bytes:
    """Validate an uploaded file for type and size constraints.

    Args:
        file: The uploaded file from FastAPI.

    Returns:
        File content as bytes.

    Raises:
        FileValidationError: If the file fails validation.
    """
    settings = get_settings()
    max_size = settings.MAX_FILE_SIZE_MB * 1024 * 1024
    allowed_types = settings.ALLOWED_FILE_TYPES.split(",")

    # Validate content type
    if file.content_type not in allowed_types:
        raise FileValidationError(
            message=f"File type '{file.content_type}' is not allowed. Accepted: {allowed_types}",
            details={"content_type": file.content_type, "allowed": allowed_types},
        )

    # Validate filename extension
    if file.filename and not file.filename.lower().endswith(".pdf"):
        raise FileValidationError(
            message="Only PDF files are accepted.",
            details={"filename": file.filename},
        )

    # Read and validate size
    content = await file.read()
    if len(content) == 0:
        raise FileValidationError(
            message="Uploaded file is empty.",
            details={"filename": file.filename},
        )

    if len(content) > max_size:
        raise FileValidationError(
            message=f"File exceeds maximum size of {settings.MAX_FILE_SIZE_MB}MB.",
            details={
                "file_size_mb": round(len(content) / (1024 * 1024), 2),
                "max_size_mb": settings.MAX_FILE_SIZE_MB,
            },
        )

    # Basic PDF header check
    if not content[:5] == b"%PDF-":
        raise FileValidationError(
            message="File does not appear to be a valid PDF.",
            details={"filename": file.filename},
        )

    logger.info(
        "file_validated",
        filename=file.filename,
        size_bytes=len(content),
        content_type=file.content_type,
    )

    return content
