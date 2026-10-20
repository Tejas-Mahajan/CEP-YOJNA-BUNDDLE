from typing import List, Dict, Any, Tuple
from models import DocumentOverlapInsight

# ---------------------------------------------------------------------------
# 3-Tier Hybrid Weightage System
# ---------------------------------------------------------------------------
# Base tier weights for canonical document groups.
# Final_Doc_Weight = Base_Tier_Weight + (Schemes_Requiring_Doc * 0.5) + Benefit_Bonus
# The benefit_bonus and frequency component are computed dynamically at runtime.
# ---------------------------------------------------------------------------

# Tier 1: Universal Core Documents — Base Weight = 3.0
# These are mandatory for DBT/identity seeding and land ownership verification.
TIER1_BASE = 3.0
TIER1_CANONICAL = {
    "Aadhaar Card",
    "7/12 Land Record Extract",
    "Bank Passbook",
    "Mobile Number (Aadhaar-linked)",
}

# Tier 2: Socio-Economic & Secondary Documents — Base Weight = 2.0
# These unlock income-capped subsidies and SC/ST/OBC subsidy tiers.
TIER2_BASE = 2.0
TIER2_CANONICAL = {
    "Income Certificate",
    "Caste Certificate",
    "Ration Card",
    "Passport-size Photograph",
    "Non-Creamy Layer Certificate",
    "Domicile Certificate",
}

# Tier 3: Scheme-Specific / Specialized Documents — Base Weight = 1.5
# All scheme-specific documents receive at minimum this weight.
TIER3_BASE = 1.5
TIER3_CANONICAL = {
    "Sowing Certificate",
    "Tractor RC",
    "FIR / Police Spot Panchnama / Inquest Panchnama",
    "Death Certificate / Post-Mortem Report",
    "Disability Certificate",
    "Organic Farming Group Membership Proof",
    "Soil Health Card / Soil Testing Report",
    "Electricity Bill / Agricultural Pump Connection Proof",
    "Water Source / Well / Borewell Certificate",
    "Quotation / GST Invoice for Machinery or Equipment",
    "Gram Panchayat NOC / Self Declaration Certificate",
    "No-Objection Certificate",
    "Gram Sabha Recommendation",
    "Groundwater Availability Certificate",
    "Forest Rights Act / FRA Land Patta",
    "Drip Irrigation Installation Proof",
    "Active PM-KISAN Registration ID",
    "Self-Declaration / Undertaking",
}

# Default: any document not matched to a tier still gets Tier 3 base weight
DEFAULT_DOCUMENT_BASE_WEIGHT = TIER3_BASE


def get_canonical_name(doc_name: str) -> str:
    """
    Normalizes descriptive document strings from schemes.json into
    clean canonical tier-mapped groups. Every raw document string in
    schemes.json must map to one canonical group so weights are applied
    consistently across all schemes.

    IMPORTANT: Order of checks matters — more specific patterns before broader ones.
    """
    if not doc_name:
        return ""
    dl = doc_name.strip().lower()

    # ---- Tier 1: Check passbook FIRST before aadhaar to prevent
    #              "Bank Passbook (Aadhaar-seeded)" from mapping to Aadhaar Card ----
    if "passbook" in dl or "savings bank" in dl:
        return "Bank Passbook"
    # Bank account string without passbook
    if "bank account" in dl and "aadhaar" not in dl:
        return "Bank Passbook"

    # Mobile Number — must be checked BEFORE aadhaar so that
    # "Mobile Number linked with Aadhaar" -> Mobile Number, not Aadhaar Card
    if ("mobile" in dl or "phone" in dl) and "passbook" not in dl:
        return "Mobile Number (Aadhaar-linked)"

    # Aadhaar (catches standalone Aadhaar Card, also 'Aadhaar & Age Proof...')
    if "aadhaar" in dl:
        return "Aadhaar Card"

    # 7/12 / Land Record / 8A / 8-A (all variants map to same canonical)
    if "7/12" in dl or "land record" in dl or "8a" in dl or "8-a" in dl:
        return "7/12 Land Record Extract"

    # ---- Tier 2 ----
    # Active PM-KISAN Registration ID — must be before 'ration' check
    # ('registration' contains 'ration' as substring)
    if "pm-kisan" in dl or "pm kisan" in dl:
        return "Active PM-KISAN Registration ID"

    # Self-Declaration / Undertaking — must be before 'ration' check
    # ('declaration' contains no 'ration', but 'undertaking' does not either;
    #  however 'ration' check catches doc names containing the word 'ration')
    if "self-declaration" in dl or "undertaking" in dl:
        return "Gram Panchayat NOC / Self Declaration Certificate"

    if "income" in dl and "drip" not in dl:
        return "Income Certificate"
    if "caste" in dl or "sc /" in dl or "neo-buddhist" in dl or "scheduled tribe" in dl:
        return "Caste Certificate"
    if "ration" in dl:
        return "Ration Card"
    if "passport" in dl and "photo" in dl:
        return "Passport-size Photograph"
    if "non-creamy" in dl:
        return "Non-Creamy Layer Certificate"
    if "domicile" in dl:
        return "Domicile Certificate"

    # ---- Tier 3 ----
    if "sowing" in dl or "pik pahani" in dl or "perani" in dl:
        return "Sowing Certificate"
    if "tractor" in dl and "rc" in dl:
        return "Tractor RC"
    if "fir" in dl or "panchnama" in dl or "inquest" in dl:
        return "FIR / Police Spot Panchnama / Inquest Panchnama"
    if "post-mortem" in dl or "death" in dl or "disability cert" in dl:
        return "Death Certificate / Post-Mortem Report"
    if "disability" in dl:
        return "Disability Certificate"
    if "organic" in dl or "cluster" in dl or "pgs" in dl:
        return "Organic Farming Group Membership Proof"
    if "soil" in dl:
        return "Soil Health Card / Soil Testing Report"
    if "electricity" in dl or "pump connect" in dl:
        return "Electricity Bill / Agricultural Pump Connection Proof"
    # Water/well/borewell — check before gram sabha groundwater
    if "water source" in dl or "groundwater" in dl or "borewell" in dl:
        return "Water Source / Well / Borewell Certificate"
    # Self-declaration / Undertaking — must be before gram sabha check
    if "self-declaration" in dl or "undertaking" in dl:
        return "Gram Panchayat NOC / Self Declaration Certificate"
    if "gst invoice" in dl or "quotation" in dl or "dealer" in dl or "drip irrigation install" in dl:
        return "Quotation / GST Invoice for Machinery or Equipment"
    # Invoice without quotation/gst prefix
    if "invoice" in dl and "gst" not in dl:
        return "Quotation / GST Invoice for Machinery or Equipment"
    if "gram sabha" in dl or "vcrmc" in dl:
        return "Gram Sabha Recommendation"
    if "gram panchayat" in dl or "noc" in dl:
        return "No-Objection Certificate"
    if "no-objection" in dl:
        return "No-Objection Certificate"
    if "fra land" in dl or "forest rights" in dl:
        return "Forest Rights Act / FRA Land Patta"

    # Fallback: return stripped original (still gets TIER3_BASE weight)
    return doc_name.strip()


def get_base_tier_weight(canonical_name: str) -> float:
    """
    Returns the base tier weight for a canonical document name.
    Tier 1 = 3.0, Tier 2 = 2.0, Tier 3 = 1.5 (default for all others).
    """
    if canonical_name in TIER1_CANONICAL:
        return TIER1_BASE
    if canonical_name in TIER2_CANONICAL:
        return TIER2_BASE
    if canonical_name in TIER3_CANONICAL:
        return TIER3_BASE
    return DEFAULT_DOCUMENT_BASE_WEIGHT


def build_doc_frequency_map(all_schemes: List[Dict[str, Any]]) -> Dict[str, int]:
    """
    Scans all schemes and builds a map of canonical document name ->
    number of schemes that require it (frequency count).
    """
    freq: Dict[str, int] = {}
    for scheme in all_schemes:
        seen_in_scheme = set()
        for raw_doc in scheme.get("required_documents", []):
            canonical = get_canonical_name(raw_doc)
            if canonical and canonical not in seen_in_scheme:
                freq[canonical] = freq.get(canonical, 0) + 1
                seen_in_scheme.add(canonical)
    return freq


def compute_final_weight(
    canonical_name: str,
    freq_map: Dict[str, int],
    benefit_map: Dict[str, float],
    max_benefit: float,
) -> float:
    """
    Computes the 3-Tier Hybrid Final Document Weight:

        Final_Doc_Weight = Base_Tier_Weight
                         + (Number_of_Schemes_Requiring_Doc * 0.5)
                         + Total_Benefit_Value_Unlocked_Normalized

    Where:
      - Base_Tier_Weight      = Tier 1: 3.0 / Tier 2: 2.0 / Tier 3: 1.5
      - Frequency component   = count of schemes requiring this doc × 0.5
      - Benefit bonus         = (sum of benefit_amounts of schemes requiring
                                 this doc) / max_benefit in the eligible set,
                                 normalized to [0, 1] range

    This ensures no document ever has undefined or zero weight.
    """
    base = get_base_tier_weight(canonical_name)
    count = freq_map.get(canonical_name, 0)
    frequency_component = count * 0.5

    # Benefit bonus: normalized total benefit value unlocked by this doc
    benefit_total = benefit_map.get(canonical_name, 0.0)
    benefit_bonus = (benefit_total / max_benefit) if max_benefit > 0 else 0.0
    benefit_bonus = min(benefit_bonus, 1.0)  # cap at 1.0

    return round(base + frequency_component + benefit_bonus, 3)


def build_benefit_map(all_schemes: List[Dict[str, Any]]) -> Dict[str, float]:
    """
    Builds a map: canonical_doc -> total benefit_amount of schemes requiring it.
    This is used to compute the benefit_bonus component of Final_Doc_Weight.
    """
    benefit: Dict[str, float] = {}
    for scheme in all_schemes:
        amt = float(scheme.get("benefit_amount", 0.0) or 0.0)
        seen_in_scheme = set()
        for raw_doc in scheme.get("required_documents", []):
            canonical = get_canonical_name(raw_doc)
            if canonical and canonical not in seen_in_scheme:
                benefit[canonical] = benefit.get(canonical, 0.0) + amt
                seen_in_scheme.add(canonical)
    return benefit


def get_document_weight(doc_name: str, freq_map: Dict[str, int] = None, benefit_map: Dict[str, float] = None, max_benefit: float = 0.0) -> float:
    """
    Returns the Final_Doc_Weight for a document.
    When freq_map/benefit_map are not provided (e.g., simple per-scheme
    readiness calculation), uses base tier weight + frequency from
    the empty map (so frequency component = 0).

    This ensures backward compatibility with ranker.py which uses this
    for per-scheme scoring where scheme-level weights suffice.
    """
    if not doc_name:
        return DEFAULT_DOCUMENT_BASE_WEIGHT
    canonical = get_canonical_name(doc_name)
    if freq_map is not None and benefit_map is not None and max_benefit > 0:
        return compute_final_weight(canonical, freq_map, benefit_map, max_benefit)
    # Fallback: base tier weight only (still ≥ 1.5 for all documents)
    return get_base_tier_weight(canonical)


def is_document_owned(req_doc: str, owned_docs: List[str]) -> bool:
    """
    Checks if a scheme's required document is satisfied by the user's
    owned checklist documents.

    Implements:
      1. Canonical group matching (maps both sides to canonical names)
      2. Substring matching for partial name overlaps
      3. Keyword alias matching for well-known variants
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

        # 1. Canonical match — both sides map to the same canonical group
        if req_canonical and owned_canonical and req_canonical == owned_canonical:
            return True

        # 2. Substring match (handles "Bank Passbook" in "Bank Passbook (Aadhaar-seeded)")
        if owned_clean in req_clean or req_clean in owned_clean:
            return True

        # 3. Keyword alias matching for key document types
        if ("7/12" in owned_clean or "land record" in owned_clean or "8a" in owned_clean) and \
           ("7/12" in req_clean or "land record" in req_clean or "8a" in req_clean or "8-a" in req_clean):
            return True
        if "aadhaar" in owned_clean and "aadhaar" in req_clean:
            return True
        if "passbook" in owned_clean and ("passbook" in req_clean or "bank account" in req_clean or "savings bank" in req_clean):
            return True
        if "caste" in owned_clean and ("caste" in req_clean or "sc /" in req_clean or "neo-buddhist" in req_clean or "scheduled tribe" in req_clean):
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
        if "water source" in owned_clean and ("water source" in req_clean or "groundwater" in req_clean or "borewell" in req_clean):
            return True
        if "organic" in owned_clean and ("organic" in req_clean or "cluster" in req_clean):
            return True
        if "electricity" in owned_clean and "electricity" in req_clean:
            return True
        if "fir" in owned_clean and ("fir" in req_clean or "panchnama" in req_clean):
            return True
        if "post-mortem" in owned_clean and ("post-mortem" in req_clean or "death" in req_clean):
            return True
        if "gram sabha" in owned_clean and ("gram sabha" in req_clean or "vcrmc" in req_clean):
            return True
        if "mobile" in owned_clean and "mobile" in req_clean:
            return True
        if "tractor" in owned_clean and "tractor" in req_clean:
            return True

    return False


def calculate_weighted_readiness(eligible_schemes: List[Dict[str, Any]], owned_docs: List[str]) -> float:
    """
    Calculates the farmer's Overall Document Readiness Percentage across
    all eligible schemes using the 3-Tier Hybrid Weightage formula:

        Overall_Readiness = (Sum of Final_Doc_Weight of owned docs needed across eligible schemes)
                          / (Sum of Final_Doc_Weight of ALL docs needed across eligible schemes)
                          × 100

    Uses deduplicated canonical documents (each canonical doc counted once
    across all eligible schemes to avoid double-counting identical docs
    required by multiple schemes).

    Returns 100.0 if no eligible schemes or no required documents exist.
    Prevents division-by-zero explicitly.
    Rounded to 1 decimal place (0.0–100.0).
    """
    safe_owned = owned_docs if owned_docs is not None else []
    if not eligible_schemes:
        return 100.0

    # Build frequency and benefit maps from ALL eligible schemes
    freq_map = build_doc_frequency_map(eligible_schemes)
    benefit_map = build_benefit_map(eligible_schemes)
    max_benefit = max((float(s.get("benefit_amount", 0.0) or 0.0) for s in eligible_schemes), default=0.0)

    # Compute final weight for each unique canonical doc across all eligible schemes
    all_canonical_docs = set(freq_map.keys())
    if not all_canonical_docs:
        return 100.0

    total_weight = 0.0
    owned_weight = 0.0

    for canonical in all_canonical_docs:
        w = compute_final_weight(canonical, freq_map, benefit_map, max_benefit)
        total_weight += w
        # Check if ANY raw doc from any scheme mapping to this canonical is owned
        # We check via get_canonical_name on owned docs
        owned_canonical_set = {get_canonical_name(d) for d in safe_owned if d}
        if canonical in owned_canonical_set:
            owned_weight += w

    if total_weight <= 0:
        return 100.0

    return round((owned_weight / total_weight) * 100.0, 1)


def analyze_document_overlaps(
    eligible_schemes: List[Dict[str, Any]],
    owned_docs: List[str]
) -> Tuple[List[DocumentOverlapInsight], List[str]]:
    """
    Graph-based document dependency mapping & overlap detector.

    Groups synonymous documents into canonical nodes, computes the
    3-Tier Hybrid Final_Doc_Weight for each canonical document, and
    returns DocumentOverlapInsight objects sorted by Final_Doc_Weight
    descending — so the farmer sees the highest-impact missing documents first.

    Also generates prominent 🔥 callout banners for high-leverage documents.
    """
    safe_owned_docs = owned_docs if owned_docs is not None else []

    # --- Step 1: Build canonical → scheme names mapping ---
    doc_to_schemes: Dict[str, List[str]] = {}
    for scheme in eligible_schemes:
        scheme_name = scheme.get("shortName", scheme.get("name", ""))
        for raw_doc in scheme.get("required_documents", []):
            canonical = get_canonical_name(raw_doc)
            if not canonical:
                continue
            if canonical not in doc_to_schemes:
                doc_to_schemes[canonical] = []
            if scheme_name not in doc_to_schemes[canonical]:
                doc_to_schemes[canonical].append(scheme_name)

    # --- Step 2: Build freq / benefit maps for weight computation ---
    freq_map = build_doc_frequency_map(eligible_schemes)
    benefit_map = build_benefit_map(eligible_schemes)
    max_benefit = max(
        (float(s.get("benefit_amount", 0.0) or 0.0) for s in eligible_schemes),
        default=1.0
    )
    if max_benefit <= 0:
        max_benefit = 1.0

    # --- Step 3: Build set of owned canonical docs ---
    owned_canonical_set = {get_canonical_name(d) for d in safe_owned_docs if d}

    # --- Step 4: Build insights sorted by Final_Doc_Weight descending ---
    insights: List[DocumentOverlapInsight] = []
    callouts: List[str] = []

    # Sort by final weight descending (highest-impact docs first for wallet)
    canonical_items = list(doc_to_schemes.items())

    def _sort_key(item):
        canonical, schemes_list = item
        fw = compute_final_weight(canonical, freq_map, benefit_map, max_benefit)
        return fw

    canonical_items.sort(key=_sort_key, reverse=True)

    for canonical_name, schemes in canonical_items:
        count = len(schemes)
        is_owned = canonical_name in owned_canonical_set
        final_weight = compute_final_weight(canonical_name, freq_map, benefit_map, max_benefit)
        base_weight = get_base_tier_weight(canonical_name)

        # Efficiency tag based on scheme count
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
            efficiency_tag=tag,
            final_weight=round(final_weight, 2),
            base_weight=base_weight,
        ))

        # Generate 🔥 callout banners for high-leverage documents (count ≥ 2)
        if count >= 2:
            status = "already uploaded" if is_owned else "unlocks"
            callout = (
                f"🔥 Key Document Highlight: '{canonical_name}' {status} "
                f"{count} schemes at once! "
                f"({', '.join(schemes[:3])}{'...' if len(schemes) > 3 else ''})"
            )
            callouts.append(callout)

    if not callouts:
        callouts.append(
            "Ensure your identity and income documents are verified to speed up all scheme approvals."
        )

    return insights, callouts
