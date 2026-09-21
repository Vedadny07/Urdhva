# URDHVA — Data & Survey Officer: Clean-Slate Survey Workflow & Command Center

The **Data & Survey Officer** role has been redesigned from the ground up to provide a clean-slate 3D cadastral survey workflow with all requested features.

---

## 🌟 Key Architecture & Workflow

### 1. 3D Map Starts Completely Empty on Login
- When logging in as **Data & Survey Officer** (`datasurvey`), the 3D map is **completely empty** — no pre-existing mock city buildings, infrastructure, or waypoints cluttering the scene.
- For **Citizen**, **Corporator**, and **Builder** logins, the full 3D city (all 16+ buildings, infrastructure, underground features, and route waypoints) remains **100% intact and untouched**.
- The surveyor begins with a fresh greenfield plot.

---

## 🛠️ The 8 Specialized Command Center Sections

### 1. 📐 2D Land Property Boundary Delineation (`landBoundary`)
- **File Upload**: Accepts GeoJSON, KML, CSV (X, Z pairs), JSON, and Land Title PDFs.
- **1-Click Preset**: **`⚡ Load Prime Boundary (Plot #402 — 660 m²)`** for instant demonstration.
- **Dynamic 3D Boundary Rendering**:
  - High-contrast glowing cadastral boundary line.
  - Corner vertex survey pins (pulsing posts at each corner).
  - Dimension tags along each boundary edge (e.g. `30.0m`, `22.0m`).
  - Center title plate showing Parcel Name, Area (`660 m²`), and Status.
  - Coordinate table listing all parcel corner vertices in meters.

### 2. 🎯 LiDAR 3D Survey & CAD Extraction (`lidarScan`)
- **Full LiDAR Scanner Engine**:
  - 8-stage CAD extraction pipeline: Reading XYZ Points, Noise Filtering, Ground Separation, Building Extraction, Surface Detection, 3D Geometry, Topology Validation, Model Ready.
  - Real point cloud upload (`.las`, `.laz`, `.ply`, `.xyz`).
  - 1-Click Ground Truth benchmark scan (`urdhva_sample_lidar_building.ply` — 313,283 points).
  - Live 3D CAD canvas preview with point density metrics.
- **Auto-Alignment & Parcel Placement**:
  - **`🎯 Auto-Align & Place 3D Building in Parcel`**: Automatically maps the reconstructed building footprint to the centroid of the 2D parcel.
  - Prominent banner: **`Auto Alignment Complete ✓`**.
  - Interactive X/Z fine-tune adjustment sliders.

### 3. 🚁 Drone Video AI Photogrammetry (`droneScan`)
- **Full Drone AI Photogrammetry Engine**:
  - Video upload (`.mp4`, `.mov`) + sample flight video.
  - Real OpenCV keyframe analysis, horizontal Sobel line detection, spandrel wall suppression, autocorrelation floor pitch estimation, contour shape classification, consensus floor count.
  - Annotated keyframe viewer.
  - Generates 3D building model and auto-places it directly inside the 2D parcel on the 3D map.

### 4. 👥 Floor Occupants & 3D ULPIN Generator (`occupants`)
- **Bulk Resident / Tenant Registry**:
  - Upload CSV/Excel tenant file or click **`⚡ Load 128 Tenant Registry (CSV Demo)`**.
  - Selects the 3D cadastral building on the map.
  - Automatically matches and assigns each resident to their respective floor (`F01`, `F02`, `F03`...).
  - Partitions floors into distinct 3D unit volumes using vibrant family color palettes (`FAMILY_COLORS`).
  - Automatically generates URDHVA vertical property identifiers (e.g. `UP80010402-F01-U101`, `UP80010402-F02-U201`...).
  - Triggers the **Exploded 3D Floors View** so every floor separates in 3D space with floating occupant tags.
  - **Exact Requirement Statistics**:
    - **128 records imported**
    - **116 matched** (Green ✓)
    - **8 need verification** (Yellow ⚠)
    - **4 unmatched** (Red ✗)
  - Searchable drill-down tables for Matched, Needs Verification, and Unmatched tenant records with violation descriptions.

### 5. 🚇 Sub-Surface Utilities, GPR & Pipelines (`underground`)
- **Interactive Subterranean Pipeline Plotter**:
  - Gas, Water Main, Sewer, Power Grid, Telecom Fiber, Metro Tunnel.
  - Subterranean depth slider (-2m to -25m).
  - Interactive ground clicking on 3D map to place waypoints + 1-click quick pipeline preset.
  - Undo point, clear all, deploy pipeline.
- **Subterranean Assets Registration**:
  - Historical wells, septic tanks, water reservoirs, bunkers, gas vaults, fiber chambers with depth and status.
- **Ground Penetrating Radar (GPR Scanner)**:
  - Full GPR scanner to scan subsurface for unauthorized basements, cavities, and utility clashes.
- **Subterranean Camera View**:
  - 1-click camera mode toggle to inspect underground features below the ground plane.

### 6. ⚖️ Cadastral Data Comparison Engine (`comparison`)
- Cross-examines sanctioned 2D master plan titles against ground-truth 3D LiDAR & Drone surveys:
  - 🟢 **GREEN ✓ Data matched**
  - 🔴 **RED ⚠ Floor Mismatch**: 8 floors detected by LiDAR vs 5 sanctioned in master plan (+3 unauthorized floors flagged).
  - 🔴 **RED ⚠ Boundary Mismatch**: Building footprint (440 m²) exceeds 2D parcel boundary (360 m²) by 22.2% (setback violation).
  - 🔴 **RED ⚠ Building Position Mismatch**: Centroid shifted 2.4m south-east toward public road easement.
  - 🔴 **RED ⚠ Sub-Surface Utility Clash**: Basement depth (-6m) clashes with municipal gas buffer (-4.5m).

### 7. 🔐 Tamper-Evident Blockchain Verification (`blockchain`)
- Mints immutable cryptographic SHA-256 proof hashes of the complete property survey package.
- Displays:
  - **`🔗 BLOCKCHAIN VERIFIED`** certificate badge.
  - SHA-256 digest with 1-click copy.
  - Block height (`#1,492,804`), Surveyor ID (`OFFICER-DS-7821`), and timestamp.

### 8. 🏙️ Mayor / City-Wide Survey Dashboard (`cityOverview`)
- High-level municipal executive overview:
  - **Buildings Surveyed: 1,240** (Blue)
  - **Verified & Compliant: 1,102** (88.8% Green ✓)
  - **Pending Verification: 98** (Yellow ⚠)
  - **Issues Detected: 40** (Red ✗)
- Progress bar and categorized municipal audit alerts:
  - 🔴 18 Illegal / Extra floors detected
  - 🔴 12 Property data mismatches
  - 🔴 6 Boundary encroachments
  - 🔴 4 Underground infrastructure conflicts
  - 🟡 98 Incomplete records awaiting field audit.

---

## 🚀 Live Access
- **Frontend App**: [http://localhost:3000/](http://localhost:3000/)
- **Backend API**: [http://127.0.0.1:8000/](http://127.0.0.1:8000/)
