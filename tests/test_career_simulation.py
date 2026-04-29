"""
reBorn_i — Career Simulation Engine Tests

Tests for skill modification and risk delta computation.
Ensures original data is never mutated.
"""

import pytest

from app.services.career_simulation import (
    _build_simulated_resume_text,
    _modify_skills,
)


class TestModifySkills:
    """Tests for skill modification (copy-based, never mutates original)."""

    def test_adds_skills(self):
        original = ["Python", "Docker"]
        modified = _modify_skills(original, skills_to_add=["AWS", "Go"], skills_to_remove=[])
        assert "Aws" in modified or "AWS" in [s.upper() for s in modified]
        assert len(modified) > len(original)

    def test_removes_skills(self):
        original = ["Python", "Docker", "AWS"]
        modified = _modify_skills(original, skills_to_add=[], skills_to_remove=["Docker"])
        assert "Docker" not in modified
        assert len(modified) < len(original)

    def test_original_not_mutated(self):
        original = ["Python", "Docker", "AWS"]
        original_copy = list(original)
        _modify_skills(original, skills_to_add=["Go"], skills_to_remove=["Docker"])
        assert original == original_copy  # Original must be unchanged

    def test_no_duplicate_additions(self):
        original = ["Python", "Docker"]
        modified = _modify_skills(original, skills_to_add=["python", "PYTHON"], skills_to_remove=[])
        python_count = sum(1 for s in modified if s.lower() == "python")
        assert python_count == 1

    def test_empty_modifications(self):
        original = ["Python", "Docker"]
        modified = _modify_skills(original, skills_to_add=[], skills_to_remove=[])
        assert modified == original

    def test_remove_nonexistent_skill(self):
        original = ["Python", "Docker"]
        modified = _modify_skills(original, skills_to_add=[], skills_to_remove=["Go"])
        assert len(modified) == len(original)


class TestBuildSimulatedResumeText:
    """Tests for simulated resume text construction."""

    def test_appends_added_skills(self):
        original = "I know Python and Docker"
        result = _build_simulated_resume_text(original, ["AWS", "Go"], [])
        assert "AWS" in result
        assert "Go" in result
        assert original in result

    def test_preserves_original_text(self):
        original = "Original resume content here"
        result = _build_simulated_resume_text(original, ["AWS"], ["Python"])
        assert "Original resume content here" in result

    def test_no_additions(self):
        original = "Original text"
        result = _build_simulated_resume_text(original, [], [])
        assert result == original
