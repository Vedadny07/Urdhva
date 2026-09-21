# URDHVA – Nationwide Pune-Style OSM 3D Layer

This update makes the nationwide geographic map use the same interaction pattern as the existing Pune OSM workflow, while keeping the existing URDHVA modules intact.

## What changed

- Overture PMTiles remains the fast nationwide geographic base layer.
- At city/neighborhood zoom, URDHVA loads real OpenStreetMap building geometry and vertical tags for the visible viewport using a single cached/debounced detail request.
- OSM detail buildings are rendered as 3D source-footprint extrusions and are clickable.
- Building selection uses the same geographic information panel for both the Overture base layer and OSM detail layer.
- Real footprint dimensions (length/breadth/area) are calculated from the source polygon.
- OSM `height=*` is used directly when present.
- OSM `building:levels=*` / `building:levels:aboveground=*` is shown as source floor count; a clearly labelled visualization extrusion may use the OSM documented average-level convention when metric height is absent.
- Building parts can be loaded and displayed when supplied by OSM detail data.
- Source provenance, source ID, height status and floor status are displayed instead of silently inventing values.
- Footprint-only features have only a tiny visual base thickness; URDHVA still reports height/floors as unavailable. The visual base thickness is not a claimed building measurement.
- The selected-building 3D preview separates individual floor bands when a source floor count exists.
- The existing Maharashtra ULPIN parcel overlay remains authoritative-only and separate from OSM building geometry.
- The geographic map does not use a fixed 800 m survey boundary.
- The information panel now has a stable, visible scrollbar.

## Data hierarchy

1. Survey-derived LiDAR / drone / GNSS measurements for URDHVA survey properties.
2. Official cadastral/ULPIN geometry where an authoritative provider is connected.
3. OSM source height/floors/parts for detailed geographic context.
4. Overture Buildings for fast nationwide building coverage and broader attributes.
5. Footprint-only visualization when no vertical source exists; no false exact height is reported.

## Why this is faster than the old Overpass-only approach

Overpass is used only for detailed city/neighborhood building enrichment. The national map is served by vector tiles, so panning at low/mid zoom does not repeatedly request every road/building from Overpass.

## Source notes

OpenStreetMap documents `height`, `building:levels`, `min_height`, `building:min_level`, and `building:part` for 3D building representation. Metric height is preferred where known. Overture's Buildings theme provides `height`, `num_floors`, `min_height`, `min_floor`, and `building_part` fields where available.

For broader estimated-height research, datasets such as 3D-GloBFP and OpenBuildingMap exist, but those are not bundled into this prototype because they are large external datasets and contain estimated/modelled heights rather than survey-grade measurements.

## Nationwide OSM floor-by-floor rendering

The nationwide geographic map keeps the existing Overture PMTiles layer for broad coverage and adds a source-backed OSM/Overpass detail layer as the map reaches city/neighborhood zoom. The OSM detail features are expanded into one 3D volume per available/derived floor using the same footprint-to-floor concept demonstrated by the Pune OSM selector.

Vertical provenance is preserved:
- OSM `building:levels` → source floor count.
- OSM `height` → source height; floor count may be derived for visualization and is labelled estimated.
- OSM footprint only → footprint-only visualization; no invented building height.

The detailed OSM loader is viewport-driven and cached so panning across India progressively loads only the currently visible area.
