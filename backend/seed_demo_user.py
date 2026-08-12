import os
import sys
import uuid

# Ensure backend directory is on sys.path
sys.path.insert(0, os.path.dirname(__file__))

from db import SessionLocal, init_db
from models_db import User
from auth_utils import hash_password

DEMO_EMAIL = "demo.farmer@example.com"
DEMO_PASSWORD = "FarmerPassword123!"
DEMO_NAME = "Ramesh Patil"

def seed_demo_user():
    init_db()
    db = SessionLocal()
    try:
        existing = db.query(User).filter(User.email == DEMO_EMAIL.lower()).first()
        if existing:
            print("==================================================")
            print("  DEMO FARMER USER ALREADY EXISTS")
            print("==================================================")
            print(f"  Name:     {existing.name}")
            print(f"  Email:    {existing.email}")
            print(f"  Password: {DEMO_PASSWORD}")
            print(f"  User ID:  {existing.id}")
            print("==================================================")
            return existing

        password_hash = hash_password(DEMO_PASSWORD)
        user_id = f"usr_{uuid.uuid4().hex[:10]}"

        demo_user = User(
            id=user_id,
            name=DEMO_NAME,
            email=DEMO_EMAIL.lower(),
            password_hash=password_hash,
            role="Farmer"
        )
        demo_user.profile_attributes = {
            "annual_income": 180000,
            "category": "OBC",
            "state": "Maharashtra",
            "age": 42,
            "land_acres": 3.5,
            "occupation": "Farmer",
            "owned_documents": [
                "Aadhaar Card",
                "7/12 Land Record Extract",
                "Bank Passbook",
                "Income Certificate"
            ]
        }

        db.add(demo_user)
        db.commit()
        db.refresh(demo_user)

        print("==================================================")
        print("  DEMO FARMER USER SEEDED SUCCESSFULLY")
        print("==================================================")
        print(f"  Name:     {DEMO_NAME}")
        print(f"  Email:    {DEMO_EMAIL}")
        print(f"  Password: {DEMO_PASSWORD}")
        print(f"  User ID:  {user_id}")
        print("==================================================")

        return demo_user
    finally:
        db.close()

if __name__ == "__main__":
    seed_demo_user()
