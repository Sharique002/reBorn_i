"""
reBorn_i — LLM Client Utility

Handles all interactions with the OpenAI API, including:
- Structured JSON responses
- Retry logic with exponential backoff
- Response schema validation
- Timeout management

LLM is used ONLY for the explanation layer, never for scoring.
"""

import json
from typing import Any, Dict, Optional, Type

from pydantic import BaseModel, ValidationError
from tenacity import (
    retry,
    retry_if_exception_type,
    stop_after_attempt,
    wait_exponential,
)

# Lazy-import OpenAI to avoid startup crash if package is misconfigured
try:
    from openai import AsyncOpenAI, APIError, APITimeoutError, RateLimitError
    _OPENAI_AVAILABLE = True
except ImportError:
    _OPENAI_AVAILABLE = False
    AsyncOpenAI = None  # type: ignore
    APIError = Exception  # type: ignore
    APITimeoutError = Exception  # type: ignore
    RateLimitError = Exception  # type: ignore

from app.config.settings import get_settings
from app.utils.exceptions import LLMError, LLMResponseValidationError
from app.utils.logging import get_logger

logger = get_logger(__name__)

_client: Optional[AsyncOpenAI] = None


def _get_client() -> "AsyncOpenAI":
    """Get or create the async OpenAI client.

    Raises LLMError if OpenAI is not available or not configured.
    """
    global _client
    if _client is None:
        if not _OPENAI_AVAILABLE:
            raise LLMError(
                message="OpenAI package is not available.",
                details={"hint": "Install openai package."},
            )
        settings = get_settings()
        if not settings.OPENAI_API_KEY:
            raise LLMError(
                message="OpenAI API key is not configured.",
                details={"hint": "Set OPENAI_API_KEY in environment variables."},
            )
        _client = AsyncOpenAI(
            api_key=settings.OPENAI_API_KEY,
            timeout=settings.LLM_REQUEST_TIMEOUT,
        )
        logger.info("llm_client_initialized", model=settings.OPENAI_MODEL, timeout=settings.LLM_REQUEST_TIMEOUT)
    return _client


@retry(
    retry=retry_if_exception_type((APITimeoutError, RateLimitError, APIError)),
    stop=stop_after_attempt(3),
    wait=wait_exponential(multiplier=1, min=2, max=30),
    before_sleep=lambda retry_state: logger.warning(
        "llm_retry",
        attempt=retry_state.attempt_number,
        error=str(retry_state.outcome.exception()) if retry_state.outcome else "unknown",
    ),
)
async def call_llm(
    prompt: str,
    system_message: str = "You are a career intelligence AI assistant. Always respond with valid JSON.",
    temperature: Optional[float] = None,
    max_tokens: Optional[int] = None,
) -> str:
    """Call the LLM API with retry logic.

    Args:
        prompt: The user prompt to send.
        system_message: System-level instruction.
        temperature: Override temperature (default from settings).
        max_tokens: Override max tokens (default from settings).

    Returns:
        Raw response text from the LLM.

    Raises:
        LLMError: If all retries are exhausted.
    """
    settings = get_settings()
    client = _get_client()

    try:
        response = await client.chat.completions.create(
            model=settings.OPENAI_MODEL,
            messages=[
                {"role": "system", "content": system_message},
                {"role": "user", "content": prompt},
            ],
            temperature=temperature or settings.OPENAI_TEMPERATURE,
            max_tokens=max_tokens or settings.OPENAI_MAX_TOKENS,
            response_format={"type": "json_object"},
        )

        content = response.choices[0].message.content
        if not content:
            raise LLMError(
                message="LLM returned empty response.",
                details={"model": settings.OPENAI_MODEL},
            )

        logger.info(
            "llm_call_success",
            model=settings.OPENAI_MODEL,
            prompt_tokens=response.usage.prompt_tokens if response.usage else 0,
            completion_tokens=response.usage.completion_tokens if response.usage else 0,
        )

        return content

    except (APITimeoutError, RateLimitError, APIError):
        # These are retried by tenacity
        raise
    except LLMError:
        raise
    except Exception as e:
        logger.error("llm_call_failed", error=str(e))
        raise LLMError(
            message=f"LLM API call failed: {str(e)}",
            details={"error_type": type(e).__name__},
        )


async def call_llm_structured(
    prompt: str,
    response_schema: Optional[Type[BaseModel]] = None,
    system_message: str = "You are a career intelligence AI assistant. Always respond with valid JSON.",
) -> Dict[str, Any]:
    """Call the LLM and validate the response against a schema.

    Args:
        prompt: The user prompt to send.
        response_schema: Optional Pydantic model to validate response against.
        system_message: System-level instruction.

    Returns:
        Parsed and validated JSON dictionary.

    Raises:
        LLMResponseValidationError: If response doesn't match expected schema.
        LLMError: If the API call fails.
    """
    raw_response = await call_llm(prompt, system_message)

    # Parse JSON
    try:
        parsed = json.loads(raw_response)
    except json.JSONDecodeError as e:
        logger.error("llm_json_parse_failed", error=str(e), response_preview=raw_response[:200])
        raise LLMResponseValidationError(
            message="LLM response is not valid JSON.",
            details={"parse_error": str(e), "response_preview": raw_response[:200]},
        )

    # Validate against schema if provided
    if response_schema:
        try:
            validated = response_schema.model_validate(parsed)
            return validated.model_dump()
        except ValidationError as e:
            logger.error(
                "llm_schema_validation_failed",
                schema=response_schema.__name__,
                errors=str(e),
            )
            raise LLMResponseValidationError(
                message=f"LLM response does not match expected schema: {response_schema.__name__}",
                details={"validation_errors": e.errors(), "response": parsed},
            )

    return parsed
