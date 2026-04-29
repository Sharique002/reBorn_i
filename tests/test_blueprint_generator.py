"""
reBorn_i — Blueprint Generator Tests

Tests for blueprint validation schemas and fallback plan generation.
"""

import pytest

from app.services.blueprint_generator import (
    _generate_fallback_plan,
    _validate_blueprint_response,
)
from app.utils.exceptions import LLMResponseValidationError


class TestBlueprintValidation:
    """Tests for blueprint response schema validation."""

    def test_valid_30_day_plan(self):
        data = {
            "plan_type": "30_day",
            "target_role": "Senior Engineer",
            "weeks": [
                {
                    "week_number": 1,
                    "theme": "Foundation",
                    "tasks": [
                        {"task": "Learn Python", "category": "learning", "estimated_hours": 5}
                    ],
                    "milestone": "Basics done",
                    "measurable_outcome": "Completed course",
                }
            ],
            "expected_risk_reduction": 0.1,
            "key_focus_areas": ["Python"],
        }
        result = _validate_blueprint_response("30_day", data)
        assert result["plan_type"] == "30_day"
        assert len(result["weeks"]) == 1

    def test_valid_90_day_plan(self):
        data = {
            "plan_type": "90_day",
            "target_role": "ML Engineer",
            "months": [
                {
                    "month_number": 1,
                    "phase_name": "Foundation",
                    "weekly_focuses": [
                        {
                            "week_range": "Week 1-2",
                            "focus": "Learning",
                            "tasks": [
                                {"task": "Study ML", "category": "learning", "priority": "high", "estimated_hours": 10}
                            ],
                        }
                    ],
                    "kpis": ["Complete course"],
                    "milestone": "Basics mastered",
                }
            ],
            "expected_risk_reduction": 0.2,
            "career_trajectory": "Growth path",
        }
        result = _validate_blueprint_response("90_day", data)
        assert result["plan_type"] == "90_day"
        assert len(result["months"]) == 1

    def test_invalid_plan_raises_error(self):
        data = {"plan_type": "30_day"}  # Missing required fields
        with pytest.raises(LLMResponseValidationError):
            _validate_blueprint_response("30_day", data)


class TestFallbackPlan:
    """Tests for template-based fallback plan generation."""

    def test_30_day_fallback(self):
        plan = _generate_fallback_plan(
            current_skills=["Python", "Docker"],
            skill_gaps=["AWS", "Kubernetes"],
            target_role="DevOps Engineer",
            plan_type="30_day",
            risk_score=0.7,
        )
        assert plan["plan_type"] == "30_day"
        assert plan["target_role"] == "DevOps Engineer"
        assert len(plan["weeks"]) == 4
        assert plan["_fallback"] is True

    def test_90_day_fallback(self):
        plan = _generate_fallback_plan(
            current_skills=["Python"],
            skill_gaps=["Machine Learning", "TensorFlow"],
            target_role="ML Engineer",
            plan_type="90_day",
            risk_score=0.8,
        )
        assert plan["plan_type"] == "90_day"
        assert plan["target_role"] == "ML Engineer"
        assert len(plan["months"]) == 3
        assert plan["_fallback"] is True

    def test_fallback_has_expected_risk_reduction(self):
        plan = _generate_fallback_plan(
            current_skills=["Python"],
            skill_gaps=["AWS"],
            target_role="Cloud Engineer",
            plan_type="30_day",
            risk_score=0.6,
        )
        assert "expected_risk_reduction" in plan
        assert plan["expected_risk_reduction"] >= 0

    def test_fallback_includes_template_version(self):
        plan = _generate_fallback_plan(
            current_skills=["Python"],
            skill_gaps=["AWS"],
            target_role="Cloud Engineer",
            plan_type="30_day",
            risk_score=0.5,
        )
        assert "prompt_template_version" in plan
