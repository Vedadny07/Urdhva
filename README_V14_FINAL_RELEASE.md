# URDHVA V14 — Final SIH Prototype Release

V14 is the release candidate built from the V13 prototype with two high-priority corrections requested for the SIH demo:

1. Utility networks are displayed as connected network geometry rather than many visually isolated road/utility fragments.
2. Floor/unit volumes are clipped to the selected building's real source footprint so irregular/L-shaped/polygon buildings are not represented by rectangular cubes outside the building.

## Core workflow
Search → real geographic building → parcel/ULPIN context → source-shaped 3D building → floor stack → shape-aware flat/unit volumes → survey/CAD/LiDAR/Record vs Reality → utility layer → connected network focus → underground 3D/depth → URDHVA Vertical Property ID → Property Passport.

## Utility behavior
- Fast 1 km utility focus for the selected category.
- Explicit 3 km expansion remains available.
- Real source-mapped utility geometry is preferred when OSM/Overpass or a configured authorized GIS adapter returns it.
- Source utility segments that already touch/overlap and share compatible metadata are merged for the display network. Original segment IDs are preserved in `source_segment_ids`; gaps are never bridged.
- When no source utility geometry is returned, URDHVA can show a connected DEMO corridor based on real mapped road geometry. DEMO routes are clearly labelled and are not official utility records.
- Known utility depth is rendered below ground in the Underground 3D explorer. Unknown depth remains explicitly unassigned/plan-only.

## Shape-aware vertical property
The selected building uses the source polygon footprint. The floor/unit preview recursively bisects that polygon to create up to four unit footprints per floor that remain inside the source building shape. Source-linked unit records remain preserved and are used where available. Synthetic unit geometry is labelled as prototype geometry when no actual CAD/BIM/survey unit geometry is supplied.

## ULPIN terminology
Official ULPIN remains parcel-level. Floor/unit strings are URDHVA vertical property identifiers and must not be presented as official ULPINs.

## Preserved
Existing URDHVA property data, building records, infrastructure records, LiDAR sample asset, existing UI/navigation, survey/CAD/drone/GPR modules, Record vs Reality, underground workflows, and existing APIs are retained.

## Local start
```bash
cd ~/Downloads/URDHVA-SIH26011-FINAL-V14-PIPELINE-SHAPE-AWARE
chmod +x START_BOTH_MAC.sh
./START_BOTH_MAC.sh
```
Frontend: http://127.0.0.1:3000
Backend: http://127.0.0.1:8000
API docs: http://127.0.0.1:8000/docs

## GitHub
Do not commit `node_modules`, `backend/venv`, local runtime DB/cache, or secrets. Deploy the frontend with the included GitHub Pages workflow and deploy the FastAPI backend separately.
