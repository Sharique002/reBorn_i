"""
reBorn_i — Resume Processing Module Tests

Tests for PDF text extraction, cleaning, skill extraction,
and the full processing pipeline.
"""

import pytest

from app.schemas.schemas import ResumeSkill, StructuredResume
from app.services.resume_processor import (
    clean_extracted_text,
    estimate_experience_level,
    extract_contact_info,
    extract_experience_years,
    extract_sections,
    extract_skills,
)
from app.utils.exceptions import PDFExtractionError, ResumeProcessingError


class TestCleanExtractedText:
    """Tests for text cleaning function."""

    def test_removes_null_bytes(self):
        text = "Hello\x00World"
        result = clean_extracted_text(text)
        assert "\x00" not in result

    def test_normalizes_whitespace(self):
        text = "Hello    World"
        result = clean_extracted_text(text)
        assert "Hello World" in result

    def test_handles_empty_string(self):
        result = clean_extracted_text("")
        assert result == ""

    def test_preserves_meaningful_structure(self):
        text = "Line 1\n\nLine 2\nLine 3"
        result = clean_extracted_text(text)
        assert "Line 1" in result
        assert "Line 2" in result
        assert "Line 3" in result

    def test_normalizes_line_endings(self):
        text = "Hello\r\nWorld\rFoo"
        result = clean_extracted_text(text)
        assert "\r" not in result


class TestExtractSkills:
    """Tests for skill extraction."""

    def test_extracts_known_skills(self, sample_resume_text):
        skills = extract_skills(sample_resume_text)
        skill_names = [s.name.lower() for s in skills]
        assert "python" in skill_names
        assert "docker" in skill_names
        assert "aws" in skill_names

    def test_extracts_skills_with_categories(self, sample_resume_text):
        skills = extract_skills(sample_resume_text)
        categories = {s.category for s in skills}
        # Should have multiple categories
        assert len(categories) > 1

    def test_no_duplicates(self, sample_resume_text):
        skills = extract_skills(sample_resume_text)
        names = [s.name.lower() for s in skills]
        assert len(names) == len(set(names))

    def test_empty_text_returns_empty(self):
        skills = extract_skills("")
        assert skills == []

    def test_no_false_positives(self):
        text = "I went to the store and bought some milk."
        skills = extract_skills(text)
        assert len(skills) == 0


class TestExtractExperienceYears:
    """Tests for experience year extraction."""

    def test_direct_mention(self):
        text = "8 years of experience in software development"
        years = extract_experience_years(text)
        assert years == 8.0

    def test_plus_notation(self):
        text = "5+ years of experience"
        years = extract_experience_years(text)
        assert years == 5.0

    def test_no_experience_mentioned(self):
        text = "I like programming and building things."
        years = extract_experience_years(text)
        # Should return None when not determinable
        assert years is None

    def test_multiple_mentions_takes_max(self):
        text = "3 years at Company A. 5 years at Company B."
        years = extract_experience_years(text)
        assert years == 5.0


class TestEstimateExperienceLevel:
    """Tests for experience level estimation."""

    def test_junior_from_years(self):
        level = estimate_experience_level(2.0, "")
        assert level == "mid"

    def test_senior_from_years(self):
        level = estimate_experience_level(7.0, "")
        assert level == "senior"

    def test_senior_from_text(self):
        level = estimate_experience_level(None, "Senior Software Engineer")
        assert level == "senior"

    def test_lead_from_text(self):
        level = estimate_experience_level(None, "Tech Lead at BigCorp")
        assert level == "lead"

    def test_default_to_mid(self):
        level = estimate_experience_level(None, "Software Engineer")
        # No explicit level keywords, no years → default to junior
        assert level == "junior"


class TestExtractContactInfo:
    """Tests for contact info extraction."""

    def test_extracts_email(self):
        text = "Contact me at john@example.com"
        info = extract_contact_info(text)
        assert info["email"] == "john@example.com"

    def test_extracts_phone(self):
        text = "Phone: (555) 123-4567"
        info = extract_contact_info(text)
        assert info["phone"] is not None

    def test_handles_missing_info(self):
        text = "No contact information here"
        info = extract_contact_info(text)
        assert info["email"] is None
        assert info["phone"] is None


class TestExtractSections:
    """Tests for section splitting."""

    def test_identifies_summary_section(self):
        text = "Summary\nExperienced engineer with 10 years of expertise."
        flat, known, other = extract_sections(text)
        assert "summary" in flat

    def test_identifies_experience_section(self):
        text = "Experience\nSenior Engineer at BigCorp"
        flat, known, other = extract_sections(text)
        assert "experience" in flat

    def test_always_has_full_text(self):
        text = "Some resume content"
        flat, known, other = extract_sections(text)
        assert "full_text" in flat
