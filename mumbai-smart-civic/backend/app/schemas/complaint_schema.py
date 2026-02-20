from datetime import datetime
from typing import Literal

from pydantic import BaseModel, Field


ComplaintStatus = Literal["Open", "In Progress", "Resolved"]


class LocationInput(BaseModel):
    lat: float = Field(ge=-90, le=90)
    lng: float = Field(ge=-180, le=180)


class ComplaintCreateRequest(BaseModel):
    description: str = Field(min_length=5, max_length=2000)
    category: str = Field(min_length=2, max_length=120)
    ward: str = Field(min_length=1, max_length=120)
    location: LocationInput


class ComplaintResponse(BaseModel):
    id: str
    user_id: str
    description: str
    category: str
    status: ComplaintStatus
    ward: str
    priority_score: float
    duplicate_group: str | None = None
    predicted_department: str | None = None
    location: dict
    created_at: datetime | None = None
    updated_at: datetime | None = None


class ComplaintStatusUpdateRequest(BaseModel):
    status: ComplaintStatus


class SpatialAnalyticsPoint(BaseModel):
    lat: float
    lng: float
    intensity: float = Field(ge=0.0, le=1.0)