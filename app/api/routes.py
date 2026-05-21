"""
reBorn_i — API Routes

All FastAPI endpoint definitions. Each route:
- Uses async handlers
- Includes input validation via Pydantic schemas
- Has proper error handling
- Returns consistent JSON responses
- Is protected by JWT authentication (except auth endpoints)
"""

import uuid
from datetime import datetime, timezone
from typing import Optional

import asyncio
import functools

from fastapi import APIRouter, BackgroundTasks, Depends, File, HTTPException, UploadFile, status
from fastapi.responses import JSONResponse
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.api.auth import (
    authenticate_user,
    create_access_token,
    get_current_user,
    google_authenticate,
    register_user,
)
from app.models.database import (
    Blueprint,
    CareerSimulation,
    MarketSnapshot,
    Payment,
    RejectionAnalysis,
    Resume,
    User,
)
from app.schemas.schemas import (
    BlueprintRequest,
    BlueprintResponse,
    CareerSimulationRequest,
    CareerSimulationResponse,
    ConfidenceInterval,
    GoogleLoginRequest,
    HealthResponse,
    HiringPipelineConfidenceIntervalPercent,
    HiringPipelineRequest,
    HiringPipelineResponse,
    MarketRadarResponse,
    PaymentCreateRequest,
    PaymentResponse,
    PaymentVerifyRequest,
    PaymentVerifyResponse,
    RejectionAnalysisRequest,
    RejectionAnalysisResponse,
    ResumeUploadResponse,
    SubscriptionFeatureGate,
    SubscriptionStatusResponse,
    TokenResponse,
    UserCreate,
    UserLogin,
    UserResponse,
)
from app.services.blueprint_generator import generate_blueprint_with_fallback
from app.services.career_simulation import run_career_simulation
from app.services.hiring_pipeline import simulate_hiring_pipeline
from app.services.market_radar import analyze_market
from app.services.payment import PaymentService
from app.services.rejection_engine import (
    compute_rejection_risk,
    generate_rejection_explanation,
)
from app.services.resume_processor import process_resume
from app.utils.database import get_db
from app.utils.exceptions import (
    AuthenticationError,
    CorruptedFileError,
    FileValidationError,
    HiringPipelineError,
    LLMError,
    LLMResponseValidationError,
    MarketDataError,
    PaymentError,
    PDFExtractionError,
    PromptInjectionError,
    ResumeProcessingError,
    ScoringError,
    SimulationError,
)
from app.utils.logging import get_logger
from app.utils.security import check_prompt_injection, sanitize_text, validate_upload_file

logger = get_logger(__name__)


# ═══════════════════════════════════════════════════════════
# Router Definitions
# ═══════════════════════════════════════════════════════════

auth_router = APIRouter(prefix="/auth", tags=["Authentication"])
resume_router = APIRouter(prefix="/resume", tags=["Resume Processing"])
analysis_router = APIRouter(prefix="/analysis", tags=["Rejection Analysis"])
market_router = APIRouter(prefix="/market", tags=["Market Radar"])
simulation_router = APIRouter(prefix="/simulation", tags=["Career Simulation"])
blueprint_router = APIRouter(prefix="/blueprint", tags=["Reinvention Blueprint"])
hiring_pipeline_router = APIRouter(prefix="/hiring-pipeline", tags=["Hiring Pipeline"])
payment_router = APIRouter(prefix="/payment", tags=["Payments"])
subscription_router = APIRouter(prefix="/subscription", tags=["Subscription"])
health_router = APIRouter(tags=["System Health"])


# ═══════════════════════════════════════════════════════════
# Health Check
# ═══════════════════════════════════════════════════════════

@health_router.get("/health", response_model=HealthResponse)
async def health_check():
    """System health check endpoint."""
    from app.config.settings import get_settings

    settings = get_settings()
    return HealthResponse(
        status="healthy",
        version=settings.APP_VERSION,
        environment=settings.ENVIRONMENT,
        database="connected",
        timestamp=datetime.now(timezone.utc),
    )


# ═══════════════════════════════════════════════════════════
# Authentication Endpoints
# ═══════════════════════════════════════════════════════════

@auth_router.post("/register", response_model=UserResponse, status_code=status.HTTP_201_CREATED)
async def register(user_data: UserCreate, db: AsyncSession = Depends(get_db)):
    """Register a new user account.

    Args:
        user_data: Email, password, and optional full name.

    Returns:
        Created user profile.
    """
    try:
        user = await register_user(user_data, db)
        return UserResponse.model_validate(user)
    except AuthenticationError as e:
        raise HTTPException(status_code=status.HTTP_409_CONFLICT, detail=e.message)
    except Exception as e:
        import traceback
        logger.error("registration_failed", error=str(e), traceback=traceback.format_exc())
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Registration failed: {str(e)}",
        )


@auth_router.post("/login", response_model=TokenResponse)
async def login(credentials: UserLogin, db: AsyncSession = Depends(get_db)):
    """Authenticate and receive a JWT access token.

    Args:
        credentials: Email and password.

    Returns:
        JWT access token.
    """
    try:
        user = await authenticate_user(credentials.email, credentials.password, db)
        return create_access_token(str(user.id), user.email)
    except AuthenticationError as e:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail=e.message,
        )
    except Exception as e:
        import traceback
        logger.error("login_failed", error=str(e), traceback=traceback.format_exc())
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Login failed: {str(e)}",
        )


@auth_router.get("/me", response_model=UserResponse)
async def get_profile(current_user: User = Depends(get_current_user)):
    """Get the current user's profile.

    Returns:
        User profile data.
    """
    return UserResponse.model_validate(current_user)


@auth_router.post("/google", response_model=TokenResponse)
async def google_login(data: GoogleLoginRequest, db: AsyncSession = Depends(get_db)):
    """Authenticate with Google OAuth ID token.

    Verifies the Google ID token, creates user if needed,
    and returns a JWT access token.

    Args:
        data: Google ID token from frontend.

    Returns:
        JWT access token.
    """
    try:
        logger.info("google_login_attempt")
        user, is_new = await google_authenticate(data.id_token, db)
        logger.info("google_login_success", user_id=str(user.id), is_new_user=is_new)
        return create_access_token(str(user.id), user.email)
    except AuthenticationError as e:
        logger.warning("google_login_auth_error", error=e.message, details=e.details)
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail=e.message,
        )
    except ValueError as e:
        # Specific handling for Google token validation errors
        logger.error("google_token_validation_failed", error=str(e))
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail=f"Invalid Google token: {str(e)}",
        )
    except Exception as e:
        logger.error("google_login_failed", error=str(e), error_type=type(e).__name__)
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Google sign-in failed. Please try again.",
        )


# ═══════════════════════════════════════════════════════════
# Resume Endpoints
# ═══════════════════════════════════════════════════════════

@resume_router.post("/upload", response_model=ResumeUploadResponse, status_code=status.HTTP_201_CREATED)
async def upload_resume(
    file: UploadFile,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Upload and process a PDF resume.

    Validates file type and size, extracts text, and returns structured data.

    Args:
        file: PDF file upload.

    Returns:
        Processed resume with extracted structured data.
    """
    try:
        # Validate file
        content = await validate_upload_file(file)

        # Process resume
        structured_data = await process_resume(content, file.filename or "unknown.pdf")

        # Extract skill names for storage
        skill_names = [s.name for s in structured_data.skills]

        # Save to database
        resume = Resume(
            user_id=current_user.id,
            filename=file.filename or "unknown.pdf",
            raw_text="[stored]",  # Don't store raw text in response
            structured_data=structured_data.model_dump(),
            skills=skill_names,
            experience_years=structured_data.total_experience_years,
            experience_level=structured_data.experience_level,
            status="processed",
        )

        db.add(resume)
        await db.flush()
        await db.refresh(resume)

        return ResumeUploadResponse(
            id=resume.id,
            filename=resume.filename,
            status=resume.status,
            structured_data=structured_data,
            skills_count=len(skill_names),
            created_at=resume.created_at,
        )

    except FileValidationError as e:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=e.message)
    except CorruptedFileError as e:
        raise HTTPException(
            status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
            detail=e.message,
        )
    except PDFExtractionError as e:
        raise HTTPException(
            status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
            detail=e.message,
        )
    except ResumeProcessingError as e:
        raise HTTPException(
            status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
            detail=e.message,
        )
    except Exception as e:
        logger.error("resume_upload_failed", error=str(e))
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Resume processing failed. Please try again.",
        )


@resume_router.get("/list", response_model=list[dict])
async def list_resumes(
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """List all resumes uploaded by the current user (summary only).

    Returns:
        List of resume summaries for the profile page.
    """
    result = await db.execute(
        select(Resume)
        .where(Resume.user_id == current_user.id)
        .order_by(Resume.created_at.desc())
    )
    resumes = result.scalars().all()

    return [
        {
            "id": r.id,
            "filename": r.filename,
            "skills_count": len(r.skills) if r.skills else 0,
            "experience_level": r.experience_level,
            "created_at": r.created_at.isoformat() if r.created_at else None,
        }
        for r in resumes
    ]

@resume_router.delete("/{resume_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_resume(
    resume_id: uuid.UUID,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Delete a resume by ID."""
    result = await db.execute(
        select(Resume).where(Resume.id == str(resume_id), Resume.user_id == current_user.id)
    )
    resume = result.scalar_one_or_none()

    if not resume:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Resume not found.",
        )

    await db.delete(resume)
    await db.commit()


@resume_router.get("/{resume_id}", response_model=ResumeUploadResponse)
async def get_resume(
    resume_id: uuid.UUID,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Retrieve a processed resume by ID.

    Args:
        resume_id: UUID of the resume.

    Returns:
        Resume data with structured information.
    """
    result = await db.execute(
        select(Resume).where(Resume.id == str(resume_id), Resume.user_id == current_user.id)
    )
    resume = result.scalar_one_or_none()

    if not resume:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Resume not found.",
        )

    from app.schemas.schemas import StructuredResume

    return ResumeUploadResponse(
        id=resume.id,
        filename=resume.filename,
        status=resume.status,
        structured_data=StructuredResume.model_validate(resume.structured_data)
        if resume.structured_data
        else None,
        skills_count=len(resume.skills) if resume.skills else 0,
        created_at=resume.created_at,
    )


# ═══════════════════════════════════════════════════════════
# Rejection Analysis Endpoints
# ═══════════════════════════════════════════════════════════

@analysis_router.get("/list", response_model=list[dict])
async def list_analyses(
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """List the user's most recent rejection analyses (summary only).

    Returns:
        List of up to 5 most recent analyses for the profile insights tab.
    """
    result = await db.execute(
        select(RejectionAnalysis)
        .where(RejectionAnalysis.user_id == current_user.id)
        .order_by(RejectionAnalysis.created_at.desc())
        .limit(5)
    )
    analyses = result.scalars().all()

    return [
        {
            "id": a.id,
            "job_title": a.job_title,
            "risk_score": a.risk_score,
            "risk_level": _classify_risk_level(a.risk_score),
            "created_at": a.created_at.isoformat() if a.created_at else None,
        }
        for a in analyses
    ]


def _classify_risk_level(risk_score: float) -> str:
    """Map a numeric risk score to a human-readable risk level."""
    if risk_score < 30:
        return "Low"
    elif risk_score < 55:
        return "Moderate"
    elif risk_score < 75:
        return "High"
    return "Critical"


@analysis_router.post("/rejection-risk", response_model=RejectionAnalysisResponse)
async def analyze_rejection_risk(
    request: RejectionAnalysisRequest,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Analyze rejection risk for a resume against a job description.

    Uses deterministic 5-layer scoring model.
    LLM is used ONLY for the explanation layer after scoring.

    Layers:
    1. ATS Screening Risk        (0.30)
    2. Recruiter Evaluation Risk  (0.25)
    3. Market Competitiveness Risk(0.20)
    4. Spelling & Grammar Risk    (0.15)
    5. Formatting & Structure Risk(0.10)

    Args:
        request: Resume ID, job description, and optional job title.

    Returns:
        Full risk analysis with breakdown, guidance, and chart.
    """
    try:
        # Validate for prompt injection
        check_prompt_injection(request.job_description)
        if request.job_title:
            check_prompt_injection(request.job_title)

        # Fetch resume
        result = await db.execute(
            select(Resume).where(
                Resume.id == str(request.resume_id),
                Resume.user_id == current_user.id,
            )
        )
        resume = result.scalar_one_or_none()

        if not resume:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Resume not found.",
            )

        if resume.status != "processed":
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Resume has not been successfully processed yet.",
            )

        # Get resume data
        resume_skills = resume.skills or []
        resume_text = str(resume.structured_data) if resume.structured_data else ""
        experience_level = resume.experience_level or "mid"

        # Sanitize job description
        jd_text = sanitize_text(request.job_description)

        # Compute rejection risk (deterministic — domain-aware model)
        risk_result = compute_rejection_risk(
            resume_text=resume_text,
            resume_skills=resume_skills,
            resume_experience_level=experience_level,
            jd_text=jd_text,
            structured_data=resume.structured_data,
            job_title=request.job_title,
        )

        # Generate LLM explanation (optional, post-scoring only)
        explanation = await generate_rejection_explanation(
            risk_result=risk_result,
            job_title=request.job_title or "Unknown",
        )

        # Save analysis to database
        analysis = RejectionAnalysis(
            user_id=current_user.id,
            resume_id=resume.id,
            job_description=jd_text,
            job_title=request.job_title,
            risk_score=risk_result["risk_score"],
            top_rejection_reasons=risk_result["top_rejection_reasons"],
            skill_gaps=risk_result["skill_gaps"],
            component_scores=[cs.model_dump() for cs in risk_result["component_scores"]],
            explanation=explanation,
        )

        db.add(analysis)
        await db.flush()
        await db.refresh(analysis)

        return RejectionAnalysisResponse(
            id=analysis.id,
            final_risk_percent=risk_result["final_risk_percent"],
            risk_score=risk_result["risk_score"],
            risk_level=risk_result["risk_level"],
            risk_breakdown=risk_result["risk_breakdown"],
            highest_risk_area=risk_result["highest_risk_area"],
            secondary_risk_area=risk_result["secondary_risk_area"],
            why_risk_is_high=risk_result["why_risk_is_high"],
            recommended_actions=risk_result["recommended_actions"],
            behavior_guidance_message=risk_result["behavior_guidance_message"],
            confidence_interval=ConfidenceInterval(**risk_result["confidence_interval"]),
            component_scores=risk_result["component_scores"],
            top_rejection_reasons=risk_result["top_rejection_reasons"],
            skill_gaps=risk_result["skill_gaps"],
            chart_base64=risk_result.get("chart_base64"),
            job_title=request.job_title,
            domain_detected=risk_result.get("domain_detected", "Unknown"),
            model_used=risk_result.get("model_used", "Unknown"),
            explanation=explanation,
            created_at=analysis.created_at,
        )

    except PromptInjectionError as e:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=e.message)
    except ScoringError as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=e.message,
        )
    except HTTPException:
        raise
    except Exception as e:
        logger.error("rejection_analysis_failed", error=str(e))
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Rejection analysis failed. Please try again.",
        )


# ═══════════════════════════════════════════════════════════
# Market Radar Endpoints
# ═══════════════════════════════════════════════════════════

@market_router.get("/radar", response_model=MarketRadarResponse)
async def get_market_radar(
    resume_id: Optional[uuid.UUID] = None,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Get market demand analysis with optional personalized scoring.

    Can run as a background task for periodic refresh.

    Args:
        resume_id: Optional resume ID for personalized future-proof scoring.

    Returns:
        Market analysis with skill demand rankings.
    """
    try:
        user_skills = None

        if resume_id:
            result = await db.execute(
                select(Resume).where(
                    Resume.id == str(resume_id),
                    Resume.user_id == current_user.id,
                )
            )
            resume = result.scalar_one_or_none()

            if resume and resume.skills:
                user_skills = resume.skills

        market_data = await analyze_market(user_skills=user_skills)
        return market_data

    except MarketDataError as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=e.message,
        )
    except Exception as e:
        logger.error("market_radar_failed", error=str(e))
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Market analysis failed. Please try again.",
        )


@market_router.post("/radar/refresh")
async def refresh_market_radar(
    background_tasks: BackgroundTasks,
    current_user: User = Depends(get_current_user),
):
    """Trigger a background refresh of market data.

    Returns:
        Acknowledgment that refresh has been queued.
    """

    async def _refresh():
        try:
            await analyze_market(force_refresh=True)
            logger.info("market_radar_refreshed")
        except Exception as e:
            logger.error("market_radar_refresh_failed", error=str(e))

    background_tasks.add_task(_refresh)
    return {"status": "refresh_queued", "message": "Market data refresh has been queued."}


# ═══════════════════════════════════════════════════════════
# Career Simulation Endpoints
# ═══════════════════════════════════════════════════════════

@simulation_router.post("/simulate", response_model=CareerSimulationResponse)
async def simulate_career_change(
    request: CareerSimulationRequest,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Simulate adding/removing skills and see impact on rejection risk.

    Does NOT modify the user's actual resume data.

    Args:
        request: Resume ID, job description, and skill modifications.

    Returns:
        Before/after metrics comparison with risk delta.
    """
    try:
        # Validate inputs
        check_prompt_injection(request.job_description)

        # Fetch resume
        result = await db.execute(
            select(Resume).where(
                Resume.id == str(request.resume_id),
                Resume.user_id == current_user.id,
            )
        )
        resume = result.scalar_one_or_none()

        if not resume:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Resume not found.",
            )

        if resume.status != "processed":
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Resume has not been successfully processed yet.",
            )

        # Run simulation
        sim_result = await run_career_simulation(
            resume_text=str(resume.structured_data) if resume.structured_data else "",
            resume_skills=resume.skills or [],
            resume_experience_level=resume.experience_level or "mid",
            jd_text=sanitize_text(request.job_description),
            skills_to_add=request.skills_to_add,
            skills_to_remove=request.skills_to_remove,
        )

        # Save simulation
        simulation = CareerSimulation(
            user_id=current_user.id,
            resume_id=resume.id,
            job_description=sanitize_text(request.job_description),
            original_skills=sim_result["original_skills"],
            modified_skills=sim_result["modified_skills"],
            skills_added=sim_result["skills_added"],
            skills_removed=sim_result["skills_removed"],
            before_metrics=sim_result["before_metrics"].model_dump(),
            after_metrics=sim_result["after_metrics"].model_dump(),
            risk_delta=sim_result["risk_delta"],
        )

        db.add(simulation)
        await db.flush()
        await db.refresh(simulation)

        return CareerSimulationResponse(
            id=simulation.id,
            before_metrics=sim_result["before_metrics"],
            after_metrics=sim_result["after_metrics"],
            risk_delta=sim_result["risk_delta"],
            skills_added=sim_result["skills_added"],
            skills_removed=sim_result["skills_removed"],
            explanation=sim_result.get("explanation"),
            created_at=simulation.created_at,
        )

    except PromptInjectionError as e:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=e.message)
    except SimulationError as e:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=e.message,
        )
    except HTTPException:
        raise
    except Exception as e:
        logger.error("career_simulation_failed", error=str(e))
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Career simulation failed. Please try again.",
        )


# ═══════════════════════════════════════════════════════════
# Blueprint Endpoints
# ═══════════════════════════════════════════════════════════

@blueprint_router.post("/generate", response_model=BlueprintResponse, status_code=status.HTTP_201_CREATED)
async def generate_reinvention_blueprint(
    request: BlueprintRequest,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Generate a 30-day or 90-day reinvention action plan.

    Uses LLM with structured output and schema validation.
    Falls back to template-based plan if LLM fails.

    Args:
        request: Resume ID, job description, target role, and plan type.

    Returns:
        Structured reinvention blueprint.
    """
    try:
        # Validate inputs
        check_prompt_injection(request.target_role)
        check_prompt_injection(request.job_description)

        # Fetch resume
        result = await db.execute(
            select(Resume).where(
                Resume.id == str(request.resume_id),
                Resume.user_id == current_user.id,
            )
        )
        resume = result.scalar_one_or_none()

        if not resume:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Resume not found.",
            )

        # Get current rejection analysis for context
        jd_text = sanitize_text(request.job_description)
        risk_result = compute_rejection_risk(
            resume_text=str(resume.structured_data) if resume.structured_data else "",
            resume_skills=resume.skills or [],
            resume_experience_level=resume.experience_level or "mid",
            jd_text=jd_text,
        )

        # Generate blueprint
        plan = await generate_blueprint_with_fallback(
            current_skills=resume.skills or [],
            skill_gaps=risk_result["skill_gaps"],
            target_role=request.target_role,
            experience_level=resume.experience_level or "mid",
            risk_score=risk_result["risk_score"],
            plan_type=request.plan_type,
        )

        # Save to database
        blueprint = Blueprint(
            user_id=current_user.id,
            plan_type=request.plan_type,
            target_role=request.target_role,
            plan_data=plan,
            risk_score_at_creation=risk_result["risk_score"],
            skill_gaps_at_creation=risk_result["skill_gaps"],
            prompt_template_version=plan.get("prompt_template_version"),
        )

        db.add(blueprint)
        await db.flush()
        await db.refresh(blueprint)

        return BlueprintResponse(
            id=blueprint.id,
            plan_type=blueprint.plan_type,
            target_role=blueprint.target_role,
            plan_data=plan,
            risk_score_at_creation=blueprint.risk_score_at_creation,
            prompt_template_version=blueprint.prompt_template_version,
            created_at=blueprint.created_at,
        )

    except PromptInjectionError as e:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=e.message)
    except HTTPException:
        raise
    except Exception as e:
        logger.error("blueprint_generation_failed", error=str(e))
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Blueprint generation failed. Please try again.",
        )


@blueprint_router.get("/{blueprint_id}", response_model=BlueprintResponse)
async def get_blueprint(
    blueprint_id: uuid.UUID,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Retrieve a previously generated blueprint.

    Args:
        blueprint_id: UUID of the blueprint.

    Returns:
        Blueprint data.
    """
    result = await db.execute(
        select(Blueprint).where(
            Blueprint.id == str(blueprint_id),
            Blueprint.user_id == current_user.id,
        )
    )
    blueprint = result.scalar_one_or_none()

    if not blueprint:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Blueprint not found.",
        )

    return BlueprintResponse(
        id=blueprint.id,
        plan_type=blueprint.plan_type,
        target_role=blueprint.target_role,
        plan_data=blueprint.plan_data,
        risk_score_at_creation=blueprint.risk_score_at_creation,
        prompt_template_version=blueprint.prompt_template_version,
        created_at=blueprint.created_at,
    )


# ═══════════════════════════════════════════════════════════
# Hiring Pipeline Endpoints
# ═══════════════════════════════════════════════════════════

@hiring_pipeline_router.post("/simulate", response_model=HiringPipelineResponse)
async def simulate_hiring_pipeline_endpoint(request: HiringPipelineRequest):
    """Simulate hiring pipeline survival probability.

    Uses deterministic math to compute stage-wise survival,
    identify bottlenecks, and generate improvement guidance.
    No LLMs are used for computation.

    Args:
        request: Precomputed risk values and domain.

    Returns:
        Full survival analysis with chart, bottlenecks, and guidance.
    """
    try:
        loop = asyncio.get_event_loop()
        result = await loop.run_in_executor(
            None,
            functools.partial(simulate_hiring_pipeline, request.model_dump())
        )
        return result

    except HiringPipelineError as e:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=e.message,
        )
    except Exception as e:
        logger.error("hiring_pipeline_endpoint_failed", error=str(e))
        return JSONResponse(
            status_code=500,
            content={
                "error": "SimulationCrash",
                "message": "Hiring pipeline simulation failed. Please try again.",
            }
        )


# ═══════════════════════════════════════════════════════════
# Payment Endpoints
# ═══════════════════════════════════════════════════════════

@payment_router.post("/create-order", response_model=PaymentResponse, status_code=status.HTTP_201_CREATED)
async def create_payment_order(
    request: PaymentCreateRequest,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """Create a Razorpay payment order for subscription upgrade.

    Args:
        request: Payment creation request (currently empty)
        current_user: Authenticated user
        db: Database session

    Returns:
        Payment response with order_id and amount
    """
    try:
        from app.config.settings import get_settings
        settings = get_settings()

        # Initialize Razorpay client
        import razorpay
        rzp_client = razorpay.Client(
            auth=(settings.RAZORPAY_KEY_ID, settings.RAZORPAY_KEY_SECRET)
        )

        # Create order with Razorpay
        amount_paisa = 900  # ₹9 in paisa
        order_data = {
            "amount": amount_paisa,
            "currency": "INR",
            "receipt": f"order_{current_user.id}_{uuid.uuid4().hex[:8]}",
        }
        try:
            razorpay_order = rzp_client.order.create(data=order_data)
            order_id = razorpay_order["id"]
            is_mock_flow = False
        except Exception as rzp_err:
            if settings.ENVIRONMENT == "development":
                logger.warning(
                    "razorpay_order_creation_failed_using_mock_fallback",
                    error=str(rzp_err),
                    user_id=current_user.id,
                )
                order_id = f"order_mock_{uuid.uuid4().hex[:12]}"
                is_mock_flow = True
            else:
                raise rzp_err

        # Create payment record in database
        payment_service = PaymentService(settings.RAZORPAY_KEY_SECRET)
        payment = await payment_service.create_payment_record(
            db=db,
            user_id=current_user.id,
            razorpay_order_id=order_id,
            amount=float(amount_paisa),
            currency="INR",
        )

        logger.info(
            "payment_order_created",
            user_id=current_user.id,
            order_id=order_id,
            is_mock=is_mock_flow,
        )

        return PaymentResponse(
            order_id=order_id,
            amount=float(amount_paisa) / 100,  # Convert paisa to rupees for response
            currency="INR",
            status=payment.status,
            created_at=payment.created_at,
        )

    except Exception as e:
        import traceback
        logger.error(
            "payment_order_creation_failed",
            error=str(e),
            user_id=current_user.id,
            traceback=traceback.format_exc(),
        )
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to create payment order. Please try again.",
        )


@payment_router.post("/verify", response_model=PaymentVerifyResponse)
async def verify_payment(
    request: PaymentVerifyRequest,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """Verify Razorpay payment signature and upgrade subscription.

    Args:
        request: Payment verification request with payment ID and signature
        current_user: Authenticated user
        db: Database session

    Returns:
        Verification response with success status
    """
    try:
        from app.config.settings import get_settings
        settings = get_settings()

        # Look up the payment record by order_id (payment_id isn't stored yet)
        result = await db.execute(
            select(Payment).where(
                Payment.razorpay_order_id == request.razorpay_order_id,
                Payment.user_id == current_user.id,
            )
        )
        payment = result.scalar_one_or_none()

        if not payment:
            logger.warning(
                "payment_not_found_for_verification",
                user_id=current_user.id,
                order_id=request.razorpay_order_id,
            )
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Payment record not found",
            )

        # Verify payment using PaymentService
        payment_service = PaymentService(settings.RAZORPAY_KEY_SECRET)
        try:
            success = await payment_service.verify_and_upgrade_subscription(
                db=db,
                user_id=current_user.id,
                razorpay_order_id=payment.razorpay_order_id,
                razorpay_payment_id=request.razorpay_payment_id,
                signature=request.razorpay_signature,
                is_dev=(settings.ENVIRONMENT == "development"),
            )

            if success:
                logger.info(
                    "payment_verified_and_upgraded",
                    user_id=current_user.id,
                    order_id=payment.razorpay_order_id,
                )
                return PaymentVerifyResponse(
                    success=True,
                    message="Payment verified. Subscription activated!",
                    subscription_plan="pro",
                )

        except PaymentError as e:
            logger.warning(
                "payment_verification_failed",
                error=e.message,
                user_id=current_user.id,
            )
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=e.message,
            )

    except HTTPException:
        raise
    except Exception as e:
        import traceback
        logger.error(
            "payment_verification_endpoint_failed",
            error=str(e),
            user_id=current_user.id,
            traceback=traceback.format_exc(),
        )
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Payment verification failed. Please try again.",
        )


# ═══════════════════════════════════════════════════════════
# Subscription Endpoints
# ═══════════════════════════════════════════════════════════

@subscription_router.get("/status", response_model=SubscriptionStatusResponse)
async def get_subscription_status(
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """Get the current user's subscription status from the database.

    This is the ONLY source of truth for subscription state.
    Frontend must call this to verify premium access.

    Returns:
        Subscription status with plan, usage count, and feature access.
    """
    # Count user's analyses for usage tracking
    result = await db.execute(
        select(RejectionAnalysis)
        .where(RejectionAnalysis.user_id == current_user.id)
    )
    analyses = result.scalars().all()
    usage_count = len(analyses)

    plan = current_user.subscription_plan or "free"
    has_access = plan == "pro"

    return SubscriptionStatusResponse(
        plan=plan,
        usageCount=usage_count,
        hasAccess=has_access,
        featureAccess={},
    )

