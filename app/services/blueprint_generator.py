"""
reBorn_i — Reinvention Blueprint Generator (Service E)

Generates structured 30-day and 90-day career reinvention action plans
using LLM with strict JSON schema enforcement.

Key requirements:
- Uses version-controlled prompt templates
- Validates LLM response schema before returning
- Includes retry logic for API failures (handled by llm_client)
- Produces deterministic prompt → structured output pipeline
"""

import json
from typing import Any, Dict, List, Optional

from pydantic import BaseModel, Field, ValidationError

from app.config.prompt_templates import (
    PROMPT_TEMPLATE_VERSION,
    REINVENTION_BLUEPRINT_30_PROMPT,
    REINVENTION_BLUEPRINT_90_PROMPT,
    TEMPLATE_REGISTRY,
)
from app.utils.exceptions import LLMError, LLMResponseValidationError
from app.utils.llm_client import call_llm_structured
from app.utils.logging import get_logger
from app.utils.security import check_prompt_injection

logger = get_logger(__name__)


# ═══════════════════════════════════════════════════════════
# Response Validation Schemas
# ═══════════════════════════════════════════════════════════

class BlueprintTask(BaseModel):
    """Single task in a blueprint plan."""
    task: str
    category: str
    estimated_hours: Optional[float] = None
    resource_url: Optional[str] = None
    priority: Optional[str] = None


class Week30Plan(BaseModel):
    """Weekly plan for 30-day blueprint."""
    week_number: int
    theme: str
    tasks: List[BlueprintTask]
    milestone: str
    measurable_outcome: str


class Blueprint30Response(BaseModel):
    """Validated schema for 30-day blueprint LLM response."""
    plan_type: str = "30_day"
    target_role: str
    weeks: List[Week30Plan]
    expected_risk_reduction: Optional[float] = None
    key_focus_areas: List[str] = Field(default_factory=list)


class WeeklyFocus90(BaseModel):
    """Weekly focus area in 90-day plan."""
    week_range: str
    focus: str
    tasks: List[BlueprintTask]


class Month90Plan(BaseModel):
    """Monthly plan for 90-day blueprint."""
    month_number: int
    phase_name: str
    weekly_focuses: List[WeeklyFocus90]
    kpis: List[str] = Field(default_factory=list)
    milestone: str


class Blueprint90Response(BaseModel):
    """Validated schema for 90-day blueprint LLM response."""
    plan_type: str = "90_day"
    target_role: str
    months: List[Month90Plan]
    expected_risk_reduction: Optional[float] = None
    career_trajectory: Optional[str] = None


# ═══════════════════════════════════════════════════════════
# Blueprint Generation
# ═══════════════════════════════════════════════════════════

def _validate_blueprint_response(
    plan_type: str, response_data: Dict[str, Any]
) -> Dict[str, Any]:
    """Validate LLM response against the expected blueprint schema.

    Args:
        plan_type: "30_day" or "90_day".
        response_data: Parsed JSON from LLM.

    Returns:
        Validated and normalized response dictionary.

    Raises:
        LLMResponseValidationError: If validation fails.
    """
    try:
        if plan_type == "30_day":
            validated = Blueprint30Response.model_validate(response_data)
        elif plan_type == "90_day":
            validated = Blueprint90Response.model_validate(response_data)
        else:
            raise ValueError(f"Unknown plan type: {plan_type}")

        return validated.model_dump()

    except ValidationError as e:
        logger.error(
            "blueprint_validation_failed",
            plan_type=plan_type,
            errors=str(e),
        )
        raise LLMResponseValidationError(
            message=f"Blueprint response failed schema validation for {plan_type} plan.",
            details={"validation_errors": e.errors()},
        )


async def generate_blueprint(
    current_skills: List[str],
    skill_gaps: List[str],
    target_role: str,
    experience_level: str,
    risk_score: float,
    plan_type: str = "30_day",
) -> Dict[str, Any]:
    """Generate a reinvention blueprint action plan.

    Args:
        current_skills: User's current skill set.
        skill_gaps: Identified skill gaps from rejection analysis.
        target_role: The role the user is targeting.
        experience_level: User's current experience level.
        risk_score: Current rejection risk score.
        plan_type: "30_day" or "90_day".

    Returns:
        Validated blueprint plan dictionary.

    Raises:
        LLMError: If LLM call fails after retries.
        LLMResponseValidationError: If response doesn't match expected schema.
    """
    # Validate inputs
    if plan_type not in ("30_day", "90_day"):
        raise ValueError(f"plan_type must be '30_day' or '90_day', got '{plan_type}'")

    # Check for prompt injection in target_role
    check_prompt_injection(target_role)

    logger.info(
        "blueprint_generation_started",
        plan_type=plan_type,
        target_role=target_role,
        skill_count=len(current_skills),
        gap_count=len(skill_gaps),
    )

    # Select the right template
    if plan_type == "30_day":
        template = REINVENTION_BLUEPRINT_30_PROMPT
    else:
        template = REINVENTION_BLUEPRINT_90_PROMPT

    # Format prompt with user data
    prompt = template.format(
        current_skills=", ".join(current_skills) if current_skills else "Not specified",
        skill_gaps=", ".join(skill_gaps) if skill_gaps else "None identified",
        target_role=target_role,
        experience_level=experience_level,
        risk_score=risk_score,
    )

    # Call LLM with retry logic (handled by llm_client)
    try:
        raw_response = await call_llm_structured(prompt)
    except LLMError:
        raise
    except Exception as e:
        logger.error("blueprint_llm_call_failed", error=str(e))
        raise LLMError(
            message=f"Failed to generate blueprint: {str(e)}",
            details={"plan_type": plan_type, "target_role": target_role},
        )

    # Validate response schema
    validated_plan = _validate_blueprint_response(plan_type, raw_response)

    # Attach metadata
    validated_plan["prompt_template_version"] = PROMPT_TEMPLATE_VERSION
    validated_plan["risk_score_at_creation"] = risk_score

    logger.info(
        "blueprint_generation_complete",
        plan_type=plan_type,
        target_role=target_role,
        template_version=PROMPT_TEMPLATE_VERSION,
    )

    return validated_plan


async def generate_blueprint_with_fallback(
    current_skills: List[str],
    skill_gaps: List[str],
    target_role: str,
    experience_level: str,
    risk_score: float,
    plan_type: str = "30_day",
) -> Dict[str, Any]:
    """Generate a blueprint with graceful fallback on LLM failure.

    If the LLM fails (even after retries), returns a basic template-based plan
    rather than failing completely.

    Args:
        Same as generate_blueprint.

    Returns:
        Blueprint plan dictionary (LLM-generated or fallback).
    """
    try:
        return await generate_blueprint(
            current_skills=current_skills,
            skill_gaps=skill_gaps,
            target_role=target_role,
            experience_level=experience_level,
            risk_score=risk_score,
            plan_type=plan_type,
        )
    except (LLMError, LLMResponseValidationError) as e:
        logger.warning(
            "blueprint_fallback_triggered",
            plan_type=plan_type,
            error=str(e),
        )
        return _generate_fallback_plan(
            current_skills=current_skills,
            skill_gaps=skill_gaps,
            target_role=target_role,
            plan_type=plan_type,
            risk_score=risk_score,
        )


def _generate_fallback_plan(
    current_skills: List[str],
    skill_gaps: List[str],
    target_role: str,
    plan_type: str,
    risk_score: float,
) -> Dict[str, Any]:
    """Generate a basic template-based plan when LLM is unavailable.

    Args:
        Same as generate_blueprint (subset).

    Returns:
        Basic plan dictionary.
    """
    logger.info("generating_fallback_plan", plan_type=plan_type)

    if plan_type == "30_day":
        return {
            "plan_type": "30_day",
            "target_role": target_role,
            "weeks": [
                {
                    "week_number": 1,
                    "theme": "Foundation & Assessment",
                    "tasks": [
                        {"task": f"Research {target_role} requirements in depth", "category": "learning", "estimated_hours": 3},
                        {"task": f"Begin learning: {skill_gaps[0] if skill_gaps else 'core skill'}", "category": "learning", "estimated_hours": 5},
                        {"task": "Update LinkedIn profile with target keywords", "category": "networking", "estimated_hours": 2},
                    ],
                    "milestone": "Clear understanding of skill gaps",
                    "measurable_outcome": "Completed skills assessment and started first learning path",
                },
                {
                    "week_number": 2,
                    "theme": "Skill Building",
                    "tasks": [
                        {"task": f"Continue learning top skill gaps: {', '.join(skill_gaps[:3])}", "category": "learning", "estimated_hours": 8},
                        {"task": "Start a small project demonstrating new skills", "category": "building", "estimated_hours": 5},
                    ],
                    "milestone": "Begun skill development",
                    "measurable_outcome": "Completed first module of priority skill course",
                },
                {
                    "week_number": 3,
                    "theme": "Portfolio Development",
                    "tasks": [
                        {"task": "Build portfolio project using target skills", "category": "building", "estimated_hours": 10},
                        {"task": "Connect with professionals in target role", "category": "networking", "estimated_hours": 3},
                    ],
                    "milestone": "Working portfolio piece",
                    "measurable_outcome": "Portfolio project at MVP stage",
                },
                {
                    "week_number": 4,
                    "theme": "Application Preparation",
                    "tasks": [
                        {"task": "Tailor resume for target role", "category": "applying", "estimated_hours": 3},
                        {"task": "Apply to 5 positions", "category": "applying", "estimated_hours": 5},
                        {"task": "Practice interview questions", "category": "applying", "estimated_hours": 4},
                    ],
                    "milestone": "Ready to apply",
                    "measurable_outcome": "Submitted 5 applications with tailored resume",
                },
            ],
            "expected_risk_reduction": min(0.15, risk_score * 0.3),
            "key_focus_areas": skill_gaps[:5] if skill_gaps else ["General skill development"],
            "prompt_template_version": PROMPT_TEMPLATE_VERSION,
            "risk_score_at_creation": risk_score,
            "_fallback": True,
        }
    else:
        return {
            "plan_type": "90_day",
            "target_role": target_role,
            "months": [
                {
                    "month_number": 1,
                    "phase_name": "Foundation & Quick Wins",
                    "weekly_focuses": [
                        {"week_range": "Week 1-2", "focus": "Skills assessment and learning plan", "tasks": [
                            {"task": "Complete skills gap analysis", "category": "learning", "priority": "high", "estimated_hours": 5},
                        ]},
                        {"week_range": "Week 3-4", "focus": "Begin core skill development", "tasks": [
                            {"task": f"Start learning: {', '.join(skill_gaps[:2])}", "category": "learning", "priority": "high", "estimated_hours": 15},
                        ]},
                    ],
                    "kpis": ["Completed skills assessment", "Started 2 learning paths"],
                    "milestone": "Foundation established",
                },
                {
                    "month_number": 2,
                    "phase_name": "Deep Skill Development",
                    "weekly_focuses": [
                        {"week_range": "Week 5-6", "focus": "Advanced skill building", "tasks": [
                            {"task": "Build comprehensive portfolio project", "category": "building", "priority": "high", "estimated_hours": 20},
                        ]},
                        {"week_range": "Week 7-8", "focus": "Community engagement", "tasks": [
                            {"task": "Contribute to open source or publish content", "category": "networking", "priority": "medium", "estimated_hours": 10},
                        ]},
                    ],
                    "kpis": ["Portfolio project complete", "3 professional connections made"],
                    "milestone": "Demonstrable skills acquired",
                },
                {
                    "month_number": 3,
                    "phase_name": "Job Search Execution",
                    "weekly_focuses": [
                        {"week_range": "Week 9-10", "focus": "Resume optimization and applications", "tasks": [
                            {"task": "Apply to 15+ positions with tailored resume", "category": "applying", "priority": "high", "estimated_hours": 15},
                        ]},
                        {"week_range": "Week 11-12", "focus": "Interview preparation", "tasks": [
                            {"task": "Complete mock interviews and refine pitch", "category": "applying", "priority": "high", "estimated_hours": 10},
                        ]},
                    ],
                    "kpis": ["15+ applications submitted", "3+ interviews scheduled"],
                    "milestone": "Active job search with strong pipeline",
                },
            ],
            "expected_risk_reduction": min(0.30, risk_score * 0.5),
            "career_trajectory": f"From current level to {target_role} through structured skill building",
            "prompt_template_version": PROMPT_TEMPLATE_VERSION,
            "risk_score_at_creation": risk_score,
            "_fallback": True,
        }
