# URDHVA Underground 3D Network Merge — 2026-09-21

- Added Underground3DExplorer.jsx for depth-aware 3D network context.
- Added `/api/geo/underground-network` for expanded selected-utility network loading.
- Clicking a utility now opens the 3D explorer.
- Added Full network and 3D depth view actions.
- Expanded-network requests are centered on the selected geometry and capped at 6 km radius.
- Kept source provenance: OSM/Overpass only for public geographic utility data.
- Unknown depth is never converted into a fake measured depth.
- Existing building/property/LiDAR/CAD/ULPIN modules are preserved.
