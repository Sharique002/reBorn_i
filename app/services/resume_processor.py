"""
reBorn_i — Resume Processing Module (Service A)

Responsible for:
1. Accepting PDF content (bytes)
2. Extracting raw text from PDF
3. Cleaning and structuring extracted data
4. Identifying skills, experience, and education
5. Outputting a structured JSON (StructuredResume)

Error Handling:
- Corrupted PDFs are caught and reported
- Empty extractions are flagged
- All failures produce meaningful error messages
"""

import io
import re
from typing import Dict, List, Optional, Tuple

import pdfplumber
from PyPDF2 import PdfReader
from PyPDF2.errors import PdfReadError

from app.schemas.schemas import (
    ResumeEducation,
    ResumeExperience,
    ResumeSection,
    ResumeSkill,
    StructuredResume,
)
from app.utils.exceptions import CorruptedFileError, PDFExtractionError, ResumeProcessingError
from app.utils.logging import get_logger
from app.utils.security import sanitize_text

logger = get_logger(__name__)

# ── Known Skills Database ─────────────────────────────────────
# Comprehensive skill list for extraction (lowercase for matching)
KNOWN_SKILLS: Dict[str, str] = {
    # Programming Languages
    "python": "programming",
    "javascript": "programming",
    "typescript": "programming",
    "java": "programming",
    "c++": "programming",
    "c#": "programming",
    "go": "programming",
    "golang": "programming",
    "rust": "programming",
    "ruby": "programming",
    "php": "programming",
    "swift": "programming",
    "kotlin": "programming",
    "scala": "programming",
    "r": "programming",
    "sql": "programming",
    "bash": "programming",
    "shell": "programming",
    "perl": "programming",
    "matlab": "programming",
    # Frameworks & Libraries
    "react": "framework",
    "reactjs": "framework",
    "react.js": "framework",
    "angular": "framework",
    "vue": "framework",
    "vue.js": "framework",
    "vuejs": "framework",
    "next.js": "framework",
    "nextjs": "framework",
    "node.js": "framework",
    "nodejs": "framework",
    "express": "framework",
    "express.js": "framework",
    "django": "framework",
    "flask": "framework",
    "fastapi": "framework",
    "spring": "framework",
    "spring boot": "framework",
    ".net": "framework",
    "asp.net": "framework",
    "rails": "framework",
    "ruby on rails": "framework",
    "laravel": "framework",
    "svelte": "framework",
    "flutter": "framework",
    "react native": "framework",
    "tensorflow": "framework",
    "pytorch": "framework",
    "keras": "framework",
    "scikit-learn": "framework",
    "pandas": "framework",
    "numpy": "framework",
    # Cloud & DevOps
    "aws": "cloud",
    "amazon web services": "cloud",
    "azure": "cloud",
    "gcp": "cloud",
    "google cloud": "cloud",
    "docker": "devops",
    "kubernetes": "devops",
    "k8s": "devops",
    "terraform": "devops",
    "ansible": "devops",
    "jenkins": "devops",
    "ci/cd": "devops",
    "github actions": "devops",
    "gitlab ci": "devops",
    "circleci": "devops",
    "helm": "devops",
    "prometheus": "devops",
    "grafana": "devops",
    # Databases
    "postgresql": "database",
    "postgres": "database",
    "mysql": "database",
    "mongodb": "database",
    "redis": "database",
    "elasticsearch": "database",
    "cassandra": "database",
    "dynamodb": "database",
    "sqlite": "database",
    "oracle": "database",
    "sql server": "database",
    "neo4j": "database",
    # Data & ML
    "machine learning": "data_science",
    "deep learning": "data_science",
    "nlp": "data_science",
    "natural language processing": "data_science",
    "computer vision": "data_science",
    "data science": "data_science",
    "data engineering": "data_science",
    "data analysis": "data_science",
    "etl": "data_science",
    "spark": "data_science",
    "hadoop": "data_science",
    "airflow": "data_science",
    "tableau": "data_science",
    "power bi": "data_science",
    "llm": "data_science",
    "generative ai": "data_science",
    "langchain": "data_science",
    # Tools & Practices
    "git": "tool",
    "jira": "tool",
    "confluence": "tool",
    "figma": "tool",
    "agile": "methodology",
    "scrum": "methodology",
    "kanban": "methodology",
    "tdd": "methodology",
    "test-driven development": "methodology",
    "microservices": "architecture",
    "rest": "architecture",
    "restful": "architecture",
    "graphql": "architecture",
    "grpc": "architecture",
    "api design": "architecture",
    "system design": "architecture",
    # Soft Skills
    "leadership": "soft_skill",
    "communication": "soft_skill",
    "teamwork": "soft_skill",
    "problem solving": "soft_skill",
    "project management": "soft_skill",
    "mentoring": "soft_skill",
    "stakeholder management": "soft_skill",
}

# ── Experience Level Keywords ─────────────────────────────────
# Patterns require job-title context to avoid false positives
# (e.g. "Senior Secondary School" should NOT match "senior")
_TITLE_CONTEXT = (
    r"(?:\s+(?:software|developer|engineer|architect|designer|analyst|manager|"
    r"consultant|administrator|devops|data|ml|ai|full[- ]?stack|back[- ]?end|"
    r"front[- ]?end|qa|test|cloud|product|project|program|technical|system|"
    r"network|security|mobile|web|ui|ux|sre|platform|infrastructure|it|solutions))"
)
EXPERIENCE_LEVEL_PATTERNS = {
    "intern": re.compile(r"\b(intern|internship|trainee)\b", re.IGNORECASE),
    "junior": re.compile(
        r"\b(junior|jr\.?|entry[- ]level|associate)" + _TITLE_CONTEXT + r"?",
        re.IGNORECASE,
    ),
    "mid": re.compile(r"\b(mid[- ]?level|intermediate)\b", re.IGNORECASE),
    "senior": re.compile(
        r"\b(senior|sr\.?)" + _TITLE_CONTEXT, re.IGNORECASE
    ),
    "lead": re.compile(
        r"\b((?:tech|team|engineering)\s+lead|principal"
        + _TITLE_CONTEXT
        + r"?|lead"
        + _TITLE_CONTEXT
        + r")\b",
        re.IGNORECASE,
    ),
}

# ── Year Extraction ───────────────────────────────────────
YEAR_PATTERN = re.compile(
    r"(\d{1,2})\+?\s*(?:years?|yrs?)\s*(?:of\s+)?(?:experience|exp)?",
    re.IGNORECASE,
)
DATE_RANGE_PATTERN = re.compile(
    r"((?:jan|feb|mar|apr|may|jun|jul|aug|sep|oct|nov|dec)[a-z]*\.?\s*\d{4})"
    r"\s*[-–—to]+\s*"
    r"((?:jan|feb|mar|apr|may|jun|jul|aug|sep|oct|nov|dec)[a-z]*\.?\s*\d{4}"
    r"|present|current)",
    re.IGNORECASE,
)

# ── Section Heading Normalization Map ───────────────────────
# Maps many heading variations to a small set of canonical keys.
_SECTION_ALIASES: Dict[str, str] = {
    # summary / objective
    "summary": "summary", "objective": "summary", "profile": "summary",
    "about": "summary", "about me": "summary", "professional summary": "summary",
    "career objective": "summary", "career summary": "summary",
    "personal statement": "summary", "executive summary": "summary",
    # experience
    "experience": "experience", "work experience": "experience",
    "work history": "experience", "employment": "experience",
    "employment history": "experience",
    "professional experience": "experience", "relevant experience": "experience",
    "career history": "experience",
    # education
    "education": "education", "academic": "education",
    "academic background": "education", "qualifications": "education",
    "educational background": "education", "academic qualifications": "education",
    # skills
    "skills": "skills", "technical skills": "skills",
    "competencies": "skills", "technologies": "skills",
    "core competencies": "skills", "key skills": "skills",
    "technical competencies": "skills", "areas of expertise": "skills",
    "tools and technologies": "skills", "programming skills": "skills",
    # certifications
    "certifications": "certifications", "certificates": "certifications",
    "certification": "certifications", "licenses": "certifications",
    "professional certifications": "certifications",
    # projects
    "projects": "projects", "portfolio": "projects",
    "personal projects": "projects", "academic projects": "projects",
    "key projects": "projects",
    # achievements
    "achievements": "achievements", "awards": "achievements",
    "accomplishments": "achievements", "honors": "achievements",
    "awards and honors": "achievements",
    # interests / hobbies
    "interests": "interests", "hobbies": "interests",
    "extracurricular": "interests", "extracurricular activities": "interests",
}
_KNOWN_SECTION_KEYS = {
    "summary", "experience", "education", "skills",
    "certifications", "projects", "achievements", "interests",
}


def extract_text_from_pdf(pdf_content: bytes) -> str:
    """Extract text from PDF bytes using multiple strategies.

    Uses pdfplumber as primary extractor, falls back to PyPDF2.

    Args:
        pdf_content: Raw PDF file bytes.

    Returns:
        Extracted text string.

    Raises:
        CorruptedFileError: If the PDF is corrupted or unreadable.
        PDFExtractionError: If text extraction fails.
    """
    text = ""

    # Strategy 1: pdfplumber (better formatting)
    try:
        with pdfplumber.open(io.BytesIO(pdf_content)) as pdf:
            pages_text = []
            for i, page in enumerate(pdf.pages):
                page_text = page.extract_text()
                if page_text:
                    pages_text.append(page_text)
            text = "\n\n".join(pages_text)
    except Exception as e:
        logger.warning("pdfplumber_failed", error=str(e))

    # Strategy 2: PyPDF2 fallback
    if not text.strip():
        try:
            reader = PdfReader(io.BytesIO(pdf_content))
            pages_text = []
            for page in reader.pages:
                page_text = page.extract_text()
                if page_text:
                    pages_text.append(page_text)
            text = "\n\n".join(pages_text)
        except PdfReadError as e:
            logger.error("pdf_corrupted", error=str(e))
            raise CorruptedFileError(
                message="The PDF file is corrupted and cannot be read.",
                details={"error": str(e)},
            )
        except Exception as e:
            logger.error("pypdf2_failed", error=str(e))
            raise PDFExtractionError(
                message="Failed to extract text from PDF.",
                details={"error": str(e)},
            )

    if not text.strip():
        raise PDFExtractionError(
            message="No text could be extracted from the PDF. The file may be image-based.",
            details={"hint": "Consider using an OCR-capable PDF for better results."},
        )

    logger.info("pdf_text_extracted", text_length=len(text))
    return text


def clean_extracted_text(raw_text: str) -> str:
    """Clean and normalize extracted PDF text.

    Args:
        raw_text: Raw text from PDF extraction.

    Returns:
        Cleaned text string.
    """
    text = sanitize_text(raw_text)

    # Remove common PDF artifacts
    text = re.sub(r"\x0c", "\n", text)  # Form feed
    text = re.sub(r"[\u2022\u2023\u25e6\u2043\u2219]", "•", text)  # Normalize bullets
    text = re.sub(r"_{3,}", "", text)  # Remove long underscores
    text = re.sub(r"-{3,}", "", text)  # Remove long dashes

    # Normalize whitespace while preserving structure
    lines = text.split("\n")
    cleaned_lines = []
    for line in lines:
        stripped = line.strip()
        if stripped:
            cleaned_lines.append(stripped)
        elif cleaned_lines and cleaned_lines[-1] != "":
            cleaned_lines.append("")

    return "\n".join(cleaned_lines)


def extract_skills(text: str) -> List[ResumeSkill]:
    """Extract known skills from resume text.

    Uses a deterministic keyword matching approach against a known skills database.

    Args:
        text: Cleaned resume text.

    Returns:
        List of ResumeSkill objects with name and category.
    """
    text_lower = text.lower()
    found_skills: List[ResumeSkill] = []
    seen: set = set()

    for skill_name, category in KNOWN_SKILLS.items():
        # Use word boundary matching for short skills to avoid false positives
        if len(skill_name) <= 2:
            pattern = rf"\b{re.escape(skill_name)}\b"
            if re.search(pattern, text_lower):
                normalized = skill_name.upper() if len(skill_name) <= 3 else skill_name.title()
                if normalized.lower() not in seen:
                    seen.add(normalized.lower())
                    found_skills.append(
                        ResumeSkill(name=normalized, category=category)
                    )
        else:
            if skill_name in text_lower:
                normalized = skill_name.title()
                if normalized.lower() not in seen:
                    seen.add(normalized.lower())
                    found_skills.append(
                        ResumeSkill(name=normalized, category=category)
                    )

    logger.info("skills_extracted", count=len(found_skills))
    return found_skills


def extract_experience_years(text: str) -> Optional[float]:
    """Extract total years of experience from resume text.

    Args:
        text: Cleaned resume text.

    Returns:
        Estimated years of experience, or None if not determinable.
    """
    # Direct mention: "X years of experience"
    matches = YEAR_PATTERN.findall(text)
    if matches:
        years = [int(m) for m in matches if m.isdigit()]
        if years:
            return float(max(years))

    # Count from date ranges
    date_ranges = DATE_RANGE_PATTERN.findall(text)
    if date_ranges:
        return float(len(date_ranges))  # Rough estimate: each range ≈ 1 position

    return None


def estimate_experience_level(years: Optional[float], text: str) -> str:
    """Estimate experience level from years and title keywords.

    Args:
        years: Extracted years of experience.
        text: Resume text for keyword matching.

    Returns:
        Experience level string.
    """
    # Check for explicit level mentions in text
    for level, pattern in reversed(list(EXPERIENCE_LEVEL_PATTERNS.items())):
        if pattern.search(text):
            return level

    # Fall back to years-based estimation
    if years is None:
        return "junior"  # No experience data → assume entry-level (0-2 years)
    if years <= 0.5:
        return "intern"
    elif years < 2:
        return "junior"
    elif years < 5:
        return "mid"
    elif years < 8:
        return "senior"
    else:
        return "lead"


def _normalize_heading(raw: str) -> Tuple[str, float]:
    """Normalize a heading string to a canonical section key.

    Returns:
        Tuple of (normalized_key, confidence).
    """
    cleaned = raw.strip().rstrip(":")
    lookup = cleaned.lower()
    lookup = re.sub(r"[^a-z ]+", "", lookup).strip()
    lookup = re.sub(r"\s+", " ", lookup)

    if lookup in _SECTION_ALIASES:
        return _SECTION_ALIASES[lookup], 1.0

    # Partial / fuzzy — check if any alias is a substring
    for alias, key in _SECTION_ALIASES.items():
        if alias in lookup or lookup in alias:
            return key, 0.8

    return lookup.replace(" ", "_"), 0.5  # Unknown heading


def _is_heading(line: str) -> Tuple[bool, float, bool]:
    """Detect whether a line is a section heading.

    Returns:
        (is_heading, confidence, is_main_section) tuple.
    """
    stripped = line.strip()
    if not stripped or len(stripped) < 2:
        return False, 0.0, False

    # Skip bullet points
    if stripped[0] in "•-*–":
        return False, 0.0, False

    if len(stripped) > 80:
        return False, 0.0, False

    word_count = len(stripped.rstrip(":").split())
    alpha_only = re.sub(r"[^a-zA-Z ]", "", stripped.rstrip(":")).strip()
    lower = alpha_only.lower()

    # Heuristic 1: Known section aliases (Highest confidence, always a main section)
    if lower in _SECTION_ALIASES:
        return True, 1.0, True

    # Heuristic 2: ALL CAPS short line (High confidence, likely a main section)
    if (
        alpha_only == alpha_only.upper()
        and len(alpha_only) >= 3
        and word_count <= 4
    ):
        return True, 0.9, True

    # Heuristic 3: Title Case short line with colon (Medium confidence, maybe sub-section)
    if (
        word_count <= 6
        and stripped.rstrip(":").istitle()
        and stripped.endswith(":")
    ):
        return True, 0.7, False

    return False, 0.0, False


def extract_sections(text: str) -> Tuple[Dict[str, str], List[ResumeSection], List[ResumeSection]]:
    """Split resume text into logical sections using rule-based heading detection.

    Returns:
        Tuple of:
          - flat dict mapping section key -> content string (backward compat)
          - list of ResumeSection objects with confidence scores
    """
    lines = text.split("\n")

    raw_sections: List[Dict] = []  # [{heading, key, confidence, lines, start}]
    current: Dict = {
        "heading": "header",
        "key": "header",
        "confidence": 1.0,
        "lines": [],
    }

    for line in lines:
        is_head, head_conf, is_main = _is_heading(line)
        if is_head and is_main:
            # Save previous section
            if current["lines"] or current["key"] == "header":
                raw_sections.append(current)
            key, norm_conf = _normalize_heading(line)
            current = {
                "heading": line.strip().rstrip(":"),
                "key": key,
                "confidence": round(head_conf * norm_conf, 2),
                "lines": [],
            }
        else:
            stripped = line.rstrip()
            if stripped:
                current["lines"].append(stripped)

    # Save last section
    if current["lines"]:
        raw_sections.append(current)

    # Build flat dict (backward compat) + ResumeSection list
    flat: Dict[str, str] = {"full_text": text}
    known_sections: List[ResumeSection] = []
    other_sections: List[ResumeSection] = []

    for sec in raw_sections:
        content_str = "\n".join(sec["lines"]).strip()
        if sec["key"] != "header":
            flat[sec["key"]] = content_str
        else:
            flat["header"] = content_str

        section_obj = ResumeSection(
            heading=sec["heading"],
            normalized_key=sec["key"],
            content=sec["lines"],
            confidence=sec["confidence"],
        )

        # Detect nested sub-sections inside experience / education
        if sec["key"] in ("experience", "education") and sec["lines"]:
            section_obj.sub_sections = _detect_sub_sections(sec["lines"])

        if sec["key"] in _KNOWN_SECTION_KEYS or sec["key"] == "header":
            known_sections.append(section_obj)
        else:
            other_sections.append(section_obj)

    return flat, known_sections, other_sections


def _detect_sub_sections(lines: List[str]) -> List[ResumeSection]:
    """Detect nested sub-sections (e.g., job roles inside Experience).

    A sub-section starts with a line that looks like a role title
    (not a bullet, relatively short, possibly contains a date).
    """
    subs: List[ResumeSection] = []
    current_heading: Optional[str] = None
    current_lines: List[str] = []

    title_like = re.compile(
        r"^(?![•\-\*–]).{5,100}$"  # not a bullet, 5-100 chars
    )
    has_date = re.compile(r"\b(?:19|20)\d{2}\b|\b(?:jan|feb|mar|apr|may|jun|jul|aug|sep|oct|nov|dec)", re.IGNORECASE)

    for line in lines:
        stripped = line.strip()
        if not stripped:
            continue

        is_bullet = stripped[0] in "•-*–"
        is_title = (
            title_like.match(stripped)
            and not is_bullet
            and (
                has_date.search(stripped)
                or len(stripped.split()) <= 8
            )
        )

        if is_title and (current_heading is not None or not current_lines):
            # Save previous sub-section
            if current_heading is not None:
                subs.append(ResumeSection(
                    heading=current_heading,
                    normalized_key="entry",
                    content=current_lines,
                    confidence=0.7,
                ))
            current_heading = stripped
            current_lines = []
        else:
            current_lines.append(stripped)

    if current_heading is not None:
        subs.append(ResumeSection(
            heading=current_heading,
            normalized_key="entry",
            content=current_lines,
            confidence=0.7,
        ))

    return subs



def extract_experience_entries(text: str, sections: Dict[str, str]) -> List[ResumeExperience]:
    """Extract experience entries from resume text.

    Parses job titles, companies, durations, and descriptions from the
    experience section.

    Args:
        text: Full cleaned resume text.
        sections: Parsed section dictionary from extract_sections().

    Returns:
        List of ResumeExperience objects.
    """
    experience_text = sections.get("experience", "")
    if not experience_text:
        return []

    entries: List[ResumeExperience] = []

    # Pattern: "Title | Company | Date Range" or "Title at Company (Date)"
    # Common formats:
    #   Senior Engineer | TechCorp | Jan 2020 - Present
    #   Senior Engineer, TechCorp (2020-2023)
    #   Senior Engineer at TechCorp
    entry_pattern = re.compile(
        r"^(.+?)(?:\s*[\|,]\s*|\s+at\s+)(.+?)(?:\s*[\|,]\s*|\s*\(?)("
        r"(?:(?:Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec)[a-z]*\.?\s*\d{4}"
        r"|(?:19|20)\d{2})"
        r"\s*[-–—to]+\s*"
        r"(?:(?:Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec)[a-z]*\.?\s*\d{4}"
        r"|(?:19|20)\d{2}|[Pp]resent|[Cc]urrent)"
        r")\)?",
        re.IGNORECASE | re.MULTILINE,
    )

    # Simpler fallback: lines that look like job titles (capitalized, contains role keywords)
    title_keywords = re.compile(
        r"\b(engineer|developer|manager|analyst|designer|architect|lead|director|"
        r"intern|consultant|specialist|coordinator|administrator|scientist|officer)\b",
        re.IGNORECASE,
    )

    lines = experience_text.split("\n")
    current_entry: Optional[Dict] = None
    description_lines: List[str] = []

    for line in lines:
        stripped = line.strip()
        if not stripped:
            continue

        # Try structured pattern first
        match = entry_pattern.match(stripped)
        if match:
            # Save previous entry
            if current_entry:
                current_entry["description"] = " ".join(description_lines).strip() or None
                entries.append(ResumeExperience(**current_entry))
                description_lines = []

            current_entry = {
                "title": match.group(1).strip(),
                "company": match.group(2).strip().rstrip("(,|"),
                "duration": match.group(3).strip().rstrip(")"),
                "description": None,
                "skills_used": [],
            }
        elif title_keywords.search(stripped) and len(stripped) < 120 and not stripped.startswith(("•", "-", "*")):
            # Looks like a job title line
            if current_entry:
                current_entry["description"] = " ".join(description_lines).strip() or None
                entries.append(ResumeExperience(**current_entry))
                description_lines = []

            # Try to split "Title | Company" or "Title, Company"
            parts = re.split(r"\s*[\|,]\s*", stripped, maxsplit=1)
            current_entry = {
                "title": parts[0].strip(),
                "company": parts[1].strip() if len(parts) > 1 else None,
                "duration": None,
                "description": None,
                "skills_used": [],
            }
        elif current_entry and stripped.startswith(("•", "-", "*", "–")):
            # Bullet point = description
            description_lines.append(stripped.lstrip("•-*– "))

    # Save last entry
    if current_entry:
        current_entry["description"] = " ".join(description_lines).strip() or None
        entries.append(ResumeExperience(**current_entry))

    logger.info("experience_entries_extracted", count=len(entries))
    return entries


def extract_education_entries(text: str, sections: Dict[str, str]) -> List[ResumeEducation]:
    """Extract education entries from resume text.

    Args:
        text: Full cleaned resume text.
        sections: Parsed section dictionary.

    Returns:
        List of ResumeEducation objects.
    """
    education_text = sections.get("education", "")
    if not education_text:
        return []

    entries: List[ResumeEducation] = []

    # Common patterns:
    #   B.S. Computer Science | State University | 2015
    #   Bachelor of Science in Computer Science, MIT (2020)
    #   M.Tech in AI — IIT Delhi, 2023
    degree_pattern = re.compile(
        r"((?:B\.?S\.?|M\.?S\.?|B\.?A\.?|M\.?A\.?|B\.?Tech|M\.?Tech|B\.?E\.?|M\.?E\.?|"
        r"Ph\.?D\.?|MBA|Bachelor|Master|Doctor|Associate|Diploma)"
        r"[^,|\n]*?)"  # Capture degree + field
        r"(?:\s*[\|,—]\s*|\s+(?:from|at)\s+)"
        r"([^,|\n\d]+?)"  # Capture institution
        r"(?:\s*[\|,—(]\s*)"
        r"(\d{4})",  # Capture year
        re.IGNORECASE,
    )

    for match in degree_pattern.finditer(education_text):
        degree_field = match.group(1).strip()
        institution = match.group(2).strip().rstrip("(,|—")
        year = match.group(3).strip()

        # Try to separate degree from field of study
        field_match = re.search(r"\b(?:in|of)\s+(.+)$", degree_field, re.IGNORECASE)
        if field_match:
            degree = degree_field[: field_match.start()].strip()
            field_of_study = field_match.group(1).strip()
        else:
            degree = degree_field
            field_of_study = None

        entries.append(
            ResumeEducation(
                degree=degree or None,
                institution=institution or None,
                year=year or None,
                field_of_study=field_of_study,
            )
        )

    # Fallback: if no structured match, try line-by-line with year detection
    if not entries:
        for line in education_text.split("\n"):
            stripped = line.strip()
            if not stripped:
                continue
            year_match = re.search(r"\b(19|20)\d{2}\b", stripped)
            if year_match and len(stripped) > 10:
                entries.append(
                    ResumeEducation(
                        degree=stripped,
                        institution=None,
                        year=year_match.group(0),
                        field_of_study=None,
                    )
                )

    logger.info("education_entries_extracted", count=len(entries))
    return entries


def extract_certifications_list(text: str, sections: Dict[str, str]) -> List[str]:
    """Extract certifications from resume text.

    Args:
        text: Full cleaned resume text.
        sections: Parsed section dictionary.

    Returns:
        List of certification name strings.
    """
    cert_text = sections.get("certifications", "")
    if not cert_text:
        return []

    certs: List[str] = []
    for line in cert_text.split("\n"):
        stripped = line.strip().lstrip("•-*– ")
        # Filter out empty lines and section headers
        if stripped and len(stripped) > 3 and not re.match(r"^certifications?\s*:?\s*$", stripped, re.IGNORECASE):
            certs.append(stripped)

    logger.info("certifications_extracted", count=len(certs))
    return certs


def extract_contact_info(text: str) -> Dict[str, Optional[str]]:
    """Extract contact information from resume text.

    Note: Email/phone are extracted for structuring only, never logged.

    Args:
        text: Resume text (typically header section).

    Returns:
        Dictionary with email and phone (if found).
    """
    email_match = re.search(r"[\w.+-]+@[\w-]+\.[\w.-]+", text)
    phone_match = re.search(
        r"(?:\+?\d{1,3}[-.\s]?)?\(?\d{3}\)?[-.\s]?\d{3}[-.\s]?\d{4}", text
    )

    return {
        "email": email_match.group(0) if email_match else None,
        "phone": phone_match.group(0) if phone_match else None,
    }


async def process_resume(pdf_content: bytes, filename: str) -> StructuredResume:
    """Main resume processing pipeline.

    Orchestrates the full flow from PDF bytes to structured data.

    Args:
        pdf_content: Raw PDF file content.
        filename: Original filename for logging.

    Returns:
        StructuredResume with all extracted data.

    Raises:
        CorruptedFileError: If PDF is corrupted.
        PDFExtractionError: If text cannot be extracted.
        ResumeProcessingError: If processing pipeline fails.
    """
    logger.info("resume_processing_started", filename=filename)

    try:
        # Step 1: Extract text
        raw_text = extract_text_from_pdf(pdf_content)

        # Step 2: Clean text
        cleaned_text = clean_extracted_text(raw_text)
        if len(cleaned_text) < 50:
            raise ResumeProcessingError(
                message="Extracted text is too short to be a meaningful resume.",
                details={"text_length": len(cleaned_text)},
            )

        # Step 3: Extract sections
        sections, known_sections, other_sections = extract_sections(cleaned_text)

        # Step 4: Extract contact info
        contact = extract_contact_info(sections.get("header", cleaned_text[:500]))

        # Step 5: Extract skills
        skills = extract_skills(cleaned_text)

        # Step 6: Extract experience
        experience_years = extract_experience_years(cleaned_text)
        experience_level = estimate_experience_level(experience_years, cleaned_text)

        # Step 7: Extract experience entries, education, and certifications
        experience_entries = extract_experience_entries(cleaned_text, sections)
        education_entries = extract_education_entries(cleaned_text, sections)
        certifications = extract_certifications_list(cleaned_text, sections)

        # Step 8: Build structured resume
        structured = StructuredResume(
            full_name=None,  # Would require NER for reliable extraction
            email=contact["email"],
            phone=contact["phone"],
            summary=sections.get("summary", None),
            skills=skills,
            experience=experience_entries,
            education=education_entries,
            certifications=certifications,
            total_experience_years=experience_years,
            experience_level=experience_level,
            sections=known_sections,
            other_sections=other_sections,
        )

        logger.info(
            "resume_processing_complete",
            filename=filename,
            skills_count=len(skills),
            experience_years=experience_years,
            experience_level=experience_level,
        )

        return structured

    except (CorruptedFileError, PDFExtractionError, ResumeProcessingError):
        raise
    except Exception as e:
        logger.error("resume_processing_failed", filename=filename, error=str(e))
        raise ResumeProcessingError(
            message=f"Resume processing failed: {str(e)}",
            details={"filename": filename, "error_type": type(e).__name__},
        )
