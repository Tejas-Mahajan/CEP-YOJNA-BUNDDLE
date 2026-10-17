import sys
import io
import os
import json
import time
import unittest
from unittest.mock import patch
from fastapi.testclient import TestClient
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
from sqlalchemy.pool import StaticPool

# Set stdout to UTF-8 for Windows console printing
sys.stdout = io.TextIOWrapper(sys.stdout.buffer, encoding="utf-8")

from db import Base, get_db
from models_db import Scheme, User, Feedback
from admin_routes import (
    reset_brute_force_state,
    create_session_token,
    generate_csrf_token,
    _get_signing_key,
    _b64url_encode
)
import hmac
import hashlib
from main import app, _SCHEMES_CACHE

# Create isolated in-memory SQLite database for testing (never touches production Neon DB)
TEST_SQLITE_URL = "sqlite:///:memory:"
test_engine = create_engine(
    TEST_SQLITE_URL,
    connect_args={"check_same_thread": False},
    poolclass=StaticPool
)
TestingSessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=test_engine)


def override_get_db():
    db = TestingSessionLocal()
    try:
        yield db
    finally:
        db.close()


class AdminSecurityAndRoutesTestCase(unittest.TestCase):
    @classmethod
    def setUpClass(cls):
        Base.metadata.create_all(bind=test_engine)
        app.dependency_overrides[get_db] = override_get_db
        cls.client = TestClient(app)
        cls.valid_key = "test_super_secret_admin_key_12345"

    @classmethod
    def tearDownClass(cls):
        app.dependency_overrides.clear()
        Base.metadata.drop_all(bind=test_engine)

    def setUp(self):
        reset_brute_force_state()
        os.environ["ADMIN_SECRET_KEY"] = self.valid_key
        os.environ["ADMIN_COOKIE_SECURE"] = "auto"
        # Clear cookies in test client
        self.client.cookies.clear()

        # Seed test data in SQLite
        db = TestingSessionLocal()
        db.query(Scheme).delete()
        db.query(User).delete()
        db.query(Feedback).delete()

        # Seed sample scheme
        test_scheme = Scheme(
            id="TEST_SCHEME",
            name="Test Agriculture Scheme",
            short_name="Test Scheme",
            level="Central",
            government="Government of India",
            rules=[{"field": "age", "operator": ">=", "value": 18}],
            category_target=["General", "OBC", "SC", "ST", "EWS"],
            benefit_amount=5000.0,
            benefit_type="Direct Cash Transfer",
            closing_date="2026-12-31",
            required_documents=["Aadhaar Card"],
            application_steps=["Step 1"],
            mutually_exclusive_with=[]
        )
        db.add(test_scheme)

        # Seed sample user
        test_user = User(
            id="user_admin_test_1",
            name="Ramesh Patil",
            email="ramesh@example.com",
            password_hash="$2b$12$eX4mpleHashNotRealPassword",
            role="Farmer",
            profile_attributes={"category": "OBC", "land_acres": 2.5, "annual_income": 150000.0, "state": "Maharashtra"}
        )
        db.add(test_user)

        # Seed sample feedback
        test_fb = Feedback(
            id="fb_test_1",
            scheme_id="TEST_SCHEME",
            rating="up",
            comment="Extremely helpful recommendation!",
            user_id="user_admin_test_1"
        )
        db.add(test_fb)

        db.commit()
        db.close()

    def _login(self, client=None, key=None):
        """Helper to log in and return (session_cookie, csrf_token)."""
        c = client or self.client
        k = key if key is not None else self.valid_key
        res = c.post("/api/admin/login", json={"key": k})
        if res.status_code != 200:
            return None, None
        data = res.json()
        cookie = c.cookies.get("yb_admin_session")
        return cookie, data["csrf_token"]

    # -----------------------------------------------------------------------
    # 1. Unset ADMIN_SECRET_KEY returns 404 (Admin Disabled) for all routes
    # -----------------------------------------------------------------------
    def test_routes_return_404_when_secret_key_unset(self):
        with patch.dict(os.environ, {"ADMIN_SECRET_KEY": ""}):
            # Login endpoint returns 404
            res_login = self.client.post("/api/admin/login", json={"key": self.valid_key})
            self.assertEqual(res_login.status_code, 404, "Unset key must return 404 for login")

            # Session endpoint returns 404
            res_sess = self.client.get("/api/admin/session")
            self.assertEqual(res_sess.status_code, 404, "Unset key must return 404 for session")

            # Logout endpoint returns 404
            res_logout = self.client.post("/api/admin/logout")
            self.assertEqual(res_logout.status_code, 404, "Unset key must return 404 for logout")

            # Data endpoint returns 404
            res_data = self.client.get("/api/admin/schemes")
            self.assertEqual(res_data.status_code, 404, "Unset key must return 404 for data endpoints")

            # HTML panel route returns 404
            res_html = self.client.get("/admin-panel")
            self.assertEqual(res_html.status_code, 404, "Unset key must return 404 for /admin-panel")

    # -----------------------------------------------------------------------
    # 2. Login: Cookie attributes, no key in response, Secure flag on HTTPS
    # -----------------------------------------------------------------------
    def test_login_cookie_attributes_and_response_body(self):
        # Test HTTPS client
        https_client = TestClient(app, base_url="https://testserver")
        res = https_client.post("/api/admin/login", json={"key": self.valid_key})
        self.assertEqual(res.status_code, 200)

        # Check response body: contains csrf_token & expires_at, NEVER the key or password_hash
        data = res.json()
        self.assertIn("csrf_token", data)
        self.assertIn("expires_at", data)
        self.assertNotIn("key", data)
        self.assertNotIn("admin_key", data)
        self.assertNotIn("token", data)
        self.assertNotIn("password_hash", data)

        # Inspect Set-Cookie header
        set_cookie = res.headers.get("set-cookie", "")
        self.assertIn("yb_admin_session=", set_cookie)
        self.assertIn("HttpOnly", set_cookie)
        self.assertIn("Path=/api/admin", set_cookie)
        self.assertIn("Max-Age=86400", set_cookie)
        # Case-insensitive SameSite=Strict check
        self.assertIn("samesite=strict", set_cookie.lower())
        # Secure flag must be present on HTTPS
        self.assertIn("Secure", set_cookie)

        # Test HTTP client in auto mode: Secure flag should NOT be present
        http_client = TestClient(app, base_url="http://testserver")
        res_http = http_client.post("/api/admin/login", json={"key": self.valid_key})
        self.assertEqual(res_http.status_code, 200)
        set_cookie_http = res_http.headers.get("set-cookie", "")
        self.assertNotIn("Secure", set_cookie_http, "Secure flag should not be present on HTTP in auto mode")

        # Test ADMIN_COOKIE_SECURE=true forces Secure even on HTTP
        with patch.dict(os.environ, {"ADMIN_COOKIE_SECURE": "true"}):
            res_forced = http_client.post("/api/admin/login", json={"key": self.valid_key})
            self.assertEqual(res_forced.status_code, 200)
            self.assertIn("Secure", res_forced.headers.get("set-cookie", ""))

        # Test ADMIN_COOKIE_SECURE=false disables Secure even on HTTPS
        with patch.dict(os.environ, {"ADMIN_COOKIE_SECURE": "false"}):
            res_unsec = https_client.post("/api/admin/login", json={"key": self.valid_key})
            self.assertEqual(res_unsec.status_code, 200)
            self.assertNotIn("Secure", res_unsec.headers.get("set-cookie", ""))

    # -----------------------------------------------------------------------
    # 3. Login Brute-force & Wrong Key: 401 on wrong key, 429 on 5th attempt
    # -----------------------------------------------------------------------
    def test_login_brute_force_lockout_429(self):
        reset_brute_force_state()

        # 4 failed attempts -> 401
        for i in range(4):
            res = self.client.post("/api/admin/login", json={"key": f"bad_key_{i}"})
            self.assertEqual(res.status_code, 401)
            self.assertEqual(res.json().get("detail"), "Unauthorized")

        # 5th failed attempt triggers lockout -> 429
        res_5th = self.client.post("/api/admin/login", json={"key": "bad_key_5"})
        self.assertEqual(res_5th.status_code, 429, "5th failed attempt must trigger 429")

        # Correct key from locked out IP still returns 429
        res_locked = self.client.post("/api/admin/login", json={"key": self.valid_key})
        self.assertEqual(res_locked.status_code, 429, "Locked out IP must return 429 even with correct key")

        reset_brute_force_state()

    # -----------------------------------------------------------------------
    # 4. Global Safety Valve: >50 global failures triggers 429 on bad keys, allows valid key
    # -----------------------------------------------------------------------
    def test_global_safety_valve_triggers_429_on_bad_keys_but_allows_correct_key(self):
        reset_brute_force_state()
        # 51 distinct IPs each making 1 failed attempt
        for i in range(51):
            attacker = TestClient(app, client=(f"10.1.{i // 256}.{i % 256}", 50000))
            res = attacker.post("/api/admin/login", json={"key": f"bad_key_{i}"})
            if i < 50:
                self.assertEqual(res.status_code, 401, f"Attempt {i+1} should return 401")
            else:
                self.assertEqual(res.status_code, 429, "Attempt exceeding 50 global failures must return 429")

        # Bad key from new IP gets 429
        new_attacker = TestClient(app, client=("10.2.0.1", 50000))
        res_bad = new_attacker.post("/api/admin/login", json={"key": "another_bad_key"})
        self.assertEqual(res_bad.status_code, 429)

        # Valid key from unbanned IP succeeds (200)
        admin_client = TestClient(app, client=("192.168.1.1", 50000))
        res_admin = admin_client.post("/api/admin/login", json={"key": self.valid_key})
        self.assertEqual(res_admin.status_code, 200, "Valid key must bypass global safety valve")
        reset_brute_force_state()

    # -----------------------------------------------------------------------
    # 5. Data Endpoints: Require cookie; X-Admin-Key alone is rejected; Tampered & Expired tokens fail
    # -----------------------------------------------------------------------
    def test_data_endpoints_reject_without_valid_cookie(self):
        # A. No cookie
        res_no_cookie = self.client.get("/api/admin/schemes")
        self.assertEqual(res_no_cookie.status_code, 401)

        # B. X-Admin-Key header alone without cookie is rejected with 401
        res_header_only = self.client.get("/api/admin/schemes", headers={"X-Admin-Key": self.valid_key})
        self.assertEqual(res_header_only.status_code, 401, "X-Admin-Key alone must no longer authenticate data endpoints")

        # C. Key in query string is rejected
        res_query = self.client.get(f"/api/admin/schemes?key={self.valid_key}")
        self.assertEqual(res_query.status_code, 401)

        # D. Tampered cookie
        cookie, _ = self._login()
        tampered_cookie = cookie[:-5] + "AAAAA"
        res_tampered = self.client.get("/api/admin/schemes", cookies={"yb_admin_session": tampered_cookie})
        self.assertEqual(res_tampered.status_code, 401, "Tampered cookie must return 401")

        # E. Expired cookie
        signing_key = _get_signing_key(self.valid_key)
        expired_payload = {
            "sid": "expired_session_123",
            "iat": int(time.time()) - 90000,
            "exp": int(time.time()) - 3600,  # Expired 1 hour ago
            "v": "v1"
        }
        payload_bytes = json.dumps(expired_payload, separators=(",", ":")).encode("utf-8")
        sig = hmac.new(signing_key, payload_bytes, hashlib.sha256).digest()
        expired_token = f"{_b64url_encode(payload_bytes)}.{_b64url_encode(sig)}"

        res_expired = self.client.get("/api/admin/schemes", cookies={"yb_admin_session": expired_token})
        self.assertEqual(res_expired.status_code, 401, "Expired cookie must return 401")

    # -----------------------------------------------------------------------
    # 6. CSRF & Origin Protection on state-changing requests
    # -----------------------------------------------------------------------
    def test_csrf_and_origin_protection(self):
        cookie, csrf_token = self._login()
        self.assertIsNotNone(csrf_token)

        update_payload = {"name": "CSRF Protected Scheme"}

        # A. Missing CSRF header returns 403
        res_missing_csrf = self.client.put(
            "/api/admin/schemes/TEST_SCHEME",
            json=update_payload
        )
        self.assertEqual(res_missing_csrf.status_code, 403, "Missing CSRF token must return 403")

        # B. Wrong CSRF token returns 403
        res_wrong_csrf = self.client.put(
            "/api/admin/schemes/TEST_SCHEME",
            json=update_payload,
            headers={"X-CSRF-Token": "invalid_csrf_token_xyz"}
        )
        self.assertEqual(res_wrong_csrf.status_code, 403, "Invalid CSRF token must return 403")

        # C. Mismatched Origin returns 403
        res_bad_origin = self.client.put(
            "/api/admin/schemes/TEST_SCHEME",
            json=update_payload,
            headers={
                "X-CSRF-Token": csrf_token,
                "Origin": "https://malicious-website.com"
            }
        )
        self.assertEqual(res_bad_origin.status_code, 403, "Mismatched Origin must return 403")

        # D. Valid CSRF token and valid Origin returns 200
        res_valid = self.client.put(
            "/api/admin/schemes/TEST_SCHEME",
            json=update_payload,
            headers={
                "X-CSRF-Token": csrf_token,
                "Origin": "http://testserver"
            }
        )
        self.assertEqual(res_valid.status_code, 200, "Valid CSRF and Origin must succeed")

    # -----------------------------------------------------------------------
    # 7. GET /api/admin/session endpoint
    # -----------------------------------------------------------------------
    def test_get_session_endpoint(self):
        # Without cookie -> 401
        res_unauth = self.client.get("/api/admin/session")
        self.assertEqual(res_unauth.status_code, 401)

        # With valid cookie -> 200 with csrf_token and expires_at
        self._login()
        res_ok = self.client.get("/api/admin/session")
        self.assertEqual(res_ok.status_code, 200)
        data = res_ok.json()
        self.assertIn("csrf_token", data)
        self.assertIn("expires_at", data)
        self.assertNotIn("key", data)

    # -----------------------------------------------------------------------
    # 8. POST /api/admin/logout clears cookie and returns 204
    # -----------------------------------------------------------------------
    def test_logout_clears_cookie_and_stateless_session_limitation(self):
        cookie, csrf = self._login()

        # Logout with CSRF token returns 204
        res_logout = self.client.post(
            "/api/admin/logout",
            headers={"X-CSRF-Token": csrf}
        )
        self.assertEqual(res_logout.status_code, 204)
        set_cookie = res_logout.headers.get("set-cookie", "")
        self.assertIn("Max-Age=0", set_cookie, "Logout must set Max-Age=0 to clear the cookie")
        self.assertIn("Path=/api/admin", set_cookie)
        self.assertIn("HttpOnly", set_cookie)

        # STATELESS SESSIONS LIMITATION NOTE:
        # Since tokens are stateless and signed, clearing the cookie deletes it in the client browser.
        # If an attacker intercepted the raw token prior to logout, replaying that token would still verify
        # until the 24-hour expiration elapses or ADMIN_SECRET_KEY is rotated.
        # This is the expected trade-off of stateless signed tokens.

    # -----------------------------------------------------------------------
    # 9. Rotating ADMIN_SECRET_KEY invalidates previously valid sessions
    # -----------------------------------------------------------------------
    def test_rotating_secret_key_invalidates_existing_sessions(self):
        cookie, _ = self._login()

        # Session is valid initially
        res_before = self.client.get("/api/admin/schemes")
        self.assertEqual(res_before.status_code, 200)

        # Rotate the secret key
        with patch.dict(os.environ, {"ADMIN_SECRET_KEY": "new_rotated_secret_key_67890"}):
            # Same cookie is now rejected because signing_key was derived from the old ADMIN_SECRET_KEY
            res_after = self.client.get("/api/admin/schemes")
            self.assertEqual(res_after.status_code, 401, "Rotated ADMIN_SECRET_KEY must invalidate previously issued sessions")

    # -----------------------------------------------------------------------
    # 10. No response ever exposes password_hash, admin key, or raw tokens
    # -----------------------------------------------------------------------
    def test_users_endpoint_never_exposes_password_hash(self):
        self._login()
        res = self.client.get("/api/admin/users")
        self.assertEqual(res.status_code, 200)

        data = res.json()
        self.assertGreater(data["total"], 0)
        for user_item in data["items"]:
            self.assertNotIn("password_hash", user_item)
            self.assertNotIn("password", user_item)
            self.assertNotIn(self.valid_key, json.dumps(user_item))
            self.assertIn("profile_summary", user_item)
            self.assertIn("email", user_item)

    # -----------------------------------------------------------------------
    # 11. Security Headers: Cache-Control: no-store, X-Robots-Tag: noindex, no CORS
    # -----------------------------------------------------------------------
    def test_security_headers_and_cors_stripped(self):
        # On login
        res_login = self.client.post("/api/admin/login", json={"key": self.valid_key})
        self.assertEqual(res_login.headers.get("Cache-Control"), "no-store")
        self.assertEqual(res_login.headers.get("X-Robots-Tag"), "noindex")
        self.assertNotIn("Access-Control-Allow-Origin", res_login.headers)
        self.assertNotIn("Access-Control-Allow-Credentials", res_login.headers)

        # On session
        res_sess = self.client.get("/api/admin/session")
        self.assertEqual(res_sess.headers.get("Cache-Control"), "no-store")
        self.assertEqual(res_sess.headers.get("X-Robots-Tag"), "noindex")
        self.assertNotIn("Access-Control-Allow-Origin", res_sess.headers)

        # On panel
        res_panel = self.client.get("/admin-panel")
        self.assertEqual(res_panel.status_code, 200)
        self.assertEqual(res_panel.headers.get("Cache-Control"), "no-store")
        self.assertEqual(res_panel.headers.get("X-Robots-Tag"), "noindex")
        self.assertNotIn("Access-Control-Allow-Origin", res_panel.headers)

    # -----------------------------------------------------------------------
    # 12. Input Validation on Scheme modification
    # -----------------------------------------------------------------------
    def test_validation_rejects_malformed_inputs(self):
        _, csrf = self._login()
        headers = {"X-CSRF-Token": csrf}

        # A. Invalid Operator in rules
        bad_rule_payload = {
            "name": "Updated Scheme",
            "rules": [{"field": "age", "operator": "INVALID_OP", "value": 18}]
        }
        res = self.client.put("/api/admin/schemes/TEST_SCHEME", json=bad_rule_payload, headers=headers)
        self.assertEqual(res.status_code, 422)
        self.assertIn("invalid operator", res.json()["detail"].lower())

        # B. Invalid BETWEEN rule: min > max
        bad_between_payload = {
            "rules": [{"field": "land_acres", "operator": "BETWEEN", "value": [10.0, 2.0]}]
        }
        res = self.client.put("/api/admin/schemes/TEST_SCHEME", json=bad_between_payload, headers=headers)
        self.assertEqual(res.status_code, 422)
        self.assertIn("between", res.json()["detail"].lower())

        # C. Invalid closing_date format
        bad_date_payload = {"closing_date": "31-12-2026"}
        res = self.client.put("/api/admin/schemes/TEST_SCHEME", json=bad_date_payload, headers=headers)
        self.assertEqual(res.status_code, 422)
        self.assertIn("closing_date", res.json()["detail"])

        # D. Invalid calendar date
        invalid_calendar_payload = {"closing_date": "2026-02-30"}
        res = self.client.put("/api/admin/schemes/TEST_SCHEME", json=invalid_calendar_payload, headers=headers)
        self.assertEqual(res.status_code, 422)
        self.assertIn("valid calendar date", res.json()["detail"])

        # E. Negative benefit_amount
        neg_benefit_payload = {"benefit_amount": -500.0}
        res = self.client.put("/api/admin/schemes/TEST_SCHEME", json=neg_benefit_payload, headers=headers)
        self.assertEqual(res.status_code, 422)
        self.assertIn("benefit_amount", res.json()["detail"])

        # F. Non-list required_documents
        non_list_docs = {"required_documents": "Aadhaar Card"}
        res = self.client.put("/api/admin/schemes/TEST_SCHEME", json=non_list_docs, headers=headers)
        self.assertEqual(res.status_code, 422)
        self.assertIn("required_documents", res.json()["detail"])

        # G. Invalid category_target
        bad_cat_payload = {"category_target": ["General", "AlienCategory"]}
        res = self.client.put("/api/admin/schemes/TEST_SCHEME", json=bad_cat_payload, headers=headers)
        self.assertEqual(res.status_code, 422)
        self.assertIn("category_target", res.json()["detail"])

    # -----------------------------------------------------------------------
    # 13. Successful PUT updates DB and clears cache
    # -----------------------------------------------------------------------
    def test_successful_put_updates_db_and_clears_cache(self):
        _, csrf = self._login()
        headers = {"X-CSRF-Token": csrf}

        # Populate cache
        _SCHEMES_CACHE["data"] = [{"id": "OLD_CACHED_DATA"}]
        _SCHEMES_CACHE["timestamp"] = 9999999999.0

        update_payload = {
            "name": "Updated Super Solar Scheme",
            "shortName": "Super Solar",
            "benefit_amount": 75000.0,
            "closing_date": "2026-10-31"
        }
        res = self.client.put("/api/admin/schemes/TEST_SCHEME", json=update_payload, headers=headers)
        self.assertEqual(res.status_code, 200)
        data = res.json()["scheme"]
        self.assertEqual(data["name"], "Updated Super Solar Scheme")
        self.assertEqual(data["benefit_amount"], 75000.0)
        self.assertEqual(data["closing_date"], "2026-10-31")

        # Verify cache was cleared
        self.assertIsNone(_SCHEMES_CACHE["data"], "Schemes cache must be invalidated after PUT")

    # -----------------------------------------------------------------------
    # 14. POST creates new scheme and rejects duplicate ID (409)
    # -----------------------------------------------------------------------
    def test_post_scheme_and_duplicate_prevention(self):
        _, csrf = self._login()
        headers = {"X-CSRF-Token": csrf}

        new_scheme_payload = {
            "id": "NEW_SCHEME_2026",
            "name": "Brand New Farmer Initiative",
            "shortName": "New Initiative",
            "level": "State",
            "benefit_amount": 12000.0,
            "category_target": ["General", "OBC"],
            "rules": [{"field": "land_acres", "operator": ">=", "value": 1.0}],
            "required_documents": ["Aadhaar Card", "7/12 Land Record Extract"]
        }

        # Create
        res = self.client.post("/api/admin/schemes", json=new_scheme_payload, headers=headers)
        self.assertEqual(res.status_code, 201)
        self.assertEqual(res.json()["scheme"]["id"], "NEW_SCHEME_2026")

        # Duplicate ID rejection
        res_dup = self.client.post("/api/admin/schemes", json=new_scheme_payload, headers=headers)
        self.assertEqual(res_dup.status_code, 409, "Duplicate ID must return 409 Conflict")

    # -----------------------------------------------------------------------
    # 15. Client IP: Spoofed X-Forwarded-For ignored with TRUSTED_PROXY_COUNT=0
    # -----------------------------------------------------------------------
    def test_client_ip_spoofed_forwarded_for_ignored_when_trusted_proxy_count_0(self):
        reset_brute_force_state()
        with patch.dict(os.environ, {"TRUSTED_PROXY_COUNT": "0"}):
            client_a = TestClient(app, client=("192.168.1.10", 50000))
            # Client A sends 5 bad attempts with a spoofed XFF header (8.8.8.8)
            for _ in range(5):
                res = client_a.post(
                    "/api/admin/login",
                    json={"key": "bad_key"},
                    headers={"X-Forwarded-For": "8.8.8.8"}
                )
            self.assertEqual(res.status_code, 429)

            # Client A (192.168.1.10) is locked out
            res_a = client_a.post("/api/admin/login", json={"key": self.valid_key})
            self.assertEqual(res_a.status_code, 429, "Client A host 192.168.1.10 must be locked out")

            # 8.8.8.8 was NOT locked out because spoofed XFF was ignored
            client_b = TestClient(app, client=("8.8.8.8", 50000))
            res_b = client_b.post("/api/admin/login", json={"key": self.valid_key})
            self.assertEqual(res_b.status_code, 200, "8.8.8.8 must not be locked out when TRUSTED_PROXY_COUNT=0")
        reset_brute_force_state()

    # -----------------------------------------------------------------------
    # 16. Client IP: TRUSTED_PROXY_COUNT=1 extracts rightmost-minus-one entry
    # -----------------------------------------------------------------------
    def test_client_ip_trusted_proxy_count_1_uses_rightmost_minus_one(self):
        reset_brute_force_state()
        with patch.dict(os.environ, {"TRUSTED_PROXY_COUNT": "1"}):
            proxy_client = TestClient(app, client=("10.0.0.1", 50000))
            # Header format: <spoofed_leftmost>, <client_ip>, <trusted_proxy>
            xff_header = "1.1.1.1, 203.0.113.195, 198.51.100.1"

            for _ in range(5):
                res = proxy_client.post(
                    "/api/admin/login",
                    json={"key": "bad_key"},
                    headers={"X-Forwarded-For": xff_header}
                )
            self.assertEqual(res.status_code, 429)

            # Real client IP (203.0.113.195) is locked out through the proxy
            res_locked = proxy_client.post(
                "/api/admin/login",
                json={"key": self.valid_key},
                headers={"X-Forwarded-For": "203.0.113.195, 198.51.100.1"}
            )
            self.assertEqual(res_locked.status_code, 429, "203.0.113.195 should be locked out")

            # Leftmost spoofed IP (1.1.1.1) was NOT the recorded IP
            res_spoofed = TestClient(app, client=("1.1.1.1", 50000)).post(
                "/api/admin/login",
                json={"key": self.valid_key}
            )
            self.assertEqual(res_spoofed.status_code, 200, "Spoofed leftmost IP was not targeted")

            # Different client through the same proxy succeeds
            res_other = proxy_client.post(
                "/api/admin/login",
                json={"key": self.valid_key},
                headers={"X-Forwarded-For": "198.51.100.200, 198.51.100.1"}
            )
            self.assertEqual(res_other.status_code, 200, "Different client IP through proxy must succeed")
        reset_brute_force_state()

    # -----------------------------------------------------------------------
    # 17. Lockout Isolation: Correct key from a different IP always works
    # -----------------------------------------------------------------------
    def test_correct_key_from_different_ip_always_works_when_one_ip_is_locked_out(self):
        reset_brute_force_state()
        client_locked = TestClient(app, client=("192.168.1.100", 50000))
        client_legit = TestClient(app, client=("192.168.1.200", 50000))

        # Lock out IP 192.168.1.100 with 5 failed attempts
        for i in range(5):
            res = client_locked.post("/api/admin/login", json={"key": f"bad_key_{i}"})
        self.assertEqual(res.status_code, 429)

        # Attempting with correct key from the locked-out IP still fails (429)
        res_same_ip = client_locked.post("/api/admin/login", json={"key": self.valid_key})
        self.assertEqual(res_same_ip.status_code, 429, "Locked-out IP must remain locked out even with correct key")

        # But correct key from a DIFFERENT IP succeeds (200)
        res_different_ip = client_legit.post("/api/admin/login", json={"key": self.valid_key})
        self.assertEqual(res_different_ip.status_code, 200, "Correct key from different IP must always work")
        reset_brute_force_state()

    # -----------------------------------------------------------------------
    # 18. Malformed X-Forwarded-For falls back to client host
    # -----------------------------------------------------------------------
    def test_malformed_forwarded_for_falls_back_to_client_host(self):
        reset_brute_force_state()
        with patch.dict(os.environ, {"TRUSTED_PROXY_COUNT": "1"}):
            client = TestClient(app, client=("192.168.1.55", 50000))
            for _ in range(5):
                client.post("/api/admin/login", json={"key": "bad"}, headers={"X-Forwarded-For": "not-an-ip, 1.2.3.4"})
            res = client.post("/api/admin/login", json={"key": self.valid_key})
            self.assertEqual(res.status_code, 429, "Fallback host 192.168.1.55 should be locked out")
        reset_brute_force_state()

    # -----------------------------------------------------------------------
    # 19. Root Route GET / and HEAD /
    # -----------------------------------------------------------------------
    def test_root_route_returns_200_and_no_admin_mention(self):
        res = self.client.get("/"); self.assertEqual(res.status_code, 200); self.assertNotIn("admin", res.text.lower()); self.assertEqual(self.client.head("/").status_code, 200)


def run_tests():
    suite = unittest.TestLoader().loadTestsFromTestCase(AdminSecurityAndRoutesTestCase)
    runner = unittest.TextTestRunner(verbosity=2)
    result = runner.run(suite)
    if not result.wasSuccessful():
        sys.exit(1)


if __name__ == "__main__":
    run_tests()
