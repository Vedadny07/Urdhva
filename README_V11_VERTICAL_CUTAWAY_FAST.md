# URDHVA V11 — Vertical Cutaway + Fast Utility Preview

This release preserves the existing URDHVA workflow and improves the selected-building and underground visualization.

## Vertical property view
- Ground is a clear `0 m` divider between above-ground and below-ground spaces.
- Above-ground floors are shown as separated volumes.
- Each selected floor is divided into four visible prototype flat volumes.
- The selected floor labels show the unit code, the dummy parcel ULPIN context, and the URDHVA demo vertical identifier.
- Source-mapped underground levels are shown below ground when the building record contains underground-floor information.
- No basement layout is invented when source data is unavailable.

## Underground 3D view
- The selected building is shown relative to the ground divider.
- Ground = `0 m` is explicit.
- Source/known-depth utility lines are below ground at their mapped depth.
- Unknown-depth lines remain dashed and unassigned vertically.
- Mapped basement levels are visible below the ground line when supplied by source data.
- Utility crossing status is retained so a selected line can be seen in relation to the building footprint.

## Faster utility loading
- A clearly labelled demo corridor is rendered immediately from already-loaded source road geometry while the source utility query runs.
- Utility viewport requests are category-targeted instead of requesting every utility class when only one class is enabled.
- Browser-side utility response caching avoids repeating identical viewport requests.
- Backend cache TTL is increased to 5 minutes for repeated exploration.
- Utility viewport requests are debounced more aggressively.
- The wider ~3 km network query is reserved for the explicit button, rather than automatically triggering for every checkbox click.
- When real source geometry is returned, it replaces the demo corridor. If no source geometry is returned, the demo corridor remains clearly labelled as demo.

## Data truth
Demo utility routes and demo depths are presentation-only. They follow real mapped road geometry but are not official utility records and are not measured survey depths. Official/source/survey geometry retains provenance and is never replaced by demo data when real source geometry is available.
