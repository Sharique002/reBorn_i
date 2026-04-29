# reBorn_i

**Not a Resume Helper. From Rejection to Reinvention.**

reBorn_i is a production-ready AI career reinvention platform that transforms rejection into actionable intelligence. It combines deterministic scoring with an optional LLM explanation layer to deliver reproducible career analytics.

---
backend :- .\.venv\Scripts\python.exe -m uvicorn app.main:app --reload --port 8000
frontend :- cd frontend && npm run dev

**⚠️ IMPORTANT**: If you see "The given origin is not allowed" error:
- See [GOOGLE_OAUTH_QUICKFIX.md](GOOGLE_OAUTH_QUICKFIX.md) for 5-minute fix
- See [GOOGLE_OAUTH_TEST.md](GOOGLE_OAUTH_TEST.md) for diagnostic tests

---

1. [Architecture Overview](#architecture-overview)
2. [Core Modules](#core-modules)
3. [Rejection Risk Engine — Deep Dive](#rejection-risk-engine--deep-dive)
4. [Project Structure](#project-structure)
5. [Quick Start](#quick-start)
6. [Environment Variables](#environment-variables)
7. [API Documentation](#api-documentation)
8. [Testing](#testing)
9. [Docker Deployment](#docker-deployment)
10. [Design Principles](#design-principles)

---

## Architecture Overview

```
┌────────────────────────────────────────────────────────────────┐
│                        FastAPI  (async)                        │
│  /api/v1/auth  ·  /resume  ·  /analysis  ·  /market  ·  …      │
├────────────────────────────────────────────────────────────────┤
│                      Service Layer                             │
│  ┌──────────┐ ┌──────────┐ ┌──────────┐ ┌──────────┐ ┌──────┐  │
│  │ Resume   │ │Rejection │ │ Market   │ │ Career   │ │Blue- │  │
│  │Processor │ │  Engine  │ │  Radar   │ │Simulation│ │print │  │
│  │  (A)     │ │  (B)     │ │  (C)     │ │  (D)     │ │ (E)  │  │
│  └──────────┘ └──────────┘ └──────────┘ └──────────┘ └──────┘  │
├────────────────────────────────────────────────────────────────┤
│                     Shared Utilities                           │
│  embeddings · llm_client · security · logging · exceptions     │
├────────────────────────────────────────────────────────────────┤
│                     Data Layer                                 │
│  SQLAlchemy 2.0 (async) ──► PostgreSQL  │  Redis (cache)       │
└────────────────────────────────────────────────────────────────┘
```

**Key design decisions:**

- **Deterministic scoring** — all risk scores, demand indices, and match scores use embeddings + cosine similarity + weighted formulas. No randomness. The same inputs always produce the same outputs.
- **Domain-aware rejection engine** — auto-detects Tech vs Non-Tech domains and applies the corresponding scoring model (`TECH_MODEL` / `NON_TECH_MODEL`) with domain-specific sub-weights.
- **LLM as explanation layer only** — OpenAI (gpt-4o) is called *only* to generate human-readable explanations and action plans. LLM must **NOT** calculate the risk. LLM may only generate explanation **after** deterministic scoring. If the LLM is unavailable, the system falls back to template-based responses. Scores are never affected.
- **Copy-based simulation** — career simulation never mutates the original resume data. All modifications operate on copies.
- **Dual-strategy PDF extraction** — pdfplumber (primary) with PyPDF2 fallback for maximum extraction reliability.

---

## Core Modules

### Module A — Resume Processor (`app/services/resume_processor.py`)

- PDF text extraction (dual-strategy: pdfplumber + PyPDF2 fallback)
- Skill extraction via keyword matching against 100+ known skills
- Experience year detection and level estimation (intern → c-level)
- Section extraction (education, experience, skills, projects, certifications)
- Contact information extraction (email, phone, LinkedIn)

### Module B — Universal Rejection Risk Engine (`app/services/rejection_engine.py`)

- **Domain-aware** 5-layer deterministic risk scoring with auto domain detection
- Auto-detects **Tech** vs **Non-Tech** domain using:
  - Keyword cluster scoring (50%) — 80+ keywords per domain
  - Role title heuristics (30%) — 30+ known titles per domain
  - Skill list analysis (20%) — fraction of skills matching each domain
- Applies domain-specific scoring model (`TECH_MODEL` or `NON_TECH_MODEL`)
- **5 Risk Layers:** ATS Screening → Recruiter Evaluation → Market Competitiveness → Grammar → Formatting
- Each layer has domain-specific sub-scores with deterministic sub-weights (see [Deep Dive](#rejection-risk-engine--deep-dive))
- Risk classification: 0–30% Low, 30–50% Moderate, 50–70% High, 70–100% Critical
- Risk breakdown chart generation (matplotlib, base64-encoded PNG)
- LLM used **only** for post-scoring explanation — never for risk calculation
- Full backward compatibility with legacy 4-component callers

---

## Rejection Risk Engine — Deep Dive

### Domain Detection

The engine auto-classifies every resume+JD pair as **Tech** or **Non-Tech** before scoring:

```
Composite Score = 0.50 × keyword_cluster + 0.30 × title_heuristic + 0.20 × skill_analysis
```

If both scores are near zero, defaults to **Tech** with 50% confidence.

### Scoring Models

#### TECH_MODEL — Final Risk Formula

```
Final_Risk = (0.30 × ATS) + (0.30 × Recruiter) + (0.20 × Market) + (0.10 × Grammar) + (0.10 × Formatting)
```

#### NON_TECH_MODEL — Final Risk Formula

```
Final_Risk = (0.25 × ATS) + (0.35 × Recruiter) + (0.20 × Market) + (0.10 × Grammar) + (0.10 × Formatting)
```

### Layer Sub-Scores

#### Layer 1 — ATS Screening

| Sub-Score | Tech Weight | Non-Tech Weight |
|---|---|---                                |
| `technical_skill` / `keyword` | 0.45 | 0.35 |
| `framework_match` / `tool_match` | 0.25 | 0.25 |
| `keyword` / `achievement_density` | 0.15 | 0.20 |
| `exp` | 0.15 | 0.20 |

**Tech:** `ATS_Risk = 1 − (0.45 × technical_skill + 0.25 × framework_match + 0.15 × keyword + 0.15 × exp)`

**Non-Tech:** `ATS_Risk = 1 − (0.35 × keyword + 0.25 × tool_match + 0.20 × achievement_density + 0.20 × exp)`

#### Layer 2 — Recruiter Evaluation

| Sub-Score | Tech Weight | Non-Tech Weight |
|---|---|---|
| `embedding_similarity` | 0.40 | 0.35 |
| `impact` / `leadership` | 0.30 | 0.25 |
| `maturity` / `outcome` | 0.20 | 0.25 |
| `architecture_signal` / `clarity` | 0.10 | 0.15 |

**Tech:** `Recruiter_Risk = 1 − (0.40 × embedding_sim + 0.30 × impact + 0.20 × maturity + 0.10 × architecture_signal)`

**Non-Tech:** `Recruiter_Risk = 1 − (0.35 × embedding_sim + 0.25 × leadership + 0.25 × outcome + 0.15 × clarity)`

#### Layer 3 — Market Competitiveness

| Sub-Score | Tech Weight | Non-Tech Weight |
|---|---|---|
| `demand_alignment` | 0.50 | 0.40 |
| `competition_alignment` / `certification_alignment` | 0.30 | 0.30 |
| `stability` / `competition` | 0.20 | 0.30 |

**Tech:** `Market_Risk = 1 − (0.50 × demand_alignment + 0.30 × competition_alignment + 0.20 × stability)`

**Non-Tech:** `Market_Risk = 1 − (0.40 × demand_alignment + 0.30 × certification_alignment + 0.30 × competition)`

#### Layer 4 — Grammar (Universal)

```
Grammar_Risk = 0.50 × spelling + 0.30 × grammar + 0.20 × readability
```

#### Layer 5 — Formatting (Universal)

```
Formatting_Risk = 1 − (0.35 × structure + 0.25 × bullet + 0.20 × density + 0.20 × parse_stability)
```

### Risk Classification

| Range | Level |
|---|---|
| 0–30% | Low |
| 30–50% | Moderate |
| 50–70% | High |
| 70–100% | Critical |

### Output Fields

The engine returns: `final_risk_percent`, `risk_level`, `risk_breakdown` (per-layer), `component_scores` (with sub-score details), `domain_detected` (`"Tech"` / `"Non-Tech"`), `model_used` (`"TECH_MODEL"` / `"NON_TECH_MODEL"`), `domain_confidence`, `chart_base64`, `top_rejection_reasons`, `skill_gaps`, `why_risk_is_high`, `recommended_actions`, and `confidence_interval`.

### LLM Boundary

The LLM (`generate_rejection_explanation`) is invoked **only after** all deterministic scores are computed. It receives the pre-computed results and generates a human-readable narrative. If the LLM is unavailable, scores are still fully valid — only the explanation is missing.

---

### Module C — Market Radar (`app/services/market_radar.py`)

- Skill frequency analysis across job market dataset
- Demand index with growth trend weighting
- Future-proof scoring (cross-industry transferability)
- Module-level caching with configurable refresh interval
- Fallback to default market data if external source unavailable

### Module D — Career Simulation Engine (`app/services/career_simulation.py`)

- Before/after comparison via copy-based skill modification
- Reconstructs simulated resume text for embedding comparison
- Computes `risk_delta` = before.risk − after.risk
- Optional LLM narrative explanation
- **Guarantees original resume data is never mutated**

### Module E — Reinvention Blueprint Generator (`app/services/blueprint_generator.py`)

- LLM-powered 30-day and 90-day action plans
- Pydantic schema validation of LLM responses (`Blueprint30Response`, `Blueprint90Response`)
- Template-based fallback plan when LLM is unavailable
- Version-controlled prompt templates

---

## Project Structure

```
reBorn_i/
├── app/
│   ├── __init__.py              # Package init, version
│   ├── main.py                  # FastAPI app factory, lifecycle, exception handlers
│   ├── api/
│   │   ├── __init__.py
│   │   ├── auth.py              # JWT auth: register, login, token decode
│   │   └── routes.py            # All API endpoint definitions
│   ├── config/
│   │   ├── __init__.py
│   │   ├── settings.py          # Pydantic BaseSettings (env vars)
│   │   ├── scoring_weights.py   # Frozen dataclass scoring configs
│   │   └── prompt_templates.py  # Version-controlled LLM prompt templates
│   ├── models/
│   │   ├── __init__.py
│   │   └── database.py          # SQLAlchemy ORM models
│   ├── schemas/
│   │   ├── __init__.py
│   │   └── schemas.py           # Pydantic request/response schemas
│   ├── services/
│   │   ├── __init__.py
│   │   ├── resume_processor.py  # Module A
│   │   ├── rejection_engine.py  # Module B
│   │   ├── market_radar.py      # Module C
│   │   ├── career_simulation.py # Module D
│   │   └── blueprint_generator.py # Module E
│   └── utils/
│       ├── __init__.py
│       ├── database.py          # Async engine, session factory, init/close
│       ├── embeddings.py        # sentence-transformers + cosine similarity
│       ├── exceptions.py        # Full exception hierarchy
│       ├── llm_client.py        # OpenAI client with retry logic
│       ├── logging.py           # structlog config with PII sanitization
│       └── security.py          # Input sanitization, prompt injection detection
├── data/
│   └── job_market_dataset.json  # Sample market data (20 job listings)
├── docker/
│   ├── Dockerfile               # Multi-stage build (base → deps → app)
│   └── docker-compose.yml       # API + PostgreSQL 16 + Redis 7
├── tests/
│   ├── conftest.py              # Shared fixtures
│   ├── test_api.py              # API integration tests
│   ├── test_blueprint_generator.py
│   ├── test_career_simulation.py
│   ├── test_market_radar.py
│   ├── test_rejection_engine.py
│   ├── test_resume_processor.py
│   └── test_security.py
├── .env.example                 # Environment variable template
├── .gitignore
├── pyproject.toml               # Project metadata & tool config
├── requirements.txt             # Pinned dependencies
└── README.md                    # This file
```

---

## Quick Start

### Prerequisites

- Python 3.11+
- PostgreSQL 16+
- Redis 7+ (optional, for caching)
- An OpenAI API key (optional — system works without it via fallbacks)
- A Google OAuth Client ID (optional — for Google Sign-In feature, see [GOOGLE_OAUTH_SETUP.md](GOOGLE_OAUTH_SETUP.md))

### Local Development

```bash
# 1. Clone and enter the project
cd reBorn_i

# 2. Create and activate a virtual environment
python -m venv .venv
.venv\Scripts\activate        # Windows
# source .venv/bin/activate   # macOS/Linux

# 3. Install dependencies
pip install -r requirements.txt

# 4. Configure environment
cp .env.example .env
# Edit .env with your DATABASE_URL, JWT_SECRET_KEY, OPENAI_API_KEY, etc.
# For Google Sign-In: Set GOOGLE_CLIENT_ID (see GOOGLE_OAUTH_SETUP.md)

# 5. Start the backend
uvicorn app.main:app --reload --host 0.0.0.0 --port 8000

# 6. In a new terminal, start the frontend
cd frontend
npm install
npm run dev
```

The API will be available at `http://localhost:8000`. Interactive docs at `http://localhost:8000/docs`.

### Docker (Recommended for Production)

```bash
# Start all services (API + PostgreSQL + Redis)
docker compose -f docker/docker-compose.yml up --build -d

# View logs
docker compose -f docker/docker-compose.yml logs -f api

# Stop
docker compose -f docker/docker-compose.yml down
```

---

## Environment Variables

All configuration is loaded from environment variables (or a `.env` file). See [`.env.example`](.env.example) for the full template.

| Variable | Default | Description |
|---|---|---|
| `APP_NAME` | `reBorn_i` | Application name |
| `APP_VERSION` | `1.0.0` | Semantic version |
| `DEBUG` | `false` | Debug mode (exposes error details) |
| `LOG_LEVEL` | `INFO` | DEBUG, INFO, WARNING, ERROR, CRITICAL |
| `ENVIRONMENT` | `development` | development / staging / production |
| `API_HOST` | `0.0.0.0` | Bind address |
| `API_PORT` | `8000` | Bind port |
| `API_PREFIX` | `/api/v1` | Route prefix |
| `CORS_ORIGINS` | `*` | Comma-separated allowed origins |
| `DATABASE_URL` | `postgresql+asyncpg://...` | Async PostgreSQL DSN |
| `DB_POOL_SIZE` | `10` | Connection pool size |
| `DB_MAX_OVERFLOW` | `20` | Max overflow connections |
| `REDIS_URL` | `redis://localhost:6379/0` | Redis connection string |
| `JWT_SECRET_KEY` | — | **Required in production.** Min 16 chars. |
| `JWT_ALGORITHM` | `HS256` | JWT signing algorithm |
| `JWT_ACCESS_TOKEN_EXPIRE_MINUTES` | `60` | Token TTL in minutes |
| `GOOGLE_CLIENT_ID` | — | **Optional.** Google OAuth Client ID for Sign-In (see [GOOGLE_OAUTH_SETUP.md](GOOGLE_OAUTH_SETUP.md)) |
| `OPENAI_API_KEY` | — | OpenAI API key (optional for scoring) |
| `OPENAI_MODEL` | `gpt-4o` | LLM model name |
| `OPENAI_MAX_TOKENS` | `4096` | Max response tokens |
| `OPENAI_TEMPERATURE` | `0.3` | LLM temperature |
| `LLM_REQUEST_TIMEOUT` | `60` | LLM call timeout (seconds) |
| `LLM_MAX_RETRIES` | `3` | LLM retry attempts |
| `EMBEDDING_MODEL` | `all-MiniLM-L6-v2` | sentence-transformers model |
| `EMBEDDING_CACHE_TTL` | `3600` | Embedding cache TTL (seconds) |
| `MAX_FILE_SIZE_MB` | `10` | Max upload file size |
| `ALLOWED_FILE_TYPES` | `application/pdf` | Allowed MIME types |
| `WEIGHT_SKILL_MATCH` | `0.35` | Legacy rejection scoring weight |
| `WEIGHT_EXPERIENCE_ALIGNMENT` | `0.25` | Legacy rejection scoring weight |
| `WEIGHT_KEYWORD_DENSITY` | `0.20` | Legacy rejection scoring weight |
| `WEIGHT_EMBEDDING_SIMILARITY` | `0.20` | Legacy rejection scoring weight |

> **Note:** The domain-aware engine uses frozen dataclass weights in `scoring_weights.py` (Tech/Non-Tech models). The env vars above are retained for backward compatibility with legacy callers.
| `MARKET_DATA_PATH` | `data/job_market_dataset.json` | Path to market data file |
| `MARKET_REFRESH_INTERVAL_HOURS` | `24` | Market data cache refresh |

---

## API Documentation

All endpoints are prefixed with `/api/v1`. Interactive Swagger docs are available at `/docs` (disabled in production).

### Authentication

| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| POST | `/auth/register` | No | Create a user account |
| POST | `/auth/login` | No | Obtain a JWT access token |
| POST | `/auth/google` | No | Authenticate with Google OAuth (requires `GOOGLE_CLIENT_ID` configured) |
| GET | `/auth/me` | Yes | Get current user profile |

**Token usage:** Include the JWT in the `Authorization` header:
```
Authorization: Bearer <token>
```

### Resume

| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| POST | `/resume/upload` | Yes | Upload a PDF resume for processing |
| GET | `/resume/{resume_id}` | Yes | Retrieve processed resume data |

### Rejection Analysis

| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| POST | `/analysis/rejection-risk` | Yes | Compute rejection risk score for a resume against a job description |

**Request body:**
```json
{
  "resume_id": "uuid",
  "job_description": "string",
  "job_title": "string (optional)",
  "required_skills": ["string"] // optional
}
```

**Response includes:** `risk_score` (0.0–1.0), `risk_level`, `component_scores` (5 layers with sub-score details), `domain_detected` (`"Tech"` / `"Non-Tech"`), `model_used` (`"TECH_MODEL"` / `"NON_TECH_MODEL"`), `risk_breakdown`, `chart_base64`, `skill_gaps`, `top_rejection_reasons`, `why_risk_is_high`, `recommended_actions`, `confidence_interval`, optional `explanation`.

### Market Radar

| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| GET | `/market/radar` | Yes | Get current market intelligence snapshot |
| POST | `/market/radar/refresh` | Yes | Force market data refresh |

### Career Simulation

| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| POST | `/simulation/simulate` | Yes | Run a before/after career simulation |

**Request body:**
```json
{
  "resume_id": "uuid",
  "job_description": "string",
  "skills_to_add": ["string"],
  "skills_to_remove": ["string"] // optional
}
```

**Response includes:** `before_metrics`, `after_metrics`, `risk_delta`, `improvement_summary`.

### Blueprint

| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| POST | `/blueprint/generate` | Yes | Generate a 30-day or 90-day reinvention plan |
| GET | `/blueprint/{blueprint_id}` | Yes | Retrieve a saved blueprint |

**Request body:**
```json
{
  "resume_id": "uuid",
  "job_description": "string",
  "target_role": "string",
  "plan_type": "30_day | 90_day"
}
```

### System

| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| GET | `/health` | No | System health check |

---

## Testing

Tests use `pytest` with `pytest-asyncio` for async test support.

```bash
# Run all tests
pytest tests/ -v

# Run a specific test file
pytest tests/test_rejection_engine.py -v

# Run with coverage
pytest tests/ --cov=app --cov-report=term-missing
```

### Test Suite Overview

| File | Tests | Coverage Area |
|------|-------|--------------|
| `test_resume_processor.py` | 14 | PDF extraction, skill matching, text cleaning |
| `test_rejection_engine.py` | 60+ | Domain detection, Tech/Non-Tech sub-scores, weight validation, layer scoring, chart generation, backward compatibility |
| `test_market_radar.py` | 12 | Skill frequency, demand index, future-proof scoring |
| `test_career_simulation.py` | 9 | Skill modification, data immutability |
| `test_security.py` | 13 | Input sanitization, prompt injection detection |
| `test_blueprint_generator.py` | 8 | Schema validation, fallback plan generation |
| `test_api.py` | 10 | Health check, auth guards, error responses |

**Total: 120+ tests**

---

## Docker Deployment

### Services

| Service | Image | Port | Purpose |
|---------|-------|------|---------|
| `api` | Built from `Dockerfile` | 8000 | FastAPI application |
| `db` | `postgres:16-alpine` | 5432 | Primary database |
| `redis` | `redis:7-alpine` | 6379 | Caching layer |

### Dockerfile Highlights

- **Multi-stage build** (base → dependencies → application) for minimal image size
- Non-root user (`appuser`) for security
- Health check endpoint (`/api/v1/health`)
- Only production dependencies installed

### Production Checklist

1. Set `ENVIRONMENT=production` to disable Swagger docs
2. Generate a strong `JWT_SECRET_KEY`: `python -c "import secrets; print(secrets.token_urlsafe(64))"`
3. Set `DEBUG=false`
4. Provide a real `DATABASE_URL` pointing to a managed PostgreSQL instance
5. Set `CORS_ORIGINS` to your frontend domain(s)
6. Set `OPENAI_API_KEY` if you want LLM-powered explanations and blueprints
7. Set `GOOGLE_CLIENT_ID` for Google Sign-In (see [GOOGLE_OAUTH_SETUP.md](GOOGLE_OAUTH_SETUP.md))
8. Configure `LOG_LEVEL=WARNING` or `ERROR` for reduced verbosity

---

## Design Principles

### Determinism First

All scoring functions are pure — given the same resume, job description, and weights, they produce the same output every time. Domain detection itself is deterministic (keyword clusters + title heuristics + skill analysis — no LLM involvement). This is critical for:
- Reproducible career analytics
- A/B testing scoring weight configurations
- Auditability of rejection risk assessments
- Consistent domain classification across runs

### Graceful Degradation

The system operates at full fidelity without an LLM:
- Rejection risk scores work 100% without OpenAI
- Market analysis works 100% from local dataset
- Career simulation works 100% using embeddings only
- Blueprint generation falls back to curated templates

LLM integration adds *explanations* and *narrative plans*, but never affects scores.

### Security Posture

- **Prompt injection detection** — 11 regex patterns scan all user text inputs
- **Input sanitization** — HTML/script tag removal, length limits
- **PDF validation** — MIME type, file size, magic byte header verification
- **PII sanitization** — structured logs redact email, phone, and name fields
- **JWT authentication** — bcrypt password hashing, token expiry, per-request user resolution

### Data Immutability

Career simulation operates on copies of user data. The original resume, skills, and scores are never modified during what-if analysis. This is enforced at the service layer via explicit `copy()` / `list()` operations.

---

## License

Private / Internal use.
