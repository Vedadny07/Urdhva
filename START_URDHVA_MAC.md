# URDHVA SIH26011 — Start on macOS

## Terminal 1 — Backend

```bash
cd ~/Downloads/URDHVA-SIH26011-FINAL-SOURCE-SHAPED-3D/backend
python3 -m venv venv
source venv/bin/activate
python3 -m pip install --upgrade pip
python3 -m pip install -r requirements.txt
python3 -m uvicorn main:app --reload --port 8000
```

Keep this terminal running.

## Terminal 2 — Frontend

```bash
cd ~/Downloads/URDHVA-SIH26011-FINAL-SOURCE-SHAPED-3D
npm install --legacy-peer-deps
npm run dev
```

Open the Vite `Local:` URL, normally:

`http://localhost:3000`

## Quick demo path

## Selected building 3D fidelity
The geographic inspector reconstructs the selected model from the clicked source footprint instead of a generic rectangle. Source floor counts create separate visible floor volumes; loaded building parts are rendered as separate source-shaped components. If vertical data is unavailable, the preview remains footprint-only and is explicitly labelled. A click-triggered OSM detail lookup can enrich missing vertical attributes without slowing normal map navigation.

1. Open URDHVA and complete the existing login/intro flow.
2. Use the existing top search bar.
3. Search `Pune`, `Hadapsar`, or `Baramati`.
4. Select the geographic result to fly the CITY 3D map to the real source location.
5. Zoom until source-backed buildings appear.
6. Click a building; the geographic Information System inspector should appear.
7. Inspect length, breadth, area, height, floors, source and status.
8. For buildings with source floor count, use the selected-building 3D preview to see separate floor bands.
9. Search a 14-digit Maharashtra ULPIN to invoke the official ULPIN adapter.
10. Return to the existing Property 3D scene for detailed URDHVA/LiDAR/drone/floor/unit workflows.

## Data interpretation

- `SOURCE-PROVIDED`: the value exists directly in the source dataset.
- `ESTIMATED`: a visualization value derived from an available source attribute; not a survey measurement.
- `FOOTPRINT ONLY`: no source vertical attribute was available.
- `Official ULPIN`: parcel-level identifier only when resolved by an authoritative Maharashtra source.
- URDHVA floor/unit identifiers are separate from official ULPIN.
