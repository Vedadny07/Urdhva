# URDHVA V10 – Utility Network 3D Visualization

This version preserves the existing URDHVA application and adds a clearer utility-network demonstration workflow.

## Behavior
- Select Gas / Water / Sewer / Electricity / Telecom on the geographic map.
- Source-mapped OSM/Overpass utility geometry is preferred.
- When no source-mapped utility geometry exists for the selected category, URDHVA can create a clearly labelled DEMO corridor aligned to real OSM/Overture road geometry so the SIH interaction is visible.
- DEMO utility depths (gas 2.1 m, water 1.3 m, sewer 2.8 m, electricity 1.7 m, telecom 0.9 m) are illustrative only and must not be treated as survey or official values.
- Click any utility line to inspect category, source, depth, and status.
- Open `Underground 3D` to see the selected building above ground together with nearby utility routes below ground.
- The 3D view checks whether the selected utility geometry crosses the selected building footprint. It does not infer a physical underground crossing when the source geometry does not support it.

## SIH demonstration wording
Use the DEMO layer only as a prototype visualization of the vertical-property workflow. Describe source-mapped geometry as source-derived; describe demo corridors and demo depth as synthetic/illustrative. Official ULPIN remains parcel-level and separate from URDHVA vertical identifiers.
