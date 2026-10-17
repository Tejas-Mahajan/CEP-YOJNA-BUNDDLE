import sys
import io
import json
import os

# Set stdout to UTF-8 for Windows console printing
sys.stdout = io.TextIOWrapper(sys.stdout.buffer, encoding="utf-8")

from models import UserProfile
from services.evaluator import evaluate_scheme_eligibility
from services.data_cleaner import sanitize_scheme_object


# ---------------------------------------------------------------------------
# File-based scheme loader (no live DB required).
# The engine tests care about eligibility logic, not the data source.
# ---------------------------------------------------------------------------
def _load_schemes_from_file(*args, **kwargs):
    """Load and sanitize schemes directly from schemes.json (DB-free helper)."""
    data_path = os.path.join(os.path.dirname(__file__), "data", "schemes.json")
    with open(data_path, "r", encoding="utf-8") as f:
        raw = json.load(f)
    return [sanitize_scheme_object(s) for s in raw]


def test_enhanced_engine():
    print("==========================================")
    print("  YOJANABUNDLE AGRICULTURE ENGINE TEST")
    print("==========================================")

    # Load from file so the test runs without a live DB connection.
    schemes = _load_schemes_from_file()
    print(f"Loaded {len(schemes)} agriculture schemes with dynamic rule predicates.\n")

    test_profiles = [
        (
            "TEST CASE 1: SMALL FARMER MAHARASHTRA",
            UserProfile(
                annual_income=180000.0,
                category="OBC",
                state="Maharashtra",
                age=42,
                land_acres=2.5,
                occupation="Small Farmer",
                owned_documents=["Aadhaar Card", "7/12 Land Record Extract", "Bank Passbook"]
            ),
            12  # Dropped from 14 to 12 due to category enforcement (Ambedkar & Birsa Munda excluded for OBC)
        ),
        (
            "TEST CASE 2: MARGINAL FARMER (SOLAR FOCUS)",
            UserProfile(
                annual_income=95000.0,
                category="General",
                state="Maharashtra",
                age=50,
                land_acres=1.2,
                occupation="Marginal Farmer",
                owned_documents=["Aadhaar Card", "7/12 Land Record Extract"]
            ),
            11  # Dropped from 13 to 11 (Ambedkar & Birsa Munda excluded for General)
        ),
        (
            "TEST CASE 3: LARGE LANDHOLDER (35 ACRES, HIGH INCOME)",
            UserProfile(
                annual_income=1500000.0,
                category="General",
                state="Maharashtra",
                age=45,
                land_acres=35.0,
                occupation="Large Farmer",
                owned_documents=["Aadhaar Card", "7/12 Land Record Extract", "Bank Passbook"]
            ),
            11
        ),
        (
            "TEST CASE 4: UNDERAGE APPLICANT (AGE 16, LAND 0.1 ACRES)",
            UserProfile(
                annual_income=50000.0,
                category="SC",
                state="Maharashtra",
                age=16,
                land_acres=0.005,
                occupation="Student Farmer",
                owned_documents=["Aadhaar Card"]
            ),
            0
        )
    ]

    for title, profile, expected_matched in test_profiles:
        print(f"--- {title} ---")
        matched   = []
        unmatched = []

        for s in schemes:
            is_eligible, reasons = evaluate_scheme_eligibility(profile, s)
            if is_eligible:
                matched.append(s["shortName"])
            else:
                unmatched.append((s["shortName"], reasons))

        total = len(schemes)
        print(f"MATCHED SCHEMES ({len(matched)}/{total}): {', '.join(matched) if matched else 'None'}")
        assert len(matched) == expected_matched, f"{title}: Expected {expected_matched} matches, got {len(matched)}"
        if unmatched:
            print(f"DISQUALIFIED / UNMATCHED SCHEMES ({len(unmatched)}/{total}):")
            for name, reasons in unmatched:
                print(f"   * {name}: {'; '.join(reasons)}")
        else:
            print(f"  (Farmer matched all {total} active schemes)")
        print()

    print("All agriculture engine tests completed successfully!")


if __name__ == "__main__":
    test_enhanced_engine()
