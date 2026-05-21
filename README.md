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
- **Subscription Upgrades** — access premium modules via seamless payment workflows

> [!IMPORTANT]
> **Key principle:** Scores are 100% deterministic. LLM is used *only* for human-readable explanations — never for computation. If the LLM is unavailable, scores remain fully valid.

---

## Table of Contents

1. [Architecture Overview](#architecture-overview)
2. [Tech Stack](#tech-stack)
3. [Core Modules](#core-modules)
4. [Rejection Risk Engine — Deep Dive](#rejection-risk-engine--deep-dive)
5. [Database & Optimizations](#database--optimizations)
6. [Payment Gateway & Dev Bypass Flow](#payment-gateway--dev-bypass-flow)
7. [Systematic E2E Testing & Verification](#systematic-e2e-testing--verification)
8. [Project Structure](#project-structure)
9. [Quick Start](#quick-start)
10. [Environment Variables](#environment-variables)
11. [API Documentation](#api-documentation)
12. [Frontend Pages](#frontend-pages)
13. [Deployment](#deployment)
14. [Security](#security)
15. [Design Principles](#design-principles)
16. [License](#license)

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
│  /hiring-pipeline · /payment · /subscription · /health              │
│  Deployed on: Render (https://reborni-backend.onrender.com)         │
├─────────────────────────────────────────────────────────────────────┤
│                        Service Layer                                │
│  ┌──────────┐ ┌──────────┐ ┌──────────┐ ┌──────────┐ ┌──────────┐  │
│  │ Resume   │ │Rejection │ │ Market   │ │ Career   │ │Blueprint │  │
│  │Processor │ │ Engine   │ │ Radar    │ │Simulation│ │Generator │  │
│  └──────────┘ └──────────┘ └──────────┘ └──────────┘ └──────────┘  │
│  ┌──────────┐ ┌──────────┐ ┌──────────┐                            │
│  │ Hiring   │ │ Payment  │ │ Sub      │                            │
│  │ Pipeline │ │ Service  │ │ Manager  │                            │
│  └──────────┘ └──────────┘ └──────────┘                            │
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
| **SQLAlchemy 2.0** | Async ORM with `Mapped` type annotations and connection events |
| **PostgreSQL / SQLite** | Production (asyncpg) / Development (aiosqlite) with optimization pragmas |
| **Pydantic v2** | Request/response validation and settings management |
| **OpenAI API** | Embeddings (text-embedding-3-small) + LLM explanations (gpt-4o) |
| **structlog** | Structured JSON logging with PII sanitization |
| **python-jose** | JWT token creation and validation |
| **passlib + bcrypt** | Password hashing |
| **google-auth** | Google OAuth ID token verification |
| **tenacity** | Retry logic with exponential backoff |
| **pdfplumber + PyPDF2** | Dual-strategy PDF text extraction |
| **Razorpay** | Payment processing for subscription upgrades with mock bypass |

### Frontend
| Technology | Purpose |
|---|---|
| **React 18** | Component-driven UI development |
| **TypeScript** | Type-safe front-end engineering |
| **Vite** | Modern, ultra-fast frontend build tooling |
| **TailwindCSS** | Clean styling and UI consistency |
| **Framer Motion** | Micro-animations, sliding panels, and page transition effects |
| **Recharts** | Interactive data and pipeline analytics charts |
| **React Router v7** | Single-page application routing |
| **Axios** | HTTP request library with authentication and JWT interceptors |
| **Zustand** | Centralized auth and subscription global state management |
| **Lucide React** | Clean vector iconography |

---

## Core Modules

### Module A — Resume Processor ([resume_processor.py](file:///D:/files/OneDrive/Desktop/reBorn_i/app/services/resume_processor.py))
- Dual-strategy PDF extraction (pdfplumber primary, PyPDF2 fallback)
- Skill extraction via keyword matching against 100+ known skills
- Experience year detection and level estimation (intern → c-level)
- Section extraction (education, experience, skills, projects, certifications)
- Contact information extraction (email, phone, LinkedIn)

### Module B — Universal Rejection Risk Engine ([rejection_engine.py](file:///D:/files/OneDrive/Desktop/reBorn_i/app/services/rejection_engine.py))
- **Domain-aware** 5-layer deterministic risk scoring
- Auto-detects **Tech** vs **Non-Tech** domain using keyword clusters (50%), role title heuristics (30%), skill analysis (20%)
- Applies domain-specific scoring model (`TECH_MODEL` or `NON_TECH_MODEL`)
- **5 Risk Layers:** ATS → Recruiter → Market → Grammar → Formatting
- Risk classification: 0–30% Low, 30–50% Moderate, 50–70% High, 70–100% Critical
- LLM used **only** for post-scoring explanation

### Module C — Market Radar ([market_radar.py](file:///D:/files/OneDrive/Desktop/reBorn_i/app/services/market_radar.py))
- Skill frequency analysis across job market dataset (20 listings)
- Demand index with growth trend weighting
- Future-proof scoring (cross-industry transferability)
- Module-level caching with configurable refresh interval

### Module D — Career Simulation ([career_simulation.py](file:///D:/files/OneDrive/Desktop/reBorn_i/app/services/career_simulation.py))
- Before/after comparison via copy-based skill modification
- Computes `risk_delta` = before.risk − after.risk
- **Guarantees original resume data is never mutated**

### Module E — Blueprint Generator ([blueprint_generator.py](file:///D:/files/OneDrive/Desktop/reBorn_i/app/services/blueprint_generator.py))
- LLM-powered 30-day and 90-day action plans
- Pydantic schema validation of LLM responses
- Template-based fallback when LLM is unavailable

### Module F — Hiring Pipeline Simulator ([hiring_pipeline.py](file:///D:/files/OneDrive/Desktop/reBorn_i/app/services/hiring_pipeline.py))
- Sequential stage-wise survival probability (ATS → Recruiter → Market → Interview)
- Multiplicative compounding model
- Bottleneck detection with stage-specific diagnosis
- Behavioral guidance tiers based on final probability

### Module G — Payment Service ([payment.py](file:///D:/files/OneDrive/Desktop/reBorn_i/app/services/payment.py))
- Razorpay integration with HMAC-SHA256 signature verification
- Idempotent payment processing with amount validation (₹9 / 900 paise)
- Subscription upgrade (free → pro) with audit trail and developer bypass fallback

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

---

## Database & Optimizations

In development environments, the application uses SQLite. To support high-throughput concurrency, avoid locking errors (`database is locked`), and run E2E test suites cleanly, the engine uses custom connection event hooks to set the following parameters:

```python
@event.listens_for(_engine.sync_engine, "connect")
def set_sqlite_pragma(dbapi_connection, connection_record):
    cursor = dbapi_connection.cursor()
    try:
        cursor.execute("PRAGMA journal_mode=WAL")       # Write-Ahead Logging
        cursor.execute("PRAGMA synchronous=NORMAL")     # Faster commits safely checkpointed
        cursor.execute("PRAGMA foreign_keys=ON")        # Enforce relational integrity
    finally:
        cursor.close()
```

> [!TIP]
> **WAL Mode** allows readers to proceed concurrently without waiting for writers, greatly improving local testing speed and UI responsiveness.

---

## Payment Gateway & Dev Bypass Flow

The premium subscription upgrade is verified securely. In development settings (`ENVIRONMENT=development`), creators can bypass active billing credentials securely:
1. When generating a payment order, if Razorpay credentials are invalid or unavailable, the system automatically falls back to generating a mock order prefixed with `order_mock_`.
2. When verifying payments, if the order ID contains the `order_mock_` prefix, the signature verification check is bypassed, activating the **PRO** plan status instantly.
3. This ensures developers can test payment screens and features seamlessly without running active credit/debit charges.

---

## Systematic E2E Testing & Verification

A dedicated verification test suite is available at `scratch/test_all_modules.py`. This script registers a fresh user, logs in, uploads a synthetic resume PDF, runs analyses, triggers what-if simulations, refreshes market data, and completes the upgraded billing bypass flow to verify everything behaves correctly.

### Running Verification Tests:
Ensure your backend server is running locally (`http://localhost:8000`), then execute:

```bash
# Activate the virtual environment
.venv\Scripts\activate

# Run the test execution
python scratch/test_all_modules.py
```

### Verification Flow Checklist:
- [x] Backend Health Check
- [x] Clean User Registration
- [x] JWT Token Login Flow
- [x] Get Active User Profile
- [x] Dual-strategy PDF Resume Upload
- [x] Retrieve Extracted Resumes List
- [x] 5-Layer Deterministic Risk Scoring
- [x] List Rejection Analyses History
- [x] Custom Market Radar Analysis
- [x] Asynchronous Market Radar Refreshing
- [x] Career What-If Simulation (Data Immutability check)
- [x] 30/90-Day Reinvention Blueprint Generation
- [x] Hiring Pipeline Stage Probability Compounding
- [x] Razorpay Payment Order Mock Generation
- [x] Signature-Bypassed Verification Handler
- [x] Verify Subscription Promotion Status (Upgrade from FREE to PRO)

---

## Project Structure

```
reBorn_i/
├── app/
│   ├── __init__.py                 # Package init, __version__
│   ├── main.py                     # FastAPI app factory, middleware, exception mapping
│   ├── api/
│   │   ├── auth.py                 # JWT auth, Google OAuth, password hashing
│   │   └── routes.py               # API route gateways & Subscription controller
│   ├── config/
│   │   ├── settings.py             # Pydantic BaseSettings (env configs)
│   │   ├── scoring_weights.py      # Frozen dataclass scoring configs
│   │   └── prompt_templates.py     # Version-controlled LLM templates
│   ├── models/
│   │   └── database.py             # SQLAlchemy ORM schemas
│   ├── schemas/
│   │   └── schemas.py              # Pydantic validation request/response formats
│   ├── services/
│   │   ├── resume_processor.py     # Module A — PDF parsing
│   │   ├── rejection_engine.py     # Module B — Risk metrics scoring
│   │   ├── market_radar.py         # Module C — Market demand analytics
│   │   ├── career_simulation.py    # Module D — What-if simulator
│   │   ├── blueprint_generator.py  # Module E — Plan generation
│   │   ├── hiring_pipeline.py      # Module F — Compounding survival
│   │   └── payment.py              # Module G — Razorpay payment management
│   └── utils/
│       ├── database.py             # Async connection engine & WAL event listeners
│       ├── embeddings.py           # OpenAI embeddings & TF-IDF backup
│       ├── exceptions.py           # 12-class exception definition
│       ├── llm_client.py           # Async OpenAI API client
│       ├── logging.py              # Structlog config
│       └── security.py             # Input checking & Injection prevention
├── frontend/
│   ├── src/
│   │   ├── App.tsx                 # Protected navigation routes setup
│   │   ├── api/client.ts           # Axios client configured with JWT interceptors
│   │   ├── context/
│   │   │   ├── AuthContext.tsx      # Auth session provider
│   │   │   └── SubscriptionContext.tsx  # Global billing status provider
│   │   ├── components/             # Reusable UI cards, celebration triggers, modal dialogs
│   │   ├── pages/                  # Landing page, dashboard, upload, and analytics tabs
│   │   └── types/index.ts          # Front-end TypeScript data types
│   ├── package.json                # JS dependency registry
│   ├── vite.config.ts              # Vite asset pipelines
│   └── tailwind.config.js          # Tailwind custom theme styles
├── scratch/
│   ├── test_all_modules.py         # Systematic E2E API Verification suite
│   └── test_pdf_parsing.py         # PDF text extractor validator
├── requirements.txt                # Back-end dependencies manifest
└── .env.example                    # Template backend configuration
```

---

## Quick Start

### Prerequisites
- Python 3.10+
- Node.js 18+
- OpenAI API key (optional — system automatically downgrades to local fallbacks)
- Google OAuth Client ID (optional — for Google Authentication buttons)

### Backend Setup

```bash
# Clone the repository
git clone https://github.com/Sharique002/reBorn_i.git
cd reBorn_i

# Create and activate virtual environment
python -m venv .venv
.venv\Scripts\activate        # Windows

# Install backend dependencies
pip install -r requirements.txt

# Configure environment keys
cp .env.example .env
# Edit .env variables

# Run the local uvicorn development server
uvicorn app.main:app --reload --host 0.0.0.0 --port 8000
```

The API will run at `http://localhost:8000`. Interactive OpenAPI specs available at `http://localhost:8000/docs`.

### Frontend Setup

```bash
# Open a new terminal and navigate to frontend
cd frontend

# Install client-side libraries
npm install

# Copy local environment files
cp .env.example .env

# Launch the Vite dev server
npm run dev
```

The frontend will run at `http://localhost:5173`.

---

## Environment Variables

| Variable | Default | Description |
|---|---|---|
| `ENVIRONMENT` | `development` | App context (development / staging / production) |
| `DATABASE_URL` | `sqlite+aiosqlite:///./reborn_dev.db` | Data Source Name |
| `JWT_SECRET_KEY` | — | Secret phrase for authenticating JWT signatures |
| `FRONTEND_URL` | `http://localhost:5173` | Allowed origin address of client UI |
| `OPENAI_API_KEY` | — | Optional OpenAI developer key |
| `RAZORPAY_KEY_ID` | — | Razorpay payment merchant key identifier |
| `RAZORPAY_KEY_SECRET` | — | Razorpay verification credential signature |

---

## API Documentation

All API endpoints are versioned under `/api/v1`. Detailed Swagger documentation can be viewed interactively at `/docs`.

### Authentication
- `POST /auth/register` — Sign up new account
- `POST /auth/login` — Sign in and retrieve auth tokens
- `POST /auth/google` — Sign in securely via Google OAuth
- `GET /auth/me` — Read currently authenticated profile details

### Resumes & Analyses
- `POST /resume/upload` — Parse and index PDF resume files
- `GET /resume/list` — Show all uploaded resumes
- `POST /analysis/rejection-risk` — Run 5-layer deterministic risk evaluation
- `POST /simulation/simulate` — Career what-if scenario evaluation
- `POST /blueprint/generate` — Generate action blueprints

### Subscription & Payments
- `POST /payment/create-order` — Construct payment order (₹9 / 900 paise)
- `POST /payment/verify` — Check order transaction verification details
- `GET /subscription/status` — Get user's verified subscription plan status

---

## Deployment

### Production Stack
```
User → Vercel (React Frontend) → Render (FastAPI Backend) → Managed PostgreSQL
```

### Backend — Render Hosting
1. Create a **Web Service** pointing to the repository on Render.
2. Select **Python** runtime. Build Command: `pip install --no-cache-dir -r requirements.txt`.
3. Start Command: `uvicorn main:app --host 0.0.0.0 --port $PORT`.
4. Configure database connection to PostgreSQL instance using `postgresql+asyncpg://...`.
5. Set `ENVIRONMENT=production`.

### Frontend — Vercel Hosting
1. Link your github repository to Vercel.
2. Select `frontend/` as the root project directory.
3. Configure `VITE_API_URL` to point to the backend server.
4. Deploy under Vite defaults.

---

## Security Guidelines

- **Prompt Injection Scanners:** Inputs pass through 12 regex filters blocking SQL injections and LLM overrides.
- **Null-Byte Sanitization:** Prevents buffer overflow attacks.
- **Structured PII Filters:** Personal details (passwords, JWT strings, social details) are filtered out of structured logs.
- **HMAC Signatures:** Direct webhook calls verify payloads before promoting plan statuses.

---

## Design Principles

- **Determinism First:** All algorithms run mathematically. No AI/LLM influences numerical scores.
- **Graceful Failures:** If OpenAI APIs return exceptions, matching keywords and offline datasets ensure normal scoring flow runs unaffected.
- **Immutable Actions:** All what-if modifications operate on deep copies. Original data remains pristine.

---

## License

Private / Internal use.

---

<p align="center">
  <sub>Built with ❤️ by <a href="https://github.com/Sharique002">Sharique</a></sub>
</p>
