"""Trident-AI routing engine.

Uses osmnx/networkx only when those packages import successfully. Otherwise an
in-memory Delhi NCR graph + Dijkstra is used so this module never fails import.
"""

from __future__ import annotations

import heapq
import math
from typing import Any

try:
    import networkx as nx  # type: ignore
except Exception:
    nx = None  # type: ignore

try:
    import osmnx as ox  # type: ignore
except Exception:
    ox = None  # type: ignore

EARTH_KM = 6371.0

# Approximate Delhi / NCR landmarks (lng, lat)
_LANDMARKS: dict[str, tuple[float, float]] = {
    "CP": (77.2167, 28.6315),
    "ITO": (77.2495, 28.6289),
    "IG": (77.2295, 28.6129),
    "AIIMS": (77.2090, 28.5672),
    "KB": (77.1900, 28.6510),
    "NP": (77.2517, 28.5494),
    "AKS": (77.2773, 28.6127),
    "SJ": (77.1950, 28.5730),
    "RK": (77.1200, 28.6490),
    "LP": (77.2430, 28.5700),
}

_NODE_LABELS = {
    "CP": "Connaught Place",
    "ITO": "ITO Crossing",
    "IG": "India Gate",
    "AIIMS": "AIIMS Junction",
    "KB": "Karol Bagh",
    "NP": "Nehru Place",
    "AKS": "Akshardham",
    "SJ": "Safdarjung",
    "RK": "Rajouri Garden",
    "LP": "Lajpat Nagar",
}

# Undirected corridor catalogue: (a, b, km, min, optional default hazard)
_CORRIDORS: list[tuple[str, str, float, float, dict[str, Any] | None]] = [
    ("CP", "ITO", 3.4, 9.0, {"type": "pothole", "penalty": 0.42, "delay_min": 4.0}),
    ("CP", "IG", 2.6, 7.0, None),
    ("CP", "KB", 3.1, 10.0, None),
    ("ITO", "AKS", 4.1, 11.0, {"type": "waterlogging", "penalty": 0.55, "delay_min": 6.0}),
    ("ITO", "IG", 2.2, 6.0, None),
    ("IG", "AIIMS", 5.8, 14.0, None),
    ("KB", "AIIMS", 6.4, 16.0, {"type": "pothole", "penalty": 0.31, "delay_min": 3.0}),
    ("KB", "RK", 4.8, 13.0, None),
    ("AIIMS", "NP", 3.9, 11.0, {"type": "waterlogging", "penalty": 0.48, "delay_min": 5.0}),
    ("AIIMS", "SJ", 1.8, 6.0, None),
    ("AIIMS", "LP", 4.2, 12.0, None),
    ("NP", "LP", 3.3, 9.0, None),
    ("SJ", "LP", 5.1, 14.0, None),
    ("RK", "SJ", 7.2, 18.0, None),
    ("IG", "AKS", 5.0, 13.0, None),
]

_SEVERITY_TABLE = {
    "low": {"penalty": 0.25, "delay_min": 2.0, "type": "pothole"},
    "medium": {"penalty": 0.45, "delay_min": 4.0, "type": "pothole"},
    "high": {"penalty": 0.75, "delay_min": 7.0, "type": "waterlogging"},
    "critical": {"penalty": 1.20, "delay_min": 12.0, "type": "waterlogging"},
    "pothole": {"penalty": 0.42, "delay_min": 4.0, "type": "pothole"},
    "waterlogging": {"penalty": 0.55, "delay_min": 6.0, "type": "waterlogging"},
}

WEIGHT_PENALTIES = {
    "pothole": 0.42,
    "waterlogging": 0.55,
    "ai_cost_multiplier": 4.0,
}


def _haversine_km(lng1: float, lat1: float, lng2: float, lat2: float) -> float:
    p1, p2 = math.radians(lat1), math.radians(lat2)
    dphi = math.radians(lat2 - lat1)
    dlmb = math.radians(lng2 - lng1)
    a = math.sin(dphi / 2) ** 2 + math.cos(p1) * math.cos(p2) * math.sin(dlmb / 2) ** 2
    return 2 * EARTH_KM * math.asin(min(1.0, math.sqrt(a)))


def _edge_key(a: str, b: str) -> tuple[str, str]:
    return (a, b) if a < b else (b, a)


class TridentRouter:
    """Standard vs AI-optimized path planner with injectable hazard weights."""

    def __init__(self) -> None:
        self.engine_mode = "fallback"
        self.nodes = dict(_LANDMARKS)
        self.labels = dict(_NODE_LABELS)
        self.edges: dict[tuple[str, str], dict[str, Any]] = {}
        self._nx_graph = None
        self._osm_graph = None

        for a, b, km, minutes, hazard in _CORRIDORS:
            self.edges[_edge_key(a, b)] = {
                "from": a,
                "to": b,
                "distance_km": km,
                "travel_min": minutes,
                "hazard": dict(hazard) if hazard else None,
            }

        if nx is not None:
            self._nx_graph = self._build_networkx()
            self.engine_mode = "networkx"

        if ox is not None and nx is not None:
            # osmnx is present but we never download a live OSM extract at import
            # time (unreliable on Windows). The in-memory graph remains canonical.
            self.engine_mode = "osmnx-fallback"

    def _build_networkx(self):
        graph = nx.Graph()
        for node_id, (lng, lat) in self.nodes.items():
            graph.add_node(node_id, lng=lng, lat=lat, label=self.labels.get(node_id, node_id))
        for (a, b), meta in self.edges.items():
            graph.add_edge(a, b, **meta)
        return graph

    def _nearest_node(self, lng: float, lat: float) -> str:
        return min(
            self.nodes,
            key=lambda nid: _haversine_km(lng, lat, self.nodes[nid][0], self.nodes[nid][1]),
        )

    def _neighbors(self, node_id: str) -> list[tuple[str, dict[str, Any]]]:
        out: list[tuple[str, dict[str, Any]]] = []
        for (a, b), meta in self.edges.items():
            if a == node_id:
                out.append((b, meta))
            elif b == node_id:
                out.append((a, meta))
        return out

    def _dijkstra(
        self,
        source: str,
        target: str,
        *,
        avoid_hazards: bool,
    ) -> dict[str, Any] | None:
        if source == target:
            lng, lat = self.nodes[source]
            return {
                "nodes": [source],
                "coordinates": [[lng, lat]],
                "distance_km": 0.0,
                "travel_time_min": 0.0,
                "penalty": 0.0,
                "delay_min": 0.0,
                "segments": [],
            }

        dist: dict[str, float] = {n: math.inf for n in self.nodes}
        prev: dict[str, tuple[str, dict[str, Any]]] = {}
        dist[source] = 0.0
        heap: list[tuple[float, str]] = [(0.0, source)]

        while heap:
            cost, u = heapq.heappop(heap)
            if cost > dist[u]:
                continue
            if u == target:
                break
            for v, meta in self._neighbors(u):
                hazard = meta.get("hazard") or {}
                penalty = float(hazard.get("penalty", 0.0)) if hazard else 0.0
                weight = float(meta["distance_km"])
                if avoid_hazards:
                    weight += penalty * WEIGHT_PENALTIES["ai_cost_multiplier"]
                alt = cost + weight
                if alt < dist[v]:
                    dist[v] = alt
                    prev[v] = (u, meta)
                    heapq.heappush(heap, (alt, v))

        if target not in prev:
            return None

        node_path = [target]
        segments: list[dict[str, Any]] = []
        cur = target
        while cur != source:
            parent, meta = prev[cur]
            hazard = meta.get("hazard")
            segments.append(
                {
                    "from": parent,
                    "from_label": self.labels.get(parent, parent),
                    "to": cur,
                    "to_label": self.labels.get(cur, cur),
                    "distance_km": round(float(meta["distance_km"]), 3),
                    "travel_min": round(float(meta["travel_min"]), 2),
                    "hazard": hazard,
                }
            )
            node_path.append(parent)
            cur = parent
        node_path.reverse()
        segments.reverse()

        distance_km = sum(s["distance_km"] for s in segments)
        travel_min = sum(s["travel_min"] for s in segments)
        delay_min = sum((s["hazard"] or {}).get("delay_min", 0.0) for s in segments)
        penalty = sum((s["hazard"] or {}).get("penalty", 0.0) for s in segments)
        coordinates = [[self.nodes[n][0], self.nodes[n][1]] for n in node_path]

        return {
            "nodes": node_path,
            "labels": [self.labels.get(n, n) for n in node_path],
            "coordinates": coordinates,
            "distance_km": round(distance_km, 3),
            "travel_time_min": round(travel_min, 2),
            "penalty": round(penalty, 3),
            "delay_min": round(delay_min, 2),
            "segments": segments,
        }

    def calculate_safe_path(
        self,
        start_tuple: tuple[float, float],
        end_tuple: tuple[float, float],
    ) -> dict[str, Any]:
        try:
            start_lng, start_lat = float(start_tuple[0]), float(start_tuple[1])
            end_lng, end_lat = float(end_tuple[0]), float(end_tuple[1])
        except (TypeError, ValueError, IndexError):
            return {"status": "ERROR", "message": "start/end must be (lng, lat) numeric tuples"}

        if not (-180 <= start_lng <= 180 and -90 <= start_lat <= 90):
            return {"status": "ERROR", "message": "start coordinates out of range"}
        if not (-180 <= end_lng <= 180 and -90 <= end_lat <= 90):
            return {"status": "ERROR", "message": "end coordinates out of range"}

        origin = self._nearest_node(start_lng, start_lat)
        dest = self._nearest_node(end_lng, end_lat)

        standard = self._dijkstra(origin, dest, avoid_hazards=False)
        optimized = self._dijkstra(origin, dest, avoid_hazards=True)
        if standard is None or optimized is None:
            return {
                "status": "ERROR",
                "message": f"No corridor found between {origin} and {dest}",
            }

        saved_min = round(
            (standard["travel_time_min"] + standard["delay_min"])
            - (optimized["travel_time_min"] + optimized["delay_min"]),
            2,
        )

        return {
            "status": "SUCCESS",
            "message": "Route computed with in-memory graph fallback"
            if "osm" not in self.engine_mode
            else "Route computed (OSM packages present; local graph used)",
            "engine": self.engine_mode,
            "snapped_origin": {
                "id": origin,
                "label": self.labels.get(origin, origin),
                "lng": self.nodes[origin][0],
                "lat": self.nodes[origin][1],
            },
            "snapped_destination": {
                "id": dest,
                "label": self.labels.get(dest, dest),
                "lng": self.nodes[dest][0],
                "lat": self.nodes[dest][1],
            },
            "standard_route": standard,
            "ai_optimized_route": optimized,
            "weight_penalties": dict(WEIGHT_PENALTIES),
            "travel_time_estimates": {
                "standard_min": round(standard["travel_time_min"] + standard["delay_min"], 2),
                "ai_optimized_min": round(
                    optimized["travel_time_min"] + optimized["delay_min"], 2
                ),
                "hazard_delay_saved_min": saved_min,
            },
        }

    def inject_hazard_penalty(self, lng: float, lat: float, severity: str) -> bool:
        try:
            lng_f, lat_f = float(lng), float(lat)
        except (TypeError, ValueError):
            return False

        spec = _SEVERITY_TABLE.get(str(severity).strip().lower())
        if spec is None:
            spec = _SEVERITY_TABLE["medium"]
            spec = {**spec, "type": str(severity).strip().lower() or "pothole"}

        nearest = self._nearest_node(lng_f, lat_f)
        best_key = None
        best_d = math.inf
        for key, meta in self.edges.items():
            if nearest not in key:
                continue
            other = key[0] if key[1] == nearest else key[1]
            olng, olat = self.nodes[other]
            # Distance from injected point to corridor midpoint
            mlng = (self.nodes[nearest][0] + olng) / 2.0
            mlat = (self.nodes[nearest][1] + olat) / 2.0
            d = _haversine_km(lng_f, lat_f, mlng, mlat)
            if d < best_d:
                best_d = d
                best_key = key

        if best_key is None:
            return False

        existing = self.edges[best_key].get("hazard") or {"penalty": 0.0, "delay_min": 0.0}
        stacked = {
            "type": spec["type"],
            "penalty": round(float(existing.get("penalty", 0.0)) + spec["penalty"], 3),
            "delay_min": round(float(existing.get("delay_min", 0.0)) + spec["delay_min"], 2),
        }
        self.edges[best_key]["hazard"] = stacked

        if self._nx_graph is not None:
            a, b = best_key
            if self._nx_graph.has_edge(a, b):
                self._nx_graph[a][b]["hazard"] = stacked
        return True
