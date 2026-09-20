from typing import Any


class RoutingEngine:

    def route(
            self,
            incident_type: str | None,
            risk_level: str | None,
    ) -> dict[str, Any]:

        incident_type = (
                incident_type or "OTHER"
        ).upper()

        routes = {
            "FLOOD": {
                "department": "Disaster Management",
                "team": "Flood Response Team",
            },
            "FIRE": {
                "department": "Fire and Rescue",
                "team": "Fire Response Team",
            },
            "ACCIDENT": {
                "department": "Emergency Services",
                "team": "Road Emergency Team",
            },
            "MEDICAL": {
                "department": "Health Department",
                "team": "Emergency Medical Team",
            },
            "CRIME": {
                "department": "Police Department",
                "team": "Emergency Police Team",
            },
            "INFRASTRUCTURE": {
                "department": "Municipal Corporation",
                "team": "Infrastructure Response Team",
            },
            "OTHER": {
                "department": "Municipal Corporation",
                "team": "Civic Response Team",
            },
        }

        selected = routes.get(
            incident_type,
            routes["OTHER"],
        )

        priority = (
                risk_level or "MEDIUM"
        ).upper()

        return {
            "department": selected["department"],
            "response_team": selected["team"],
            "priority": priority,
            "incident_type": incident_type,
            "routing_reason": (
                f"{incident_type} incident "
                f"requires {selected['department']}."
            ),
        }