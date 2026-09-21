"""Optional authorized underground-utility GeoJSON adapters for URDHVA.

The prototype never assumes a government/utility endpoint exists. Providers can
supply an authorized GeoJSON URL through environment variables. The URL may use
an optional ``{bbox}`` token containing ``west,south,east,north``; otherwise the
adapter appends ``?bbox=...``. Returned features are normalized into the same
category/depth/provenance model used by the OSM/Overpass source.
"""
from __future__ import annotations

import json
import os
import urllib.parse
import urllib.request
from concurrent.futures import ThreadPoolExecutor, as_completed
from typing import Any, Dict, List, Optional, Tuple

UTILITY_ENV = {
    "water": "URDHVA_UTILITY_WATER_GEOJSON_URL",
    "sewer": "URDHVA_UTILITY_SEWER_GEOJSON_URL",
    "gas": "URDHVA_UTILITY_GAS_GEOJSON_URL",
    "electricity": "URDHVA_UTILITY_ELECTRICITY_GEOJSON_URL",
    "telecom": "URDHVA_UTILITY_TELECOM_GEOJSON_URL",
}


def configured_utility_urls() -> Dict[str, str]:
    return {category: os.getenv(env_name, "").strip() for category, env_name in UTILITY_ENV.items()}


def _append_bbox(url: str, bbox: Tuple[float, float, float, float]) -> str:
    west, south, east, north = bbox
    value = f"{west},{south},{east},{north}"
    if "{bbox}" in url:
        return url.replace("{bbox}", urllib.parse.quote(value, safe=",-"))
    parts = urllib.parse.urlsplit(url)
    query = urllib.parse.parse_qsl(parts.query, keep_blank_values=True)
    query.append(("bbox", value))
    return urllib.parse.urlunsplit((parts.scheme, parts.netloc, parts.path, urllib.parse.urlencode(query), parts.fragment))


def _number(value: Any) -> Optional[float]:
    try:
        if value is None or value == "":
            return None
        n = float(value)
        return n if n == n and abs(n) != float("inf") else None
    except Exception:
        return None


def _depth_from_props(props: Dict[str, Any]) -> Optional[float]:
    for key in ("depth_m", "depth", "burial_depth_m", "burial_depth", "depth_from_ground_m", "underground_depth_m"):
        value = _number(props.get(key))
        if value is not None and value >= 0:
            return round(value, 3)
    return None


def _normalize_feature(feature: Dict[str, Any], category: str, source_label: str, index: int) -> Optional[Dict[str, Any]]:
    geometry = feature.get("geometry") or {}
    if geometry.get("type") not in {"LineString", "MultiLineString"}:
        return None
    props = dict(feature.get("properties") or {})
    source_id = props.get("source_id") or props.get("id") or feature.get("id") or f"{category}-configured-{index}"
    depth = _depth_from_props(props)
    normalized = {
        "type": "Feature",
        "geometry": geometry,
        "properties": {
            **props,
            "source": source_label,
            "source_id": str(source_id),
            "category": category,
            "name": props.get("name") or props.get("label"),
            "operator": props.get("operator"),
            "substance": props.get("substance") or props.get("medium"),
            "location": props.get("location") or "underground",
            "depth_m": depth,
            "diameter_m": _number(props.get("diameter_m") or props.get("diameter")),
            "layer": props.get("layer"),
            "tunnel": props.get("tunnel"),
            "ref": props.get("ref"),
            "voltage": props.get("voltage"),
            "data_status": "source-mapped-authorized-gis",
            "depth_status": "Source-provided" if depth is not None else "Unavailable",
        },
    }
    return normalized


def fetch_configured_geojson(category: str, bbox: Tuple[float, float, float, float], timeout: float = 8.0) -> Dict[str, Any]:
    url = configured_utility_urls().get(category, "")
    if not url:
        return {"configured": False, "features": [], "source": None, "error": None}
    request_url = _append_bbox(url, bbox)
    request = urllib.request.Request(
        request_url,
        headers={"Accept": "application/geo+json, application/json", "User-Agent": "URDHVA/1.0 (authorized utility adapter)"},
        method="GET",
    )
    try:
        with urllib.request.urlopen(request, timeout=timeout) as response:
            raw = json.load(response)
        if isinstance(raw, dict) and raw.get("type") == "FeatureCollection":
            source_label = f"Configured authorized GIS • {urllib.parse.urlsplit(request_url).netloc or 'provider'}"
            features = []
            for index, feature in enumerate(raw.get("features") or []):
                normalized = _normalize_feature(feature, category, source_label, index)
                if normalized:
                    features.append(normalized)
            return {"configured": True, "features": features[:2500], "source": source_label, "error": None}
        return {"configured": True, "features": [], "source": None, "error": "Provider response is not a GeoJSON FeatureCollection"}
    except Exception as exc:
        return {"configured": True, "features": [], "source": None, "error": str(exc)}


def fetch_configured_utilities(categories: list[str], bbox: Tuple[float, float, float, float]) -> dict[str, dict[str, Any]]:
    """Fetch configured utility providers concurrently so one slow provider does not block the others."""
    categories = [c for c in categories if c in UTILITY_ENV]
    if not categories:
        return {}
    results: Dict[str, Dict[str, Any]] = {}
    with ThreadPoolExecutor(max_workers=min(5, len(categories))) as pool:
        futures = {pool.submit(fetch_configured_geojson, category, bbox, 7.0): category for category in categories}
        for future in as_completed(futures):
            category = futures[future]
            try:
                results[category] = future.result()
            except Exception as exc:
                results[category] = {"configured": bool(configured_utility_urls().get(category)), "features": [], "source": None, "error": str(exc)}
    return results
