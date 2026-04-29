"""
reBorn_i — Career Simulation Engine (Service D)

Allows users to simulate skill modifications and see the impact
on their rejection risk score WITHOUT modifying their actual resume data.

Key constraints:
- Original resume data must NEVER be modified
- All simulations use copies of the data
- Before vs after metrics are clearly separated
- Embedding recalculation uses the same deterministic pipeline
"""

from typing import Any, Dict, List, Optional

from app.config.prompt_templates import CAREER_SIMULATION_PROMPT
from app.schemas.schemas import (
    CareerSimulationResponse,
    ComponentScore,
    SimulationMetrics,
)
from app.services.rejection_engine import compute_rejection_risk
from app.utils.exceptions import SimulationError
from app.utils.llm_client import call_llm_structured
from app.utils.logging import get_logger

logger = get_logger(__name__)


def _modify_skills(
    original_skills: List[str],
    skills_to_add: List[str],
    skills_to_remove: List[str],
) -> List[str]:
    """Create a modified skill list without mutating the original.

    Args:
        original_skills: Current skill list (not modified).
        skills_to_add: Skills to add to the simulation.
        skills_to_remove: Skills to remove in the simulation.

    Returns:
        New list with modifications applied.
    """
    # Work with a copy
    modified = list(original_skills)

    # Remove specified skills
    remove_lower = {s.lower() for s in skills_to_remove}
    modified = [s for s in modified if s.lower() not in remove_lower]

    # Add new skills (avoid duplicates)
    existing_lower = {s.lower() for s in modified}
    for skill in skills_to_add:
        if skill.lower() not in existing_lower:
            modified.append(skill.title())
            existing_lower.add(skill.lower())

    return modified


def _build_simulated_resume_text(
    original_text: str,
    skills_to_add: List[str],
    skills_to_remove: List[str],
) -> str:
    """Build a simulated resume text by appending/removing skills.

    This creates a text representation for embedding purposes.
    The original text is NOT modified — skills are appended.

    Args:
        original_text: Original resume text.
        skills_to_add: Skills to add.
        skills_to_remove: Skills to remove.

    Returns:
        Simulated resume text for embedding computation.
    """
    # Start with original text
    simulated = original_text

    # Append added skills to the text (for embedding purposes)
    if skills_to_add:
        skill_section = "\n\nAdditional Skills: " + ", ".join(skills_to_add)
        simulated += skill_section

    # We don't physically remove text (would break structure),
    # but the scoring uses the modified skill list

    return simulated


async def run_career_simulation(
    resume_text: str,
    resume_skills: List[str],
    resume_experience_level: str,
    jd_text: str,
    skills_to_add: List[str],
    skills_to_remove: List[str],
) -> Dict[str, Any]:
    """Execute a career simulation comparing before vs after skill modifications.

    Args:
        resume_text: Original cleaned resume text.
        resume_skills: Original extracted skills list.
        resume_experience_level: Experience level string.
        jd_text: Job description text for comparison.
        skills_to_add: Skills to add in simulation.
        skills_to_remove: Skills to remove in simulation.

    Returns:
        Dictionary with before_metrics, after_metrics, risk_delta, and explanation.

    Raises:
        SimulationError: If simulation computation fails.
    """
    if not skills_to_add and not skills_to_remove:
        raise SimulationError(
            message="At least one skill must be added or removed for simulation.",
            details={"skills_to_add": skills_to_add, "skills_to_remove": skills_to_remove},
        )

    try:
        logger.info(
            "career_simulation_started",
            skills_to_add=len(skills_to_add),
            skills_to_remove=len(skills_to_remove),
        )

        # ── Before Metrics (original) ────────────────────────
        before_result = compute_rejection_risk(
            resume_text=resume_text,
            resume_skills=resume_skills,
            resume_experience_level=resume_experience_level,
            jd_text=jd_text,
        )

        before_metrics = SimulationMetrics(
            risk_score=before_result["risk_score"],
            skill_gaps=before_result["skill_gaps"],
            matched_skills=before_result["matched_skills"],
            component_scores=before_result["component_scores"],
        )

        # ── Modify skills (copy, never mutate) ───────────────
        modified_skills = _modify_skills(
            original_skills=resume_skills,
            skills_to_add=skills_to_add,
            skills_to_remove=skills_to_remove,
        )

        # ── Build simulated text ─────────────────────────────
        simulated_text = _build_simulated_resume_text(
            original_text=resume_text,
            skills_to_add=skills_to_add,
            skills_to_remove=skills_to_remove,
        )

        # ── After Metrics (simulated) ────────────────────────
        after_result = compute_rejection_risk(
            resume_text=simulated_text,
            resume_skills=modified_skills,
            resume_experience_level=resume_experience_level,
            jd_text=jd_text,
        )

        after_metrics = SimulationMetrics(
            risk_score=after_result["risk_score"],
            skill_gaps=after_result["skill_gaps"],
            matched_skills=after_result["matched_skills"],
            component_scores=after_result["component_scores"],
        )

        # ── Compute risk delta ───────────────────────────────
        risk_delta = round(after_metrics.risk_score - before_metrics.risk_score, 4)

        # ── Generate explanation (optional, non-blocking) ────
        explanation = None
        try:
            prompt = CAREER_SIMULATION_PROMPT.format(
                before_risk_score=before_metrics.risk_score,
                before_skill_gaps=", ".join(before_metrics.skill_gaps[:10]),
                after_risk_score=after_metrics.risk_score,
                after_skill_gaps=", ".join(after_metrics.skill_gaps[:10]),
                skills_added=", ".join(skills_to_add) if skills_to_add else "None",
                skills_removed=", ".join(skills_to_remove) if skills_to_remove else "None",
            )
            explanation = await call_llm_structured(prompt)
        except Exception as e:
            logger.warning("simulation_explanation_failed", error=str(e))
            # Don't fail the simulation if explanation generation fails

        result = {
            "before_metrics": before_metrics,
            "after_metrics": after_metrics,
            "risk_delta": risk_delta,
            "skills_added": skills_to_add,
            "skills_removed": skills_to_remove,
            "original_skills": resume_skills,  # Preserved, never modified
            "modified_skills": modified_skills,
            "explanation": explanation,
        }

        logger.info(
            "career_simulation_complete",
            risk_delta=risk_delta,
            before_risk=before_metrics.risk_score,
            after_risk=after_metrics.risk_score,
        )

        return result

    except SimulationError:
        raise
    except Exception as e:
        logger.error("career_simulation_failed", error=str(e))
        raise SimulationError(
            message=f"Career simulation failed: {str(e)}",
            details={"error_type": type(e).__name__},
        )
