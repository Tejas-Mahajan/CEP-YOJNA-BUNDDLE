from typing import List, Dict, Any, Tuple
from models import DocumentOverlapInsight

# Weights for the 12 master checklist items
CORE_DOCUMENTS_WEIGHTS = {
    # Tier 1: Core Gatekeepers (Weight: 3.0)
    "Aadhaar Card": 3.0,
    "7/12 Land Record Extract": 3.0,
    "Bank Passbook": 3.0,
    "Caste Certificate": 3.0,
    
    # Tier 2: Standard Certificates (Weight: 2.0)
    "Income Certificate": 2.0,
    "Domicile Certificate": 2.0,
    "Non-Creamy Layer Certificate": 2.0,
    "Disability Certificate": 2.0,
    
    # Tier 3: Farming Specifics (Weight: 1.5)
    "Sowing Certificate": 1.5,
    "Water Source Availability Certificate": 1.5,
    "Organic Cluster Membership Proof": 1.5,
    "Electricity Bill": 1.5
}
# Default weight for any other scheme-specific document (e.g., DPR, Quotations): 1.0
DEFAULT_DOCUMENT_WEIGHT = 1.0


def get_canonical_name(doc_name: str) -> str:
    """
    Normalizes descriptive document strings from schemes into clean master checklist categories.
    """
    if not doc_name:
        return ""
    dl = doc_name.strip().lower()
    if "7/12" in dl or "land record" in dl or "8a" in dl:
        return "7/12 Land Record Extract"
    if "aadhaar" in dl:
        return "Aadhaar Card"
    if "passbook" in dl or "bank account" in dl:
        return "Bank Passbook"
    if "caste" in dl:
        return "Caste Certificate"
    if "income" in dl or "tahsildar" in dl:
        return "Income Certificate"
    if "domicile" in dl:
        return "Domicile Certificate"
    if "non-creamy" in dl:
        return "Non-Creamy Layer Certificate"
    if "disability" in dl:
        return "Disability Certificate"
    if "sowing" in dl or "pik pahani" in dl:
        return "Sowing Certificate"
    if "water source" in dl or "groundwater" in dl:
        return "Water Source Availability Certificate"
    if "organic" in dl:
        return "Organic Cluster Membership Proof"
    if "electricity" in dl:
        return "Electricity Bill"
    return doc_name.strip()


def get_document_weight(doc_name: str) -> float:
    """
    Returns the weight of a document based on CORE_DOCUMENTS_WEIGHTS.
    Canonicalizes the document name first; defaults to 1.0 for niche/procedural items.
    """
    if not doc_name:
        return DEFAULT_DOCUMENT_WEIGHT
    canonical = get_canonical_name(doc_name)
    return CORE_DOCUMENTS_WEIGHTS.get(canonical, DEFAULT_DOCUMENT_WEIGHT)


def is_document_owned(req_doc: str, owned_docs: List[str]) -> bool:
    """
    Checks if a scheme's required document is satisfied by the user's owned checklist documents.
    Implements substring matching, canonical category equivalence, and keyword matching.
    """
    if not owned_docs or not req_doc:
        return False

    req_clean = req_doc.strip().lower()
    req_canonical = get_canonical_name(req_doc)

    for owned in owned_docs:
        if not owned:
            continue
        owned_clean = owned.strip().lower()
        owned_canonical = get_canonical_name(owned)

        # 1. Canonical match against the 12 master checklist items
        if req_canonical == owned_canonical:
            return True

        # 2. Substring matching (e.g., 'Bank Passbook' in 'Bank Passbook (Aadhaar-seeded & DBT enabled)')
        if owned_clean in req_clean or req_clean in owned_clean:
            return True

        # 3. Keyword / alias matching for variations
        if ("7/12" in owned_clean or "land record" in owned_clean) and ("7/12" in req_clean or "land record" in req_clean or "8a" in req_clean):
            return True
        if "aadhaar" in owned_clean and "aadhaar" in req_clean:
            return True
        if "passbook" in owned_clean and ("passbook" in req_clean or "bank account" in req_clean):
            return True
        if "caste" in owned_clean and "caste" in req_clean:
            return True
        if "income" in owned_clean and ("income" in req_clean or "tahsildar" in req_clean):
            return True
        if "domicile" in owned_clean and "domicile" in req_clean:
            return True
        if "non-creamy" in owned_clean and "non-creamy" in req_clean:
            return True
        if "disability" in owned_clean and "disability" in req_clean:
            return True
        if "sowing" in owned_clean and ("sowing" in req_clean or "pik pahani" in req_clean):
            return True
        if "water source" in owned_clean and ("water source" in req_clean or "groundwater" in req_clean):
            return True
        if "organic" in owned_clean and "organic" in req_clean:
            return True
        if "electricity" in owned_clean and "electricity" in req_clean:
            return True

    return False


def calculate_weighted_readiness(eligible_schemes: List[Dict[str, Any]], owned_docs: List[str]) -> float:
    """
    Calculates document readiness score using weighted average rather than a flat fraction.
    Weights core gatekeepers (3.0), standard certificates (2.0), farming specifics (1.5),
    and procedural niche documents (1.0).
    """
    safe_owned = owned_docs if owned_docs is not None else []
    if not eligible_schemes:
        return 100.0

    all_req_docs = [doc for s in eligible_schemes for doc in s.get("required_documents", [])]
    if not all_req_docs:
        return 100.0

    total_weight = sum(get_document_weight(d) for d in all_req_docs)
    if total_weight <= 0:
        return 100.0

    owned_weight = sum(get_document_weight(d) for d in all_req_docs if is_document_owned(d, safe_owned))
    return round((owned_weight / total_weight * 100.0), 1)


def analyze_document_overlaps(eligible_schemes: List[Dict[str, Any]], owned_docs: List[str]) -> Tuple[List[DocumentOverlapInsight], List[str]]:
    """
    Graph-based document dependency mapping & overlap detector.
    Groups synonymous documents into canonical nodes and computes leverage metrics.
    """
    safe_owned_docs = owned_docs if owned_docs is not None else []
    doc_to_schemes: Dict[str, List[str]] = {}

    for scheme in eligible_schemes:
        scheme_name = scheme.get("shortName", scheme["name"])
        for doc in scheme.get("required_documents", []):
            canonical = get_canonical_name(doc)
            if canonical not in doc_to_schemes:
                doc_to_schemes[canonical] = []
            if scheme_name not in doc_to_schemes[canonical]:
                doc_to_schemes[canonical].append(scheme_name)

    insights: List[DocumentOverlapInsight] = []
    callouts: List[str] = []

    # Sort canonical documents by frequency (most required first)
    sorted_docs = sorted(doc_to_schemes.items(), key=lambda x: len(x[1]), reverse=True)

    for canonical_name, schemes in sorted_docs:
        count = len(schemes)
        is_owned = is_document_owned(canonical_name, safe_owned_docs)

        if count >= 3:
            tag = "⚡ High Leverage (Key Master Document)"
        elif count == 2:
            tag = "✨ Medium Leverage (Shared Document)"
        else:
            tag = "📄 Standard Document"

        insights.append(DocumentOverlapInsight(
            document_name=canonical_name,
            canonical_group=canonical_name,
            unlocked_schemes_count=count,
            scheme_names=schemes,
            is_owned=is_owned,
            efficiency_tag=tag
        ))

        # Generate prominent 🔥 callout banner for high leverage documents
        if count >= 2:
            status = "already uploaded" if is_owned else "unlocks"
            callout = f"🔥 Key Document Highlight: '{canonical_name}' {status} {count} schemes at once! ({', '.join(schemes[:3])}{'...' if len(schemes) > 3 else ''})"
            callouts.append(callout)

    if not callouts:
        callouts.append("Ensure your identity and income documents are verified to speed up all scheme approvals.")

    return insights, callouts
