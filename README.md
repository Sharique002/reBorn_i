# reBorn_i

**Not a Resume Helper. From Rejection to Reinvention.**

---

## What is reBorn_i?

reBorn_i is a **production-ready AI career reinvention platform** that transforms rejection into actionable intelligence. It combines **deterministic scoring** with an optional **LLM explanation layer** to deliver reproducible career analytics.

Upload your resume, paste a job description, and get:

- **5-Layer Rejection Risk Score** — deterministic, domain-aware (Tech vs Non-Tech)
- **Hiring Pipeline Survival Probability** — sequential elimination model
- **Market Intelligence** — real-time skill demand analysis
- **Career Simulation** — "what-if" skill modification impact
- **Reinvention Blueprints** — 30/90-day action plans
- **Interview Readiness** — preparation guidance
- **Application Tracking** — job application management

> **Key principle:** Scores are 100% deterministic. LLM is used *only* for human-readable explanations — never for computation. If the LLM is unavailable, scores remain fully valid.

---

## Table of Contents

1. [Architecture Overview](#architecture-overview)
2. [Tech Stack](#tech-stack)
3. [Core Modules](#core-modules)
4. [Rejection Risk Engine — Deep Dive](#rejection-risk-engine--deep-dive)
5. [Project Structure](#project-structure)
6. [Quick Start](#quick-start)
7. [Environment Variables](#environment-variables)
8. [API Documentation](#api-documentation)
9. [Frontend Pages](#frontend-pages)
10. [Deployment](#deployment)
11. [Security](#security)
12. [Design Principles](#design-principles)
13. [License](#license)

---

## Architecture Overview

```
┌─────────────────────────────────────────────────────────────────────┐
│                     Frontend (React + TypeScript)                    │
│  Vite · TailwindCSS · Framer Motion · Recharts · React Router       │
│  Deployed on: Vercel (https://re-born-i.vercel.app)                 │
├─────────────────────────────────────────────────────────────────────┤
│                     API Gateway (FastAPI async)                      │
│  /auth · /resume · /analysis · /market · /simulation · /blueprint   │
│  /hiring-pipeline · /payment · /health                              │
│  Deployed on: Render (https://reborni-backend.onrender.com)         │
├─────────────────────────────────────────────────────────────────────┤
│                        Service Layer                                │
│  ┌──────────┐ ┌──────────┐ ┌──────────┐ ┌──────────┐ ┌──────────┐  │
│  │ Resume   │ │Rejection │ │ Market   │ │ Career   │ │Blueprint │  │
│  │Processor │ │ Engine   │ │ Radar    │ │Simulation│ │Generator │  │
│  └──────────┘ └──────────┘ └──────────┘ └──────────┘ └──────────┘  │
│  ┌──────────┐ ┌──────────┐                                         │
│  │ Hiring   │ │ Payment  │                                         │
│  │ Pipeline │ │ Service  │                                         │
│  └──────────┘ └──────────┘                                         │
├─────────────────────────────────────────────────────────────────────┤
│                      Shared Utilities                               │
│  embeddings · llm_client · security · logging · exceptions          │
├─────────────────────────────────────────────────────────────────────┤
│                       Data Layer                                    │
│  SQLAlchemy 2.0 (async) → PostgreSQL (prod) / SQLite (dev)          │
│  OpenAI Embeddings API (with keyword-based fallback)                │
└─────────────────────────────────────────────────────────────────────┘
```

---

## Tech Stack

### Backend
| Technology | Purpose |
|---|---|
| **FastAPI** | Async web framework with auto-generated OpenAPI docs |
| **SQLAlchemy 2.0** | Async ORM with `Mapped` type annotations |
| **PostgreSQL / SQLite** | Production (asyncpg) / Development (aiosqlite) |
| **Pydantic v2** | Request/response validation and settings management |
| **OpenAI API** | Embeddings (text-embedding-3-small) + LLM explanations (gpt-4o) |
| **structlog** | Structured JSON logging with PII sanitization |
| **python-jose** | JWT token creation and validation |
| **passlib + bcrypt** | Password hashing |
| **google-auth** | Google OAuth ID token verification |
| **tenacity** | Retry logic with exponential backoff |
| **pdfplumber + PyPDF2** | Dual-strategy PDF text extraction |
| **Razorpay** | Payment processing for subscription upgrades |

### Frontend
| Technology | Purpose |
|---|---|
| **React 18** | UI framework with hooks |
| **TypeScript** | Type-safe development |
| **Vite** | Build tool and dev server |
| **TailwindCSS** | Utility-first styling |
| **Framer Motion** | Animations and transitions |
| **Recharts** | Data visualization charts |
| **React Router v7** | Client-side routing |
| **Axios** | HTTP client with interceptors |
| **Zustand** | Lightweight state management |
| **Lucide React** | Icon library |

### Infrastructure
| Service | Purpose |
|---|---|
| **Vercel** | Frontend hosting with SPA routing |
| **Render** | Backend hosting with managed PostgreSQL |
| **Google Cloud Console** | OAuth 2.0 credentials |

---

## Core Modules

### Module A — Resume Processor (`app/services/resume_processor.py`)
- Dual-strategy PDF extraction (pdfplumber primary, PyPDF2 fallback)
- Skill extraction via keyword matching against 100+ known skills
- Experience year detection and level estimation (intern → c-level)
- Section extraction (education, experience, skills, projects, certifications)
- Contact information extraction (email, phone, LinkedIn)

### Module B — Universal Rejection Risk Engine (`app/services/rejection_engine.py`)
- **Domain-aware** 5-layer deterministic risk scoring
- Auto-detects **Tech** vs **Non-Tech** domain using keyword clusters (50%), role title heuristics (30%), skill analysis (20%)
- Applies domain-specific scoring model (`TECH_MODEL` or `NON_TECH_MODEL`)
- **5 Risk Layers:** ATS → Recruiter → Market → Grammar → Formatting
- Risk classification: 0–30% Low, 30–50% Moderate, 50–70% High, 70–100% Critical
- LLM used **only** for post-scoring explanation

### Module C — Market Radar (`app/services/market_radar.py`)
- Skill frequency analysis across job market dataset (20 listings)
- Demand index with growth trend weighting
- Future-proof scoring (cross-industry transferability)
- Module-level caching with configurable refresh interval

### Module D — Career Simulation (`app/services/career_simulation.py`)
- Before/after comparison via copy-based skill modification
- Computes `risk_delta` = before.risk − after.risk
- **Guarantees original resume data is never mutated**

### Module E — Blueprint Generator (`app/services/blueprint_generator.py`)
- LLM-powered 30-day and 90-day action plans
- Pydantic schema validation of LLM responses
- Template-based fallback when LLM is unavailable

### Module F — Hiring Pipeline Simulator (`app/services/hiring_pipeline.py`)
- Sequential stage-wise survival probability (ATS → Recruiter → Market → Interview)
- Multiplicative compounding model
- Bottleneck detection with stage-specific diagnosis
- Behavioral guidance tiers based on final probability

### Module G — Payment Service (`app/services/payment.py`)
- Razorpay integration with HMAC-SHA256 signature verification
- Idempotent payment processing
- Subscription upgrade (free → pro) with audit trail

---

## Rejection Risk Engine — Deep Dive

### Domain Detection
```
Composite Score = 0.50 × keyword_cluster + 0.30 × title_heuristic + 0.20 × skill_analysis
```

### Scoring Models

**TECH_MODEL:**
```
Final_Risk = (0.30 × ATS) + (0.30 × Recruiter) + (0.20 × Market) + (0.10 × Grammar) + (0.10 × Formatting)
```

**NON_TECH_MODEL:**
```
Final_Risk = (0.25 × ATS) + (0.35 × Recruiter) + (0.20 × Market) + (0.10 × Grammar) + (0.10 × Formatting)
```

### Layer Sub-Scores

| Layer | Tech Sub-Weights | Non-Tech Sub-Weights |
|---|---|---|
| **ATS** | technical_skill(0.45), framework(0.25), keyword(0.15), exp(0.15) | keyword(0.35), tool(0.25), achievement(0.20), exp(0.20) |
| **Recruiter** | embedding(0.40), impact(0.30), maturity(0.20), architecture(0.10) | embedding(0.35), leadership(0.25), outcome(0.25), clarity(0.15) |
| **Market** | demand(0.50), competition(0.30), stability(0.20) | demand(0.40), certification(0.30), competition(0.30) |
| **Grammar** | spelling(0.50), grammar(0.30), readability(0.20) | *same* |
| **Formatting** | structure(0.35), bullet(0.25), density(0.20), parse(0.20) | *same* |

### LLM Boundary
The LLM is invoked **only after** all deterministic scores are computed. If unavailable, scores remain fully valid — only the narrative explanation is missing.

---

## Project Structure

```
reBorn_i/
├── app/
│   ├── __init__.py                 # Package init, __version__
│   ├── main.py                     # FastAPI app factory, lifecycle, exception handlers
│   ├── api/
│   │   ├── auth.py                 # JWT auth, Google OAuth, password hashing
│   │   └── routes.py               # All API endpoint definitions (1099 lines)
│   ├── config/
│   │   ├── settings.py             # Pydantic BaseSettings (env vars)
│   │   ├── scoring_weights.py      # Frozen dataclass scoring configs (377 lines)
│   │   └── prompt_templates.py     # Version-controlled LLM prompt templates
│   ├── models/
│   │   └── database.py             # SQLAlchemy ORM: User, Resume, Analysis, etc.
│   ├── schemas/
│   │   └── schemas.py              # Pydantic request/response schemas
│   ├── services/
│   │   ├── resume_processor.py     # Module A — PDF extraction & parsing
│   │   ├── rejection_engine.py     # Module B — 5-layer risk engine (84K)
│   │   ├── market_radar.py         # Module C — Market intelligence
│   │   ├── career_simulation.py    # Module D — What-if analysis
│   │   ├── blueprint_generator.py  # Module E — Action plan generation
│   │   ├── hiring_pipeline.py      # Module F — Pipeline survival sim
│   │   └── payment.py              # Module G — Razorpay integration
│   └── utils/
│       ├── database.py             # Async engine, session factory
│       ├── embeddings.py           # OpenAI embeddings + keyword fallback
│       ├── exceptions.py           # 12-class exception hierarchy
│       ├── llm_client.py           # Async OpenAI client with retry
│       ├── logging.py              # structlog with PII sanitization
│       └── security.py             # Input sanitization, prompt injection
├── frontend/
│   ├── src/
│   │   ├── App.tsx                 # Router with 13 protected routes
│   │   ├── api/client.ts           # Axios client with JWT interceptors
│   │   ├── context/
│   │   │   ├── AuthContext.tsx      # Authentication state
│   │   │   └── SubscriptionContext.tsx  # Subscription state
│   │   ├── components/             # 10 reusable components
│   │   ├── pages/                  # 16 page components
│   │   └── types/index.ts          # TypeScript interfaces (265 lines)
│   ├── package.json                # Dependencies
│   ├── vite.config.ts              # Vite configuration
│   ├── tailwind.config.js          # TailwindCSS theme
│   └── vercel.json                 # SPA routing rewrites
├── data/
│   └── job_market_dataset.json     # 20 job listings with skills
├── main.py                         # Root entry point for Render
├── render.yaml                     # Render Blueprint deployment
├── requirements.txt                # Pinned Python dependencies
├── runtime.txt                     # Python version (3.10.12)
├── .env.example                    # Environment variable template
├── .env.render                     # Render production env template
├── .gitignore                      # Git ignore rules
└── .renderignore                   # Render deploy ignore rules
```

---

## Quick Start

### Prerequisites
- Python 3.10+
- Node.js 18+
- An OpenAI API key (optional — system works without it via fallbacks)
- A Google OAuth Client ID (optional — for Google Sign-In)

### Backend Setup

```bash
# Clone and enter the project
git clone https://github.com/Sharique002/reBorn_i.git
cd reBorn_i

# Create and activate virtual environment
python -m venv .venv
.venv\Scripts\activate        # Windows
# source .venv/bin/activate   # macOS/Linux

# Install dependencies
pip install -r requirements.txt

# Configure environment
cp .env.example .env
# Edit .env — set JWT_SECRET_KEY, OPENAI_API_KEY (optional), etc.

# Start the backend (uses SQLite by default for development)
uvicorn app.main:app --reload --host 0.0.0.0 --port 8000
```

The API is available at `http://localhost:8000`. Interactive docs at `http://localhost:8000/docs`.

### Frontend Setup

```bash
# In a new terminal
cd frontend

# Install dependencies
npm install

# Configure environment
cp .env.example .env
# Edit .env — set VITE_GOOGLE_CLIENT_ID (optional)

# Start the dev server
npm run dev
```

Frontend runs at `http://localhost:5173`.

---

## Environment Variables

All config is loaded from environment variables or `.env`. See `.env.example` for the full template.

| Variable | Default | Description |
|---|---|---|
| `APP_NAME` | `reBorn_i` | Application name |
| `APP_VERSION` | `1.0.0` | Semantic version |
| `DEBUG` | `false` | Debug mode (exposes error details) |
| `ENVIRONMENT` | `development` | development / staging / production |
| `DATABASE_URL` | `postgresql+asyncpg://...` | Async DB DSN (SQLite for dev) |
| `JWT_SECRET_KEY` | — | **Required.** Min 16 chars |
| `GOOGLE_CLIENT_ID` | — | Optional. Google OAuth Client ID |
| `OPENAI_API_KEY` | — | Optional. For explanations only |
| `OPENAI_MODEL` | `gpt-4o` | LLM model name |
| `EMBEDDING_MODEL` | `text-embedding-3-small` | OpenAI embedding model |
| `CORS_ORIGINS` | `*` | Comma-separated allowed origins |
| `MAX_FILE_SIZE_MB` | `10` | Max upload file size |
| `RAZORPAY_KEY_ID` | — | Optional. For payment processing |
| `RAZORPAY_KEY_SECRET` | — | Optional. For payment verification |
| `MARKET_DATA_PATH` | `data/job_market_dataset.json` | Market data file path |

> **Note:** Domain-aware scoring uses frozen dataclass weights in `scoring_weights.py`. The env-level `WEIGHT_*` vars are kept for backward compatibility only.

---

## API Documentation

All endpoints are prefixed with `/api/v1`. Swagger docs available at `/docs` (disabled in production).

### Authentication
| Method | Endpoint | Auth | Description |
|---|---|---|---|
| POST | `/auth/register` | No | Create user account |
| POST | `/auth/login` | No | Obtain JWT access token |
| POST | `/auth/google` | No | Google OAuth sign-in |
| GET | `/auth/me` | Yes | Get current user profile |

**Token usage:** `Authorization: Bearer <token>`

### Resume
| Method | Endpoint | Auth | Description |
|---|---|---|---|
| POST | `/resume/upload` | Yes | Upload PDF resume |
| GET | `/resume/list` | Yes | List user's resumes |
| GET | `/resume/{id}` | Yes | Get processed resume |
| DELETE | `/resume/{id}` | Yes | Delete a resume |

### Rejection Analysis
| Method | Endpoint | Auth | Description |
|---|---|---|---|
| POST | `/analysis/rejection-risk` | Yes | Compute 5-layer rejection risk |
| GET | `/analysis/list` | Yes | List recent analyses |

### Market Radar
| Method | Endpoint | Auth | Description |
|---|---|---|---|
| GET | `/market/radar` | Yes | Get market intelligence |
| POST | `/market/radar/refresh` | Yes | Force data refresh |

### Career Simulation
| Method | Endpoint | Auth | Description |
|---|---|---|---|
| POST | `/simulation/simulate` | Yes | Run what-if simulation |

### Blueprint
| Method | Endpoint | Auth | Description |
|---|---|---|---|
| POST | `/blueprint/generate` | Yes | Generate 30/90-day plan |
| GET | `/blueprint/{id}` | Yes | Retrieve saved blueprint |

### Hiring Pipeline
| Method | Endpoint | Auth | Description |
|---|---|---|---|
| POST | `/hiring-pipeline/simulate` | Yes | Pipeline survival simulation |

### Payments
| Method | Endpoint | Auth | Description |
|---|---|---|---|
| POST | `/payment/create-order` | Yes | Create Razorpay order |
| POST | `/payment/verify` | Yes | Verify payment & upgrade |

### System
| Method | Endpoint | Auth | Description |
|---|---|---|---|
| GET | `/health` | No | System health check |
| GET | `/` | No | Root connectivity check |

---

## Frontend Pages

| Route | Page | Description |
|---|---|---|
| `/` | Landing Page | Hero section, features, how-it-works |
| `/login` | Login | Email/password + Google OAuth |
| `/register` | Register | Account creation |
| `/dashboard` | Dashboard | Overview of all modules |
| `/profile` | User Profile | Account settings, resume list, analysis history |
| `/resume` | Resume Upload | PDF upload with processing status |
| `/analysis` | Rejection Analysis | 5-layer risk scoring with charts |
| `/market` | Market Radar | Skill demand visualization |
| `/simulation` | Career Simulation | Before/after skill comparison |
| `/blueprint` | Blueprint | 30/90-day reinvention plans |
| `/pipeline` | Hiring Pipeline | Stage-wise survival probability |
| `/pivot` | Career Pivot | Career transition guidance |
| `/interview` | Interview Readiness | Interview preparation |
| `/tracker` | Resume Tracker | Resume version management |
| `/applications` | Application Tracker | Job application tracking |
| `/action-plan` | Action Plan | Consolidated action items |

---

## Deployment

### Production Architecture

```
User → Vercel (Frontend) → Render (Backend API) → PostgreSQL (Render DB)
                                    ↓
                            OpenAI API (optional)
```

### Backend — Render

1. Push to GitHub (`https://github.com/Sharique002/reBorn_i.git`)
2. Connect repo to Render as a **Web Service**
3. Configure:
   - **Build Command:** `pip install --no-cache-dir -r requirements.txt`
   - **Start Command:** `uvicorn main:app --host 0.0.0.0 --port $PORT`
   - **Python Version:** `3.10.12` (set via `runtime.txt`)
4. Add environment variables from `.env.render` template
5. Create a Render PostgreSQL database and set `DATABASE_URL`

### Frontend — Vercel

1. Connect the `frontend/` directory to Vercel
2. Set **Root Directory** to `frontend`
3. Set environment variables:
   - `VITE_API_URL` = your Render backend URL
   - `VITE_GOOGLE_CLIENT_ID` = your Google OAuth client ID
4. Vercel auto-detects Vite and builds with `npm run build`

### Production Checklist

- [ ] Set `ENVIRONMENT=production` (disables Swagger docs)
- [ ] Generate strong `JWT_SECRET_KEY`: `python -c "import secrets; print(secrets.token_urlsafe(64))"`
- [ ] Set `DEBUG=false`
- [ ] Provide real `DATABASE_URL` (change `postgresql://` to `postgresql+asyncpg://`)
- [ ] Set `CORS_ORIGINS` to your frontend domain
- [ ] Set `OPENAI_API_KEY` for LLM explanations (optional)
- [ ] Configure `GOOGLE_CLIENT_ID` for OAuth
- [ ] Set `LOG_LEVEL=WARNING` for reduced verbosity

---

## Security

### Input Validation
- **Prompt injection detection** — 12 regex patterns scan all user text inputs
- **Input sanitization** — null byte removal, whitespace normalization, length limits
- **PDF validation** — MIME type check, file size limit, magic byte (`%PDF-`) verification

### Authentication
- **JWT tokens** — HS256 signing, configurable expiry, per-request user resolution
- **bcrypt** — Password hashing with auto-upgrade support
- **Google OAuth** — Server-side ID token verification via `google-auth`

### Logging
- **PII sanitization** — Passwords, tokens, API keys, SSNs automatically redacted
- **Structured logging** — JSON output in production, console in development

### Payment Security
- **HMAC-SHA256** — Razorpay signature verification with constant-time comparison
- **Idempotent processing** — Duplicate payment verification returns success without re-processing

---

## Design Principles

### Determinism First
All scoring functions are pure — same inputs always produce same outputs. Domain detection is deterministic (keyword clusters + title heuristics + skill analysis). No LLM involvement in computation.

### Graceful Degradation
The system operates at full fidelity without external services:
- ✅ Rejection risk scores — work 100% without OpenAI
- ✅ Market analysis — works from local dataset
- ✅ Career simulation — works using keyword similarity fallback
- ✅ Blueprint generation — falls back to curated templates
- ✅ Embeddings — keyword-based TF-IDF fallback (pure Python, no numpy)

### Data Immutability
Career simulation operates on copies. Original resume data is never modified during what-if analysis — enforced via explicit `copy()` operations at the service layer.

### Exception Hierarchy
12-class exception hierarchy with centralized mapping to HTTP status codes:

| Exception | HTTP Status |
|---|---|
| `FileValidationError`, `PromptInjectionError` | 400 |
| `CorruptedFileError`, `PDFExtractionError` | 422 |
| `LLMError` | 502 |
| `ScoringError`, `MarketDataError` | 500 |

---

## Database Schema

| Table | Description |
|---|---|
| `users` | Accounts with email/Google OAuth, subscription plan |
| `resumes` | Uploaded PDFs with extracted structured data |
| `rejection_analyses` | Risk scores with 5-layer breakdowns |
| `market_snapshots` | Point-in-time market demand snapshots |
| `blueprints` | Generated 30/90-day reinvention plans |
| `career_simulations` | Before/after skill modification comparisons |
| `payments` | Razorpay transaction records |

All tables use **String-based UUIDs** for cross-database compatibility (PostgreSQL + SQLite).

---

## License

Private / Internal use.

---

<p align="center">
  <sub>Built with ❤️ by <a href="https://github.com/Sharique002">Sharique</a></sub>
</p>
