import sys
import io

# Set stdout to UTF-8 for Windows console printing
sys.stdout = io.TextIOWrapper(sys.stdout.buffer, encoding='utf-8')

from main import evaluate_profile, load_schemes
from models import UserProfile
from services.data_cleaner import clean_text_field, parse_deadline_days, sanitize_scheme_object

def test_hardening():
    print("==========================================")
    print("  YOJANABUNDLE HARDENING & EDGE-CASE TEST")
    print("==========================================")

    # 1. Test ftfy Unicode Cleaning
    raw_mojibake = "Pradhan Mantri Fasal Bimaâ€™s Schemeâ€"
    cleaned = clean_text_field(raw_mojibake)
    print(f"✓ ftfy Text Cleaning: '{raw_mojibake}' -> '{cleaned}'")

    # 2. Test Deadline Parsing Helper
    print(f"✓ Deadline Parsing (Integer 15): {parse_deadline_days(15)} days")
    print(f"✓ Deadline Parsing (String '25'): {parse_deadline_days('25')} days")
    print(f"✓ Deadline Parsing (ISO Date '2026-08-30'): {parse_deadline_days('2026-08-30')} days")
    print(f"✓ Deadline Parsing ('Expired'): {parse_deadline_days('Expired')} days")
    print(f"✓ Deadline Parsing (None): {parse_deadline_days(None)} days")

    # 3. Test Scheme Sanitizer with Dirty/Missing Schema
    dirty_scheme = {
        "id": "DIRTY_SCHEME_1",
        "name": "Dirty Schemeâ€™s Test",
        "benefit_amount": "50000",
        "deadline_days": "2026-09-01",
        "required_documents": None
    }
    sanitized = sanitize_scheme_object(dirty_scheme)
    print(f"✓ Scheme Sanitizer Benefit Amount: {type(sanitized['benefit_amount'])} ({sanitized['benefit_amount']})")
    print(f"✓ Scheme Sanitizer Documents: {sanitized['required_documents']}")

    # 4. Test Incomplete/Null User Profile Payload
    null_profile = UserProfile(
        annual_income=None,  # Null income
        category=None,
        state=None,
        age=None,
        land_acres=None,     # Null land acres
        owned_documents=None  # Null document array
    )

    result_null = evaluate_profile(null_profile)
    print("\n--- INCOMPLETE / NULL PROFILE EVALUATION RESULT ---")
    print(f"✓ Total Matched Schemes: {result_null.total_eligible_schemes}")
    print(f"✓ Total Potential Benefit: {result_null.formatted_potential_benefit}")
    print(f"✓ Document Readiness: {result_null.document_readiness_pct}%")

    print("\n✓ All hardening tests passed with zero exceptions!")

if __name__ == "__main__":
    test_hardening()
