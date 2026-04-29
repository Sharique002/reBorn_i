"""
reBorn_i — Market Radar Module (Service C)

Analyzes a predefined job market dataset to extract:
1. Skill frequency across job listings
2. Demand index per skill
3. Future-proof score for the user's current skill set

Designed to run as a background task with periodic refresh.
"""

import json
import os
from collections import Counter
from datetime import datetime, timezone
from typing import Any, Dict, List, Optional, Tuple

from app.config.scoring_weights import DEFAULT_MARKET_WEIGHTS, MarketScoringWeights
from app.config.settings import get_settings
from app.schemas.schemas import MarketRadarResponse, SkillDemandEntry
from app.utils.exceptions import MarketDataError
from app.utils.logging import get_logger

logger = get_logger(__name__)

# ── Module-level cache ───────────────────────────────────────
_market_cache: Optional[Dict[str, Any]] = None
_cache_timestamp: Optional[datetime] = None


def _load_market_data(data_path: Optional[str] = None) -> List[Dict[str, Any]]:
    """Load the job market dataset from file.

    Args:
        data_path: Override path to the dataset file.

    Returns:
        List of job listing dictionaries.

    Raises:
        MarketDataError: If the file is missing or malformed.
    """
    settings = get_settings()
    path = data_path or settings.MARKET_DATA_PATH

    if not os.path.exists(path):
        logger.warning("market_data_not_found", path=path)
        # Return a default dataset for development
        return _get_default_market_data()

    try:
        with open(path, "r", encoding="utf-8") as f:
            data = json.load(f)

        if not isinstance(data, list):
            raise MarketDataError(
                message="Market data must be a JSON array of job listings.",
                details={"path": path, "type": type(data).__name__},
            )

        logger.info("market_data_loaded", path=path, count=len(data))
        return data

    except json.JSONDecodeError as e:
        raise MarketDataError(
            message="Market data file contains invalid JSON.",
            details={"path": path, "error": str(e)},
        )
    except Exception as e:
        raise MarketDataError(
            message=f"Failed to load market data: {str(e)}",
            details={"path": path},
        )


def _get_default_market_data() -> List[Dict[str, Any]]:
    """Provide a default market dataset for development/testing.

    Returns:
        List of sample job listings with skills.
    """
    return [
        {"title": "Senior Software Engineer", "skills": ["python", "aws", "docker", "kubernetes", "postgresql", "fastapi", "react", "git", "ci/cd", "microservices"], "level": "senior", "industry": "tech"},
        {"title": "Full Stack Developer", "skills": ["javascript", "typescript", "react", "node.js", "postgresql", "docker", "git", "aws", "graphql", "rest"], "level": "mid", "industry": "tech"},
        {"title": "Data Scientist", "skills": ["python", "machine learning", "tensorflow", "pandas", "numpy", "sql", "deep learning", "nlp", "scikit-learn", "data analysis"], "level": "mid", "industry": "tech"},
        {"title": "DevOps Engineer", "skills": ["docker", "kubernetes", "terraform", "aws", "jenkins", "ci/cd", "python", "bash", "prometheus", "grafana"], "level": "senior", "industry": "tech"},
        {"title": "Frontend Developer", "skills": ["javascript", "typescript", "react", "vue", "css", "html", "git", "figma", "rest", "agile"], "level": "mid", "industry": "tech"},
        {"title": "Backend Engineer", "skills": ["python", "java", "spring", "postgresql", "redis", "docker", "aws", "microservices", "rest", "git"], "level": "senior", "industry": "tech"},
        {"title": "ML Engineer", "skills": ["python", "pytorch", "tensorflow", "docker", "aws", "kubernetes", "mlops", "deep learning", "data engineering", "sql"], "level": "senior", "industry": "tech"},
        {"title": "Cloud Architect", "skills": ["aws", "azure", "gcp", "terraform", "kubernetes", "docker", "microservices", "system design", "python", "security"], "level": "lead", "industry": "tech"},
        {"title": "Product Manager", "skills": ["agile", "jira", "data analysis", "communication", "leadership", "stakeholder management", "project management", "sql", "figma", "scrum"], "level": "senior", "industry": "tech"},
        {"title": "AI Engineer", "skills": ["python", "llm", "langchain", "generative ai", "fastapi", "docker", "aws", "pytorch", "nlp", "api design"], "level": "senior", "industry": "tech"},
        {"title": "Junior Developer", "skills": ["python", "javascript", "git", "sql", "react", "rest", "agile", "docker"], "level": "junior", "industry": "tech"},
        {"title": "Data Engineer", "skills": ["python", "sql", "spark", "airflow", "aws", "docker", "postgresql", "etl", "data engineering", "kafka"], "level": "mid", "industry": "tech"},
        {"title": "SRE Engineer", "skills": ["kubernetes", "docker", "aws", "terraform", "prometheus", "grafana", "python", "bash", "ci/cd", "elasticsearch"], "level": "senior", "industry": "tech"},
        {"title": "Mobile Developer", "skills": ["react native", "flutter", "javascript", "typescript", "swift", "kotlin", "git", "rest", "firebase", "agile"], "level": "mid", "industry": "tech"},
        {"title": "Security Engineer", "skills": ["python", "aws", "docker", "kubernetes", "penetration testing", "security", "bash", "terraform", "ci/cd", "git"], "level": "senior", "industry": "tech"},
    ]


def compute_skill_frequency(job_listings: List[Dict[str, Any]]) -> Counter:
    """Count the frequency of each skill across job listings.

    Args:
        job_listings: List of job data dictionaries.

    Returns:
        Counter mapping skill names to their frequency count.
    """
    skill_counter: Counter = Counter()

    for job in job_listings:
        skills = job.get("skills", [])
        if isinstance(skills, list):
            for skill in skills:
                if isinstance(skill, str):
                    skill_counter[skill.lower().strip()] += 1

    return skill_counter


def compute_demand_index(
    skill_frequency: Counter, total_jobs: int
) -> Dict[str, float]:
    """Compute demand index for each skill.

    Demand index = skill frequency / total jobs (normalized to 0-1).

    Args:
        skill_frequency: Counter of skill occurrences.
        total_jobs: Total number of job listings analyzed.

    Returns:
        Dictionary mapping skill names to demand index (0.0-1.0).
    """
    if total_jobs == 0:
        return {}

    demand_index: Dict[str, float] = {}
    for skill, count in skill_frequency.items():
        demand_index[skill] = round(count / total_jobs, 4)

    return demand_index


def compute_future_proof_score(
    user_skills: List[str],
    demand_index: Dict[str, float],
    weights: MarketScoringWeights = DEFAULT_MARKET_WEIGHTS,
) -> Tuple[float, List[str], List[str]]:
    """Compute a future-proof score for the user's skill set.

    Measures how well the user's skills align with current market demand.

    Args:
        user_skills: List of user's current skills.
        demand_index: Market demand index per skill.
        weights: Market scoring weights.

    Returns:
        Tuple of (future_proof_score, aligned_skills, missing_high_demand).
    """
    if not user_skills or not demand_index:
        return 0.0, [], list(demand_index.keys())[:10] if demand_index else []

    user_skills_lower = {s.lower().strip() for s in user_skills}

    # Calculate how much of the user's skills are in demand
    aligned_skills: List[str] = []
    user_demand_total = 0.0

    for skill in user_skills_lower:
        if skill in demand_index:
            aligned_skills.append(skill)
            user_demand_total += demand_index[skill]

    # Find high-demand skills the user is missing
    sorted_demand = sorted(demand_index.items(), key=lambda x: x[1], reverse=True)
    top_demand_skills = [s for s, _ in sorted_demand[:20]]
    missing_high_demand = [s for s in top_demand_skills if s not in user_skills_lower]

    # Compute score
    max_possible_demand = sum(
        demand_index.get(s, 0) for s in top_demand_skills[:len(user_skills)]
    )
    if max_possible_demand > 0:
        coverage_score = user_demand_total / max_possible_demand
    else:
        coverage_score = 0.0

    # Penalty for missing high-demand skills
    missing_penalty = len(missing_high_demand) / max(len(top_demand_skills), 1)
    alignment_bonus = len(aligned_skills) / max(len(user_skills), 1)

    future_proof = (
        coverage_score * weights.current_demand
        + alignment_bonus * weights.growth_trend
        + (1.0 - missing_penalty) * weights.cross_industry
    )

    future_proof = round(max(0.0, min(1.0, future_proof)), 4)

    logger.info(
        "future_proof_computed",
        score=future_proof,
        aligned=len(aligned_skills),
        missing=len(missing_high_demand),
    )

    return future_proof, aligned_skills, missing_high_demand[:10]


async def analyze_market(
    user_skills: Optional[List[str]] = None,
    data_path: Optional[str] = None,
    force_refresh: bool = False,
) -> MarketRadarResponse:
    """Run the full market radar analysis.

    Designed to be called periodically as a background task.

    Args:
        user_skills: Optional list of user's current skills for personalized scoring.
        data_path: Override path to the market data file.
        force_refresh: Force re-analysis even if cache is fresh.

    Returns:
        MarketRadarResponse with full market analysis.

    Raises:
        MarketDataError: If market data loading or processing fails.
    """
    global _market_cache, _cache_timestamp

    settings = get_settings()

    # Check cache freshness
    if (
        not force_refresh
        and _market_cache is not None
        and _cache_timestamp is not None
    ):
        age_hours = (datetime.now(timezone.utc) - _cache_timestamp).total_seconds() / 3600
        if age_hours < settings.MARKET_REFRESH_INTERVAL_HOURS:
            logger.debug("market_cache_hit", age_hours=round(age_hours, 2))
            cached = _market_cache.copy()

            # Still compute personalized scores for the user
            if user_skills:
                fp_score, aligned, missing = compute_future_proof_score(
                    user_skills, cached["demand_index"]
                )
                cached["user_future_proof_score"] = fp_score
                cached["user_aligned_skills"] = aligned
                cached["user_missing_high_demand"] = missing

            return MarketRadarResponse(**cached)

    try:
        logger.info("market_analysis_started")

        # Load data
        job_listings = _load_market_data(data_path)
        total_jobs = len(job_listings)

        if total_jobs == 0:
            raise MarketDataError(
                message="No job listings found in market data.",
            )

        # Compute skill frequency
        skill_freq = compute_skill_frequency(job_listings)

        # Compute demand index
        demand_idx = compute_demand_index(skill_freq, total_jobs)

        # Build ranked list
        sorted_skills = sorted(demand_idx.items(), key=lambda x: x[1], reverse=True)
        top_skills = [
            SkillDemandEntry(
                skill=skill,
                frequency=skill_freq[skill],
                demand_index=idx,
                rank=rank + 1,
            )
            for rank, (skill, idx) in enumerate(sorted_skills[:30])
        ]

        result = {
            "top_skills": top_skills,
            "total_jobs_analyzed": total_jobs,
            "snapshot_date": datetime.now(timezone.utc),
            "demand_index": demand_idx,  # For internal use
        }

        # Personalized user scoring
        if user_skills:
            fp_score, aligned, missing = compute_future_proof_score(
                user_skills, demand_idx
            )
            result["user_future_proof_score"] = fp_score
            result["user_aligned_skills"] = aligned
            result["user_missing_high_demand"] = missing

        # Update cache
        _market_cache = result
        _cache_timestamp = datetime.now(timezone.utc)

        logger.info(
            "market_analysis_complete",
            total_jobs=total_jobs,
            unique_skills=len(demand_idx),
        )

        return MarketRadarResponse(
            top_skills=top_skills,
            total_jobs_analyzed=total_jobs,
            snapshot_date=result["snapshot_date"],
            user_future_proof_score=result.get("user_future_proof_score"),
            user_aligned_skills=result.get("user_aligned_skills", []),
            user_missing_high_demand=result.get("user_missing_high_demand", []),
        )

    except MarketDataError:
        raise
    except Exception as e:
        logger.error("market_analysis_failed", error=str(e))
        raise MarketDataError(
            message=f"Market analysis failed: {str(e)}",
            details={"error_type": type(e).__name__},
        )
