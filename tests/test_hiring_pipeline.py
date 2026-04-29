"""
reBorn_i — Hiring Pipeline Survival Simulator Tests

Comprehensive tests for the deterministic hiring pipeline simulation.
Covers validation, survival math, compounding, bottleneck detection,
diagnosis, recommendations, behavioral guidance, confidence intervals,
and full end-to-end simulation.
"""

import pytest

from app.services.hiring_pipeline import (
    _behavioral_guidance,
    _compute_raw_survivals,
    _confidence_interval,
    _detect_bottlenecks,
    _diagnose_stage,
    _recommend_improvements,
    _sequential_compounding,
    _validate_and_clamp,
    simulate_hiring_pipeline,
)
from app.utils.exceptions import HiringPipelineError


# ═══════════════════════════════════════════════════════════
# Valid input fixture
# ═══════════════════════════════════════════════════════════

def _valid_input(**overrides) -> dict:
    """Return a valid baseline input, with optional overrides."""
    base = {
        "ATS_risk": 0.30,
        "Recruiter_risk": 0.40,
        "Market_risk": 0.35,
        "Grammar_risk": 0.10,
        "Formatting_risk": 0.05,
        "domain": "TECH",
    }
    base.update(overrides)
    return base


# ═══════════════════════════════════════════════════════════
# Validation Tests
# ═══════════════════════════════════════════════════════════

class TestValidation:
    """Tests for _validate_and_clamp."""

    def test_valid_input_passes(self):
        result = _validate_and_clamp(_valid_input())
        assert result["ATS_risk"] == 0.30
        assert result["domain"] == "TECH"

    def test_missing_key_raises(self):
        data = _valid_input()
        del data["ATS_risk"]
        with pytest.raises(HiringPipelineError, match="Missing required risk keys"):
            _validate_and_clamp(data)

    def test_invalid_domain_raises(self):
        with pytest.raises(HiringPipelineError, match="Invalid domain"):
            _validate_and_clamp(_valid_input(domain="FINANCE"))

    def test_invalid_type_raises(self):
        with pytest.raises(HiringPipelineError, match="Invalid type"):
            _validate_and_clamp(_valid_input(ATS_risk="high"))

    def test_non_dict_raises(self):
        with pytest.raises(HiringPipelineError, match="Input must be a dictionary"):
            _validate_and_clamp([1, 2, 3])

    def test_values_clamped_to_zero(self):
        result = _validate_and_clamp(_valid_input(ATS_risk=-0.5))
        assert result["ATS_risk"] == 0.0

    def test_values_clamped_to_one(self):
        result = _validate_and_clamp(_valid_input(ATS_risk=1.5))
        assert result["ATS_risk"] == 1.0

    def test_integer_accepted(self):
        result = _validate_and_clamp(_valid_input(ATS_risk=1))
        assert result["ATS_risk"] == 1.0

    def test_non_tech_domain(self):
        result = _validate_and_clamp(_valid_input(domain="NON_TECH"))
        assert result["domain"] == "NON_TECH"


# ═══════════════════════════════════════════════════════════
# Survival Computation Tests
# ═══════════════════════════════════════════════════════════

class TestSurvivalComputation:
    """Tests for _compute_raw_survivals."""

    def test_basic_survival(self):
        ats, rec, mkt = _compute_raw_survivals(0.30, 0.40, 0.35)
        assert abs(ats - 0.70) < 1e-9
        assert abs(rec - 0.60) < 1e-9
        assert abs(mkt - 0.65) < 1e-9

    def test_zero_risk_full_survival(self):
        ats, rec, mkt = _compute_raw_survivals(0.0, 0.0, 0.0)
        assert ats == 1.0
        assert rec == 1.0
        assert mkt == 1.0

    def test_full_risk_zero_survival(self):
        ats, rec, mkt = _compute_raw_survivals(1.0, 1.0, 1.0)
        assert ats == 0.0
        assert rec == 0.0
        assert mkt == 0.0


# ═══════════════════════════════════════════════════════════
# Sequential Compounding Tests
# ═══════════════════════════════════════════════════════════

class TestSequentialCompounding:
    """Tests for _sequential_compounding — multiplicative, not additive."""

    def test_compounding_logic(self):
        ats_s, rec_s, mkt_s, final = _sequential_compounding(0.70, 0.60, 0.65)
        assert abs(ats_s - 0.70) < 1e-9
        assert abs(rec_s - 0.42) < 1e-9
        assert abs(mkt_s - 0.273) < 1e-3
        assert abs(final - mkt_s) < 1e-9

    def test_zero_ats_kills_pipeline(self):
        ats_s, rec_s, mkt_s, final = _sequential_compounding(0.0, 0.90, 0.90)
        assert ats_s == 0.0
        assert rec_s == 0.0
        assert mkt_s == 0.0
        assert final == 0.0

    def test_perfect_survival(self):
        ats_s, rec_s, mkt_s, final = _sequential_compounding(1.0, 1.0, 1.0)
        assert final == 1.0

    def test_tiny_values_clamped(self):
        _, _, _, final = _sequential_compounding(0.001, 0.001, 0.5)
        assert final == 0.0  # Product < 0.0001


# ═══════════════════════════════════════════════════════════
# Bottleneck Detection Tests
# ═══════════════════════════════════════════════════════════

class TestBottleneckDetection:
    """Tests for _detect_bottlenecks."""

    def test_ats_is_weakest(self):
        pri, sec = _detect_bottlenecks(0.30, 0.60, 0.80)
        assert pri == "ATS"
        assert sec == "Recruiter"

    def test_market_is_weakest(self):
        pri, sec = _detect_bottlenecks(0.80, 0.70, 0.20)
        assert pri == "Market"
        assert sec == "Recruiter"

    def test_recruiter_is_weakest(self):
        pri, sec = _detect_bottlenecks(0.80, 0.10, 0.50)
        assert pri == "Recruiter"
        assert sec == "Market"

    def test_equal_values(self):
        pri, sec = _detect_bottlenecks(0.50, 0.50, 0.50)
        # With ties, the first in list order wins
        assert pri in ("ATS", "Recruiter", "Market")
        assert sec in ("ATS", "Recruiter", "Market")
        assert pri != sec


# ═══════════════════════════════════════════════════════════
# Diagnosis Tests
# ═══════════════════════════════════════════════════════════

class TestDiagnosis:
    """Tests for _diagnose_stage."""

    def test_ats_diagnosis(self):
        diag = _diagnose_stage("ATS", 0.30)
        assert "ATS" in diag
        assert "30.0%" in diag
        assert "skill mismatch" in diag.lower()

    def test_recruiter_diagnosis(self):
        diag = _diagnose_stage("Recruiter", 0.50)
        assert "Recruiter" in diag
        assert "50.0%" in diag
        assert "quantified impact" in diag.lower()

    def test_market_diagnosis(self):
        diag = _diagnose_stage("Market", 0.20)
        assert "Market" in diag
        assert "20.0%" in diag
        assert "competition" in diag.lower()


# ═══════════════════════════════════════════════════════════
# Recommendation Tests
# ═══════════════════════════════════════════════════════════

class TestRecommendations:
    """Tests for _recommend_improvements."""

    def test_all_below_threshold(self):
        actions = _recommend_improvements(0.40, 0.50, 0.30)
        assert len(actions) == 9  # 3 per stage

    def test_none_below_threshold(self):
        actions = _recommend_improvements(0.70, 0.80, 0.90)
        assert len(actions) == 0

    def test_only_ats_below(self):
        actions = _recommend_improvements(0.40, 0.80, 0.90)
        assert len(actions) == 3
        assert any("keyword" in a.lower() for a in actions)

    def test_boundary_at_060(self):
        actions = _recommend_improvements(0.60, 0.60, 0.60)
        assert len(actions) == 0  # 0.60 is NOT < 0.60


# ═══════════════════════════════════════════════════════════
# Behavioral Guidance Tests
# ═══════════════════════════════════════════════════════════

class TestBehavioralGuidance:
    """Tests for _behavioral_guidance."""

    def test_strong_probability(self):
        msg = _behavioral_guidance(0.60)
        assert "strong" in msg.lower()
        assert "confidently" in msg.lower()

    def test_competitive_but_not_safe(self):
        msg = _behavioral_guidance(0.35)
        assert "competitive" in msg.lower()

    def test_high_filtering_risk(self):
        msg = _behavioral_guidance(0.20)
        assert "high filtering risk" in msg.lower()

    def test_very_low_survival(self):
        msg = _behavioral_guidance(0.10)
        assert "very low" in msg.lower()

    def test_boundary_050(self):
        msg = _behavioral_guidance(0.50)
        assert "strong" in msg.lower()

    def test_boundary_030(self):
        msg = _behavioral_guidance(0.30)
        assert "competitive" in msg.lower()

    def test_boundary_015(self):
        msg = _behavioral_guidance(0.15)
        assert "high filtering risk" in msg.lower()


# ═══════════════════════════════════════════════════════════
# Confidence Interval Tests
# ═══════════════════════════════════════════════════════════

class TestConfidenceInterval:
    """Tests for _confidence_interval."""

    def test_basic_interval(self):
        lower, upper = _confidence_interval([0.70, 0.60, 0.65], 0.273)
        assert lower >= 0.0
        assert upper <= 1.0
        assert lower <= 0.273
        assert upper >= 0.273

    def test_zero_variance(self):
        lower, upper = _confidence_interval([0.50, 0.50, 0.50], 0.125)
        assert abs(lower - 0.125) < 1e-9
        assert abs(upper - 0.125) < 1e-9

    def test_bounds_clamped(self):
        lower, upper = _confidence_interval([0.0, 1.0, 0.5], 0.01)
        assert lower >= 0.0
        assert upper <= 1.0

    def test_empty_list(self):
        lower, upper = _confidence_interval([], 0.5)
        assert lower == 0.5
        assert upper == 0.5


# ═══════════════════════════════════════════════════════════
# Full Pipeline Integration Tests
# ═══════════════════════════════════════════════════════════

class TestFullPipeline:
    """End-to-end tests for simulate_hiring_pipeline."""

    def test_example_from_spec(self):
        """Verify the expected behavior from the spec example."""
        result = simulate_hiring_pipeline(_valid_input(
            ATS_risk=0.30,
            Recruiter_risk=0.40,
            Market_risk=0.35,
        ))

        ps = result["pipeline_survival"]
        pp = result["pipeline_survival_percent"]

        assert abs(ps["ATS_survival_raw"] - 0.70) < 1e-3
        assert abs(pp["ATS_survival_raw"] - 70.0) < 0.1
        assert abs(ps["Recruiter_stage_compounded"] - 0.42) < 1e-3
        assert abs(pp["Recruiter_stage_compounded"] - 42.0) < 0.1

        # Market stage = 0.42 * 0.65 = 0.273
        assert abs(ps["Market_stage_compounded"] - 0.273) < 1e-3
        assert abs(ps["Final_Interview_Probability"] - 0.273) < 1e-3

        # Output structure
        assert result["domain_detected"] == "TECH"
        assert result["primary_bottleneck_stage"] in ("ATS", "Recruiter", "Market")
        assert result["secondary_bottleneck_stage"] in ("ATS", "Recruiter", "Market")
        assert len(result["why_this_stage_is_weak"]) > 0
        assert isinstance(result["improvement_actions"], list)
        assert len(result["behavior_guidance_message"]) > 0
        assert result["confidence_interval"]["lower"] >= 0.0
        assert result["confidence_interval"]["upper"] <= 1.0
        assert result["chart_base64"] is not None

    def test_all_zero_risk(self):
        result = simulate_hiring_pipeline(_valid_input(
            ATS_risk=0.0, Recruiter_risk=0.0, Market_risk=0.0,
        ))
        assert result["pipeline_survival"]["Final_Interview_Probability"] == 1.0

    def test_all_max_risk(self):
        result = simulate_hiring_pipeline(_valid_input(
            ATS_risk=1.0, Recruiter_risk=1.0, Market_risk=1.0,
        ))
        assert result["pipeline_survival"]["Final_Interview_Probability"] == 0.0

    def test_missing_key_raises(self):
        data = _valid_input()
        del data["Market_risk"]
        with pytest.raises(HiringPipelineError):
            simulate_hiring_pipeline(data)

    def test_invalid_type_raises(self):
        with pytest.raises(HiringPipelineError):
            simulate_hiring_pipeline(_valid_input(Recruiter_risk="bad"))

    def test_output_has_percent_and_raw(self):
        result = simulate_hiring_pipeline(_valid_input())
        assert "pipeline_survival" in result
        assert "pipeline_survival_percent" in result
        assert "confidence_interval" in result
        assert "confidence_interval_percent" in result

    def test_non_tech_domain(self):
        result = simulate_hiring_pipeline(_valid_input(domain="NON_TECH"))
        assert result["domain_detected"] == "NON_TECH"

    def test_never_crashes_on_extreme_values(self):
        """Edge case: all zeros should not crash."""
        result = simulate_hiring_pipeline(_valid_input(
            ATS_risk=0.0, Recruiter_risk=0.0, Market_risk=0.0,
            Grammar_risk=0.0, Formatting_risk=0.0,
        ))
        assert "pipeline_survival" in result

    def test_chart_is_base64(self):
        import base64
        result = simulate_hiring_pipeline(_valid_input())
        try:
            decoded = base64.b64decode(result["chart_base64"])
            assert decoded[:4] == b"\x89PNG"  # PNG magic bytes
        except Exception:
            pytest.fail("chart_base64 is not valid base64-encoded PNG")
