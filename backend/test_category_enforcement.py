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
from services.data_cleaner import sanitize_scheme_object


def _load_schemes_from_file(*args, **kwargs):
    """File-based mock loader ensuring tests do not touch the production DB."""
    data_path = os.path.join(os.path.dirname(__file__), "data", "schemes.json")
    with open(data_path, "r", encoding="utf-8") as f:
        raw = json.load(f)
    return [sanitize_scheme_object(s) for s in raw]


@patch("main.load_schemes", side_effect=_load_schemes_from_file)
def run_category_enforcement_tests(mock_loader):
    print("==================================================")
    print("  TESTING CATEGORY ENFORCEMENT IN ELIGIBILITY")
    print("==================================================")

    # Base profile eligible for all age (30) and land (2.0 acres) criteria
    base_kwargs = {
        "annual_income": 120000.0,
        "state": "Maharashtra",
        "age": 30,
        "land_acres": 2.0,
        "occupation": "Small Farmer",
        "owned_documents": ["Aadhaar Card", "7/12 Land Record Extract", "Bank Passbook"]
    }

    # ----------------------------------------------------
    # 1. OBC Profile: neither Ambedkar nor Birsa Munda
    # ----------------------------------------------------
    obc_profile = UserProfile(category="OBC", **base_kwargs)
    res_obc = evaluate_profile(obc_profile)
    matched_ids_obc = [item.scheme["id"] for item in res_obc.ranked_schemes]
    ineligible_ids_obc = [item["scheme"]["id"] for item in res_obc.ineligible_schemes]

    print("\n1. Testing OBC Profile:")
    print(f"   Total Eligible: {res_obc.total_eligible_schemes}")
    assert "DR_AMBEDKAR_KRUSHI_SWAVALAMBAN" not in matched_ids_obc, "Ambedkar should NOT match OBC"
    assert "BIRSA_MUNDA_KRUSHI_KRANTI" not in matched_ids_obc, "Birsa Munda should NOT match OBC"
    assert "DR_AMBEDKAR_KRUSHI_SWAVALAMBAN" in ineligible_ids_obc
    assert "BIRSA_MUNDA_KRUSHI_KRANTI" in ineligible_ids_obc
    print("   [OK] OBC profile excluded from Ambedkar (SC) and Birsa Munda (ST)")

    # ----------------------------------------------------
    # 2. SC Profile: Ambedkar YES, Birsa Munda NO
    # ----------------------------------------------------
    sc_profile = UserProfile(category="SC", **base_kwargs)
    res_sc = evaluate_profile(sc_profile)
    matched_ids_sc = [item.scheme["id"] for item in res_sc.ranked_schemes]

    print("\n2. Testing SC Profile:")
    print(f"   Total Eligible: {res_sc.total_eligible_schemes}")
    assert "DR_AMBEDKAR_KRUSHI_SWAVALAMBAN" in matched_ids_sc, "Ambedkar MUST match SC"
    assert "BIRSA_MUNDA_KRUSHI_KRANTI" not in matched_ids_sc, "Birsa Munda should NOT match SC"
    print("   [OK] SC profile matched Ambedkar, excluded from Birsa Munda")

    # ----------------------------------------------------
    # 3. ST Profile: Birsa Munda YES, Ambedkar NO
    # ----------------------------------------------------
    st_profile = UserProfile(category="ST", **base_kwargs)
    res_st = evaluate_profile(st_profile)
    matched_ids_st = [item.scheme["id"] for item in res_st.ranked_schemes]

    print("\n3. Testing ST Profile:")
    print(f"   Total Eligible: {res_st.total_eligible_schemes}")
    assert "BIRSA_MUNDA_KRUSHI_KRANTI" in matched_ids_st, "Birsa Munda MUST match ST"
    assert "DR_AMBEDKAR_KRUSHI_SWAVALAMBAN" not in matched_ids_st, "Ambedkar should NOT match ST"
    print("   [OK] ST profile matched Birsa Munda, excluded from Ambedkar")

    # ----------------------------------------------------
    # 4. General Profile: neither Ambedkar nor Birsa Munda
    # ----------------------------------------------------
    gen_profile = UserProfile(category="General", **base_kwargs)
    res_gen = evaluate_profile(gen_profile)
    matched_ids_gen = [item.scheme["id"] for item in res_gen.ranked_schemes]

    print("\n4. Testing General Profile:")
    print(f"   Total Eligible: {res_gen.total_eligible_schemes}")
    assert "DR_AMBEDKAR_KRUSHI_SWAVALAMBAN" not in matched_ids_gen, "Ambedkar should NOT match General"
    assert "BIRSA_MUNDA_KRUSHI_KRANTI" not in matched_ids_gen, "Birsa Munda should NOT match General"
    print("   [OK] General profile excluded from both SC & ST schemes")

    # ----------------------------------------------------
    # 5. EWS Profile: neither Ambedkar nor Birsa Munda, general schemes match
    # ----------------------------------------------------
    ews_profile = UserProfile(category="EWS", **base_kwargs)
    res_ews = evaluate_profile(ews_profile)
    matched_ids_ews = [item.scheme["id"] for item in res_ews.ranked_schemes]

    print("\n5. Testing EWS Profile:")
    print(f"   Total Eligible: {res_ews.total_eligible_schemes}")
    assert "DR_AMBEDKAR_KRUSHI_SWAVALAMBAN" not in matched_ids_ews, "Ambedkar should NOT match EWS"
    assert "BIRSA_MUNDA_KRUSHI_KRANTI" not in matched_ids_ews, "Birsa Munda should NOT match EWS"
    assert "PM_KISAN" in matched_ids_ews, "General schemes should match EWS"
    print("   [OK] EWS profile matched general schemes, excluded from SC/ST schemes")

    # ----------------------------------------------------
    # 6. Missing / None / Empty Category: no crash, general schemes unaffected
    # ----------------------------------------------------
    print("\n6. Testing Missing / Empty / Unrecognized Categories:")
    for test_cat in [None, "", "   ", "Unknown", "Other"]:
        unknown_profile = UserProfile(category=test_cat, **base_kwargs)
        res_unk = evaluate_profile(unknown_profile)
        matched_ids_unk = [item.scheme["id"] for item in res_unk.ranked_schemes]

        assert "PM_KISAN" in matched_ids_unk, f"PM_KISAN should match when category is '{test_cat}'"
        assert "DR_AMBEDKAR_KRUSHI_SWAVALAMBAN" not in matched_ids_unk, f"Ambedkar should NOT match when category is '{test_cat}'"
        assert "BIRSA_MUNDA_KRUSHI_KRANTI" not in matched_ids_unk, f"Birsa Munda should NOT match when category is '{test_cat}'"
        print(f"   [OK] Category='{test_cat}': 0 crashes, general schemes matched, SC/ST disqualified")

    print("\nAll category enforcement tests passed successfully!")


if __name__ == "__main__":
    run_category_enforcement_tests()
