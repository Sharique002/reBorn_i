"""
reBorn_i — Embedding Utilities

Handles embedding generation with caching via sentence-transformers.
Embeddings are deterministic given the same model and input.
"""

from typing import Dict, List, Optional, Tuple

import numpy as np
from cachetools import TTLCache
from sentence_transformers import SentenceTransformer
from sklearn.metrics.pairwise import cosine_similarity

from app.config.settings import get_settings
from app.utils.exceptions import EmbeddingError
from app.utils.logging import get_logger

logger = get_logger(__name__)

# ── Module-level model cache ────────────────────────────────
_model: Optional[SentenceTransformer] = None

# ── Embedding cache (TTL-based) ─────────────────────────────
_embedding_cache: Optional[TTLCache] = None


def _get_model() -> SentenceTransformer:
    """Lazy-load the sentence transformer model."""
    global _model
    if _model is None:
        settings = get_settings()
        try:
            logger.info("loading_embedding_model", model=settings.EMBEDDING_MODEL)
            _model = SentenceTransformer(settings.EMBEDDING_MODEL)
            logger.info("embedding_model_loaded", model=settings.EMBEDDING_MODEL)
        except Exception as e:
            logger.error("embedding_model_load_failed", error=str(e))
            raise EmbeddingError(
                message=f"Failed to load embedding model: {settings.EMBEDDING_MODEL}",
                details={"error": str(e)},
            )
    return _model


def _get_cache() -> TTLCache:
    """Get or create the embedding cache."""
    global _embedding_cache
    if _embedding_cache is None:
        settings = get_settings()
        _embedding_cache = TTLCache(maxsize=1000, ttl=settings.EMBEDDING_CACHE_TTL)
    return _embedding_cache


def generate_embedding(text: str) -> List[float]:
    """Generate an embedding vector for the given text.

    Uses caching to avoid redundant computations.

    Args:
        text: Input text to embed.

    Returns:
        List of floats representing the embedding vector.

    Raises:
        EmbeddingError: If embedding generation fails.
    """
    if not text or not text.strip():
        raise EmbeddingError(
            message="Cannot generate embedding for empty text.",
            details={"text_length": 0},
        )

    cache = _get_cache()
    cache_key = hash(text.strip())

    # Check cache first
    if cache_key in cache:
        logger.debug("embedding_cache_hit", text_preview=text[:50])
        return cache[cache_key]

    try:
        model = _get_model()
        embedding = model.encode(text.strip(), normalize_embeddings=True)
        result = embedding.tolist()

        # Cache the result
        cache[cache_key] = result
        logger.debug("embedding_generated", text_preview=text[:50], dim=len(result))

        return result
    except EmbeddingError:
        raise
    except Exception as e:
        logger.error("embedding_generation_failed", error=str(e))
        raise EmbeddingError(
            message="Failed to generate embedding.",
            details={"error": str(e)},
        )


def generate_embeddings_batch(texts: List[str]) -> List[List[float]]:
    """Generate embeddings for multiple texts in a batch.

    Args:
        texts: List of input texts.

    Returns:
        List of embedding vectors.

    Raises:
        EmbeddingError: If batch embedding generation fails.
    """
    if not texts:
        return []

    cache = _get_cache()
    results: List[Optional[List[float]]] = [None] * len(texts)
    uncached_indices: List[int] = []
    uncached_texts: List[str] = []

    # Check cache first
    for i, text in enumerate(texts):
        cache_key = hash(text.strip())
        if cache_key in cache:
            results[i] = cache[cache_key]
        else:
            uncached_indices.append(i)
            uncached_texts.append(text.strip())

    # Generate embeddings for uncached texts
    if uncached_texts:
        try:
            model = _get_model()
            embeddings = model.encode(uncached_texts, normalize_embeddings=True)

            for idx, embedding in zip(uncached_indices, embeddings):
                result = embedding.tolist()
                results[idx] = result
                cache_key = hash(uncached_texts[uncached_indices.index(idx)])
                cache[cache_key] = result
        except Exception as e:
            logger.error("batch_embedding_failed", error=str(e))
            raise EmbeddingError(
                message="Failed to generate batch embeddings.",
                details={"error": str(e), "batch_size": len(uncached_texts)},
            )

    logger.info(
        "batch_embeddings_complete",
        total=len(texts),
        cached=len(texts) - len(uncached_texts),
        generated=len(uncached_texts),
    )

    return results  # type: ignore


def compute_cosine_similarity(vec_a: List[float], vec_b: List[float]) -> float:
    """Compute cosine similarity between two embedding vectors.

    Args:
        vec_a: First embedding vector.
        vec_b: Second embedding vector.

    Returns:
        Cosine similarity score between 0 and 1.

    Raises:
        EmbeddingError: If vectors are incompatible.
    """
    try:
        a = np.array(vec_a).reshape(1, -1)
        b = np.array(vec_b).reshape(1, -1)
        similarity = cosine_similarity(a, b)[0][0]
        # Clamp to [0, 1] since we use normalized embeddings
        return float(max(0.0, min(1.0, similarity)))
    except Exception as e:
        raise EmbeddingError(
            message="Failed to compute cosine similarity.",
            details={"error": str(e)},
        )
