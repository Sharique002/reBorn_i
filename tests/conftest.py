"""
reBorn_i — Test Fixtures & Configuration

Provides shared fixtures for all test modules.
"""

import asyncio
from typing import AsyncGenerator, Generator

import pytest
import pytest_asyncio
from httpx import ASGITransport, AsyncClient

from app.config.settings import Settings


@pytest.fixture(scope="session")
def event_loop() -> Generator:
    """Create a session-scoped event loop for async tests."""
    loop = asyncio.new_event_loop()
    yield loop
    loop.close()


@pytest.fixture
def test_settings() -> Settings:
    """Provide test-specific settings."""
    return Settings(
        DATABASE_URL="sqlite+aiosqlite:///test.db",
        JWT_SECRET_KEY="test_secret_key_minimum_16_chars",
        OPENAI_API_KEY="test-key-not-real",
        ENVIRONMENT="development",
        DEBUG=True,
        LOG_LEVEL="DEBUG",
    )


@pytest.fixture
def sample_resume_text() -> str:
    """Provide a sample resume text for testing."""
    return """
    John Doe
    john.doe@email.com | (555) 123-4567

    Summary
    Senior Software Engineer with 8 years of experience in Python, cloud architecture,
    and distributed systems. Expertise in building scalable microservices.

    Experience
    Senior Software Engineer | TechCorp Inc. | Jan 2020 - Present
    - Built and maintained microservices using Python, FastAPI, and Docker
    - Designed cloud infrastructure on AWS using Terraform and Kubernetes
    - Led a team of 5 engineers in agile environment
    - Implemented CI/CD pipelines using GitHub Actions

    Software Engineer | StartupXYZ | Mar 2017 - Dec 2019
    - Developed REST APIs using Python and Django
    - Managed PostgreSQL databases and Redis caching
    - Contributed to React frontend components

    Junior Developer | WebAgency | Jun 2015 - Feb 2017
    - Built web applications using JavaScript and React
    - Wrote unit tests and integration tests

    Skills
    Python, FastAPI, Django, JavaScript, React, Docker, Kubernetes, AWS,
    Terraform, PostgreSQL, Redis, Git, CI/CD, Microservices, Agile, REST

    Education
    B.S. Computer Science | State University | 2015

    Certifications
    AWS Solutions Architect Associate
    """


@pytest.fixture
def sample_job_description() -> str:
    """Provide a sample job description for testing."""
    return """
    Senior Backend Engineer

    We are looking for a Senior Backend Engineer to join our platform team.

    Requirements:
    - 5+ years of experience in backend development
    - Proficient in Python and Go
    - Experience with Docker and Kubernetes
    - Strong knowledge of PostgreSQL and Redis
    - Experience with AWS cloud services
    - Familiarity with microservices architecture
    - Experience with CI/CD pipelines
    - Strong communication skills
    - Experience with GraphQL is a plus
    - Knowledge of machine learning basics is preferred

    Responsibilities:
    - Design and build scalable backend services
    - Optimize database queries and caching strategies
    - Mentor junior engineers
    - Participate in code reviews and architectural discussions
    - On-call rotation for production systems
    """
