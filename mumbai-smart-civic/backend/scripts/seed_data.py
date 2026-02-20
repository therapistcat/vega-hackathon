import asyncio
import os
import sys
from datetime import datetime, timedelta, timezone
from pathlib import Path
from typing import Any

from bson import ObjectId
from dotenv import load_dotenv

BACKEND_ROOT = Path(__file__).resolve().parents[1]
if str(BACKEND_ROOT) not in sys.path:
    sys.path.insert(0, str(BACKEND_ROOT))
load_dotenv(BACKEND_ROOT / ".env", override=True)

from app.core.database import close_mongo_connection, connect_to_mongo, get_database, init_indexes
from app.core.security import get_authority_level, hash_password
from app.models.complaint_model import COMPLAINTS_COLLECTION
from app.models.user_model import USERS_COLLECTION


SEED_TAG = "vega-demo-v1"


def utc_now() -> datetime:
    return datetime.now(timezone.utc)


async def upsert_user(
    *,
    name: str,
    email: str,
    password: str,
    role: str,
    authority_rank: str | None = None,
    authority_level: int | None = None,
) -> str:
    db = get_database()
    now = utc_now()
    email_norm = email.strip().lower()

    existing = await db[USERS_COLLECTION].find_one({"email": email_norm})
    password_hash = hash_password(password)

    if existing:
        await db[USERS_COLLECTION].update_one(
            {"_id": existing["_id"]},
            {
                "$set": {
                    "name": name,
                    "role": role,
                    "authority_rank": authority_rank,
                    "authority_level": authority_level,
                    "password_hash": password_hash,
                    "updated_at": now,
                }
            },
        )
        return str(existing["_id"])

    document: dict[str, Any] = {
        "name": name,
        "email": email_norm,
        "password_hash": password_hash,
        "role": role,
        "authority_rank": authority_rank,
        "authority_level": authority_level,
        "created_at": now,
        "updated_at": now,
    }
    result = await db[USERS_COLLECTION].insert_one(document)
    return str(result.inserted_id)


def build_demo_complaints(citizen_user_id: str) -> list[dict[str, Any]]:
    now = utc_now()
    citizen_oid = ObjectId(citizen_user_id)

    base = [
        {
            "description": "Large garbage pile near market causing foul smell.",
            "category": "garbage",
            "status": "Open",
            "ward": "A Ward",
            "priority_score": 0.82,
            "duplicate_group": "dup-colaba-1",
            "predicted_department": "Solid Waste Management",
            "location": {"type": "Point", "coordinates": [72.8302, 18.9217]},
            "created_at": now - timedelta(hours=3),
        },
        {
            "description": "Overflowing bins and scattered waste beside bus stop.",
            "category": "garbage",
            "status": "In Progress",
            "ward": "A Ward",
            "priority_score": 0.79,
            "duplicate_group": "dup-colaba-1",
            "predicted_department": "Solid Waste Management",
            "location": {"type": "Point", "coordinates": [72.8304, 18.9218]},
            "created_at": now - timedelta(hours=2),
        },
        {
            "description": "Water leakage from broken public pipeline.",
            "category": "water",
            "status": "Open",
            "ward": "D Ward",
            "priority_score": 0.88,
            "duplicate_group": None,
            "predicted_department": "Water Supply Department",
            "location": {"type": "Point", "coordinates": [72.8479, 18.9674]},
            "created_at": now - timedelta(hours=9),
        },
        {
            "description": "Major pothole causing traffic congestion.",
            "category": "road",
            "status": "Open",
            "ward": "G South Ward",
            "priority_score": 0.73,
            "duplicate_group": None,
            "predicted_department": "Road Maintenance",
            "location": {"type": "Point", "coordinates": [72.8400, 19.0178]},
            "created_at": now - timedelta(days=1, hours=4),
        },
        {
            "description": "Street light not working since last night.",
            "category": "electricity",
            "status": "Resolved",
            "ward": "K East Ward",
            "priority_score": 0.68,
            "duplicate_group": None,
            "predicted_department": "Electrical Department",
            "location": {"type": "Point", "coordinates": [72.8732, 19.1163]},
            "created_at": now - timedelta(days=2, hours=1),
        },
        {
            "description": "Drainage overflow during rain in residential lane.",
            "category": "sewage",
            "status": "In Progress",
            "ward": "L Ward",
            "priority_score": 0.91,
            "duplicate_group": None,
            "predicted_department": "Sewerage Operations",
            "location": {"type": "Point", "coordinates": [72.9081, 19.0732]},
            "created_at": now - timedelta(hours=20),
        },
    ]

    output: list[dict[str, Any]] = []
    for row in base:
        created_at = row["created_at"]
        output.append(
            {
                "user_id": citizen_oid,
                "description": row["description"],
                "category": row["category"],
                "status": row["status"],
                "ward": row["ward"],
                "priority_score": row["priority_score"],
                "duplicate_group": row["duplicate_group"],
                "predicted_department": row["predicted_department"],
                "location": row["location"],
                "created_at": created_at,
                "updated_at": created_at,
                "seed_tag": SEED_TAG,
            }
        )
    return output


async def seed() -> None:
    authority_name = os.getenv("SEED_AUTHORITY_NAME", os.getenv("SEED_ADMIN_NAME", "Vega Authority"))
    authority_email = os.getenv("SEED_AUTHORITY_EMAIL", os.getenv("SEED_ADMIN_EMAIL", "authority@example.com"))
    authority_password = os.getenv("SEED_AUTHORITY_PASSWORD", os.getenv("SEED_ADMIN_PASSWORD", "Authority@12345"))
    authority_rank = os.getenv("SEED_AUTHORITY_RANK", "commissioner").strip().lower()
    authority_level = get_authority_level(authority_rank) or 4

    citizen_name = os.getenv("SEED_CITIZEN_NAME", "Vega Citizen")
    citizen_email = os.getenv("SEED_CITIZEN_EMAIL", "citizen@example.com")
    citizen_password = os.getenv("SEED_CITIZEN_PASSWORD", "Citizen@12345")

    await connect_to_mongo()
    await init_indexes()
    db = get_database()

    try:
        authority_id = await upsert_user(
            name=authority_name,
            email=authority_email,
            password=authority_password,
            role="authority",
            authority_rank=authority_rank,
            authority_level=authority_level,
        )
        citizen_id = await upsert_user(
            name=citizen_name,
            email=citizen_email,
            password=citizen_password,
            role="citizen",
        )

        await db[COMPLAINTS_COLLECTION].delete_many({"seed_tag": SEED_TAG})
        complaints = build_demo_complaints(citizen_id)
        if complaints:
            await db[COMPLAINTS_COLLECTION].insert_many(complaints)

        print("Seed completed")
        print(f"Authority login: {authority_email} / {authority_password} ({authority_rank})")
        print(f"Citizen login: {citizen_email} / {citizen_password}")
        print(f"Inserted complaints: {len(complaints)}")
        print(f"Authority user id: {authority_id}")
        print(f"Citizen user id: {citizen_id}")
    finally:
        await close_mongo_connection()


if __name__ == "__main__":
    asyncio.run(seed())
