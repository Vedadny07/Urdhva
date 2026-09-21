# URDHVA V14 — Final Release QA

Date: 2026-09-21

## Static checks
- Backend Python `py_compile`: PASS
- Frontend TypeScript/JS/JSX/TSX parser check with TypeScript 6 (`--allowImportingTsExtensions`): PASS
- Modified source brace/paren/bracket balance: PASS
- Client connected-network helper synthetic test: PASS
  - 3 connected road inputs produced 2 connected chains
  - `network_connected=true` on all demo features

## Preservation checks
Compared against V13 SHA-256:
- `backend/urdhva_sample_lidar_building.ply`: unchanged
- `public/urdhva_sample_lidar_building.ply`: unchanged
- `public/data/buildings.json`: unchanged
- `public/data/infrastructure.json`: unchanged

## Changes validated
- Connected demo utility network using real mapped road geometry
- More robust Overpass failover for expanded utility network requests
- 1 km fast focus + explicit 3 km expansion
- Utility map glow/casing for clearer continuity
- Selected utility sidebar now exposes network identity/connectivity metadata
- Underground 3D context expanded to 1 km around the selected building
- All known-depth utility routes can render as 3D tubes; unknown depth remains plan-only/dashed
- Floor/unit volumes clipped to the actual building footprint instead of box cubes
- Original source data/provenance rules retained

## Runtime limitation
A full clean npm browser build was not possible in the isolated build environment because dependency installation/network access was unavailable. The release therefore does not claim a live end-to-end browser test. Target-machine startup is provided by `START_BOTH_MAC.sh`.
