# URDHVA Test Report – Nationwide OSM 3D Final Merge

## Static checks completed

- Python syntax compilation: PASS (`python3 -m py_compile backend/*.py`)
- Frontend JS/JSX syntax transpilation check: PASS (48 source files checked)
- New OSM viewport endpoint present: PASS
- OSM detail source/layers present: PASS
- Clickable OSM detail hit layer present: PASS
- Scrollable geographic inspector present: PASS

## Browser/network limitation

A full live browser acceptance test was not available in the build environment because the package manager could not complete the Vite dependency installation within the execution window. No claim of live localhost/Overpass verification is made here.

## Expected manual acceptance on Mac

1. Start backend on port 8000.
2. Start frontend with `npm run dev`.
3. Open `http://localhost:3000`.
4. Open CITY 3D.
5. Search Pune, Hadapsar, and Baramati from the existing top search bar.
6. At city/neighborhood zoom, confirm OSM detail buildings begin loading above the nationwide vector layer.
7. Click a source building or its footprint and confirm the geographic information panel opens.
8. Confirm length, breadth, area, height/floor status and provenance are visible.
9. For a building with source floors, confirm the selected 3D preview shows separate floor bands.
10. Pan to another nearby viewport and confirm detail data updates without blocking the existing base map.
11. Confirm the information panel scrolls through all sections.
12. Confirm Property 3D, LiDAR/drone, underground and ULPIN workflows remain available.


## Final merge checks (September 2026)

- JavaScript / JSX / TypeScript parser check: PASS (all source files parse successfully).
- Backend Python syntax check: PASS (`python3 -m py_compile backend/*.py`).
- OSM 3D height/floor logic reviewed and normalized to a 3.2 m/floor visualization fallback when source floors exist without source height.
- Geographic selected-building preview no longer substitutes a generic geometry when source geometry is unavailable.
- Geographic-to-URDHVA handoff context added without modifying the existing property data records.
- LOD feedback and source building labels added to the geographic map.

## Build limitation in this environment

A complete `npm run build` could not be completed because the environment's package installation timed out and left the Vite dependency tree incomplete (`vite/client` was unavailable). The application ZIP therefore does not include the incomplete `node_modules` directory. This is an environment/dependency-install limitation, not a reported runtime browser pass.

The expected local validation remains:

```bash
npm install --legacy-peer-deps
npm run build
```
