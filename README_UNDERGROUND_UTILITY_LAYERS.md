# URDHVA Underground & Utility Map Layers

The nationwide geographic map now supports source-mapped underground infrastructure overlays for the focused viewport.

## Map controls

- **3D buildings** — source height/floor extrusion from the existing Overture + OSM pipeline.
- **2D footprints** — source building polygons without extrusion.
- **Water pipeline** — cyan.
- **Sewer** — violet.
- **Gas pipeline** — orange.
- **Electricity cable** — yellow.
- **Telecom cable** — blue.
- **Basements** — pink dashed footprint for buildings where OSM explicitly maps `building:levels:underground`.

## Data behavior

The frontend requests `/api/geo/underground-viewport` only when at least one underground layer is enabled and the map is sufficiently zoomed in. Requests are viewport-limited, debounced and cached.

The backend currently uses OpenStreetMap / Overpass as the public source for these overlays. It reads documented tags such as `man_made=pipeline` with `substance=*`, `power=cable`, and underground location/depth/operator metadata where mapped.

Empty results are displayed as **no mapped source feature returned for this focused viewport**. The prototype never treats an empty public map layer as proof that the physical utility is absent.

Official utility-owner GIS layers can be added later through authenticated/provider-specific adapters without changing the map UI.

## SIH positioning

The geographic utility layer is a context layer. The detailed URDHVA property workflow remains the authoritative place for survey-derived LiDAR/drone/CAD/GPR geometry and Record vs Reality checks. Official parcel ULPIN remains separate from URDHVA vertical property identifiers.


## Troubleshooting utility visibility

1. Start the backend on `http://localhost:8000` and confirm `http://localhost:8000/api/health` returns healthy.
2. Open CITY 3D and enable one utility layer. The map automatically zooms to approximately z14 if needed.
3. Use the `Reload` button in Underground / Utility search after panning.
4. The count beside each layer is the number of source-mapped features returned for the focused viewport.
5. A count of 0 means no mapped source feature was returned there; it does not mean the real-world utility is absent.
6. For SIH demonstrations, use a viewport where OSM actually contains the utility feature; detailed utility-owner GIS data can be added later through authenticated adapters.
