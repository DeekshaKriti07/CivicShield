import json
import math

FACILITY_RADIUS_METERS = 500
CRITICAL_RADIUS_METERS = 200


class FacilityService:
    def __init__(self):
        from backend.config import settings

        self.facilities = []
        if settings.facilities_file:
            with open(settings.facilities_file, encoding="utf-8") as file:
                self.facilities = json.load(file)
            for facility in self.facilities:
                if (
                    not isinstance(facility.get("name"), str)
                    or not -90 <= facility["latitude"] <= 90
                    or not -180 <= facility["longitude"] <= 180
                ):
                    raise ValueError("Invalid configured facility record")

    def find_nearby_facilities(
        self,
        latitude: float,
        longitude: float,
    ) -> list[dict]:

        nearby = []

        for facility in self.facilities:
            distance = self.calculate_distance(
                latitude,
                longitude,
                facility["latitude"],
                facility["longitude"],
            )

            if distance <= FACILITY_RADIUS_METERS:
                nearby.append(
                    {
                        **facility,
                        "distance_meters": round(
                            distance,
                            2,
                        ),
                        "critical": (distance <= CRITICAL_RADIUS_METERS),
                    }
                )

        nearby.sort(key=lambda facility: facility["distance_meters"])

        return nearby

    @staticmethod
    def calculate_distance(
        latitude1: float,
        longitude1: float,
        latitude2: float,
        longitude2: float,
    ) -> float:

        earth_radius = 6_371_000

        lat1 = math.radians(latitude1)
        lat2 = math.radians(latitude2)

        delta_lat = math.radians(latitude2 - latitude1)

        delta_lon = math.radians(longitude2 - longitude1)

        a = (
            math.sin(delta_lat / 2) ** 2
            + math.cos(lat1) * math.cos(lat2) * math.sin(delta_lon / 2) ** 2
        )

        c = 2 * math.atan2(
            math.sqrt(a),
            math.sqrt(1 - a),
        )

        return earth_radius * c
