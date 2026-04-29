"""
reBorn_i — Universal Rejection Risk Engine (Domain-Aware)

Deterministic scoring engine that auto-detects domain (Tech vs Non-Tech)
and applies domain-specific scoring models.  LLM is used ONLY for the
explanation layer — never for scoring logic.

Domain Detection:
    Keyword cluster scoring + role title heuristics + skill list analysis.

TECH_MODEL Final_Risk:
    (0.30 * ATS) + (0.30 * Recruiter) + (0.20 * Market)
  + (0.10 * Grammar) + (0.10 * Formatting)

NON_TECH_MODEL Final_Risk:
    (0.25 * ATS) + (0.35 * Recruiter) + (0.20 * Market)
  + (0.10 * Grammar) + (0.10 * Formatting)

Risk classification:
    0–30%  → Low Risk
    30–50% → Moderate Risk
    50–70% → High Risk
    70–100%→ Critical Risk
"""

import base64
import io
import re
from collections import Counter
from typing import Any, Dict, List, Optional, Tuple, Union

from app.config.prompt_templates import REJECTION_EXPLANATION_PROMPT
from app.config.scoring_weights import (
    DEFAULT_EXPERIENCE_CONFIG,
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
    ExperienceAlignmentConfig,
    RejectionScoringWeights,
    TechRejectionWeights,
    NonTechRejectionWeights,
)
from app.schemas.schemas import RiskLayerScore, RejectionAnalysisResponse
from app.utils.embeddings import compute_cosine_similarity, generate_embedding
from app.utils.exceptions import ScoringError
from app.utils.llm_client import call_llm_structured
from app.utils.logging import get_logger

logger = get_logger(__name__)

# ═══════════════════════════════════════════════════════════
# Constants
# ═══════════════════════════════════════════════════════════

STOP_WORDS = frozenset({
    "a", "am", "an", "the", "and", "or", "but", "in", "on", "at", "to", "for",
    "of", "with", "by", "from", "is", "are", "was", "were", "be", "been",
    "being", "have", "has", "had", "do", "does", "did", "will", "would",
    "could", "should", "may", "might", "shall", "can", "need", "must",
    "it", "its", "this", "that", "these", "those", "i", "we", "you",
    "he", "she", "they", "me", "us", "him", "her", "them", "my", "our",
    "your", "his", "their", "what", "which", "who", "whom", "where",
    "when", "why", "how", "all", "each", "every", "both", "few", "more",
    "most", "other", "some", "such", "no", "not", "only", "own", "same",
    "so", "than", "too", "very", "just", "about", "above", "after",
    "again", "also", "as", "if", "into", "new", "out", "over", "up",
    "any", "etc", "per", "via",
})

EXPECTED_SECTIONS = frozenset({
    "summary", "objective", "experience", "work experience",
    "education", "skills", "certifications", "projects",
    "achievements", "awards", "publications", "references",
    "professional experience", "technical skills",
})

RISK_LEVELS = [
    (0.30, "Low"),
    (0.50, "Moderate"),
    (0.70, "High"),
    (1.01, "Critical"),
]

RISK_GUIDANCE = {
    "Low": {
        "message": (
            "Risk is low. Do not worry. Your profile is strong. "
            "However, optimize further to move into top-tier candidate range."
        ),
        "actions": [
            "Fine-tune keywords",
            "Add 1–2 quantified achievements",
            "Align wording with job description",
        ],
    },
    "Moderate": {
        "message": (
            "Risk is moderate. You are competitive but improvements "
            "are needed to avoid rejection."
        ),
        "actions": [
            "Improve missing core skills",
            "Increase keyword density",
            "Strengthen quantified impact",
            "Improve semantic alignment",
        ],
    },
    "High": {
        "message": (
            "Risk is high. Immediate improvements are required before applying."
        ),
        "actions": [
            "Add missing required skills",
            "Align experience more clearly",
            "Rewrite weak sections",
            "Reduce mismatch between JD and resume",
        ],
    },
    "Critical": {
        "message": (
            "Risk is critical. Applying in current state may lead to rejection."
        ),
        "actions": [
            "Acquire required skills",
            "Restructure resume",
            "Add measurable achievements",
            "Re-align career direction",
            "Consider role pivot",
        ],
    },
}

# ═══════════════════════════════════════════════════════════
# Domain Detection — Keyword Clusters
# ═══════════════════════════════════════════════════════════

TECH_KEYWORD_CLUSTER = frozenset({
    # Languages & core
    "python", "java", "javascript", "typescript", "golang", "go", "rust",
    "c++", "c#", "ruby", "swift", "kotlin", "scala", "perl", "php",
    "html", "css", "sql", "nosql", "bash", "shell", "powershell",
    # Frameworks & libraries
    "react", "angular", "vue", "django", "flask", "fastapi", "spring",
    "express", "nextjs", "nuxt", "svelte", "rails", "laravel",
    "tensorflow", "pytorch", "keras", "scikit-learn", "pandas", "numpy",
    # Infrastructure & DevOps
    "docker", "kubernetes", "k8s", "terraform", "ansible", "jenkins",
    "circleci", "github actions", "gitlab ci", "aws", "azure", "gcp",
    "heroku", "vercel", "netlify", "cloudflare",
    # Data & AI/ML
    "machine learning", "deep learning", "neural network", "nlp",
    "computer vision", "reinforcement learning", "data science",
    "data engineering", "etl", "spark", "hadoop", "airflow", "kafka",
    "elasticsearch", "redis", "mongodb", "postgresql", "mysql",
    "cassandra", "dynamodb", "bigquery", "snowflake",
    # Security & Networking
    "cybersecurity", "penetration testing", "siem", "firewall",
    "encryption", "oauth", "jwt", "ssl", "tls",
    # Concepts
    "api", "rest", "graphql", "grpc", "microservices", "ci/cd",
    "devops", "agile", "scrum", "git", "linux", "unix",
    "algorithm", "data structure", "system design", "architecture",
    "frontend", "backend", "full-stack", "fullstack", "cloud",
    "serverless", "containerization", "orchestration",
    "software engineer", "software developer", "sre",
    "site reliability", "platform engineer",
})

NON_TECH_KEYWORD_CLUSTER = frozenset({
    # Marketing
    "marketing", "seo", "sem", "ppc", "social media", "content strategy",
    "brand management", "campaign", "digital marketing", "advertising",
    "copywriting", "market research", "crm", "hubspot", "mailchimp",
    "google analytics", "analytics",
    # Finance & Accounting
    "finance", "accounting", "budgeting", "forecasting", "audit",
    "financial modeling", "revenue", "profit", "loss", "gaap", "ifrs",
    "quickbooks", "excel", "financial analysis", "investment",
    "portfolio", "risk management", "compliance",
    # HR & People
    "human resources", "recruitment", "talent acquisition",
    "onboarding", "employee engagement", "performance management",
    "compensation", "benefits", "payroll", "hris", "workday",
    # Sales
    "sales", "business development", "account management",
    "lead generation", "pipeline", "quota", "negotiation",
    "salesforce", "cold calling", "closing",
    # Product Management
    "product management", "roadmap", "stakeholder", "user research",
    "product strategy", "go-to-market", "product lifecycle",
    # Operations
    "operations", "supply chain", "logistics", "procurement",
    "inventory", "lean", "six sigma", "process improvement",
    "vendor management", "quality assurance",
    # Business / General
    "business analysis", "business intelligence", "strategy",
    "project management", "pmp", "prince2", "change management",
    "stakeholder management", "presentation",
    # Creative
    "graphic design", "ui/ux", "ux design", "figma", "sketch",
    "adobe", "photoshop", "illustrator", "indesign",
    "content creation", "video production", "photography",
    # Leadership (non-tech phrasing)
    "leadership", "team management", "cross-functional",
    "executive", "c-suite", "board", "governance",
})

TECH_ROLE_TITLES = frozenset({
    "software engineer", "software developer", "backend engineer",
    "frontend engineer", "full-stack engineer", "fullstack developer",
    "data scientist", "data engineer", "machine learning engineer",
    "ml engineer", "ai engineer", "devops engineer", "sre",
    "site reliability engineer", "platform engineer", "cloud engineer",
    "security engineer", "cybersecurity analyst", "infra engineer",
    "infrastructure engineer", "systems engineer", "qa engineer",
    "test engineer", "embedded engineer", "mobile developer",
    "ios developer", "android developer", "blockchain developer",
    "solutions architect", "technical architect", "cto",
    "vp of engineering", "engineering manager", "tech lead",
})

NON_TECH_ROLE_TITLES = frozenset({
    "marketing manager", "brand manager", "content manager",
    "digital marketing specialist", "seo specialist",
    "financial analyst", "accountant", "controller", "cfo",
    "hr manager", "talent acquisition specialist", "recruiter",
    "sales manager", "account executive", "business development",
    "product manager", "product owner", "program manager",
    "project manager", "operations manager", "supply chain manager",
    "graphic designer", "ux designer", "creative director",
    "copywriter", "content strategist", "social media manager",
    "executive assistant", "office manager", "coo",
    "management consultant", "business analyst",
})

# Tech frameworks for matching
TECH_FRAMEWORKS = frozenset({
    "react", "angular", "vue", "django", "flask", "fastapi", "spring",
    "express", "nextjs", "nuxt", "svelte", "rails", "laravel",
    "tensorflow", "pytorch", "keras", "scikit-learn",
    "docker", "kubernetes", "terraform", "ansible",
    "spark", "hadoop", "airflow", "kafka",
    "graphql", "grpc", "redis", "elasticsearch",
    ".net", "blazor", "unity", "unreal",
})

# Non-tech tools for matching
NON_TECH_TOOLS = frozenset({
    "salesforce", "hubspot", "mailchimp", "hootsuite", "buffer",
    "google analytics", "tableau", "power bi", "excel", "quickbooks",
    "workday", "bamboohr", "sap", "oracle", "jira", "asana",
    "trello", "monday", "slack", "zoom", "teams", "figma",
    "sketch", "adobe", "photoshop", "illustrator", "indesign",
    "canva", "premiere", "after effects", "wordpress", "shopify",
    "marketo", "pardot", "zendesk", "intercom", "notion",
})

# Certifications (non-tech)
NON_TECH_CERTIFICATIONS = frozenset({
    "pmp", "prince2", "cpa", "cfa", "cma", "shrm", "phr", "sphr",
    "six sigma", "lean", "itil", "scrum master", "csm",
    "google ads", "google analytics", "hubspot", "facebook blueprint",
    "aws cloud practitioner",
})

# ═══════════════════════════════════════════════════════════
# Common Misspellings (deterministic regex)
# ═══════════════════════════════════════════════════════════

_COMMON_MISSPELLINGS = [
    (r"\bteh\b", "the"),
    (r"\brecieve\b", "receive"),
    (r"\boccured\b", "occurred"),
    (r"\bseperately?\b", "separately"),
    (r"\bmanagment\b", "management"),
    (r"\bdevelopement\b", "development"),
    (r"\benviroment\b", "environment"),
    (r"\bacheivement\b", "achievement"),
    (r"\bexperiance\b", "experience"),
    (r"\bprofesional\b", "professional"),
    (r"\brespons[ai]bl[ie]ty\b", "responsibility"),
    (r"\bcommuncation\b", "communication"),
    (r"\bimpliment\b", "implement"),
    (r"\banalisis\b", "analysis"),
    (r"\bsucessful\b", "successful"),
    (r"\bdefin[ai]tly\b", "definitely"),
    (r"\baccomo?date\b", "accommodate"),
    (r"\boccasion[al]y\b", "occasionally"),
    (r"\brecomend\b", "recommend"),
    (r"\bmaintainance\b", "maintenance"),
    (r"\bperformence\b", "performance"),
    (r"\bknowledg\b", "knowledge"),
    (r"\btechnolgy\b", "technology"),
    (r"\binfrastucture\b", "infrastructure"),
    (r"\barchitechture\b", "architecture"),
]


# ═══════════════════════════════════════════════════════════
# Helper Functions
# ═══════════════════════════════════════════════════════════

def _extract_keywords(text: str) -> List[str]:
    """Extract meaningful keywords from text, excluding stop words."""
    words = re.findall(r"\b[a-zA-Z][a-zA-Z+#.-]{1,}\b", text.lower())
    return [w for w in words if w not in STOP_WORDS and len(w) > 1]


def _classify_risk_level(risk_percent: float) -> str:
    """Classify risk percentage into a level string."""
    for threshold, label in RISK_LEVELS:
        if risk_percent < threshold * 100:
            return label
    return "Critical"


# ═══════════════════════════════════════════════════════════
# Domain Detection
# ═══════════════════════════════════════════════════════════

def detect_domain(
    resume_text: str,
    jd_text: str,
    resume_skills: Optional[List[str]] = None,
    job_title: Optional[str] = None,
) -> Dict[str, Any]:
    """Auto-detect whether the job/resume pair is Tech or Non-Tech.

    Uses three heuristics:
    1. Keyword cluster scoring — count overlap with TECH/NON_TECH clusters
    2. Role title matching — check job_title against known role lists
    3. Skill list analysis — fraction of skills in tech vs non-tech sets

    Returns:
        {
            "domain": "Tech" | "Non-Tech",
            "model_used": "TECH_MODEL" | "NON_TECH_MODEL",
            "confidence": float (0-1),
            "tech_score": float,
            "non_tech_score": float,
            "detection_method": str,
        }
    """
    combined_text = f"{resume_text} {jd_text}".lower()

    # ── 1. Keyword cluster scoring ───────────────────────
    tech_hits = sum(1 for kw in TECH_KEYWORD_CLUSTER if kw in combined_text)
    non_tech_hits = sum(1 for kw in NON_TECH_KEYWORD_CLUSTER if kw in combined_text)

    max_possible = max(tech_hits + non_tech_hits, 1)
    tech_keyword_score = tech_hits / max_possible
    non_tech_keyword_score = non_tech_hits / max_possible

    # ── 2. Role title heuristic ──────────────────────────
    title_tech_score = 0.0
    title_nontech_score = 0.0
    if job_title:
        title_lower = job_title.lower().strip()
        for t in TECH_ROLE_TITLES:
            if t in title_lower or title_lower in t:
                title_tech_score = 1.0
                break
        for t in NON_TECH_ROLE_TITLES:
            if t in title_lower or title_lower in t:
                title_nontech_score = 1.0
                break

    # ── 3. Skill list analysis ───────────────────────────
    skill_tech_frac = 0.0
    skill_nontech_frac = 0.0
    if resume_skills:
        skills_lower = {s.lower() for s in resume_skills}
        tech_skill_count = sum(
            1 for s in skills_lower
            if s in TECH_KEYWORD_CLUSTER or any(
                tk in s or s in tk for tk in TECH_KEYWORD_CLUSTER
            )
        )
        nontech_skill_count = sum(
            1 for s in skills_lower
            if s in NON_TECH_KEYWORD_CLUSTER or any(
                ntk in s or s in ntk for ntk in NON_TECH_KEYWORD_CLUSTER
            )
        )
        total_classified = max(tech_skill_count + nontech_skill_count, 1)
        skill_tech_frac = tech_skill_count / total_classified
        skill_nontech_frac = nontech_skill_count / total_classified

    # ── Composite scoring ────────────────────────────────
    # Keyword cluster: 50%, title heuristic: 30%, skill analysis: 20%
    tech_total = (
        0.50 * tech_keyword_score
        + 0.30 * title_tech_score
        + 0.20 * skill_tech_frac
    )
    non_tech_total = (
        0.50 * non_tech_keyword_score
        + 0.30 * title_nontech_score
        + 0.20 * skill_nontech_frac
    )

    # Determine domain
    if tech_total >= non_tech_total:
        domain = "Tech"
        model_used = "TECH_MODEL"
        confidence = min(1.0, tech_total / max(tech_total + non_tech_total, 0.01))
    else:
        domain = "Non-Tech"
        model_used = "NON_TECH_MODEL"
        confidence = min(1.0, non_tech_total / max(tech_total + non_tech_total, 0.01))

    # If both are near zero (nothing detected), default to Tech
    if tech_total < 0.05 and non_tech_total < 0.05:
        domain = "Tech"
        model_used = "TECH_MODEL"
        confidence = 0.5

    detection_method = "keyword_cluster+title+skills"

    logger.info(
        "domain_detected",
        domain=domain,
        model_used=model_used,
        confidence=round(confidence, 4),
        tech_score=round(tech_total, 4),
        non_tech_score=round(non_tech_total, 4),
    )

    return {
        "domain": domain,
        "model_used": model_used,
        "confidence": round(confidence, 4),
        "tech_score": round(tech_total, 4),
        "non_tech_score": round(non_tech_total, 4),
        "detection_method": detection_method,
    }


# ═══════════════════════════════════════════════════════════
# Shared Sub-Score Helpers
# ═══════════════════════════════════════════════════════════

def compute_skill_match_score(
    resume_skills: List[str],
    jd_text: str,
) -> Tuple[float, List[str], List[str]]:
    """Compute skill match score between resume skills and job description.

    Returns:
        Tuple of (match_score, matched_skills, missing_skills).
    """
    if not resume_skills or not jd_text:
        return 0.0, [], list(resume_skills) if resume_skills else []

    jd_lower = jd_text.lower()
    jd_keywords = set(_extract_keywords(jd_text))

    matched: List[str] = []
    missing: List[str] = []

    for skill in resume_skills:
        skill_lower = skill.lower()
        if skill_lower in jd_lower or any(
            skill_lower in kw or kw in skill_lower
            for kw in jd_keywords
        ):
            matched.append(skill)
        else:
            missing.append(skill)

    total_relevant = max(len(matched) + len(missing), 1)
    score = len(matched) / total_relevant
    return score, matched, missing


def compute_keyword_density_score(resume_text: str, jd_text: str) -> float:
    """Compute keyword density: how well the resume covers JD keywords."""
    if not resume_text or not jd_text:
        return 0.0

    jd_keywords = _extract_keywords(jd_text)
    resume_keywords = set(_extract_keywords(resume_text))

    if not jd_keywords:
        return 0.0

    jd_counter = Counter(jd_keywords)
    total_weight = sum(jd_counter.values())
    matched_weight = sum(
        count for keyword, count in jd_counter.items()
        if keyword in resume_keywords
    )

    score = matched_weight / total_weight if total_weight > 0 else 0.0
    return min(1.0, score)


def compute_experience_alignment_score(
    resume_level: str,
    jd_text: str,
    config: ExperienceAlignmentConfig = DEFAULT_EXPERIENCE_CONFIG,
) -> float:
    """Compute how well the candidate's experience level aligns with the JD."""
    jd_level = "mid"
    jd_lower = jd_text.lower()

    level_patterns = {
        "intern": r"\b(?:intern|internship|trainee)\b",
        "junior": r"\b(?:junior|jr\.?|entry[- ]level)\b",
        "mid": r"\b(?:mid[- ]?level|intermediate|\d{3,5}\s*(?:years?|yrs?))\b",
        "senior": r"\b(?:senior|sr\.?|experienced|5\+?\s*(?:years?|yrs?))\b",
        "lead": r"\b(?:lead|tech lead|principal|staff)\b",
        "director": r"\b(?:director|head of|vp|vice president)\b",
        "c-level": r"\b(?:cto|ceo|cio|chief)\b",
    }

    for level, pattern in reversed(list(level_patterns.items())):
        if re.search(pattern, jd_lower):
            jd_level = level
            break

    resume_rank = config.level_map.get(resume_level.lower(), 2)
    jd_rank = config.level_map.get(jd_level, 2)
    gap = abs(resume_rank - jd_rank)

    penalty = min(gap * config.max_penalty_per_level, config.max_total_penalty)
    score = 1.0 - penalty

    logger.debug(
        "experience_alignment_computed",
        resume_level=resume_level,
        jd_level=jd_level,
        gap=gap,
        score=score,
    )
    return max(0.0, score)


def compute_embedding_similarity_score(
    resume_text: str, jd_text: str
) -> float:
    """Compute semantic similarity between resume and JD using embeddings."""
    resume_embedding = generate_embedding(resume_text)
    jd_embedding = generate_embedding(jd_text)
    similarity = compute_cosine_similarity(resume_embedding, jd_embedding)

    logger.debug("embedding_similarity_computed", similarity=similarity)
    return similarity


# ═══════════════════════════════════════════════════════════
# Tech-Specific Sub-Scores
# ═══════════════════════════════════════════════════════════

def compute_framework_match_score(
    resume_text: str,
    jd_text: str,
) -> float:
    """Compute framework/library match score for Tech domain.

    Checks how many tech frameworks mentioned in the JD appear in the resume.
    """
    if not resume_text or not jd_text:
        return 0.0

    jd_lower = jd_text.lower()
    resume_lower = resume_text.lower()

    jd_frameworks = [fw for fw in TECH_FRAMEWORKS if fw in jd_lower]
    if not jd_frameworks:
        return 0.5  # Neutral if JD doesn't mention specific frameworks

    matched = sum(1 for fw in jd_frameworks if fw in resume_lower)
    return matched / len(jd_frameworks)


def compute_impact_score(resume_text: str) -> float:
    """Compute impact/quantification score for Tech Recruiter layer.

    Measures density of quantified impact statements:
    numbers, percentages, dollar amounts, scale metrics.
    """
    if not resume_text:
        return 0.0

    lines = [l.strip() for l in resume_text.split("\n") if l.strip()]
    if not lines:
        return 0.0

    impact_patterns = [
        r"\d+%",                   # percentages
        r"\$\d+",                  # dollar amounts
        r"\d+[xX]\s",             # multipliers (3x)
        r"\d+\+?\s*(?:users?|customers?|clients?|requests?)",  # scale
        r"(?:increased|improved|reduced|decreased|grew|saved|generated|delivered)"
        r".*\d+",                  # impact verbs with numbers
        r"\d+\s*(?:team|engineers?|developers?|members?)",  # team size
    ]

    content_lines = [l for l in lines if len(l.split()) > 4]
    if not content_lines:
        return 0.0

    impact_count = 0
    for line in content_lines:
        for pattern in impact_patterns:
            if re.search(pattern, line, re.IGNORECASE):
                impact_count += 1
                break

    # Normalize: expect ~30% of content lines to have quantified impact
    score = min(1.0, impact_count / max(len(content_lines) * 0.3, 1))
    return round(score, 4)


def compute_maturity_score(
    resume_experience_level: str,
    resume_text: str,
) -> float:
    """Compute professional maturity score for Tech Recruiter layer.

    Measures signals of seniority / depth via mentions of system design,
    architecture decisions, mentoring, ownership, etc.
    """
    if not resume_text:
        return 0.3

    maturity_signals = [
        r"\b(?:system design|architecture|design decision)\b",
        r"\b(?:mentored?|coached?|led team|lead engineer)\b",
        r"\b(?:owned|ownership|responsible for|end-to-end)\b",
        r"\b(?:production|scalab|high availab|distributed)\b",
        r"\b(?:code review|pull request|technical decision)\b",
        r"\b(?:stakeholder|cross-functional|collaborated with)\b",
        r"\b(?:principal|staff|senior|lead|architect)\b",
    ]

    text_lower = resume_text.lower()
    hits = sum(1 for p in maturity_signals if re.search(p, text_lower))
    base_score = min(1.0, hits / max(len(maturity_signals) * 0.5, 1))

    # Experience level bonus
    level_map = {
        "intern": 0.1, "junior": 0.2, "mid": 0.4,
        "senior": 0.7, "lead": 0.8, "principal": 0.9,
    }
    level_bonus = level_map.get(resume_experience_level.lower(), 0.4)

    score = 0.60 * base_score + 0.40 * level_bonus
    return round(min(1.0, score), 4)


def compute_architecture_signal_score(resume_text: str) -> float:
    """Compute architecture signal score for Tech Recruiter layer.

    Detects mentions of system design patterns, scalability concepts,
    distributed systems terminology.
    """
    if not resume_text:
        return 0.0

    arch_patterns = [
        r"\b(?:microservices?|monolith|event[- ]driven)\b",
        r"\b(?:distributed|fault[- ]tolerant|high[- ]availability)\b",
        r"\b(?:load balanc|horizontal scal|vertical scal)\b",
        r"\b(?:message queue|pub[/ -]sub|event bus)\b",
        r"\b(?:caching|cdn|reverse proxy)\b",
        r"\b(?:database sharding|replication|partitioning)\b",
        r"\b(?:api gateway|service mesh|circuit breaker)\b",
        r"\b(?:CQRS|event sourcing|saga pattern)\b",
        r"\b(?:container orchestration|infrastructure as code)\b",
        r"\b(?:ci/cd pipeline|deployment|blue[- ]green|canary)\b",
    ]

    text_lower = resume_text.lower()
    hits = sum(1 for p in arch_patterns if re.search(p, text_lower, re.IGNORECASE))
    score = min(1.0, hits / max(len(arch_patterns) * 0.3, 1))
    return round(score, 4)


# ═══════════════════════════════════════════════════════════
# Non-Tech-Specific Sub-Scores
# ═══════════════════════════════════════════════════════════

def compute_tool_match_score(
    resume_text: str,
    jd_text: str,
) -> float:
    """Compute tool/platform match score for Non-Tech ATS layer.

    Checks JD-mentioned non-tech tools present in the resume.
    """
    if not resume_text or not jd_text:
        return 0.0

    jd_lower = jd_text.lower()
    resume_lower = resume_text.lower()

    jd_tools = [tool for tool in NON_TECH_TOOLS if tool in jd_lower]
    if not jd_tools:
        return 0.5  # Neutral if JD mentions no specific tools

    matched = sum(1 for tool in jd_tools if tool in resume_lower)
    return matched / len(jd_tools)


def compute_achievement_density_score(resume_text: str) -> float:
    """Compute achievement density for Non-Tech ATS layer.

    Measures how many lines contain quantified achievements or results.
    """
    if not resume_text:
        return 0.0

    lines = [
        l.strip() for l in resume_text.split("\n")
        if l.strip() and len(l.split()) > 4
    ]
    if not lines:
        return 0.0

    achievement_patterns = [
        r"\d+%",
        r"\$\d",
        r"(?:increased|improved|reduced|decreased|grew|saved|generated|delivered|launched|achieved|exceeded)",
        r"(?:revenue|profit|roi|conversion|retention|engagement)",
        r"\d+\s*(?:clients?|accounts?|projects?|campaigns?|initiatives?)",
    ]

    count = 0
    for line in lines:
        for pattern in achievement_patterns:
            if re.search(pattern, line, re.IGNORECASE):
                count += 1
                break

    score = min(1.0, count / max(len(lines) * 0.25, 1))
    return round(score, 4)


def compute_leadership_score(resume_text: str) -> float:
    """Compute leadership / management signal score for Non-Tech Recruiter layer."""
    if not resume_text:
        return 0.0

    leadership_patterns = [
        r"\b(?:managed|led|directed|supervised|oversaw)\b",
        r"\b(?:team of|direct reports?|cross-functional)\b",
        r"\b(?:leadership|management|executive)\b",
        r"\b(?:strategic|strategy|vision|transformation)\b",
        r"\b(?:stakeholder|c-suite|board|executive)\b",
        r"\b(?:budget|p&l|profit|revenue responsibility)\b",
        r"\b(?:coached|mentored|developed staff|talent)\b",
        r"\b(?:change management|organizational)\b",
    ]

    text_lower = resume_text.lower()
    hits = sum(1 for p in leadership_patterns if re.search(p, text_lower))
    score = min(1.0, hits / max(len(leadership_patterns) * 0.4, 1))
    return round(score, 4)


def compute_outcome_score(resume_text: str) -> float:
    """Compute outcome / results orientation score for Non-Tech Recruiter layer.

    Measures density of outcome-oriented language with quantified results.
    """
    if not resume_text:
        return 0.0

    outcome_patterns = [
        r"(?:resulted in|achieved|delivered|exceeded|surpassed)",
        r"(?:roi|kpi|metric|target|goal|quota)",
        r"\d+%\s*(?:increase|decrease|improvement|growth|reduction)",
        r"\$\d+(?:k|m|b|,\d{3})",
        r"(?:award|recognition|top performer|employee of)",
        r"(?:successfully|on time|under budget|ahead of schedule)",
    ]

    text_lower = resume_text.lower()
    hits = sum(1 for p in outcome_patterns if re.search(p, text_lower))
    score = min(1.0, hits / max(len(outcome_patterns) * 0.35, 1))
    return round(score, 4)


def compute_clarity_score(resume_text: str) -> float:
    """Compute writing clarity score for Non-Tech Recruiter layer.

    Measures sentence structure quality, use of action verbs, and readability.
    """
    if not resume_text:
        return 0.3

    lines = [l.strip() for l in resume_text.split("\n") if l.strip()]
    words = re.findall(r"\b\w+\b", resume_text)

    if not words or not lines:
        return 0.3

    # Action verb starts
    action_verbs = frozenset({
        "managed", "led", "developed", "created", "implemented",
        "designed", "delivered", "improved", "increased", "reduced",
        "built", "launched", "established", "coordinated", "analyzed",
        "negotiated", "achieved", "drove", "facilitated", "streamlined",
        "executed", "optimized", "supervised", "trained", "resolved",
    })
    content_lines = [l for l in lines if len(l.split()) > 4]
    action_starts = sum(
        1 for l in content_lines
        if l.split()[0].lower().rstrip(".,;:") in action_verbs
    ) if content_lines else 0
    action_ratio = action_starts / max(len(content_lines), 1)

    # Average sentence length (ideal: 10–25 words)
    avg_words_per_line = len(words) / max(len(lines), 1)
    if 10 <= avg_words_per_line <= 25:
        length_quality = 1.0
    elif avg_words_per_line < 5 or avg_words_per_line > 40:
        length_quality = 0.3
    else:
        length_quality = 0.6

    # Variety: unique words / total words
    unique_ratio = len(set(w.lower() for w in words)) / max(len(words), 1)
    vocab_score = min(1.0, unique_ratio * 2)

    score = 0.40 * action_ratio + 0.30 * length_quality + 0.30 * vocab_score
    return round(min(1.0, score), 4)


# ═══════════════════════════════════════════════════════════
# Non-Tech Market Sub-Scores
# ═══════════════════════════════════════════════════════════

def compute_certification_alignment_score(
    resume_text: str,
    jd_text: str,
) -> float:
    """Compute certification alignment for Non-Tech Market layer."""
    if not resume_text or not jd_text:
        return 0.3

    jd_lower = jd_text.lower()
    resume_lower = resume_text.lower()

    relevant_certs = [c for c in NON_TECH_CERTIFICATIONS if c in jd_lower]

    if not relevant_certs:
        has_any = sum(1 for c in NON_TECH_CERTIFICATIONS if c in resume_lower)
        return min(1.0, 0.3 + has_any * 0.1)

    matched = sum(1 for c in relevant_certs if c in resume_lower)
    return matched / len(relevant_certs)


def compute_competition_score(
    resume_skills: List[str],
    jd_text: str,
) -> float:
    """Compute competition score for Non-Tech Market layer.

    Estimates how common the candidate's skill set is in the market.
    More unique/specialized skills = lower competition = better score.
    """
    if not resume_skills:
        return 0.3

    jd_lower = jd_text.lower()
    skills_lower = {s.lower() for s in resume_skills}

    generic_skills = {
        "excel", "powerpoint", "word", "communication", "teamwork",
        "leadership", "organization", "time management", "problem solving",
        "microsoft office", "presentation",
    }

    generic_count = sum(1 for s in skills_lower if s in generic_skills)
    specialized_count = len(skills_lower) - generic_count

    jd_matched = sum(1 for s in skills_lower if s in jd_lower)
    jd_match_ratio = jd_matched / max(len(skills_lower), 1)

    specialization_ratio = specialized_count / max(len(skills_lower), 1)
    score = 0.50 * jd_match_ratio + 0.50 * specialization_ratio
    return round(min(1.0, score), 4)


# ═══════════════════════════════════════════════════════════
# Tech Market Sub-Scores
# ═══════════════════════════════════════════════════════════

def compute_tech_stability_score(resume_skills: List[str]) -> float:
    """Compute technology stability score for Tech Market layer.

    Penalizes reliance on declining/niche tech; rewards stable/growing tech.
    """
    if not resume_skills:
        return 0.3

    stable_tech = frozenset({
        "python", "javascript", "typescript", "java", "go", "rust",
        "react", "docker", "kubernetes", "aws", "azure", "gcp",
        "postgresql", "redis", "kafka", "terraform",
        "machine learning", "data science", "fastapi", "nextjs",
    })

    declining_tech = frozenset({
        "jquery", "coffeescript", "perl", "delphi", "coldfusion",
        "flash", "actionscript", "silverlight", "backbone",
        "grunt", "bower", "mercurial",
    })

    skills_lower = {s.lower() for s in resume_skills}
    stable_count = sum(1 for s in skills_lower if s in stable_tech)
    declining_count = sum(1 for s in skills_lower if s in declining_tech)
    total = max(len(skills_lower), 1)

    score = (stable_count - declining_count * 0.5) / total
    return round(max(0.0, min(1.0, score + 0.3)), 4)


# ═══════════════════════════════════════════════════════════
# Layer 1: ATS Screening Risk (Domain-Aware)
# ═══════════════════════════════════════════════════════════

def compute_ats_screening_risk(
    resume_skills: List[str],
    resume_text: str,
    jd_text: str,
    domain: str = "Tech",
    resume_experience_level: str = "mid",
) -> Tuple[float, Dict[str, Any]]:
    """Compute ATS Screening Risk (Layer 1) — domain-aware.

    Tech ATS:  1 - (0.45*technical_skill + 0.25*framework_match + 0.15*keyword + 0.15*exp)
    Non-Tech:  1 - (0.35*keyword + 0.25*tool_match + 0.20*achievement_density + 0.20*exp)

    Returns:
        Tuple of (risk_score 0–1, details dict).
    """
    skill_score, matched_skills, missing_skills = compute_skill_match_score(
        resume_skills, jd_text
    )
    keyword_score = compute_keyword_density_score(resume_text, jd_text)
    exp_score = compute_experience_alignment_score(resume_experience_level, jd_text)

    if domain == "Tech":
        framework_score = compute_framework_match_score(resume_text, jd_text)
        w = DEFAULT_TECH_ATS_WEIGHTS
        fitness = (
            w.technical_skill * skill_score
            + w.framework_match * framework_score
            + w.keyword * keyword_score
            + w.exp * exp_score
        )
        details = {
            "technical_skill_score": round(skill_score, 4),
            "framework_match_score": round(framework_score, 4),
            "keyword_score": round(keyword_score, 4),
            "exp_score": round(exp_score, 4),
            "skill_match": round(skill_score, 4),
            "keyword_density": round(keyword_score, 4),
            "matched_skills": matched_skills,
            "missing_skills": missing_skills,
            "domain_model": "TECH_ATS",
        }
    else:
        tool_score = compute_tool_match_score(resume_text, jd_text)
        achievement_score = compute_achievement_density_score(resume_text)
        w = DEFAULT_NONTECH_ATS_WEIGHTS
        fitness = (
            w.keyword * keyword_score
            + w.tool_match * tool_score
            + w.achievement_density * achievement_score
            + w.exp * exp_score
        )
        details = {
            "keyword_score": round(keyword_score, 4),
            "tool_match_score": round(tool_score, 4),
            "achievement_density_score": round(achievement_score, 4),
            "exp_score": round(exp_score, 4),
            "skill_match": round(skill_score, 4),
            "keyword_density": round(keyword_score, 4),
            "matched_skills": matched_skills,
            "missing_skills": missing_skills,
            "domain_model": "NON_TECH_ATS",
        }

    risk = round(1.0 - fitness, 4)
    risk = max(0.0, min(1.0, risk))

    logger.debug("ats_screening_risk_computed", risk=risk, domain=domain)
    return risk, details


# ═══════════════════════════════════════════════════════════
# Layer 2: Recruiter Evaluation Risk (Domain-Aware)
# ═══════════════════════════════════════════════════════════

def compute_recruiter_evaluation_risk(
    resume_text: str,
    resume_experience_level: str,
    jd_text: str,
    domain: str = "Tech",
) -> Tuple[float, Dict[str, Any]]:
    """Compute Recruiter Evaluation Risk (Layer 2) — domain-aware.

    Tech:     1 - (0.4*embedding_sim + 0.3*impact + 0.2*maturity + 0.1*arch_signal)
    Non-Tech: 1 - (0.35*embedding_sim + 0.25*leadership + 0.25*outcome + 0.15*clarity)

    Returns:
        Tuple of (risk_score 0–1, details dict).
    """
    embedding_score = compute_embedding_similarity_score(resume_text, jd_text)

    if domain == "Tech":
        impact = compute_impact_score(resume_text)
        maturity = compute_maturity_score(resume_experience_level, resume_text)
        arch_signal = compute_architecture_signal_score(resume_text)
        w = DEFAULT_TECH_RECRUITER_WEIGHTS
        fitness = (
            w.embedding_similarity * embedding_score
            + w.impact * impact
            + w.maturity * maturity
            + w.architecture_signal * arch_signal
        )
        details = {
            "embedding_similarity": round(embedding_score, 4),
            "impact_score": round(impact, 4),
            "maturity_score": round(maturity, 4),
            "architecture_signal_score": round(arch_signal, 4),
            "resume_level": resume_experience_level,
            "experience_alignment": round(
                compute_experience_alignment_score(resume_experience_level, jd_text), 4
            ),
            "domain_model": "TECH_RECRUITER",
        }
    else:
        leadership = compute_leadership_score(resume_text)
        outcome = compute_outcome_score(resume_text)
        clarity = compute_clarity_score(resume_text)
        w = DEFAULT_NONTECH_RECRUITER_WEIGHTS
        fitness = (
            w.embedding_similarity * embedding_score
            + w.leadership * leadership
            + w.outcome * outcome
            + w.clarity * clarity
        )
        details = {
            "embedding_similarity": round(embedding_score, 4),
            "leadership_score": round(leadership, 4),
            "outcome_score": round(outcome, 4),
            "clarity_score": round(clarity, 4),
            "resume_level": resume_experience_level,
            "experience_alignment": round(
                compute_experience_alignment_score(resume_experience_level, jd_text), 4
            ),
            "domain_model": "NON_TECH_RECRUITER",
        }

    risk = round(1.0 - fitness, 4)
    risk = max(0.0, min(1.0, risk))

    logger.debug("recruiter_evaluation_risk_computed", risk=risk, domain=domain)
    return risk, details


# ═══════════════════════════════════════════════════════════
# Layer 3: Market Competitiveness Risk (Domain-Aware)
# ═══════════════════════════════════════════════════════════

def _load_market_demand_skills() -> Dict[str, float]:
    """Load market demand data from job_market_dataset.json."""
    import json
    import os

    dataset_path = os.path.join(
        os.path.dirname(os.path.dirname(os.path.dirname(__file__))),
        "data", "job_market_dataset.json",
    )

    try:
        with open(dataset_path, "r", encoding="utf-8") as f:
            data = json.load(f)

        demand_map: Dict[str, float] = {}
        if isinstance(data, list):
            skill_counter: Counter = Counter()
            for entry in data:
                skills = entry.get("skills", [])
                if isinstance(skills, list):
                    for s in skills:
                        skill_counter[s.lower()] += 1
                elif isinstance(skills, str):
                    for s in skills.split(","):
                        skill_counter[s.strip().lower()] += 1

            if skill_counter:
                max_freq = max(skill_counter.values())
                for skill, freq in skill_counter.items():
                    demand_map[skill] = round(freq / max_freq, 4)
        elif isinstance(data, dict):
            for key, value in data.items():
                if isinstance(value, (int, float)):
                    demand_map[key.lower()] = float(value)

        return demand_map

    except (FileNotFoundError, json.JSONDecodeError) as e:
        logger.warning("market_dataset_load_failed", error=str(e))
        return {}


def compute_market_competitiveness_risk(
    resume_skills: List[str],
    jd_text: str,
    domain: str = "Tech",
    resume_text: str = "",
) -> Tuple[float, Dict[str, Any]]:
    """Compute Market Competitiveness Risk (Layer 3) — domain-aware.

    Tech:     1 - (0.5*demand_alignment + 0.3*competition_alignment + 0.2*stability)
    Non-Tech: 1 - (0.4*demand_alignment + 0.3*certification_alignment + 0.3*competition)

    Returns:
        Tuple of (risk_score 0–1, details dict).
    """
    demand_map = _load_market_demand_skills()

    jd_keywords = set(_extract_keywords(jd_text))
    resume_skills_lower = [s.lower() for s in resume_skills]

    # ── Compute demand alignment (shared) ────────────────
    if not demand_map:
        if not jd_keywords or not resume_skills_lower:
            demand_alignment = 0.5
        else:
            overlap = sum(
                1 for s in resume_skills_lower
                if s in jd_keywords or any(s in kw or kw in s for kw in jd_keywords)
            )
            demand_alignment = min(1.0, overlap / max(len(jd_keywords), 1))
    else:
        skill_demand_scores: List[float] = []
        for skill in resume_skills_lower:
            demand = demand_map.get(skill, 0.0)
            skill_demand_scores.append(demand)

        avg_demand = (
            sum(skill_demand_scores) / len(skill_demand_scores)
            if skill_demand_scores
            else 0.0
        )

        jd_demand_skills = [s for s in jd_keywords if demand_map.get(s, 0) >= 0.3]
        if jd_demand_skills:
            jd_coverage = sum(
                1 for s in jd_demand_skills if s in resume_skills_lower
            ) / len(jd_demand_skills)
        else:
            jd_coverage = 0.5

        demand_alignment = 0.50 * avg_demand + 0.50 * jd_coverage
        demand_alignment = min(1.0, max(0.0, demand_alignment))

    # ── Domain-specific sub-scores ───────────────────────
    if domain == "Tech":
        # Competition alignment: how well skills match market hot spots
        competition_alignment = demand_alignment
        if demand_map and resume_skills_lower:
            hot_skills = sorted(demand_map.items(), key=lambda x: -x[1])[:20]
            hot_matched = sum(
                1 for s, _ in hot_skills if s in resume_skills_lower
            )
            competition_alignment = min(
                1.0, hot_matched / max(min(len(hot_skills), 5), 1)
            )

        stability = compute_tech_stability_score(resume_skills)
        w = DEFAULT_TECH_MARKET_WEIGHTS
        alignment = (
            w.demand_alignment * demand_alignment
            + w.competition_alignment * competition_alignment
            + w.stability * stability
        )
        details = {
            "method": "market_dataset" if demand_map else "jd_proxy",
            "alignment_score": round(alignment, 4),
            "demand_alignment": round(demand_alignment, 4),
            "competition_alignment": round(competition_alignment, 4),
            "stability_score": round(stability, 4),
            "domain_model": "TECH_MARKET",
        }
    else:
        cert_alignment = compute_certification_alignment_score(resume_text, jd_text)
        competition = compute_competition_score(resume_skills, jd_text)
        w = DEFAULT_NONTECH_MARKET_WEIGHTS
        alignment = (
            w.demand_alignment * demand_alignment
            + w.certification_alignment * cert_alignment
            + w.competition * competition
        )
        details = {
            "method": "market_dataset" if demand_map else "jd_proxy",
            "alignment_score": round(alignment, 4),
            "demand_alignment": round(demand_alignment, 4),
            "certification_alignment": round(cert_alignment, 4),
            "competition_score": round(competition, 4),
            "domain_model": "NON_TECH_MARKET",
        }

    alignment = min(1.0, max(0.0, alignment))
    risk = round(1.0 - alignment, 4)

    # Collect high-demand matched/missing for details
    high_demand_matched: List[str] = []
    high_demand_missing: List[str] = []
    if demand_map:
        for skill in resume_skills_lower:
            if demand_map.get(skill, 0) >= 0.5:
                high_demand_matched.append(skill)
        for skill, demand in sorted(demand_map.items(), key=lambda x: -x[1])[:30]:
            if demand >= 0.5 and skill not in resume_skills_lower:
                if skill in jd_keywords or any(
                    skill in kw or kw in skill for kw in jd_keywords
                ):
                    high_demand_missing.append(skill)

    details["high_demand_matched"] = high_demand_matched[:10]
    details["high_demand_missing"] = high_demand_missing[:10]

    logger.debug("market_competitiveness_risk_computed", risk=risk, domain=domain)
    return risk, details


# ═══════════════════════════════════════════════════════════
# Layer 4: Spelling & Grammar Risk (Universal)
# ═══════════════════════════════════════════════════════════

def compute_spelling_grammar_risk(
    resume_text: str,
) -> Tuple[float, Dict[str, Any]]:
    """Compute Spelling & Grammar Risk (Layer 4) — universal.

    Uses sub-weights: spelling (0.5), grammar (0.3), readability (0.2)

    Returns:
        Tuple of (risk_score 0–1, details dict).
    """
    if not resume_text or not resume_text.strip():
        return 0.5, {"issues_found": 0, "word_count": 0}

    issues: List[str] = []
    text_lower = resume_text.lower()
    words = re.findall(r"\b\w+\b", resume_text)
    word_count = len(words)

    if word_count == 0:
        return 0.5, {"issues_found": 0, "word_count": 0}

    lines = [line.strip() for line in resume_text.split("\n") if line.strip()]

    # ── Spelling sub-score ───────────────────────────────
    misspelling_count = 0
    for pattern, correction in _COMMON_MISSPELLINGS:
        matches = re.findall(pattern, text_lower)
        if matches:
            misspelling_count += len(matches)
            issues.append(f"Possible misspelling: '{matches[0]}' → '{correction}'")

    repeated = re.findall(r"\b(\w+)\s+\1\b", text_lower)
    repeated_count = len(repeated)
    if repeated_count > 0:
        issues.append(f"Repeated words detected: {repeated_count} occurrences")

    misspelling_rate = misspelling_count / max(word_count / 100, 1)
    repeated_rate = repeated_count / max(word_count / 200, 1)

    spelling_risk = (
        0.70 * min(misspelling_rate, 1.0)
        + 0.30 * min(repeated_rate, 1.0)
    )

    # ── Grammar sub-score ────────────────────────────────
    fragment_count = 0
    for line in lines:
        line_words = re.findall(r"\b\w+\b", line)
        if 1 <= len(line_words) <= 2 and not re.match(r"^[A-Z•\-\*►]", line):
            if not re.match(r"^\d", line) and len(line) > 3:
                fragment_count += 1

    if fragment_count > 3:
        issues.append(f"Sentence fragments: {fragment_count} detected")

    caps_inconsistency = 0
    section_lines = [l for l in lines if len(l.split()) <= 4 and l[0:1].isupper()]
    if len(section_lines) >= 2:
        all_upper = sum(1 for l in section_lines if l.isupper())
        all_title = sum(1 for l in section_lines if l.istitle())
        if (
            all_upper > 0
            and all_title > 0
            and all_upper != len(section_lines)
            and all_title != len(section_lines)
        ):
            caps_inconsistency = 1
            issues.append("Inconsistent capitalization in section headings")

    fragment_rate = fragment_count / max(len(lines), 1)
    grammar_risk = (
        0.50 * min(fragment_rate, 1.0)
        + 0.50 * min(caps_inconsistency, 1.0)
    )

    # ── Readability sub-score ────────────────────────────
    content_lines = [l for l in lines if len(l.split()) > 5]
    no_period_count = 0
    for cl in content_lines:
        if not cl.rstrip().endswith((".", "!", ":", ";")) and not cl.rstrip().endswith(
            ")"
        ):
            no_period_count += 1

    avg_words = len(words) / max(len(lines), 1)
    if 10 <= avg_words <= 25:
        readability_penalty = 0.0
    elif avg_words < 5 or avg_words > 40:
        readability_penalty = 0.6
    else:
        readability_penalty = 0.2

    period_penalty = no_period_count / max(len(content_lines), 1)
    readability_risk = 0.50 * readability_penalty + 0.50 * min(period_penalty, 1.0)

    # ── Composite with sub-weights ───────────────────────
    w = DEFAULT_GRAMMAR_WEIGHTS
    risk = (
        w.spelling * min(spelling_risk, 1.0)
        + w.grammar * min(grammar_risk, 1.0)
        + w.readability * min(readability_risk, 1.0)
    )

    risk = round(min(1.0, max(0.0, risk)), 4)

    details = {
        "word_count": word_count,
        "misspelling_count": misspelling_count,
        "repeated_words": repeated_count,
        "fragment_count": fragment_count,
        "caps_inconsistency": caps_inconsistency,
        "spelling_risk": round(spelling_risk, 4),
        "grammar_risk": round(grammar_risk, 4),
        "readability_risk": round(readability_risk, 4),
        "issues_found": len(issues),
        "issues": issues[:10],
    }

    logger.debug("spelling_grammar_risk_computed", risk=risk, issues=len(issues))
    return risk, details


# ═══════════════════════════════════════════════════════════
# Layer 5: Formatting & Structure Risk (Universal)
# ═══════════════════════════════════════════════════════════

def compute_formatting_structure_risk(
    resume_text: str,
    structured_data: Optional[Dict[str, Any]] = None,
) -> Tuple[float, Dict[str, Any]]:
    """Compute Formatting & Structure Risk (Layer 5) — universal.

    Uses sub-weights: structure (0.35), bullet (0.25), density (0.20),
                      parse_stability (0.20)

    Returns:
        Tuple of (risk_score 0–1, details dict).
    """
    if not resume_text or not resume_text.strip():
        return 0.8, {"sections_found": 0, "total_lines": 0}

    lines = [line.strip() for line in resume_text.split("\n") if line.strip()]
    total_lines = len(lines)
    words = re.findall(r"\b\w+\b", resume_text)
    total_words = len(words)

    # ── Structure sub-score ──────────────────────────────
    sections_found: List[str] = []
    for line in lines:
        line_lower = line.lower().strip(":").strip()
        if line_lower in EXPECTED_SECTIONS or any(
            sec in line_lower for sec in EXPECTED_SECTIONS
        ):
            sections_found.append(line_lower)

    if structured_data:
        if structured_data.get("skills"):
            if "skills" not in sections_found:
                sections_found.append("skills")
        if structured_data.get("experience"):
            if "experience" not in sections_found:
                sections_found.append("experience")
        if structured_data.get("education"):
            if "education" not in sections_found:
                sections_found.append("education")
        if structured_data.get("summary"):
            if "summary" not in sections_found:
                sections_found.append("summary")

    key_sections = {"experience", "skills", "education", "summary"}
    found_key = sum(
        1 for ks in key_sections if any(ks in sf for sf in sections_found)
    )
    section_coverage = found_key / len(key_sections)

    has_email = (
        1.0 if re.search(r"[\w.-]+@[\w.-]+\.\w+", resume_text) else 0.0
    )
    has_phone = (
        1.0
        if re.search(r"[\(]?\d{3}[\)]?[\s.-]?\d{3}[\s.-]?\d{4}", resume_text)
        else 0.0
    )
    contact_score = (has_email + has_phone) / 2.0

    structure_fitness = 0.70 * section_coverage + 0.30 * contact_score

    # ── Bullet sub-score ─────────────────────────────────
    bullet_patterns = re.findall(
        r"^[\s]*[•\-\*►◆▪]\s", resume_text, re.MULTILINE
    )
    numbered_patterns = re.findall(
        r"^[\s]*\d+[\.\)]\s", resume_text, re.MULTILINE
    )
    bullet_count = len(bullet_patterns) + len(numbered_patterns)
    bullet_fitness = 1.0 if bullet_count >= 3 else bullet_count / 3.0

    # ── Density sub-score (content balance) ──────────────
    if total_words < 100:
        density_fitness = 0.2
    elif total_words < 200:
        density_fitness = 0.5
    elif total_words < 300:
        density_fitness = 0.7
    elif total_words <= 900:
        density_fitness = 1.0
    elif total_words <= 1200:
        density_fitness = 0.8
    else:
        density_fitness = 0.6

    # ── Parse stability sub-score ────────────────────────
    very_short_lines = sum(1 for l in lines if 0 < len(l) < 3)
    very_long_lines = sum(1 for l in lines if len(l) > 200)
    special_char_lines = sum(
        1
        for l in lines
        if len(re.findall(r"[^\w\s.,;:!?()\-/+@#$%&*'\"]", l)) > 5
    )

    total_structural_issues = (
        very_short_lines + very_long_lines + special_char_lines
    )
    parse_stability_fitness = max(
        0.0, 1.0 - (total_structural_issues / max(total_lines, 1))
    )

    quantified_lines = sum(
        1
        for line in lines
        if len(line.split()) > 4
        and re.search(
            r"\d+[%$+]|\$\d|increased|reduced|improved|saved|grew|generated",
            line.lower(),
        )
    )
    quantification_bonus = min(0.2, quantified_lines * 0.05)
    parse_stability_fitness = min(
        1.0, parse_stability_fitness + quantification_bonus
    )

    # ── Composite with sub-weights ───────────────────────
    w = DEFAULT_FORMATTING_WEIGHTS
    formatting_fitness = (
        w.structure * structure_fitness
        + w.bullet * bullet_fitness
        + w.density * density_fitness
        + w.parse_stability * parse_stability_fitness
    )

    risk = round(1.0 - formatting_fitness, 4)
    risk = max(0.0, min(1.0, risk))

    missing_sections = [
        ks
        for ks in key_sections
        if not any(ks in sf for sf in sections_found)
    ]

    details = {
        "sections_found": sections_found,
        "missing_sections": missing_sections,
        "section_coverage": round(section_coverage, 4),
        "bullet_count": bullet_count,
        "total_words": total_words,
        "structure_score": round(structure_fitness, 4),
        "bullet_score": round(bullet_fitness, 4),
        "density_score": round(density_fitness, 4),
        "parse_stability_score": round(parse_stability_fitness, 4),
        "contact_info": {"email": has_email > 0, "phone": has_phone > 0},
        "quantified_achievements": quantified_lines,
    }

    logger.debug("formatting_structure_risk_computed", risk=risk)
    return risk, details


# ═══════════════════════════════════════════════════════════
# Graph Generation
# ═══════════════════════════════════════════════════════════


def generate_risk_breakdown_chart(
    risk_breakdown: Dict[str, float],
    domain: str = "Tech",
    model_used: str = "TECH_MODEL",
) -> str:
    """Generate a bar chart of rejection risk breakdown using matplotlib.

    X-axis: ATS, Recruiter, Market, Grammar, Formatting
    Y-axis: 0–100
    Title includes domain and model used.

    Returns:
        Base64-encoded PNG image string.
    """
    import matplotlib

    matplotlib.use("Agg")
    import matplotlib.pyplot as plt

    labels = ["ATS", "Recruiter", "Market", "Grammar", "Formatting"]
    keys = [
        "ats_screening",
        "recruiter_evaluation",
        "market_competitiveness",
        "spelling_grammar",
        "formatting_structure",
    ]
    values = [risk_breakdown.get(k, 0.0) * 100 for k in keys]

    fig, ax = plt.subplots(figsize=(8, 5))
    bars = ax.bar(labels, values)

    ax.set_title(
        f"Rejection Risk Breakdown — {domain} ({model_used})",
        fontsize=14,
        fontweight="bold",
    )
    ax.set_ylabel("Risk (%)", fontsize=12)
    ax.set_ylim(0, 100)
    ax.set_xlabel("")

    for bar, val in zip(bars, values):
        ax.text(
            bar.get_x() + bar.get_width() / 2.0,
            bar.get_height() + 1.5,
            f"{val:.1f}%",
            ha="center",
            va="bottom",
            fontsize=10,
            fontweight="bold",
        )

    ax.grid(axis="y", alpha=0.3)
    plt.tight_layout()

    buf = io.BytesIO()
    fig.savefig(buf, format="png", dpi=120, bbox_inches="tight")
    plt.close(fig)
    buf.seek(0)
    encoded = base64.b64encode(buf.read()).decode("utf-8")

    logger.debug("risk_breakdown_chart_generated", domain=domain)
    return encoded


# ═══════════════════════════════════════════════════════════
# Risk Diagnosis
# ═══════════════════════════════════════════════════════════


def _compute_risk_contributions(
    risk_breakdown: Dict[str, float],
    weights: Union[
        TechRejectionWeights, NonTechRejectionWeights, RejectionScoringWeights
    ],
) -> List[Dict[str, Any]]:
    """Compute the weighted contribution of each risk layer."""
    weight_map = weights.as_dict()
    contributions = []

    for layer, risk_val in risk_breakdown.items():
        w = weight_map.get(layer, 0.0)
        weighted = risk_val * w
        contributions.append(
            {
                "layer": layer,
                "risk": round(risk_val, 4),
                "weight": w,
                "weighted_contribution": round(weighted, 4),
                "contribution_percent": 0.0,
            }
        )

    total_weighted = sum(c["weighted_contribution"] for c in contributions)
    if total_weighted > 0:
        for c in contributions:
            c["contribution_percent"] = round(
                (c["weighted_contribution"] / total_weighted) * 100, 2
            )

    contributions.sort(key=lambda x: -x["weighted_contribution"])
    return contributions


def _generate_why_risk_is_high(
    contributions: List[Dict[str, Any]],
    risk_percent: float,
    risk_level: str,
    domain: str = "Tech",
    model_used: str = "TECH_MODEL",
) -> str:
    """Generate deterministic explanation of why risk is high.

    References actual numbers and the detected domain. No vague language.
    """
    if not contributions:
        return "Insufficient data to determine risk drivers."

    primary = contributions[0]
    secondary = contributions[1] if len(contributions) > 1 else None

    layer_labels = {
        "ats_screening": "ATS Screening",
        "recruiter_evaluation": "Recruiter Evaluation",
        "market_competitiveness": "Market Competitiveness",
        "spelling_grammar": "Spelling & Grammar",
        "formatting_structure": "Formatting & Structure",
    }

    primary_label = layer_labels.get(primary["layer"], primary["layer"])
    primary_risk_pct = round(primary["risk"] * 100, 1)
    primary_contrib_pct = round(primary["contribution_percent"], 1)

    explanation_parts = []

    domain_tag = f"[{domain} / {model_used}] "

    if risk_level in ("High", "Critical"):
        explanation_parts.append(
            f"{domain_tag}Risk is {risk_level.lower()} at {risk_percent:.1f}% primarily due to "
            f"{primary_label} (risk: {primary_risk_pct}%, "
            f"contributing {primary_contrib_pct}% of total weighted risk)."
        )
    elif risk_level == "Moderate":
        explanation_parts.append(
            f"{domain_tag}Risk is moderate at {risk_percent:.1f}%. The primary driver is "
            f"{primary_label} (risk: {primary_risk_pct}%, "
            f"contributing {primary_contrib_pct}% of total weighted risk)."
        )
    else:
        explanation_parts.append(
            f"{domain_tag}Risk is low at {risk_percent:.1f}%. The largest contributor is "
            f"{primary_label} (risk: {primary_risk_pct}%, "
            f"contributing {primary_contrib_pct}% of total weighted risk)."
        )

    if secondary:
        secondary_label = layer_labels.get(secondary["layer"], secondary["layer"])
        secondary_risk_pct = round(secondary["risk"] * 100, 1)
        secondary_contrib_pct = round(secondary["contribution_percent"], 1)

        layer_explanations = {
            "ats_screening": (
                f"This significantly increases ATS rejection probability. "
                f"Secondary driver is {secondary_label} "
                f"(risk: {secondary_risk_pct}%, contributing {secondary_contrib_pct}%)."
            ),
            "recruiter_evaluation": (
                f"This indicates weak alignment with recruiter expectations. "
                f"Secondary driver is {secondary_label} "
                f"(risk: {secondary_risk_pct}%, contributing {secondary_contrib_pct}%)."
            ),
            "market_competitiveness": (
                f"This indicates the candidate's skill set has low market alignment. "
                f"Secondary driver is {secondary_label} "
                f"(risk: {secondary_risk_pct}%, contributing {secondary_contrib_pct}%)."
            ),
            "spelling_grammar": (
                f"Grammar and spelling issues reduce credibility. "
                f"Secondary driver is {secondary_label} "
                f"(risk: {secondary_risk_pct}%, contributing {secondary_contrib_pct}%)."
            ),
            "formatting_structure": (
                f"Poor formatting reduces readability and ATS compatibility. "
                f"Secondary driver is {secondary_label} "
                f"(risk: {secondary_risk_pct}%, contributing {secondary_contrib_pct}%)."
            ),
        }

        explanation_parts.append(
            layer_explanations.get(
                primary["layer"],
                f"Secondary driver is {secondary_label} "
                f"(risk: {secondary_risk_pct}%, contributing {secondary_contrib_pct}%).",
            )
        )

    return " ".join(explanation_parts)


# ═══════════════════════════════════════════════════════════
# Confidence Interval
# ═══════════════════════════════════════════════════════════


def _compute_confidence_interval(
    risk_percent: float,
    layer_risks: Dict[str, float],
) -> Dict[str, float]:
    """Compute a deterministic confidence interval for the risk estimate."""
    values = list(layer_risks.values())
    if not values:
        return {"lower": risk_percent, "upper": risk_percent, "margin": 0.0}

    mean = sum(values) / len(values)
    variance = sum((v - mean) ** 2 for v in values) / len(values)
    std_dev = variance**0.5

    margin = round(std_dev * 100 * 0.5, 2)
    margin = min(margin, 15.0)

    lower = round(max(0.0, risk_percent - margin), 2)
    upper = round(min(100.0, risk_percent + margin), 2)

    return {"lower": lower, "upper": upper, "margin": margin}


# ═══════════════════════════════════════════════════════════
# Core Engine: compute_rejection_risk (Universal, Domain-Aware)
# ═══════════════════════════════════════════════════════════


def compute_rejection_risk(
    resume_text: str,
    resume_skills: List[str],
    resume_experience_level: str,
    jd_text: str,
    weights: Optional[RejectionScoringWeights] = None,
    structured_data: Optional[Dict[str, Any]] = None,
    job_title: Optional[str] = None,
) -> Dict[str, Any]:
    """Compute the composite rejection risk score — Universal Domain-Aware Engine.

    Auto-detects domain (Tech / Non-Tech) and applies the correct model.
    LLM must NOT compute the risk score.

    TECH_MODEL Final_Risk:
        (0.30 * ATS) + (0.30 * Recruiter) + (0.20 * Market)
      + (0.10 * Grammar) + (0.10 * Formatting)

    NON_TECH_MODEL Final_Risk:
        (0.25 * ATS) + (0.35 * Recruiter) + (0.20 * Market)
      + (0.10 * Grammar) + (0.10 * Formatting)

    Returns:
        Dictionary containing the full risk analysis result including
        domain_detected and model_used.

    Raises:
        ScoringError: If scoring computation fails.
    """
    try:
        logger.info("rejection_risk_computation_started")

        # ── Domain Detection ─────────────────────────────
        domain_info = detect_domain(
            resume_text=resume_text,
            jd_text=jd_text,
            resume_skills=resume_skills,
            job_title=job_title,
        )
        domain = domain_info["domain"]
        model_used = domain_info["model_used"]

        # Select domain-specific weights
        if domain == "Tech":
            domain_weights = DEFAULT_TECH_WEIGHTS
        else:
            domain_weights = DEFAULT_NONTECH_WEIGHTS

        # ── Layer 1: ATS Screening Risk ──────────────────
        ats_risk, ats_details = compute_ats_screening_risk(
            resume_skills,
            resume_text,
            jd_text,
            domain=domain,
            resume_experience_level=resume_experience_level,
        )

        # ── Layer 2: Recruiter Evaluation Risk ───────────
        recruiter_risk, recruiter_details = compute_recruiter_evaluation_risk(
            resume_text,
            resume_experience_level,
            jd_text,
            domain=domain,
        )

        # ── Layer 3: Market Competitiveness Risk ─────────
        market_risk, market_details = compute_market_competitiveness_risk(
            resume_skills,
            jd_text,
            domain=domain,
            resume_text=resume_text,
        )

        # ── Layer 4: Spelling & Grammar Risk ─────────────
        grammar_risk, grammar_details = compute_spelling_grammar_risk(resume_text)

        # ── Layer 5: Formatting & Structure Risk ─────────
        formatting_risk, formatting_details = compute_formatting_structure_risk(
            resume_text, structured_data
        )

        # ── Final Weighted Risk (domain-specific) ────────
        final_risk = (
            domain_weights.ats_screening * ats_risk
            + domain_weights.recruiter_evaluation * recruiter_risk
            + domain_weights.market_competitiveness * market_risk
            + domain_weights.spelling_grammar * grammar_risk
            + domain_weights.formatting_structure * formatting_risk
        )
        final_risk = round(max(0.0, min(1.0, final_risk)), 4)
        final_risk_percent = round(final_risk * 100, 2)

        # ── Risk Level Classification ────────────────────
        risk_level = _classify_risk_level(final_risk_percent)

        # ── Risk Breakdown ───────────────────────────────
        risk_breakdown = {
            "ats_screening": round(ats_risk, 4),
            "recruiter_evaluation": round(recruiter_risk, 4),
            "market_competitiveness": round(market_risk, 4),
            "spelling_grammar": round(grammar_risk, 4),
            "formatting_structure": round(formatting_risk, 4),
        }

        # ── Risk Contributions (diagnosis) ───────────────
        contributions = _compute_risk_contributions(
            risk_breakdown, domain_weights
        )

        highest_risk_area = contributions[0]["layer"] if contributions else ""
        secondary_risk_area = (
            contributions[1]["layer"] if len(contributions) > 1 else ""
        )

        # ── Why Risk Is High ─────────────────────────────
        why_risk_is_high = _generate_why_risk_is_high(
            contributions,
            final_risk_percent,
            risk_level,
            domain=domain,
            model_used=model_used,
        )

        # ── Behavioral Guidance ──────────────────────────
        guidance = RISK_GUIDANCE.get(risk_level, RISK_GUIDANCE["Moderate"])

        # ── Confidence Interval ──────────────────────────
        confidence_interval = _compute_confidence_interval(
            final_risk_percent, risk_breakdown
        )

        # ── Generate Graph ───────────────────────────────
        try:
            chart_base64 = generate_risk_breakdown_chart(
                risk_breakdown,
                domain=domain,
                model_used=model_used,
            )
        except Exception as chart_err:
            logger.warning("chart_generation_failed", error=str(chart_err))
            chart_base64 = None

        # ── Build component scores ───────────────────────
        component_scores = [
            RiskLayerScore(
                layer="ats_screening",
                label="ATS Screening",
                risk=round(ats_risk, 4),
                weight=domain_weights.ats_screening,
                weighted_risk=round(
                    ats_risk * domain_weights.ats_screening, 4
                ),
                contribution_percent=next(
                    (
                        c["contribution_percent"]
                        for c in contributions
                        if c["layer"] == "ats_screening"
                    ),
                    0.0,
                ),
                details=ats_details,
            ),
            RiskLayerScore(
                layer="recruiter_evaluation",
                label="Recruiter Evaluation",
                risk=round(recruiter_risk, 4),
                weight=domain_weights.recruiter_evaluation,
                weighted_risk=round(
                    recruiter_risk * domain_weights.recruiter_evaluation, 4
                ),
                contribution_percent=next(
                    (
                        c["contribution_percent"]
                        for c in contributions
                        if c["layer"] == "recruiter_evaluation"
                    ),
                    0.0,
                ),
                details=recruiter_details,
            ),
            RiskLayerScore(
                layer="market_competitiveness",
                label="Market Competitiveness",
                risk=round(market_risk, 4),
                weight=domain_weights.market_competitiveness,
                weighted_risk=round(
                    market_risk * domain_weights.market_competitiveness, 4
                ),
                contribution_percent=next(
                    (
                        c["contribution_percent"]
                        for c in contributions
                        if c["layer"] == "market_competitiveness"
                    ),
                    0.0,
                ),
                details=market_details,
            ),
            RiskLayerScore(
                layer="spelling_grammar",
                label="Spelling & Grammar",
                risk=round(grammar_risk, 4),
                weight=domain_weights.spelling_grammar,
                weighted_risk=round(
                    grammar_risk * domain_weights.spelling_grammar, 4
                ),
                contribution_percent=next(
                    (
                        c["contribution_percent"]
                        for c in contributions
                        if c["layer"] == "spelling_grammar"
                    ),
                    0.0,
                ),
                details=grammar_details,
            ),
            RiskLayerScore(
                layer="formatting_structure",
                label="Formatting & Structure",
                risk=round(formatting_risk, 4),
                weight=domain_weights.formatting_structure,
                weighted_risk=round(
                    formatting_risk * domain_weights.formatting_structure, 4
                ),
                contribution_percent=next(
                    (
                        c["contribution_percent"]
                        for c in contributions
                        if c["layer"] == "formatting_structure"
                    ),
                    0.0,
                ),
                details=formatting_details,
            ),
        ]

        # ── Collect skill gaps ───────────────────────────
        skill_gaps = list(ats_details.get("missing_skills", []))
        from app.services.resume_processor import KNOWN_SKILLS

        resume_skill_lower = {s.lower() for s in resume_skills}
        for skill_name in KNOWN_SKILLS:
            if (
                skill_name in jd_text.lower()
                and skill_name not in resume_skill_lower
            ):
                title_skill = skill_name.title()
                if title_skill not in skill_gaps:
                    skill_gaps.append(title_skill)

        # ── Build top rejection reasons ──────────────────
        rejection_reasons: List[str] = []
        if ats_risk > 0.5:
            rejection_reasons.append(
                f"ATS Screening risk is {ats_risk:.0%}: Low keyword match and skill overlap ({domain})"
            )
        if recruiter_risk > 0.5:
            reason_detail = (
                "Experience or semantic misalignment"
                if domain == "Tech"
                else "Leadership or outcome gaps"
            )
            rejection_reasons.append(
                f"Recruiter Evaluation risk is {recruiter_risk:.0%}: {reason_detail} ({domain})"
            )
        if market_risk > 0.5:
            rejection_reasons.append(
                f"Market Competitiveness risk is {market_risk:.0%}: "
                f"Skills not aligned with market demand ({domain})"
            )
        if grammar_risk > 0.3:
            rejection_reasons.append(
                f"Grammar risk is {grammar_risk:.0%}: Text quality issues detected"
            )
        if formatting_risk > 0.4:
            rejection_reasons.append(
                f"Formatting risk is {formatting_risk:.0%}: Resume structure needs improvement"
            )

        if not rejection_reasons:
            rejection_reasons.append(
                "Profile is reasonably aligned with job requirements"
            )

        result = {
            "final_risk_percent": final_risk_percent,
            "risk_score": final_risk,
            "risk_level": risk_level,
            "risk_breakdown": risk_breakdown,
            "highest_risk_area": highest_risk_area,
            "secondary_risk_area": secondary_risk_area,
            "why_risk_is_high": why_risk_is_high,
            "recommended_actions": guidance["actions"],
            "behavior_guidance_message": guidance["message"],
            "confidence_interval": confidence_interval,
            "component_scores": component_scores,
            "risk_contributions": contributions,
            "chart_base64": chart_base64,
            "top_rejection_reasons": rejection_reasons[:5],
            "skill_gaps": skill_gaps[:15],
            "matched_skills": ats_details.get("matched_skills", []),
            "domain_detected": domain,
            "model_used": model_used,
            "domain_confidence": domain_info["confidence"],
        }

        logger.info(
            "rejection_risk_computed",
            final_risk_percent=final_risk_percent,
            risk_level=risk_level,
            highest_risk=highest_risk_area,
            domain=domain,
            model_used=model_used,
        )

        return result

    except Exception as e:
        logger.error("rejection_risk_failed", error=str(e))
        raise ScoringError(
            message=f"Rejection risk computation failed: {str(e)}",
            details={"error_type": type(e).__name__},
        )


# ═══════════════════════════════════════════════════════════
# LLM Explanation Layer (post-scoring only)
# ═══════════════════════════════════════════════════════════


async def generate_rejection_explanation(
    risk_result: Dict[str, Any],
    job_title: str = "Unknown",
) -> Optional[Dict[str, Any]]:
    """Generate an LLM-powered explanation for rejection risk results.

    This is the ONLY LLM usage in the scoring pipeline.
    Scoring itself is fully deterministic. LLM may only generate
    explanation text AFTER scoring.

    Args:
        risk_result: Full risk analysis result dict from compute_rejection_risk.
        job_title: Target job title.

    Returns:
        Parsed explanation dictionary, or None if LLM fails.
    """
    try:
        prompt = REJECTION_EXPLANATION_PROMPT.format(
            final_risk_percent=risk_result.get("final_risk_percent", 0),
            risk_level=risk_result.get("risk_level", "Unknown"),
            risk_breakdown=risk_result.get("risk_breakdown", {}),
            highest_risk_area=risk_result.get("highest_risk_area", ""),
            secondary_risk_area=risk_result.get("secondary_risk_area", ""),
            why_risk_is_high=risk_result.get("why_risk_is_high", ""),
            recommended_actions=", ".join(
                risk_result.get("recommended_actions", [])
            ),
            skill_gaps=", ".join(risk_result.get("skill_gaps", [])),
            job_title=job_title,
            domain_detected=risk_result.get("domain_detected", "Unknown"),
            model_used=risk_result.get("model_used", "Unknown"),
        )

        explanation = await call_llm_structured(prompt)
        logger.info("rejection_explanation_generated")
        return explanation

    except Exception as e:
        logger.warning("rejection_explanation_failed", error=str(e))
        return None
