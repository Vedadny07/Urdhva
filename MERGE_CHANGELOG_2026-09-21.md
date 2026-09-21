# URDHVA Final Prototype Merge – 2026-09-21

## Base

Canonical base: the ZIP uploaded in this conversation:
`URDHVA-SIH26011-NATIONWIDE-OSM-3D-FLOORS-FINAL-INTEGRATED-v3(1).zip`

This package was edited in place as an additive merge. Existing URDHVA application modules, property data structures, survey workflows, LiDAR/drone/CAD/underground workflows, and existing detailed property scene were not intentionally replaced.

## Added / strengthened

1. Nationwide geographic 3D map remains driven by real geographic sources (Overture vector tiles plus OSM/Overpass detail at neighborhood zoom).
2. Pune-style floor visualization logic is generalized to dynamic viewport loading instead of fixed Pune geometry.
3. Vertical rendering uses source height when present; when only source floor count is available, it uses a documented 3.2 m/floor visualization estimate; when neither is available, only a footprint thickness is shown.
4. Selected Overture buildings accept common source-field aliases for height/floor attributes.
5. Building labels appear at high zoom when the source provides a name.
6. A zoom/LOD indicator shows the current geographic detail level.
7. The selected building preview uses the actual source footprint geometry. It does not substitute a generic building shape when source geometry is missing.
8. A Property Passport handoff section explicitly separates official ULPIN, survey status, Record vs Reality, and the future URDHVA vertical identifier.
9. A geographic-to-URDHVA workflow handoff stores source context without overwriting existing property records and provides a return path to the geographic view.
10. Documentation/test notes were updated to record the merge and the current environment's frontend dependency-install limitation.

## Integrity rules retained

- No fabricated roads, parcels, owners, ULPINs, buildings, coordinates, heights, floors, or apartment/unit records.
- Official ULPIN remains parcel-level; URDHVA vertical identifiers remain separate.
- Survey-grade information remains associated with the existing URDHVA survey/LiDAR/drone/CAD workflows.
- Geographic map failures are isolated from the rest of the app through the existing error boundary.

## Verification performed here

- JavaScript / JSX / TypeScript parser validation: PASS (49 files).
- Backend Python syntax validation: PASS.
- Full `npm run build`: not completed in this environment because dependency installation timed out and left Vite incomplete; no claim of live browser acceptance is made.
