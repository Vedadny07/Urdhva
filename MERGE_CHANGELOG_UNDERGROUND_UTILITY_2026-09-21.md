# URDHVA Underground Utility Layer Merge — 2026-09-21

Added to the V5 canonical prototype without replacing existing URDHVA property/survey modules.

### Added
- `/api/geo/underground-viewport` for focused viewport utility retrieval via OSM/Overpass.
- Utility classification: water, sewer, gas, electricity, telecom, other pipeline.
- Source-mapped depth, diameter, operator, substance, voltage and location when present.
- Basement metadata/footprint layer from explicit `building:levels:underground`.
- Independent 3D building and 2D footprint toggles.
- Color-coded utility toggles with live returned-feature counts.
- Clickable utility inspection card.
- Debounced, viewport-limited utility loading with cancellation and in-memory cache.
- Provenance wording that distinguishes mapped source coverage from physical-absence claims.

### Data integrity
- No utility geometry is fabricated.
- No official ULPIN is generated from OSM.
- Existing URDHVA property data and workflows remain intact.
- Official utility-owner GIS can be added later via provider adapters.

### Validation
- Python backend syntax: PASS (`py_compile`).
- Full frontend build/live browser verification not completed in this environment because dependency installation was incomplete.
