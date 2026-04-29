"""
reBorn_i — Scoring Weights Configuration

All scoring weights used across the system are centralized here.
These must remain deterministic — no randomness.

Universal Rejection Risk Engine — Domain-Aware (Tech / Non-Tech)
================================================================
Two scoring models with different layer weights and sub-score weights.

TECH_MODEL Final_Risk:
    (0.30 * ATS) + (0.30 * Recruiter) + (0.20 * Market) + (0.10 * Grammar) + (0.10 * Formatting)

NON_TECH_MODEL Final_Risk:
    (0.25 * ATS) + (0.35 * Recruiter) + (0.20 * Market) + (0.10 * Grammar) + (0.10 * Formatting)

Universal layers (domain-independent):
    Grammar — spelling_score (0.5), grammar_score (0.3), readability_score (0.2)
    Formatting — structure_score (0.35), bullet_score (0.25), density_score (0.20), parse_stability_score (0.20)

Risk classification (unchanged):
    0–30%  → Low
    30–50% → Moderate
    50–70% → High
    70–100%→ Critical
"""

from dataclasses import dataclass, field
from typing import Dict


# ═══════════════════════════════════════════════════════════
# Legacy / Backward-Compat (kept for callers that haven't migrated)
# ═══════════════════════════════════════════════════════════

@dataclass(frozen=True)
class RejectionScoringWeights:
    """Legacy 5-layer weights. Kept for backward compatibility.

    New code should use TechRejectionWeights / NonTechRejectionWeights.
    """

    ats_screening: float = 0.30
    recruiter_evaluation: float = 0.25
    market_competitiveness: float = 0.20
    spelling_grammar: float = 0.15
    formatting_structure: float = 0.10

    def __post_init__(self) -> None:
        total = (
            self.ats_screening
            + self.recruiter_evaluation
            + self.market_competitiveness
            + self.spelling_grammar
            + self.formatting_structure
        )
        if abs(total - 1.0) > 1e-6:
            raise ValueError(f"Scoring weights must sum to 1.0, got {total}")

    def as_dict(self) -> Dict[str, float]:
        return {
            "ats_screening": self.ats_screening,
            "recruiter_evaluation": self.recruiter_evaluation,
            "market_competitiveness": self.market_competitiveness,
            "spelling_grammar": self.spelling_grammar,
            "formatting_structure": self.formatting_structure,
        }


# ═══════════════════════════════════════════════════════════
# Domain-Aware Layer Weights
# ═══════════════════════════════════════════════════════════

@dataclass(frozen=True)
class TechRejectionWeights:
    """Final-layer weights for the TECH_MODEL.

    Final_Risk = (0.30 * ATS) + (0.30 * Recruiter) + (0.20 * Market)
               + (0.10 * Grammar) + (0.10 * Formatting)
    """

    ats_screening: float = 0.30
    recruiter_evaluation: float = 0.30
    market_competitiveness: float = 0.20
    spelling_grammar: float = 0.10
    formatting_structure: float = 0.10

    def __post_init__(self) -> None:
        total = (
            self.ats_screening
            + self.recruiter_evaluation
            + self.market_competitiveness
            + self.spelling_grammar
            + self.formatting_structure
        )
        if abs(total - 1.0) > 1e-6:
            raise ValueError(f"Tech weights must sum to 1.0, got {total}")

    def as_dict(self) -> Dict[str, float]:
        return {
            "ats_screening": self.ats_screening,
            "recruiter_evaluation": self.recruiter_evaluation,
            "market_competitiveness": self.market_competitiveness,
            "spelling_grammar": self.spelling_grammar,
            "formatting_structure": self.formatting_structure,
        }


@dataclass(frozen=True)
class NonTechRejectionWeights:
    """Final-layer weights for the NON_TECH_MODEL.

    Final_Risk = (0.25 * ATS) + (0.35 * Recruiter) + (0.20 * Market)
               + (0.10 * Grammar) + (0.10 * Formatting)
    """

    ats_screening: float = 0.25
    recruiter_evaluation: float = 0.35
    market_competitiveness: float = 0.20
    spelling_grammar: float = 0.10
    formatting_structure: float = 0.10

    def __post_init__(self) -> None:
        total = (
            self.ats_screening
            + self.recruiter_evaluation
            + self.market_competitiveness
            + self.spelling_grammar
            + self.formatting_structure
        )
        if abs(total - 1.0) > 1e-6:
            raise ValueError(f"Non-tech weights must sum to 1.0, got {total}")

    def as_dict(self) -> Dict[str, float]:
        return {
            "ats_screening": self.ats_screening,
            "recruiter_evaluation": self.recruiter_evaluation,
            "market_competitiveness": self.market_competitiveness,
            "spelling_grammar": self.spelling_grammar,
            "formatting_structure": self.formatting_structure,
        }


# ═══════════════════════════════════════════════════════════
# Tech ATS Sub-Weights
# ═══════════════════════════════════════════════════════════

@dataclass(frozen=True)
class TechATSWeights:
    """Sub-score weights for Tech ATS layer.

    ATS_Risk = 1 - (0.45*technical_skill + 0.25*framework_match + 0.15*keyword + 0.15*exp)
    """

    technical_skill: float = 0.45
    framework_match: float = 0.25
    keyword: float = 0.15
    exp: float = 0.15

    def __post_init__(self) -> None:
        total = self.technical_skill + self.framework_match + self.keyword + self.exp
        if abs(total - 1.0) > 1e-6:
            raise ValueError(f"TechATSWeights must sum to 1.0, got {total}")


# ═══════════════════════════════════════════════════════════
# Tech Recruiter Sub-Weights
# ═══════════════════════════════════════════════════════════

@dataclass(frozen=True)
class TechRecruiterWeights:
    """Sub-score weights for Tech Recruiter layer.

    Recruiter_Risk = 1 - (0.4*embedding_sim + 0.3*impact + 0.2*maturity + 0.1*architecture_signal)
    """

    embedding_similarity: float = 0.40
    impact: float = 0.30
    maturity: float = 0.20
    architecture_signal: float = 0.10

    def __post_init__(self) -> None:
        total = self.embedding_similarity + self.impact + self.maturity + self.architecture_signal
        if abs(total - 1.0) > 1e-6:
            raise ValueError(f"TechRecruiterWeights must sum to 1.0, got {total}")


# ═══════════════════════════════════════════════════════════
# Tech Market Sub-Weights
# ═══════════════════════════════════════════════════════════

@dataclass(frozen=True)
class TechMarketWeights:
    """Sub-score weights for Tech Market layer.

    Market_Risk = 1 - (0.5*demand_alignment + 0.3*competition_alignment + 0.2*stability)
    """

    demand_alignment: float = 0.50
    competition_alignment: float = 0.30
    stability: float = 0.20

    def __post_init__(self) -> None:
        total = self.demand_alignment + self.competition_alignment + self.stability
        if abs(total - 1.0) > 1e-6:
            raise ValueError(f"TechMarketWeights must sum to 1.0, got {total}")


# ═══════════════════════════════════════════════════════════
# Non-Tech ATS Sub-Weights
# ═══════════════════════════════════════════════════════════

@dataclass(frozen=True)
class NonTechATSWeights:
    """Sub-score weights for Non-Tech ATS layer.

    ATS_Risk = 1 - (0.35*keyword + 0.25*tool_match + 0.20*achievement_density + 0.20*exp)
    """

    keyword: float = 0.35
    tool_match: float = 0.25
    achievement_density: float = 0.20
    exp: float = 0.20

    def __post_init__(self) -> None:
        total = self.keyword + self.tool_match + self.achievement_density + self.exp
        if abs(total - 1.0) > 1e-6:
            raise ValueError(f"NonTechATSWeights must sum to 1.0, got {total}")


# ═══════════════════════════════════════════════════════════
# Non-Tech Recruiter Sub-Weights
# ═══════════════════════════════════════════════════════════

@dataclass(frozen=True)
class NonTechRecruiterWeights:
    """Sub-score weights for Non-Tech Recruiter layer.

    Recruiter_Risk = 1 - (0.35*embedding_sim + 0.25*leadership + 0.25*outcome + 0.15*clarity)
    """

    embedding_similarity: float = 0.35
    leadership: float = 0.25
    outcome: float = 0.25
    clarity: float = 0.15

    def __post_init__(self) -> None:
        total = self.embedding_similarity + self.leadership + self.outcome + self.clarity
        if abs(total - 1.0) > 1e-6:
            raise ValueError(f"NonTechRecruiterWeights must sum to 1.0, got {total}")


# ═══════════════════════════════════════════════════════════
# Non-Tech Market Sub-Weights
# ═══════════════════════════════════════════════════════════

@dataclass(frozen=True)
class NonTechMarketWeights:
    """Sub-score weights for Non-Tech Market layer.

    Market_Risk = 1 - (0.4*demand_alignment + 0.3*certification_alignment + 0.3*competition)
    """

    demand_alignment: float = 0.40
    certification_alignment: float = 0.30
    competition: float = 0.30

    def __post_init__(self) -> None:
        total = self.demand_alignment + self.certification_alignment + self.competition
        if abs(total - 1.0) > 1e-6:
            raise ValueError(f"NonTechMarketWeights must sum to 1.0, got {total}")


# ═══════════════════════════════════════════════════════════
# Universal Grammar Sub-Weights
# ═══════════════════════════════════════════════════════════

@dataclass(frozen=True)
class GrammarWeights:
    """Sub-score weights for universal Grammar layer.

    Grammar_Risk = (0.5*spelling + 0.3*grammar + 0.2*readability)
    """

    spelling: float = 0.50
    grammar: float = 0.30
    readability: float = 0.20

    def __post_init__(self) -> None:
        total = self.spelling + self.grammar + self.readability
        if abs(total - 1.0) > 1e-6:
            raise ValueError(f"GrammarWeights must sum to 1.0, got {total}")


# ═══════════════════════════════════════════════════════════
# Universal Formatting Sub-Weights
# ═══════════════════════════════════════════════════════════

@dataclass(frozen=True)
class FormattingWeights:
    """Sub-score weights for universal Formatting layer.

    Formatting_Risk = 1 - (0.35*structure + 0.25*bullet + 0.20*density + 0.20*parse_stability)
    """

    structure: float = 0.35
    bullet: float = 0.25
    density: float = 0.20
    parse_stability: float = 0.20

    def __post_init__(self) -> None:
        total = self.structure + self.bullet + self.density + self.parse_stability
        if abs(total - 1.0) > 1e-6:
            raise ValueError(f"FormattingWeights must sum to 1.0, got {total}")


# ═══════════════════════════════════════════════════════════
# Market / Experience Config (unchanged)
# ═══════════════════════════════════════════════════════════

@dataclass(frozen=True)
class MarketScoringWeights:
    """Weights for market demand and future-proof scoring."""

    current_demand: float = 0.40
    growth_trend: float = 0.35
    cross_industry: float = 0.25

    def __post_init__(self) -> None:
        total = self.current_demand + self.growth_trend + self.cross_industry
        if abs(total - 1.0) > 1e-6:
            raise ValueError(f"Market scoring weights must sum to 1.0, got {total}")


@dataclass(frozen=True)
class ExperienceAlignmentConfig:
    """Configuration for experience-level alignment scoring."""

    level_map: Dict[str, int] = field(
        default_factory=lambda: {
            "intern": 0,
            "junior": 1,
            "mid": 2,
            "senior": 3,
            "lead": 4,
            "principal": 5,
            "director": 6,
            "vp": 7,
            "c-level": 8,
        }
    )
    max_penalty_per_level: float = 0.15
    max_total_penalty: float = 0.50


# ═══════════════════════════════════════════════════════════
# Module-level singletons
# ═══════════════════════════════════════════════════════════

# Legacy (backward compat)
DEFAULT_REJECTION_WEIGHTS = RejectionScoringWeights()

# Domain-aware singletons
DEFAULT_TECH_WEIGHTS = TechRejectionWeights()
DEFAULT_NONTECH_WEIGHTS = NonTechRejectionWeights()
DEFAULT_TECH_ATS_WEIGHTS = TechATSWeights()
DEFAULT_TECH_RECRUITER_WEIGHTS = TechRecruiterWeights()
DEFAULT_TECH_MARKET_WEIGHTS = TechMarketWeights()
DEFAULT_NONTECH_ATS_WEIGHTS = NonTechATSWeights()
DEFAULT_NONTECH_RECRUITER_WEIGHTS = NonTechRecruiterWeights()
DEFAULT_NONTECH_MARKET_WEIGHTS = NonTechMarketWeights()
DEFAULT_GRAMMAR_WEIGHTS = GrammarWeights()
DEFAULT_FORMATTING_WEIGHTS = FormattingWeights()

DEFAULT_MARKET_WEIGHTS = MarketScoringWeights()
DEFAULT_EXPERIENCE_CONFIG = ExperienceAlignmentConfig()
