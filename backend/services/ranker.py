from typing import List, Dict, Any
from models import RankedScheme
from services.overlap import get_canonical_name

def rank_and_score_schemes(eligible_schemes: List[Dict[str, Any]], owned_docs: List[str], secondary_conflict_ids: List[str]) -> List[RankedScheme]:
    """
    Computes composite priority score for each eligible scheme with null safeguards & year-round deadline fallback:
    Score = (Benefit Value * 0.4) + (Urgency Weight * 0.3) + (Document Readiness Bonus * 0.3)
    """
    if not eligible_schemes:
        return []

    safe_owned_docs = owned_docs if owned_docs is not None else []
    safe_secondary_ids = secondary_conflict_ids if secondary_conflict_ids is not None else []

    canonical_owned = set(get_canonical_name(d) for d in safe_owned_docs if d)
    max_benefit = max([s.get("benefit_amount", 10000.0) or 10000.0 for s in eligible_schemes] + [50000.0])

    ranked_results: List[RankedScheme] = []

    for scheme in eligible_schemes:
        sid = scheme.get("id", "SCHEME_UNKNOWN")
        benefit = scheme.get("benefit_amount", 0.0) or 0.0
        raw_deadline = scheme.get("deadline_days", 30)
        
        # Safe deadline parsing: if missing, <= 0, or >= 365 -> Year-round scheme
        if raw_deadline is None or not isinstance(raw_deadline, (int, float)) or raw_deadline <= 0 or raw_deadline >= 300:
            deadline = 365
            urgency_score = 50.0  # Steady neutral score for year-round schemes
        else:
            deadline = int(raw_deadline)
            if deadline <= 5:
                urgency_score = 100.0
            elif deadline <= 10:
                urgency_score = 90.0
            elif deadline <= 20:
                urgency_score = 75.0
            elif deadline <= 35:
                urgency_score = 60.0
            else:
                urgency_score = 40.0

        req_docs = scheme.get("required_documents", []) or []
        
        # 1. Benefit Score (Normalized 0 to 100, Weight 0.40)
        benefit_score = min(100.0, (benefit / max_benefit) * 100.0) if max_benefit > 0 else 50.0

        # 2. Document Readiness Bonus (0 to 100, Weight 0.30)
        owned_count = sum(1 for d in req_docs if get_canonical_name(d) in canonical_owned)
        total_docs = len(req_docs)
        readiness_score = (owned_count / total_docs * 100.0) if total_docs > 0 else 100.0
        missing_docs = [d for d in req_docs if get_canonical_name(d) not in canonical_owned]

        # Formula: Score = (Benefit * 0.4) + (Urgency * 0.3) + (Readiness * 0.3)
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
