# URDHVA — Search / Location Fix

The unified top search bar now uses the following location-search flow:

1. Nominatim / OpenStreetMap (primary geocoder)
2. Photon / OpenStreetMap (fallback geocoder)
3. URDHVA validation coordinates for Pune, Hadapsar and Baramati only when public geocoders are unavailable

Selecting a geographic result explicitly enables `geographicMode` and stores `geoLocation` in the shared Zustand store. `Geographic3DMap.jsx` then flies/fits the map to the returned coordinates/bounding box and loads geographic data for the visible viewport.

The validation fallback contains coordinates only. It never fabricates buildings, roads, parcels, heights, floors, units or ULPIN data.

Existing `PuneOsmMapSelector.jsx` safety verification and its AABB-vs-road-centerline check are preserved unchanged.
