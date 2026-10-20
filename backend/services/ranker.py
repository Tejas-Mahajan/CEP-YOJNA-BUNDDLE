from typing import List, Dict, Any, Optional
from datetime import date
from models import RankedScheme
from services.overlap import (
    get_canonical_name,
    is_document_owned,
    get_base_tier_weight,
    build_doc_frequency_map,
    build_benefit_map,
    compute_final_weight,
)


YEAR_ROUND_FALLBACK_DAYS = 300  # Neutral urgency for year-round / FCFS schemes


def days_remaining_from_closing_date(closing_date_str: Optional[str]) -> int:
    """
    Converts a scheme's closing_date string (YYYY-MM-DD) into integer days remaining
    from today.

    Returns:
        - YEAR_ROUND_FALLBACK_DAYS (300) when closing_date is missing → year-round scheme
        - 0 when the date has already passed (expired)
        - Actual calendar days remaining otherwise
    """
    if not closing_date_str:
        return YEAR_ROUND_FALLBACK_DAYS

    try:
        closing = date.fromisoformat(closing_date_str.strip())
        delta = (closing - date.today()).days
        return max(0, delta)  # 0 means expired / deadline passed
    except (ValueError, AttributeError):
        # Malformed date string — treat as year-round to avoid false urgency
        return YEAR_ROUND_FALLBACK_DAYS


def _compute_scheme_readiness(
    req_docs: List[str],
    owned_docs: List[str],
    freq_map: Dict[str, int],
    benefit_map: Dict[str, float],
    max_benefit: float,
) -> float:
    """
    Per-Scheme Document Readiness Score using 3-Tier Hybrid Weights:

        Scheme_Doc_Score = (Sum of Final_Doc_Weight of owned docs required by this scheme)
                         / (Sum of Final_Doc_Weight of ALL docs required by this scheme)
                         × 100

    Returns 100.0 if the scheme has no required documents.
    """
    if not req_docs:
        return 100.0

    total_weight = 0.0
    owned_weight = 0.0

    for raw_doc in req_docs:
        canonical = get_canonical_name(raw_doc)
        w = compute_final_weight(canonical, freq_map, benefit_map, max_benefit)
        total_weight += w
        if is_document_owned(raw_doc, owned_docs):
            owned_weight += w

    if total_weight <= 0:
        return 100.0

    return round((owned_weight / total_weight) * 100.0, 1)


def rank_and_score_schemes(
    eligible_schemes: List[Dict[str, Any]],
    owned_docs: List[str],
    secondary_conflict_ids: List[str],
) -> List[RankedScheme]:
    """
    Computes composite priority score for each eligible scheme.

    Formula:
        Score = (Benefit Score × 0.40)
              + (Urgency Score × 0.30)
              + (Document Readiness Score × 0.30)

    Document Readiness uses the 3-Tier Hybrid Final_Doc_Weight per scheme:
        Scheme_Doc_Score = Σ(weight of owned required docs) / Σ(weight of all required docs) × 100

    Weights are built from the full eligible_schemes set for frequency/benefit
    consistency, then applied per-scheme.
    """
    if not eligible_schemes:
        return []

    safe_owned_docs = owned_docs if owned_docs is not None else []
    safe_secondary_ids = secondary_conflict_ids if secondary_conflict_ids is not None else []

    # Build cross-scheme frequency & benefit maps once (shared weight context)
    freq_map = build_doc_frequency_map(eligible_schemes)
    benefit_map = build_benefit_map(eligible_schemes)
    max_benefit = max(
        [s.get("benefit_amount", 10000.0) or 10000.0 for s in eligible_schemes] + [50000.0]
    )

    # Normalization denominator for benefit score
    max_benefit_norm = max(
        [s.get("benefit_amount", 10000.0) or 10000.0 for s in eligible_schemes] + [50000.0]
    )

    ranked_results: List[RankedScheme] = []

    for scheme in eligible_schemes:
        sid = scheme.get("id", "SCHEME_UNKNOWN")
        benefit = scheme.get("benefit_amount", 0.0) or 0.0

        # Dynamic deadline: calculate days remaining from closing_date ISO string
        days_remaining = days_remaining_from_closing_date(scheme.get("closing_date"))

        # Urgency score based on days_remaining
        # YEAR_ROUND_FALLBACK_DAYS (300) → neutral 50.0; expired (0) → 100.0
        if days_remaining >= YEAR_ROUND_FALLBACK_DAYS:
            urgency_score = 50.0  # Steady neutral score for year-round / FCFS schemes
        elif days_remaining == 0:
            urgency_score = 100.0  # Expired — still highest urgency to flag it
        elif days_remaining <= 5:
            urgency_score = 100.0
        elif days_remaining <= 10:
            urgency_score = 90.0
        elif days_remaining <= 20:
            urgency_score = 75.0
        elif days_remaining <= 35:
            urgency_score = 60.0
        else:
            urgency_score = 40.0

        req_docs = scheme.get("required_documents", []) or []

        # 1. Benefit Score (Normalized 0 to 100, Weight 0.40)
        benefit_score = min(100.0, (benefit / max_benefit_norm) * 100.0) if max_benefit_norm > 0 else 50.0

        # 2. Per-Scheme Document Readiness Score (0 to 100, Weight 0.30)
        #    Uses 3-Tier Hybrid Final_Doc_Weight per document
        readiness_score = _compute_scheme_readiness(
            req_docs=req_docs,
            owned_docs=safe_owned_docs,
            freq_map=freq_map,
            benefit_map=benefit_map,
            max_benefit=max_benefit,
        )

        # Raw document counts (for display in UI)
        owned_count = sum(1 for d in req_docs if is_document_owned(d, safe_owned_docs))
        total_docs = len(req_docs)
        missing_docs = [d for d in req_docs if not is_document_owned(d, safe_owned_docs)]

        # Formula: Score = (Benefit × 0.4) + (Urgency × 0.3) + (Readiness × 0.3)
        composite_score = round(
            (0.40 * benefit_score) + (0.30 * urgency_score) + (0.30 * readiness_score),
            1
        )

        is_secondary = sid in safe_secondary_ids
        warning_msg = None
        if is_secondary:
            warning_msg = "Mutually Exclusive Conflict: A higher-yielding competing scheme is recommended for primary claim."

        # Assign Tier
        if composite_score >= 70.0 and not is_secondary:
            priority_tier = "High Priority"
        elif composite_score >= 48.0 or is_secondary:
            priority_tier = "Medium Priority"
        else:
            priority_tier = "Low Priority"

        ranked_results.append(RankedScheme(
            scheme=scheme,
            composite_score=composite_score,
            priority_tier=priority_tier,
            benefit_score=round(benefit_score, 1),
            urgency_score=round(urgency_score, 1),
            readiness_score=round(readiness_score, 1),
            missing_documents=missing_docs,
            owned_documents_count=owned_count,
            total_documents_count=total_docs,
            is_mutually_exclusive_secondary=is_secondary,
            conflict_warning=warning_msg
        ))

    # Primary sort by composite score descending
    ranked_results.sort(key=lambda x: x.composite_score, reverse=True)
    return ranked_results
