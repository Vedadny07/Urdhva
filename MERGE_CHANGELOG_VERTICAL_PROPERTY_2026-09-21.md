# URDHVA — Vertical Property Prototype Add-on

## Added

- Source-shaped selected building continues to drive the 3D vertical preview.
- Floor slider for available source or estimated floor count.
- Four clearly synthetic demo flat partitions per floor.
- Active floor shows flat labels in the 3D scene.
- Floor cards repeat the dummy parcel ULPIN for context and show distinct URDHVA demo vertical identifiers.
- Explicit copy clarifies that dummy ULPIN is not official and that unit partitions are synthetic.
- Source height/floor provenance remains unchanged.
- Existing URDHVA survey/property data is not overwritten.

## Identity rule

Official ULPIN is parcel-level. The prototype uses a dummy parcel ULPIN only for demonstration and uses URDHVA demo vertical identifiers for Floor + Unit. No floor or apartment identifier is represented as an official ULPIN.

## Intended SIH demo flow

Search location -> click real geographic building -> source-shaped 3D building -> floors -> synthetic flat partitions -> dummy parcel ULPIN context -> URDHVA demo vertical IDs -> existing survey/property workflow.

## Limitation

Public OSM/Overture footprints do not provide authoritative apartment/unit ownership layouts. The four-unit-per-floor partition is deliberately a visual prototype layer. Authoritative flat boundaries should later come from approved building plans, survey/LiDAR-derived geometry, or existing URDHVA property data.
