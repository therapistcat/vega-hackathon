from datetime import datetime, timezone
from typing import Any

from bson import ObjectId
from fastapi import APIRouter, Depends, HTTPException
from motor.motor_asyncio import AsyncIOMotorDatabase

from app.core.config import settings
from app.core.database import get_database
from app.core.security import require_authority
from app.models.complaint_model import COMPLAINTS_COLLECTION, serialize_complaint
from app.schemas.complaint_schema import (
    ComplaintResponse,
    ComplaintStatusUpdateRequest,
    SpatialAnalyticsPoint,
)


router = APIRouter(prefix="/a", tags=["authority"])


@router.get("/complaints", response_model=list[ComplaintResponse])
async def list_all_complaints(
    current_user: dict = Depends(require_authority(settings.authority_min_level_list)),
    db: AsyncIOMotorDatabase = Depends(get_database),
) -> list[ComplaintResponse]:
    cursor = db[COMPLAINTS_COLLECTION].find({})
    complaints = await cursor.sort("created_at", -1).to_list(length=500)
    return [ComplaintResponse.model_validate(serialize_complaint(item)) for item in complaints]


@router.patch("/complaints/{complaint_id}/status", response_model=ComplaintResponse)
async def update_complaint_status(
    complaint_id: str,
    payload: ComplaintStatusUpdateRequest,
    current_user: dict = Depends(
        require_authority(settings.authority_min_level_status_update)
    ),
    db: AsyncIOMotorDatabase = Depends(get_database),
) -> ComplaintResponse:
    try:
        oid = ObjectId(complaint_id)
    except Exception as exc:
        raise HTTPException(status_code=400, detail="Invalid complaint id") from exc

    await db[COMPLAINTS_COLLECTION].update_one(
        {"_id": oid},
        {
            "$set": {
                "status": payload.status,
                "updated_at": datetime.now(timezone.utc),
            }
        },
    )

    complaint = await db[COMPLAINTS_COLLECTION].find_one({"_id": oid})
    if not complaint:
        raise HTTPException(status_code=404, detail="Complaint not found")

    return ComplaintResponse.model_validate(serialize_complaint(complaint))


@router.get("/spatial-analytics", response_model=list[SpatialAnalyticsPoint])
async def spatial_analytics(
    current_user: dict = Depends(
        require_authority(settings.authority_min_level_spatial_analytics)
    ),
    db: AsyncIOMotorDatabase = Depends(get_database),
) -> list[SpatialAnalyticsPoint]:
    pipeline: list[dict[str, Any]] = [
        {
            "$project": {
                "lat": {"$arrayElemAt": ["$location.coordinates", 1]},
                "lng": {"$arrayElemAt": ["$location.coordinates", 0]},
                "priority_score": {"$ifNull": ["$priority_score", 0.5]},
            }
        },
        {
            "$addFields": {
                "lat_bucket": {"$round": ["$lat", 3]},
                "lng_bucket": {"$round": ["$lng", 3]},
            }
        },
        {
            "$group": {
                "_id": {"lat": "$lat_bucket", "lng": "$lng_bucket"},
                "complaint_count": {"$sum": 1},
                "avg_priority": {"$avg": "$priority_score"},
            }
        },
        {
            "$project": {
                "_id": 0,
                "lat": "$_id.lat",
                "lng": "$_id.lng",
                "raw_intensity": {
                    "$multiply": ["$complaint_count", "$avg_priority"]
                },
            }
        },
    ]

    points = await db[COMPLAINTS_COLLECTION].aggregate(pipeline).to_list(length=None)
    if not points:
        return []

    max_raw = max(point["raw_intensity"] for point in points) or 1.0

    result: list[SpatialAnalyticsPoint] = []
    for point in points:
        intensity = round(point["raw_intensity"] / max_raw, 4)
        result.append(
            SpatialAnalyticsPoint(
                lat=float(point["lat"]),
                lng=float(point["lng"]),
                intensity=float(intensity),
            )
        )

    return result
