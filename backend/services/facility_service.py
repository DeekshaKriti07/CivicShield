import json
import math
from pathlib import Path


FACILITY_RADIUS_METERS = 500
CRITICAL_RADIUS_METERS = 200


class FacilityService:
    def __init__(self):
        data_path = (
                Path(__file__).resolve().parents[1]
                / "data"
                / "facilities.json"
        )

        with open(
                data_path,
                "r",
                encoding="utf-8",
        ) as file:
            self.facilities = json.load(file)

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
                        "critical": (
                                distance
                                <= CRITICAL_RADIUS_METERS
                        ),
                    }
                )

        nearby.sort(
            key=lambda facility: facility[
                "distance_meters"
            ]
        )

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

        delta_lat = math.radians(
            latitude2 - latitude1
        )

        delta_lon = math.radians(
            longitude2 - longitude1
        )

        a = (
                math.sin(delta_lat / 2) ** 2
                + math.cos(lat1)
                * math.cos(lat2)
                * math.sin(delta_lon / 2) ** 2
        )

        c = 2 * math.atan2(
            math.sqrt(a),
            math.sqrt(1 - a),
        )

        return earth_radius * c