"""
reBorn_i — Root Entry Point

Provides a lightweight entry point for Render deployment.
Supports: uvicorn main:app --host 0.0.0.0 --port 10000
"""

from app.main import app  # noqa: F401

# Root-level endpoints are registered in app/main.py
# This file simply re-exports the app instance for uvicorn compatibility.
