"""
ATS-Compliant PDF Generator
============================
Generates clean, ATS-parseable PDF resumes using ReportLab.

ATS PDF Rules:
  - Single-column layout (no text boxes / frames)
  - Standard fonts: Helvetica (safe) or Times New Roman
  - No headers/footers with complex content
  - Text must be selectable (no image-embedded text)
  - Logical reading order (top → bottom, left → right)
  - File size < 2MB recommended
"""

import re
from typing import List, Optional

try:
    from reportlab.lib.pagesizes import LETTER
    from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle
    from reportlab.lib.units import inch
    from reportlab.lib.colors import HexColor, black, grey
    from reportlab.platypus import (
        SimpleDocTemplate, Paragraph, Spacer, HRFlowable, KeepTogether
    )
    from reportlab.lib.enums import TA_LEFT, TA_CENTER
    REPORTLAB_AVAILABLE = True
except ImportError:
    REPORTLAB_AVAILABLE = False


# ── Style Constants ───────────────────────────────────────────────────────────
FONT_NAME   = "Helvetica"
FONT_BOLD   = "Helvetica-Bold"
COLOR_BLACK = HexColor("#1a1a1a") if REPORTLAB_AVAILABLE else None
COLOR_GREY  = HexColor("#555555") if REPORTLAB_AVAILABLE else None
COLOR_LINE  = HexColor("#cccccc") if REPORTLAB_AVAILABLE else None

SECTION_HEADERS = {
    "work experience", "experience", "professional experience",
    "education", "academic background",
    "skills", "technical skills", "core competencies",
    "summary", "objective", "professional summary",
    "certifications", "projects", "publications", "awards",
    "volunteer", "languages",
}


class ResumePDFGenerator:

    def generate(self, resume_text: str, output_path: str) -> None:
        """
        Parse the plain-text resume and render it as an ATS-compliant PDF.
        """
        if not REPORTLAB_AVAILABLE:
            raise RuntimeError(
                "reportlab is not installed. Run: pip install reportlab"
            )

        doc = SimpleDocTemplate(
            output_path,
            pagesize=LETTER,
            rightMargin=0.75 * inch,
            leftMargin=0.75 * inch,
            topMargin=0.75 * inch,
            bottomMargin=0.75 * inch,
        )

        styles = self._build_styles()
        story  = self._build_story(resume_text, styles)
        doc.build(story)

    # ── Style Definitions ─────────────────────────────────────────────────────

    def _build_styles(self) -> dict:
        base = getSampleStyleSheet()
        return {
            "name": ParagraphStyle(
                "Name",
                fontName=FONT_BOLD,
                fontSize=18,
                leading=22,
                textColor=COLOR_BLACK,
                alignment=TA_CENTER,
                spaceAfter=4,
            ),
            "contact": ParagraphStyle(
                "Contact",
                fontName=FONT_NAME,
                fontSize=9,
                leading=12,
                textColor=COLOR_GREY,
                alignment=TA_CENTER,
                spaceAfter=8,
            ),
            "section_header": ParagraphStyle(
                "SectionHeader",
                fontName=FONT_BOLD,
                fontSize=11,
                leading=14,
                textColor=COLOR_BLACK,
                spaceBefore=10,
                spaceAfter=3,
            ),
            "body": ParagraphStyle(
                "Body",
                fontName=FONT_NAME,
                fontSize=10,
                leading=14,
                textColor=COLOR_BLACK,
                spaceAfter=2,
            ),
            "bullet": ParagraphStyle(
                "Bullet",
                fontName=FONT_NAME,
                fontSize=10,
                leading=14,
                textColor=COLOR_BLACK,
                leftIndent=14,
                spaceAfter=2,
            ),
            "job_title": ParagraphStyle(
                "JobTitle",
                fontName=FONT_BOLD,
                fontSize=10,
                leading=13,
                textColor=COLOR_BLACK,
                spaceAfter=1,
            ),
            "date": ParagraphStyle(
                "Date",
                fontName=FONT_NAME,
                fontSize=9,
                leading=12,
                textColor=COLOR_GREY,
                spaceAfter=2,
            ),
        }

    # ── Story Builder ─────────────────────────────────────────────────────────

    def _build_story(self, text: str, styles: dict) -> List:
        story   = []
        lines   = [ln.rstrip() for ln in text.splitlines()]
        i       = 0
        in_header = True   # first lines are likely name + contact

        while i < len(lines):
            line = lines[i].strip()

            if not line:
                i += 1
                continue

            # ── Header block (name + contact info at top) ──────────────────
            if in_header:
                if self._is_section_header(line):
                    in_header = False
                elif i == 0:
                    story.append(Paragraph(self._escape(line), styles["name"]))
                    i += 1
                    continue
                elif self._looks_like_contact(line):
                    story.append(Paragraph(self._escape(line), styles["contact"]))
                    i += 1
                    continue
                else:
                    in_header = False   # fall through to body parsing

            # ── Section header ─────────────────────────────────────────────
            if self._is_section_header(line):
                story.append(Spacer(1, 4))
                story.append(Paragraph(line.upper(), styles["section_header"]))
                story.append(HRFlowable(
                    width="100%", thickness=0.5,
                    color=COLOR_LINE, spaceAfter=4,
                ))
                i += 1
                continue

            # ── Bullet point ───────────────────────────────────────────────
            if self._is_bullet(line):
                clean = re.sub(r"^[-•▪►◆✓\*]\s*", "", line)
                story.append(Paragraph(f"• {self._escape(clean)}", styles["bullet"]))
                i += 1
                continue

            # ── Job title line (bold, short, no period) ────────────────────
            if self._looks_like_job_title(line):
                story.append(Paragraph(self._escape(line), styles["job_title"]))
                i += 1
                continue

            # ── Date range line ────────────────────────────────────────────
            if self._looks_like_date(line):
                story.append(Paragraph(self._escape(line), styles["date"]))
                i += 1
                continue

            # ── Default body text ──────────────────────────────────────────
            story.append(Paragraph(self._escape(line), styles["body"]))
            i += 1

        return story

    # ── Classifiers ───────────────────────────────────────────────────────────

    def _is_section_header(self, line: str) -> bool:
        return line.lower().strip() in SECTION_HEADERS

    def _is_bullet(self, line: str) -> bool:
        return bool(re.match(r"^[-•▪►◆✓\*]\s+", line))

    def _looks_like_contact(self, line: str) -> bool:
        return bool(re.search(
            r"(@|\bphone\b|\blinkedin\b|\bgithub\b|\d{3}[-.\s]\d{3}[-.\s]\d{4})",
            line, re.IGNORECASE,
        ))

    def _looks_like_job_title(self, line: str) -> bool:
        return (
            len(line.split()) <= 8
            and not line.endswith(".")
            and not re.search(r"\d{4}", line)
            and not self._is_bullet(line)
        )

    def _looks_like_date(self, line: str) -> bool:
        return bool(re.search(
            r"\b(19|20)\d{2}\b.*(present|current|\b(19|20)\d{2}\b)",
            line, re.IGNORECASE,
        ))

    def _escape(self, text: str) -> str:
        """Escape ReportLab XML special characters."""
        return (
            text.replace("&", "&amp;")
                .replace("<", "&lt;")
                .replace(">", "&gt;")
        )
