# Utility Visibility Fix — 2026-09-21

- Utility layer selection now auto-zooms the geographic map to about z14 when the current zoom is too low for underground line rendering.
- Added a manual Reload control for source-mapped utility viewport data.
- Relaxed the frontend utility loading threshold from z12 to z11 while retaining line-layer minzoom 11.5.
- Expanded Overpass utility query coverage with `pipeline=*` in addition to `man_made=pipeline`, and added classifier support for common `pipeline=gas|water|sewage` style tags.
- Kept source provenance rules unchanged: no synthetic utility geometry is presented as real geographic data.
