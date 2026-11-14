import asyncio

import pytest

from backend.config import settings
from backend.services.ai_classifier import AIClassifier
from backend.services.ai_planner import AIPlanner
from backend.services.risk_engine import RiskEngine


@pytest.mark.parametrize(
    "kind,score",
    [("FLOOD", 25), ("FIRE", 35), ("MEDICAL", 35), ("ACCIDENT", 30), ("CRIME", 30)],
)
def test_risk_accepts_classifier_case(kind, score):
    assert RiskEngine().calculate_risk(kind, "Report", [])["score"] == score


def test_risk_factors_are_based_on_inputs():
    result = RiskEngine().calculate_risk(
        "FIRE", "road blocked", [{"critical": True}], report_count=3
    )
    assert result["score"] == 95
    assert result["level"] == "CRITICAL"
    assert len(result["reasons"]) == 5


def test_invalid_ai_output_uses_labeled_fallback(monkeypatch):
    monkeypatch.setattr(settings, "ai_enabled", True)

    class FakeResponse:
        def raise_for_status(self):
            pass

        def json(self):
            return {"response": '{"incident_type":"INVENTED","confidence":50}'}

    async def post(*args, **kwargs):
        return FakeResponse()

    import httpx

    monkeypatch.setattr(httpx.AsyncClient, "post", post)
    result = asyncio.run(AIClassifier().classify("Flooded street"))
    assert result["source"] == "keyword_rules" and result["confidence"] is None
    plan = asyncio.run(
        AIPlanner().create_plan(
            "FLOOD", "Flooded street", "MEDIUM", 25, "Drainage", "Team", []
        )
    )
    assert plan["source"] == "rule_template" and plan["actions"]
