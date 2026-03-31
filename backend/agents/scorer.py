"""
Phase 7 — ESG Integrity Scorer
TruthLens AI | backend/agents/scorer.py

Produces:
  • Overall ESG Integrity Score  (0–100)
  • Per-category sub-scores       (0–100 each)
  • Detailed deduction/bonus log
  • Human-readable integrity label

Scoring Logic
─────────────
Start at 100. Apply deductions for contradictions, missing disclosures and
vague claims; apply bonuses for third-party verification and recognised
frameworks. Floor = 0, Ceiling = 100.

Category Scores (0–100 each)
─────────────────────────────
  1. Climate & Emissions
  2. Water & Waste
  3. Labor & Social
  4. Governance & Ethics
  5. Supply Chain & Procurement
"""

from __future__ import annotations

import re
from dataclasses import dataclass, field
from typing import Dict, List, Optional


# ─────────────────────────────────────────────────────────────────────────────
# Score labels
# ─────────────────────────────────────────────────────────────────────────────

INTEGRITY_LABELS: List[tuple] = [
    (85, "HIGH INTEGRITY ✅"),
    (65, "MODERATE INTEGRITY ⚠️"),
    (40, "LOW INTEGRITY 🔴"),
    (0,  "CRITICAL RISK 🚨"),
]


def _label(score: float) -> str:
    for threshold, label in INTEGRITY_LABELS:
        if score >= threshold:
            return label
    return "CRITICAL RISK 🚨"


# ─────────────────────────────────────────────────────────────────────────────
# Keyword banks for category detection
# ─────────────────────────────────────────────────────────────────────────────

CATEGORY_KEYWORDS: Dict[str, List[str]] = {
    "climate_emissions": [
        "emission", "carbon", "co2", "ghg", "greenhouse", "net zero", "carbon neutral",
        "scope 1", "scope 2", "scope 3", "climate", "fossil fuel", "renewable energy",
        "decarbonize", "paris agreement", "sbti", "temperature", "methane",
    ],
    "water_waste": [
        "water", "wastewater", "effluent", "waste", "recycl", "landfill", "circular",
        "pollution", "discharge", "biodiversity", "deforestation", "habitat",
        "ocean", "plastic", "hazardous", "toxic",
    ],
    "labor_social": [
        "labor", "labour", "worker", "employee", "diversity", "inclusion", "gender",
        "pay gap", "human rights", "forced labor", "child labor", "health and safety",
        "injury", "fatality", "union", "living wage", "community", "indigenous",
    ],
    "governance_ethics": [
        "board", "governance", "esg committee", "audit committee", "executive",
        "compensation", "bribery", "corruption", "anti-corruption", "whistleblower",
        "data privacy", "cybersecurity", "tax", "shareholder", "transparency",
        "disclosure", "policy",
    ],
    "supply_chain": [
        "supply chain", "supplier", "vendor", "procurement", "sourcing",
        "third party", "due diligence", "conflict mineral", "raw material",
        "logistics", "transport", "upstream", "downstream", "outsourc",
    ],
}

# Signals that indicate a claim is VAGUE (not specific / not quantified)
VAGUE_PHRASES: List[str] = [
    "committed to", "we aim", "we aspire", "we plan", "working towards",
    "we believe", "we strive", "we hope", "we intend", "in the future",
    "as soon as possible", "ongoing efforts", "exploring options",
    "we are considering", "we are evaluating",
]

# Signals that suggest regulatory contradiction (regulatory body as source)
REGULATORY_SOURCE_TYPES: List[str] = [
    "regulatory_disclosure", "financial_filing",
]

# Signals for third-party / Big-4 verification
BIG4_SIGNALS: List[str] = [
    "deloitte", "pwc", "kpmg", "ernst & young", "ey ", "big 4",
    "third-party verified", "independently verified", "externally assured",
    "assurance report",
]

SBTI_SIGNALS: List[str] = [
    "science based target", "sbti", "science-based target",
    "1.5°c aligned", "well-below 2°c",
]

CDP_A_SIGNALS: List[str] = [
    "cdp a rating", "cdp a-list", "cdp a ", " cdp a,", "rated a by cdp",
]

SCOPE3_FULL_SIGNALS: List[str] = [
    "scope 3 fully", "full scope 3", "all scope 3 categories",
    "15 scope 3", "scope 3 emissions disclosed",
]

SCOPE3_MISSING_SIGNALS: List[str] = [
    "scope 3 not", "excludes scope 3", "scope 3 data not available",
    "scope 3 unavailable", "not including scope 3",
]

VERIFICATION_SIGNALS: List[str] = ["verified", "assured", "audited", "certified"]
INTERIM_MILESTONE_SIGNALS: List[str] = [
    "2025 target", "2026 target", "2027 target", "2028 target", "2029 target",
    "interim milestone", "interim target", "near-term target", "by 2025", "by 2026",
    "by 2027", "by 2028", "by 2029", "short-term goal",
]


# ─────────────────────────────────────────────────────────────────────────────
# Data classes
# ─────────────────────────────────────────────────────────────────────────────

@dataclass
class ScoreAdjustment:
    reason: str
    points: float           # negative = deduction, positive = bonus
    category: str = "overall"


@dataclass
class CategoryScore:
    name: str
    display_name: str
    score: float            # 0-100
    label: str
    claims_count: int
    contradictions_count: int
    deductions: List[ScoreAdjustment] = field(default_factory=list)
    notes: List[str] = field(default_factory=list)


# ─────────────────────────────────────────────────────────────────────────────
# Helpers
# ─────────────────────────────────────────────────────────────────────────────

def _contains_any(text: str, signals: List[str]) -> bool:
    t = text.lower()
    return any(s in t for s in signals)


def _count_containing(texts: List[str], signals: List[str]) -> int:
    return sum(1 for t in texts if _contains_any(t, signals))


def _claims_for_category(claims: List[Dict], category_key: str) -> List[Dict]:
    """Return claims whose text or claim_category matches the given category."""
    keywords = CATEGORY_KEYWORDS.get(category_key, [])
    matched = []
    for c in claims:
        cat = c.get("claim_category", "")
        text = c.get("claim_text", "").lower()
        # Direct category tag match
        if cat and cat.replace(" ", "_") in category_key or category_key in cat:
            matched.append(c)
            continue
        # Keyword match in claim text
        if any(kw in text for kw in keywords):
            matched.append(c)
    return matched


def _contradictions_for_category(
    contradictions: List[Dict], category_key: str
) -> List[Dict]:
    keywords = CATEGORY_KEYWORDS.get(category_key, [])
    matched = []
    for con in contradictions:
        text_a = con.get("claim_a", {}).get("text", "").lower()
        text_b = con.get("claim_b", {}).get("text", "").lower()
        if any(kw in text_a or kw in text_b for kw in keywords):
            matched.append(con)
    return matched


def _all_claim_texts(claims: List[Dict]) -> List[str]:
    return [c.get("claim_text", "") for c in claims]


def _all_source_texts(claims: List[Dict]) -> List[str]:
    return [c.get("source_name", "") + " " + c.get("claim_text", "") for c in claims]


# ─────────────────────────────────────────────────────────────────────────────
# Category scorer
# ─────────────────────────────────────────────────────────────────────────────

_CATEGORY_META = [
    ("climate_emissions",    "Climate & Emissions"),
    ("water_waste",          "Water & Waste"),
    ("labor_social",         "Labor & Social"),
    ("governance_ethics",    "Governance & Ethics"),
    ("supply_chain",         "Supply Chain & Procurement"),
]


def _score_category(
    category_key: str,
    display_name: str,
    all_claims: List[Dict],
    all_contradictions: List[Dict],
) -> CategoryScore:
    """Compute a 0-100 integrity score for one ESG category."""
    cat_claims = _claims_for_category(all_claims, category_key)
    cat_contradictions = _contradictions_for_category(all_contradictions, category_key)

    score = 100.0
    deductions: List[ScoreAdjustment] = []
    notes: List[str] = []

    # ── Contradiction deductions ─────────────────────────────────────────────
    severity_hits = {"CRITICAL": 0, "HIGH": 0, "MEDIUM": 0, "LOW": 0}
    for con in cat_contradictions:
        sev = con.get("severity", "LOW")
        severity_hits[sev] = severity_hits.get(sev, 0) + 1

    deduction_map = {"CRITICAL": -15, "HIGH": -10, "MEDIUM": -6, "LOW": -3}
    for sev, count in severity_hits.items():
        if count > 0:
            pts = deduction_map[sev] * count
            deductions.append(ScoreAdjustment(
                reason=f"{count}× {sev} contradiction(s) in {display_name}",
                points=pts,
                category=category_key,
            ))
            score += pts

    # ── Vague claims deduction ───────────────────────────────────────────────
    cat_texts = _all_claim_texts(cat_claims)
    vague_count = _count_containing(cat_texts, VAGUE_PHRASES)
    if vague_count > 0:
        pts = -1.5 * vague_count
        deductions.append(ScoreAdjustment(
            reason=f"{vague_count} vague/aspirational claim(s) detected",
            points=pts,
            category=category_key,
        ))
        score += pts

    # ── Climate-specific checks ──────────────────────────────────────────────
    if category_key == "climate_emissions":
        all_texts = " ".join(cat_texts).lower()

        if not any(s in all_texts for s in ["scope 3"] + SCOPE3_FULL_SIGNALS):
            deductions.append(ScoreAdjustment(
                reason="No Scope 3 emissions disclosure found",
                points=-8,
                category=category_key,
            ))
            score -= 8
            notes.append("Consider disclosing full Scope 3 inventory across all 15 categories.")
        elif any(s in all_texts for s in SCOPE3_FULL_SIGNALS):
            deductions.append(ScoreAdjustment(
                reason="Scope 3 fully disclosed (bonus)",
                points=+5,
                category=category_key,
            ))
            score += 5
            notes.append("Full Scope 3 disclosure recognised.")

        if not any(s in all_texts for s in INTERIM_MILESTONE_SIGNALS):
            deductions.append(ScoreAdjustment(
                reason="No interim climate milestones or near-term targets detected",
                points=-6,
                category=category_key,
            ))
            score -= 6
            notes.append("Add interim targets (e.g. 2025, 2027) to demonstrate progress.")

        if any(s in all_texts for s in SBTI_SIGNALS):
            deductions.append(ScoreAdjustment(
                reason="Science-Based Targets (SBTi) commitment detected (bonus)",
                points=+8,
                category=category_key,
            ))
            score += 8
            notes.append("SBTi alignment is a strong signal of climate ambition.")

        if any(s in all_texts for s in CDP_A_SIGNALS):
            deductions.append(ScoreAdjustment(
                reason="CDP A-rating detected (bonus)",
                points=+6,
                category=category_key,
            ))
            score += 6

    # ── Regulatory contradiction penalty ─────────────────────────────────────
    regulatory_contradictions = [
        con for con in cat_contradictions
        if (
            con.get("claim_a", {}).get("source_type") in REGULATORY_SOURCE_TYPES
            or con.get("claim_b", {}).get("source_type") in REGULATORY_SOURCE_TYPES
        )
    ]
    if regulatory_contradictions:
        pts = -20 * len(regulatory_contradictions)
        deductions.append(ScoreAdjustment(
            reason=f"{len(regulatory_contradictions)} claim(s) contradicted by regulatory/financial source",
            points=pts,
            category=category_key,
        ))
        score += pts
        notes.append("ALERT: Claims contradicted by regulatory filings carry maximum risk.")

    score = max(0.0, min(100.0, score))
    return CategoryScore(
        name=category_key,
        display_name=display_name,
        score=round(score, 2),
        label=_label(score),
        claims_count=len(cat_claims),
        contradictions_count=len(cat_contradictions),
        deductions=deductions,
        notes=notes,
    )


# ─────────────────────────────────────────────────────────────────────────────
# Overall scorer
# ─────────────────────────────────────────────────────────────────────────────

def compute_esg_score(
    claims: List[Dict],
    contradictions: List[Dict],
    audit_id: str,
    metadata: Optional[Dict] = None,
) -> Dict:
    """
    Compute the ESG Integrity Score for an audit.

    Parameters
    ----------
    claims          : All extracted claim dicts (from ingestion / news_fetcher)
    contradictions  : Output of contradiction.detect_contradictions()["contradictions"]
    audit_id        : Audit identifier
    metadata        : Optional dict with boolean flags for manual signals:
                        {
                          "third_party_audited_big4": bool,
                          "sbti_committed": bool,
                          "cdp_a_rating": bool,
                          "scope3_fully_disclosed": bool,
                        }
                      If None, these are auto-detected from claim texts.

    Returns
    -------
    Full scored report dict.
    """
    metadata = metadata or {}
    adjustments: List[ScoreAdjustment] = []
    score = 100.0

    # ── 1. Contradiction deductions (overall) ────────────────────────────────
    severity_count = {"CRITICAL": 0, "HIGH": 0, "MEDIUM": 0, "LOW": 0}
    for con in contradictions:
        sev = con.get("severity", "LOW")
        severity_count[sev] = severity_count.get(sev, 0) + 1

    deduction_table = {"CRITICAL": -15, "HIGH": -10, "MEDIUM": -6, "LOW": -3}
    severity_labels_text = {
        "CRITICAL": "CRITICAL contradiction(s)", "HIGH": "HIGH contradiction(s)",
        "MEDIUM": "MEDIUM contradiction(s)", "LOW": "LOW contradiction(s)",
    }
    for sev in ["CRITICAL", "HIGH", "MEDIUM", "LOW"]:
        count = severity_count[sev]
        if count:
            pts = deduction_table[sev] * count
            adjustments.append(ScoreAdjustment(
                reason=f"{count}× {severity_labels_text[sev]}",
                points=pts,
            ))
            score += pts

    # ── 2. Vague claims deduction ────────────────────────────────────────────
    all_texts = _all_claim_texts(claims)
    vague_count = _count_containing(all_texts, VAGUE_PHRASES)
    if vague_count:
        pts = -1.5 * vague_count
        adjustments.append(ScoreAdjustment(
            reason=f"{vague_count} vague/aspirational claim(s) (−1.5 pts each)",
            points=pts,
        ))
        score += pts

    # ── 3. Regulatory contradiction penalty ──────────────────────────────────
    reg_contradicted = [
        con for con in contradictions
        if (
            con.get("claim_a", {}).get("source_type") in REGULATORY_SOURCE_TYPES
            or con.get("claim_b", {}).get("source_type") in REGULATORY_SOURCE_TYPES
        )
    ]
    if reg_contradicted:
        pts = -20 * len(reg_contradicted)
        adjustments.append(ScoreAdjustment(
            reason=f"{len(reg_contradicted)} claim(s) contradicted by regulatory/financial source",
            points=pts,
        ))
        score += pts

    # ── 4. Disclosure gap checks (auto-detect or use metadata flags) ─────────
    joint_text = " ".join(all_texts).lower()

    # Scope 3
    scope3_disclosed = metadata.get("scope3_fully_disclosed") or _contains_any(joint_text, SCOPE3_FULL_SIGNALS)
    scope3_missing   = _contains_any(joint_text, SCOPE3_MISSING_SIGNALS)
    if not scope3_disclosed or scope3_missing:
        adjustments.append(ScoreAdjustment(
            reason="No Scope 3 emissions disclosure detected",
            points=-8,
        ))
        score -= 8
    else:
        adjustments.append(ScoreAdjustment(
            reason="Scope 3 fully disclosed (bonus)",
            points=+5,
        ))
        score += 5

    # Third-party verification
    has_verification = (
        metadata.get("third_party_audited_big4")
        or _contains_any(joint_text, BIG4_SIGNALS + VERIFICATION_SIGNALS)
    )
    if not has_verification:
        adjustments.append(ScoreAdjustment(
            reason="No third-party verification or assurance detected",
            points=-10,
        ))
        score -= 10
    else:
        is_big4 = metadata.get("third_party_audited_big4") or _contains_any(joint_text, BIG4_SIGNALS)
        if is_big4:
            adjustments.append(ScoreAdjustment(
                reason="Third-party audited by Big 4 firm (bonus)",
                points=+10,
            ))
            score += 10

    # Interim milestones
    has_milestones = _contains_any(joint_text, INTERIM_MILESTONE_SIGNALS)
    if not has_milestones:
        adjustments.append(ScoreAdjustment(
            reason="No interim milestones or near-term targets detected",
            points=-6,
        ))
        score -= 6

    # ── 5. Bonuses ───────────────────────────────────────────────────────────
    if metadata.get("sbti_committed") or _contains_any(joint_text, SBTI_SIGNALS):
        adjustments.append(ScoreAdjustment(
            reason="Science-Based Targets (SBTi) commitment recognised (bonus)",
            points=+8,
        ))
        score += 8

    if metadata.get("cdp_a_rating") or _contains_any(joint_text, CDP_A_SIGNALS):
        adjustments.append(ScoreAdjustment(
            reason="CDP A-rating detected (bonus)",
            points=+6,
        ))
        score += 6

    # ── 6. Clamp ─────────────────────────────────────────────────────────────
    overall_score = round(max(0.0, min(100.0, score)), 2)

    # ── 7. Category scores ───────────────────────────────────────────────────
    category_scores: List[CategoryScore] = []
    for cat_key, cat_display in _CATEGORY_META:
        cs = _score_category(cat_key, cat_display, claims, contradictions)
        category_scores.append(cs)

    # ── 8. Build output ──────────────────────────────────────────────────────
    total_claims = len(claims)
    total_contradictions = len(contradictions)

    # Highest-risk contradictions (top 3)
    top_risks = sorted(
        contradictions,
        key=lambda x: x.get("contradiction_score", 0),
        reverse=True,
    )[:3]

    # Recommendations
    recommendations = _build_recommendations(adjustments, category_scores, contradictions)

    return {
        "audit_id":            audit_id,
        "overall_score":       overall_score,
        "integrity_label":     _label(overall_score),
        "total_claims":        total_claims,
        "total_contradictions": total_contradictions,
        "severity_breakdown":  severity_count,
        "adjustments": [
            {
                "reason":   a.reason,
                "points":   a.points,
                "category": a.category,
            }
            for a in adjustments
        ],
        "category_scores": [
            {
                "key":                cs.name,
                "display_name":       cs.display_name,
                "score":              cs.score,
                "label":              cs.label,
                "claims_count":       cs.claims_count,
                "contradictions_count": cs.contradictions_count,
                "notes":              cs.notes,
                "adjustments": [
                    {"reason": a.reason, "points": a.points}
                    for a in cs.deductions
                ],
            }
            for cs in category_scores
        ],
        "top_risk_contradictions": top_risks,
        "recommendations":     recommendations,
        "summary": (
            f"ESG Integrity Score: {overall_score}/100 — {_label(overall_score)}. "
            f"Analysed {total_claims} claim(s) across {total_contradictions} "
            f"contradiction pair(s). "
            f"CRITICAL: {severity_count['CRITICAL']}, HIGH: {severity_count['HIGH']}, "
            f"MEDIUM: {severity_count['MEDIUM']}, LOW: {severity_count['LOW']}."
        ),
    }


# ─────────────────────────────────────────────────────────────────────────────
# Recommendation engine
# ─────────────────────────────────────────────────────────────────────────────

def _build_recommendations(
    adjustments: List[ScoreAdjustment],
    category_scores: List[CategoryScore],
    contradictions: List[Dict],
) -> List[Dict]:
    recs: List[Dict] = []

    deducted_reasons = {a.reason for a in adjustments if a.points < 0}

    if any("Scope 3" in r for r in deducted_reasons):
        recs.append({
            "priority": "HIGH",
            "area": "Climate & Emissions",
            "action": "Disclose full Scope 3 GHG inventory across all 15 categories per GHG Protocol.",
            "potential_gain": "+8 pts (deduction removed) + up to +5 pts bonus",
        })

    if any("third-party" in r.lower() or "verification" in r.lower() for r in deducted_reasons):
        recs.append({
            "priority": "HIGH",
            "area": "Assurance",
            "action": "Engage a Big 4 firm or accredited assurance provider for ESG data verification.",
            "potential_gain": "+10 pts (deduction removed) + up to +10 pts bonus",
        })

    if any("interim milestone" in r.lower() for r in deducted_reasons):
        recs.append({
            "priority": "MEDIUM",
            "area": "Target-Setting",
            "action": "Publish near-term milestones (2025–2029) for all material ESG commitments.",
            "potential_gain": "+6 pts",
        })

    if any("vague" in r.lower() for r in deducted_reasons):
        recs.append({
            "priority": "MEDIUM",
            "area": "Disclosure Quality",
            "action": "Replace aspirational language ('committed to', 'we aim to') with quantified, time-bound targets.",
            "potential_gain": "+1.5 pts per resolved vague claim",
        })

    if any("regulatory" in r.lower() for r in deducted_reasons):
        recs.append({
            "priority": "CRITICAL",
            "area": "Regulatory Alignment",
            "action": "Reconcile public ESG claims with regulatory/financial disclosures immediately. "
                      "Contradictions between press releases and SEC/CDP filings expose the company to enforcement risk.",
            "potential_gain": "+20 pts per resolved regulatory contradiction",
        })

    # Lowest-scoring category
    if category_scores:
        worst = min(category_scores, key=lambda cs: cs.score)
        if worst.score < 65:
            recs.append({
                "priority": "MEDIUM",
                "area": worst.display_name,
                "action": f"Focus improvement efforts on '{worst.display_name}' "
                          f"(current score: {worst.score}/100). "
                          f"Address {worst.contradictions_count} contradiction(s) in this pillar first.",
                "potential_gain": "Variable — resolving contradictions in this category has the highest leverage.",
            })

    # SBTi upsell if not present
    has_sbti = not any("SBTi" in r for r in (
        a.reason for a in []  # adjustments with points>0 only — always recommend
    ))
    recs.append({
        "priority": "LOW",
        "area": "Climate Ambition",
        "action": "Commit to Science-Based Targets (SBTi) to unlock +8 pts and signal 1.5°C alignment to investors.",
        "potential_gain": "+8 pts",
    })

    recs.append({
        "priority": "LOW",
        "area": "Climate Ratings",
        "action": "Pursue CDP A-list status through improved climate disclosures and governance.",
        "potential_gain": "+6 pts",
    })

    return recs
