# URDHVA — Underground 3D Network Explorer

This version adds a source-aware underground network interaction to the existing geographic map.

## User flow

1. Turn on Water / Sewer / Gas / Electricity / Telecom.
2. The current viewport loads source-mapped OSM/Overpass features.
3. Click an individual pipeline/cable.
4. Use **Full network** to request an expanded ~3 km network around the selected feature and fit the map to the returned network.
5. Use **Underground 3D** to inspect the loaded network in a 3D cutaway-style explorer.

## 3D depth semantics

- A utility with `depth_m` is rendered below ground using the source-provided depth.
- Utility geometry without a depth is rendered as a dashed plan route near the ground surface and explicitly labelled as depth-unavailable.
- The underground explorer exaggerates vertical depth visually for readability; the UI states this.
- No depth, basement layout, or utility path is fabricated.

## Source semantics

The public geographic utility layer remains OSM/Overpass. Official utility GIS and URDHVA GPR/survey adapters can be added later without changing the UI contract. A blank category means no mapped feature was returned for the queried area; it does not establish physical absence.


## V10 prototype visualization fallback
When OSM/Overpass returns zero mapped utility features for an active category, the map can create a clearly labelled DEMO corridor aligned to source-mapped Overture road geometry. This is a visualization aid for the SIH workflow, not an official utility record. Demo depths are illustrative. Source-mapped features always take precedence.

## V10 selected-building 3D context
The underground 3D explorer focuses on a ~350 m local context around the selected building when a building is selected, while the 2D map can still show the wider utility network. A selected utility feature is always retained. The side view draws the selected building above ground and utility lines below ground, and reports whether the selected route geometry crosses the selected building footprint. Demo routes/depths remain explicitly labelled as prototype-only.
