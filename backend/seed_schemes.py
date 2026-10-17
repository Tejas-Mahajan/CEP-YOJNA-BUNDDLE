"""
seed_schemes.py -- Idempotent scheme seeder for YojanaBundle.

Reads data/schemes.json, sanitizes every entry with sanitize_scheme_object(),
and seeds each row into the `schemes` table in Neon Postgres / local SQLite.

Behaviour
---------
- Default (safe) : Only inserts schemes whose ID is NOT already in the DB.
                   Skips existing schemes so admin edits are never overwritten.
- Force (--force): Overwrites existing schemes with data from schemes.json.

Usage (from the backend/ directory):
    python seed_schemes.py          # Safe mode (skip existing rows)
    python seed_schemes.py --force  # Force mode (overwrite existing rows)

Expected output:
    === YojanaBundle Scheme Seeder ===
    Loaded 15 schemes from schemes.json
    [INSERT] PM_KISAN ...
    [SKIP]   PMFBY    (already exists, skipping)
    ...
    Done.  Inserted: 0 | Skipped: 15 | Updated: 0 | Total in DB: 15
"""

import json
import os
import sys

# Ensure the backend/ directory is on sys.path regardless of where the script is invoked.
_BACKEND_DIR = os.path.dirname(os.path.abspath(__file__))
if _BACKEND_DIR not in sys.path:
    sys.path.insert(0, _BACKEND_DIR)

from dotenv import load_dotenv
load_dotenv(os.path.join(_BACKEND_DIR, ".env"))

from db import SessionLocal, engine, Base
from models_db import Scheme
from services.data_cleaner import sanitize_scheme_object

DATA_PATH = os.path.join(_BACKEND_DIR, "data", "schemes.json")


def _build_scheme_obj(cleaned: dict) -> Scheme:
    """Construct a Scheme ORM instance from a sanitized scheme dict."""
    return Scheme(
        id                      = cleaned["id"],
        name                    = cleaned["name"],
        short_name              = cleaned["shortName"],
        level                   = cleaned.get("level", "Central"),
        government              = cleaned.get("government", "Government of India"),
        government_mr           = cleaned.get("government_mr"),
        rules                   = cleaned.get("rules", []),
        category_target         = cleaned.get("category_target", []),
        benefit_amount          = cleaned.get("benefit_amount", 0.0),
        benefit_type            = cleaned.get("benefit_type", "Direct Cash Transfer"),
        benefit_display         = cleaned.get("benefit_display", ""),
        benefit_display_mr      = cleaned.get("benefit_display_mr"),
        closing_date            = cleaned.get("closing_date"),
        required_documents      = cleaned.get("required_documents", []),
        mutually_exclusive_with = cleaned.get("mutually_exclusive_with", []),
        description             = cleaned.get("description", ""),
        description_mr          = cleaned.get("description_mr"),
        application_steps       = cleaned.get("application_steps", []),
        application_steps_mr    = cleaned.get("application_steps_mr", []),
        official_url            = cleaned.get("official_url", "https://myscheme.gov.in"),
    )


def run_seed() -> None:
    print("=== YojanaBundle Scheme Seeder ===")

    # 1. Load & sanitize
    if not os.path.exists(DATA_PATH):
        print(f"ERROR: schemes.json not found at {DATA_PATH}")
        sys.exit(1)

    with open(DATA_PATH, "r", encoding="utf-8") as fh:
        raw_schemes = json.load(fh)

    print(f"Loaded {len(raw_schemes)} schemes from schemes.json")

    # 2. Ensure the schemes table exists (create_all is a no-op if table already present)
    Base.metadata.create_all(bind=engine)

    # 3. Seed / Upsert
    force_update = "--force" in sys.argv
    if force_update:
        print("Mode: FORCE OVERWRITE (--force flag detected)")
    else:
        print("Mode: SAFE (skipping existing schemes to preserve admin edits; use --force to overwrite)")

    db = SessionLocal()
    inserted = 0
    updated  = 0
    skipped  = 0

    try:
        for raw in raw_schemes:
            cleaned = sanitize_scheme_object(raw)
            sid     = cleaned["id"]

            # session.get() fetches by PK (returns None if absent).
            existing = db.get(Scheme, sid)
            scheme_obj = _build_scheme_obj(cleaned)

            if existing is None:
                action = "INSERT"
                inserted += 1
                db.add(scheme_obj)
                print(f"  [{action}] {sid:<30}  {cleaned['name'][:60]}")
            elif force_update:
                action = "UPDATE"
                updated += 1
                scheme_obj.created_at = existing.created_at
                db.merge(scheme_obj)
                print(f"  [{action}] {sid:<30}  {cleaned['name'][:60]}")
            else:
                action = "SKIP"
                skipped += 1
                print(f"  [{action}]   {sid:<30}  (already exists, skipping)")

        db.commit()

        # Invalidate in-memory cache if main is available
        try:
            from main import clear_schemes_cache
            clear_schemes_cache()
        except Exception:
            pass

        # 4. Verify row count
        total = db.query(Scheme).count()
        print(
            f"\nDone.  Inserted: {inserted} | Skipped: {skipped} | Updated: {updated} | "
            f"Total in DB: {total}"
        )
        if total != len(raw_schemes):
            print(
                f"WARNING: expected {len(raw_schemes)} rows but found {total}. "
                "Check for duplicate ids or rows left from a previous partial run."
            )

    except Exception as exc:
        db.rollback()
        print(f"\nERROR during seed: {exc}")
        raise
    finally:
        db.close()


if __name__ == "__main__":
    run_seed()
