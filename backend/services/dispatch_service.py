from datetime import datetime, UTC


class DispatchService:

    def create_dispatch(
            self,
            incident_id: int,
            department: str,
            response_team: str,
            priority: str,
            approved_by: str = "Demo Operator",
    ) -> dict:

        return {
            "incident_id": incident_id,
            "status": "DISPATCHED",
            "department": department,
            "response_team": response_team,
            "priority": priority,
            "approved_by": approved_by,
            "dispatch_time": datetime.now(UTC).isoformat(),
            "simulation": True,
            "message": (
                f"{response_team} has been "
                f"simulated as dispatched."
            ),
        }