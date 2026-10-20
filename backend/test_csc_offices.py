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
