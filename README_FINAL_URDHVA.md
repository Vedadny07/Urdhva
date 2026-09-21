# URDHVA – SIH26011 Final Integrated 3D Geographic + Vertical Property Prototype

This package is an additive update of the existing URDHVA prototype. Existing URDHVA workflows remain separate and available: Data & Survey Officer workflows, parcel handling, LiDAR/PLY processing, CAD/3D extraction, auto-alignment, drone/photogrammetry, floor/unit mapping, underground/GPR, cadastral comparison, Record vs Reality, integrity UI, dashboard, existing building/unit/owner search, detailed Property 3D, and underground visualization.

## Main geographic experience

The existing top search remains the single entry point. It supports both:

- existing property / building / owner / unit / ULPIN-style searches
- Indian location search: city, district, taluka/tehsil, village, locality, suburb, road, landmark, address
- a 14-digit Maharashtra ULPIN lookup entry

A location result switches to **CITY 3D** and moves the map to the geocoded location.

## Nationwide 3D architecture

The main map is a MapLibre GL JS geographic map. It uses **PMTiles** so the browser requests visible vector tiles rather than repeatedly querying large JSON responses.

### Current geographic sources

- **Overture Buildings PMTiles**: national building layer and building-part layer, including optional source attributes such as `height`, `num_floors`, `num_floors_underground`, `min_height`, and `min_floor` where present.
- **Overture Transportation PMTiles**: road network.
- **Overture Base PMTiles**: water layer.
- **OpenStreetMap Nominatim**: location search.
- **OpenStreetMap/Overpass** remains the detailed source workflow where the existing Pune OSM tool is used; the nationwide map no longer depends on Overpass for every viewport movement.

The PMTiles release used by this package is configured in `src/components/Geographic3DMap.jsx` as `2026-08-19.0` and can be changed in one place if a newer compatible release is selected.

## Building behavior

Every building feature loaded into the URDHVA geographic building layer is intended to be selectable. Click handling queries both 3D extrusion and footprint hit layers, including zero-height footprint-only buildings.

The selected geographic building inspector shows:

- source / source ID / provenance
- latitude / longitude
- footprint length
- footprint breadth
- footprint area
- source height when present
- source floor count when present
- underground floor count when present
- building part / parent building information when available
- data status

The inspector includes a compact **selected-building 3D vertical preview**. When a source floor count exists, visible floor bands are rendered. This is a visualization of the source floor count; it does not claim exact slab height or survey-grade floor planes.

## Height and floor data rules

URDHVA uses an explicit hierarchy:

1. `SOURCE-PROVIDED`: source height exists.
2. `SOURCE FLOORS / ESTIMATED HEIGHT`: source floor count exists but source height does not; the geographic extrusion uses a documented visualization estimate, clearly labelled as estimated.
3. `FOOTPRINT ONLY`: neither source height nor source floor count exists; the building remains selectable but is not assigned a fabricated precise height or floor count.

For survey-grade properties, the existing LiDAR/drone/GNSS workflow is the path to measured height and floor segmentation.

## Maharashtra ULPIN integration

The unified search recognizes a 14-digit numeric value as a Maharashtra ULPIN lookup. The backend exposes:

`GET /api/maharashtra/ulpin?ulpin=<14-digit-ulpin>`

The route is a configurable **Mahabhumi API adapter**. It deliberately does not assume or fabricate a private government endpoint.

Configure an authorized endpoint with:

```text
MAHABHUMI_ULPIN_API_URL=
MAHABHUMI_ULPIN_API_METHOD=GET
MAHABHUMI_ULPIN_QUERY_PARAM=ulpin
MAHABHUMI_API_KEY=
```

An example configuration is provided in `backend/.env.example`.

When a configured provider resolves the parcel, URDHVA can display:

- official ULPIN
- district
- taluka / office
- village / city
- plot / survey / CTS number when returned
- parcel coordinates
- parcel geometry
- parcel length / breadth / area when returned

The resolved parcel geometry is highlighted on the geographic map.

When the provider is not configured, the application shows the official Maharashtra lookup, Bhu-Naksha and Mahabhumi API links and explicitly states that no coordinate is guessed.

Official services:

- https://mahavillages.mahabhumi.gov.in/newjurisdiction.php
- https://mahabhunakasha.mahabhumi.gov.in/mobile/www/index.html
- https://api.mahabhumi.gov.in

## ULPIN rule

Official ULPIN remains a **parcel-level identifier**. URDHVA floor and unit identifiers are separate vertical identifiers and must never be labelled as official ULPINs.

Conceptual relationship:

`Parcel → Official ULPIN → Building → Floor → Unit → URDHVA vertical identifier`

## Data honesty

The geographic layer does not fabricate:

- buildings
- roads
- parcels
- owners
- ULPINs
- coordinates
- heights
- floors
- units
- addresses

A public building footprint without vertical attributes can still be clicked and inspected, but its missing height/floor values are shown as unavailable.

## Existing specialized scenes remain separate

### Geographic CITY 3D

Purpose: India-wide geographic exploration.

Technology: MapLibre + real vector tiles.

### URDHVA Property 3D

Purpose: detailed selected-property inspection using the existing Three.js/R3F scene, LiDAR/drone/survey outputs, floors, units and Record vs Reality.

### Underground

Purpose: existing underground/GPR/pipeline visualization.

These are separate visualization layers and are not replaced by the geographic map.

## Run on macOS

Fresh Node modules are intentionally omitted from the ZIP. Install them locally to avoid copied executable permissions/native bindings. For the simplest launch, run the combined script below from the extracted project root.

### One-terminal launch (recommended)
```bash
./START_BOTH_MAC.sh
```
It clears ports 3000/8000 if they are already occupied, starts the backend, installs missing dependencies when necessary, starts the frontend, waits for both health checks, and opens the browser at `http://127.0.0.1:3000`.


### Backend – Terminal 1

```bash
cd ~/Downloads/URDHVA-SIH26011-FINAL-V13-RELEASE/backend
python3 -m venv venv
source venv/bin/activate
python3 -m pip install --upgrade pip
python3 -m pip install -r requirements.txt
python3 -m uvicorn main:app --reload --port 8000
```

### Frontend – Terminal 2

```bash
cd ~/Downloads/URDHVA-SIH26011-FINAL-V13-RELEASE
npm install --legacy-peer-deps
npm run dev
```

Open `http://127.0.0.1:3000` after `START_BOTH_MAC.sh` finishes.

## Source-shaped selected building 3D update
The selected-building inspector now reconstructs the visible preview from the clicked geographic feature's real source footprint geometry rather than a generic rectangle. When source floor count is present, the preview separates floor volumes with visible slabs. When source building parts are available in the loaded vector tiles or the OSM detail lookup, they are rendered as separate source-shaped components. Missing height/floor data remains explicitly unavailable.

## On-demand vertical enrichment
A selected geographic building without source-provided height is optionally enriched from a small, click-triggered OpenStreetMap/Overpass detail query. This is intentionally not used for every pan/zoom, so the scalable nationwide layer remains fast. The enrichment may supply OSM height, building levels, roof attributes, and building parts when the source contains them; otherwise the original source status is retained.


## Important 3D fidelity boundary
The geographic layer is source-shaped: the building footprint, available height/floor attributes, and available building-part geometry are used directly. It is not an invented facade/mesh generator. Exact roof/facade/structural geometry beyond those source attributes requires survey-grade LiDAR, drone photogrammetry, BIM, or another verified 3D building source. The existing URDHVA Property 3D workflow is preserved for that survey-grade stage.

## Final prototype merge additions (September 2026)

This version treats the uploaded ZIP as the canonical URDHVA product and keeps the original property/survey data model intact. The new geographic layer adds, rather than replaces:

- location-independent OSM/Overture 3D building visualization across India;
- the Pune/reference floor-generation pattern generalized to viewport-based nationwide loading;
- a consistent 3.2 m/floor visualization fallback when only source floor count exists;
- source-height-first rendering when an explicit height is available;
- source-shaped selected-building preview without a fake generic box when source geometry is missing;
- an explicit geographic-to-URDHVA Property Workflow handoff carrying source context without overwriting existing property records;
- a Property Passport handoff section that keeps official ULPIN, survey status, Record vs Reality, and vertical identifier as separate verified data fields;
- zoom-level / LOD feedback so the user can see whether the map is showing country/state context, city footprints, neighborhood 3D, or property-level geographic detail;
- building-name labels at high zoom where the source includes a building name.

### Prototype data flow

`Search → geocode → camera/viewport → nationwide vector context → OSM detail at neighborhood zoom → source height / source floors → 3D building → click/inspect → Property Passport handoff → existing URDHVA survey/property workflow`

The handoff never turns a public OSM/Overture building into an official ULPIN, ownership record, or survey result. Missing source data remains visibly unavailable.

## Vertical Property Prototype Add-on (2026-09-21)

The geographic selected-building preview now includes a SIH-facing vertical property prototype. Where source/estimated floor count is available, the selected source footprint is split visually into four synthetic demo units per floor. The active floor is highlighted with flat labels, and the floor/unit list displays a dummy parcel ULPIN as context plus URDHVA demo vertical identifiers. These unit partitions are explicitly synthetic and must be replaced by surveyed/building-plan unit geometry for authoritative property records. Official ULPIN remains parcel-level and is never generated as a floor/unit identifier.


## V13 release hardening

- Utility network focus is now fast-first: a labelled road-aligned demo corridor appears immediately from already loaded road geometry while the source query runs in the background; source geometry replaces it when returned.
- Utility requests have bounded client timeouts so the UI does not appear frozen.
- Selected utility information exposes network count, depth and building-footprint crossing.
- OSM building enrichment now degrades to a structured `unavailable` response rather than an HTTP 500 when the remote source is unreachable.
- `START_BOTH_MAC.sh` starts both services from one Terminal and opens the local frontend after health checks.
- `VITE_API_BASE_URL` supports a separately hosted FastAPI backend; `VITE_BASE_PATH=./` is suitable for GitHub Pages.
