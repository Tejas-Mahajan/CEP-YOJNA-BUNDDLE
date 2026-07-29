from typing import List, Dict, Any, Tuple
from models import DocumentOverlapInsight

# Canonical document equivalence graph / alias dictionary
DOCUMENT_ALIAS_GRAPH = {
    "7/12 Land Record Extract": "Land Ownership Proof (7/12 Extract)",
    "7/12 Extract": "Land Ownership Proof (7/12 Extract)",
    "Land Ownership Proof": "Land Ownership Proof (7/12 Extract)",
    "Land Revenue Receipt": "Land Ownership Proof (7/12 Extract)",
    
    "Aadhaar Card": "Aadhaar Identity Card",
    "Aadhaar Number": "Aadhaar Identity Card",
    "Aadhaar Linked Bank Account": "Aadhaar Identity Card",
    
    "Income Certificate": "Income Certificate",
    "Tahsildar Income Proof": "Income Certificate",
    
    "Caste Certificate": "Caste Certificate",
    "Domicile Certificate": "State Domicile Certificate",
    "Bank Passbook": "Bank Account Passbook",
    "Mark Sheet (10th/12th)": "Academic Mark Sheet (10th/12th)",
    "College Fee Receipt": "College Admission & Fee Receipt"
}

def get_canonical_name(doc_name: str) -> str:
    return DOCUMENT_ALIAS_GRAPH.get(doc_name, doc_name)

def analyze_document_overlaps(eligible_schemes: List[Dict[str, Any]], owned_docs: List[str]) -> Tuple[List[DocumentOverlapInsight], List[str]]:
    """
    Graph-based document dependency mapping & overlap detector.
    Groups synonymous documents into canonical nodes and computes leverage metrics.
    """
    canonical_owned = set(get_canonical_name(d) for d in owned_docs)
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
        is_owned = canonical_name in canonical_owned

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
