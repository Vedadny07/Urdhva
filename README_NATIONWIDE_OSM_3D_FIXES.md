# URDHVA Nationwide OSM 3D Fixes

This build keeps the existing URDHVA application and only updates the geographic 3D explorer.

## Changes
- Water is OFF by default to prevent the custom Overture water fill from dominating the map. It remains available as an explicit layer toggle.
- Detailed OSM buildings begin loading at zoom 13 instead of 14, so city views receive Pune-style OSM building attributes earlier.
- OSM detail requests use tighter zoom-based viewport bounds to reduce latency while retaining continuous progressive panning; there is no fixed 800 m radius.
- Selected Overture buildings are enriched on click when either height or floor data is missing, so an Overture height can be supplemented by OSM floor tags.
- Geographic building extrusion accepts additional source field aliases (`height_m`, `building_height`, `height_estimate`, `estimated_height_m`, `levels`, `building:levels`, etc.).
- Footprint-only buildings remain clickable and get a small neutral 3D visual mass. This is explicitly a visual footprint thickness, not a claimed real height.
- Selected building mini 3D preview uses the real source footprint and visibly separated floor slabs when source floor count exists.
- Information System panel has constrained height and a persistent vertical scrollbar so long provenance/ULPIN/building details remain browsable.

## Data honesty
The build does not manufacture exact building heights or floor counts. OSM and Overture source attributes are shown as source-provided. A floor-derived extrusion is an estimate and is labelled as such. Survey-grade height/floor results still come from URDHVA LiDAR/drone/GNSS workflows.
