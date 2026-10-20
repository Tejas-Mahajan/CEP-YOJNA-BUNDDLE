import sys
import io
import json
import os
from unittest.mock import patch

# Set stdout to UTF-8 for Windows console printing
if hasattr(sys.stdout, "reconfigure"):
    try:
        sys.stdout.reconfigure(encoding="utf-8")
    except Exception:
        pass

from main import evaluate_profile
from models import UserProfile
from services.data_cleaner import clean_text_field, parse_deadline_days, sanitize_scheme_object


# ---------------------------------------------------------------------------
# File-based scheme loader used to patch main.load_schemes during hardening
# tests so the test suite runs without a live DB / Neon connection.
# ---------------------------------------------------------------------------
def _load_schemes_from_file(*args, **kwargs):
    """Load and sanitize schemes directly from schemes.json (DB-free helper)."""
    data_path = os.path.join(os.path.dirname(__file__), "data", "schemes.json")
    with open(data_path, "r", encoding="utf-8") as f:
        raw = json.load(f)
    return [sanitize_scheme_object(s) for s in raw]


def test_hardening():
    print("==========================================")
    print("  YOJANABUNDLE HARDENING & EDGE-CASE TEST")
    print("==========================================")

    # 1. Test ftfy Unicode Cleaning
    raw_mojibake = "Pradhan Mantri Fasal Bimaâ€™s Schemeâ€"
    cleaned = clean_text_field(raw_mojibake)
    print(f"ftfy Text Cleaning: '{raw_mojibake}' -> '{cleaned}'")

    # 2. Test Deadline Parsing Helper
    print(f"Deadline Parsing (Integer 15): {parse_deadline_days(15)} days")
    print(f"Deadline Parsing (String '25'): {parse_deadline_days('25')} days")
    print(f"Deadline Parsing (ISO Date '2026-08-30'): {parse_deadline_days('2026-08-30')} days")
    print(f"Deadline Parsing ('Expired'): {parse_deadline_days('Expired')} days")
    print(f"Deadline Parsing (None): {parse_deadline_days(None)} days")

    # 3. Test Scheme Sanitizer with Dirty / Missing Schema
    dirty_scheme = {
        "id": "DIRTY_SCHEME_1",
        "name": "Dirty Schemeâ€™s Test",
        "benefit_amount": "50000",
        "deadline_days": "2026-09-01",
        "required_documents": None
    }
    sanitized = sanitize_scheme_object(dirty_scheme)
    print(f"Scheme Sanitizer Benefit Amount: {type(sanitized['benefit_amount'])} ({sanitized['benefit_amount']})")
    print(f"Scheme Sanitizer Documents: {sanitized['required_documents']}")

    # 4. Test Incomplete / Null User Profile Payload
    #    Patch main.load_schemes so evaluate_profile never touches the DB.
    null_profile = UserProfile(
        annual_income=None,
        category=None,
        state=None,
        age=None,
        land_acres=None,
        owned_documents=None
    )

    # load_schemes() in main.py is replaced for this call only.
    with patch("main.load_schemes", side_effect=_load_schemes_from_file):
        result_null = evaluate_profile(null_profile)

    print("\n--- INCOMPLETE / NULL PROFILE EVALUATION RESULT ---")
    print(f"Total Matched Schemes: {result_null.total_eligible_schemes}")
    print(f"Total Potential Benefit: {result_null.formatted_potential_benefit}")
    print(f"Document Readiness: {result_null.document_readiness_pct}%")

    print("\nAll hardening tests passed with zero exceptions!")


if __name__ == "__main__":
    test_hardening()
