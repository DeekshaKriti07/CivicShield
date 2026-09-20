import json

import httpx

from backend.config import settings


class AIPlanner:

    async def create_plan(
            self,
            incident_type: str,
            description: str,
            risk_level: str,
            risk_score: int,
            department: str,
            response_team: str,
            nearby_facilities: list,
    ) -> dict:

        prompt = f"""
You are CivicShield, an emergency response planning AI.

Analyze this civic incident and create a practical response plan.

Incident type: {incident_type}
Description: {description}
Risk score: {risk_score}
Risk level: {risk_level}
Department: {department}
Response team: {response_team}
Nearby facilities: {json.dumps(nearby_facilities)}

Return ONLY valid JSON:

{{
  "summary": "short incident summary",
  "actions": [
    {{
      "step": 1,
      "action": "action to perform",
      "priority": "CRITICAL"
    }}
  ],
  "equipment": ["required equipment"],
  "safety_notes": ["important safety consideration"]
}}

Provide 3 to 5 concrete actions.
Do not invent emergency contacts.
Do not claim that real emergency services have been contacted.
"""

        payload = {
            "model": settings.ollama_model,
            "prompt": prompt,
            "stream": False,
            "format": "json",
            "options": {
                "temperature": 0.2,
            },
        }

        url = (
                settings.ollama_base_url.rstrip("/")
                + "/api/generate"
        )

        try:
            async with httpx.AsyncClient(
                    timeout=90
            ) as client:
                response = await client.post(
                    url,
                    json=payload,
                )

                response.raise_for_status()

                data = response.json()

            result = json.loads(
                data["response"]
            )

            return {
                "summary": result.get(
                    "summary",
                    "Response plan generated.",
                ),
                "actions": result.get(
                    "actions",
                    [],
                ),
                "equipment": result.get(
                    "equipment",
                    [],
                ),
                "safety_notes": result.get(
                    "safety_notes",
                    [],
                ),
                "source": "ollama",
            }

        except Exception as error:
            print(
                f"Ollama planner error: {error}"
            )

            return self._fallback(
                incident_type,
                risk_level,
                response_team,
            )

    @staticmethod
    def _fallback(
            incident_type: str,
            risk_level: str,
            response_team: str,
    ) -> dict:

        if incident_type == "FLOOD":
            actions = [
                "Secure the affected road",
                "Coordinate an alternate ambulance route",
                "Deploy water removal equipment",
                "Check nearby critical facilities",
                "Monitor water levels",
            ]

            equipment = [
                "Water pumps",
                "Barricades",
                "Emergency lighting",
            ]

        elif incident_type == "FIRE":
            actions = [
                "Secure the affected area",
                "Deploy fire response team",
                "Evacuate people from immediate danger",
                "Check nearby buildings",
                "Monitor fire spread",
            ]

            equipment = [
                "Fire extinguishers",
                "Protective equipment",
                "Emergency lighting",
            ]

        elif incident_type == "MEDICAL":
            actions = [
                "Secure access for medical responders",
                "Assess affected persons",
                "Coordinate medical assistance",
                "Keep emergency access clear",
            ]

            equipment = [
                "First-aid equipment",
                "Emergency medical equipment",
            ]

        else:
            actions = [
                "Secure the affected area",
                "Assess the situation",
                "Deploy the assigned response team",
                "Monitor incident conditions",
            ]

            equipment = [
                "Safety equipment",
                "Emergency communication equipment",
            ]

        return {
            "summary": (
                f"{risk_level} {incident_type} incident "
                f"assigned to {response_team}."
            ),
            "actions": [
                {
                    "step": index,
                    "action": action,
                    "priority": risk_level,
                }
                for index, action in enumerate(
                    actions,
                    start=1,
                )
            ],
            "equipment": equipment,
            "safety_notes": [
                "Human approval is required before dispatch.",
                "This is a simulated response plan.",
            ],
            "source": "fallback",
        }