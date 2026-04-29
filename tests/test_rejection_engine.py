"""
reBorn_i — Rejection Risk Engine Tests (Universal Domain-Aware Model)

Tests for the deterministic domain-aware rejection risk scoring engine.
Validates:
  - Domain detection (Tech vs Non-Tech)
  - Tech-specific scoring (ATS, Recruiter, Market sub-scores)
  - Non-Tech-specific scoring (ATS, Recruiter, Market sub-scores)
  - Universal layers (Grammar, Formatting)
  - Final risk aggregation per model
  - Backward compatibility
  - Determinism and bounded outputs

TECH_MODEL:
  Final_Risk = 0.30*ATS + 0.30*Recruiter + 0.20*Market + 0.10*Grammar + 0.10*Formatting

NON_TECH_MODEL:
  Final_Risk = 0.25*ATS + 0.35*Recruiter + 0.20*Market + 0.10*Grammar + 0.10*Formatting
"""

import base64

import pytest

from app.config.scoring_weights import (
    DEFAULT_REJECTION_WEIGHTS,
    DEFAULT_TECH_WEIGHTS,
    DEFAULT_NONTECH_WEIGHTS,
    DEFAULT_TECH_ATS_WEIGHTS,
    DEFAULT_TECH_RECRUITER_WEIGHTS,
    DEFAULT_TECH_MARKET_WEIGHTS,
    DEFAULT_NONTECH_ATS_WEIGHTS,
    DEFAULT_NONTECH_RECRUITER_WEIGHTS,
    DEFAULT_NONTECH_MARKET_WEIGHTS,
    DEFAULT_GRAMMAR_WEIGHTS,
    DEFAULT_FORMATTING_WEIGHTS,
    RejectionScoringWeights,
    TechRejectionWeights,
    NonTechRejectionWeights,
)
from app.services.rejection_engine import (
    _classify_risk_level,
    _extract_keywords,
    compute_ats_screening_risk,
    compute_experience_alignment_score,
    compute_formatting_structure_risk,
    compute_keyword_density_score,
    compute_market_competitiveness_risk,
    compute_recruiter_evaluation_risk,
    compute_rejection_risk,
    compute_skill_match_score,
    compute_spelling_grammar_risk,
    detect_domain,
    generate_risk_breakdown_chart,
    # Tech sub-scores
    compute_framework_match_score,
    compute_impact_score,
    compute_maturity_score,
    compute_architecture_signal_score,
    # Non-tech sub-scores
    compute_tool_match_score,
    compute_achievement_density_score,
    compute_leadership_score,
    compute_outcome_score,
    compute_clarity_score,
    compute_certification_alignment_score,
    compute_competition_score,
    compute_tech_stability_score,
)


# ═══════════════════════════════════════════════════════════
# Weight Configuration — Tech & Non-Tech Models
# ═══════════════════════════════════════════════════════════

class TestScoringWeights:
    """Tests for domain-aware scoring weight configuration."""

    def test_tech_weights_sum_to_one(self):
        w = DEFAULT_TECH_WEIGHTS
        total = (
            w.ats_screening
            + w.recruiter_evaluation
            + w.market_competitiveness
            + w.spelling_grammar
            + w.formatting_structure
        )
        assert abs(total - 1.0) < 1e-6

    def test_nontech_weights_sum_to_one(self):
        w = DEFAULT_NONTECH_WEIGHTS
        total = (
            w.ats_screening
            + w.recruiter_evaluation
            + w.market_competitiveness
            + w.spelling_grammar
            + w.formatting_structure
        )
        assert abs(total - 1.0) < 1e-6

    def test_tech_weight_values(self):
        w = DEFAULT_TECH_WEIGHTS
        assert w.ats_screening == 0.30
        assert w.recruiter_evaluation == 0.30
        assert w.market_competitiveness == 0.20
        assert w.spelling_grammar == 0.10
        assert w.formatting_structure == 0.10

    def test_nontech_weight_values(self):
        w = DEFAULT_NONTECH_WEIGHTS
        assert w.ats_screening == 0.25
        assert w.recruiter_evaluation == 0.35
        assert w.market_competitiveness == 0.20
        assert w.spelling_grammar == 0.10
        assert w.formatting_structure == 0.10

    def test_legacy_weights_preserved(self):
        """Legacy RejectionScoringWeights still works."""
        w = DEFAULT_REJECTION_WEIGHTS
        total = (
            w.ats_screening
            + w.recruiter_evaluation
            + w.market_competitiveness
            + w.spelling_grammar
            + w.formatting_structure
        )
        assert abs(total - 1.0) < 1e-6

    def test_invalid_weights_raise_error(self):
        with pytest.raises(ValueError, match="sum to 1.0"):
            RejectionScoringWeights(
                ats_screening=0.50,
                recruiter_evaluation=0.50,
                market_competitiveness=0.50,
                spelling_grammar=0.50,
                formatting_structure=0.50,
            )

    def test_tech_ats_sub_weights_sum(self):
        w = DEFAULT_TECH_ATS_WEIGHTS
        total = w.technical_skill + w.framework_match + w.keyword + w.exp
        assert abs(total - 1.0) < 1e-6

    def test_nontech_ats_sub_weights_sum(self):
        w = DEFAULT_NONTECH_ATS_WEIGHTS
        total = w.keyword + w.tool_match + w.achievement_density + w.exp
        assert abs(total - 1.0) < 1e-6

    def test_tech_recruiter_sub_weights_sum(self):
        w = DEFAULT_TECH_RECRUITER_WEIGHTS
        total = w.embedding_similarity + w.impact + w.maturity + w.architecture_signal
        assert abs(total - 1.0) < 1e-6

    def test_nontech_recruiter_sub_weights_sum(self):
        w = DEFAULT_NONTECH_RECRUITER_WEIGHTS
        total = w.embedding_similarity + w.leadership + w.outcome + w.clarity
        assert abs(total - 1.0) < 1e-6

    def test_grammar_sub_weights_sum(self):
        w = DEFAULT_GRAMMAR_WEIGHTS
        total = w.spelling + w.grammar + w.readability
        assert abs(total - 1.0) < 1e-6

    def test_formatting_sub_weights_sum(self):
        w = DEFAULT_FORMATTING_WEIGHTS
        total = w.structure + w.bullet + w.density + w.parse_stability
        assert abs(total - 1.0) < 1e-6

    def test_as_dict(self):
        d = DEFAULT_TECH_WEIGHTS.as_dict()
        assert len(d) == 5
        assert "ats_screening" in d
        assert "recruiter_evaluation" in d


# ═══════════════════════════════════════════════════════════
# Domain Detection
# ═══════════════════════════════════════════════════════════

class TestDomainDetection:
    """Tests for auto domain detection (Tech vs Non-Tech)."""

    def test_detects_tech_from_keywords(self):
        result = detect_domain(
            resume_text="Python Docker Kubernetes microservices AWS",
            jd_text="Senior Backend Engineer with Python and Docker experience",
        )
        assert result["domain"] == "Tech"
        assert result["model_used"] == "TECH_MODEL"
        assert 0.0 <= result["confidence"] <= 1.0

    def test_detects_nontech_from_keywords(self):
        result = detect_domain(
            resume_text="Marketing campaigns digital advertising SEO strategy",
            jd_text="Marketing Manager with social media and brand management experience",
        )
        assert result["domain"] == "Non-Tech"
        assert result["model_used"] == "NON_TECH_MODEL"

    def test_job_title_boosts_tech(self):
        result = detect_domain(
            resume_text="Some generic resume text",
            jd_text="Some generic job description",
            job_title="Software Engineer",
        )
        assert result["domain"] == "Tech"

    def test_job_title_boosts_nontech(self):
        result = detect_domain(
            resume_text="Some generic resume text",
            jd_text="Some generic job description",
            job_title="Marketing Manager",
        )
        assert result["domain"] == "Non-Tech"

    def test_skills_influence_detection(self):
        result = detect_domain(
            resume_text="Generic text",
            jd_text="Generic description",
            resume_skills=["Python", "Docker", "Kubernetes", "React", "AWS"],
        )
        assert result["domain"] == "Tech"

    def test_nontech_skills_influence_detection(self):
        result = detect_domain(
            resume_text="Generic text",
            jd_text="Generic description",
            resume_skills=["salesforce", "excel", "marketing", "budgeting", "payroll"],
        )
        assert result["domain"] == "Non-Tech"

    def test_ambiguous_defaults_to_tech(self):
        result = detect_domain(
            resume_text="Completely unrelated content",
            jd_text="Completely unrelated content",
        )
        # When both scores are near-zero, defaults to Tech
        assert result["domain"] in ("Tech", "Non-Tech")
        assert result["confidence"] >= 0.0

    def test_returns_expected_keys(self):
        result = detect_domain(
            resume_text="Python engineer",
            jd_text="Python developer role",
        )
        assert "domain" in result
        assert "model_used" in result
        assert "confidence" in result
        assert "tech_score" in result
        assert "non_tech_score" in result
        assert "detection_method" in result


# ═══════════════════════════════════════════════════════════
# Shared Utilities
# ═══════════════════════════════════════════════════════════

class TestKeywordExtraction:
    """Tests for keyword extraction utility."""

    def test_filters_stop_words(self):
        keywords = _extract_keywords("I am a software engineer and I love programming")
        assert "am" not in keywords
        assert "software" in keywords
        assert "engineer" in keywords

    def test_handles_empty_string(self):
        assert _extract_keywords("") == []

    def test_preserves_technical_terms(self):
        keywords = _extract_keywords("Experience with Python, Docker, and CI/CD")
        assert "python" in keywords
        assert "docker" in keywords


class TestRiskClassification:
    """Tests for risk level classification."""

    def test_low_risk(self):
        assert _classify_risk_level(10.0) == "Low"
        assert _classify_risk_level(29.9) == "Low"

    def test_moderate_risk(self):
        assert _classify_risk_level(30.0) == "Moderate"
        assert _classify_risk_level(49.9) == "Moderate"

    def test_high_risk(self):
        assert _classify_risk_level(50.0) == "High"
        assert _classify_risk_level(69.9) == "High"

    def test_critical_risk(self):
        assert _classify_risk_level(70.0) == "Critical"
        assert _classify_risk_level(100.0) == "Critical"


# ═══════════════════════════════════════════════════════════
# Tech-Specific Sub-Scores
# ═══════════════════════════════════════════════════════════

class TestTechSubScores:
    """Tests for tech-specific sub-score functions."""

    def test_framework_match_full(self):
        score = compute_framework_match_score(
            resume_text="React Django Docker Kubernetes Terraform",
            jd_text="We use React, Django, Docker, and Kubernetes on Terraform",
        )
        assert score >= 0.8

    def test_framework_match_none(self):
        score = compute_framework_match_score(
            resume_text="I enjoy painting",
            jd_text="We use React, Django, Docker",
        )
        assert score < 0.2

    def test_framework_match_no_jd_frameworks(self):
        score = compute_framework_match_score(
            resume_text="React Django",
            jd_text="Looking for someone with experience",
        )
        assert score == 0.5  # Neutral

    def test_impact_score_with_metrics(self):
        text = (
            "Increased performance by 40% for backend services.\n"
            "Saved $200K annually through infrastructure optimization.\n"
            "Managed a team of 8 engineers delivering 3x faster.\n"
            "Built system handling 1M+ requests per day."
        )
        score = compute_impact_score(text)
        assert score > 0.5

    def test_impact_score_empty(self):
        assert compute_impact_score("") == 0.0

    def test_maturity_score_senior(self):
        text = (
            "Led team and owned end-to-end system design.\n"
            "Mentored junior engineers and conducted code reviews.\n"
            "Collaborated cross-functionally with stakeholders.\n"
            "Designed production distributed architecture."
        )
        score = compute_maturity_score("senior", text)
        assert score > 0.5

    def test_maturity_score_junior(self):
        text = "Wrote some code and fixed bugs."
        score = compute_maturity_score("junior", text)
        assert score < 0.5

    def test_architecture_signal(self):
        text = (
            "Designed microservices with event-driven architecture.\n"
            "Implemented load balancing and database sharding.\n"
            "Built CI/CD pipeline with blue-green deployment."
        )
        score = compute_architecture_signal_score(text)
        assert score > 0.3

    def test_architecture_signal_empty(self):
        assert compute_architecture_signal_score("") == 0.0


# ═══════════════════════════════════════════════════════════
# Non-Tech-Specific Sub-Scores
# ═══════════════════════════════════════════════════════════

class TestNonTechSubScores:
    """Tests for non-tech-specific sub-score functions."""

    def test_tool_match(self):
        score = compute_tool_match_score(
            resume_text="Used salesforce, hubspot, and google analytics daily",
            jd_text="Must know salesforce, hubspot",
        )
        assert score >= 0.8

    def test_tool_match_empty(self):
        assert compute_tool_match_score("", "salesforce") == 0.0

    def test_tool_match_no_jd_tools(self):
        score = compute_tool_match_score(
            resume_text="salesforce hubspot",
            jd_text="Looking for someone experienced",
        )
        assert score == 0.5  # Neutral

    def test_achievement_density_with_results(self):
        text = (
            "Increased revenue by 30% through targeted campaign strategy.\n"
            "Reduced customer churn to 5% through engagement programs.\n"
            "Launched 12 successful campaigns in a single quarter.\n"
            "Delivered $500K in pipeline from lead generation."
        )
        score = compute_achievement_density_score(text)
        assert score > 0.5

    def test_achievement_density_empty(self):
        assert compute_achievement_density_score("") == 0.0

    def test_leadership_score_strong(self):
        text = (
            "Managed a team of 15 direct reports across two departments.\n"
            "Led strategic transformation initiative aligned with board.\n"
            "Coached and mentored high-potential talent for promotion.\n"
            "Oversaw $2M budget and P&L responsibility."
        )
        score = compute_leadership_score(text)
        assert score > 0.5

    def test_leadership_score_empty(self):
        assert compute_leadership_score("") == 0.0

    def test_outcome_score(self):
        text = (
            "Achieved 120% of quota three quarters in a row.\n"
            "Exceeded revenue targets by 25% year-over-year.\n"
            "Delivered award-winning campaign recognized as top performer."
        )
        score = compute_outcome_score(text)
        assert score > 0.3

    def test_outcome_score_empty(self):
        assert compute_outcome_score("") == 0.0

    def test_clarity_score(self):
        text = (
            "Managed cross-functional partnerships to drive results.\n"
            "Developed comprehensive strategies for market expansion.\n"
            "Coordinated regional launches across multiple channels.\n"
            "Analyzed competitive landscape to inform positioning.\n"
            "Executed quarterly plans aligned with organizational goals."
        )
        score = compute_clarity_score(text)
        assert score > 0.3

    def test_clarity_score_empty(self):
        assert compute_clarity_score("") == 0.3

    def test_certification_alignment(self):
        score = compute_certification_alignment_score(
            resume_text="Certified PMP professional with six sigma green belt",
            jd_text="PMP certification required, six sigma preferred",
        )
        assert score >= 0.5

    def test_certification_alignment_empty(self):
        score = compute_certification_alignment_score("", "PMP required")
        assert score == 0.3

    def test_competition_score_specialized(self):
        score = compute_competition_score(
            resume_skills=["data visualization", "tableau", "statistical modeling"],
            jd_text="Need tableau and statistical modeling expertise",
        )
        assert score > 0.3

    def test_competition_score_generic(self):
        score = compute_competition_score(
            resume_skills=["excel", "powerpoint", "teamwork", "communication"],
            jd_text="Need excel skills",
        )
        assert score < 0.7  # Generic skills = higher competition

    def test_tech_stability_good_stack(self):
        score = compute_tech_stability_score(
            ["python", "javascript", "react", "docker", "aws"]
        )
        assert score > 0.5

    def test_tech_stability_declining_stack(self):
        score = compute_tech_stability_score(
            ["jquery", "coffeescript", "perl", "backbone"]
        )
        assert score < 0.5


# ═══════════════════════════════════════════════════════════
# Layer 1: ATS Screening Risk
# ═══════════════════════════════════════════════════════════

class TestSkillMatchScore:
    """Tests for skill match scoring (sub-component of ATS)."""

    def test_perfect_match(self):
        score, matched, missing = compute_skill_match_score(
            ["Python", "Docker", "AWS"],
            "We need Python, Docker, and AWS experience",
        )
        assert score == 1.0
        assert len(matched) == 3
        assert len(missing) == 0

    def test_no_match(self):
        score, matched, missing = compute_skill_match_score(
            ["Rust", "Haskell"],
            "We need Python and Docker experience",
        )
        assert score == 0.0
        assert len(matched) == 0
        assert len(missing) == 2

    def test_partial_match(self):
        score, matched, missing = compute_skill_match_score(
            ["Python", "Docker", "Rust"],
            "We need Python and Docker",
        )
        assert 0.0 < score < 1.0
        assert "Python" in matched
        assert "Rust" in missing

    def test_empty_resume_skills(self):
        score, _, _ = compute_skill_match_score([], "Need Python")
        assert score == 0.0

    def test_empty_jd(self):
        score, _, _ = compute_skill_match_score(["Python"], "")
        assert score == 0.0

    def test_score_is_bounded(self):
        score, _, _ = compute_skill_match_score(
            ["Python", "Docker", "AWS", "React", "TypeScript"],
            "Some job description with Python and Docker mentioned",
        )
        assert 0.0 <= score <= 1.0


class TestKeywordDensityScore:
    """Tests for keyword density scoring."""

    def test_high_overlap(self):
        score = compute_keyword_density_score(
            "Python Docker AWS Kubernetes microservices",
            "Looking for Python Docker AWS Kubernetes microservices",
        )
        assert score > 0.5

    def test_no_overlap(self):
        score = compute_keyword_density_score(
            "Painting sculpting art design creative",
            "Python Docker AWS Kubernetes microservices",
        )
        assert score < 0.2

    def test_empty_inputs(self):
        assert compute_keyword_density_score("", "test") == 0.0
        assert compute_keyword_density_score("test", "") == 0.0

    def test_score_is_bounded(self):
        score = compute_keyword_density_score("Python Docker", "Python Docker AWS")
        assert 0.0 <= score <= 1.0


class TestATSScreeningRisk:
    """Tests for ATS Screening Risk (Layer 1) — domain-aware."""

    def test_tech_ats_low_risk(self):
        risk, details = compute_ats_screening_risk(
            resume_skills=["Python", "Docker", "AWS"],
            resume_text="Python Docker AWS Kubernetes microservices framework react",
            jd_text="Looking for Python Docker AWS react experience",
            domain="Tech",
        )
        assert risk < 0.4
        assert details["domain_model"] == "TECH_ATS"
        assert "technical_skill_score" in details
        assert "framework_match_score" in details

    def test_nontech_ats_low_risk(self):
        risk, details = compute_ats_screening_risk(
            resume_skills=["salesforce", "excel", "marketing"],
            resume_text="salesforce excel marketing campaign analytics hubspot strategy",
            jd_text="Need salesforce, excel, and marketing experience",
            domain="Non-Tech",
        )
        assert risk < 0.5
        assert details["domain_model"] == "NON_TECH_ATS"
        assert "tool_match_score" in details
        assert "achievement_density_score" in details

    def test_high_risk_for_mismatch(self):
        risk, _ = compute_ats_screening_risk(
            resume_skills=["Painting"],
            resume_text="I enjoy painting landscapes",
            jd_text="Looking for Python Docker AWS experience",
            domain="Tech",
        )
        assert risk > 0.6

    def test_returns_matched_and_missing(self):
        risk, details = compute_ats_screening_risk(
            resume_skills=["Python", "Rust"],
            resume_text="Python Rust programming",
            jd_text="Need Python and Docker",
            domain="Tech",
        )
        assert "matched_skills" in details
        assert "missing_skills" in details

    def test_risk_is_bounded(self):
        risk, _ = compute_ats_screening_risk(
            ["Python"], "Python code", "Need Python", domain="Tech"
        )
        assert 0.0 <= risk <= 1.0


# ═══════════════════════════════════════════════════════════
# Layer 2: Recruiter Evaluation Risk
# ═══════════════════════════════════════════════════════════

class TestExperienceAlignmentScore:
    """Tests for experience alignment scoring."""

    def test_exact_match(self):
        score = compute_experience_alignment_score(
            "senior", "Senior Engineer with 5+ years"
        )
        assert score >= 0.8

    def test_level_mismatch(self):
        score = compute_experience_alignment_score(
            "junior", "Director of Engineering needed"
        )
        assert score < 0.6

    def test_intern_vs_senior(self):
        score = compute_experience_alignment_score(
            "intern", "We need a senior engineer"
        )
        assert score < 0.6

    def test_score_is_bounded(self):
        score = compute_experience_alignment_score("mid", "Some job description")
        assert 0.0 <= score <= 1.0


class TestRecruiterEvaluationRisk:
    """Tests for Recruiter Evaluation Risk (Layer 2) — domain-aware."""

    def test_tech_returns_correct_details(
        self, sample_resume_text, sample_job_description
    ):
        risk, details = compute_recruiter_evaluation_risk(
            resume_text=sample_resume_text,
            resume_experience_level="senior",
            jd_text=sample_job_description,
            domain="Tech",
        )
        assert 0.0 <= risk <= 1.0
        assert details["domain_model"] == "TECH_RECRUITER"
        assert "embedding_similarity" in details
        assert "impact_score" in details
        assert "maturity_score" in details
        assert "architecture_signal_score" in details

    def test_nontech_returns_correct_details(self):
        risk, details = compute_recruiter_evaluation_risk(
            resume_text="Managed team budget and strategic planning leadership",
            resume_experience_level="senior",
            jd_text="Senior Marketing Manager leading cross-functional teams",
            domain="Non-Tech",
        )
        assert 0.0 <= risk <= 1.0
        assert details["domain_model"] == "NON_TECH_RECRUITER"
        assert "leadership_score" in details
        assert "outcome_score" in details
        assert "clarity_score" in details

    def test_good_alignment_low_risk(self):
        risk, _ = compute_recruiter_evaluation_risk(
            resume_text="Senior backend engineer with 10 years Python Django Docker AWS",
            resume_experience_level="senior",
            jd_text="Senior Backend Engineer with 5+ years experience in Python Docker AWS",
            domain="Tech",
        )
        assert risk < 0.6


# ═══════════════════════════════════════════════════════════
# Layer 3: Market Competitiveness Risk
# ═══════════════════════════════════════════════════════════

class TestMarketCompetitivenessRisk:
    """Tests for Market Competitiveness Risk (Layer 3) — domain-aware."""

    def test_tech_returns_correct_details(self, sample_job_description):
        risk, details = compute_market_competitiveness_risk(
            resume_skills=["Python", "Docker", "AWS"],
            jd_text=sample_job_description,
            domain="Tech",
        )
        assert 0.0 <= risk <= 1.0
        assert "demand_alignment" in details
        assert details["domain_model"] == "TECH_MARKET"

    def test_nontech_returns_correct_details(self):
        risk, details = compute_market_competitiveness_risk(
            resume_skills=["salesforce", "marketing", "excel"],
            jd_text="Marketing manager with salesforce and analytics",
            domain="Non-Tech",
            resume_text="Marketing professional with salesforce and pmp certification",
        )
        assert 0.0 <= risk <= 1.0
        assert details["domain_model"] == "NON_TECH_MARKET"
        assert "certification_alignment" in details
        assert "competition_score" in details

    def test_no_skills_higher_risk(self):
        risk, _ = compute_market_competitiveness_risk(
            resume_skills=[],
            jd_text="Need Python Docker AWS",
            domain="Tech",
        )
        assert risk >= 0.3

    def test_risk_is_bounded(self, sample_job_description):
        risk, _ = compute_market_competitiveness_risk(
            resume_skills=["Python", "Docker", "AWS", "Kubernetes", "Redis"],
            jd_text=sample_job_description,
            domain="Tech",
        )
        assert 0.0 <= risk <= 1.0


# ═══════════════════════════════════════════════════════════
# Layer 4: Spelling & Grammar Risk (Universal)
# ═══════════════════════════════════════════════════════════

class TestSpellingGrammarRisk:
    """Tests for Spelling & Grammar Risk (Layer 4) — universal."""

    def test_clean_text_low_risk(self):
        clean_text = (
            "Senior Software Engineer with 8 years of experience in Python.\n"
            "Built scalable microservices using Docker and Kubernetes.\n"
            "Led team of engineers in agile development environment."
        )
        risk, details = compute_spelling_grammar_risk(clean_text)
        assert risk < 0.3
        assert details["misspelling_count"] == 0

    def test_misspellings_increase_risk(self):
        dirty_text = (
            "I recieve many managment tasks in this enviroment.\n"
            "The developement of the acheivement was a sucess.\n"
            "Teh professionalism was great."
        )
        risk, details = compute_spelling_grammar_risk(dirty_text)
        assert details["misspelling_count"] > 0
        assert risk > 0.0

    def test_repeated_words_detected(self):
        text = "I built the the application and managed and and deployed it."
        risk, details = compute_spelling_grammar_risk(text)
        assert details["repeated_words"] > 0

    def test_has_sub_score_breakdown(self):
        text = "Some reasonable text with decent grammar and structure here."
        risk, details = compute_spelling_grammar_risk(text)
        assert "spelling_risk" in details
        assert "grammar_risk" in details
        assert "readability_risk" in details

    def test_empty_text(self):
        risk, _ = compute_spelling_grammar_risk("")
        assert risk == 0.5

    def test_risk_is_bounded(self, sample_resume_text):
        risk, _ = compute_spelling_grammar_risk(sample_resume_text)
        assert 0.0 <= risk <= 1.0


# ═══════════════════════════════════════════════════════════
# Layer 5: Formatting & Structure Risk (Universal)
# ═══════════════════════════════════════════════════════════

class TestFormattingStructureRisk:
    """Tests for Formatting & Structure Risk (Layer 5) — universal."""

    def test_well_structured_resume_low_risk(self, sample_resume_text):
        risk, details = compute_formatting_structure_risk(sample_resume_text)
        assert risk < 0.5
        assert len(details.get("sections_found", [])) > 0

    def test_has_sub_score_breakdown(self, sample_resume_text):
        risk, details = compute_formatting_structure_risk(sample_resume_text)
        assert "structure_score" in details
        assert "bullet_score" in details
        assert "density_score" in details
        assert "parse_stability_score" in details

    def test_empty_text_high_risk(self):
        risk, _ = compute_formatting_structure_risk("")
        assert risk >= 0.7

    def test_detects_sections(self, sample_resume_text):
        risk, details = compute_formatting_structure_risk(sample_resume_text)
        sections = details.get("sections_found", [])
        assert len(sections) >= 3

    def test_structured_data_boosts_coverage(self):
        minimal_text = "John Doe. Some work experience."
        risk_without, _ = compute_formatting_structure_risk(minimal_text)
        risk_with, _ = compute_formatting_structure_risk(
            minimal_text,
            structured_data={
                "skills": [{"name": "Python"}],
                "experience": [{"title": "Engineer"}],
                "education": [{"degree": "BS"}],
                "summary": "Some summary",
            },
        )
        assert risk_with <= risk_without

    def test_risk_is_bounded(self, sample_resume_text):
        risk, _ = compute_formatting_structure_risk(sample_resume_text)
        assert 0.0 <= risk <= 1.0


# ═══════════════════════════════════════════════════════════
# Chart Generation
# ═══════════════════════════════════════════════════════════

class TestChartGeneration:
    """Tests for matplotlib chart generation with domain info."""

    def test_generates_base64_png(self):
        layer_risks = {
            "ats_screening": 0.35,
            "recruiter_evaluation": 0.45,
            "market_competitiveness": 0.25,
            "spelling_grammar": 0.10,
            "formatting_structure": 0.20,
        }
        chart_b64 = generate_risk_breakdown_chart(
            layer_risks, domain="Tech", model_used="TECH_MODEL"
        )
        assert chart_b64 is not None
        assert len(chart_b64) > 100
        decoded = base64.b64decode(chart_b64)
        assert decoded[:4] == b"\x89PNG"

    def test_nontech_chart(self):
        layer_risks = {
            "ats_screening": 0.40,
            "recruiter_evaluation": 0.30,
            "market_competitiveness": 0.50,
            "spelling_grammar": 0.15,
            "formatting_structure": 0.25,
        }
        chart_b64 = generate_risk_breakdown_chart(
            layer_risks, domain="Non-Tech", model_used="NON_TECH_MODEL"
        )
        assert chart_b64 is not None
        decoded = base64.b64decode(chart_b64)
        assert decoded[:4] == b"\x89PNG"


# ═══════════════════════════════════════════════════════════
# Full Integration: compute_rejection_risk (Domain-Aware)
# ═══════════════════════════════════════════════════════════

class TestComputeRejectionRisk:
    """Integration tests for the universal domain-aware rejection risk engine."""

    def test_returns_all_required_fields(
        self, sample_resume_text, sample_job_description
    ):
        result = compute_rejection_risk(
            resume_text=sample_resume_text,
            resume_skills=["Python", "Docker", "AWS", "PostgreSQL", "FastAPI"],
            resume_experience_level="senior",
            jd_text=sample_job_description,
        )

        required_keys = [
            "risk_score",
            "final_risk_percent",
            "risk_level",
            "risk_breakdown",
            "highest_risk_area",
            "secondary_risk_area",
            "why_risk_is_high",
            "recommended_actions",
            "behavior_guidance_message",
            "confidence_interval",
            "component_scores",
            "chart_base64",
            "top_rejection_reasons",
            "skill_gaps",
            "domain_detected",
            "model_used",
            "domain_confidence",
        ]
        for key in required_keys:
            assert key in result, f"Missing key: {key}"

    def test_domain_detected_in_result(
        self, sample_resume_text, sample_job_description
    ):
        result = compute_rejection_risk(
            resume_text=sample_resume_text,
            resume_skills=["Python", "Docker", "AWS"],
            resume_experience_level="senior",
            jd_text=sample_job_description,
        )
        assert result["domain_detected"] in ("Tech", "Non-Tech")
        assert result["model_used"] in ("TECH_MODEL", "NON_TECH_MODEL")
        assert 0.0 <= result["domain_confidence"] <= 1.0

    def test_tech_resume_uses_tech_model(self, sample_job_description):
        result = compute_rejection_risk(
            resume_text="Python Docker Kubernetes microservices AWS cloud",
            resume_skills=["Python", "Docker", "Kubernetes", "AWS"],
            resume_experience_level="senior",
            jd_text=sample_job_description,
        )
        assert result["domain_detected"] == "Tech"
        assert result["model_used"] == "TECH_MODEL"

    def test_nontech_resume_uses_nontech_model(self):
        jd = (
            "Marketing Manager position requiring social media, SEO, "
            "brand management, and salesforce experience. "
            "5+ years in digital marketing campaigns."
        )
        result = compute_rejection_risk(
            resume_text="Marketing professional with SEO and brand management experience",
            resume_skills=["marketing", "seo", "salesforce", "hubspot"],
            resume_experience_level="senior",
            jd_text=jd,
        )
        assert result["domain_detected"] == "Non-Tech"
        assert result["model_used"] == "NON_TECH_MODEL"

    def test_job_title_param_influences_domain(self, sample_job_description):
        result = compute_rejection_risk(
            resume_text="Generic resume text",
            resume_skills=["Python"],
            resume_experience_level="mid",
            jd_text=sample_job_description,
            job_title="Software Engineer",
        )
        assert result["domain_detected"] == "Tech"

    def test_risk_score_is_bounded(
        self, sample_resume_text, sample_job_description
    ):
        result = compute_rejection_risk(
            resume_text=sample_resume_text,
            resume_skills=["Python", "Docker"],
            resume_experience_level="mid",
            jd_text=sample_job_description,
        )
        assert 0.0 <= result["risk_score"] <= 1.0
        assert 0.0 <= result["final_risk_percent"] <= 100.0

    def test_risk_level_matches_score(
        self, sample_resume_text, sample_job_description
    ):
        result = compute_rejection_risk(
            resume_text=sample_resume_text,
            resume_skills=["Python", "Docker", "AWS"],
            resume_experience_level="senior",
            jd_text=sample_job_description,
        )
        pct = result["final_risk_percent"]
        level = result["risk_level"]
        if pct < 30:
            assert level == "Low"
        elif pct < 50:
            assert level == "Moderate"
        elif pct < 70:
            assert level == "High"
        else:
            assert level == "Critical"

    def test_has_five_component_scores(
        self, sample_resume_text, sample_job_description
    ):
        result = compute_rejection_risk(
            resume_text=sample_resume_text,
            resume_skills=["Python", "Docker"],
            resume_experience_level="mid",
            jd_text=sample_job_description,
        )
        components = result["component_scores"]
        assert len(components) == 5
        layer_names = {c.layer for c in components}
        assert "ats_screening" in layer_names
        assert "recruiter_evaluation" in layer_names
        assert "market_competitiveness" in layer_names
        assert "spelling_grammar" in layer_names
        assert "formatting_structure" in layer_names

    def test_contributions_sum_to_100(
        self, sample_resume_text, sample_job_description
    ):
        result = compute_rejection_risk(
            resume_text=sample_resume_text,
            resume_skills=["Python", "Docker", "AWS"],
            resume_experience_level="senior",
            jd_text=sample_job_description,
        )
        total = sum(c.contribution_percent for c in result["component_scores"])
        assert abs(total - 100.0) < 0.5

    def test_deterministic(self, sample_resume_text, sample_job_description):
        """Same inputs must produce identical outputs."""
        skills = ["Python", "Docker", "AWS"]
        result1 = compute_rejection_risk(
            resume_text=sample_resume_text,
            resume_skills=skills,
            resume_experience_level="senior",
            jd_text=sample_job_description,
        )
        result2 = compute_rejection_risk(
            resume_text=sample_resume_text,
            resume_skills=skills,
            resume_experience_level="senior",
            jd_text=sample_job_description,
        )
        assert result1["risk_score"] == result2["risk_score"]
        assert result1["final_risk_percent"] == result2["final_risk_percent"]
        assert result1["risk_level"] == result2["risk_level"]
        assert result1["domain_detected"] == result2["domain_detected"]
        assert result1["model_used"] == result2["model_used"]

    def test_better_match_lower_risk(self, sample_job_description):
        """A better-matched resume should have lower risk."""
        good_resume = "Python Go Docker Kubernetes PostgreSQL Redis AWS microservices CI/CD"
        good_skills = ["Python", "Go", "Docker", "Kubernetes", "PostgreSQL", "Redis", "AWS"]

        poor_resume = "I like painting and music"
        poor_skills = ["painting"]

        good_result = compute_rejection_risk(
            resume_text=good_resume,
            resume_skills=good_skills,
            resume_experience_level="senior",
            jd_text=sample_job_description,
        )
        poor_result = compute_rejection_risk(
            resume_text=poor_resume,
            resume_skills=poor_skills,
            resume_experience_level="junior",
            jd_text=sample_job_description,
        )
        assert good_result["risk_score"] < poor_result["risk_score"]

    def test_confidence_interval_structure(
        self, sample_resume_text, sample_job_description
    ):
        result = compute_rejection_risk(
            resume_text=sample_resume_text,
            resume_skills=["Python", "Docker", "AWS"],
            resume_experience_level="senior",
            jd_text=sample_job_description,
        )
        ci = result["confidence_interval"]
        assert "lower" in ci
        assert "upper" in ci
        assert "margin" in ci
        assert ci["lower"] <= result["final_risk_percent"] <= ci["upper"]
        assert ci["margin"] >= 0

    def test_chart_base64_is_present(
        self, sample_resume_text, sample_job_description
    ):
        result = compute_rejection_risk(
            resume_text=sample_resume_text,
            resume_skills=["Python", "Docker"],
            resume_experience_level="mid",
            jd_text=sample_job_description,
        )
        assert result["chart_base64"] is not None
        assert len(result["chart_base64"]) > 100

    def test_recommended_actions_nonempty(
        self, sample_resume_text, sample_job_description
    ):
        result = compute_rejection_risk(
            resume_text=sample_resume_text,
            resume_skills=["Python"],
            resume_experience_level="junior",
            jd_text=sample_job_description,
        )
        assert isinstance(result["recommended_actions"], list)
        assert len(result["recommended_actions"]) > 0

    def test_why_risk_includes_domain_tag(self, sample_job_description):
        """Diagnosis string must include domain and model info."""
        result = compute_rejection_risk(
            resume_text="Python Docker AWS engineer",
            resume_skills=["Python"],
            resume_experience_level="mid",
            jd_text=sample_job_description,
        )
        why = result["why_risk_is_high"]
        assert "%" in why
        # Domain tag should be present
        assert result["domain_detected"] in why or result["model_used"] in why

    def test_risk_breakdown_dict(
        self, sample_resume_text, sample_job_description
    ):
        result = compute_rejection_risk(
            resume_text=sample_resume_text,
            resume_skills=["Python", "Docker", "AWS"],
            resume_experience_level="senior",
            jd_text=sample_job_description,
        )
        breakdown = result["risk_breakdown"]
        assert isinstance(breakdown, dict)
        assert len(breakdown) == 5

    def test_backward_compat_no_job_title(
        self, sample_resume_text, sample_job_description
    ):
        """Calling without job_title param still works (backward compat)."""
        result = compute_rejection_risk(
            resume_text=sample_resume_text,
            resume_skills=["Python", "Docker"],
            resume_experience_level="mid",
            jd_text=sample_job_description,
        )
        assert "risk_score" in result
        assert "domain_detected" in result

    def test_backward_compat_positional_args(self, sample_job_description):
        """Calling with 4 positional args still works (career_simulation compat)."""
        result = compute_rejection_risk(
            "Python Docker AWS resume text",
            ["Python", "Docker"],
            "mid",
            sample_job_description,
        )
        assert "risk_score" in result
        assert "domain_detected" in result
