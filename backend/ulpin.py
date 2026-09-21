"""
ulpin.py — Standards-compliant ULPIN (Unique Land Parcel Identification Number)
generation, modeled on India's real 14-digit Bhu-Aadhaar/ULPIN standard:

    State(2) + District(2) + Sub-district/Tehsil(2) + Village(4) + Unique Parcel No.(4)

This module owns the *land parcel* identity — the part of a property's ULPIN
that the real standard actually defines. Urdhva then appends a vertical/3D
suffix (F01, P1, B1, ...) on top of the base to identify a specific floor,
parking level or basement within that parcel, since the real ULPIN standard
has no concept of "floor" at all — that layer is Urdhva's own extension.

Two representations of the same base are used throughout the app:
  - stored   (compact, no separators): "27250100110001"   — 14 characters,
             this is what's persisted in the DB and used for uniqueness checks.
  - display  (dashed, human-readable): "27-25-01-0011-0001" — this is what
             citizens/officials see, search by, and what unit ULPINs are
             built from, e.g. "27-25-01-0011-0001-F01".
"""

import re
import datetime
from database import get_connection

# This prototype is Pune-based, so we default to Maharashtra / Pune unless a
# building's demo locality says otherwise.
DEFAULT_STATE_CODE = "27"      # Maharashtra
DEFAULT_DISTRICT_CODE = "25"   # Pune

# Small hardcoded lookup table mapping the demo buildings in
# public/data/buildings.json to a plausible sub-district (tehsil) + revenue
# village pair, so their seeded ULPINs look like real Pune cadastral
# addresses instead of arbitrary numbers. Real deployments would replace this
# with an actual tehsil/village master lookup (e.g. keyed by lat/lng or the
# locality picked in PuneOsmMapSelector).
DEMO_BUILDING_LOCALITY = {
    "UP80010001": {"subdistrict_code": "01", "subdistrict_name": "Haveli",  "village_code": "0011", "village_name": "Kothrud"},
    "UP80010002": {"subdistrict_code": "01", "subdistrict_name": "Haveli",  "village_code": "0012", "village_name": "Kalyani Nagar"},
    "UP80010003": {"subdistrict_code": "01", "subdistrict_name": "Haveli",  "village_code": "0013", "village_name": "Baner"},
    "UP80010004": {"subdistrict_code": "01", "subdistrict_name": "Haveli",  "village_code": "0014", "village_name": "Viman Nagar"},
    "UP80010005": {"subdistrict_code": "01", "subdistrict_name": "Haveli",  "village_code": "0015", "village_name": "Shivajinagar"},
    "UP80010006": {"subdistrict_code": "02", "subdistrict_name": "Mulshi",  "village_code": "0021", "village_name": "Hinjewadi"},
    "UP80010007": {"subdistrict_code": "01", "subdistrict_name": "Haveli",  "village_code": "0016", "village_name": "Camp"},
}

# Fallback village used for buildings created through the survey workflow
# that don't (yet) carry a specific locality — keeps generation deterministic
# rather than random, while still being clearly distinguishable as "unplaced".
FALLBACK_LOCALITY = {"subdistrict_code": "09", "subdistrict_name": "Haveli", "village_code": "0099", "village_name": "Unplaced Survey Parcel"}


def resolve_locality(building_id: str = None):
    """Returns the {subdistrict_code, village_code, ...} dict for a known demo
    building, or the fallback locality for anything else (e.g. new buildings
    created live through the survey workflow)."""
    if building_id and building_id in DEMO_BUILDING_LOCALITY:
        return DEMO_BUILDING_LOCALITY[building_id]
    return FALLBACK_LOCALITY


def _compact(state_code, district_code, subdistrict_code, village_code, parcel_no):
    return f"{state_code}{district_code}{subdistrict_code}{village_code}{parcel_no:04d}"


def format_ulpin_display(base_compact: str) -> str:
    """Renders a compact 14-digit stored base as the dashed, human-readable
    form: '27250100110001' -> '27-25-01-0011-0001'."""
    if not base_compact or len(base_compact) != 14 or not base_compact.isdigit():
        return base_compact
    return f"{base_compact[0:2]}-{base_compact[2:4]}-{base_compact[4:6]}-{base_compact[6:10]}-{base_compact[10:14]}"


def parse_ulpin_display(display: str) -> str:
    """Reverses format_ulpin_display: '27-25-01-0011-0001' -> '27250100110001'."""
    if not display:
        return display
    return re.sub(r"[^0-9]", "", display)


def generate_base_ulpin(state_code: str, district_code: str, subdistrict_code: str, village_code: str, conn=None) -> dict:
    """
    Assigns the NEXT sequential 4-digit parcel number for the given village
    (state/district/subdistrict/village combination), guaranteeing uniqueness
    via the `ulpin_registry` table, and returns the new base ULPIN in both
    representations:

        {
          "stored": "27250100110001",
          "display": "27-25-01-0011-0001",
          "parcel_no": 7
        }
    """
    own_conn = conn is None
    if own_conn:
        conn = get_connection()
    cursor = conn.cursor()

    cursor.execute(
        """
        SELECT MAX(parcel_no) AS max_parcel FROM ulpin_registry
        WHERE state_code = ? AND district_code = ? AND subdistrict_code = ? AND village_code = ?
        """,
        (state_code, district_code, subdistrict_code, village_code),
    )
    row = cursor.fetchone()
    next_parcel = (row["max_parcel"] or 0) + 1

    stored = _compact(state_code, district_code, subdistrict_code, village_code, next_parcel)
    display = format_ulpin_display(stored)

    cursor.execute(
        """
        INSERT INTO ulpin_registry (
            state_code, district_code, subdistrict_code, village_code,
            parcel_no, base_ulpin, issued_at
        ) VALUES (?, ?, ?, ?, ?, ?, ?)
        """,
        (state_code, district_code, subdistrict_code, village_code, next_parcel, stored, datetime.datetime.now().isoformat()),
    )

    if own_conn:
        conn.commit()
        conn.close()

    return {"stored": stored, "display": display, "parcel_no": next_parcel}


def generate_base_ulpin_for_building(building_id: str = None, locality: dict = None, conn=None) -> dict:
    """Convenience wrapper: resolves a locality (from the demo lookup table,
    an explicit override, or the fallback) and issues the next base ULPIN in
    that village. Used by the building-creation and survey-deployment flows."""
    loc = locality or resolve_locality(building_id)
    return generate_base_ulpin(
        DEFAULT_STATE_CODE,
        DEFAULT_DISTRICT_CODE,
        loc["subdistrict_code"],
        loc["village_code"],
        conn=conn,
    )


def unit_ulpin(base_display: str, suffix: str) -> str:
    """Builds a URDHVA vertical-property display identifier by appending the
    vertical suffix (F01, P1, B1, ...) on top of the compliant 14-digit base, e.g.
    '27-25-01-0011-0001' + 'F01' -> '27-25-01-0011-0001-F01'."""
    return f"{base_display}-{suffix}"
