# URDHVA V13 Final QA Report

Date: 2026-09-21

## Source and preservation
- V12 was used as the code/data base for the release hardening pass.
- Canonical project data files were SHA-256 compared between V12 and V13 and are unchanged:
  - public/data/buildings.json
  - public/data/infrastructure.json
  - src/data/demoCadastreMap.js
  - src/data/puneOsmCadastralPresets.js
  - backend/urdhva_sample_lidar_building.ply
  - public/urdhva_sample_lidar_building.ply
  - package-lock.json

## Static validation
- Backend `python3 -m compileall -q backend`: PASS.
- Frontend TypeScript/JS/JSX validation with global TypeScript compiler and `tsconfig.json`: PASS.
- React hook import check across JS/JSX/TS/TSX: PASS.
- macOS startup shell scripts `bash -n`: PASS.
- package.json dependency/devDependency alignment with package-lock.json: PASS.
- Demo utility helper functional smoke test: PASS for gas, water, sewer, electricity and telecom.

## Backend endpoint smoke tests
Using FastAPI TestClient with a temporary bcrypt stub only because the validation container does not have the optional bcrypt wheel installed:
- /api/health: 200
- /: 200
- /api/buildings: 200
- /api/infrastructure: 200
- /api/underground-features: 200
- /api/geo/data-sources: 200
- /api/geo/record-reality: 200
- /api/geo/underground-viewport: 200
- /api/geo/underground-network: 200
- /api/geo/building-detail: 200 and structured `unavailable` on remote-source failure

Result: 10/10 backend smoke checks passed.

## Final hardening included
- Selected utility category takes precedence when focusing a network.
- Fast-first utility corridors appear immediately from already-loaded road geometry while source data is fetched in the background.
- Active-category-only utility querying.
- Debounced and abortable viewport requests with bounded client/server timeouts.
- Solid, high-visibility utility lines on the geographic map; basement footprints remain dashed.
- Expanded utility network request around the selected line.
- Source geometry replaces demo visualization when source data returns.
- Source-depth tubes in the underground 3D scene now follow the source polyline segment-by-segment rather than smoothing it into a curved path.
- Unknown depth remains unassigned rather than being fabricated.
- Building-detail OSM failures degrade to a structured response instead of HTTP 500.
- Combined macOS launcher starts backend and frontend together and opens localhost after health checks.
- GitHub Pages workflow and VITE_API_BASE_URL support are included.

## Environment limitation
The release environment used for this QA pass does not have working access to the public npm registry and the provided local node_modules tree is incomplete, so a clean `npm ci` / Vite production bundle could not be executed here. The source-level TypeScript validation passed, and the release is intended to install dependencies normally on the target Mac or GitHub Actions runner. The live OSM/Overture/Overpass network was also unavailable from this validation container, so source-data availability was not asserted beyond the structured API behavior.

## Release conclusion
No source-data regression was detected in the preserved canonical assets. Static frontend/backend validation and backend endpoint smoke tests passed. The remaining validation step is the target-machine dependency install plus browser runtime check, which depends on the target environment's network access.
