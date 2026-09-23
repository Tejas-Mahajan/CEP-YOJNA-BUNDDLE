import sys
import io

# Set stdout to UTF-8 for Windows console printing
sys.stdout = io.TextIOWrapper(sys.stdout.buffer, encoding='utf-8')

from main import evaluate_profile, load_schemes
from models import UserProfile
from services.evaluator import evaluate_scheme_eligibility

def test_enhanced_engine():
    print("==========================================")
    print("  YOJANABUNDLE AGRICULTURE ENGINE TEST")
    print("==========================================")
    
    schemes = load_schemes()
    print(f"✓ Loaded {len(schemes)} agriculture schemes with dynamic rule predicates.\n")

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
            )
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
            )
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
            )
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
            )
        )
    ]

    for title, profile in test_profiles:
        print(f"--- {title} ---")
        matched = []
        unmatched = []

        for s in schemes:
            is_eligible, reasons = evaluate_scheme_eligibility(profile, s)
            if is_eligible:
                matched.append(s['shortName'])
            else:
                unmatched.append((s['shortName'], reasons))

        print(f"✓ MATCHED SCHEMES ({len(matched)}/8): {', '.join(matched) if matched else 'None'}")
        if unmatched:
            print(f"❌ DISQUALIFIED / UNMATCHED SCHEMES ({len(unmatched)}/8):")
            for name, reasons in unmatched:
                print(f"   • {name}: {'; '.join(reasons)}")
        else:
            print("  (Farmer matched all 8 active schemes)")
        print()

    print("✓ All agriculture engine tests completed successfully!")

if __name__ == "__main__":
    test_enhanced_engine()
