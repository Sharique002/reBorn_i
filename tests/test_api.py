"""
reBorn_i — API Endpoint Tests

Integration-style tests exercising FastAPI routes using httpx AsyncClient.
Tests mock service-layer dependencies so no real DB/LLM calls are needed.
"""

import uuid
from datetime import datetime
from unittest.mock import AsyncMock, MagicMock, patch

import pytest
from httpx import ASGITransport, AsyncClient

from app.main import create_app


# ═══════════════════════════════════════════════════════════
# Fixtures
# ═══════════════════════════════════════════════════════════

@pytest.fixture
def app():
    """Create a test FastAPI application."""
    return create_app()


@pytest.fixture
async def client(app):
    """Async HTTP client that talks directly to the ASGI app."""
    transport = ASGITransport(app=app)
    async with AsyncClient(transport=transport, base_url="http://test") as ac:
        yield ac


MOCK_USER_ID = str(uuid.uuid4())


def _auth_override():
    """Return a mock user for protected endpoints."""
    from app.models.database import User

    user = MagicMock(spec=User)
    user.id = uuid.UUID(MOCK_USER_ID)
    user.email = "test@example.com"
    user.full_name = "Test User"
    return user


# ═══════════════════════════════════════════════════════════
# Health Check
# ═══════════════════════════════════════════════════════════

class TestHealthEndpoint:
    """Tests for GET /api/v1/health."""

    @pytest.mark.asyncio
    async def test_health_returns_200(self, client):
        resp = await client.get("/api/v1/health")
        assert resp.status_code == 200
        data = resp.json()
        assert data["status"] == "healthy"
        assert "version" in data
        assert "timestamp" in data


# ═══════════════════════════════════════════════════════════
# Authentication
# ═══════════════════════════════════════════════════════════

class TestAuthEndpoints:
    """Tests for /api/v1/auth/* endpoints."""

    @pytest.mark.asyncio
    async def test_register_missing_fields(self, client):
        resp = await client.post("/api/v1/auth/register", json={})
        assert resp.status_code == 422  # Validation error

    @pytest.mark.asyncio
    async def test_login_missing_fields(self, client):
        resp = await client.post("/api/v1/auth/login", json={})
        assert resp.status_code == 422

    @pytest.mark.asyncio
    @patch("app.api.routes.register_user", new_callable=AsyncMock)
    async def test_register_success(self, mock_register, client):
        mock_register.return_value = MagicMock(
            id=uuid.uuid4(),
            email="new@example.com",
            full_name="New User",
            is_active=True,
            auth_provider="local",
            avatar_url=None,
            created_at=datetime.utcnow(),
        )
        resp = await client.post(
            "/api/v1/auth/register",
            json={"email": "new@example.com", "password": "Str0ngP@ss!", "full_name": "New User"},
        )
        assert resp.status_code == 201
        assert resp.json()["email"] == "new@example.com"


# ═══════════════════════════════════════════════════════════
# Resume Upload – Validation Guards
# ═══════════════════════════════════════════════════════════

class TestResumeUploadValidation:
    """Tests for POST /api/v1/resume/upload validation checks."""

    @pytest.mark.asyncio
    async def test_upload_requires_auth(self, client):
        """Upload must return 401/403 without token."""
        resp = await client.post("/api/v1/resume/upload")
        assert resp.status_code in (401, 403)

    @pytest.mark.asyncio
    async def test_upload_rejects_non_pdf(self, app, client):
        """Non-PDF files should be rejected."""
        from app.api.auth import get_current_user
        app.dependency_overrides[get_current_user] = _auth_override

        resp = await client.post(
            "/api/v1/resume/upload",
            files={"file": ("test.txt", b"plain text", "text/plain")},
        )
        # Should be rejected at validation layer
        assert resp.status_code in (400, 415, 422)
        app.dependency_overrides.clear()


# ═══════════════════════════════════════════════════════════
# Protected Endpoints – Auth Guard
# ═══════════════════════════════════════════════════════════

class TestProtectedEndpoints:
    """Ensure protected endpoints require authentication."""

    @pytest.mark.asyncio
    async def test_rejection_analysis_requires_auth(self, client):
        resp = await client.post("/api/v1/analysis/rejection-risk", json={})
        assert resp.status_code in (401, 403)

    @pytest.mark.asyncio
    async def test_market_radar_requires_auth(self, client):
        resp = await client.get("/api/v1/market/radar")
        assert resp.status_code in (401, 403)

    @pytest.mark.asyncio
    async def test_simulation_requires_auth(self, client):
        resp = await client.post("/api/v1/simulation/simulate", json={})
        assert resp.status_code in (401, 403)

    @pytest.mark.asyncio
    async def test_blueprint_requires_auth(self, client):
        resp = await client.post("/api/v1/blueprint/generate", json={})
        assert resp.status_code in (401, 403)


# ═══════════════════════════════════════════════════════════
# Error Shape Consistency
# ═══════════════════════════════════════════════════════════

class TestErrorResponses:
    """Ensure error responses follow the standard JSON envelope."""

    @pytest.mark.asyncio
    async def test_404_returns_json(self, client):
        resp = await client.get("/api/v1/nonexistent")
        assert resp.status_code == 404
        data = resp.json()
        assert "detail" in data

    @pytest.mark.asyncio
    async def test_validation_error_has_detail(self, client):
        resp = await client.post("/api/v1/auth/register", json={"email": "bad"})
        assert resp.status_code == 422
        data = resp.json()
        assert "detail" in data
