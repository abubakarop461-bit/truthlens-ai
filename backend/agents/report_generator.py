"""
Phase 8 — Forensic Report Generator
TruthLens AI | backend/agents/report_generator.py

Renders a Big-4-quality ESG forensic PDF using WeasyPrint + Jinja2.
Template: backend/templates/report_template.html
"""

from __future__ import annotations

import os
import re
from datetime import datetime
from pathlib import Path
from typing import Dict, List, Optional, Any

from jinja2 import Environment, FileSystemLoader, select_autoescape

try:
    import weasyprint
    _WEASYPRINT_OK = True
except Exception as _e:
    print(f"[report_generator] WeasyPrint unavailable: {_e}")
    _WEASYPRINT_OK = False

# ─────────────────────────────────────────────────────────────────────────────
# Constants
# ─────────────────────────────────────────────────────────────────────────────

TEMPLATES_DIR = Path(__file__).parent.parent / "templates"
REPORTS_DIR   = Path(__file__).parent.parent / "reports"

VAGUE_PHRASES = [
    "committed to", "we aim", "we aspire", "we plan", "working towards",
    "we believe", "we strive", "we hope", "we intend", "in the future",
    "as soon as possible", "ongoing efforts", "exploring options",
    "we are considering", "we are evaluating",
]

# Category color palette
CAT_COLORS = {
    "climate_emissions":  "#4f8ef7",
    "water_waste":        "#34d399",
    "labor_social":       "#a78bfa",
    "governance_ethics":  "#f59e0b",
    "supply_chain":       "#fb7185",
}


# ─────────────────────────────────────────────────────────────────────────────
# Helpers
# ─────────────────────────────────────────────────────────────────────────────

def _verdict_class(label: str) -> str:
    mapping = {
        "HIGH INTEGRITY ✅":       "high-integrity",
        "MODERATE INTEGRITY ⚠️":   "moderate-integrity",
        "LOW INTEGRITY 🔴":        "low-integrity",
        "CRITICAL RISK 🚨":        "critical-risk",
    }
    for key, css in mapping.items():
        if key.split()[0] in label.upper():
            return css
    return "low-integrity"


def _cat_color(score: float) -> str:
    if score >= 75:
        return "#16a34a"
    if score >= 55:
        return "#d97706"
    return "#dc2626"


def _flag_vague(claims: List[Dict]) -> List[Dict]:
    """Return claims that contain vague/aspirational language."""
    flagged = []
    for c in claims:
        text = c.get("claim_text", "").lower()
        if any(phrase in text for phrase in VAGUE_PHRASES):
            flagged.append(c)
    return flagged


def _build_top_findings(contradictions: List[Dict], n: int = 3) -> List[Dict]:
    """Pull top-n CRITICAL/HIGH contradictions formatted for the findings list."""
    priority = [c for c in contradictions if c.get("severity") in ("CRITICAL", "HIGH")]
    priority = sorted(priority, key=lambda x: x.get("contradiction_score", 0), reverse=True)
    findings = []
    for con in priority[:n]:
        reasons = con.get("reasons", [])
        summary = reasons[0] if reasons else (
            f"Semantic conflict between {con['claim_a'].get('source_type', 'source A')} "
            f"and {con['claim_b'].get('source_type', 'source B')}."
        )
        findings.append({
            "severity": con.get("severity", "HIGH"),
            "text":     summary,
            "source":   (
                con["claim_a"].get("source") or
                con["claim_b"].get("source") or
                "Multiple sources"
            ),
        })
    return findings


def _enrich_category_scores(category_scores: List[Dict]) -> List[Dict]:
    """Add color field to each category score dict (for template use)."""
    enriched = []
    for cs in category_scores:
        cs = dict(cs)
        cs["color"] = CAT_COLORS.get(cs["key"], _cat_color(cs["score"]))
        enriched.append(cs)
    return enriched


def _calc_score_parts(adjustments: List[Dict]) -> tuple[float, float]:
    """Return (total_deductions, total_bonuses) from adjustment list."""
    deductions = sum(a["points"] for a in adjustments if a["points"] < 0)
    bonuses    = sum(a["points"] for a in adjustments if a["points"] > 0)
    return round(deductions, 2), round(bonuses, 2)


# ─────────────────────────────────────────────────────────────────────────────
# Core render function
# ─────────────────────────────────────────────────────────────────────────────

def render_report_html(
    score_result:    Dict,
    company_name:    str,
    industry:        str        = "Not specified",
    report_year:     str        = "",
    documents_reviewed: int     = 0,
    extra_claims:    Optional[List[Dict]] = None,
) -> str:
    """
    Render the Jinja2 template to an HTML string.

    Parameters
    ----------
    score_result       : Output of scorer.compute_esg_score()
    company_name       : Company name string
    industry           : Industry / sector label
    report_year        : Year being audited (e.g. "2024")
    documents_reviewed : Count of source documents ingested
    extra_claims       : All extracted claims (used for vague-claims appendix)

    Returns
    -------
    Rendered HTML string ready for WeasyPrint.
    """
    env = Environment(
        loader=FileSystemLoader(str(TEMPLATES_DIR)),
        autoescape=select_autoescape(["html"]),
    )
    template = env.get_template("report_template.html")

    overall_score   = score_result.get("overall_score", 0)
    integrity_label = score_result.get("integrity_label", "")
    contradictions  = score_result.get("top_risk_contradictions", []) or []
    category_scores = score_result.get("category_scores", [])
    adjustments     = score_result.get("adjustments", [])
    recommendations = score_result.get("recommendations", [])
    audit_id        = score_result.get("audit_id", "")
    summary         = score_result.get("summary", "")

    all_claims: List[Dict] = extra_claims or []

    # Filter evidence cards to CRITICAL + HIGH only
    all_contradictions = score_result.get("top_risk_contradictions", [])
    evidence_contradictions = [
        c for c in all_contradictions
        if c.get("severity") in ("CRITICAL", "HIGH")
    ]

    vague_claims = _flag_vague(all_claims)

    context: Dict[str, Any] = {
        # Meta
        "company_name":    company_name,
        "industry":        industry,
        "report_year":     report_year or str(datetime.now().year),
        "audit_date":      datetime.now().strftime("%d %B %Y"),
        "audit_id":        audit_id,
        # Verdict
        "overall_score":   overall_score,
        "integrity_label": integrity_label,
        "verdict_class":   _verdict_class(integrity_label),
        "summary":         summary,
        # Stats
        "total_claims":           score_result.get("total_claims", len(all_claims)),
        "total_contradictions":   score_result.get("total_contradictions", 0),
        "vague_claims_count":     len(vague_claims),
        "documents_reviewed":     documents_reviewed,
        # Findings
        "top_findings":    _build_top_findings(all_contradictions),
        "recommendations": recommendations,
        # Score breakdown
        "category_scores": _enrich_category_scores(category_scores),
        "adjustments":     adjustments,
        # Evidence cards
        "evidence_contradictions": evidence_contradictions,
        # Appendix
        "vague_claims":    vague_claims,
    }

    return template.render(**context)


def generate_pdf(
    score_result:      Dict,
    company_name:      str,
    audit_id:          str,
    industry:          str       = "Not specified",
    report_year:       str       = "",
    documents_reviewed: int      = 0,
    extra_claims:      Optional[List[Dict]] = None,
    output_path:       Optional[str] = None,
) -> str:
    """
    Generate a PDF report and save it to disk.

    Parameters
    ----------
    score_result       : Output of scorer.compute_esg_score()
    company_name       : Company name
    audit_id           : Audit identifier
    industry           : Industry / sector
    report_year        : Year under audit
    documents_reviewed : Number of source docs
    extra_claims       : All extracted claims (for appendix)
    output_path        : Override save path. If None, saves to reports/<audit_id>.pdf

    Returns
    -------
    Absolute path to the generated PDF.
    """
    if not _WEASYPRINT_OK:
        raise RuntimeError(
            "WeasyPrint is not available. Install it with: pip install weasyprint"
        )

    # Ensure output dir exists
    REPORTS_DIR.mkdir(parents=True, exist_ok=True)

    if output_path is None:
        safe_name = re.sub(r"[^a-zA-Z0-9_-]", "_", company_name.lower())[:30]
        filename  = f"truthlens_{safe_name}_{audit_id[:8]}.pdf"
        output_path = str(REPORTS_DIR / filename)

    html_content = render_report_html(
        score_result=score_result,
        company_name=company_name,
        industry=industry,
        report_year=report_year,
        documents_reviewed=documents_reviewed,
        extra_claims=extra_claims,
    )

    # WeasyPrint render
    doc = weasyprint.HTML(string=html_content, base_url=str(TEMPLATES_DIR))
    doc.write_pdf(output_path)

    return output_path
