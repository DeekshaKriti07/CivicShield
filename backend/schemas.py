from datetime import datetime

from pydantic import BaseModel, Field


class IncidentCreate(BaseModel):
    description: str = Field(
        min_length=3,
        max_length=5000,
    )

    latitude: float = Field(
        ge=-90,
        le=90,
    )

    longitude: float = Field(
        ge=-180,
        le=180,
    )


class IncidentResponse(BaseModel):
    id: int
    incident_type: str | None
    description: str
    latitude: float
    longitude: float
    risk_score: int
    risk_level: str
    status: str
    incident_group_id: str | None
    department: str | None
    response_team: str | None
    created_at: datetime

    model_config = {
        "from_attributes": True,
    }


class HealthResponse(BaseModel):
    status: str
    ai_provider: str
    ai_model: str
    database: str