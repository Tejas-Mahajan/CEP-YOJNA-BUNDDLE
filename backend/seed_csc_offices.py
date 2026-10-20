"""
seed_csc_offices.py -- Idempotent CSC office seeder for YojanaBundle.

Reads data/csc_offices.json and seeds each row into the `csc_offices`
table in Neon Postgres / local SQLite.

Behaviour
---------
- Default (safe) : Only inserts offices whose ID is NOT already in the DB.
                   Skips existing records so any custom edits are never overwritten.
- Force (--force): Overwrites existing offices with data from csc_offices.json.

Usage (from the backend/ directory):
    python seed_csc_offices.py          # Safe mode (skip existing rows)
    python seed_csc_offices.py --force  # Force mode (overwrite existing rows)

Expected output:
    === YojanaBundle CSC Office Seeder ===
    Loaded 8 CSC offices from csc_offices.json
    [INSERT] csc_pune_01 (District Collectorate Setu & Maha e-Seva Kendra, Pune)
    ...
    Done.  Inserted: 8 | Skipped: 0 | Updated: 0 | Total in DB: 8
"""

import json
import os
import sys

# Ensure backend directory is on sys.path
_BACKEND_DIR = os.path.dirname(os.path.abspath(__file__))
if _BACKEND_DIR not in sys.path:
    sys.path.insert(0, _BACKEND_DIR)

from dotenv import load_dotenv
load_dotenv(os.path.join(_BACKEND_DIR, ".env"))

from db import SessionLocal, engine, Base
from models_db import CscOffice

DATA_PATH = os.path.join(_BACKEND_DIR, "data", "csc_offices.json")


def _build_csc_office(item: dict) -> CscOffice:
    """Construct a CscOffice ORM instance from a raw dictionary."""
    return CscOffice(
        id=item["id"],
        name=item.get("name", ""),
        name_mr=item.get("name_mr"),
        name_hi=item.get("name_hi"),
        district=item.get("district", ""),
        district_en=item.get("district_en"),
        district_mr=item.get("district_mr"),
        district_hi=item.get("district_hi"),
        address=item.get("address", ""),
        address_mr=item.get("address_mr"),
        address_hi=item.get("address_hi"),
        exact_address=item.get("exactAddress") or item.get("address", ""),
        pincode=item.get("pincode"),
        officer_name=item.get("officerName"),
        officer_name_mr=item.get("officerName_mr"),
        officer_name_hi=item.get("officerName_hi"),
        phone=item.get("phone"),
        contact_phone=item.get("contactPhone") or item.get("phone"),
        timing=item.get("timing"),
        timing_mr=item.get("timing_mr"),
        timing_hi=item.get("timing_hi"),
        latitude=item.get("latitude") or item.get("lat"),
        longitude=item.get("longitude") or item.get("lng"),
        maps_url=item.get("mapsUrl"),
        services_offered=item.get("servicesOffered", [])
    )


def run_seed() -> None:
    print("=== YojanaBundle CSC Office Seeder ===")

    if not os.path.exists(DATA_PATH):
        print(f"ERROR: csc_offices.json not found at {DATA_PATH}")
        sys.exit(1)

    with open(DATA_PATH, "r", encoding="utf-8") as fh:
        raw_offices = json.load(fh)

    print(f"Loaded {len(raw_offices)} CSC offices from csc_offices.json")

    # Ensure table exists
    Base.metadata.create_all(bind=engine)

    force_update = "--force" in sys.argv
    if force_update:
        print("Mode: FORCE OVERWRITE (--force flag detected)")
    else:
        print("Mode: SAFE (skipping existing offices; use --force to overwrite)")

    db = SessionLocal()
    inserted = 0
    updated = 0
    skipped = 0

    try:
        for raw in raw_offices:
            office_id = raw.get("id")
            if not office_id:
                print("  [WARN] Skipping entry with missing 'id'")
                continue

            existing = db.query(CscOffice).filter(CscOffice.id == office_id).first()

            if existing is None:
                new_office = _build_csc_office(raw)
                db.add(new_office)
                inserted += 1
                print(f"  [INSERT] {office_id:<18} {raw.get('name', '')[:45]}")
            elif force_update:
                existing.name = raw.get("name", existing.name)
                existing.name_mr = raw.get("name_mr", existing.name_mr)
                existing.name_hi = raw.get("name_hi", existing.name_hi)
                existing.district = raw.get("district", existing.district)
                existing.district_en = raw.get("district_en", existing.district_en)
                existing.district_mr = raw.get("district_mr", existing.district_mr)
                existing.district_hi = raw.get("district_hi", existing.district_hi)
                existing.address = raw.get("address", existing.address)
                existing.address_mr = raw.get("address_mr", existing.address_mr)
                existing.address_hi = raw.get("address_hi", existing.address_hi)
                existing.exact_address = raw.get("exactAddress", existing.exact_address)
                existing.pincode = raw.get("pincode", existing.pincode)
                existing.officer_name = raw.get("officerName", existing.officer_name)
                existing.officer_name_mr = raw.get("officerName_mr", existing.officer_name_mr)
                existing.officer_name_hi = raw.get("officerName_hi", existing.officer_name_hi)
                existing.phone = raw.get("phone", existing.phone)
                existing.contact_phone = raw.get("contactPhone", existing.contact_phone)
                existing.timing = raw.get("timing", existing.timing)
                existing.timing_mr = raw.get("timing_mr", existing.timing_mr)
                existing.timing_hi = raw.get("timing_hi", existing.timing_hi)
                existing.latitude = raw.get("latitude") or raw.get("lat") or existing.latitude
                existing.longitude = raw.get("longitude") or raw.get("lng") or existing.longitude
                existing.maps_url = raw.get("mapsUrl", existing.maps_url)
                existing.services_offered = raw.get("servicesOffered", existing.services_offered)
                updated += 1
                print(f"  [UPDATE] {office_id:<18} {raw.get('name', '')[:45]}")
            else:
                skipped += 1
                print(f"  [SKIP]   {office_id:<18} (already exists, skipping)")

        db.commit()

        total = db.query(CscOffice).count()
        print("-" * 50)
        print(f"Done. Inserted: {inserted} | Skipped: {skipped} | Updated: {updated} | Total in DB: {total}")

    except Exception as exc:
        db.rollback()
        print(f"FATAL: Seeding failed with error: {exc}")
        raise
    finally:
        db.close()


if __name__ == "__main__":
    run_seed()
