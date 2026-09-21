# URDHVA V11 — clearer vertical property + faster utility loading

V11 preserves the existing URDHVA system and adds two focused improvements.

## 1. Clear vertical property scene
- Ground is an explicit 0 m divider.
- Above-ground floors are separated into visible floor slabs.
- Each floor uses four clearly visible prototype flat volumes in a 2×2 arrangement.
- Selecting a floor shows U-unit labels, the dummy parcel ULPIN context, and the URDHVA demo vertical identifier.
- Source-mapped underground levels are shown below ground when `levels_underground` is available.
- Underground levels are never invented when the source does not provide them.

## 2. Faster underground utility UX
- Toggling a utility immediately shows a clearly labelled road-aligned demo preview from currently loaded real road geometry.
- A targeted Overpass query requests only the active utility categories.
- Viewport utility results are cached in the frontend and backend for repeated exploration.
- The request is debounced more aggressively so rapid pan/zoom does not queue long calls.
- Source-mapped features replace the preview when available; if the source returns zero features, the demo preview remains visible and is explicitly labelled.
- The 3 km expanded-network request is reserved for the explicit “Show network (~3 km)” action.

## Data integrity
Demo corridors and demo depths are presentation-only. They are never described as official utility records or measured survey depths. Source-mapped utility geometry retains source/provenance metadata.
