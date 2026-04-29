"""
reBorn_i — Hiring Pipeline Survival Simulator

Simulates stage-wise hiring survival probability using deterministic math.
No LLMs are used for computation — only pure mathematical formulas.

Pipeline stages:
    Resume → ATS Filter → Recruiter Scan → Market Competition → Interview

Given precomputed risk values, the module:
1. Converts risk → survival (1 - risk)
2. Applies sequential multiplicative compounding
3. Generates a matplotlib bar chart (base64 PNG)
4. Detects primary and secondary bottleneck stages
5. Produces stage-specific diagnosis, improvement actions,
   behavioral guidance, and confidence intervals
"""

import base64
import datetime
import io
import warnings
from math import sqrt
from typing import Any, Dict, List, Optional, Tuple

import matplotlib
matplotlib.use("Agg")  # Non-interactive backend for server use
import matplotlib.pyplot as plt

from app.utils.exceptions import HiringPipelineError
from app.utils.logging import get_logger

logger = get_logger(__name__)

# ── Constants ────────────────────────────────────────────────

_REQUIRED_KEYS = [
    "ATS_risk",
    "Recruiter_risk",
    "Market_risk",
    "Grammar_risk",
    "Formatting_risk",
    "domain",
]

_VALID_DOMAINS = {"TECH", "NON_TECH"}

_STAGE_NAMES = {
    "ATS_survival_raw": "ATS Survival",
    "Recruiter_survival_raw": "Recruiter Survival",
    "Market_survival_raw": "Market Survival",
}

# Minimum survival threshold below which values are clamped to 0
_MIN_SURVIVAL = 0.0001


# ═══════════════════════════════════════════════════════════
# Step 0 — Input Validation & Clamping
# ═══════════════════════════════════════════════════════════

def _validate_and_clamp(risk_data: dict) -> dict:
    """Validate all required keys exist, types are correct, and clamp values to [0, 1].

    Args:
        risk_data: Raw input dictionary.

    Returns:
        Sanitised copy of risk_data with clamped float values.

    Raises:
        HiringPipelineError: If required keys are missing or types are invalid.
    """
    if not isinstance(risk_data, dict):
        raise HiringPipelineError(
            message="Input must be a dictionary.",
            details={"received_type": type(risk_data).__name__},
        )

    # Check for missing keys
    missing = [k for k in _REQUIRED_KEYS if k not in risk_data]
    if missing:
        raise HiringPipelineError(
            message=f"Missing required risk keys: {', '.join(missing)}",
            details={"missing_keys": missing},
        )

    # Validate domain
    domain = risk_data.get("domain")
    if domain not in _VALID_DOMAINS:
        raise HiringPipelineError(
            message=f"Invalid domain '{domain}'. Must be one of: {_VALID_DOMAINS}",
            details={"received_domain": domain},
        )

    # Validate and clamp numeric risk values
    clamped: Dict[str, Any] = {"domain": domain}
    risk_keys = [k for k in _REQUIRED_KEYS if k != "domain"]

    for key in risk_keys:
        value = risk_data[key]

        # Type check
        if not isinstance(value, (int, float)):
            raise HiringPipelineError(
                message=f"Invalid type for '{key}': expected numeric, got {type(value).__name__}.",
                details={"key": key, "received_type": type(value).__name__},
            )

        # Clamp and warn
        original = float(value)
        clamped_value = max(0.0, min(1.0, original))

        if clamped_value != original:
            logger.warning(
                "risk_value_clamped",
                key=key,
                original=original,
                clamped=clamped_value,
            )

        clamped[key] = clamped_value

    return clamped


# ═══════════════════════════════════════════════════════════
# Step 1 — Risk → Survival Conversion
# ═══════════════════════════════════════════════════════════

def _compute_raw_survivals(
    ats_risk: float,
    recruiter_risk: float,
    market_risk: float,
) -> Tuple[float, float, float]:
    """Convert risk values to raw survival probabilities (1 - risk), clamped to [0, 1].

    Returns:
        Tuple of (ATS_survival_raw, Recruiter_survival_raw, Market_survival_raw).
    """
    ats = max(0.0, min(1.0, 1.0 - ats_risk))
    recruiter = max(0.0, min(1.0, 1.0 - recruiter_risk))
    market = max(0.0, min(1.0, 1.0 - market_risk))
    return ats, recruiter, market


# ═══════════════════════════════════════════════════════════
# Step 2 — Sequential Elimination Model
# ═══════════════════════════════════════════════════════════

def _sequential_compounding(
    ats_raw: float,
    recruiter_raw: float,
    market_raw: float,
) -> Tuple[float, float, float, float]:
    """Apply multiplicative compounding across stages.

    Returns:
        (ats_stage, recruiter_stage, market_stage, final_interview_probability)
    """
    ats_stage = ats_raw
    recruiter_stage = ats_stage * recruiter_raw
    market_stage = recruiter_stage * market_raw
    final = market_stage

    # Clamp extremely small values to 0
    if ats_stage < _MIN_SURVIVAL:
        ats_stage = 0.0
    if recruiter_stage < _MIN_SURVIVAL:
        recruiter_stage = 0.0
    if market_stage < _MIN_SURVIVAL:
        market_stage = 0.0
    if final < _MIN_SURVIVAL:
        final = 0.0

    return ats_stage, recruiter_stage, market_stage, final


# ═══════════════════════════════════════════════════════════
# Step 3 — Chart Generation
# ═══════════════════════════════════════════════════════════

def _generate_chart(
    ats_stage: float,
    recruiter_stage: float,
    market_stage: float,
    final_prob: float,
) -> str:
    """Generate a single matplotlib bar chart and return as base64-encoded PNG.

    Rules enforced:
    - matplotlib only (no seaborn)
    - One bar chart only, no multiple plots
    - No custom colors
    - Y-axis 0–100
    - Values converted to percentage

    Returns:
        Base64-encoded PNG string.
    """
    labels = [
        "ATS Survival",
        "Recruiter Survival",
        "Market Survival",
        "Interview Probability",
    ]
    values = [
        ats_stage * 100,
        recruiter_stage * 100,
        market_stage * 100,
        final_prob * 100,
    ]

    fig, ax = plt.subplots(figsize=(8, 5))
    ax.bar(labels, values)
    ax.set_ylim(0, 100)
    ax.set_ylabel("Probability (%)")
    ax.set_title("Hiring Pipeline Survival Simulation")

    # Add value labels on bars
    for i, v in enumerate(values):
        ax.text(i, v + 1.5, f"{v:.1f}%", ha="center", va="bottom", fontsize=9)

    plt.tight_layout()

    buf = io.BytesIO()
    fig.savefig(buf, format="png", dpi=100)
    plt.close(fig)
    buf.seek(0)

    return base64.b64encode(buf.read()).decode("utf-8")


# ═══════════════════════════════════════════════════════════
# Step 4 — Bottleneck Detection
# ═══════════════════════════════════════════════════════════

def _detect_bottlenecks(
    ats_raw: float,
    recruiter_raw: float,
    market_raw: float,
) -> Tuple[str, str]:
    """Find primary (lowest raw survival) and secondary bottleneck stages.

    Returns:
        (primary_bottleneck_stage, secondary_bottleneck_stage)
    """
    stages = [
        ("ATS", ats_raw),
        ("Recruiter", recruiter_raw),
        ("Market", market_raw),
    ]
    sorted_stages = sorted(stages, key=lambda x: x[1])
    primary = sorted_stages[0][0]
    secondary = sorted_stages[1][0]
    return primary, secondary


# ═══════════════════════════════════════════════════════════
# Step 5 — Stage-Specific Diagnosis
# ═══════════════════════════════════════════════════════════

def _diagnose_stage(
    stage_name: str,
    survival_value: float,
) -> str:
    """Generate a diagnosis string explaining why a stage is weak.

    Args:
        stage_name: One of "ATS", "Recruiter", "Market".
        survival_value: The raw survival probability for the stage.

    Returns:
        Human-readable diagnosis referencing actual numeric survival value.
    """
    pct = survival_value * 100

    if stage_name == "ATS":
        return (
            f"ATS survival is critically low at {pct:.1f}%. "
            f"This indicates skill mismatch with job requirements, "
            f"keyword gaps in the resume, and potential experience threshold issues "
            f"that cause automated filtering systems to reject the application."
        )
    elif stage_name == "Recruiter":
        return (
            f"Recruiter survival is low at {pct:.1f}%. "
            f"This suggests weak quantified impact in experience descriptions, "
            f"low semantic alignment between resume language and role expectations, "
            f"and poor role positioning that fails to capture recruiter attention."
        )
    elif stage_name == "Market":
        return (
            f"Market survival is low at {pct:.1f}%. "
            f"This reflects high competition in the target domain, "
            f"low demand alignment with available opportunities, "
            f"and field saturation making it harder to stand out."
        )

    return f"Stage '{stage_name}' has survival of {pct:.1f}%."


# ═══════════════════════════════════════════════════════════
# Step 6 — Improvement Recommendations
# ═══════════════════════════════════════════════════════════

_ATS_IMPROVEMENTS = [
    "Add missing required skills explicitly mentioned in the job description",
    "Improve keyword alignment — mirror JD terminology in your resume",
    "Align experience wording to match the job description phrasing",
]

_RECRUITER_IMPROVEMENTS = [
    "Add quantified achievements with percentage metrics (e.g., 'Improved throughput by 40%')",
    "Improve clarity and impact storytelling in bullet points",
    "Strengthen seniority positioning to match the target role level",
]

_MARKET_IMPROVEMENTS = [
    "Add trending skills relevant to your target domain",
    "Improve specialization depth — show domain expertise clearly",
    "Consider targeting slightly aligned roles to broaden opportunity pool",
]


def _recommend_improvements(
    ats_raw: float,
    recruiter_raw: float,
    market_raw: float,
) -> List[str]:
    """Generate improvement actions for stages with survival < 0.60.

    Returns:
        List of actionable improvement strings.
    """
    actions: List[str] = []

    if ats_raw < 0.60:
        actions.extend(_ATS_IMPROVEMENTS)
    if recruiter_raw < 0.60:
        actions.extend(_RECRUITER_IMPROVEMENTS)
    if market_raw < 0.60:
        actions.extend(_MARKET_IMPROVEMENTS)

    return actions


# ═══════════════════════════════════════════════════════════
# Step 7 — Behavioral Guidance
# ═══════════════════════════════════════════════════════════

def _behavioral_guidance(final_prob: float) -> str:
    """Return tier-based behavioral guidance message.

    Args:
        final_prob: Final interview probability (0–1).

    Returns:
        Guidance message string.
    """
    if final_prob >= 0.50:
        return (
            "Strong interview probability. "
            "Apply confidently while refining minor weaknesses."
        )
    elif final_prob >= 0.30:
        return (
            "Competitive but not safe. "
            "Strengthen weakest stage before large-scale applications."
        )
    elif final_prob >= 0.15:
        return (
            "High filtering risk. "
            "Improve primary bottleneck stage before applying."
        )
    else:
        return (
            "Very low survival probability. "
            "Major improvements required before applying."
        )


# ═══════════════════════════════════════════════════════════
# Step 8 — Confidence Interval
# ═══════════════════════════════════════════════════════════

def _confidence_interval(
    survival_list: List[float],
    final_prob: float,
) -> Tuple[float, float]:
    """Compute confidence interval using variance across raw stage survivals.

    Returns:
        (lower_bound, upper_bound) clamped to [0, 1].
    """
    n = len(survival_list)
    if n == 0:
        return (max(0.0, final_prob), min(1.0, final_prob))

    mean = sum(survival_list) / n
    variance = sum((x - mean) ** 2 for x in survival_list) / n
    margin = sqrt(variance)

    lower = max(0.0, final_prob - margin)
    upper = min(1.0, final_prob + margin)

    return lower, upper


# ═══════════════════════════════════════════════════════════
# Main Entry Point
# ═══════════════════════════════════════════════════════════

def simulate_hiring_pipeline(risk_data: dict) -> dict:
    """Simulate hiring pipeline survival probability.

    This is the main face of the Hiring Probability Simulation System.
    Uses purely deterministic math — no LLMs.

    Args:
        risk_data: Dictionary with keys:
            ATS_risk, Recruiter_risk, Market_risk,
            Grammar_risk, Formatting_risk, domain

    Returns:
        Structured dictionary with survival probabilities,
        bottleneck analysis, diagnoses, recommendations,
        behavioral guidance, confidence interval, and chart.

    Raises:
        HiringPipelineError: On validation failures.
    """
    try:
        # Step 0 — Validate and clamp
        clean = _validate_and_clamp(risk_data)

        # Step 1 — Risk → Survival
        ats_raw, recruiter_raw, market_raw = _compute_raw_survivals(
            clean["ATS_risk"],
            clean["Recruiter_risk"],
            clean["Market_risk"],
        )

        # Step 2 — Sequential compounding
        ats_stage, recruiter_stage, market_stage, final_prob = _sequential_compounding(
            ats_raw, recruiter_raw, market_raw,
        )

        # Step 3 — Chart
        chart_base64 = _generate_chart(ats_stage, recruiter_stage, market_stage, final_prob)

        # Step 4 — Bottleneck detection
        primary_bottleneck, secondary_bottleneck = _detect_bottlenecks(
            ats_raw, recruiter_raw, market_raw,
        )

        # Step 5 — Diagnosis
        diagnosis = _diagnose_stage(primary_bottleneck, {
            "ATS": ats_raw,
            "Recruiter": recruiter_raw,
            "Market": market_raw,
        }[primary_bottleneck])

        # Step 6 — Improvement recommendations
        improvements = _recommend_improvements(ats_raw, recruiter_raw, market_raw)

        # Step 7 — Behavioral guidance
        guidance = _behavioral_guidance(final_prob)

        # Step 8 — Confidence interval
        survival_list = [ats_raw, recruiter_raw, market_raw]
        ci_lower, ci_upper = _confidence_interval(survival_list, final_prob)

        # Step 9 — Assemble final output
        result = {
            "domain_detected": clean["domain"],
            "pipeline_survival": {
                "ATS_survival_raw": round(ats_raw, 4),
                "Recruiter_survival_raw": round(recruiter_raw, 4),
                "Market_survival_raw": round(market_raw, 4),
                "ATS_stage_compounded": round(ats_stage, 4),
                "Recruiter_stage_compounded": round(recruiter_stage, 4),
                "Market_stage_compounded": round(market_stage, 4),
                "Final_Interview_Probability": round(final_prob, 4),
            },
            "pipeline_survival_percent": {
                "ATS_survival_raw": round(ats_raw * 100, 2),
                "Recruiter_survival_raw": round(recruiter_raw * 100, 2),
                "Market_survival_raw": round(market_raw * 100, 2),
                "ATS_stage_compounded": round(ats_stage * 100, 2),
                "Recruiter_stage_compounded": round(recruiter_stage * 100, 2),
                "Market_stage_compounded": round(market_stage * 100, 2),
                "Final_Interview_Probability": round(final_prob * 100, 2),
            },
            "primary_bottleneck_stage": primary_bottleneck,
            "secondary_bottleneck_stage": secondary_bottleneck,
            "why_this_stage_is_weak": diagnosis,
            "improvement_actions": improvements,
            "behavior_guidance_message": guidance,
            "confidence_interval": {
                "lower": round(ci_lower, 4),
                "upper": round(ci_upper, 4),
            },
            "confidence_interval_percent": {
                "lower": round(ci_lower * 100, 2),
                "upper": round(ci_upper * 100, 2),
            },
            "chart_base64": chart_base64,
        }

        logger.info(
            "hiring_pipeline_simulation_complete",
            domain=clean["domain"],
            final_interview_probability=round(final_prob, 4),
            primary_bottleneck=primary_bottleneck,
        )

        return result

    except HiringPipelineError:
        raise
    except Exception as e:
        import traceback
        with open("crash_log.txt", "a") as f:
            f.write(f"\n--- CRASH {datetime.datetime.now()} ---\n")
            f.write(traceback.format_exc())
            f.write("\n")
        logger.error("hiring_pipeline_simulation_failed", error=str(e))
        raise HiringPipelineError(
            message=f"Hiring pipeline simulation failed: {str(e)}",
            details={"error_type": type(e).__name__},
        )
