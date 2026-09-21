# URDHVA Nationwide OSM 3D Integration

## What this build changes

The existing URDHVA application remains the base project. The existing Pune OSM workflow, safety check, cadastral presets, detailed property 3D scene, LiDAR/drone workflow, underground workflow, search, and existing APIs are preserved.

The nationwide geographic map now uses a hybrid architecture:

- Nationwide context and building coverage: Overture vector PMTiles.
- Detailed city/neighborhood buildings: OpenStreetMap via Overpass, loaded for the current viewport only.
- Floor-by-floor geographic rendering: source-backed OSM building footprints expanded into one 3D floor volume per available floor.
- Selected-property workflow: remains the existing URDHVA Three.js/R3F detailed property scene.

## Height and floor rules

1. If OSM provides an explicit `height` tag, `height_m` is the source height and is used directly for the 3D building total height.
2. If OSM provides both `height` and `building:levels`, the total height remains the source `height`; the floor slab height is derived as `height / levels`.
3. If OSM provides `building:levels` but no explicit `height`, the total render height is estimated as `levels × 3.2 m` plus `roof:height` when available. This is explicitly labelled as an estimate for visualization, not a measured height.
4. If OSM provides `height` but no `building:levels`, the floor count is estimated from `height / 3.2 m` for the floor-stack visualization. The height itself remains source-provided.
5. If neither height nor floor count exists, the building is shown as footprint-only with a tiny visual base thickness. No fabricated building height is asserted.
6. The 3.2 m default matches the existing friend/Pune floor-building visualization and can be changed with `URDHVA_OSM_DEFAULT_FLOOR_HEIGHT_M` on the backend.
7. `height_m` is never populated with a visualization estimate when the source did not provide a height. Estimated render height is stored separately in `render_height_m`.

## Nationwide loading

The application does not send one country-sized Overpass query. At neighborhood zoom, only the current map viewport is requested, cached, debounced, and progressively refreshed as the user pans/zooms.

The geographic layer therefore scales by moving the viewport rather than keeping all Indian buildings in the browser at once.

## Data integrity

Real source data is labelled by provenance. Missing height/floor information remains unavailable instead of being silently fabricated.

The existing Pune OSM `SAFETY CHECK: AABB-VS-ROAD-CENTERLINE OVERLAP VERIFICATION` is intentionally preserved in `src/components/PuneOsmMapSelector.jsx`.

## Run

Backend:

```bash
cd backend
python -m uvicorn main:app --reload --port 8000
```

Frontend:

```bash
npm install
npm run dev
```

Open `http://localhost:3000`.
