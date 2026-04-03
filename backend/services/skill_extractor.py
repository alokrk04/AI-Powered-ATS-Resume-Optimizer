"""
Skill Extractor Service
=======================
Extracts skills from text using a combination of:
  1. Curated skill taxonomy (fast, deterministic)
  2. spaCy Named Entity Recognition (if available)
  3. NLTK noun-phrase chunking (fallback)

Used for Skill Gap Analysis: resume skills vs JD skills.
"""

import re
from typing import List, Set
from collections import defaultdict

try:
    import spacy
    nlp = spacy.load("en_core_web_sm")
    SPACY_AVAILABLE = True
except Exception:
    SPACY_AVAILABLE = False

try:
    import nltk
    from nltk import word_tokenize, pos_tag, ne_chunk
    from nltk.chunk import tree2conlltags
    NLTK_AVAILABLE = True
except ImportError:
    NLTK_AVAILABLE = False


# ── Skill Taxonomy ────────────────────────────────────────────────────────────
# Organized by category for richer gap reporting

SKILL_TAXONOMY = {
    "Programming Languages": [
        "python", "javascript", "typescript", "java", "c++", "c#", "go", "golang",
        "rust", "ruby", "php", "swift", "kotlin", "scala", "r", "matlab",
        "perl", "bash", "shell", "powershell", "lua", "haskell", "elixir",
    ],
    "Frontend": [
        "react", "reactjs", "vue", "vuejs", "angular", "next.js", "nextjs",
        "nuxt", "svelte", "html", "css", "sass", "less", "tailwind",
        "bootstrap", "webpack", "vite", "rollup", "parcel", "storybook",
        "redux", "mobx", "zustand", "graphql", "apollo",
    ],
    "Backend & APIs": [
        "node.js", "nodejs", "fastapi", "django", "flask", "express",
        "spring", "spring boot", "rails", "laravel", "asp.net", "nestjs",
        "rest api", "restful", "graphql", "grpc", "websocket", "microservices",
        "serverless", "lambda",
    ],
    "Cloud & DevOps": [
        "aws", "gcp", "azure", "docker", "kubernetes", "k8s", "terraform",
        "ansible", "puppet", "chef", "jenkins", "github actions", "gitlab ci",
        "ci/cd", "argocd", "helm", "istio", "prometheus", "grafana", "datadog",
        "new relic", "nginx", "apache", "linux", "unix",
    ],
    "Databases": [
        "sql", "postgresql", "postgres", "mysql", "sqlite", "oracle", "mssql",
        "mongodb", "dynamodb", "redis", "elasticsearch", "cassandra", "neo4j",
        "bigquery", "snowflake", "redshift", "databricks", "hive",
    ],
    "Data & AI": [
        "pandas", "numpy", "scikit-learn", "sklearn", "tensorflow", "pytorch",
        "keras", "hugging face", "transformers", "llm", "nlp", "computer vision",
        "machine learning", "deep learning", "data analysis", "data science",
        "tableau", "power bi", "looker", "dbt", "airflow", "spark", "hadoop",
        "a/b testing", "statistics", "data visualization",
    ],
    "Security": [
        "cybersecurity", "penetration testing", "owasp", "soc 2", "iso 27001",
        "gdpr", "encryption", "oauth", "jwt", "ssl", "tls", "firewall",
        "vulnerability assessment", "siem",
    ],
    "Project Management": [
        "agile", "scrum", "kanban", "jira", "confluence", "notion", "asana",
        "trello", "linear", "product management", "roadmap", "okrs", "kpis",
        "stakeholder management", "cross-functional", "sprint planning",
    ],
    "Soft Skills": [
        "leadership", "communication", "problem-solving", "critical thinking",
        "collaboration", "mentoring", "coaching", "presentation", "negotiation",
        "project management", "time management",
    ],
}

# Flatten for quick lookup + keep category mapping
_SKILL_TO_CATEGORY: dict = {}
_ALL_SKILLS: Set[str] = set()

for category, skills in SKILL_TAXONOMY.items():
    for skill in skills:
        _SKILL_TO_CATEGORY[skill] = category
        _ALL_SKILLS.add(skill)


class SkillExtractor:

    def extract(self, text: str) -> List[str]:
        """
        Extract all recognizable skills from text.
        Returns deduplicated list, sorted alphabetically.
        """
        text_lower = text.lower()
        found: Set[str] = set()

        # 1. Taxonomy-based matching (exact + partial phrase match)
        for skill in _ALL_SKILLS:
            # Use word boundary matching for single-word skills
            if " " in skill:
                if skill in text_lower:
                    found.add(skill)
            else:
                pattern = rf"\b{re.escape(skill)}\b"
                if re.search(pattern, text_lower):
                    found.add(skill)

        # 2. spaCy entity extraction for org/product names (frameworks, tools)
        if SPACY_AVAILABLE:
            doc = nlp(text[:4000])
            for ent in doc.ents:
                if ent.label_ in ("ORG", "PRODUCT", "GPE"):
                    candidate = ent.text.strip().lower()
                    if candidate in _ALL_SKILLS:
                        found.add(candidate)

        # 3. Regex patterns for version-suffixed skills (react 18, python 3.x)
        versioned = re.findall(
            r"\b(python|node|react|angular|vue|java|kubernetes|terraform)\s*[\d\.]+",
            text_lower,
        )
        found.update(v.strip() for v in versioned)

        return sorted(found)

    def extract_with_categories(self, text: str) -> dict:
        """Returns skills grouped by category."""
        skills = self.extract(text)
        grouped = defaultdict(list)
        for skill in skills:
            cat = _SKILL_TO_CATEGORY.get(skill, "Other")
            grouped[cat].append(skill)
        return dict(grouped)

    def compute_gap(self, resume_text: str, jd_text: str) -> dict:
        """
        Full skill gap report.
        Returns matched, missing, and extra skills with categories.
        """
        resume_skills = set(self.extract(resume_text))
        jd_skills     = set(self.extract(jd_text))

        matched  = sorted(resume_skills & jd_skills)
        missing  = sorted(jd_skills - resume_skills)
        extra    = sorted(resume_skills - jd_skills)   # skills not in JD

        return {
            "matched":  matched,
            "missing":  missing,
            "extra":    extra,
            "coverage": round(len(matched) / max(len(jd_skills), 1) * 100),
        }
