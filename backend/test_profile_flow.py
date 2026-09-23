import os
import sys
import io

if hasattr(sys.stdout, 'buffer'):
    sys.stdout = io.TextIOWrapper(sys.stdout.buffer, encoding='utf-8')

from fastapi.testclient import TestClient

from main import app
from db import init_db

client = TestClient(app)

def test_profile_end_to_end_flow():
    print("==================================================")
    print("  TESTING END-TO-END PROFILE PERSISTENCE & EVALUATION")
    print("==================================================")

    init_db()

    # 1. Signup New User (Blank profileAttributes)
    test_email = f"profile.test.{int(os.times().system * 1000)}@example.com"
    test_password = "CustomPassword123!"

    res_signup = client.post("/api/auth/signup", json={
        "name": "New Custom Farmer",
        "identifier": test_email,
        "password": test_password,
        "role": "Farmer",
        "profileAttributes": None
    })

    assert res_signup.status_code == 200, f"Signup failed: {res_signup.text}"
    signup_data = res_signup.json()
    token = signup_data["token"]
    user_data = signup_data["user"]
    print(f"1. Signup New User: {test_email}")
    print(f"   [OK] profileAttributes initialized to empty: {user_data['profileAttributes']}")
    assert user_data["profileAttributes"] == {} or user_data["profileAttributes"] is None

    # 2. Update Profile via PATCH /api/auth/profile
    custom_profile = {
        "annual_income": 350000.0,
        "land_acres": 4.2,
        "category": "EWS",
        "state": "Maharashtra",
        "age": 38,
        "occupation": "Commercial Farmer",
        "owned_documents": ["Aadhaar Card", "Income Certificate", "Caste Certificate"]
    }

    res_patch = client.patch(
        "/api/auth/profile",
        json=custom_profile,
        headers={"Authorization": f"Bearer {token}"}
    )
    print(f"2. PATCH /api/auth/profile: Status {res_patch.status_code}")
    assert res_patch.status_code == 200, f"PATCH profile failed: {res_patch.text}"
    patched_user = res_patch.json()["user"]
    print(f"   [OK] Saved Income: ₹{patched_user['profileAttributes']['annual_income']:,.0f}, Land: {patched_user['profileAttributes']['land_acres']} Acres")
    assert patched_user["profileAttributes"]["annual_income"] == 350000.0
    assert patched_user["profileAttributes"]["land_acres"] == 4.2

    # 3. Simulate Relogin / GET /api/auth/me (Database Persistence Check)
    res_me = client.get("/api/auth/me", headers={"Authorization": f"Bearer {token}"})
    assert res_me.status_code == 200
    me_user = res_me.json()["user"]
    print("3. Re-fetch via GET /api/auth/me (Simulating relogin from SQLite DB)")
    print(f"   [OK] Retrieved saved attributes from users.db: {me_user['profileAttributes']}")
    assert me_user["profileAttributes"]["annual_income"] == 350000.0
    assert me_user["profileAttributes"]["land_acres"] == 4.2

    # 4. Evaluate Profile via POST /api/evaluate
    res_eval = client.post("/api/evaluate", json=me_user["profileAttributes"])
    print(f"4. POST /api/evaluate with user's real numbers: Status {res_eval.status_code}")
    assert res_eval.status_code == 200
    eval_data = res_eval.json()
    print(f"   [OK] Matched Schemes: {eval_data['total_eligible_schemes']}, Total Benefit: {eval_data['formatted_potential_benefit']}")
    assert eval_data["total_eligible_schemes"] > 0

    print("\n[OK] END-TO-END PROFILE PERSISTENCE TEST PASSED SUCCESSFULLY!")

if __name__ == "__main__":
    test_profile_end_to_end_flow()
