"""
reBorn_i — Embedding Utilities (Lightweight, Resilient)

Handles embedding generation using OpenAI Embeddings API.
Falls back to keyword-based TF-IDF similarity if API is unavailable.
No local models, no PyTorch, no numpy, no sklearn.

RESILIENCE GUARANTEES:
- System NEVER crashes if OpenAI fails
- Fallback ALWAYS works (pure Python keyword similarity)
- All results are cached to reduce cost and latency
- 5-second timeout on all external API calls
"""

import math
import re
from collections import Counter
from typing import Dict, List, Optional

from cachetools import TTLCache

from app.config.settings import get_settings
from app.utils.exceptions import EmbeddingError
from app.utils.logging import get_logger

logger = get_logger(__name__)

# ── Embedding cache (TTL-based) ─────────────────────────────
_embedding_cache: Optional[TTLCache] = None
_similarity_cache: Optional[TTLCache] = None

# ── OpenAI client (lazy-loaded) ─────────────────────────────
_openai_client = None
_openai_available: Optional[bool] = None  # Track availability


def _get_cache() -> TTLCache:
    """Get or create the embedding cache."""
    global _embedding_cache
    if _embedding_cache is None:
        settings = get_settings()
        _embedding_cache = TTLCache(maxsize=1000, ttl=settings.EMBEDDING_CACHE_TTL)
    return _embedding_cache


def _get_similarity_cache() -> TTLCache:
    """Get or create the similarity result cache."""
    global _similarity_cache
    if _similarity_cache is None:
        settings = get_settings()
        _similarity_cache = TTLCache(maxsize=2000, ttl=settings.EMBEDDING_CACHE_TTL)
    return _similarity_cache


def _get_openai_client():
    """Lazy-load the OpenAI client for embeddings.

    Returns None (not raises) if client cannot be initialized.
    """
    global _openai_client, _openai_available
    if _openai_available is False:
        return None
    if _openai_client is None:
        try:
            from openai import OpenAI
            settings = get_settings()
            if settings.OPENAI_API_KEY and settings.OPENAI_API_KEY.startswith("sk-"):
                _openai_client = OpenAI(
                    api_key=settings.OPENAI_API_KEY,
                    timeout=5.0,  # 5-second timeout — fail fast
                )
                _openai_available = True
                logger.info("openai_embedding_client_ready", timeout="5s")
            else:
                _openai_available = False
                logger.warning(
                    "openai_api_key_not_set",
                    hint="Embedding features will use keyword-based fallback",
                )
                return None
        except Exception as e:
            _openai_available = False
            logger.warning("openai_client_init_failed", error=str(e))
            return None
    return _openai_client


# ── Stop words for keyword extraction ────────────────────────
_STOP_WORDS = frozenset({
    "a", "am", "an", "the", "and", "or", "but", "in", "on", "at", "to", "for",
    "of", "with", "by", "from", "is", "are", "was", "were", "be", "been",
    "being", "have", "has", "had", "do", "does", "did", "will", "would",
    "could", "should", "may", "might", "shall", "can", "need", "must",
    "it", "its", "this", "that", "these", "those", "i", "we", "you",
    "he", "she", "they", "me", "us", "him", "her", "them", "my", "our",
    "your", "his", "their", "what", "which", "who", "whom", "where",
    "when", "why", "how", "all", "each", "every", "both", "few", "more",
    "most", "other", "some", "such", "no", "not", "only", "own", "same",
    "so", "than", "too", "very", "just", "about", "above", "after",
    "again", "also", "as", "if", "into", "new", "out", "over", "up",
    "any", "etc", "per", "via",
})


def _extract_keywords(text: str) -> List[str]:
    """Extract meaningful keywords from text."""
    words = re.findall(r"\b[a-zA-Z][a-zA-Z+#.-]{1,}\b", text.lower())
    return [w for w in words if w not in _STOP_WORDS and len(w) > 1]


def _text_to_vector(text: str) -> Dict[str, float]:
    """Convert text to a TF-IDF-like keyword frequency vector."""
    keywords = _extract_keywords(text)
    if not keywords:
        return {}
    counter = Counter(keywords)
    total = sum(counter.values())
    return {word: count / total for word, count in counter.items()}


def _keyword_similarity(text1: str, text2: str) -> float:
    """Pure keyword-based similarity. Always works, no external deps.

    Uses Jaccard-style overlap + weighted term frequency matching.
    """
    if not text1 or not text2:
        return 0.0

    vec1 = _text_to_vector(text1)
    vec2 = _text_to_vector(text2)

    if not vec1 or not vec2:
        return 0.0

    # Compute cosine similarity over shared vocabulary
    all_keys = set(vec1.keys()) | set(vec2.keys())
    if not all_keys:
        return 0.0

    dot = sum(vec1.get(k, 0.0) * vec2.get(k, 0.0) for k in all_keys)
    mag1 = math.sqrt(sum(v * v for v in vec1.values()))
    mag2 = math.sqrt(sum(v * v for v in vec2.values()))

    if mag1 == 0 or mag2 == 0:
        return 0.0

    similarity = dot / (mag1 * mag2)
    return float(max(0.0, min(1.0, similarity)))


def generate_embedding(text: str) -> List[float]:
    """Generate an embedding vector for the given text.

    Uses OpenAI Embeddings API if available, otherwise falls back
    to a keyword-based vector representation.

    NEVER CRASHES — always returns a valid vector.

    Args:
        text: Input text to embed.

    Returns:
        List of floats representing the embedding vector.
    """
    if not text or not text.strip():
        logger.warning("embedding_empty_text")
        return [0.0]

    cache = _get_cache()
    cache_key = hash(text.strip())

    # Check cache first
    if cache_key in cache:
        logger.debug("embedding_cache_hit", text_preview=text[:50])
        return cache[cache_key]

    logger.debug("embedding_cache_miss", text_preview=text[:50])

    try:
        client = _get_openai_client()
        if client is not None:
            # Use OpenAI embeddings API (5-second timeout)
            response = client.embeddings.create(
                model="text-embedding-3-small",
                input=text.strip()[:8000],  # API limit
            )
            result = response.data[0].embedding
            cache[cache_key] = result
            logger.info("embedding_generated_openai", dim=len(result))
            return result
    except Exception as e:
        # OpenAI failed — fall through to keyword fallback
        logger.warning("embedding_openai_failed_using_fallback", error=str(e))

    # Fallback: keyword-based vector (deterministic, no external deps)
    try:
        vector = _text_to_vector(text.strip())
        result = list(vector.values()) if vector else [0.0]
        cache[cache_key] = result
        logger.info("embedding_generated_keyword_fallback", dim=len(result))
        return result
    except Exception as e:
        logger.error("embedding_keyword_fallback_failed", error=str(e))
        return [0.0]


def generate_embeddings_batch(texts: List[str]) -> List[List[float]]:
    """Generate embeddings for multiple texts in a batch.

    NEVER CRASHES — uses fallback for any failures.

    Args:
        texts: List of input texts.

    Returns:
        List of embedding vectors.
    """
    if not texts:
        return []

    cache = _get_cache()
    results: List[Optional[List[float]]] = [None] * len(texts)
    uncached_indices: List[int] = []
    uncached_texts: List[str] = []

    # Check cache first
    for i, text in enumerate(texts):
        if not text or not text.strip():
            results[i] = [0.0]
            continue
        cache_key = hash(text.strip())
        if cache_key in cache:
            results[i] = cache[cache_key]
        else:
            uncached_indices.append(i)
            uncached_texts.append(text.strip())

    # Generate embeddings for uncached texts
    if uncached_texts:
        openai_success = False
        try:
            client = _get_openai_client()
            if client is not None:
                response = client.embeddings.create(
                    model="text-embedding-3-small",
                    input=[t[:8000] for t in uncached_texts],
                )
                for j, embedding_data in enumerate(response.data):
                    idx = uncached_indices[j]
                    result = embedding_data.embedding
                    results[idx] = result
                    cache[hash(uncached_texts[j])] = result
                openai_success = True
                logger.info("batch_embeddings_openai_success", count=len(uncached_texts))
        except Exception as e:
            logger.warning("batch_embedding_openai_failed_using_fallback", error=str(e))

        # Fallback for any missing results
        if not openai_success:
            for j, text in enumerate(uncached_texts):
                idx = uncached_indices[j]
                if results[idx] is None:
                    vector = _text_to_vector(text)
                    result = list(vector.values()) if vector else [0.0]
                    results[idx] = result
                    cache[hash(text)] = result
            logger.info("batch_embeddings_keyword_fallback", count=len(uncached_texts))

    # Ensure no None values remain
    for i in range(len(results)):
        if results[i] is None:
            results[i] = [0.0]

    logger.info(
        "batch_embeddings_complete",
        total=len(texts),
        cached=len(texts) - len(uncached_texts),
        generated=len(uncached_texts),
    )

    return results  # type: ignore


def compute_cosine_similarity(vec_a: List[float], vec_b: List[float]) -> float:
    """Compute cosine similarity between two embedding vectors.

    Pure Python implementation — no numpy or sklearn needed.
    NEVER CRASHES — returns 0.0 on any error.

    Args:
        vec_a: First embedding vector.
        vec_b: Second embedding vector.

    Returns:
        Cosine similarity score between 0 and 1.
    """
    try:
        if not vec_a or not vec_b:
            return 0.0

        # Handle different-length vectors (keyword fallback case)
        if len(vec_a) != len(vec_b):
            max_len = max(len(vec_a), len(vec_b))
            vec_a = vec_a + [0.0] * (max_len - len(vec_a))
            vec_b = vec_b + [0.0] * (max_len - len(vec_b))

        # Dot product
        dot_product = sum(a * b for a, b in zip(vec_a, vec_b))

        # Magnitudes
        mag_a = math.sqrt(sum(a * a for a in vec_a))
        mag_b = math.sqrt(sum(b * b for b in vec_b))

        if mag_a == 0 or mag_b == 0:
            return 0.0

        similarity = dot_product / (mag_a * mag_b)
        return float(max(0.0, min(1.0, similarity)))
    except Exception as e:
        logger.warning("cosine_similarity_failed_returning_zero", error=str(e))
        return 0.0


def compute_similarity(text1: str, text2: str) -> float:
    """SAFE similarity wrapper — the main function services should call.

    Tries OpenAI embedding-based similarity first.
    Falls back to keyword-based similarity on ANY failure.
    NEVER CRASHES. ALWAYS returns a valid float.

    Args:
        text1: First text.
        text2: Second text.

    Returns:
        Similarity score between 0.0 and 1.0.
    """
    if not text1 or not text2:
        return 0.0

    # Check similarity cache
    sim_cache = _get_similarity_cache()
    cache_key = hash(text1.strip() + "|||" + text2.strip())
    if cache_key in sim_cache:
        logger.debug("similarity_cache_hit")
        return sim_cache[cache_key]

    logger.debug("similarity_cache_miss")

    try:
        client = _get_openai_client()
        if client is not None:
            # Try OpenAI embedding similarity
            emb1 = generate_embedding(text1)
            emb2 = generate_embedding(text2)
            result = compute_cosine_similarity(emb1, emb2)
            sim_cache[cache_key] = result
            logger.info("similarity_computed_openai", score=round(result, 4))
            return result
    except Exception as e:
        logger.warning("similarity_openai_failed_using_keyword_fallback", error=str(e))

    # Fallback: keyword similarity (always works)
    try:
        result = _keyword_similarity(text1, text2)
        sim_cache[cache_key] = result
        logger.info("similarity_computed_keyword_fallback", score=round(result, 4))
        return result
    except Exception as e:
        logger.error("similarity_all_methods_failed", error=str(e))
        return 0.0
