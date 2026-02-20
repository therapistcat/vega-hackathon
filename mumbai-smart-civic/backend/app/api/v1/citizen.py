from datetime import datetime, timezone
from pathlib import Path
from uuid import uuid4

from bson import ObjectId
from fastapi import APIRouter, BackgroundTasks, Depends, File, Form, HTTPException, UploadFile, status
from motor.motor_asyncio import AsyncIOMotorDatabase

from app.core.database import get_database
from app.core.security import require_roles
from app.models.complaint_model import (
    COMPLAINTS_COLLECTION,
    build_complaint_document,
    serialize_complaint,
)
from app.schemas.complaint_schema import ComplaintResponse, DepartmentRoute
from app.services.duplicate_service import resolve_duplicate_group
from app.services.geo_service import run_st_dbscan_clustering, update_intensity_scores
from app.services.ml_service import compute_priority_score, predict_department


router = APIRouter(prefix="/c", tags=["citizen"])

UPLOAD_DIR = Path(__file__).resolve().parents[2] / "static" / "uploads"
UPLOAD_DIR.mkdir(parents=True, exist_ok=True)

ALLOWED_IMAGE_EXTENSIONS = {".jpg", ".jpeg", ".png", ".webp", ".heic"}
CATEGORY_DEPARTMENT_MAP = {
    "garbage": "Solid Waste Management",
    "waste": "Solid Waste Management",
    "pothole": "Road Maintenance",
    "road": "Road Maintenance",
    "water": "Water Supply Department",
    "leak": "Water Supply Department",
    "drain": "Sewerage Operations",
    "sewage": "Sewerage Operations",
    "light": "Electrical Department",
    "electricity": "Electrical Department",
}


def _resolve_extension(image: UploadFile) -> str:
    filename = (image.filename or "").strip().lower()
    suffix = Path(filename).suffix
    if suffix in ALLOWED_IMAGE_EXTENSIONS:
        return suffix
    if image.content_type == "image/png":
        return ".png"
    if image.content_type == "image/webp":
        return ".webp"
    return ".jpg"


async def _save_uploaded_image(image: UploadFile) -> str:
    if not image.content_type or not image.content_type.startswith("image/"):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Complaint image must be an image file",
        )

    data = await image.read()
    if not data:
        raise HTTPException(status_code=400, detail="Complaint image is empty")
    if len(data) > 8 * 1024 * 1024:
        raise HTTPException(status_code=400, detail="Complaint image exceeds 8MB")

    ext = _resolve_extension(image)
    file_name = f"{uuid4().hex}{ext}"
    output_path = UPLOAD_DIR / file_name
    output_path.write_bytes(data)
    return f"/static/uploads/{file_name}"


@router.get("/departments", response_model=list[DepartmentRoute])
async def get_departments() -> list[DepartmentRoute]:
    return [
        DepartmentRoute(category=category, department=department)
        for category, department in CATEGORY_DEPARTMENT_MAP.items()
    ]


@router.post("/complaints", response_model=ComplaintResponse)
async def create_complaint(
    background_tasks: BackgroundTasks,
    description: str = Form(..., min_length=5, max_length=2000),
    category: str = Form(..., min_length=2, max_length=120),
    ward: str = Form(..., min_length=1, max_length=120),
    lat: float = Form(..., ge=-90, le=90),
    lng: float = Form(..., ge=-180, le=180),
    image: UploadFile = File(...),
    current_user: dict = Depends(require_roles(["citizen"])),
    db: AsyncIOMotorDatabase = Depends(get_database),
) -> ComplaintResponse:
    image_url = await _save_uploaded_image(image)
    department = await predict_department(description, category)
    duplicate_group = await resolve_duplicate_group(
        db,
        lng=lng,
        lat=lat,
    )

    complaint_doc = build_complaint_document(
        user_id=current_user["id"],
        description=description,
        category=category,
        ward=ward,
        lng=lng,
        lat=lat,
        priority_score=compute_priority_score(category),
        predicted_department=department,
        duplicate_group=duplicate_group,
        image_url=image_url,
    )

    insert_result = await db[COMPLAINTS_COLLECTION].insert_one(complaint_doc)
    inserted = await db[COMPLAINTS_COLLECTION].find_one({"_id": ObjectId(insert_result.inserted_id)})
    if not inserted:
        raise HTTPException(status_code=500, detail="Failed to fetch inserted complaint")

    background_tasks.add_task(run_st_dbscan_clustering, db)
    background_tasks.add_task(update_intensity_scores, db)

    return ComplaintResponse.model_validate(serialize_complaint(inserted, viewer_user_id=current_user["id"]))


@router.get("/complaints/me", response_model=list[ComplaintResponse])
async def list_my_complaints(
    current_user: dict = Depends(require_roles(["citizen"])),
    db: AsyncIOMotorDatabase = Depends(get_database),
) -> list[ComplaintResponse]:
    cursor = db[COMPLAINTS_COLLECTION].find({"user_id": ObjectId(current_user["id"])})
    complaints = await cursor.sort("created_at", -1).to_list(length=200)
    return [
        ComplaintResponse.model_validate(
            serialize_complaint(item, viewer_user_id=current_user["id"])
        )
        for item in complaints
    ]


@router.get("/complaints/feed", response_model=list[ComplaintResponse])
async def list_complaint_feed(
    current_user: dict = Depends(require_roles(["citizen", "authority", "admin"])),
    db: AsyncIOMotorDatabase = Depends(get_database),
) -> list[ComplaintResponse]:
    cursor = db[COMPLAINTS_COLLECTION].find({})
    complaints = await cursor.sort([("upvotes_count", -1), ("created_at", -1)]).to_list(length=300)
    return [
        ComplaintResponse.model_validate(
            serialize_complaint(item, viewer_user_id=current_user["id"])
        )
        for item in complaints
    ]


@router.post("/complaints/{complaint_id}/upvote", response_model=ComplaintResponse)
async def toggle_complaint_upvote(
    complaint_id: str,
    current_user: dict = Depends(require_roles(["citizen", "authority", "admin"])),
    db: AsyncIOMotorDatabase = Depends(get_database),
) -> ComplaintResponse:
    try:
        complaint_oid = ObjectId(complaint_id)
    except Exception as exc:
        raise HTTPException(status_code=400, detail="Invalid complaint id") from exc

    user_oid = ObjectId(current_user["id"])
    complaint = await db[COMPLAINTS_COLLECTION].find_one({"_id": complaint_oid})
    if not complaint:
        raise HTTPException(status_code=404, detail="Complaint not found")

    upvoted_by = complaint.get("upvoted_by") or []
    upvotes_count = int(complaint.get("upvotes_count") or 0)

    if user_oid in upvoted_by:
        new_count = max(upvotes_count - 1, 0)
        await db[COMPLAINTS_COLLECTION].update_one(
            {"_id": complaint_oid},
            {
                "$pull": {"upvoted_by": user_oid},
                "$set": {
                    "upvotes_count": new_count,
                    "updated_at": datetime.now(timezone.utc),
                },
            },
        )
    else:
        await db[COMPLAINTS_COLLECTION].update_one(
            {"_id": complaint_oid},
            {
                "$addToSet": {"upvoted_by": user_oid},
                "$set": {"updated_at": datetime.now(timezone.utc)},
                "$inc": {"upvotes_count": 1},
            },
        )

    updated = await db[COMPLAINTS_COLLECTION].find_one({"_id": complaint_oid})
    if not updated:
        raise HTTPException(status_code=404, detail="Complaint not found")

    return ComplaintResponse.model_validate(
        serialize_complaint(updated, viewer_user_id=current_user["id"])
    )
