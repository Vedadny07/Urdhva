# URDHVA V12 — Final 10-Point Integration

This release keeps the existing URDHVA application and data model and adds an integrated vertical-property workspace around the geographic 3D map.

## 10 integrated improvements

1. **Parcel + ULPIN connection** — the selected geographic building can display an authoritative Maharashtra ULPIN when an authorized provider resolves it. Existing URDHVA `baseUlpin` records are shown as local parcel context, never as newly resolved government data.
2. **Floor + unit geometry** — source floor counts drive the vertical stack; linked existing URDHVA family/unit records are used when available, including source unit areas and proportional visual volume. Without unit geometry, the prototype clearly labels the visual partition as synthetic.
3. **Utility route → depth → 3D** — selected utility features are placed below the ground divider when an explicit source depth exists. The selected route is rendered as a 3D tube; missing depth stays a dashed plan route.
4. **Record vs Reality linkage** — the selected geographic building calls `/api/geo/record-reality` and compares source floors/depth/footprint area with an existing URDHVA property record when a conservative match exists.
5. **Property Passport** — the vertical workspace can export a JSON Property Passport containing location, parcel identifiers, building provenance, floor/unit context, underground utility selection and comparison metadata.
6. **Multi-source utility architecture** — OSM/Overpass remains the open detail source; optional authorized GeoJSON providers can be configured per utility category through environment variables. No provider endpoint is guessed or scraped.
7. **3D utility route model** — selected utilities use depth/elevation metadata when provided; visual depth exaggeration is explicitly labelled.
8. **Building/utility clash** — the 3D underground view detects whether the selected utility route intersects the selected building footprint and highlights the relationship.
9. **Unified search** — the top search now supports location/property/ULPIN/building/road and utility-category actions such as `gas`, `water`, `sewer`, `electricity`, and `telecom`.
10. **Performance** — utility queries remain viewport-limited, active-category-only, debounced and cached; expanded ~3 km network loading is user-triggered.

## Data authenticity rules

- Official ULPIN is parcel-level. Floor/unit identifiers are URDHVA vertical property identifiers.
- OSM/Overture source data is preserved as source context.
- Missing official parcel, unit, utility or depth data is never silently fabricated.
- Demo utility corridors, when used, are explicitly marked `DEMO VISUALIZATION` and are aligned to real mapped roads only for workflow demonstration.
- Source-derived, survey-derived, estimated and demo values remain visibly distinguished.

## Optional utility GIS adapters

Set one or more variables from `.env.example` only when you have a legitimate machine-readable GeoJSON source/export. The backend normalizes those features into the same utility model as OSM/Overpass.

## GitHub

Do not commit `node_modules`, Python virtual environments, caches, secrets or a local mutable SQLite database. Install frontend dependencies from `package-lock.json` and create the backend virtual environment during deployment/runtime.
