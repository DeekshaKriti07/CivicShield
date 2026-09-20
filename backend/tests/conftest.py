import pytest

from backend.api import incidents


@pytest.fixture(autouse=True)
def mock_ai_services(monkeypatch):
    async def mock_classify(description: str):
        text = description.lower()

        if "flood" in text or "water" in text:
            incident_type = "FLOOD"
        elif "fire" in text or "smoke" in text:
            incident_type = "FIRE"
        elif "accident" in text or "crash" in text:
            incident_type = "ACCIDENT"
        elif "medical" in text or "injured" in text:
            incident_type = "MEDICAL"
        else:
            incident_type = "OTHER"

        return {
            "incident_type": incident_type,
            "confidence": 0.95,
            "urgency": "HIGH",
            "summary": description,
            "source": "test",
        }

    async def mock_plan(
            incident_type: str,
            description: str,
            risk_level: str,
            risk_score: int,
            department: str,
            response_team: str,
            nearby_facilities: list,
    ):
        return {
            "summary": (
                f"Test response plan for "
                f"{incident_type} incident."
            ),
            "actions": [
                {
                    "step": 1,
                    "action": "Secure affected area",
                    "priority": risk_level,
                },
                {
                    "step": 2,
                    "action": "Deploy response team",
                    "priority": risk_level,
                },
                {
                    "step": 3,
                    "action": "Monitor incident",
                    "priority": "MEDIUM",
                },
            ],
            "equipment": [
                "Safety equipment",
                "Emergency communication equipment",
            ],
            "safety_notes": [
                "Human approval is required before dispatch.",
                "This is a test response plan.",
            ],
            "source": "test",
        }

    monkeypatch.setattr(
        incidents.ai_classifier,
        "classify",
        mock_classify,
    )

    monkeypatch.setattr(
        incidents.ai_planner,
        "create_plan",
        mock_plan,
    )