# ──────────────────────────────────────────────
# reBorn_i — Production Dockerfile
# Multi-stage build for minimal image size
# ──────────────────────────────────────────────
FROM python:3.11-slim as base

# Prevent Python from writing .pyc files and enable unbuffered output
ENV PYTHONDONTWRITEBYTECODE=1 \
    PYTHONUNBUFFERED=1

WORKDIR /app

# ── Stage 1: Dependencies ─────────────────────
FROM base as dependencies

# Install system dependencies
RUN apt-get update && apt-get install -y --no-install-recommends \
    build-essential \
    libpq-dev \
    && rm -rf /var/lib/apt/lists/*

# Copy and install Python dependencies
COPY requirements.txt .
RUN pip install --no-cache-dir --upgrade pip && \
    pip install --no-cache-dir -r requirements.txt

# ── Stage 2: Application ──────────────────────
FROM dependencies as application

# Copy application code
COPY app/ ./app/
COPY data/ ./data/
COPY .env.example .env

# Create non-root user for security
RUN groupadd -r reborn && useradd -r -g reborn -d /app -s /sbin/nologin reborn
RUN chown -R reborn:reborn /app
USER reborn

# Expose API port
EXPOSE 8000

# Health check
HEALTHCHECK --interval=30s --timeout=10s --start-period=15s --retries=3 \
    CMD python -c "import httpx; r = httpx.get('http://localhost:8000/api/v1/health'); r.raise_for_status()" || exit 1

# Start the application
CMD ["uvicorn", "app.main:app", "--host", "0.0.0.0", "--port", "8000", "--workers", "4"]
