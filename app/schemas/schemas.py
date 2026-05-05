"""
reBorn_i — Pydantic Schemas

Strict JSON schemas for all API inputs and outputs.
These enforce consistency across the entire system.
"""

from datetime import datetime
from typing import Dict, List, Optional, Union
from uuid import UUID

from pydantic import BaseModel, EmailStr, Field, field_validator


# ═══════════════════════════════════════════════════════════
# Authentication Schemas
# ═══════════════════════════════════════════════════════════

class UserCreate(BaseModel):
    """Schema for user registration."""
    email: EmailStr
    password: str = Field(..., min_length=8, max_length=128)
    full_name: Optional[str] = Field(None, max_length=255)


class UserLogin(BaseModel):
    """Schema for user login."""
    email: EmailStr
    password: str


class UserResponse(BaseModel):
    """Schema for user data in responses."""
    id: str  # UUID is stored as string in database
    email: str
    full_name: Optional[str]
    is_active: bool
    auth_provider: Optional[str] = "local"
    avatar_url: Optional[str] = None
    subscription_plan: str = "free"  # free | pro
    subscription_started_at: Optional[datetime] = None
    created_at: datetime

    model_config = {"from_attributes": True}


class GoogleLoginRequest(BaseModel):
    """Schema for Google OAuth login."""
    id_token: str = Field(..., description="Google ID token from frontend")


class TokenResponse(BaseModel):
    """JWT token response."""
    access_token: str
    token_type: str = "bearer"
    expires_in: int


# ═══════════════════════════════════════════════════════════
# Resume Schemas
# ═══════════════════════════════════════════════════════════

class ResumeSkill(BaseModel):
    """Individual skill extracted from resume."""
    name: str
    category: Optional[str] = None  # e.g., "programming", "framework", "soft_skill"
    proficiency: Optional[str] = None  # e.g., "beginner", "intermediate", "expert"


class ResumeExperience(BaseModel):
    """Single experience entry."""
    title: str
    company: Optional[str] = None
    duration: Optional[str] = None
    description: Optional[str] = None
    skills_used: List[str] = Field(default_factory=list)


class ResumeEducation(BaseModel):
    """Education entry."""
    degree: Optional[str] = None
    institution: Optional[str] = None
    year: Optional[str] = None
    field_of_study: Optional[str] = None


class ResumeSection(BaseModel):
    """A detected section of the resume with confidence scoring."""
    heading: str  # Original heading text as found in the document
    normalized_key: str  # Standardized key (e.g., "experience", "education")
    content: List[str] = Field(default_factory=list)  # Lines of content
    sub_sections: List["ResumeSection"] = Field(default_factory=list)
    confidence: float = Field(1.0, ge=0.0, le=1.0)  # Detection confidence


class StructuredResume(BaseModel):
    """Complete structured resume output from processing."""
    full_name: Optional[str] = None
    email: Optional[str] = None
    phone: Optional[str] = None
    summary: Optional[str] = None
    skills: List[ResumeSkill] = Field(default_factory=list)
    experience: List[ResumeExperience] = Field(default_factory=list)
    education: List[ResumeEducation] = Field(default_factory=list)
    certifications: List[str] = Field(default_factory=list)
    total_experience_years: Optional[float] = None
    experience_level: Optional[str] = None
    sections: List[ResumeSection] = Field(default_factory=list)
    other_sections: List[ResumeSection] = Field(default_factory=list)


class ResumeUploadResponse(BaseModel):
    """Response after resume upload and processing."""
    id: str
    filename: str
    status: str
    structured_data: Optional[StructuredResume] = None
    skills_count: int = 0
    created_at: datetime

    model_config = {"from_attributes": True}


# ═══════════════════════════════════════════════════════════
# Rejection Risk Schemas (5-Layer Model)
# ═══════════════════════════════════════════════════════════

class RejectionAnalysisRequest(BaseModel):
    """Request to analyze rejection risk."""
    resume_id: UUID
    job_description: str = Field(..., min_length=50, max_length=10000)
    job_title: Optional[str] = Field(None, max_length=255)
    required_skills: Optional[List[str]] = Field(None, description="Optional list of required skills for the job")

    @field_validator("job_description")
    @classmethod
    def validate_job_description(cls, v: str) -> str:
        if len(v.strip()) < 50:
            raise ValueError("Job description must contain meaningful content (min 50 chars)")
        return v.strip()


class ComponentScore(BaseModel):
    """Individual component score breakdown (legacy compatibility)."""
    component: str
    score: float = Field(..., ge=0.0, le=1.0)
    weight: float
    weighted_score: float
    details: Optional[str] = None


class RiskLayerScore(BaseModel):
    """Individual risk layer score for the 5-layer model."""
    layer: str  # e.g. "ats_screening"
    label: str  # e.g. "ATS Screening"
    risk: float = Field(..., ge=0.0, le=1.0)
    weight: float
    weighted_risk: float
    contribution_percent: float = 0.0
    details: Optional[Dict] = None


class ConfidenceInterval(BaseModel):
    """Confidence interval for the risk estimate."""
    lower: float
    upper: float
    margin: float


class RejectionAnalysisResponse(BaseModel):
    """Rejection risk analysis output — 5-layer model.

    Structured output:
    {
        "final_risk_percent": float,
        "risk_level": "Low / Moderate / High / Critical",
        "risk_breakdown": {},
        "highest_risk_area": "",
        "secondary_risk_area": "",
        "why_risk_is_high": "",
        "recommended_actions": [],
        "behavior_guidance_message": "",
        "confidence_interval": {}
    }
    """
    id: str
    final_risk_percent: float = Field(..., ge=0.0, le=100.0)
    risk_score: float = Field(..., ge=0.0, le=1.0)  # backward compat (0–1)
    risk_level: str  # Low / Moderate / High / Critical
    risk_breakdown: Dict[str, float]  # layer -> risk (0–1)
    highest_risk_area: str
    secondary_risk_area: str
    why_risk_is_high: str
    recommended_actions: List[str]
    behavior_guidance_message: str
    confidence_interval: ConfidenceInterval
    component_scores: List[RiskLayerScore]
    top_rejection_reasons: List[str]
    skill_gaps: List[str]
    chart_base64: Optional[str] = None  # base64-encoded PNG bar chart
    job_title: Optional[str] = None
    domain_detected: str = "Unknown"  # Tech or Non-Tech
    model_used: str = "Unknown"  # TECH_MODEL or NON_TECH_MODEL
    explanation: Optional[Dict] = None  # LLM-generated explanation (post-scoring)
    created_at: datetime

    model_config = {"from_attributes": True}


# ═══════════════════════════════════════════════════════════
# Market Radar Schemas
# ═══════════════════════════════════════════════════════════

class SkillDemandEntry(BaseModel):
    """Single skill demand data point."""
    skill: str
    frequency: int
    demand_index: float = Field(..., ge=0.0, le=1.0)
    rank: int


class MarketRadarResponse(BaseModel):
    """Market radar analysis output."""
    top_skills: List[SkillDemandEntry]
    total_jobs_analyzed: int
    snapshot_date: datetime
    user_future_proof_score: Optional[float] = Field(None, ge=0.0, le=1.0)
    user_aligned_skills: List[str] = Field(default_factory=list)
    user_missing_high_demand: List[str] = Field(default_factory=list)


# ═══════════════════════════════════════════════════════════
# Career Simulation Schemas
# ═══════════════════════════════════════════════════════════

class CareerSimulationRequest(BaseModel):
    """Request to simulate career changes."""
    resume_id: UUID
    job_description: str = Field(..., min_length=50, max_length=10000)
    skills_to_add: List[str] = Field(default_factory=list)
    skills_to_remove: List[str] = Field(default_factory=list)

    @field_validator("skills_to_add", "skills_to_remove")
    @classmethod
    def validate_skills_list(cls, v: List[str]) -> List[str]:
        return [s.strip().lower() for s in v if s.strip()]


class SimulationMetrics(BaseModel):
    """Before/after metrics for simulation."""
    risk_score: float = Field(..., ge=0.0, le=1.0)
    skill_gaps: List[str]
    matched_skills: List[str]
    component_scores: Union[List[RiskLayerScore], List[ComponentScore]]


class CareerSimulationResponse(BaseModel):
    """Career simulation comparison output."""
    id: str
    before_metrics: SimulationMetrics
    after_metrics: SimulationMetrics
    risk_delta: float  # Negative = improvement
    skills_added: List[str]
    skills_removed: List[str]
    explanation: Optional[Dict] = None
    created_at: datetime


# ═══════════════════════════════════════════════════════════
# Reinvention Blueprint Schemas
# ═══════════════════════════════════════════════════════════

class BlueprintRequest(BaseModel):
    """Request to generate a reinvention blueprint."""
    resume_id: UUID
    job_description: str = Field(..., min_length=50, max_length=10000)
    target_role: str = Field(..., min_length=2, max_length=255)
    plan_type: str = Field(..., pattern="^(30_day|90_day)$")


class BlueprintResponse(BaseModel):
    """Reinvention blueprint output."""
    id: str
    plan_type: str
    target_role: str
    plan_data: Dict  # Full structured plan from LLM
    risk_score_at_creation: Optional[float] = None
    prompt_template_version: Optional[str] = None
    created_at: datetime

    model_config = {"from_attributes": True}


# ═══════════════════════════════════════════════════════════
# Health & System Schemas
# ═══════════════════════════════════════════════════════════

class HealthResponse(BaseModel):
    """System health check response."""
    status: str
    version: str
    environment: str
    database: str
    timestamp: datetime


# ═══════════════════════════════════════════════════════════
# Hiring Pipeline Schemas
# ═══════════════════════════════════════════════════════════

class HiringPipelineRequest(BaseModel):
    """Request to simulate hiring pipeline survival probability."""
    ATS_risk: float = Field(..., ge=0.0, le=1.0, description="ATS filtering risk (0–1)")
    Recruiter_risk: float = Field(..., ge=0.0, le=1.0, description="Recruiter scan risk (0–1)")
    Market_risk: float = Field(..., ge=0.0, le=1.0, description="Market competition risk (0–1)")
    Grammar_risk: float = Field(..., ge=0.0, le=1.0, description="Grammar quality risk (0–1)")
    Formatting_risk: float = Field(..., ge=0.0, le=1.0, description="Formatting quality risk (0–1)")
    domain: str = Field(..., pattern="^(TECH|NON_TECH)$", description="Domain: TECH or NON_TECH")


class HiringPipelineConfidenceInterval(BaseModel):
    """Confidence interval for the hiring pipeline estimate (0–1 scale)."""
    lower: float = Field(..., ge=0.0, le=1.0)
    upper: float = Field(..., ge=0.0, le=1.0)


class HiringPipelineConfidenceIntervalPercent(BaseModel):
    """Confidence interval for the hiring pipeline estimate (0–100 scale)."""
    lower: float = Field(..., ge=0.0, le=100.0)
    upper: float = Field(..., ge=0.0, le=100.0)


class HiringPipelineSurvival(BaseModel):
    """Stage-wise survival probabilities."""
    ATS_survival_raw: float
    Recruiter_survival_raw: float
    Market_survival_raw: float
    ATS_stage_compounded: float
    Recruiter_stage_compounded: float
    Market_stage_compounded: float
    Final_Interview_Probability: float


class HiringPipelineResponse(BaseModel):
    """Full structured output from hiring pipeline simulation."""
    domain_detected: str
    pipeline_survival: HiringPipelineSurvival
    pipeline_survival_percent: HiringPipelineSurvival
    primary_bottleneck_stage: str
    secondary_bottleneck_stage: str
    why_this_stage_is_weak: str
    improvement_actions: List[str]
    behavior_guidance_message: str
    confidence_interval: HiringPipelineConfidenceInterval
    confidence_interval_percent: HiringPipelineConfidenceIntervalPercent
    chart_base64: Optional[str] = None


# ═══════════════════════════════════════════════════════════
# Payment Schemas
# ═══════════════════════════════════════════════════════════

class PaymentCreateRequest(BaseModel):
    """Request to create a payment order."""
    # User ID is extracted from JWT, so no explicit user_id field needed
    pass


class PaymentVerifyRequest(BaseModel):
    """Request to verify and complete a payment."""
    razorpay_payment_id: str = Field(..., min_length=1, description="Razorpay payment ID")
    razorpay_signature: str = Field(..., min_length=1, description="Razorpay signature for verification")


class PaymentResponse(BaseModel):
    """Response containing payment details."""
    order_id: Optional[str] = None  # For create-order response
    razorpay_payment_id: Optional[str] = None  # For verify response
    amount: float
    currency: str = "INR"
    status: str  # pending | completed | failed
    created_at: datetime

    model_config = {"from_attributes": True}


class PaymentVerifyResponse(BaseModel):
    """Response after payment verification."""
    success: bool
    message: str
    subscription_plan: str = "pro"  # After successful verification

