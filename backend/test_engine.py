import sys
import io

# Set stdout to UTF-8 for Windows console printing
sys.stdout = io.TextIOWrapper(sys.stdout.buffer, encoding='utf-8')

from main import evaluate_profile, load_schemes
from models import UserProfile

def test_enhanced_engine():
    print("==========================================")
    print("  YOJANABUNDLE ENHANCED ENGINE TEST SUITE")
    print("==========================================")
    
    schemes = load_schemes()
    print(f"✓ Loaded {len(schemes)} schemes with dynamic rule predicates.\n")

    # Test Case 1: SC Merit Engineering Student (Triggers Mutual Exclusivity: Post-Matric SC vs Top Class SC)
    sc_student = UserProfile(
        domain="education",
        annual_income=180000.0,
        category="SC",
        state="Pan-India / All",
        age=21,
        course_level="Engineering",
        marks_percentage=82.0,
        owned_documents=["Aadhaar Card", "Caste Certificate", "Income Certificate", "Mark Sheet (10th/12th)", "College Fee Receipt", "Bank Passbook"]
    )

    result_sc = evaluate_profile(sc_student)
    print("--- TEST CASE 1: SC MERIT STUDENT (CONFLICT DETECTION TEST) ---")
    print(f"Total Matched Eligible Schemes: {result_sc.total_eligible_schemes}")
    print(f"Total Potential Benefit: {result_sc.formatted_potential_benefit}")
    print(f"Document Readiness: {result_sc.document_readiness_pct}%")
    
    print(f"\n⚡ Conflicts Detected ({len(result_sc.conflicts_detected)}):")
    for c in result_sc.conflicts_detected:
        print(f"  • {c.reason_en}")

    print("\nAction Plan Priority Rankings:")
    for r in result_sc.ranked_schemes:
        secondary_flag = " [MUTUALLY EXCLUSIVE SECONDARY]" if r.is_mutually_exclusive_secondary else ""
        print(f"  [{r.priority_tier}] Score: {r.composite_score} | {r.scheme['shortName']} | Benefit: {r.scheme['benefit_display']}{secondary_flag}")

    # Test Case 2: Small Farmer in Maharashtra (Graph Document Overlap Test)
    farmer_profile = UserProfile(
        domain="agriculture",
        annual_income=180000.0,
        category="OBC",
        state="Maharashtra",
        age=42,
        land_acres=2.5,
        occupation="Small Farmer",
        owned_documents=["Aadhaar Card", "7/12 Land Record Extract", "Bank Passbook"]
    )

    result_farmer = evaluate_profile(farmer_profile)
    print("\n--- TEST CASE 2: FARMER GRAPH DOCUMENT OVERLAP TEST ---")
    print(f"Total Matched Eligible Schemes: {result_farmer.total_eligible_schemes}")
    print(f"Document Readiness: {result_farmer.document_readiness_pct}%")
    print(f"\n🔥 Key Document Banners ({len(result_farmer.high_leverage_callouts)}):")
    for callout in result_farmer.high_leverage_callouts:
        print(f"  {callout}")

    print("\n✓ All tests completed successfully!")

if __name__ == "__main__":
    test_enhanced_engine()
