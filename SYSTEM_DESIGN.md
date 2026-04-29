# reBorn_i — System Design Document

> **Not a Resume Helper. From Rejection to Reinvention.**

**Version:** 1.0.0  
**Last Updated:** February 21, 2026

---

## Table of Contents

1. [Project Overview](#1-project-overview)
2. [Architecture Overview](#2-architecture-overview)
3. [Technology Stack](#3-technology-stack)
4. [Frontend Architecture](#4-frontend-architecture)
5. [Backend Architecture](#5-backend-architecture)
6. [Database Design](#6-database-design)
7. [API Design](#7-api-design)
8. [Core Algorithms](#8-core-algorithms)
9. [Authentication & Security](#9-authentication--security)
10. [Infrastructure & Deployment](#10-infrastructure--deployment)
11. [Data Flow Diagrams](#11-data-flow-diagrams)
12. [Non-Functional Requirements](#12-non-functional-requirements)
13. [File Structure](#13-file-structure)

---

## 1. Project Overview

### 1.1 What is reBorn_i?

reBorn_i is an AI-powered career reinvention platform that goes beyond traditional resume optimization. Instead of polishing resumes, it **predicts why you'd get rejected**, shows you what skills the market actually demands, lets you **simulate career pivots** in a sandbox, and generates actionable **reinvention blueprints**.

### 1.2 Core Value Propositions

| Feature | Description |
|---------|-------------|
| **Rejection Engine** | Predicts rejection risk with a 4-component deterministic scoring algorithm |
| **Market Radar** | Real-time skill demand analysis from job market data |
| **Career Simulation** | What-if engine — add/remove skills and see risk impact instantly |
| **Blueprint Generator** | AI-generated 30-day and 90-day reinvention action plans |
| **Resume Intelligence** | PDF parsing → structured data extraction via LLM |

### 1.3 Target Users

- Job seekers who have faced rejection and want data-driven insight
- Career changers exploring new roles
- Professionals wanting to future-proof their skill sets

---

## 2. Architecture Overview

### 2.1 High-Level Architecture

The system follows a **3-tier architecture** with clear separation:

```
┌─────────────────────────────────────────────────────────────────┐
│                    PRESENTATION TIER                             │
│   React 18 SPA + TypeScript + Tailwind CSS + Vite               │
│   Google Identity Services (OAuth)                              │
└─────────────────────┬───────────────────────────────────────────┘
                      │ HTTP/REST (JSON) via Axios
                      │ Vite Proxy → localhost:8001
┌─────────────────────▼───────────────────────────────────────────┐
│                    APPLICATION TIER                               │
│   FastAPI (async) + SQLAlchemy 2.0 (async ORM)                  │
│   ┌─────────┐ ┌──────────┐ ┌──────────┐ ┌───────────┐          │
│   │  Auth   │ │ Resume   │ │Rejection │ │  Market   │          │
│   │ Service │ │Processor │ │ Engine   │ │  Radar    │          │
│   └─────────┘ └──────────┘ └──────────┘ └───────────┘          │
│   ┌──────────────┐ ┌────────────────┐                           │
│   │   Career     │ │   Blueprint    │                           │
│   │ Simulation   │ │   Generator    │                           │
│   └──────────────┘ └────────────────┘                           │
│                                                                  │
│   AI/ML: OpenAI GPT-4o │ Sentence Transformers (MiniLM-L6-v2)  │
└─────────────────────┬───────────────────────────────────────────┘
                      │
┌─────────────────────▼───────────────────────────────────────────┐
│                      DATA TIER                                   │
│   PostgreSQL 16 (primary store) + Redis 7 (cache/sessions)      │
│   File System (job market dataset JSON)                          │
└─────────────────────────────────────────────────────────────────┘
```

### 2.2 Design Principles

| Principle | Implementation |
|-----------|---------------|
| **Async-First** | All I/O operations (DB, HTTP, file) use `async/await` |
| **Deterministic + AI Hybrid** | Scoring is deterministic; explanations/plans use LLM |
| **Fail-Safe** | LLM failures fall back to template-based responses |
| **Input Sanitization** | Prompt injection detection on all user text inputs |
| **Separation of Concerns** | Services are independent; routers only orchestrate |

---

## 3. Technology Stack

### 3.1 Frontend

| Technology | Version | Purpose |
|-----------|---------|---------|
| React | 18.3.1 | UI framework (SPA) |
| TypeScript | ~5.6.2 | Type safety |
| Vite | 6.4.1 | Build tool & dev server |
| Tailwind CSS | 3.4.17 | Utility-first styling |
| React Router | 7.1.1 | Client-side routing |
| Axios | latest | HTTP client |
| Recharts | latest | Data visualization (charts) |
| Lucide React | latest | Icon library |
| Google Identity Services | GIS | OAuth 2.0 sign-in |

### 3.2 Backend

| Technology | Version | Purpose |
|-----------|---------|---------|
| Python | 3.11+ | Runtime |
| FastAPI | latest | Async web framework |
| SQLAlchemy | 2.0 | Async ORM |
| asyncpg | latest | PostgreSQL async driver |
| Pydantic | v2 | Schema validation |
| python-jose | latest | JWT token handling |
| passlib[bcrypt] | latest | Password hashing |
| google-auth | 2.38.0 | Google OAuth token verification |
| openai | latest | GPT-4o API client |
| sentence-transformers | latest | Local embedding model |
| PyPDF2 | latest | PDF text extraction |
| structlog | latest | Structured logging |

### 3.3 Infrastructure

| Technology | Version | Purpose |
|-----------|---------|---------|
| PostgreSQL | 16-alpine | Primary database |
| Redis | 7-alpine | Caching layer |
| Docker Compose | 3.9 | Container orchestration |
| Uvicorn | latest | ASGI server |

---

## 4. Frontend Architecture

### 4.1 Component Hierarchy

```
App (BrowserRouter + AuthProvider)
├── Public Routes
│   ├── Login          → email/password + Google OAuth
│   └── Register       → email/password + Google OAuth
│
└── Protected Routes (ProtectedRoute → Layout)
    ├── Sidebar (navigation)
    └── Outlet
        ├── Dashboard          → overview + stats
        ├── ResumeUpload       → PDF upload + structured display
        ├── RejectionAnalysis  → JD input + risk score + gaps
        ├── MarketRadar        → skill demand charts
        ├── CareerSimulation   → what-if skill editor
        └── Blueprint          → 30/90 day plan viewer
```

### 4.2 State Management

| Layer | Mechanism | Scope |
|-------|-----------|-------|
| Auth State | React Context (`AuthContext`) | Global — user, token, login/logout/googleLogin |
| API Layer | Axios instance (`client.ts`) | Singleton — auto-attaches JWT Bearer token |
| Page State | Local `useState` / `useEffect` | Per-component — form data, API responses |

### 4.3 Authentication Flow (Frontend)

```
1. User fills email/password → POST /auth/login → JWT stored in localStorage
2. User clicks Google button → GIS popup → ID token → POST /auth/google → JWT stored
3. AuthContext reads JWT on mount → GET /auth/me → populate user state
4. ProtectedRoute checks AuthContext → redirect to /login if not authenticated
5. Axios interceptor attaches "Authorization: Bearer <token>" to every request
```

### 4.4 Routing

| Path | Component | Auth Required |
|------|-----------|---------------|
| `/login` | Login | No |
| `/register` | Register | No |
| `/` | Dashboard | Yes |
| `/resume` | ResumeUpload | Yes |
| `/analysis` | RejectionAnalysis | Yes |
| `/market` | MarketRadar | Yes |
| `/simulation` | CareerSimulation | Yes |
| `/blueprint` | Blueprint | Yes |

---

## 5. Backend Architecture

### 5.1 Application Structure

```
app/
├── main.py              → FastAPI app factory, lifespan, exception handlers
├── api/
│   ├── auth.py          → JWT creation, password hashing, Google OAuth verify
│   └── routes.py        → 7 routers, 12+ endpoints
├── services/
│   ├── resume_processor.py      → PDF → structured data (GPT-4o)
│   ├── rejection_engine.py      → 4-component risk scoring
│   ├── market_radar.py          → Skill demand analysis
│   ├── career_simulation.py     → What-if scoring engine
│   └── blueprint_generator.py   → LLM plan generation + fallback
├── models/
│   └── database.py      → 6 SQLAlchemy ORM models
├── schemas/
│   └── schemas.py       → 18+ Pydantic validation models
├── config/
│   ├── settings.py      → Pydantic Settings (env-driven)
│   ├── prompt_templates.py  → LLM prompt templates
│   └── scoring_weights.py  → Deterministic scoring config
└── utils/
    ├── database.py      → Async session factory, init/close
    ├── security.py      → File validation, prompt injection, sanitization
    ├── exceptions.py    → Custom exception hierarchy
    └── logging.py       → Structured logging setup
```

### 5.2 Service Descriptions

#### Resume Processor
- Accepts PDF uploads (max 10MB)
- Validates file type, size, and integrity
- Extracts text via PyPDF2
- Sends to GPT-4o for structured extraction (skills, experience, education)
- Generates embedding vector via sentence-transformers
- Stores structured JSON + embedding in PostgreSQL

#### Rejection Engine
- **Deterministic** 4-component scoring (no LLM dependency for core score)
- Computes skill match (TF-IDF), experience alignment, keyword density, semantic similarity
- Weighted aggregation: `risk = 0.35×skill + 0.25×exp + 0.20×keyword + 0.20×embedding`
- LLM generates human-readable explanation (optional, fail-safe)

#### Market Radar
- Reads job market dataset (JSON)
- Computes skill frequency and demand index
- Caches results in Redis with configurable TTL
- Optional: personalized future-proof score when resume_id provided

#### Career Simulation
- Non-destructive: never modifies actual resume data
- Computes "before" metrics → applies skill add/remove → computes "after" metrics
- Returns risk delta (negative = improvement)

#### Blueprint Generator
- Uses GPT-4o for structured 30-day or 90-day plan generation
- Falls back to template-based plan if LLM fails
- Plan includes weekly milestones, resources, and skill targets
- Saves risk score at creation time for progress tracking

### 5.3 Request Lifecycle

```
Client Request
    → CORS Middleware (origin validation)
    → Exception Handlers (global catch)
    → Router (path matching)
    → JWT Dependency (token validation, user extraction)
    → Route Handler (input validation via Pydantic)
    → Service Layer (business logic)
    → Data Layer (DB read/write, cache, LLM calls)
    → Pydantic Response Model (output serialization)
    → JSON Response
```

---

## 6. Database Design

### 6.1 Tables Overview

| Table | Description | FK Relations |
|-------|-------------|-------------|
| `users` | User accounts (local + Google OAuth) | — |
| `resumes` | Uploaded & processed resumes | → users |
| `rejection_analyses` | Rejection risk analysis results | → users, resumes |
| `market_snapshots` | Point-in-time market demand data | — |
| `blueprints` | Reinvention action plans | → users |
| `career_simulations` | What-if simulation results | → users, resumes |

### 6.2 Key Design Decisions

| Decision | Rationale |
|----------|-----------|
| UUID primary keys | Avoid sequential ID enumeration attacks |
| JSON columns for structured data | Flexible schema for LLM-generated content |
| `hashed_password` nullable | Supports Google OAuth users (no password) |
| `auth_provider` field | Distinguish local vs OAuth users |
| Cascade deletes | Deleting a user removes all their data |
| `status` enum on resumes | Track processing pipeline state |

### 6.3 Entity Relationships

```
users (1) ──→ (N) resumes
users (1) ──→ (N) rejection_analyses
users (1) ──→ (N) blueprints
users (1) ──→ (N) career_simulations
resumes (1) ──→ (N) rejection_analyses
resumes (1) ──→ (N) career_simulations
market_snapshots — standalone (no FK)
```

---

## 7. API Design

### 7.1 Endpoint Map

All endpoints are prefixed with `/api/v1`.

#### Authentication (`/auth`)

| Method | Path | Auth | Description |
|--------|------|------|-------------|
| POST | `/auth/register` | No | Create new account |
| POST | `/auth/login` | No | Get JWT token |
| POST | `/auth/google` | No | Google OAuth login |
| GET | `/auth/me` | Yes | Get current user profile |

#### Resume (`/resume`)

| Method | Path | Auth | Description |
|--------|------|------|-------------|
| POST | `/resume/upload` | Yes | Upload & process PDF |
| GET | `/resume/{id}` | Yes | Get processed resume |

#### Analysis (`/analysis`)

| Method | Path | Auth | Description |
|--------|------|------|-------------|
| POST | `/analysis/rejection-risk` | Yes | Analyze rejection risk |

#### Market (`/market`)

| Method | Path | Auth | Description |
|--------|------|------|-------------|
| GET | `/market/radar` | Yes | Get market analysis |
| POST | `/market/radar/refresh` | Yes | Trigger background refresh |

#### Simulation (`/simulation`)

| Method | Path | Auth | Description |
|--------|------|------|-------------|
| POST | `/simulation/simulate` | Yes | Run what-if simulation |

#### Blueprint (`/blueprint`)

| Method | Path | Auth | Description |
|--------|------|------|-------------|
| POST | `/blueprint/generate` | Yes | Generate action plan |
| GET | `/blueprint/{id}` | Yes | Get existing blueprint |

#### System (`/`)

| Method | Path | Auth | Description |
|--------|------|------|-------------|
| GET | `/health` | No | Health check |

### 7.2 Response Format

All responses follow consistent JSON structure:

```json
// Success
{
  "id": "uuid",
  "field": "value",
  "created_at": "2026-02-21T00:00:00Z"
}

// Error
{
  "detail": "Human-readable error message"
}
```

### 7.3 Authentication Header

```
Authorization: Bearer <jwt_token>
```

JWT payload: `{ "sub": "user_uuid", "email": "user@email.com", "exp": 1740200000 }`

---

## 8. Core Algorithms

### 8.1 Rejection Risk Scoring

The scoring engine uses a **hybrid approach**: deterministic scoring for consistency + LLM for explanations.

#### Component Weights

| Component | Weight | Method |
|-----------|--------|--------|
| Skill Match | 35% | TF-IDF vectorization + cosine similarity between resume skills and JD |
| Experience Alignment | 25% | Level matching (junior/mid/senior vs JD requirements) |
| Keyword Density | 20% | Coverage of JD keywords in resume text |
| Embedding Similarity | 20% | Semantic similarity via sentence-transformers (all-MiniLM-L6-v2) |

#### Formula

$$\text{risk\_score} = 1.0 - \sum_{i=1}^{4} w_i \times c_i$$

Where:
- $w_i$ = weight for component $i$
- $c_i$ = normalized component score (0.0 to 1.0)
- Higher risk_score = higher rejection probability

### 8.2 Career Simulation Algorithm

```
1. Fetch current resume skills → original_skills
2. Apply modifications:
   modified = (original_skills + skills_to_add) - skills_to_remove
3. Compute before_metrics = rejection_risk(original_skills, JD)
4. Compute after_metrics = rejection_risk(modified_skills, JD)
5. risk_delta = after.risk_score - before.risk_score
   (negative delta = improvement)
```

### 8.3 Blueprint Generation

```
1. Gather context: current_skills, skill_gaps, target_role, risk_score
2. Build prompt from template (prompt_templates.py)
3. Call GPT-4o with structured output constraints
4. Validate response against Pydantic schema
5. If LLM fails → generate template-based fallback plan
6. Return structured plan with weekly milestones
```

---

## 9. Authentication & Security

### 9.1 Authentication Methods

| Method | Flow |
|--------|------|
| **Local** | Email + password → bcrypt hash → JWT issued |
| **Google OAuth** | GIS → ID token → backend verifies with Google → JWT issued |

### 9.2 JWT Configuration

| Setting | Value |
|---------|-------|
| Algorithm | HS256 |
| Expiration | 60 minutes |
| Secret | 256-bit random key (env var) |
| Payload | `sub` (user_id), `email`, `exp` |

### 9.3 Security Measures

| Measure | Implementation |
|---------|---------------|
| Password Hashing | bcrypt with automatic salt |
| Prompt Injection | Pattern detection on all user text inputs |
| File Validation | Type check (PDF only), size limit (10MB), corruption detection |
| Input Sanitization | HTML/script tag stripping, length limits |
| CORS | Configurable allowed origins |
| SQL Injection | Prevented by SQLAlchemy parameterized queries |
| Rate Limiting | Configurable (production) |

### 9.4 Sensitive Data Handling

| Data | Storage |
|------|---------|
| Passwords | bcrypt-hashed, never stored in plaintext |
| JWT Secret | `.env` file, never committed |
| OpenAI API Key | `.env` file, never committed |
| Google Client ID | `.env` file (non-secret but env-configured) |
| Google Client Secret | Not used in app (ID token flow only) |

---

## 10. Infrastructure & Deployment

### 10.1 Docker Services

```yaml
services:
  db:        postgres:16-alpine    → port 5433:5432
  redis:     redis:7-alpine        → port 6379:6379
  api:       custom Dockerfile     → port 8000:8000
```

### 10.2 Development Setup

```
Frontend:  Vite dev server (port 3000) → proxy to backend
Backend:   Uvicorn (port 8001) → async FastAPI
Database:  Docker PostgreSQL (port 5433)
Cache:     Docker Redis (port 6379)
```

### 10.3 Environment Variables

| Variable | Required | Description |
|----------|----------|-------------|
| `DATABASE_URL` | Yes | PostgreSQL connection string |
| `REDIS_URL` | Yes | Redis connection string |
| `JWT_SECRET_KEY` | Yes | 256-bit secret for JWT signing |
| `OPENAI_API_KEY` | Yes | OpenAI API key for GPT-4o |
| `GOOGLE_CLIENT_ID` | Yes | Google OAuth client ID |
| `VITE_GOOGLE_CLIENT_ID` | Yes | Same client ID exposed to frontend |
| `ENVIRONMENT` | No | development / staging / production |
| `LOG_LEVEL` | No | DEBUG / INFO / WARNING / ERROR |

### 10.4 Health Monitoring

```
GET /api/v1/health → { status, version, environment, database, timestamp }
```

---

## 11. Data Flow Diagrams

### 11.1 Resume Upload Flow

```
User uploads PDF
    → Frontend validates file type (client-side)
    → POST /resume/upload (multipart/form-data)
    → Backend validates: file type, size ≤ 10MB, not corrupted
    → PyPDF2 extracts text
    → GPT-4o structures: skills, experience, education
    → sentence-transformers generates embedding (384-dim)
    → PostgreSQL stores: Resume record + structured JSON
    → Response: ResumeUploadResponse
```

### 11.2 Rejection Analysis Flow

```
User pastes job description
    → POST /analysis/rejection-risk { resume_id, job_description }
    → Prompt injection check on JD text
    → Fetch resume from DB (verify ownership)
    → Deterministic scoring:
        ├── Skill Match (TF-IDF)        → 35%
        ├── Experience Alignment         → 25%
        ├── Keyword Density              → 20%
        └── Embedding Similarity         → 20%
    → Aggregate: risk_score = 1 - Σ(w × c)
    → GPT-4o generates explanation (fail-safe)
    → Save RejectionAnalysis to DB
    → Response: { risk_score, reasons, skill_gaps, component_scores }
```

### 11.3 Blueprint Generation Flow

```
User requests 30-day or 90-day plan
    → POST /blueprint/generate { resume_id, job_description, target_role, plan_type }
    → Validate inputs (prompt injection check)
    → Fetch resume from DB
    → Compute current rejection risk
    → Build prompt from template
    → GPT-4o generates structured plan
    → Validate response schema
    → Fallback to template if LLM fails
    → Save Blueprint to DB
    → Response: { plan_data with weekly milestones }
```

---

## 12. Non-Functional Requirements

### 12.1 Performance

| Metric | Target |
|--------|--------|
| API response (non-LLM) | < 200ms |
| Resume processing | < 30s (includes LLM call) |
| Rejection scoring (deterministic) | < 500ms |
| LLM explanation | < 15s |
| Blueprint generation | < 30s |
| Market radar (cached) | < 100ms |

### 12.2 Scalability

| Layer | Strategy |
|-------|----------|
| Frontend | Static SPA — CDN-deployable |
| Backend | Async FastAPI — horizontal scaling via containers |
| Database | Connection pooling (10 + 20 overflow) |
| Cache | Redis with configurable TTL |
| LLM Calls | Retry with backoff (3 retries, 60s timeout) |

### 12.3 Reliability

| Concern | Mitigation |
|---------|------------|
| LLM downtime | Template-based fallback for blueprints |
| DB connection failure | Health check reports status, graceful startup |
| File corruption | Validation before processing |
| Invalid LLM output | Pydantic schema validation on all LLM responses |

### 12.4 Testing

| Test Suite | Count | Scope |
|-----------|-------|-------|
| `test_api.py` | — | Route-level integration tests |
| `test_resume_processor.py` | — | PDF parsing, LLM extraction |
| `test_rejection_engine.py` | — | Scoring accuracy, edge cases |
| `test_market_radar.py` | — | Data aggregation, caching |
| `test_career_simulation.py` | — | Simulation correctness |
| `test_blueprint_generator.py` | — | Plan generation, fallback |
| `test_security.py` | — | Injection, validation, auth |
| **Total** | **84** | **7 test modules** |

---

## 13. File Structure

```
reBorn_i/
├── .env                          # Environment variables (secrets)
├── .env.example                  # Template for .env
├── .gitignore
├── requirements.txt              # Python dependencies
├── pyproject.toml                # Project metadata
├── README.md                     # Project documentation
├── SYSTEM_DESIGN.md              # This document
│
├── app/                          # Backend application
│   ├── __init__.py
│   ├── main.py                   # FastAPI app factory + lifespan
│   ├── api/
│   │   ├── auth.py               # Auth logic (JWT, bcrypt, Google)
│   │   └── routes.py             # 7 routers, 12+ endpoints
│   ├── config/
│   │   ├── settings.py           # Pydantic Settings
│   │   ├── prompt_templates.py   # LLM prompt templates
│   │   └── scoring_weights.py    # Deterministic scoring config
│   ├── models/
│   │   └── database.py           # 6 SQLAlchemy models
│   ├── schemas/
│   │   └── schemas.py            # 18+ Pydantic schemas
│   ├── services/
│   │   ├── resume_processor.py   # PDF → structured data
│   │   ├── rejection_engine.py   # Risk scoring engine
│   │   ├── market_radar.py       # Skill demand analysis
│   │   ├── career_simulation.py  # What-if engine
│   │   └── blueprint_generator.py # Action plan generator
│   └── utils/
│       ├── database.py           # Async DB session management
│       ├── security.py           # Validation + sanitization
│       ├── exceptions.py         # Custom exception hierarchy
│       └── logging.py            # Structured logging
│
├── frontend/                     # Frontend application
│   ├── .env                      # VITE_GOOGLE_CLIENT_ID
│   ├── index.html                # Entry + GIS script
│   ├── package.json
│   ├── vite.config.ts            # Dev server + proxy config
│   ├── tailwind.config.js
│   ├── tsconfig.json
│   └── src/
│       ├── main.tsx              # React entry point
│       ├── App.tsx               # Router + AuthProvider
│       ├── index.css             # Tailwind imports
│       ├── vite-env.d.ts         # Type declarations
│       ├── api/
│       │   └── client.ts         # Axios instance + API methods
│       ├── context/
│       │   └── AuthContext.tsx    # Global auth state
│       ├── types/
│       │   └── index.ts          # TypeScript interfaces
│       ├── components/
│       │   ├── Layout.tsx        # Main layout with sidebar
│       │   ├── Sidebar.tsx       # Navigation sidebar
│       │   ├── ProtectedRoute.tsx # Auth gate
│       │   ├── GoogleSignInButton.tsx # Google OAuth button
│       │   └── ScoreGauge.tsx    # Risk score visualization
│       └── pages/
│           ├── Login.tsx         # Login page
│           ├── Register.tsx      # Registration page
│           ├── Dashboard.tsx     # Overview dashboard
│           ├── ResumeUpload.tsx  # PDF upload page
│           ├── RejectionAnalysis.tsx # Risk analysis page
│           ├── MarketRadar.tsx   # Market demand page
│           ├── CareerSimulation.tsx # What-if page
│           └── Blueprint.tsx     # Action plan page
│
├── docker/
│   ├── docker-compose.yml        # PostgreSQL + Redis + API
│   └── Dockerfile                # Python app container
│
├── tests/
│   ├── conftest.py               # Shared fixtures
│   ├── test_api.py
│   ├── test_resume_processor.py
│   ├── test_rejection_engine.py
│   ├── test_market_radar.py
│   ├── test_career_simulation.py
│   ├── test_blueprint_generator.py
│   └── test_security.py
│
└── data/
    └── job_market_dataset.json   # Market radar source data
```

---

*reBorn_i — From Rejection to Reinvention.*
