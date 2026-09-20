from typing import Any


class IncidentFusion:
    def fuse(
            self,
            primary_incident: Any,
            related_incidents: list[Any],
    ) -> dict:

        incident_ids = [
            primary_incident.id
        ]

        for incident in related_incidents:
            if incident.id != primary_incident.id:
                incident_ids.append(incident.id)

        report_count = len(incident_ids)

        if report_count >= 5:
            evidence_strength = "VERY_HIGH"
        elif report_count >= 3:
            evidence_strength = "HIGH"
        elif report_count == 2:
            evidence_strength = "MEDIUM"
        else:
            evidence_strength = "LOW"

        return {
            "primary_incident_id": primary_incident.id,
            "incident_group_id": (
                f"INC-GROUP-{primary_incident.id:04d}"
            ),
            "related_incident_ids": incident_ids,
            "report_count": report_count,
            "evidence_strength": evidence_strength,
        }