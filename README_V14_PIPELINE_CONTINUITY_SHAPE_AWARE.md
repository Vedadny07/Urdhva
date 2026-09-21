# URDHVA V14 — pipeline continuity + shape-aware vertical property

## Final visual fixes
- Source utility segments that already touch/overlap and share compatible metadata are merged for a continuous network display. Original source IDs remain in `source_segment_ids`. No missing gaps are bridged.
- Demo utility corridors are generated from real mapped OSM road geometry and topologically connected for prototype visualization. They are clearly marked DEMO and never presented as physical utility records.
- Utility focus has a fast 1 km mode plus an explicit 3 km expansion.
- If a utility is not mapped in OSM/authorized data, the UI still shows a connected DEMO visualization based on mapped roads when available.
- Selected-building unit volumes are clipped to the actual source footprint so irregular/L-shaped buildings do not receive rectangular cubes outside their footprint.
- Underground 3D shows all known-depth utility tubes in the focused area; unknown-depth routes remain dashed/plan-only.

## Data rules
Source-mapped = returned by OSM/Overpass or a configured authorized GIS source.
Demo = road-aligned visualization with illustrative depth for presentation only.
Unavailable = no mapped source geometry; never evidence of physical absence.
Official ULPIN remains parcel-level. Floor/unit identifiers are URDHVA vertical property identifiers.

## Local
Backend: http://127.0.0.1:8000
Frontend: http://127.0.0.1:3000
