import os
import sys
import io

# Set stdout to UTF-8 for Windows console output
if hasattr(sys.stdout, 'buffer'):
    sys.stdout = io.TextIOWrapper(sys.stdout.buffer, encoding='utf-8')

from fastapi.testclient import TestClient

from main import app
from db import init_db, SessionLocal
from seed_demo_user import seed_demo_user

client = TestClient(app)

def test_auth_pipeline():
    print("==========================================")
    print("  YOJANABUNDLE AUTHENTICATION SUITE TEST")
    print("==========================================")

    init_db()

    # 1. Test Seed Demo User
    demo_user = seed_demo_user()
    print("[OK] Demo user successfully initialized in SQLite DB.\n")

    # 2. Test Signup with New Email (Expect 200 OK + Real Token)
    test_email = f"test.farmer.{int(os.times().system * 1000)}@example.com"
    test_password = "SecurePassword123!"

    signup_payload = {
        "name": "Kisan Test",
        "identifier": test_email,
        "password": test_password,
        "role": "Farmer",
        "profileAttributes": {
            "annual_income": 120000,
            "category": "SC",
            "state": "Maharashtra",
            "age": 30,
            "land_acres": 2.0,
            "owned_documents": ["Aadhaar Card"]
        }
    }

    res_signup = client.post("/api/auth/signup", json=signup_payload)
    print(f"1. Signup New User ({test_email}): Status {res_signup.status_code}")
    assert res_signup.status_code == 200, f"Signup failed: {res_signup.text}"
    data_signup = res_signup.json()
    assert data_signup["status"] == "success"
    assert "token" in data_signup
    signup_token = data_signup["token"]
    print("   [OK] Received real signed JWT token.")

    # 3. Test Duplicate Signup (Expect 409 Conflict)
    res_dup = client.post("/api/auth/signup", json=signup_payload)
    print(f"2. Duplicate Signup (Same Email): Status {res_dup.status_code}")
    assert res_dup.status_code == 409, f"Expected 409 Conflict, got {res_dup.status_code}"
    print("   [OK] Properly blocked duplicate account registration (409 Conflict).")

    # 4. Test Login with Wrong Password (Expect 401 Unauthorized)
    login_wrong = {
        "identifier": test_email,
        "password": "WrongPassword999!"
    }
    res_wrong = client.post("/api/auth/login", json=login_wrong)
    print(f"3. Login Wrong Password: Status {res_wrong.status_code}")
    assert res_wrong.status_code == 401, f"Expected 401 Unauthorized, got {res_wrong.status_code}"
    print("   [OK] Properly rejected invalid password (401 Unauthorized).")

    # 5. Test Login with Correct Password (Expect 200 OK + Real Token)
    login_correct = {
        "identifier": test_email,
        "password": test_password
    }
    res_correct = client.post("/api/auth/login", json=login_correct)
    print(f"4. Login Correct Password: Status {res_correct.status_code}")
    assert res_correct.status_code == 200, f"Login failed: {res_correct.text}"
    data_login = res_correct.json()
    login_token = data_login["token"]
    assert data_login["user"]["email"] == test_email
    print("   [OK] Login successful with bcrypt hash verification and JWT issuance.")

    # 6. Test GET /api/auth/me with Valid Token (Expect 200 OK + User Data)
    res_me = client.get("/api/auth/me", headers={"Authorization": f"Bearer {login_token}"})
    print(f"5. GET /api/auth/me (Valid Token): Status {res_me.status_code}")
    assert res_me.status_code == 200, f"auth/me failed: {res_me.text}"
    me_data = res_me.json()
    assert me_data["user"]["email"] == test_email
    print(f"   [OK] Verified token & retrieved user '{me_data['user']['name']}'.")

    # 7. Test GET /api/auth/me with Garbage/Invalid Token (Expect 401 Unauthorized)
    res_garbage = client.get("/api/auth/me", headers={"Authorization": "Bearer invalid.garbage.token"})
    print(f"6. GET /api/auth/me (Garbage Token): Status {res_garbage.status_code}")
    assert res_garbage.status_code == 401, f"Expected 401 Unauthorized, got {res_garbage.status_code}"
    print("   [OK] Rejected garbage token with 401 Unauthorized.")

    print("\n[OK] ALL AUTHENTICATION TESTS PASSED SUCCESSFULLY!")

if __name__ == "__main__":
    test_auth_pipeline()
