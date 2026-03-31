"""
Phase 6 — Contradiction Detection Engine
TruthLens AI | backend/agents/contradiction.py

Detects contradictions between ESG claims extracted from different document
sources (press releases, sustainability reports, financial filings, news,
regulatory disclosures) using:
  1. Semantic similarity via sentence-transformers
  2. Category-aware contradiction rules
  3. Quantified claim cross-checking
  4. Source credibility weighting
"""

import re
import uuid
import json
import os
from itertools import combinations
from typing import List, Dict, Optional, Tuple

import numpy as np

# ── Lazy import so the module still loads even without GPU / heavy deps ──────
try:
    from sentence_transformers import SentenceTransformer, util as st_util
    _EMBED_MODEL = SentenceTransformer("all-MiniLM-L6-v2")
    _EMBEDDING_AVAILABLE = True
except Exception as _e:
    print(f"[contradiction] Warning: sentence-transformers unavailable → "
          f"falling back to keyword mode. ({_e})")
    _EMBED_MODEL = None
    _EMBEDDING_AVAILABLE = False


# ─────────────────────────────────────────────────────────────────────────────
# Constants
# ─────────────────────────────────────────────────────────────────────────────

# Minimum cosine similarity for two claims to be compared semantically
SEMANTIC_SIMILARITY_THRESHOLD = 0.55

# If positive/negative polarity signals are BOTH above this count → contradiction
KEYWORD_CONFLICT_MIN = 1

# Source credibility tiers (higher = more authoritative)
SOURCE_CREDIBILITY: Dict[str, float] = {
    "financial_filing":       1.00,   # SEC 10-K, annual report
    "regulatory_disclosure":  0.95,   # CDP, regulator filings
    "sustainability_report":  0.70,   # Self-published ESG reports
    "press_release":          0.55,   # Company PR
    "news_article":           0.75,   # Third-party journalism
}

# Greenwashing signal keywords mapped to polarity
POSITIVE_SIGNALS = [
    "carbon neutral", "net zero", "100% renewable", "zero emissions",
    "committed to", "achieved", "reduced by", "offset", "compliant",
    "sustainable", "green", "clean energy", "no fossil", "decarbonized",
]

NEGATIVE_SIGNALS = [
    "fossil fuel", "coal", "oil", "gas capex", "carbon emissions",
    "fine", "penalty", "lawsuit", "violation", "greenwashing",
    "underreported", "misleading", "failed", "exceeds limit",
    "non-compliant", "environmental liability",
]

# Category pairs that are semantically opposing by nature
OPPOSING_CATEGORY_PAIRS = {
    frozenset({"emissions", "emissions"}),      # same cat, opposing polarity
    frozenset({"sustainability_report", "regulatory_disclosure"}),
}


# ─────────────────────────────────────────────────────────────────────────────
# Helpers
# ─────────────────────────────────────────────────────────────────────────────

def _count_signals(text: str, signals: List[str]) -> int:
    """Count how many signal phrases appear in the given text (case-insensitive)."""
    t = text.lower()
    return sum(1 for s in signals if s in t)

def _load_red_flags() -> List[Dict]:
    """Load the ESG Red Flags heuristics database."""
    db_path = os.path.join(os.path.dirname(__file__), "..", "data", "esg_red_flags.json")
    try:
        if os.path.exists(db_path):
            with open(db_path, "r", encoding="utf-8") as f:
                return json.load(f)
    except Exception as e:
        print(f"[contradiction] Failed to load red flags db: {e}")
    return []


def _extract_numbers(text: str) -> List[float]:
    """Pull all standalone numeric values (incl. percentages, $ amounts) from text."""
    raw = re.findall(r"[\$]?\d+(?:\.\d+)?(?:\s*(?:million|billion|%|tonnes|kt|mt))?",
                     text, re.IGNORECASE)
    nums = []
    for r in raw:
        clean = re.sub(r"[^\d.]", "", r)
        try:
            nums.append(float(clean))
        except ValueError:
            pass
    return nums


def _source_credibility(doc_type: str) -> float:
    return SOURCE_CREDIBILITY.get(doc_type, 0.60)


def _compute_semantic_similarity(text_a: str, text_b: str) -> float:
    """Return cosine similarity in [0, 1]. Falls back to 0.0 if embeddings unavailable."""
    if not _EMBEDDING_AVAILABLE or _EMBED_MODEL is None:
        return 0.0
    emb = _EMBED_MODEL.encode([text_a, text_b], convert_to_tensor=True)
    score = float(st_util.cos_sim(emb[0], emb[1]))
    return max(0.0, score)


def _polarity_contradiction(claim_a: Dict, claim_b: Dict) -> Tuple[bool, str]:
    """
    Returns (is_contradiction, reason) based on keyword polarity analysis.
    A contradiction is flagged when one claim is strongly positive and the
    other is strongly negative on the same ESG topic.
    """
    pos_a = _count_signals(claim_a["claim_text"], POSITIVE_SIGNALS)
    neg_a = _count_signals(claim_a["claim_text"], NEGATIVE_SIGNALS)
    pos_b = _count_signals(claim_b["claim_text"], POSITIVE_SIGNALS)
    neg_b = _count_signals(claim_b["claim_text"], NEGATIVE_SIGNALS)

    a_is_positive = pos_a > neg_a and pos_a >= KEYWORD_CONFLICT_MIN
    a_is_negative = neg_a > pos_a and neg_a >= KEYWORD_CONFLICT_MIN
    b_is_positive = pos_b > neg_b and pos_b >= KEYWORD_CONFLICT_MIN
    b_is_negative = neg_b > pos_b and neg_b >= KEYWORD_CONFLICT_MIN

    if a_is_positive and b_is_negative:
        return True, (
            f"Claim A ({claim_a['source_type']}) makes positive ESG assertion "
            f"while Claim B ({claim_b['source_type']}) signals negative outcome/violation."
        )
    if a_is_negative and b_is_positive:
        return True, (
            f"Claim A ({claim_a['source_type']}) signals violation/negative outcome "
            f"while Claim B ({claim_b['source_type']}) makes positive ESG assertion."
        )
    return False, ""


def _quantitative_contradiction(claim_a: Dict, claim_b: Dict) -> Tuple[bool, str]:
    """
    Flags a contradiction when both claims are quantified but their numeric
    values differ significantly (> 20% relative delta) on the same category.
    """
    if not (claim_a.get("is_quantified") and claim_b.get("is_quantified")):
        return False, ""
    if claim_a.get("claim_category") != claim_b.get("claim_category"):
        return False, ""

    nums_a = _extract_numbers(claim_a["claim_text"])
    nums_b = _extract_numbers(claim_b["claim_text"])

    if not nums_a or not nums_b:
        return False, ""

    val_a = max(nums_a)
    val_b = max(nums_b)

    if val_a == 0 and val_b == 0:
        return False, ""

    delta = abs(val_a - val_b) / max(abs(val_a), abs(val_b), 1e-9)

    if delta > 0.20:
        return True, (
            f"Quantified values diverge significantly: "
            f"{val_a} ({claim_a['source_type']}) vs {val_b} ({claim_b['source_type']}) "
            f"— {delta*100:.1f}% relative difference on category '{claim_a['claim_category']}'."
        )
    return False, ""


def _score_contradiction(
    claim_a: Dict,
    claim_b: Dict,
    semantic_sim: float,
    polarity_flag: bool,
    quant_flag: bool,
) -> float:
    """
    Composite risk score in [0, 1].
    Weights: semantic relevance (0.3) + polarity conflict (0.4)
             + quantitative conflict (0.2) + source credibility gap (0.1)
    """
    sem_score = semantic_sim  # already in [0,1]

    pol_score = 1.0 if polarity_flag else 0.0
    quant_score = 1.0 if quant_flag else 0.0

    cred_a = _source_credibility(claim_a.get("source_type", ""))
    cred_b = _source_credibility(claim_b.get("source_type", ""))
    # Larger credibility gap → higher concern
    cred_gap = abs(cred_a - cred_b)

    score = (
        0.30 * sem_score
        + 0.40 * pol_score
        + 0.20 * quant_score
        + 0.10 * cred_gap
    )
    return round(min(score, 1.0), 4)


def _severity_label(score: float) -> str:
    if score >= 0.75:
        return "CRITICAL"
    if score >= 0.50:
        return "HIGH"
    if score >= 0.30:
        return "MEDIUM"
    return "LOW"


# ─────────────────────────────────────────────────────────────────────────────
# Core public API
# ─────────────────────────────────────────────────────────────────────────────

def detect_contradictions(
    claims: List[Dict],
    audit_id: str,
    min_score: float = 0.25,
) -> Dict:
    """
    Cross-compare all extracted claims to surface ESG contradictions.

    Parameters
    ----------
    claims      : List of claim dicts produced by ingestion.extract_claims()
                  or news_fetcher.fetch_news()
    audit_id    : Audit identifier string
    min_score   : Minimum composite score to include in results (default 0.25)

    Returns
    -------
    {
        "audit_id": str,
        "contradictions_found": int,
        "greenwashing_risk_score": float,   # overall [0-1]
        "risk_label": str,                  # CRITICAL / HIGH / MEDIUM / LOW
        "contradictions": [ ... ],
        "summary": str,
    }
    """
    contradictions: List[Dict] = []

    # Deduplicate — skip identical claim texts
    seen_texts = set()
    unique_claims = []
    for c in claims:
        txt = c.get("claim_text", "").strip()
        if txt and txt not in seen_texts:
            seen_texts.add(txt)
            unique_claims.append(c)

    pairs = list(combinations(unique_claims, 2))

    for claim_a, claim_b in pairs:
        # Skip if same source document (intra-document consistency is a
        # separate concern; we want CROSS-source contradictions)
        if claim_a.get("source_name") == claim_b.get("source_name"):
            continue

        # 1. Semantic similarity gate
        sim = _compute_semantic_similarity(
            claim_a["claim_text"], claim_b["claim_text"]
        )

        # If embeddings unavailable OR similarity is non-trivial, proceed
        if _EMBEDDING_AVAILABLE and sim < SEMANTIC_SIMILARITY_THRESHOLD:
            continue

        # 2. Polarity & quantitative contradiction checks
        pol_flag, pol_reason = _polarity_contradiction(claim_a, claim_b)
        quant_flag, quant_reason = _quantitative_contradiction(claim_a, claim_b)

        if not pol_flag and not quant_flag:
            continue

        # 3. Composite score
        score = _score_contradiction(claim_a, claim_b, sim, pol_flag, quant_flag)
        if score < min_score:
            continue

        reasons = []
        if pol_reason:
            reasons.append(pol_reason)
        if quant_reason:
            reasons.append(quant_reason)

        contradictions.append({
            "contradiction_id": str(uuid.uuid4()),
            "audit_id": audit_id,
            "claim_a": {
                "claim_id":   claim_a.get("claim_id"),
                "text":       claim_a["claim_text"],
                "source":     claim_a.get("source_name"),
                "source_type": claim_a.get("source_type"),
                "category":   claim_a.get("claim_category"),
                "is_quantified": claim_a.get("is_quantified", False),
            },
            "claim_b": {
                "claim_id":   claim_b.get("claim_id"),
                "text":       claim_b["claim_text"],
                "source":     claim_b.get("source_name"),
                "source_type": claim_b.get("source_type"),
                "category":   claim_b.get("claim_category"),
                "is_quantified": claim_b.get("is_quantified", False),
            },
            "semantic_similarity": round(sim, 4),
            "polarity_conflict":   pol_flag,
            "quantitative_conflict": quant_flag,
            "contradiction_score": score,
            "severity":            _severity_label(score),
            "reasons":             reasons,
        })

    # ── Synthetic Heuristic Red Flags ───────────────────────────────────────
    # Append standalone heuristic red flags as synthetic contradictions
    red_flags_db = _load_red_flags()
    for claim in claims:
        text = claim.get("claim_text", "").lower()
        if not text:
             continue
        for rf in red_flags_db:
             triggers = rf.get("trigger_phrases", [])
             if any(t.lower() in text for t in triggers):
                 score_val = 0.95 if rf.get("severity", "").upper() == "CRITICAL" else 0.85 if rf.get("severity", "").upper() == "HIGH" else 0.65
                 
                 # Check if we already flagged this exact pattern for this claim
                 duplicate = False
                 for c in contradictions:
                     if c["claim_a"].get("claim_id") == claim.get("claim_id") and c["claim_b"].get("claim_id") == rf.get("pattern_id"):
                         duplicate = True
                         break
                 if duplicate:
                     continue
                 
                 contradictions.append({
                     "contradiction_id": f"rf-{uuid.uuid4().hex[:8]}",
                     "audit_id":         audit_id,
                     "claim_a": {
                         "claim_id":   claim.get("claim_id"),
                         "text":       claim["claim_text"],
                         "source":     claim.get("source_name"),
                         "source_type": claim.get("source_type"),
                         "category":   claim.get("claim_category"),
                         "is_quantified": claim.get("is_quantified", False),
                     },
                     "claim_b": {
                         "claim_id":   rf.get("pattern_id"),
                         "text":       f"ESG Red Flag: {rf.get('pattern_name')}. {rf.get('red_flag_condition')}",
                         "source":     rf.get("regulatory_reference", "Greenwashing Database"),
                         "source_type": "heuristic_database",
                         "category":   rf.get("category", "governance"),
                         "is_quantified": False,
                     },
                     "semantic_similarity": 1.0,
                     "polarity_conflict":   True,
                     "quantitative_conflict": False,
                     "contradiction_score": score_val,
                     "severity":            rf.get("severity", "MEDIUM").upper(),
                     "reasons":             [rf.get("plain_english_explanation", "Claim triggered a known greenwashing heuristic phrase.")],
                 })

    # Sort by score descending
    contradictions.sort(key=lambda x: x["contradiction_score"], reverse=True)

    # Overall audit-level greenwashing risk = mean of top-5 scores (or all)
    top_scores = [c["contradiction_score"] for c in contradictions[:5]]
    overall_risk = round(float(np.mean(top_scores)), 4) if top_scores else 0.0
    risk_label = _severity_label(overall_risk)

    # Human-readable summary
    n = len(contradictions)
    critical = sum(1 for c in contradictions if c["severity"] == "CRITICAL")
    high     = sum(1 for c in contradictions if c["severity"] == "HIGH")

    if n == 0:
        summary = "No significant contradictions detected across the provided claims."
    else:
        summary = (
            f"Detected {n} contradiction(s) across claim sources. "
            f"{critical} CRITICAL and {high} HIGH severity conflicts found. "
            f"Overall greenwashing risk score: {overall_risk} ({risk_label}). "
            "Review CRITICAL items first for potential greenwashing or disclosure fraud."
        )

    return {
        "audit_id":               audit_id,
        "contradictions_found":   n,
        "greenwashing_risk_score": overall_risk,
        "risk_label":             risk_label,
        "contradictions":         contradictions,
        "summary":                summary,
    }


def detect_contradictions_from_news_result(
    news_result: Dict,
    audit_id: str,
    min_score: float = 0.25,
) -> Dict:
    """
    Convenience wrapper: accepts the dict returned by fetch_news() and
    flattens all article claims before running contradiction detection.
    """
    all_claims: List[Dict] = []
    for article in news_result.get("articles", []):
        for claim in article.get("claims_extracted", []):
            # Ensure source_type is present
            if "source_type" not in claim:
                claim["source_type"] = article.get("source_type", "news_article")
            all_claims.append(claim)

    return detect_contradictions(all_claims, audit_id, min_score)
