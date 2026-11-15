"""Authenticated incident records and review workflow; no emergency dispatch adapter."""

import json

from fastapi import APIRouter, Depends, File, Form, HTTPException, Query, Response, UploadFile
from sqlalchemy import update
from sqlalchemy.exc import IntegrityError
from sqlalchemy.orm import Session

from backend.api.auth import get_current_user, require_operator
from backend.auth_models import User
from backend.database import get_db
from backend.models import (
    AgentEvent,
    Evidence,
    EvidenceAsset,
    Incident,
    IncidentAccess,
    IncidentAnalysis,
)
from backend.schemas import IncidentCreate, IncidentResponse, ResolutionRequest
from backend.security import rate_limit
from backend.services.ai_classifier import AIClassifier
from backend.services.ai_planner import AIPlanner
from backend.services.facility_service import FacilityService
from backend.services.risk_engine import RiskEngine
from backend.services.routing_engine import RoutingEngine

router = APIRouter(tags=["incidents"])
ai_classifier, ai_planner = AIClassifier(), AIPlanner()
facility_service, risk_engine, routing_engine = (
    FacilityService(),
    RiskEngine(),
    RoutingEngine(),
)


def visible_query(db, user):
    query = db.query(Incident)
    if user.role not in {"OPERATOR", "ADMIN"}:
        query = query.join(
            IncidentAccess, IncidentAccess.incident_id == Incident.id
        ).filter(IncidentAccess.user_id == user.id)
    return query


def get_incident_or_404(incident_id, db, user):
    incident = visible_query(db, user).filter(Incident.id == incident_id).first()
    if incident is None:
        raise HTTPException(404, "Incident not found.")
    return incident


def log_event(db, incident_id, agent, event, summary):
    db.add(
        AgentEvent(
            incident_id=incident_id, agent_name=agent, event_type=event, summary=summary
        )
    )


def transition(db, incident, expected, status):
    changed = db.execute(
        update(Incident)
        .where(Incident.id == incident.id, Incident.status == expected)
        .values(status=status),
        execution_options={"synchronize_session": False},
    )
    if changed.rowcount != 1:
        db.rollback()
        raise HTTPException(409, "This incident changed. Refresh before trying again.")


def save_incident(db, user, payload):
    incident = Incident(**payload.model_dump(), status="RECEIVED")
    db.add(incident)
    db.flush()
    db.add(IncidentAccess(incident_id=incident.id, user_id=user.id))
    log_event(db, incident.id, user.username, "INCIDENT_CREATED", "Report recorded.")
    return incident


@router.post("/incident", response_model=IncidentResponse, status_code=201)
def create_incident(
    payload: IncidentCreate,
    user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    rate_limit(db, f"create:{user.id}", 30, 3600)
    incident = save_incident(db, user, payload)
    db.commit()
    db.refresh(incident)
    return incident


@router.post("/incident-with-evidence", response_model=IncidentResponse, status_code=201)
async def create_incident_with_evidence(
    description: str = Form(min_length=3, max_length=5000),
    latitude: float = Form(ge=-90, le=90),
    longitude: float = Form(ge=-180, le=180),
    evidence: UploadFile = File(),
    user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    rate_limit(db, f"create:{user.id}", 30, 3600)
    allowed = {
        "image/jpeg": (b"\xff\xd8\xff",),
        "image/png": (b"\x89PNG\r\n\x1a\n",),
        "image/webp": (b"RIFF",),
    }
    if evidence.content_type not in allowed:
        raise HTTPException(415, "Evidence must be a JPG, PNG, or WEBP image.")
    content = await evidence.read(5_000_001)
    if not content or len(content) > 5_000_000:
        raise HTTPException(413, "Evidence image must be 5 MB or smaller.")
    if not any(content.startswith(signature) for signature in allowed[evidence.content_type]):
        raise HTTPException(415, "The selected file is not a valid image.")
    if evidence.content_type == "image/webp" and content[8:12] != b"WEBP":
        raise HTTPException(415, "The selected file is not a valid WEBP image.")

    payload = IncidentCreate(
        description=description,
        latitude=latitude,
        longitude=longitude,
    )
    incident = save_incident(db, user, payload)
    evidence_record = Evidence(
        incident_id=incident.id,
        evidence_type="IMAGE",
        file_path=None,
    )
    db.add(evidence_record)
    db.flush()
    safe_name = (evidence.filename or "evidence-image")[-255:]
    db.add(
        EvidenceAsset(
            evidence_id=evidence_record.id,
            filename=safe_name,
            content_type=evidence.content_type,
            content=content,
        )
    )
    log_event(
        db,
        incident.id,
        user.username,
        "EVIDENCE_ATTACHED",
        "Image evidence attached to the report.",
    )
    db.commit()
    db.refresh(incident)
    return incident


@router.get("/incidents", response_model=list[IncidentResponse])
def get_incidents(
    limit: int = Query(100, ge=1, le=200),
    offset: int = Query(0, ge=0),
    user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    return (
        visible_query(db, user)
        .order_by(Incident.id.desc())
        .offset(offset)
        .limit(limit)
        .all()
    )


@router.get("/incident/{incident_id}", response_model=IncidentResponse)
def get_incident(
    incident_id: int,
    user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    return get_incident_or_404(incident_id, db, user)


@router.get("/incident/{incident_id}/evidence")
def incident_evidence(
    incident_id: int,
    user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    get_incident_or_404(incident_id, db, user)
    rows = (
        db.query(Evidence, EvidenceAsset)
        .join(EvidenceAsset, EvidenceAsset.evidence_id == Evidence.id)
        .filter(Evidence.incident_id == incident_id)
        .order_by(Evidence.id)
        .all()
    )
    return [
        {
            "id": evidence.id,
            "filename": asset.filename,
            "content_type": asset.content_type,
            "created_at": evidence.created_at,
        }
        for evidence, asset in rows
    ]


@router.get("/incident/{incident_id}/evidence/{evidence_id}/image")
def evidence_image(
    incident_id: int,
    evidence_id: int,
    user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    get_incident_or_404(incident_id, db, user)
    asset = (
        db.query(EvidenceAsset)
        .join(Evidence, Evidence.id == EvidenceAsset.evidence_id)
        .filter(Evidence.id == evidence_id, Evidence.incident_id == incident_id)
        .first()
    )
    if asset is None:
        raise HTTPException(404, "Evidence not found.")
    return Response(
        content=asset.content,
        media_type=asset.content_type,
        headers={"Cache-Control": "private, max-age=300"},
    )


@router.get("/incident/{incident_id}/timeline")
def timeline(
    incident_id: int,
    user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    get_incident_or_404(incident_id, db, user)
    events = (
        db.query(AgentEvent)
        .filter(AgentEvent.incident_id == incident_id)
        .order_by(AgentEvent.id)
        .all()
    )
    return {
        "incident_id": incident_id,
        "events": [
            {
                "id": e.id,
                "agent": e.agent_name,
                "event_type": e.event_type,
                "summary": e.summary,
                "timestamp": e.timestamp.isoformat() + "Z",
            }
            for e in events
        ],
    }


@router.get("/incident/{incident_id}/analysis")
def analysis(
    incident_id: int,
    user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    get_incident_or_404(incident_id, db, user)
    result = db.get(IncidentAnalysis, incident_id)
    return json.loads(result.payload) if result else None


@router.post("/incident/{incident_id}/workflow")
async def complete_incident_workflow(
    incident_id: int,
    user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    incident = get_incident_or_404(incident_id, db, user)
    if incident.status not in {"RECEIVED", "CLASSIFIED", "ANALYZED"}:
        raise HTTPException(409, "Reviewed incidents cannot be reanalyzed.")
    saved = db.get(IncidentAnalysis, incident_id)
    if saved:
        return json.loads(saved.payload)
    initial_status = incident.status
    rate_limit(db, f"analysis:{user.id}", 20, 3600)
    classification = await ai_classifier.classify(incident.description)
    facilities = facility_service.find_nearby_facilities(
        incident.latitude, incident.longitude
    )
    risk = risk_engine.calculate_risk(
        classification["incident_type"], incident.description, facilities
    )
    routing = routing_engine.route(classification["incident_type"], risk["level"])
    plan = await ai_planner.create_plan(
        classification["incident_type"],
        incident.description,
        risk["level"],
        risk["score"],
        routing["department"],
        routing["response_team"],
        facilities,
    )
    result = {
        "classification": classification,
        "risk": risk,
        "routing": routing,
        "response_plan": plan,
        "nearby_facilities": facilities,
    }
    transition(db, incident, initial_status, "ANALYZED")
    incident.incident_type = classification["incident_type"]
    incident.risk_score, incident.risk_level = risk["score"], risk["level"]
    incident.department, incident.response_team = (
        routing["department"],
        routing["response_team"],
    )
    db.add(IncidentAnalysis(incident_id=incident_id, payload=json.dumps(result)))
    log_event(
        db,
        incident_id,
        user.username,
        "ANALYZED",
        f"Analysis recorded. Classification: {classification['source']}; plan: {plan['source']}.",
    )
    try:
        db.commit()
    except IntegrityError:
        db.rollback()
        raise HTTPException(
            409, "Analysis changed. Refresh the saved assessment."
        ) from None
    return result


@router.post("/incident/{incident_id}/approve")
def approve(
    incident_id: int,
    user: User = Depends(require_operator),
    db: Session = Depends(get_db),
):
    incident = get_incident_or_404(incident_id, db, user)
    if incident.status != "ANALYZED" or not db.get(IncidentAnalysis, incident_id):
        raise HTTPException(409, "A saved analysis must be reviewed before approval.")
    transition(db, incident, "ANALYZED", "APPROVED")
    log_event(
        db,
        incident_id,
        user.username,
        "APPROVED",
        "Operator reviewed and approved the saved plan.",
    )
    db.commit()
    return {
        "incident_id": incident_id,
        "status": "APPROVED",
        "approved_by": user.username,
    }


@router.post("/incident/{incident_id}/assign")
def assign(
    incident_id: int,
    user: User = Depends(require_operator),
    db: Session = Depends(get_db),
):
    incident = get_incident_or_404(incident_id, db, user)
    if incident.status != "APPROVED":
        raise HTTPException(
            409, "Approve the saved plan before recording an assignment."
        )
    transition(db, incident, "APPROVED", "ASSIGNED")
    log_event(
        db,
        incident_id,
        user.username,
        "ASSIGNED",
        "Internal assignment recorded. No external service was contacted.",
    )
    db.commit()
    return {
        "incident_id": incident_id,
        "status": "ASSIGNED",
        "external_dispatch": False,
    }


@router.post("/incident/{incident_id}/resolve")
def resolve(
    incident_id: int,
    payload: ResolutionRequest,
    user: User = Depends(require_operator),
    db: Session = Depends(get_db),
):
    incident = get_incident_or_404(incident_id, db, user)
    if incident.status != "ASSIGNED":
        raise HTTPException(409, "Only assigned incidents can be resolved.")
    transition(db, incident, "ASSIGNED", "RESOLVED")
    log_event(db, incident_id, user.username, "RESOLVED", payload.note)
    db.commit()
    return {"incident_id": incident_id, "status": "RESOLVED"}


@router.post("/incident/{incident_id}/dispatch")
def dispatch(
    incident_id: int,
    user: User = Depends(require_operator),
    db: Session = Depends(get_db),
):
    get_incident_or_404(incident_id, db, user)
    raise HTTPException(
        503,
        "External dispatch is not connected. Use internal assignment to record coordination.",
    )
