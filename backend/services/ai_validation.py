from typing import Literal

from pydantic import BaseModel, Field

IncidentType = Literal[
    "FLOOD", "FIRE", "ACCIDENT", "MEDICAL", "CRIME", "INFRASTRUCTURE", "OTHER"
]
Priority = Literal["LOW", "MEDIUM", "HIGH", "CRITICAL"]


class Classification(BaseModel):
    incident_type: IncidentType
    confidence: float = Field(ge=0, le=1, allow_inf_nan=False)
    urgency: Priority
    summary: str = Field(min_length=1, max_length=5000)


class PlanAction(BaseModel):
    step: int = Field(ge=1, le=10)
    action: str = Field(min_length=1, max_length=1000)
    priority: Priority


class ResponsePlan(BaseModel):
    summary: str = Field(min_length=1, max_length=2000)
    actions: list[PlanAction] = Field(min_length=1, max_length=10)
    equipment: list[str] = Field(max_length=20)
    safety_notes: list[str] = Field(max_length=20)
