"""
reBorn_i — JWT Authentication & Authorization

Handles:
- Password hashing with bcrypt
- JWT token creation and validation
- FastAPI dependency for protected endpoints
- User registration and login logic
- Google OAuth ID token verification
"""

from datetime import datetime, timedelta, timezone
from typing import Optional
from uuid import UUID

from fastapi import Depends, HTTPException, status
from fastapi.security import HTTPAuthorizationCredentials, HTTPBearer
from google.auth.transport import requests as google_requests
from google.oauth2 import id_token as google_id_token
from jose import JWTError, jwt
from passlib.context import CryptContext
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.config.settings import get_settings
from app.models.database import User
from app.schemas.schemas import TokenResponse, UserCreate, UserResponse
from app.utils.database import get_db
from app.utils.exceptions import AuthenticationError, AuthorizationError
from app.utils.logging import get_logger

logger = get_logger(__name__)

# ── Password hashing ────────────────────────────────────────
pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")

# ── Bearer token scheme ─────────────────────────────────────
security = HTTPBearer()


def hash_password(password: str) -> str:
    """Hash a password using bcrypt.

    Args:
        password: Plain text password.

    Returns:
        Hashed password string.
    """
    return pwd_context.hash(password)


def verify_password(plain_password: str, hashed_password: str) -> bool:
    """Verify a plain password against a hash.

    Args:
        plain_password: Plain text password.
        hashed_password: Stored hash.

    Returns:
        True if password matches.
    """
    return pwd_context.verify(plain_password, hashed_password)


def create_access_token(user_id: str, email: str) -> TokenResponse:
    """Create a JWT access token.

    Args:
        user_id: User's UUID as string.
        email: User's email address.

    Returns:
        TokenResponse with access_token and metadata.
    """
    settings = get_settings()
    expire = datetime.now(timezone.utc) + timedelta(minutes=settings.JWT_ACCESS_TOKEN_EXPIRE_MINUTES)

    payload = {
        "sub": user_id,
        "email": email,
        "exp": expire,
        "iat": datetime.now(timezone.utc),
        "type": "access",
    }

    token = jwt.encode(payload, settings.JWT_SECRET_KEY, algorithm=settings.JWT_ALGORITHM)

    return TokenResponse(
        access_token=token,
        token_type="bearer",
        expires_in=settings.JWT_ACCESS_TOKEN_EXPIRE_MINUTES * 60,
    )


def decode_access_token(token: str) -> dict:
    """Decode and validate a JWT token.

    Args:
        token: JWT token string.

    Returns:
        Dictionary with token claims.

    Raises:
        AuthenticationError: If token is invalid or expired.
    """
    settings = get_settings()
    try:
        payload = jwt.decode(
            token,
            settings.JWT_SECRET_KEY,
            algorithms=[settings.JWT_ALGORITHM],
        )
        if payload.get("type") != "access":
            raise AuthenticationError(message="Invalid token type.")
        return payload
    except JWTError as e:
        raise AuthenticationError(
            message="Invalid or expired authentication token.",
            details={"error": str(e)},
        )


async def get_current_user(
    credentials: HTTPAuthorizationCredentials = Depends(security),
    db: AsyncSession = Depends(get_db),
) -> User:
    """FastAPI dependency: extract and validate current user from JWT.

    Args:
        credentials: Bearer token from request header.
        db: Database session.

    Returns:
        User database model instance.

    Raises:
        HTTPException: If authentication fails.
    """
    try:
        payload = decode_access_token(credentials.credentials)
        user_id = payload.get("sub")
        if not user_id:
            raise AuthenticationError(message="Token payload missing user ID.")

        result = await db.execute(select(User).where(User.id == user_id))
        user = result.scalar_one_or_none()

        if not user:
            raise AuthenticationError(message="User not found.")

        if not user.is_active:
            raise AuthorizationError(message="User account is deactivated.")

        return user

    except (AuthenticationError, AuthorizationError) as e:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail=e.message,
            headers={"WWW-Authenticate": "Bearer"},
        )
    except Exception as e:
        logger.error("auth_error", error=str(e))
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Authentication failed.",
            headers={"WWW-Authenticate": "Bearer"},
        )


async def register_user(user_data: UserCreate, db: AsyncSession) -> User:
    """Register a new user.

    Args:
        user_data: Validated user registration data.
        db: Database session.

    Returns:
        Created User model instance.

    Raises:
        AuthenticationError: If email already exists.
    """
    # Check for existing user
    result = await db.execute(select(User).where(User.email == user_data.email))
    existing = result.scalar_one_or_none()

    if existing:
        raise AuthenticationError(
            message="An account with this email already exists.",
            details={"email": user_data.email},
        )

    user = User(
        email=user_data.email,
        hashed_password=hash_password(user_data.password),
        full_name=user_data.full_name,
    )

    db.add(user)
    await db.flush()
    await db.refresh(user)
    await db.commit()

    logger.info("user_registered", user_id=str(user.id))
    return user


async def authenticate_user(email: str, password: str, db: AsyncSession) -> User:
    """Authenticate a user by email and password.

    Args:
        email: User's email.
        password: Plain text password.
        db: Database session.

    Returns:
        Authenticated User model instance.

    Raises:
        AuthenticationError: If credentials are invalid.
    """
    result = await db.execute(select(User).where(User.email == email))
    user = result.scalar_one_or_none()

    if not user or not user.hashed_password or not verify_password(password, user.hashed_password):
        raise AuthenticationError(
            message="Invalid email or password.",
        )

    if not user.is_active:
        raise AuthenticationError(
            message="User account is deactivated.",
        )

    logger.info("user_authenticated", user_id=str(user.id))
    return user


async def google_authenticate(id_token: str, db: AsyncSession) -> tuple[User, bool]:
    """Verify Google ID token and return or create user.

    Args:
        id_token: Google ID token from frontend.
        db: Database session.

    Returns:
        Tuple of (User, is_new_user).

    Raises:
        AuthenticationError: If token is invalid.
    """
    settings = get_settings()

    if not settings.GOOGLE_CLIENT_ID:
        raise AuthenticationError(
            message="Google sign-in is not configured on this server.",
        )

    try:
        logger.info("verifying_google_token", client_id_prefix=settings.GOOGLE_CLIENT_ID[:20])
        idinfo = google_id_token.verify_oauth2_token(
            id_token,
            google_requests.Request(),
            settings.GOOGLE_CLIENT_ID,
            clock_skew_in_seconds=30,
        )
        logger.info("google_token_verified", sub=idinfo.get("sub", "unknown")[:8])
    except ValueError as e:
        error_msg = str(e)
        logger.error("google_token_verification_failed", error=error_msg)
        
        # Provide more specific error messages
        if "Token used too early" in error_msg or "Token used too late" in error_msg:
            raise AuthenticationError(
                message="Google token expired or used at wrong time.",
                details={"error": "token_timing_error"},
            )
        elif "Invalid value" in error_msg or "Wrong number of segments" in error_msg:
            raise AuthenticationError(
                message="Invalid Google ID token format.",
                details={"error": "malformed_token"},
            )
        elif "Client ID does not match" in error_msg:
            raise AuthenticationError(
                message="Google Client ID mismatch. Please contact support.",
                details={"error": "client_id_mismatch"},
            )
        else:
            raise AuthenticationError(
                message=f"Google token verification failed: {error_msg}",
                details={"error": str(e)},
            )
    except Exception as e:
        logger.error("google_verification_exception", error=str(e), error_type=type(e).__name__)
        raise AuthenticationError(
            message="Failed to verify Google token. Please try again.",
            details={"error": str(e)},
        )

    google_id = idinfo["sub"]
    email = idinfo.get("email")
    full_name = idinfo.get("name")
    avatar_url = idinfo.get("picture")

    if not email:
        raise AuthenticationError(message="Google account has no associated email.")

    # Check if user exists by google_id or email
    result = await db.execute(
        select(User).where((User.google_id == google_id) | (User.email == email))
    )
    user = result.scalar_one_or_none()
    is_new = False

    if user:
        # Link Google if existing email user hasn't linked yet
        if not user.google_id:
            user.google_id = google_id
            user.auth_provider = "google"
        if avatar_url and not user.avatar_url:
            user.avatar_url = avatar_url
        if full_name and not user.full_name:
            user.full_name = full_name
        await db.flush()
        await db.refresh(user)
        await db.commit()
    else:
        # Create new user
        user = User(
            email=email,
            full_name=full_name,
            google_id=google_id,
            auth_provider="google",
            avatar_url=avatar_url,
            hashed_password=None,
        )
        db.add(user)
        await db.flush()
        await db.refresh(user)
        await db.commit()
        is_new = True
        logger.info("user_registered_google", user_id=str(user.id))

    logger.info("user_authenticated_google", user_id=str(user.id))
    return user, is_new
