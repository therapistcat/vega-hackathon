from bson import ObjectId
from fastapi import APIRouter, BackgroundTasks, Depends, HTTPException
from motor.motor_asyncio import AsyncIOMotorDatabase

from app.core.database import get_database
from app.core.security import require_roles
from app.models.complaint_model import (
    COMPLAINTS_COLLECTION,
    build_complaint_document,
    serialize_complaint,
)
from app.schemas.complaint_schema import ComplaintCreateRequest, ComplaintResponse
from app.services.duplicate_service import resolve_duplicate_group
from app.services.geo_service import run_st_dbscan_clustering, update_intensity_scores
from app.services.ml_service import compute_priority_score, predict_department


router = APIRouter(prefix="/c", tags=["citizen"])


@router.post("/complaints", response_model=ComplaintResponse)
async def create_complaint(
    payload: ComplaintCreateRequest,
    background_tasks: BackgroundTasks,
    current_user: dict = Depends(require_roles(["citizen"])),
    db: AsyncIOMotorDatabase = Depends(get_database),
) -> ComplaintResponse:
    department = await predict_department(payload.description, payload.category)
    duplicate_group = await resolve_duplicate_group(
        db,
        lng=payload.location.lng,
        lat=payload.location.lat,
    )

    complaint_doc = build_complaint_document(
        user_id=current_user["id"],
        description=payload.description,
        category=payload.category,
        ward=payload.ward,
        lng=payload.location.lng,
        lat=payload.location.lat,
        priority_score=compute_priority_score(payload.category),
        predicted_department=department,
        duplicate_group=duplicate_group,
    )

    insert_result = await db[COMPLAINTS_COLLECTION].insert_one(complaint_doc)
    inserted = await db[COMPLAINTS_COLLECTION].find_one({"_id": ObjectId(insert_result.inserted_id)})
    if not inserted:
        raise HTTPException(status_code=500, detail="Failed to fetch inserted complaint")

    background_tasks.add_task(run_st_dbscan_clustering, db)
    background_tasks.add_task(update_intensity_scores, db)

    return ComplaintResponse.model_validate(serialize_complaint(inserted))


@router.get("/complaints/me", response_model=list[ComplaintResponse])
async def list_my_complaints(
    current_user: dict = Depends(require_roles(["citizen"])),
    db: AsyncIOMotorDatabase = Depends(get_database),
) -> list[ComplaintResponse]:
    cursor = db[COMPLAINTS_COLLECTION].find({"user_id": ObjectId(current_user["id"])})
    complaints = await cursor.sort("created_at", -1).to_list(length=200)
    return [ComplaintResponse.model_validate(serialize_complaint(item)) for item in complaints]
