from datetime import datetime

from pydantic import BaseModel, ConfigDict, Field


class IncidentCreate(BaseModel):
    model_config = ConfigDict(str_strip_whitespace=True, extra="forbid")
    description: str = Field(min_length=3, max_length=5000)
    latitude: float = Field(ge=-90, le=90, allow_inf_nan=False)
    longitude: float = Field(ge=-180, le=180, allow_inf_nan=False)


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
    model_config = ConfigDict(from_attributes=True)


class ResolutionRequest(BaseModel):
    note: str = Field(min_length=10, max_length=2000)
    model_config = ConfigDict(str_strip_whitespace=True, extra="forbid")
