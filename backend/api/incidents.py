from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy import func
from sqlalchemy.orm import Session

from backend.database import get_db
from backend.api.auth import get_current_user
from backend.models import AgentEvent, Incident
from backend.schemas import IncidentCreate, IncidentResponse
from backend.services.ai_classifier import AIClassifier
from backend.services.ai_planner import AIPlanner
from backend.services.dispatch_service import DispatchService
from backend.services.duplicate_detector import DuplicateDetector
from backend.services.facility_service import FacilityService
from backend.services.risk_engine import RiskEngine
from backend.services.routing_engine import RoutingEngine


router = APIRouter(tags=["incidents"], dependencies=[Depends(get_current_user)])

ai_classifier = AIClassifier()
ai_planner = AIPlanner()
duplicate_detector = DuplicateDetector()
dispatch_service = DispatchService()
facility_service = FacilityService()
risk_engine = RiskEngine()
routing_engine = RoutingEngine()


def log_event(
        db: Session,
        incident_id: int,
        agent_name: str,
        event_type: str,
        summary: str,
):
    event = AgentEvent(
        incident_id=incident_id,
        agent_name=agent_name,
        event_type=event_type,
        summary=summary,
    )

    db.add(event)


def get_incident_or_404(
        incident_id: int,
        db: Session,
):
    incident = (
        db.query(Incident)
        .filter(Incident.id == incident_id)
        .first()
    )

    if incident is None:
        raise HTTPException(
            status_code=404,
            detail="Incident not found",
        )

    return incident


@router.post(
    "/incident",
    response_model=IncidentResponse,
    status_code=status.HTTP_201_CREATED,
)
async def create_incident(
        payload: IncidentCreate,
        db: Session = Depends(get_db),
):
    incident = Incident(
        description=payload.description,
        latitude=payload.latitude,
        longitude=payload.longitude,
        status="RECEIVED",
    )

    db.add(incident)
    db.commit()
    db.refresh(incident)

    log_event(
        db,
        incident.id,
        "IntakeAgent",
        "INCIDENT_CREATED",
        "New civic incident received.",
    )

    db.commit()

    return incident


@router.get(
    "/incident/{incident_id}",
    response_model=IncidentResponse,
)
async def get_incident(
        incident_id: int,
        db: Session = Depends(get_db),
):
    return get_incident_or_404(
        incident_id,
        db,
    )


@router.get(
    "/incidents",
    response_model=list[IncidentResponse],
)
async def get_incidents(
        db: Session = Depends(get_db),
):
    return (
        db.query(Incident)
        .order_by(Incident.created_at.desc())
        .all()
    )


@router.get("/dashboard/summary")
async def dashboard_summary(
        db: Session = Depends(get_db),
):
    total = db.query(Incident).count()

    received = (
        db.query(Incident)
        .filter(Incident.status == "RECEIVED")
        .count()
    )

    analyzed = (
        db.query(Incident)
        .filter(Incident.status == "ANALYZED")
        .count()
    )

    approved = (
        db.query(Incident)
        .filter(Incident.status == "APPROVED")
        .count()
    )

    dispatched = (
        db.query(Incident)
        .filter(Incident.status == "DISPATCHED")
        .count()
    )

    critical = (
        db.query(Incident)
        .filter(Incident.risk_level == "CRITICAL")
        .count()
    )

    high = (
        db.query(Incident)
        .filter(Incident.risk_level == "HIGH")
        .count()
    )

    medium = (
        db.query(Incident)
        .filter(Incident.risk_level == "MEDIUM")
        .count()
    )

    low = (
        db.query(Incident)
        .filter(Incident.risk_level == "LOW")
        .count()
    )

    type_rows = (
        db.query(
            Incident.incident_type,
            func.count(Incident.id),
        )
        .group_by(Incident.incident_type)
        .all()
    )

    incident_types = {
        incident_type or "UNKNOWN": count
        for incident_type, count in type_rows
    }

    return {
        "total_incidents": total,
        "status": {
            "received": received,
            "analyzed": analyzed,
            "approved": approved,
            "dispatched": dispatched,
        },
        "risk": {
            "critical": critical,
            "high": high,
            "medium": medium,
            "low": low,
        },
        "incident_types": incident_types,
    }


@router.get(
    "/incident/{incident_id}/timeline",
)
async def incident_timeline(
        incident_id: int,
        db: Session = Depends(get_db),
):
    get_incident_or_404(
        incident_id,
        db,
    )

    events = (
        db.query(AgentEvent)
        .filter(
            AgentEvent.incident_id == incident_id
        )
        .order_by(AgentEvent.timestamp.asc())
        .all()
    )

    return {
        "incident_id": incident_id,
        "events": [
            {
                "id": event.id,
                "agent": event.agent_name,
                "event_type": event.event_type,
                "summary": event.summary,
                "timestamp": event.timestamp,
            }
            for event in events
        ],
    }


@router.get(
    "/incident/{incident_id}/facilities",
)
async def get_nearby_facilities(
        incident_id: int,
        db: Session = Depends(get_db),
):
    incident = get_incident_or_404(
        incident_id,
        db,
    )

    facilities = facility_service.find_nearby_facilities(
        incident.latitude,
        incident.longitude,
    )

    return {
        "incident_id": incident.id,
        "radius_meters": 500,
        "critical_radius_meters": 200,
        "nearby_facilities": facilities,
    }


@router.post(
    "/incident/{incident_id}/classify",
)
async def classify_incident(
        incident_id: int,
        db: Session = Depends(get_db),
):
    incident = get_incident_or_404(
        incident_id,
        db,
    )

    result = await ai_classifier.classify(
        incident.description
    )

    incident.incident_type = result["incident_type"]
    incident.status = "CLASSIFIED"

    log_event(
        db,
        incident.id,
        "AIClassifier",
        "CLASSIFICATION_COMPLETE",
        f"Incident classified as {result['incident_type']}.",
    )

    db.commit()
    db.refresh(incident)

    return {
        "incident_id": incident.id,
        **result,
    }


@router.post(
    "/incident/{incident_id}/risk",
)
async def calculate_incident_risk(
        incident_id: int,
        db: Session = Depends(get_db),
):
    incident = get_incident_or_404(
        incident_id,
        db,
    )

    facilities = facility_service.find_nearby_facilities(
        incident.latitude,
        incident.longitude,
    )

    result = risk_engine.calculate_risk(
        incident_type=incident.incident_type,
        description=incident.description,
        nearby_facilities=facilities,
    )

    incident.risk_score = result["score"]
    incident.risk_level = result["level"]

    log_event(
        db,
        incident.id,
        "RiskEngine",
        "RISK_CALCULATED",
        f"Risk calculated as {result['level']} ({result['score']}).",
    )

    db.commit()
    db.refresh(incident)

    return {
        "incident_id": incident.id,
        "risk_score": result["score"],
        "risk_level": result["level"],
        "reasons": result["reasons"],
        "nearby_facilities": facilities,
    }


@router.post(
    "/incident/check-duplicate",
)
async def check_duplicate(
        payload: IncidentCreate,
        db: Session = Depends(get_db),
):
    incidents = (
        db.query(Incident)
        .order_by(Incident.created_at.desc())
        .all()
    )

    return duplicate_detector.find_duplicate(
        description=payload.description,
        latitude=payload.latitude,
        longitude=payload.longitude,
        incidents=incidents,
    )


@router.post(
    "/incident/{incident_id}/route",
)
async def route_incident(
        incident_id: int,
        db: Session = Depends(get_db),
):
    incident = get_incident_or_404(
        incident_id,
        db,
    )

    if not incident.incident_type:
        raise HTTPException(
            status_code=400,
            detail="Incident must be classified first",
        )

    result = routing_engine.route(
        incident_type=incident.incident_type,
        risk_level=incident.risk_level or "MEDIUM",
    )

    incident.department = result["department"]
    incident.response_team = result["response_team"]

    log_event(
        db,
        incident.id,
        "RoutingAgent",
        "INCIDENT_ROUTED",
        f"Routed to {result['department']} - {result['response_team']}.",
    )

    db.commit()
    db.refresh(incident)

    return {
        "incident_id": incident.id,
        **result,
    }


@router.post(
    "/incident/{incident_id}/plan",
)
async def plan_incident_response(
        incident_id: int,
        db: Session = Depends(get_db),
):
    incident = get_incident_or_404(
        incident_id,
        db,
    )

    if not incident.incident_type:
        raise HTTPException(
            status_code=400,
            detail="Incident must be classified first",
        )

    facilities = facility_service.find_nearby_facilities(
        incident.latitude,
        incident.longitude,
    )

    risk = risk_engine.calculate_risk(
        incident_type=incident.incident_type,
        description=incident.description,
        nearby_facilities=facilities,
    )

    incident.risk_score = risk["score"]
    incident.risk_level = risk["level"]

    routing = routing_engine.route(
        incident_type=incident.incident_type,
        risk_level=risk["level"],
    )

    incident.department = routing["department"]
    incident.response_team = routing["response_team"]

    result = await ai_planner.create_plan(
        incident_type=incident.incident_type,
        description=incident.description,
        risk_level=risk["level"],
        risk_score=risk["score"],
        department=routing["department"],
        response_team=routing["response_team"],
        nearby_facilities=facilities,
    )

    incident.status = "ANALYZED"

    log_event(
        db,
        incident.id,
        "AIPlanner",
        "RESPONSE_PLAN_CREATED",
        "AI response plan generated successfully.",
    )

    db.commit()

    return {
        "incident_id": incident.id,
        "risk": risk,
        "routing": routing,
        "response_plan": result,
    }


@router.post(
    "/incident/{incident_id}/approve",
)
async def approve_incident(
        incident_id: int,
        db: Session = Depends(get_db),
):
    incident = get_incident_or_404(
        incident_id,
        db,
    )

    if incident.status == "DISPATCHED":
        raise HTTPException(
            status_code=400,
            detail="Incident has already been dispatched",
        )

    if incident.status == "APPROVED":
        return {
            "incident_id": incident.id,
            "status": "APPROVED",
            "approved_by": "Demo Operator",
            "message": "Response plan already approved.",
        }

    incident.status = "APPROVED"

    log_event(
        db,
        incident.id,
        "HumanOperator",
        "PLAN_APPROVED",
        "Response plan approved by human operator.",
    )

    db.commit()
    db.refresh(incident)

    return {
        "incident_id": incident.id,
        "status": "APPROVED",
        "approved_by": "Demo Operator",
        "message": "Response plan approved for dispatch.",
    }


@router.post(
    "/incident/{incident_id}/dispatch",
)
async def dispatch_incident(
        incident_id: int,
        db: Session = Depends(get_db),
):
    incident = get_incident_or_404(
        incident_id,
        db,
    )

    if incident.status != "APPROVED":
        raise HTTPException(
            status_code=400,
            detail="Human approval is required before dispatch",
        )

    if not incident.incident_type:
        raise HTTPException(
            status_code=400,
            detail="Incident must be classified first",
        )

    routing = routing_engine.route(
        incident_type=incident.incident_type,
        risk_level=incident.risk_level or "MEDIUM",
    )

    incident.department = routing["department"]
    incident.response_team = routing["response_team"]
    incident.status = "DISPATCHED"

    result = dispatch_service.create_dispatch(
        incident_id=incident.id,
        department=routing["department"],
        response_team=routing["response_team"],
        priority=routing["priority"],
    )

    log_event(
        db,
        incident.id,
        "DispatchAgent",
        "DISPATCHED",
        f"{routing['response_team']} dispatched.",
    )

    db.commit()
    db.refresh(incident)

    return result


@router.post(
    "/incident/{incident_id}/workflow",
)
async def complete_incident_workflow(
        incident_id: int,
        db: Session = Depends(get_db),
):
    incident = get_incident_or_404(
        incident_id,
        db,
    )

    if not incident.incident_type:
        classification = await ai_classifier.classify(
            incident.description
        )

        incident.incident_type = classification[
            "incident_type"
        ]

        classification_source = classification.get(
            "source",
            "ollama",
        )
    else:
        classification = {
            "incident_type": incident.incident_type,
            "source": "database",
        }

        classification_source = "database"

    facilities = facility_service.find_nearby_facilities(
        incident.latitude,
        incident.longitude,
    )

    risk = risk_engine.calculate_risk(
        incident_type=incident.incident_type,
        description=incident.description,
        nearby_facilities=facilities,
    )

    incident.risk_score = risk["score"]
    incident.risk_level = risk["level"]

    routing = routing_engine.route(
        incident_type=incident.incident_type,
        risk_level=risk["level"],
    )

    incident.department = routing["department"]
    incident.response_team = routing["response_team"]

    plan = await ai_planner.create_plan(
        incident_type=incident.incident_type,
        description=incident.description,
        risk_level=risk["level"],
        risk_score=risk["score"],
        department=routing["department"],
        response_team=routing["response_team"],
        nearby_facilities=facilities,
    )

    incident.status = "ANALYZED"

    log_event(
        db,
        incident.id,
        "WorkflowAgent",
        "WORKFLOW_COMPLETED",
        "Classification, risk assessment, routing and response planning completed.",
    )

    db.commit()
    db.refresh(incident)

    return {
        "incident": {
            "id": incident.id,
            "description": incident.description,
            "latitude": incident.latitude,
            "longitude": incident.longitude,
            "incident_type": incident.incident_type,
            "risk_score": incident.risk_score,
            "risk_level": incident.risk_level,
            "status": incident.status,
            "department": incident.department,
            "response_team": incident.response_team,
        },
        "classification": classification,
        "classification_source": classification_source,
        "risk": risk,
        "nearby_facilities": facilities,
        "routing": routing,
        "response_plan": plan,
        "next_action": "Human approval required before dispatch",
    }