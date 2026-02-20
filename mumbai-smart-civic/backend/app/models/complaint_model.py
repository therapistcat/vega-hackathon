from datetime import datetime, timezone
from typing import Any, Dict

from bson import ObjectId


COMPLAINTS_COLLECTION = "complaints"


def build_complaint_document(
    *,
    user_id: str,
    description: str,
    category: str,
    ward: str,
    lng: float,
    lat: float,
    priority_score: float,
    predicted_department: str,
    duplicate_group: str | None,
) -> Dict[str, Any]:
    now = datetime.now(timezone.utc)
    return {
        "user_id": ObjectId(user_id),
        "description": description,
        "category": category,
        "status": "Open",
        "ward": ward,
        "priority_score": priority_score,
        "duplicate_group": duplicate_group,
        "predicted_department": predicted_department,
        "location": {
            "type": "Point",
            "coordinates": [lng, lat],
        },
        "created_at": now,
        "updated_at": now,
    }


def serialize_complaint(complaint: Dict[str, Any]) -> Dict[str, Any]:
    coordinates = complaint.get("location", {}).get("coordinates", [None, None])
    return {
        "id": str(complaint["_id"]),
        "user_id": str(complaint["user_id"]),
        "description": complaint["description"],
        "category": complaint["category"],
        "status": complaint["status"],
        "ward": complaint["ward"],
        "priority_score": float(complaint.get("priority_score", 0.0)),
        "duplicate_group": complaint.get("duplicate_group"),
        "predicted_department": complaint.get("predicted_department"),
        "location": {
            "type": "Point",
            "coordinates": [float(coordinates[0]), float(coordinates[1])],
        },
        "created_at": complaint.get("created_at"),
        "updated_at": complaint.get("updated_at"),
    }