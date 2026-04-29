"""
reBorn_i — Market Radar Module Tests

Tests for skill frequency computation, demand indexing,
and future-proof scoring.
"""

import pytest

from collections import Counter

from app.services.market_radar import (
    compute_demand_index,
    compute_future_proof_score,
    compute_skill_frequency,
)


class TestSkillFrequency:
    """Tests for skill frequency computation."""

    def test_counts_skills_correctly(self):
        listings = [
            {"title": "Job A", "skills": ["python", "docker"]},
            {"title": "Job B", "skills": ["python", "aws"]},
            {"title": "Job C", "skills": ["docker", "aws", "python"]},
        ]
        freq = compute_skill_frequency(listings)
        assert freq["python"] == 3
        assert freq["docker"] == 2
        assert freq["aws"] == 2

    def test_handles_empty_listings(self):
        freq = compute_skill_frequency([])
        assert len(freq) == 0

    def test_handles_missing_skills_key(self):
        listings = [{"title": "Job A"}]
        freq = compute_skill_frequency(listings)
        assert len(freq) == 0

    def test_normalizes_to_lowercase(self):
        listings = [
            {"title": "Job A", "skills": ["Python", "DOCKER"]},
        ]
        freq = compute_skill_frequency(listings)
        assert "python" in freq
        assert "docker" in freq


class TestDemandIndex:
    """Tests for demand index computation."""

    def test_computes_correctly(self):
        freq = Counter({"python": 8, "docker": 5})
        index = compute_demand_index(freq, 10)
        assert index["python"] == 0.8
        assert index["docker"] == 0.5

    def test_handles_zero_total(self):
        freq = Counter({"python": 0})
        index = compute_demand_index(freq, 0)
        assert len(index) == 0

    def test_values_are_bounded(self):
        freq = Counter({"python": 10, "docker": 5, "aws": 1})
        index = compute_demand_index(freq, 10)
        for value in index.values():
            assert 0.0 <= value <= 1.0


class TestFutureProofScore:
    """Tests for user future-proof scoring."""

    def test_high_alignment(self):
        user_skills = ["python", "docker", "aws", "kubernetes"]
        demand = {"python": 0.9, "docker": 0.7, "aws": 0.8, "kubernetes": 0.6}
        score, aligned, missing = compute_future_proof_score(user_skills, demand)
        assert score > 0.5
        assert len(aligned) == 4
        assert len(missing) == 0

    def test_low_alignment(self):
        user_skills = ["painting", "cooking"]
        demand = {"python": 0.9, "docker": 0.7, "aws": 0.8}
        score, aligned, missing = compute_future_proof_score(user_skills, demand)
        assert score < 0.5
        assert len(aligned) == 0

    def test_empty_user_skills(self):
        demand = {"python": 0.9}
        score, aligned, missing = compute_future_proof_score([], demand)
        assert score == 0.0

    def test_empty_demand(self):
        score, aligned, missing = compute_future_proof_score(["python"], {})
        assert score == 0.0

    def test_score_is_bounded(self):
        user_skills = ["python", "docker"]
        demand = {"python": 0.9, "docker": 0.7, "aws": 0.8}
        score, _, _ = compute_future_proof_score(user_skills, demand)
        assert 0.0 <= score <= 1.0
