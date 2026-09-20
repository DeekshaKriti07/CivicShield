import math
import re
from typing import Any


class DuplicateDetector:
    def __init__(
            self,
            distance_threshold_meters: float = 500,
            similarity_threshold: float = 0.25,
    ):
        self.distance_threshold_meters = distance_threshold_meters
        self.similarity_threshold = similarity_threshold

    def find_duplicate(
            self,
            description: str,
            latitude: float,
            longitude: float,
            incidents: list[Any],
    ) -> dict:

        best_match = None
        best_score = 0.0

        for incident in incidents:
            distance = self._distance(
                latitude,
                longitude,
                incident.latitude,
                incident.longitude,
            )

            if distance > self.distance_threshold_meters:
                continue

            similarity = self._text_similarity(
                description,
                incident.description,
            )

            if similarity < self.similarity_threshold:
                continue

            location_score = max(
                0.0,
                1.0
                - (
                        distance
                        / self.distance_threshold_meters
                ),
                )

            combined_score = (
                    similarity * 0.7
                    + location_score * 0.3
            )

            if combined_score > best_score:
                best_score = combined_score

                best_match = {
                    "incident_id": incident.id,
                    "distance_meters": round(
                        distance,
                        2,
                    ),
                    "text_similarity": round(
                        similarity,
                        3,
                    ),
                    "duplicate_score": round(
                        combined_score,
                        3,
                    ),
                }

        if best_match is None:
            return {
                "is_duplicate": False,
                "match": None,
            }

        return {
            "is_duplicate": True,
            "match": best_match,
        }

    @staticmethod
    def _words(text: str) -> set[str]:
        words = re.findall(
            r"[a-zA-Z0-9]+",
            text.lower(),
        )

        stop_words = {
            "the",
            "a",
            "an",
            "is",
            "are",
            "was",
            "were",
            "and",
            "or",
            "to",
            "of",
            "near",
            "in",
            "on",
            "has",
            "have",
            "been",
            "this",
            "that",
            "with",
            "for",
        }

        return {
            word
            for word in words
            if word not in stop_words
        }

    @classmethod
    def _text_similarity(
            cls,
            first: str,
            second: str,
    ) -> float:

        first_words = cls._words(first)
        second_words = cls._words(second)

        if not first_words or not second_words:
            return 0.0

        intersection = first_words & second_words
        union = first_words | second_words

        return len(intersection) / len(union)

    @staticmethod
    def _distance(
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