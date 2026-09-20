from typing import Any


class RiskEngine:
    def calculate_risk(
            self,
            incident_type: str | None,
            description: str,
            nearby_facilities: list[dict[str, Any]],
            report_count: int = 1,
            road_blocked: bool = False,
    ) -> dict[str, Any]:

        score = 0
        reasons = []

        text = description.lower()

        # Incident type
        if incident_type == "flood":
            score += 25
            reasons.append("Flood incident")

        elif incident_type == "fire":
            score += 35
            reasons.append("Fire incident")

        elif incident_type == "accident":
            score += 30
            reasons.append("Accident incident")

        elif incident_type == "medical":
            score += 35
            reasons.append("Medical emergency")

        elif incident_type == "crime":
            score += 30
            reasons.append("Crime incident")

        # Infer flood from the report when incident_type is not set.
        if incident_type is None and any(
                word in text
                for word in [
                    "flood",
                    "flooded",
                    "waterlogging",
                    "water logged",
                ]
        ):
            score += 25
            reasons.append("Flood indicators detected")

        # Critical facilities
        critical_facilities = [
            facility
            for facility in nearby_facilities
            if facility.get("critical") is True
        ]

        if critical_facilities:
            score += min(
                len(critical_facilities) * 30,
                30,
                )

            reasons.append(
                f"{len(critical_facilities)} critical "
                "facility nearby"
            )

        # Other nearby facilities
        if nearby_facilities:
            score += min(
                len(nearby_facilities) * 5,
                15,
                )

            reasons.append(
                f"{len(nearby_facilities)} nearby facilities"
            )

        # Road blockage
        if road_blocked:
            score += 15
            reasons.append("Road blockage reported")

        elif any(
                word in text
                for word in [
                    "road blocked",
                    "roadblock",
                    "ambulance",
                    "cannot get through",
                    "can't get through",
                    "difficulty getting through",
                ]
        ):
            score += 15
            reasons.append("Possible road access disruption")

        # Multiple reports
        if report_count >= 5:
            score += 15
            reasons.append("Multiple reports received")

        elif report_count >= 3:
            score += 10
            reasons.append("Multiple reports received")

        elif report_count == 2:
            score += 5
            reasons.append("Repeated report")

        score = min(score, 100)

        if score >= 80:
            level = "CRITICAL"
        elif score >= 60:
            level = "HIGH"
        elif score >= 30:
            level = "MEDIUM"
        else:
            level = "LOW"

        return {
            "score": score,
            "level": level,
            "reasons": reasons,
        }