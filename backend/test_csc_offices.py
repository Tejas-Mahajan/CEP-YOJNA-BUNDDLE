import pytest
from fastapi.testclient import TestClient
from main import app
from db import SessionLocal
from models_db import CscOffice
from seed_csc_offices import run_seed

client = TestClient(app)

def test_csc_offices_seeding_and_api():
    # 1. Run seed script
    run_seed()

    # 2. Verify database records
    db = SessionLocal()
    try:
        count = db.query(CscOffice).count()
        assert count >= 8, f"Expected at least 8 CSC offices, found {count}"

        pune_office = db.query(CscOffice).filter(CscOffice.id == "csc_pune_01").first()
        assert pune_office is not None
        assert pune_office.district == "Pune"
        assert pune_office.name_mr is not None
        assert pune_office.name_hi is not None
        assert pune_office.latitude == 18.5263
        assert pune_office.longitude == 73.8742
        assert len(pune_office.services_offered) > 0
    finally:
        db.close()

    # 3. Test API GET /api/csc-offices
    resp = client.get("/api/csc-offices")
    assert resp.status_code == 200
    data = resp.json()
    assert "total" in data
    assert "offices" in data
    assert data["total"] >= 8

    # 4. Test District Filter
    resp_pune = client.get("/api/csc-offices?district=Pune")
    assert resp_pune.status_code == 200
    pune_data = resp_pune.json()
    assert pune_data["total"] >= 3
    for off in pune_data["offices"]:
        assert off["district"] == "Pune"

    # 5. Test Search Filter
    resp_search = client.get("/api/csc-offices?search=Shivajinagar")
    assert resp_search.status_code == 200
    search_data = resp_search.json()
    assert search_data["total"] >= 1
    assert any("Shivajinagar" in o["name"] or "Shivajinagar" in o["address"] for o in search_data["offices"])


def test_admin_csc_offices_crud():
    import os
    from unittest.mock import patch

    test_admin_key = "test_admin_key_for_csc_suite_98765"
    with patch.dict(os.environ, {"ADMIN_SECRET_KEY": test_admin_key}):
        # 1. Login to admin
        res_login = client.post("/api/admin/login", json={"key": test_admin_key})
        assert res_login.status_code == 200
        csrf_token = res_login.json()["csrf_token"]

        headers = {
            "X-CSRF-Token": csrf_token
        }

        # 2. GET admin CSC offices
        res_list = client.get("/api/admin/csc-offices")
        assert res_list.status_code == 200
        data = res_list.json()
        assert "items" in data
        assert "total" in data

        # 3. POST new CSC office
        new_office_payload = {
            "id": "csc_test_admin_01",
            "name": "Admin Test Kendra",
            "name_mr": "अॅडमिन टेस्ट केंद्र",
            "district": "Pune",
            "address": "123 Admin Lane, Pune",
            "officerName": "Officer Test",
            "phone": "020-11223344",
            "timing": "10 AM - 5 PM",
            "servicesOffered": ["PM-KISAN e-KYC", "7/12"]
        }
        res_create = client.post("/api/admin/csc-offices", json=new_office_payload, headers=headers)
        assert res_create.status_code == 201
        created = res_create.json()["office"]
        assert created["id"] == "csc_test_admin_01"
        assert created["name"] == "Admin Test Kendra"

        # 4. PUT update CSC office
        update_payload = {
            "name": "Admin Test Kendra Updated",
            "officerName": "Senior Officer Test"
        }
        res_update = client.put("/api/admin/csc-offices/csc_test_admin_01", json=update_payload, headers=headers)
        assert res_update.status_code == 200
        updated = res_update.json()["office"]
        assert updated["name"] == "Admin Test Kendra Updated"
        assert updated["officerName"] == "Senior Officer Test"

        # 5. DELETE CSC office
        res_del = client.delete("/api/admin/csc-offices/csc_test_admin_01", headers=headers)
        assert res_del.status_code == 200
        assert res_del.json()["status"] == "success"

        # Verify deletion
        res_verify = client.get("/api/admin/csc-offices?q=csc_test_admin_01")
        assert res_verify.status_code == 200
        assert res_verify.json()["total"] == 0
