import React, { useState, useEffect, useRef } from 'react';
import useStore from '../store';
import { useTranslation } from '../utils/i18n';
import LidarScanner from './LidarScanner';
import DroneUpload from './DroneUpload';
import GPRScanner from './GPRScanner';
import PuneOsmMapSelector from './PuneOsmMapSelector';
import {
  Upload,
  Crosshair,
  Globe,
  Link as LinkIcon,
  GitCompare,
  Shield,
  BarChart3,
  FileSpreadsheet,
  MapPin,
  Check,
  AlertTriangle,
  X,
  ChevronDown,
  ChevronUp,
  Eye,
  EyeOff,
  Move,
  Minimize2,
  Maximize2,
  RefreshCw,
  Building2,
  Users,
  Hash,
  GripHorizontal,
  RotateCcw,
  Minus,
  Info,
  Layers,
  Plane,
  Scan,
  Route,
  Trash2,
  Flame,
  ArrowDown,
  FolderUp,
  Sparkles,
  Plus,
  Search,
  FileText,
  Sliders,
  CheckCircle2,
  MousePointerClick,
  Send
} from 'lucide-react';
import { FAMILY_COLORS } from '../utils/familyColors';

// ─── 12-PLOT USER CADASTRAL MASTERPLAN ───────────────────────────────────────
// ─── 12-PLOT & 4-PLOT USER CADASTRAL MASTERPLANS ────────────────────────────
const USER_TWELVE_PLOTS = [
  // ── ROW 1: NORTH ZONE (UPPER HALF OF MAP, Z: -18 to -10) ──
  {
    name: "Royal Heights",
    corners: [{ x: -22.0, z: -18.0 }, { x: -14.0, z: -18.0 }, { x: -14.0, z: -10.0 }, { x: -22.0, z: -10.0 }],
    properties: { area: 64, floors: 6, plotNumber: 'Cadastral #101' }
  },
  {
    name: "Green Valley",
    corners: [{ x: -10.0, z: -18.0 }, { x: -2.0, z: -18.0 }, { x: -2.0, z: -10.0 }, { x: -10.0, z: -10.0 }],
    properties: { area: 64, floors: 5, plotNumber: 'Cadastral #102' }
  },
  {
    name: "Shivneri Plaza",
    corners: [{ x: 2.0, z: -18.0 }, { x: 10.0, z: -18.0 }, { x: 10.0, z: -10.0 }, { x: 2.0, z: -10.0 }],
    properties: { area: 64, floors: 7, plotNumber: 'Cadastral #103' }
  },
  {
    name: "Silver Oak",
    corners: [{ x: 14.0, z: -18.0 }, { x: 22.0, z: -18.0 }, { x: 22.0, z: -10.0 }, { x: 14.0, z: -10.0 }],
    properties: { area: 64, floors: 5, plotNumber: 'Cadastral #104' }
  },

  // ── ROW 2: CENTRAL ZONE (MIDLINE OF MAP, Z: -4 to +4) ──
  {
    name: "Skyview Residency",
    corners: [{ x: -22.0, z: -4.0 }, { x: -14.0, z: -4.0 }, { x: -14.0, z: 4.0 }, { x: -22.0, z: 4.0 }],
    properties: { area: 64, floors: 8, plotNumber: 'Cadastral #105' }
  },
  {
    name: "Sunrise Towers",
    corners: [{ x: -10.0, z: -4.0 }, { x: -2.0, z: -4.0 }, { x: -2.0, z: 4.0 }, { x: -10.0, z: 4.0 }],
    properties: { area: 64, floors: 9, plotNumber: 'Cadastral #106' }
  },
  {
    name: "Emerald Heights",
    corners: [{ x: 2.0, z: -4.0 }, { x: 10.0, z: -4.0 }, { x: 10.0, z: 4.0 }, { x: 2.0, z: 4.0 }],
    properties: { area: 64, floors: 6, plotNumber: 'Cadastral #107' }
  },
  {
    name: "Palm Residency",
    corners: [{ x: 14.0, z: -4.0 }, { x: 22.0, z: -4.0 }, { x: 22.0, z: 4.0 }, { x: 14.0, z: 4.0 }],
    properties: { area: 64, floors: 6, plotNumber: 'Cadastral #108' }
  },

  // ── ROW 3: SOUTH ZONE (LOWER HALF OF MAP, Z: +10 to +18) ──
  {
    name: "Lotus Enclave",
    corners: [{ x: -22.0, z: 10.0 }, { x: -14.0, z: 10.0 }, { x: -14.0, z: 18.0 }, { x: -22.0, z: 18.0 }],
    properties: { area: 64, floors: 5, plotNumber: 'Cadastral #109' }
  },
  {
    name: "Maple Residency",
    corners: [{ x: -10.0, z: 10.0 }, { x: -2.0, z: 10.0 }, { x: -2.0, z: 18.0 }, { x: -10.0, z: 18.0 }],
    properties: { area: 64, floors: 7, plotNumber: 'Cadastral #110' }
  },
  {
    name: "Blue Horizon",
    corners: [{ x: 2.0, z: 10.0 }, { x: 10.0, z: 10.0 }, { x: 10.0, z: 18.0 }, { x: 2.0, z: 18.0 }],
    properties: { area: 64, floors: 8, plotNumber: 'Cadastral #111' }
  },
  {
    name: "Grand Orchid",
    corners: [{ x: 14.0, z: 10.0 }, { x: 22.0, z: 10.0 }, { x: 22.0, z: 18.0 }, { x: 14.0, z: 18.0 }],
    properties: { area: 64, floors: 8, plotNumber: 'Cadastral #112' }
  }
];

const USER_FOUR_PLOTS = [
  {
    name: "Royal Heights (North-West)",
    corners: [{ x: -20.0, z: -16.0 }, { x: -4.0, z: -16.0 }, { x: -4.0, z: -2.0 }, { x: -20.0, z: -2.0 }],
    properties: { area: 224, floors: 6, plotNumber: 'Cadastral #101' }
  },
  {
    name: "Green Valley (North-East)",
    corners: [{ x: 4.0, z: -16.0 }, { x: 20.0, z: -16.0 }, { x: 20.0, z: -2.0 }, { x: 4.0, z: -2.0 }],
    properties: { area: 224, floors: 5, plotNumber: 'Cadastral #102' }
  },
  {
    name: "Shivneri Plaza (South-West)",
    corners: [{ x: -20.0, z: 2.0 }, { x: -4.0, z: 2.0 }, { x: -4.0, z: 16.0 }, { x: -20.0, z: 16.0 }],
    properties: { area: 224, floors: 7, plotNumber: 'Cadastral #103' }
  },
  {
    name: "Silver Oak (South-East)",
    corners: [{ x: 4.0, z: 2.0 }, { x: 20.0, z: 2.0 }, { x: 20.0, z: 16.0 }, { x: 4.0, z: 16.0 }],
    properties: { area: 224, floors: 5, plotNumber: 'Cadastral #104' }
  }
];

// Helper to extract polygon corner points from diverse formats
function extractCornersFromGeometry(geom) {
  if (!geom) return [];
  if (Array.isArray(geom)) {
    // Nested MultiPolygon or Polygon ring
    if (geom.length > 0 && Array.isArray(geom[0])) {
      if (Array.isArray(geom[0][0])) {
        return geom[0].map(c => ({ x: Number(c[0]), z: Number(c[1]) }));
      }
      return geom.map(c => {
        if (Array.isArray(c)) return { x: Number(c[0]), z: Number(c[1]) };
        return {
          x: Number(c.x ?? c.lng ?? c.lon ?? c.longitude ?? 0),
          z: Number(c.z ?? c.y ?? c.lat ?? c.latitude ?? 0)
        };
      });
    }
    return geom.map(c => ({
      x: Number(c.x ?? c[0] ?? 0),
      z: Number(c.z ?? c.y ?? c[1] ?? 0)
    }));
  }
  if (geom.coordinates) return extractCornersFromGeometry(geom.coordinates);
  return [];
}

// Auto-normalize GPS lat/long or UTM coordinates to local 3D meter space
function normalizeCoordinatesIfGPS(plots) {
  if (!plots || plots.length === 0) return plots;
  const allCorners = plots.flatMap(p => p.corners || []);
  if (allCorners.length === 0) return plots;

  const minX = Math.min(...allCorners.map(c => c.x));
  const maxX = Math.max(...allCorners.map(c => c.x));
  const minZ = Math.min(...allCorners.map(c => c.z));
  const maxZ = Math.max(...allCorners.map(c => c.z));
  const spanX = maxX - minX;
  const spanZ = maxZ - minZ;

  // GPS Degrees (e.g. Pune/Mumbai coordinates ~73.85, 18.52)
  if (minX > 10 && minZ > 10 && spanX < 0.2 && spanZ < 0.2) {
    const midX = (minX + maxX) / 2;
    const midZ = (minZ + maxZ) / 2;
    const meterScaleX = 111320 * Math.cos(midZ * Math.PI / 180);
    const meterScaleZ = 110540;

    return plots.map(p => ({
      ...p,
      corners: p.corners.map(c => ({
        x: Number(((c.x - midX) * meterScaleX).toFixed(1)),
        z: Number(((c.z - midZ) * meterScaleZ).toFixed(1))
      }))
    }));
  }

  // Large UTM Coordinates (e.g. > 1000m)
  if (minX > 500 || minZ > 500) {
    const midX = (minX + maxX) / 2;
    const midZ = (minZ + maxZ) / 2;
    return plots.map(p => ({
      ...p,
      corners: p.corners.map(c => ({
        x: Number((c.x - midX).toFixed(1)),
        z: Number((c.z - midZ).toFixed(1))
      }))
    }));
  }

  return plots;
}

// Universal Multi-Plot Parser: JSON, GeoJSON, CSV, and Text Deeds
function parseMultiPlotData(rawText, filename = '') {
  const text = rawText.trim();
  let parsed = [];

  // 1. Try parsing JSON / GeoJSON
  if (text.startsWith('{') || text.startsWith('[')) {
    try {
      const data = JSON.parse(text);
      // Case A: Array of plots
      if (Array.isArray(data)) {
        data.forEach((item, i) => {
          const name = item.name || item.title || item.plotName || item.buildingName || item.properties?.name || item.properties?.title || `Plot #${i + 1}`;
          const rawCorners = item.corners || item.polygon || item.coords || item.coordinates || item.points || item.vertices || item.geometry?.coordinates?.[0] || [];
          const corners = extractCornersFromGeometry(rawCorners);
          if (corners.length >= 3) {
            parsed.push({
              name,
              corners,
              properties: { floors: item.properties?.floors || item.floors || 6, ...item.properties }
            });
          }
        });
      }
      // Case B: GeoJSON FeatureCollection
      else if (data.features && Array.isArray(data.features)) {
        data.features.forEach((feat, i) => {
          const name = feat.properties?.name || feat.properties?.title || feat.properties?.plot_no || `Cadastral Plot #${i + 1}`;
          const rawCoords = feat.geometry?.coordinates?.[0] || feat.geometry?.coordinates || [];
          const corners = extractCornersFromGeometry(rawCoords);
          if (corners.length >= 3) {
            parsed.push({
              name,
              corners,
              properties: { floors: feat.properties?.floors || 6, ...feat.properties }
            });
          }
        });
      }
      // Case C: Object containing list (plots, parcels, properties, buildings, items, data, records)
      else {
        const listKey = Object.keys(data).find(k => Array.isArray(data[k]) && data[k].length > 0);
        if (listKey) {
          data[listKey].forEach((item, i) => {
            const name = item.name || item.title || item.plotName || item.buildingName || item.properties?.name || `Plot #${i + 1}`;
            const rawCorners = item.corners || item.polygon || item.coords || item.coordinates || item.points || item.geometry?.coordinates?.[0] || [];
            const corners = extractCornersFromGeometry(rawCorners);
            if (corners.length >= 3) {
              parsed.push({
                name,
                corners,
                properties: { floors: item.properties?.floors || item.floors || 6, ...item.properties }
              });
            }
          });
        } else {
          // Case D: Key-value map of plots { "Plot 1": { corners: ... }, "Plot 2": { ... } }
          Object.entries(data).forEach(([key, val]) => {
            if (val && typeof val === 'object') {
              const rawCorners = val.corners || val.polygon || val.points || (Array.isArray(val) ? val : []);
              const corners = extractCornersFromGeometry(rawCorners);
              if (corners.length >= 3) {
                parsed.push({
                  name: val.name || key,
                  corners,
                  properties: { floors: val.floors || 6, ...val.properties }
                });
              }
            }
          });
        }
      }

      if (parsed.length > 0) return normalizeCoordinatesIfGPS(parsed);
    } catch (e) {
      // Continue to text/CSV parsing
    }
  }

  // 2. Parse text with labeled plots (Building Name:, Plot Name:, Plot #, Parcel:, etc.)
  const plotDelimiterRegex = /(?:^|\n)\s*(?:Building Name|Plot Name|Plot|Parcel|Property|Site)\s*(?:#|\d+)?\s*:\s*/i;
  if (plotDelimiterRegex.test(text)) {
    const rawBlocks = text.split(/(?:^|\n)\s*(?:Building Name|Plot Name|Plot|Parcel|Property|Site)\s*(?:#|\d+)?\s*:\s*/i).filter(b => b.trim().length > 0);
    rawBlocks.forEach((block, idx) => {
      const lines = block.split('\n').map(l => l.trim()).filter(Boolean);
      const name = lines[0] || `Cadastral Plot #${idx + 1}`;
      const corners = [];

      lines.slice(1).forEach(l => {
        const m = l.match(/X:\s*([0-9.-]+)\s*m?,\s*[ZY]:\s*([0-9.-]+)\s*m?/i) ||
          l.match(/([0-9.-]+)\s*,\s*([0-9.-]+)/);
        if (m) {
          const x = parseFloat(m[1]);
          const z = parseFloat(m[2]);
          if (!isNaN(x) && !isNaN(z)) corners.push({ x, z });
        }
      });

      if (corners.length >= 3) {
        parsed.push({ name, corners, properties: { floors: 6 } });
      }
    });

    if (parsed.length > 0) return normalizeCoordinatesIfGPS(parsed);
  }

  // 3. Multi-Plot CSV Parsing
  const lines = text.split('\n').map(l => l.trim()).filter(Boolean);
  if (lines.length > 0) {
    const headerParts = lines[0].toLowerCase().split(/[,\t]/).map(s => s.trim());
    const nameColIdx = headerParts.findIndex(h => h.includes('name') || h.includes('plot') || h.includes('parcel') || h.includes('building'));
    const xColIdx = headerParts.findIndex(h => h === 'x' || h.includes('corner_x') || h.includes('lng') || h.includes('lon'));
    const zColIdx = headerParts.findIndex(h => h === 'z' || h === 'y' || h.includes('corner_z') || h.includes('corner_y') || h.includes('lat'));

    if (nameColIdx >= 0 && xColIdx >= 0 && zColIdx >= 0 && lines.length > 1) {
      const groups = {};
      for (let i = 1; i < lines.length; i++) {
        const parts = lines[i].split(/[,\t]/).map(s => s.trim());
        const pName = parts[nameColIdx] || 'Cadastral Plot';
        const x = parseFloat(parts[xColIdx]);
        const z = parseFloat(parts[zColIdx]);
        if (!isNaN(x) && !isNaN(z)) {
          if (!groups[pName]) groups[pName] = [];
          groups[pName].push({ x, z });
        }
      }
      Object.entries(groups).forEach(([name, corners]) => {
        if (corners.length >= 3) {
          parsed.push({ name, corners, properties: { floors: 6 } });
        }
      });
      if (parsed.length > 0) return normalizeCoordinatesIfGPS(parsed);
    }

    // 4. Blank-line separated blocks of coordinates
    const blankBlocks = text.split(/\n\s*\n/).filter(b => b.trim().length > 0);
    if (blankBlocks.length > 1) {
      blankBlocks.forEach((block, idx) => {
        const blLines = block.split('\n').map(l => l.trim()).filter(Boolean);
        const pts = [];
        let blockName = `Plot #${idx + 1}`;
        blLines.forEach(l => {
          if (l.match(/[a-zA-Z]/) && !l.includes('X:') && !l.includes('Z:')) {
            blockName = l.replace(/[#:]/g, '').trim();
          } else {
            const m = l.match(/X:\s*([0-9.-]+)\s*m?,\s*[ZY]:\s*([0-9.-]+)\s*m?/i) ||
              l.match(/([0-9.-]+)\s*,\s*([0-9.-]+)/);
            if (m) {
              const x = parseFloat(m[1]);
              const z = parseFloat(m[2]);
              if (!isNaN(x) && !isNaN(z)) pts.push({ x, z });
            }
          }
        });
        if (pts.length >= 3) {
          parsed.push({ name: blockName, corners: pts, properties: { floors: 6 } });
        }
      });
      if (parsed.length > 0) return normalizeCoordinatesIfGPS(parsed);
    }

    // 5. Fallback: Group every 4 rows if exactly 4-plot or multi-plot CSV without headers
    const rawPts = [];
    lines.forEach(l => {
      const parts = l.split(/[,\t]/);
      if (parts.length >= 2) {
        const x = parseFloat(parts[0]);
        const z = parseFloat(parts[1]);
        if (!isNaN(x) && !isNaN(z)) rawPts.push({ x, z });
      }
    });
    if (rawPts.length >= 4) {
      if (rawPts.length % 4 === 0 && rawPts.length > 4) {
        for (let i = 0; i < rawPts.length; i += 4) {
          parsed.push({
            name: `Plot #${(i / 4) + 1}`,
            corners: rawPts.slice(i, i + 4),
            properties: { floors: 6 }
          });
        }
      } else {
        parsed.push({
          name: filename ? filename.replace(/\.[^/.]+$/, '') : 'Survey Boundary',
          corners: rawPts,
          properties: { floors: 6 }
        });
      }
    }
  }

  return normalizeCoordinatesIfGPS(parsed);
}

// ─── TAB 1: 2D LAND PROPERTY BOUNDARY DELINEATION ────────────────────────────
const LandBoundaryForm = () => {
  const { t } = useTranslation();
  const {
    importedParcels,
    delineateBoundary,
    delineateParcels,
    clearImportedData,
    selectedParcel,
    setSelectedParcel,
    focusCameraOn,
    autoPlaceBuildingInParcel,
    populateAllParcelsWithBuildings
  } = useStore();

  const [isDragging, setIsDragging] = useState(false);
  const [isParsing, setIsParsing] = useState(false);
  const fileInputRef = useRef(null);

  const activeParcel = importedParcels?.find(p => p.id === selectedParcel) || importedParcels?.[0];

  const handleDragOver = (e) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'copy';
    setIsDragging(true);
  };
  const handleDragLeave = (e) => {
    e.preventDefault();
    setIsDragging(false);
  };

  const processFile = async (file) => {
    if (!file) return;
    setIsParsing(true);
    try {
      const text = await file.text();
      const parsedPlots = parseMultiPlotData(text, file.name);

      if (parsedPlots && parsedPlots.length > 0) {
        delineateParcels(parsedPlots);
      } else {
        // Fallback single parcel
        delineateBoundary(null, `Survey Plot — ${file.name}`, { area: 660, plotNumber: 'Plot #402' });
      }
    } catch (err) {
      console.error('Error parsing boundary file:', err);
      delineateBoundary(null, `Survey Plot — ${file.name}`, { area: 660, plotNumber: 'Plot #402' });
    } finally {
      setIsParsing(false);
    }
  };

  const handleDrop = async (e) => {
    e.preventDefault();
    setIsDragging(false);
    if (e.dataTransfer.files?.[0]) {
      await processFile(e.dataTransfer.files[0]);
    }
  };

  const handleFileChange = async (e) => {
    if (e.target.files?.[0]) {
      await processFile(e.target.files[0]);
      e.target.value = '';
    }
  };

  const handleLoadFourPlotSample = () => {
    delineateParcels(USER_FOUR_PLOTS);
  };

  const handleLoadTwelvePlotMasterplan = () => {
    delineateParcels(USER_TWELVE_PLOTS);
  };

  return (
    <div className="space-y-3.5">
      <div className="border-b border-slate-700/60 pb-2">
        <h3 className="text-sm font-bold text-slate-100 flex items-center gap-2">
          <MapPin className="w-4 h-4 text-emerald-400" />
          <span>{t('datasurvey.headers.landBoundary')}</span>
        </h3>
        <p className="text-[11px] text-slate-400 mt-0.5 leading-relaxed">
          Upload 2D boundary files (.json, .geojson, .csv) or load masterplans. All plots map simultaneously onto the 3D ground.
        </p>
      </div>

      {/* Upload Dropzone */}
      <div
        onClick={() => fileInputRef.current?.click()}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        className={`relative cursor-pointer border-2 border-dashed rounded-xl p-4 text-center transition-all select-none ${isDragging
          ? 'border-emerald-400 bg-emerald-950/40 scale-[1.01]'
          : 'border-slate-600 bg-slate-950/60 hover:border-emerald-500/70 hover:bg-slate-900/60 shadow-inner'
          }`}
      >
        <input
          ref={fileInputRef}
          type="file"
          onChange={handleFileChange}
          className="hidden"
          accept=".geojson,.kml,.csv,.json,.txt,.pdf"
        />
        <div className="w-9 h-9 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 flex items-center justify-center mx-auto mb-1.5 pointer-events-none">
          <FolderUp className="w-4 h-4" />
        </div>
        <p className="text-xs text-slate-200 font-semibold mb-0.5 pointer-events-none">
          Click to browse or drop multi-property boundary file
        </p>
        <p className="text-[10px] text-slate-400 pointer-events-none">
          Supports multi-plot JSON, GeoJSON FeatureCollection, CSV, or Deed text
        </p>
        <div className="flex justify-center gap-1.5 mt-2 pointer-events-none">
          {['.geojson', '.json', '.csv', '.txt'].map(ext => (
            <span key={ext} className="text-[9px] font-mono bg-slate-900 border border-slate-700 text-emerald-300 px-1.5 py-0.5 rounded">
              {ext}
            </span>
          ))}
        </div>
        {isParsing && (
          <div className="mt-2.5 flex items-center justify-center gap-2 text-emerald-400 text-xs font-bold animate-pulse">
            <RefreshCw className="w-3.5 h-3.5 animate-spin" /> Delineating multi-parcel cadastral layout on 3D map...
          </div>
        )}
      </div>

      {/* Action Buttons: Browse, 4-Plot, 12-Plot */}
      <div className="grid grid-cols-3 gap-1.5">
        <button
          type="button"
          onClick={() => fileInputRef.current?.click()}
          className="bg-slate-800 hover:bg-slate-700 text-slate-200 font-bold py-2 px-2 rounded-lg text-xs transition-colors border border-slate-700 flex items-center justify-center gap-1"
        >
          <Upload className="w-3.5 h-3.5 text-emerald-400" /> Browse File
        </button>
        <button
          type="button"
          onClick={handleLoadFourPlotSample}
          className="bg-slate-800 hover:bg-emerald-950 text-emerald-300 font-bold py-2 px-2 rounded-lg text-xs transition-colors border border-emerald-500/40 flex items-center justify-center gap-1 cursor-pointer"
        >
          <MapPin className="w-3.5 h-3.5 text-emerald-400" />
          <span>⚡ 4-Plot File</span>
        </button>
        <button
          type="button"
          onClick={handleLoadTwelvePlotMasterplan}
          className="bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white font-bold py-2 px-2 rounded-lg text-xs transition-all shadow-[0_0_15px_rgba(16,185,129,0.35)] flex items-center justify-center gap-1 cursor-pointer"
        >
          <Sparkles className="w-3.5 h-3.5 text-amber-300" />
          <span>⚡ 12-Plot Plan</span>
        </button>
      </div>

      {/* Multi-Parcel Roster List */}
      {importedParcels && importedParcels.length > 0 && (
        <div className="p-3 rounded-xl bg-slate-950/80 border border-slate-800 space-y-2.5 shadow-lg">
          <div className="flex items-center justify-between border-b border-slate-800 pb-1.5">
            <div className="flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-full bg-emerald-400" />
              <span className="text-xs font-bold text-slate-100">
                Delineated Parcels ({importedParcels.length} Active Plots)
              </span>
            </div>
            <div className="flex items-center gap-1.5">
              <button
                type="button"
                onClick={populateAllParcelsWithBuildings}
                className="text-[10px] bg-emerald-600 hover:bg-emerald-500 text-white font-bold px-2 py-0.5 rounded shadow flex items-center gap-1 transition-all cursor-pointer"
              >
                <Sparkles className="w-3 h-3 text-amber-300" /> Auto-Place All
              </button>
              <button
                type="button"
                onClick={clearImportedData}
                className="text-[10px] text-red-400 hover:text-red-300 transition-colors font-medium flex items-center gap-1 px-1 py-0.5"
              >
                <Trash2 className="w-3 h-3" /> Clear
              </button>
            </div>
          </div>

          <div className="max-h-48 overflow-y-auto space-y-1.5 pr-1">
            {importedParcels.map((parcel, idx) => {
              const isSel = parcel.id === (selectedParcel || activeParcel?.id);
              const isMatched = parcel.status === 'matched';
              const poly = parcel.polygon || parcel.points || parcel.corners || [];
              const area = parcel.properties?.area || Math.round(
                Math.abs((poly[0]?.x || 0) - (poly[1]?.x || 0)) * Math.abs((poly[0]?.z || 0) - (poly[2]?.z || 0))
              ) || 20;

              return (
                <div
                  key={parcel.id}
                  onClick={() => {
                    setSelectedParcel(parcel.id);
                    const cx = poly.reduce((s, p) => s + p.x, 0) / (poly.length || 1);
                    const cz = poly.reduce((s, p) => s + p.z, 0) / (poly.length || 1);
                    focusCameraOn([cx, 8, cz]);
                  }}
                  className={`p-2 rounded-lg border text-xs cursor-pointer transition-all flex items-center justify-between ${isSel
                    ? 'bg-emerald-950/60 border-emerald-400 shadow-[0_0_12px_rgba(16,185,129,0.3)]'
                    : 'bg-slate-900/60 border-slate-800 hover:border-slate-700 hover:bg-slate-850'
                    }`}
                >
                  <div className="flex items-center gap-2">
                    <span className="font-mono text-[10px] text-slate-500 font-bold">#{idx + 1}</span>
                    <div>
                      <span className={`font-bold block ${isSel ? 'text-emerald-200' : 'text-slate-200'}`}>
                        {parcel.name}
                      </span>
                      <span className="text-[10px] text-slate-400 font-mono">
                        Area: {area} m² • {poly.length} corners
                      </span>
                    </div>
                  </div>

                  <div className="text-right flex items-center gap-1.5">
                    <span className={`text-[9px] font-mono font-bold px-1.5 py-0.5 rounded border ${isMatched
                      ? 'bg-emerald-950 text-emerald-300 border-emerald-500/50'
                      : 'bg-cyan-950 text-cyan-300 border-cyan-500/40'
                      }`}>
                      {isMatched ? '✓ 3D MATCHED' : '2D DELINEATED'}
                    </span>
                    {!isMatched ? (
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          autoPlaceBuildingInParcel(parcel.id);
                        }}
                        className="px-2 py-0.5 rounded bg-emerald-600 hover:bg-emerald-500 text-white text-[10px] font-bold shadow flex items-center gap-1 transition-all cursor-pointer"
                        title="Auto-Place 3D Building in Center of this Plot with Setbacks"
                      >
                        <Building2 className="w-3 h-3 text-emerald-200" />
                        <span>Place 3D</span>
                      </button>
                    ) : (
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          const cx = poly.reduce((s, p) => s + p.x, 0) / (poly.length || 1);
                          const cz = poly.reduce((s, p) => s + p.z, 0) / (poly.length || 1);
                          focusCameraOn([cx, 12, cz]);
                        }}
                        className="p-1 rounded bg-slate-800 hover:bg-slate-700 text-slate-300 transition-colors"
                        title="Inspect 3D Building"
                      >
                        <Crosshair className="w-3 h-3 text-emerald-400" />
                      </button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>

          {activeParcel && (
            <div className="pt-1 border-t border-slate-800 flex justify-between items-center text-[10px] text-slate-400">
              <span>Selected: <strong className="text-emerald-300 font-bold">{activeParcel.name}</strong></span>
              <button
                type="button"
                onClick={() => {
                  const poly = activeParcel.polygon || activeParcel.points || activeParcel.corners || [];
                  const cx = poly.reduce((s, p) => s + p.x, 0) / (poly.length || 1);
                  const cz = poly.reduce((s, p) => s + p.z, 0) / (poly.length || 1);
                  focusCameraOn([cx, 8, cz]);
                }}
                className="text-emerald-400 hover:underline font-bold"
              >
                Center Camera Here 🎯
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

// ─── TAB 2: LIDAR SCANNING & AUTO-ALIGNMENT WITH SETBACKS ────────────────────
const LidarSurveySection = () => {
  const { importedParcels, autoPlaceBuildingInParcel, selectedParcel, setSelectedParcel, focusCameraOn, addAlert } = useStore();
  const [selectedTargetId, setSelectedTargetId] = useState(selectedParcel || importedParcels?.[0]?.id || '');
  const [isAligning, setIsAligning] = useState(false);
  const [alignmentComplete, setAlignmentComplete] = useState(false);

  useEffect(() => {
    if (selectedParcel) setSelectedTargetId(selectedParcel);
  }, [selectedParcel]);

  const targetParcel = importedParcels.find(p => p.id === selectedTargetId) || importedParcels[0];

  // Compute parcel boundary & setback dimensions
  const poly = targetParcel?.polygon || targetParcel?.points || targetParcel?.corners || [{ x: 15, z: 15 }];
  const xs = poly.map(p => p.x);
  const zs = poly.map(p => p.z);
  const minX = Math.min(...xs);
  const maxX = Math.max(...xs);
  const minZ = Math.min(...zs);
  const maxZ = Math.max(...zs);
  const pw = Math.max(2.0, maxX - minX);
  const pl = Math.max(2.0, maxZ - minZ);
  const bWidth = Math.max(2.0, Number((pw * 0.72).toFixed(1)));
  const bLength = Math.max(2.0, Number((pl * 0.72).toFixed(1)));
  const setbackX = Number(((pw - bWidth) / 2).toFixed(1));
  const setbackZ = Number(((pl - bLength) / 2).toFixed(1));

  const handleAutoAlignParcel = async () => {
    if (!targetParcel) {
      addAlert({
        type: 'warning',
        title: '⚠️ Parcel Required',
        message: 'Please delineate 2D cadastral parcels in Tab 1 first!'
      });
      return;
    }

    setIsAligning(true);
    await autoPlaceBuildingInParcel(targetParcel.id, {
      sourceType: 'LiDAR',
      buildingName: targetParcel.name,
      sourceFile: 'urdhva_sample_lidar.las'
    });
    setIsAligning(false);
    setAlignmentComplete(true);
  };

  return (
    <div className="space-y-3.5">
      {/* Target Parcel Selector & Auto-Alignment Top HUD */}
      <div className="p-3.5 rounded-xl bg-gradient-to-r from-emerald-950/90 to-teal-950/90 border border-emerald-500/60 shadow-[0_0_20px_rgba(16,185,129,0.25)] space-y-2.5">
        <div className="flex items-center gap-2">
          <span className="p-1 rounded-lg bg-emerald-500/20 text-emerald-400">
            <Crosshair className="w-4 h-4" />
          </span>
          <div>
            <span className="text-xs font-bold text-white block">LiDAR Parcel Alignment with Setback Margins</span>
            <span className="text-[10px] text-emerald-300/80">
              Reconstruct 3D building and place in center of parcel with side margins
            </span>
          </div>
        </div>

        {/* Dropdown to select building name */}
        <div>
          <label className="block text-[10px] uppercase font-bold text-slate-300 mb-1">
            Target Cadastral Parcel / Building Name:
          </label>
          <select
            value={targetParcel?.id || ''}
            onChange={e => {
              setSelectedTargetId(e.target.value);
              setSelectedParcel(e.target.value);
            }}
            className="w-full bg-slate-950 border border-emerald-500/60 rounded-lg px-2.5 py-1.5 text-xs text-emerald-200 font-bold focus:outline-none focus:border-emerald-400"
          >
            {importedParcels.length === 0 && <option value="">No parcels loaded (Go to Tab 1)</option>}
            {importedParcels.map(p => (
              <option key={p.id} value={p.id}>
                {p.name} — Area: {p.properties?.area || 20}m² ({p.status === 'matched' ? '✓ 3D Placed' : 'Available'})
              </option>
            ))}
          </select>
        </div>

        {/* Setback Telemetry Preview */}
        {targetParcel && (
          <div className="p-2 rounded bg-slate-950/80 border border-slate-800 text-[10px] space-y-1">
            <div className="flex justify-between font-mono">
              <span className="text-slate-400">Parcel Boundary:</span>
              <span className="text-slate-200 font-bold">{pw.toFixed(1)}m × {pl.toFixed(1)}m ({Math.round(pw * pl)} m²)</span>
            </div>
            <div className="flex justify-between font-mono">
              <span className="text-emerald-400">3D Building Footprint:</span>
              <span className="text-emerald-300 font-bold">{bWidth}m × {bLength}m (Centered)</span>
            </div>
            <div className="flex justify-between font-mono">
              <span className="text-amber-400">Setback Margins:</span>
              <span className="text-amber-300 font-bold">Sides: {setbackX}m • Front/Rear: {setbackZ}m</span>
            </div>
          </div>
        )}

        <button
          type="button"
          onClick={handleAutoAlignParcel}
          disabled={isAligning || !targetParcel}
          className="w-full py-2.5 px-3 rounded-lg bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white font-bold text-xs shadow-[0_0_15px_rgba(16,185,129,0.4)] flex items-center justify-center gap-2 transition-all cursor-pointer disabled:opacity-50"
        >
          {isAligning ? (
            <>
              <RefreshCw className="w-3.5 h-3.5 animate-spin" />
              <span>Fitting Building into {targetParcel?.name} Centroid...</span>
            </>
          ) : (
            <>
              <CheckCircle2 className="w-4 h-4 text-emerald-200" />
              <span>🎯 Auto-Align & Place inside {targetParcel ? `"${targetParcel.name}"` : 'Parcel'}</span>
            </>
          )}
        </button>

        {alignmentComplete && (
          <div className="p-2 rounded bg-emerald-900/60 border border-emerald-400 text-xs text-emerald-200 font-bold text-center flex items-center justify-center gap-1.5 shadow-[0_0_15px_rgba(16,185,129,0.4)]">
            <span>✓ 3D Model Centered with Setbacks inside {targetParcel?.name}</span>
          </div>
        )}
      </div>

      {/* Embed Full Corporator LidarScanner component */}
      <LidarScanner />
    </div>
  );
};

// ─── TAB 3: DRONE VIDEO SCANNING & TARGET PARCEL DEPLOYMENT ─────────────────
const DroneSurveySection = () => {
  const { importedParcels, autoPlaceBuildingInParcel, addAlert } = useStore();
  const [selectedDroneParcelId, setSelectedDroneParcelId] = useState(importedParcels?.[0]?.id || '');
  const [isAligningDrone, setIsAligningDrone] = useState(false);
  const targetParcel = importedParcels.find(p => p.id === selectedDroneParcelId) || importedParcels[0];

  const handleAutoDeployDroneModel = async () => {
    if (!targetParcel) {
      addAlert({ type: 'warning', title: '⚠️ Parcel Required', message: 'Please delineate a 2D boundary in Tab 1 first!' });
      return;
    }
    setIsAligningDrone(true);
    await autoPlaceBuildingInParcel(targetParcel.id, {
      sourceType: 'drone',
      buildingName: targetParcel.name,
      sourceFile: 'drone_flight_mission.mp4'
    });
    setIsAligningDrone(false);
  };

  return (
    <div className="space-y-3.5">
      <div className="p-3 rounded-xl bg-gradient-to-r from-cyan-950/80 to-blue-950/80 border border-cyan-500/60 shadow-[0_0_20px_rgba(6,182,212,0.25)] space-y-2">
        <div className="flex items-center gap-2">
          <span className="p-1 rounded-lg bg-cyan-500/20 text-cyan-400">
            <Plane className="w-4 h-4" />
          </span>
          <div>
            <span className="text-xs font-bold text-white block">Drone AI Photogrammetry Reconstruction</span>
            <span className="text-[10px] text-cyan-300/80">
              Extract 3D models from drone video flights & auto-align into 2D cadastral parcels
            </span>
          </div>
        </div>

        {/* Target Parcel Selector for Drone */}
        <div className="pt-1 border-t border-cyan-900/50">
          <div className="flex gap-2 items-center">
            <select
              value={targetParcel?.id || ''}
              onChange={e => setSelectedDroneParcelId(e.target.value)}
              className="flex-1 bg-slate-950 border border-cyan-500/50 rounded-lg px-2 py-1.5 text-xs text-cyan-200 font-bold focus:outline-none"
            >
              {importedParcels.length === 0 && <option value="">No parcels loaded</option>}
              {importedParcels.map(p => (
                <option key={p.id} value={p.id}>
                  {p.name} ({p.status === 'matched' ? '✓ Placed' : 'Empty'})
                </option>
              ))}
            </select>
            <button
              type="button"
              onClick={handleAutoDeployDroneModel}
              disabled={isAligningDrone || !targetParcel}
              className="py-1.5 px-3 rounded-lg bg-cyan-600 hover:bg-cyan-500 text-white font-bold text-xs shadow-[0_0_12px_rgba(6,182,212,0.4)] flex items-center gap-1.5 transition-all cursor-pointer disabled:opacity-50"
            >
              {isAligningDrone ? <RefreshCw className="w-3.5 h-3.5 animate-spin" /> : <MapPin className="w-3.5 h-3.5" />}
              <span>Place in Selected Plot</span>
            </button>
          </div>
        </div>
      </div>

      {/* Embed Full DroneUpload component with DataSurvey enabled */}
      <DroneUpload isDataSurvey={true} />
    </div>
  );
};

// ─── TAB 4: FLOOR OCCUPANTS & 3D ULPIN GENERATION ────────────────────────────
const SAMPLE_REGISTRY_ROWS = [
  { floor: 1, unit_no: '101', owner_name: 'Rahul Patil', record_type: 'Owner' },
  { floor: 1, unit_no: '102', owner_name: 'Sneha Joshi', record_type: 'Owner' },
  { floor: 1, unit_no: '103', owner_name: 'Amit Kulkarni', record_type: 'Owner' },
  { floor: 2, unit_no: '201', owner_name: 'Neha Deshmukh', record_type: 'Owner' },
  { floor: 2, unit_no: '202', owner_name: 'Vivek Shah', record_type: 'Owner' },
  { floor: 2, unit_no: '203', owner_name: 'Priya Mehta', record_type: 'Owner' },
  { floor: 2, unit_no: '204', owner_name: 'Kunal Pawar', record_type: 'Owner' },
  { floor: 3, unit_no: '301', owner_name: 'Ananya Rao', record_type: 'Owner' },
  { floor: 3, unit_no: '302', owner_name: 'Rohan Jadhav', record_type: 'Owner' },
  { floor: 4, unit_no: '401', owner_name: 'Pooja More', record_type: 'Owner' },
  { floor: 4, unit_no: '402', owner_name: 'Siddharth Bhosale', record_type: 'Owner' },
  { floor: 4, unit_no: '403', owner_name: 'Mitali Nair', record_type: 'Owner' },
];

const SAMPLE_TSV_TEXT = `floor\tunit_no\towner_name\trecord_type
1\t101\tRahul Patil\tOwner
1\t102\tSneha Joshi\tOwner
1\t103\tAmit Kulkarni\tOwner
2\t201\tNeha Deshmukh\tOwner
2\t202\tVivek Shah\tOwner
2\t203\tPriya Mehta\tOwner
2\t204\tKunal Pawar\tOwner
3\t301\tAnanya Rao\tOwner
3\t302\tRohan Jadhav\tOwner
4\t401\tPooja More\tOwner
4\t402\tSiddharth Bhosale\tOwner
4\t403\tMitali Nair\tOwner`;

function parseRegistryText(text) {
  if (!text) return [];
  const lines = text.split(/\r?\n/).map(l => l.trim()).filter(l => l.length > 0);
  if (lines.length === 0) return [];

  const splitLine = (line) => {
    if (line.includes('\t')) {
      return line.split('\t').map(s => s.trim().replace(/^['"]|['"]$/g, ''));
    }
    if (line.includes(',')) {
      return line.split(',').map(s => s.trim().replace(/^['"]|['"]$/g, ''));
    }
    if (line.includes(';')) {
      return line.split(';').map(s => s.trim().replace(/^['"]|['"]$/g, ''));
    }
    if (line.includes('|')) {
      return line.split('|').map(s => s.trim().replace(/^['"]|['"]$/g, ''));
    }
    // Multiple spaces
    return line.split(/\s{2,}|\t/).map(s => s.trim().replace(/^['"]|['"]$/g, ''));
  };

  const firstParts = splitLine(lines[0]);
  const isFirstRowData = !isNaN(parseInt(firstParts[0])) && firstParts.length >= 2;

  let floorIdx = 0;
  let unitIdx = 1;
  let nameIdx = 2;
  let typeIdx = 3;
  let startIndex = 0;

  if (!isFirstRowData) {
    startIndex = 1;
    const headers = firstParts.map(h => h.toLowerCase().replace(/[^a-z0-9_]/g, ''));
    const fI = headers.findIndex(h => h.includes('floor'));
    const uI = headers.findIndex(h => h.includes('unit') || h.includes('flat') || h.includes('door') || h.includes('apartment'));
    const nI = headers.findIndex(h => h.includes('owner') || h.includes('name') || h.includes('resident') || h.includes('person'));
    const tI = headers.findIndex(h => h.includes('type') || h.includes('record') || h.includes('status') || h.includes('role'));

    if (fI >= 0) floorIdx = fI;
    if (uI >= 0) unitIdx = uI;
    if (nI >= 0) nameIdx = nI;
    if (tI >= 0) typeIdx = tI;
  }

  const records = [];
  for (let i = startIndex; i < lines.length; i++) {
    const parts = splitLine(lines[i]);
    if (parts.length < 2) continue;

    const f = parseInt(parts[floorIdx] !== undefined ? parts[floorIdx] : parts[0]);
    const u = parts[unitIdx] !== undefined ? parts[unitIdx] : (parts.length > 1 ? parts[1] : `${f}01`);
    const n = parts[nameIdx] !== undefined ? parts[nameIdx] : (parts.length > 2 ? parts[2] : `Owner ${i}`);
    const t = parts[typeIdx] !== undefined ? parts[typeIdx] : (parts.length > 3 ? parts[3] : 'Owner');

    if (!isNaN(f) && n && n.length > 0) {
      records.push({
        floor: f,
        unit_no: String(u || `${f}01`),
        owner_name: String(n),
        record_type: String(t || 'Owner')
      });
    }
  }
  return records;
}

const FloorOccupantsForm = () => {
  const { t } = useTranslation();
  const {
    buildings,
    selectedBuilding,
    setSelectedBuilding,
    selectUnit,
    selectedUnit,
    assignOccupantsToFloors,
    linkingResults,
    viewMode,
    setViewMode,
    focusCameraOn
  } = useStore();

  const [step, setStep] = useState(selectedBuilding ? 2 : 1);
  const [isProcessing, setIsProcessing] = useState(false);
  const [showPasteBox, setShowPasteBox] = useState(false);
  const [pasteText, setPasteText] = useState(SAMPLE_TSV_TEXT);
  const fileInputRef = useRef(null);

  const targetBuilding = buildings.find(b => b.id === selectedBuilding) ||
    buildings.find(b => b.isSurvey || b.sourceType === 'LiDAR' || b.sourceType === 'drone') ||
    buildings[0];

  // Auto-switch to step 2 if a building gets selected
  useEffect(() => {
    if (selectedBuilding) {
      setStep(2);
    }
  }, [selectedBuilding]);

  const handleSelectBuilding = (bld) => {
    setSelectedBuilding(bld.id);
    setStep(2);
    if (bld.position) {
      focusCameraOn([bld.position[0], 12, bld.position[2] + 25]);
    }
  };

  const handleFileUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setIsProcessing(true);
    try {
      const targetId = targetBuilding?.id || selectedBuilding || (buildings.length > 0 ? buildings[0].id : null);
      const text = await file.text();
      const records = parseRegistryText(text);
      if (records.length > 0) {
        assignOccupantsToFloors(targetId, records);
      } else {
        assignOccupantsToFloors(targetId, SAMPLE_REGISTRY_ROWS);
      }
      setStep(2);
    } catch (err) {
      console.error("Upload parsing error:", err);
      const fallbackId = targetBuilding?.id || selectedBuilding || (buildings.length > 0 ? buildings[0].id : null);
      assignOccupantsToFloors(fallbackId, SAMPLE_REGISTRY_ROWS);
      setStep(2);
    } finally {
      setIsProcessing(false);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  const handleLoadExactSample = () => {
    const targetId = targetBuilding?.id || selectedBuilding || (buildings.length > 0 ? buildings[0].id : null);
    setIsProcessing(true);
    setTimeout(() => {
      assignOccupantsToFloors(targetId, SAMPLE_REGISTRY_ROWS);
      setStep(2);
      setIsProcessing(false);
    }, 250);
  };

  const handleParsePastedText = () => {
    const targetId = targetBuilding?.id || selectedBuilding || (buildings.length > 0 ? buildings[0].id : null);
    setIsProcessing(true);
    try {
      const records = parseRegistryText(pasteText);
      if (records.length > 0) {
        assignOccupantsToFloors(targetId, records);
      } else {
        assignOccupantsToFloors(targetId, SAMPLE_REGISTRY_ROWS);
      }
      setShowPasteBox(false);
      setStep(2);
    } catch (err) {
      console.error("Paste parsing error:", err);
      assignOccupantsToFloors(targetId, SAMPLE_REGISTRY_ROWS);
      setShowPasteBox(false);
      setStep(2);
    } finally {
      setIsProcessing(false);
    }
  };

  // Units and floors of target building
  const units = targetBuilding?.units || [];
  const floorsList = units.filter(u => u.type === 'floor');
  const totalOccupants = floorsList.reduce((acc, fl) => acc + (fl.families?.length || 0), 0);

  return (
    <div className="space-y-4">
      {/* Step Progress Header */}
      <div className="border-b border-slate-700/60 pb-2.5">
        <div className="flex items-center justify-between mb-1">
          <h3 className="text-sm font-bold text-slate-100 flex items-center gap-2">
            <Users className="w-4 h-4 text-emerald-400" />
            <span>{t('datasurvey.headers.floorOccupants')}</span>
          </h3>
          <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-slate-800 text-slate-300 border border-slate-700">
            Step {step} of 2
          </span>
        </div>
        <p className="text-[11px] text-slate-400 leading-relaxed">
          Select building, provide floor/owner registry file, partition floor volumes into colored owner blocks, and assign 3D ULPINs.
        </p>

        {/* Step Indicator Pills */}
        <div className="grid grid-cols-2 gap-2 mt-2.5">
          <button
            type="button"
            onClick={() => setStep(1)}
            className={`py-1.5 px-2 rounded-lg text-xs font-semibold flex items-center justify-center gap-1.5 transition-all cursor-pointer ${step === 1
              ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 shadow-sm'
              : 'bg-slate-900/60 text-slate-400 border border-slate-800 hover:text-slate-200'
              }`}
          >
            <span className="w-4 h-4 rounded-full bg-emerald-500/30 text-emerald-300 flex items-center justify-center text-[10px] font-bold">
              {targetBuilding ? '✓' : '1'}
            </span>
            <span>1. Select Building</span>
          </button>

          <button
            type="button"
            onClick={() => {
              if (targetBuilding) setStep(2);
            }}
            disabled={!targetBuilding}
            className={`py-1.5 px-2 rounded-lg text-xs font-semibold flex items-center justify-center gap-1.5 transition-all cursor-pointer ${step === 2
              ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 shadow-sm'
              : 'bg-slate-900/60 text-slate-400 border border-slate-800 hover:text-slate-200 disabled:opacity-50'
              }`}
          >
            <span className="w-4 h-4 rounded-full bg-emerald-500/30 text-emerald-300 flex items-center justify-center text-[10px] font-bold">
              2
            </span>
            <span>2. Upload Registry</span>
          </button>
        </div>
      </div>

      {/* ── STEP 1: SELECT BUILDING ── */}
      {step === 1 && (
        <div className="space-y-2.5">
          <div className="flex items-center justify-between">
            <label className="text-[11px] font-bold text-slate-300 uppercase tracking-wider flex items-center gap-1.5">
              <Building2 className="w-3.5 h-3.5 text-emerald-400" />
              <span>Choose Target Building ({buildings.length} Available)</span>
            </label>
            <span className="text-[10px] text-slate-400">or click building in 3D</span>
          </div>

          {buildings.length === 0 ? (
            <div className="p-4 rounded-xl bg-slate-950/80 border border-dashed border-slate-800 text-center space-y-2">
              <Building2 className="w-6 h-6 text-slate-500 mx-auto" />
              <p className="text-xs text-slate-400">No buildings currently in the 3D cadastre.</p>
              <p className="text-[11px] text-slate-400">Please delineate a 2D plot boundary or generate a 3D LiDAR building first.</p>
            </div>
          ) : (
            <div className="space-y-2 max-h-72 overflow-y-auto pr-1">
              {buildings.map((b) => {
                const isSelected = targetBuilding?.id === b.id;
                const flCount = b.actualFloors || b.units?.filter(u => u.type === 'floor').length || 4;
                const dimW = b.footprint ? b.footprint[0] : (b.width || 16);
                const dimL = b.footprint ? b.footprint[1] : (b.length || 14);

                return (
                  <div
                    key={b.id}
                    onClick={() => handleSelectBuilding(b)}
                    className={`p-2.5 rounded-xl border transition-all cursor-pointer flex items-center justify-between ${isSelected
                      ? 'bg-emerald-950/40 border-emerald-500/60 shadow-[0_0_15px_rgba(16,185,129,0.15)]'
                      : 'bg-slate-950/70 border-slate-800 hover:border-slate-700 hover:bg-slate-900/50'
                      }`}
                  >
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-bold text-slate-100">{b.name}</span>
                        <span className="text-[9px] font-mono px-1.5 py-0.2 rounded bg-slate-800 text-cyan-400 border border-slate-700">
                          {b.id}
                        </span>
                      </div>
                      <div className="text-[10px] text-slate-400 flex items-center gap-3">
                        <span>🏢 {flCount} Floors</span>
                        <span>📐 {dimW}m × {dimL}m</span>
                        <span>📍 [{b.position?.[0] || 0}, {b.position?.[2] || 0}]</span>
                      </div>
                    </div>

                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        handleSelectBuilding(b);
                      }}
                      className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-colors flex items-center gap-1 ${isSelected
                        ? 'bg-emerald-500 text-slate-950 font-black'
                        : 'bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700'
                        }`}
                    >
                      <span>{isSelected ? 'Selected ✓' : 'Select →'}</span>
                    </button>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* ── STEP 2: UPLOAD REGISTRY & ASSIGN ULPIN ── */}
      {step === 2 && targetBuilding && (
        <div className="space-y-3.5">
          {/* Active Selected Building Banner */}
          <div className="p-2.5 rounded-xl bg-slate-900/90 border border-slate-800 flex items-center justify-between">
            <div className="space-y-0.5">
              <span className="text-[9px] uppercase font-bold text-emerald-400 flex items-center gap-1">
                <CheckCircle2 className="w-3 h-3 text-emerald-400" />
                <span>Selected Target Building</span>
              </span>
              <div className="flex items-center gap-2">
                <span className="text-xs font-bold text-slate-100">{targetBuilding.name}</span>
                <span className="text-[9px] font-mono px-1.5 py-0.2 rounded bg-slate-950 text-cyan-400 border border-slate-800">
                  {targetBuilding.id}
                </span>
              </div>
            </div>
            <div className="flex items-center gap-1.5">
              <button
                type="button"
                onClick={() => {
                  if (targetBuilding.position) {
                    focusCameraOn([targetBuilding.position[0], 12, targetBuilding.position[2] + 25]);
                  }
                }}
                className="px-2 py-1 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded text-[10px] font-medium border border-slate-700"
              >
                🎯 Focus 3D
              </button>
              <button
                type="button"
                onClick={() => setStep(1)}
                className="px-2 py-1 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded text-[10px] font-medium border border-slate-700"
              >
                🔄 Switch
              </button>
            </div>
          </div>

          {/* Expected Format & Sample Preview Card */}
          <div className="p-3 rounded-xl bg-slate-950/90 border border-slate-800/90 space-y-2">
            <div className="flex items-center justify-between border-b border-slate-800/80 pb-1.5">
              <span className="text-[11px] font-bold text-slate-200 flex items-center gap-1.5">
                <FileText className="w-3.5 h-3.5 text-emerald-400" />
                <span>Expected Registry File Format (TSV / CSV)</span>
              </span>
              <span className="text-[9px] font-mono text-cyan-400 bg-cyan-950/60 px-1.5 py-0.5 rounded border border-cyan-800/50">
                floor · unit_no · owner_name · record_type
              </span>
            </div>

            {/* Quick preview table showing user's exact requested schema */}
            <div className="overflow-x-auto">
              <table className="w-full text-left text-[10px] font-mono border-collapse">
                <thead>
                  <tr className="text-slate-400 border-b border-slate-800">
                    <th className="pb-1 font-bold">floor</th>
                    <th className="pb-1 font-bold">unit_no</th>
                    <th className="pb-1 font-bold">owner_name</th>
                    <th className="pb-1 font-bold">record_type</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-900 text-slate-300">
                  <tr><td>1</td><td>101</td><td className="text-emerald-300">Rahul Patil</td><td>Owner</td></tr>
                  <tr><td>1</td><td>102</td><td className="text-emerald-300">Sneha Joshi</td><td>Owner</td></tr>
                  <tr><td>1</td><td>103</td><td className="text-emerald-300">Amit Kulkarni</td><td>Owner</td></tr>
                  <tr><td>2</td><td>201</td><td className="text-violet-300">Neha Deshmukh</td><td>Owner</td></tr>
                  <tr><td>...</td><td>...</td><td className="text-slate-500">(12 owners across 4 floors)</td><td>...</td></tr>
                </tbody>
              </table>
            </div>
          </div>

          {/* Upload & Sample Buttons */}
          <div className="p-3.5 rounded-xl bg-slate-950/80 border border-slate-800 space-y-2.5">
            <input
              ref={fileInputRef}
              type="file"
              onChange={handleFileUpload}
              className="hidden"
              accept=".csv,.tsv,.txt,.xlsx,.xls"
            />

            <div className="flex flex-col sm:flex-row gap-2">
              <button
                type="button"
                onClick={handleLoadExactSample}
                disabled={isProcessing}
                className="flex-1 py-2 px-3 bg-gradient-to-r from-emerald-600 via-teal-600 to-cyan-600 hover:from-emerald-500 hover:to-cyan-500 text-white rounded-lg text-xs font-bold shadow-[0_0_15px_rgba(16,185,129,0.3)] flex items-center justify-center gap-1.5 transition-all cursor-pointer"
              >
                <Sparkles className="w-3.5 h-3.5 text-amber-300" />
                <span>⚡ Load 12-Owner Sample Registry</span>
              </button>

              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                disabled={isProcessing}
                className="flex-1 py-2 px-3 bg-slate-900 hover:bg-slate-800 text-slate-200 rounded-lg text-xs font-bold border border-slate-700 flex items-center justify-center gap-1.5 transition-colors cursor-pointer"
              >
                <FileSpreadsheet className="w-4 h-4 text-emerald-400" />
                <span>Upload Registry File</span>
              </button>
            </div>

            {/* Paste Data Toggle */}
            <div className="pt-1 text-center">
              <button
                type="button"
                onClick={() => setShowPasteBox(!showPasteBox)}
                className="text-[10px] text-cyan-400 hover:text-cyan-300 underline font-medium"
              >
                {showPasteBox ? 'Hide Custom Paste Box ▲' : '📝 Or Paste TSV/CSV Text ▼'}
              </button>
            </div>

            {showPasteBox && (
              <div className="space-y-2 pt-1">
                <textarea
                  rows={6}
                  value={pasteText}
                  onChange={e => setPasteText(e.target.value)}
                  className="w-full bg-slate-900 border border-slate-700 rounded-lg p-2 text-[10px] font-mono text-slate-200 focus:outline-none focus:border-emerald-500"
                  placeholder="floor	unit_no	owner_name	record_type"
                />
                <button
                  type="button"
                  onClick={handleParsePastedText}
                  disabled={isProcessing}
                  className="w-full py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg text-xs font-bold transition-all cursor-pointer"
                >
                  Import & Partition Floors
                </button>
              </div>
            )}

            {isProcessing && (
              <div className="text-xs text-emerald-400 flex items-center justify-center gap-2 font-bold animate-pulse pt-1">
                <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                <span>Partitioning floor volumes into owner blocks and generating 3D ULPINs...</span>
              </div>
            )}
          </div>

          {/* View Mode Toggle: Exploded vs Normal */}
          <button
            type="button"
            onClick={() => setViewMode(viewMode === 'exploded' ? 'normal' : 'exploded')}
            className={`w-full py-2 px-3 rounded-lg text-xs font-bold border flex items-center justify-center gap-2 transition-all cursor-pointer ${viewMode === 'exploded'
              ? 'bg-emerald-600/20 text-emerald-300 border-emerald-500/50 shadow-[0_0_12px_rgba(16,185,129,0.2)]'
              : 'bg-slate-800 hover:bg-slate-700 text-slate-200 border-slate-700'
              }`}
          >
            <Layers className="w-4 h-4 text-emerald-400" />
            <span>{viewMode === 'exploded' ? '💥 Exploded 3D View Active (Collapse to Normal)' : '💥 Explode 3D Floors & Inspect Owner Blocks'}</span>
          </button>

          {/* Delineated Owner Blocks & Hierarchical 3D ULPINs View */}
          {floorsList.length > 0 && (
            <div className="p-3 rounded-xl bg-slate-950/90 border border-slate-800 space-y-3">
              <div className="flex items-center justify-between border-b border-slate-800 pb-2">
                <span className="text-xs font-bold text-slate-200 flex items-center gap-1.5">
                  <Users className="w-3.5 h-3.5 text-emerald-400" />
                  <span>Delineated Units & 3D ULPINs ({totalOccupants} Owners)</span>
                </span>
                <span className="text-[10px] font-mono text-emerald-400 bg-emerald-950/60 px-2 py-0.5 rounded border border-emerald-800/40">
                  {floorsList.length} Floors Partitioned
                </span>
              </div>

              <div className="max-h-80 overflow-y-auto space-y-2.5 pr-1">
                {floorsList.map((floor) => {
                  const fNum = floor.floorNumber;
                  const occupants = floor.families && floor.families.length > 0
                    ? floor.families
                    : [];

                  return (
                    <div key={floor.ulpin || fNum} className="p-2.5 rounded-xl bg-slate-900/80 border border-slate-800 space-y-2">
                      <div className="flex justify-between items-center text-xs font-bold border-b border-slate-800/80 pb-1.5">
                        <span className="text-slate-100 flex items-center gap-1.5">
                          <span className="w-2.5 h-2.5 rounded-full bg-emerald-400" />
                          <span>Floor {fNum}</span>
                          <span className="text-[10px] text-slate-400 font-normal">
                            ({occupants.length} {occupants.length === 1 ? 'Owner Block' : 'Owner Blocks'})
                          </span>
                        </span>
                        <button
                          type="button"
                          onClick={() => {
                            setViewMode('exploded');
                            setSelectedBuilding(targetBuilding.id);
                            if (targetBuilding.position) {
                              focusCameraOn([targetBuilding.position[0], fNum * 3.2, targetBuilding.position[2] + 16]);
                            }
                          }}
                          className="text-[10px] text-cyan-400 hover:text-cyan-300 font-mono hover:underline cursor-pointer"
                        >
                          Inspect Floor in 3D ↗
                        </button>
                      </div>

                      {occupants.length === 0 ? (
                        <div className="flex items-center justify-between text-[11px] p-2 rounded-lg bg-slate-950/40 border border-slate-800/60 text-slate-400">
                          <span className="flex items-center gap-1.5">
                            <span className="w-2 h-2 rounded-full bg-slate-600" />
                            <span>Continuous Floor Slab (Unmodified)</span>
                          </span>
                          <span className="font-mono text-[9px] text-slate-500">{floor.ulpin}</span>
                        </div>
                      ) : (
                        <div className="space-y-1.5">
                          {occupants.map((occ, idx) => {
                            const isSelected = selectedUnit === occ.ulpin;
                            return (
                              <div
                                key={idx}
                                onClick={() => {
                                  selectUnit(occ.ulpin);
                                  setViewMode('exploded');
                                  setSelectedBuilding(targetBuilding.id);
                                  if (targetBuilding.position) {
                                    focusCameraOn([targetBuilding.position[0], fNum * 3.2, targetBuilding.position[2] + 16]);
                                  }
                                }}
                                className={`flex justify-between items-center text-[11px] p-2 rounded-lg border transition-all cursor-pointer ${isSelected
                                  ? 'bg-cyan-950/80 border-cyan-400 shadow-[0_0_12px_rgba(6,182,212,0.3)]'
                                  : 'bg-slate-950/70 border-slate-800/80 hover:border-slate-700 hover:bg-slate-900/60'
                                  }`}
                              >
                                <div className="flex items-center gap-2">
                                  {/* Color Block Swatch Matching 3D Partition */}
                                  <span
                                    className="w-3.5 h-3.5 rounded-md flex-shrink-0 shadow-sm border border-white/20"
                                    style={{
                                      backgroundColor: occ.color || '#0284c7',
                                      boxShadow: `0 0 8px ${occ.color || '#0284c7'}60`
                                    }}
                                  />
                                  <div>
                                    <div className="flex items-center gap-1.5">
                                      <span className="font-bold text-slate-100">{occ.name}</span>
                                      <span className="text-[9px] font-mono text-cyan-300 font-bold bg-cyan-950/60 px-1 rounded">
                                        Unit {occ.flatNumber || occ.unit}
                                      </span>
                                    </div>
                                    <span className="text-[9px] text-slate-400 block mt-0.5">
                                      {occ.area || 95} m² • {occ.contact || 'Verified Occupant'}
                                    </span>
                                  </div>
                                </div>

                                <div className="text-right">
                                  <span className="text-[9px] font-bold px-1.5 py-0.5 rounded border font-mono bg-emerald-950/80 text-emerald-300 border-emerald-500/40">
                                    {occ.type || 'Owner'}
                                  </span>
                                  <span className="block font-mono text-[9px] text-emerald-400/90 mt-1 font-bold">
                                    {occ.ulpin}
                                  </span>
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

// ─── TAB 5: SUB-SURFACE UTILITIES, GPR & PIPELINES ────────────────────────────
const SubSurfaceForm = () => {
  const {
    infraDrawingActive,
    setInfraDrawingActive,
    infraDraftType,
    setInfraDraftType,
    infraDraftDepth,
    setInfraDraftDepth,
    infraDraftRadius,
    setInfraDraftRadius,
    infraDraftPoints,
    undoLastInfraDraftPoint,
    clearInfraDraftPoints,
    addNewInfrastructure,
    undergroundMode,
    toggleUndergroundMode,
    addUndergroundFeature,
    addAlert
  } = useStore();

  const [activeSection, setActiveSection] = useState('pipeline'); // 'pipeline' | 'assets' | 'gpr'
  const [assetLabel, setAssetLabel] = useState('Municipal Borewell #4');
  const [assetType, setAssetType] = useState('well');
  const [assetDepth, setAssetDepth] = useState(12);

  const INFRA_TYPES = [
    { id: 'gas_line', label: 'Gas Line', color: '#ea580c', icon: Flame },
    { id: 'water_main', label: 'Water Main', color: '#0284c7', icon: Route },
    { id: 'sewer_line', label: 'Sewer Line', color: '#16a34a', icon: Route },
    { id: 'power_cable', label: 'Power Grid', color: '#eab308', icon: Route },
    { id: 'telecom_fiber', label: 'Telecom Fiber', color: '#06b6d4', icon: Route },
    { id: 'metro_tunnel', label: 'Metro Tunnel', color: '#9333ea', icon: Route }
  ];

  const handleQuickPresetPipeline = () => {
    addNewInfrastructure({
      type: 'gas_line',
      label: 'Main City Gas Pipeline — Sub-Surface',
      path: [[10, -infraDraftDepth, 10], [25, -infraDraftDepth, 18], [40, -infraDraftDepth, 30]],
      radius: 0.8,
      color: '#ea580c',
      isSurvey: true,
    });
    addAlert({
      type: 'success',
      title: '🔧 Pipeline Deployed',
      message: '3-point subterranean utility pipeline successfully deployed at -' + infraDraftDepth + 'm depth!'
    });
  };

  const handleDeployPlottedPipeline = async () => {
    if (infraDraftPoints.length < 2) {
      addAlert({ type: 'warning', title: '⚠️ Points Needed', message: 'Click on ground to add at least 2 waypoints.' });
      return;
    }
    const color = INFRA_TYPES.find(t => t.id === infraDraftType)?.color || '#ea580c';
    const pointsCopy = infraDraftPoints.map(p => [...p]);
    const pointCount = pointsCopy.length;
    await addNewInfrastructure({
      type: infraDraftType,
      label: `Surveyed ${infraDraftType.replace('_', ' ').toUpperCase()} Line`,
      path: pointsCopy,
      radius: infraDraftRadius || 0.6,
      color,
      isSurvey: true,
      isUserCreated: true,
    });
    clearInfraDraftPoints();
    setInfraDrawingActive(false);
    if (!undergroundMode) {
      toggleUndergroundMode();
    }
    addAlert({
      type: 'success',
      title: '🔧 Sub-Surface Utility Deployed',
      message: `Deployed utility line with ${pointCount} survey waypoints at -${infraDraftDepth}m.`
    });
  };

  const handleAddAsset = () => {
    addUndergroundFeature({
      type: assetType,
      label: assetLabel,
      posX: 18.0,
      posY: -assetDepth / 2,
      posZ: 16.0,
      radius: 2.2,
      depth: assetDepth,
      status: 'active',
      isSurvey: true
    });
    addAlert({
      type: 'success',
      title: '🕳️ Sub-Asset Registered',
      message: `Registered subterranean ${assetType} "${assetLabel}" at -${assetDepth}m depth.`
    });
  };

  return (
    <div className="space-y-3.5">
      {/* Sub-nav switcher */}
      <div className="flex gap-1 p-1 bg-slate-950 rounded-lg border border-slate-800 text-xs">
        <button
          type="button"
          onClick={() => setActiveSection('pipeline')}
          className={`flex-1 py-1.5 font-bold rounded transition-colors ${activeSection === 'pipeline' ? 'bg-orange-600 text-white shadow' : 'text-slate-400 hover:text-slate-200'
            }`}
        >
          🔧 Pipelines
        </button>
        <button
          type="button"
          onClick={() => setActiveSection('assets')}
          className={`flex-1 py-1.5 font-bold rounded transition-colors ${activeSection === 'assets' ? 'bg-purple-600 text-white shadow' : 'text-slate-400 hover:text-slate-200'
            }`}
        >
          🕳️ Sub-Assets
        </button>
        <button
          type="button"
          onClick={() => setActiveSection('gpr')}
          className={`flex-1 py-1.5 font-bold rounded transition-colors ${activeSection === 'gpr' ? 'bg-cyan-600 text-white shadow' : 'text-slate-400 hover:text-slate-200'
            }`}
        >
          📡 GPR Radar
        </button>
      </div>

      {/* Underground Mode Toggle Button */}
      <button
        type="button"
        onClick={toggleUndergroundMode}
        className={`w-full py-2 px-3 rounded-lg text-xs font-bold border transition-colors flex items-center justify-center gap-2 cursor-pointer ${undergroundMode
          ? 'bg-cyan-950/80 border-cyan-400 text-cyan-300 shadow-[0_0_15px_rgba(6,182,212,0.3)]'
          : 'bg-slate-900 hover:bg-slate-800 text-slate-300 border-slate-700'
          }`}
      >
        <Layers className="w-4 h-4 text-cyan-400" />
        <span>{undergroundMode ? '✓ Subterranean Camera Active (Viewing Below Ground)' : 'Toggle Subterranean Camera View'}</span>
      </button>

      {/* 1. PIPELINE PLOTTER */}
      {activeSection === 'pipeline' && (
        <div className="space-y-3">
          <div>
            <label className="block text-[10px] uppercase font-bold text-slate-400 mb-1">Utility Network Type</label>
            <div className="grid grid-cols-3 gap-1.5">
              {INFRA_TYPES.map(t => (
                <button
                  key={t.id}
                  type="button"
                  onClick={() => setInfraDraftType(t.id)}
                  className={`p-1.5 rounded-lg border text-[10px] font-bold flex items-center justify-center gap-1 transition-all ${infraDraftType === t.id
                    ? 'bg-slate-800 border-orange-500 text-orange-300 shadow-[0_0_10px_rgba(234,88,12,0.3)]'
                    : 'bg-slate-950 border-slate-800 text-slate-400 hover:bg-slate-900'
                    }`}
                >
                  <span className="w-2 h-2 rounded-full" style={{ backgroundColor: t.color }} />
                  <span>{t.label}</span>
                </button>
              ))}
            </div>
          </div>

          <div>
            <div className="flex justify-between text-[10px] text-slate-400 mb-1 font-bold">
              <span>Subterranean Depth</span>
              <span className="font-mono text-orange-400">-{infraDraftDepth}m Below Surface</span>
            </div>
            <input
              type="range"
              min="2"
              max="25"
              step="0.5"
              value={infraDraftDepth}
              onChange={e => setInfraDraftDepth(parseFloat(e.target.value))}
              className="w-full accent-orange-500"
            />
          </div>

          <div className="flex gap-2">
            <button
              type="button"
              onClick={() => setInfraDrawingActive(!infraDrawingActive)}
              className={`flex-1 py-2 px-3 rounded-lg text-xs font-bold border transition-colors flex items-center justify-center gap-1.5 cursor-pointer ${infraDrawingActive
                ? 'bg-green-600 text-white border-green-500 shadow-[0_0_15px_rgba(34,197,94,0.3)]'
                : 'bg-orange-600/30 hover:bg-orange-600/50 text-orange-300 border-orange-500/40'
                }`}
            >
              <MousePointerClick className="w-4 h-4" />
              <span>{infraDrawingActive ? 'Drawing Active (Click Ground)' : 'Interactive Ground Plotting'}</span>
            </button>
            <button
              type="button"
              onClick={handleQuickPresetPipeline}
              className="py-2 px-3 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-bold border border-slate-700 transition-colors cursor-pointer"
            >
              ⚡ Quick Pipeline
            </button>
          </div>

          {infraDraftPoints.length > 0 && (
            <div className="p-2.5 rounded-lg bg-slate-950 border border-slate-800 space-y-2 text-xs">
              <div className="flex justify-between font-bold text-slate-300">
                <span>Waypoints Plotted ({infraDraftPoints.length})</span>
                <span className="text-orange-400">-{infraDraftDepth}m depth</span>
              </div>
              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={undoLastInfraDraftPoint}
                  className="flex-1 py-1 px-2 rounded bg-slate-800 hover:bg-slate-700 text-slate-300 text-[10px] font-bold border border-slate-700"
                >
                  Undo Point
                </button>
                <button
                  type="button"
                  onClick={clearInfraDraftPoints}
                  className="py-1 px-2 rounded bg-red-950/40 hover:bg-red-900/40 text-red-300 text-[10px] font-bold border border-red-500/30"
                >
                  Clear All
                </button>
              </div>

              {infraDraftPoints.length >= 2 && (
                <button
                  type="button"
                  onClick={handleDeployPlottedPipeline}
                  className="w-full py-2 px-3 rounded-lg bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white font-bold text-xs shadow-[0_0_15px_rgba(16,185,129,0.4)] flex items-center justify-center gap-1.5 transition-all cursor-pointer"
                >
                  <CheckCircle2 className="w-4 h-4" />
                  <span>Deploy & Save Plotted Pipeline ({infraDraftPoints.length} Points)</span>
                </button>
              )}
            </div>
          )}
        </div>
      )}

      {/* 2. SUBTERRANEAN ASSETS */}
      {activeSection === 'assets' && (
        <div className="space-y-3">
          <div>
            <label className="block text-[10px] uppercase font-bold text-slate-400 mb-1">Asset Category</label>
            <select
              value={assetType}
              onChange={e => setAssetType(e.target.value)}
              className="w-full bg-slate-950 border border-slate-700 rounded-lg px-2.5 py-1.5 text-xs text-slate-200 focus:outline-none focus:border-purple-500"
            >
              <option value="well">Historical Water Well</option>
              <option value="septic_tank">Septic Tank / Bioreactor</option>
              <option value="water_reservoir">Rainwater Harvesting Sump</option>
              <option value="bunker">Protected Chamber / Bunker</option>
              <option value="gas_vault">High-Pressure Gas Vault</option>
              <option value="fiber_chamber">Optical Fiber Splicing Chamber</option>
            </select>
          </div>

          <div>
            <label className="block text-[10px] uppercase font-bold text-slate-400 mb-1">Asset Label</label>
            <input
              type="text"
              value={assetLabel}
              onChange={e => setAssetLabel(e.target.value)}
              className="w-full bg-slate-950 border border-slate-700 rounded-lg px-2.5 py-1.5 text-xs text-slate-200 focus:outline-none focus:border-purple-500 font-medium"
            />
          </div>

          <div>
            <div className="flex justify-between text-[10px] text-slate-400 mb-1 font-bold">
              <span>Subterranean Depth</span>
              <span className="font-mono text-purple-400">-{assetDepth}m</span>
            </div>
            <input
              type="range"
              min="4"
              max="30"
              value={assetDepth}
              onChange={e => setAssetDepth(parseInt(e.target.value))}
              className="w-full accent-purple-500"
            />
          </div>

          <button
            type="button"
            onClick={handleAddAsset}
            className="w-full py-2.5 px-3 rounded-lg bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-white font-bold text-xs shadow-[0_0_15px_rgba(168,85,247,0.3)] transition-all flex items-center justify-center gap-2 cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            <span>Register Subterranean Asset on Map</span>
          </button>
        </div>
      )}

      {/* 3. GPR RADAR SCANNER */}
      {activeSection === 'gpr' && (
        <div>
          <GPRScanner />
        </div>
      )}
    </div>
  );
};

// ─── TAB 6: DATA COMPARISON ──────────────────────────────────────────────────
const ComparisonForm = () => {
  const { t } = useTranslation();
  const { buildings, selectedBuilding, comparisonResults, runDataComparison } = useStore();
  const targetBuilding = buildings.find(b => b.id === selectedBuilding) || buildings[0];

  const handleCompare = () => {
    if (targetBuilding) runDataComparison(targetBuilding.id);
  };

  const results = comparisonResults?.length ? comparisonResults : [
    { type: 'floor_mismatch', severity: 'critical', message: 'Floor Count Mismatch Flagged', details: 'Sanctioned master plan permits 5 floors. LiDAR point cloud extracted 8 physical floors (+3 unauthorized).' },
    { type: 'boundary_mismatch', severity: 'critical', message: 'Setback Boundary Encroachment', details: 'Building footprint is 440 m², exceeding the delineated 2D cadastral boundary (360 m²) by 22.2%.' },
    { type: 'position_mismatch', severity: 'warning', message: 'Spatial Centroid Deviation', details: 'Centroid offset 2.4m south-east towards public road easement.' },
    { type: 'clash_detected', severity: 'critical', message: 'Sub-Surface Utility Clash', details: 'Basement depth extends -6.0m, intersecting municipal Gas Line buffer (-4.5m).' }
  ];

  return (
    <div className="space-y-3.5">
      <div className="border-b border-slate-700/60 pb-2">
        <h3 className="text-sm font-bold text-slate-100 flex items-center gap-2">
          <GitCompare className="w-4 h-4 text-emerald-400" />
          <span>{t('datasurvey.headers.comparison')}</span>
        </h3>
        <p className="text-[11px] text-slate-400 mt-0.5 leading-relaxed">
          Cross-examine sanctioned 2D property titles against ground-truth 3D LiDAR & Drone surveys.
        </p>
      </div>

      <button
        type="button"
        onClick={handleCompare}
        className="w-full py-2 px-3 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs shadow-[0_0_15px_rgba(16,185,129,0.3)] transition-all flex items-center justify-center gap-1.5 cursor-pointer"
      >
        <RefreshCw className="w-3.5 h-3.5" />
        <span>Re-run Spatial Comparison & Clash Detection</span>
      </button>

      <div className="space-y-2">
        {results.map((r, idx) => {
          const isCrit = r.severity === 'critical';
          const isWarn = r.severity === 'warning';

          return (
            <div
              key={idx}
              className={`p-3 rounded-xl border text-xs space-y-1 ${isCrit
                ? 'bg-red-950/40 border-red-500/60 text-red-200 shadow-[0_0_12px_rgba(239,68,68,0.2)]'
                : isWarn
                  ? 'bg-yellow-950/40 border-yellow-500/60 text-yellow-200'
                  : 'bg-emerald-950/40 border-emerald-500/60 text-emerald-200'
                }`}
            >
              <div className="flex items-center justify-between font-bold">
                <span className="flex items-center gap-1.5">
                  {isCrit ? '🔴 ⚠' : isWarn ? '🟡 ⚠' : '🟢 ✓'}
                  <span>{r.message}</span>
                </span>
                <span className="text-[10px] uppercase font-mono px-1.5 py-0.2 rounded bg-black/40">
                  {r.severity}
                </span>
              </div>
              <p className="text-[11px] opacity-90 leading-relaxed">{r.details}</p>
            </div>
          );
        })}
      </div>
    </div>
  );
};

// ─── TAB 7: BLOCKCHAIN VERIFICATION ──────────────────────────────────────────
const BlockchainForm = () => {
  const { t } = useTranslation();
  const { buildings, selectedBuilding, blockchainRecords, createBlockchainRecord } = useStore();
  const [copied, setCopied] = useState(false);
  const targetBuilding = buildings.find(b => b.id === selectedBuilding) || buildings[0];

  const handleVerify = async () => {
    if (targetBuilding) {
      await createBlockchainRecord(targetBuilding.id);
    }
  };

  const sampleHash = blockchainRecords?.[0]?.hash || '0x8f2d4e8b3a1c9027e1f408bd65a3194ec89f104d55b89a310c92e7b8a531d044';

  const handleCopy = () => {
    navigator.clipboard?.writeText(sampleHash);
    setCopied(true);
    setTimeout(() => setCopied(false), 1500);
  };

  return (
    <div className="space-y-3.5">
      <div className="border-b border-slate-700/60 pb-2">
        <h3 className="text-sm font-bold text-slate-100 flex items-center gap-2">
          <Shield className="w-4 h-4 text-emerald-400" />
          <span>{t('datasurvey.headers.blockchain')}</span>
        </h3>
        <p className="text-[11px] text-slate-400 mt-0.5 leading-relaxed">
          Mint immutable SHA-256 cryptographic proof hashes of surveyed vertical cadastre parcels to guarantee non-repudiation.
        </p>
      </div>

      <button
        type="button"
        onClick={handleVerify}
        className="w-full py-2.5 px-3 rounded-lg bg-gradient-to-r from-emerald-600 to-green-600 hover:from-emerald-500 hover:to-green-500 text-white font-bold text-xs shadow-[0_0_20px_rgba(16,185,129,0.35)] transition-all flex items-center justify-center gap-2 cursor-pointer"
      >
        <Shield className="w-4 h-4" />
        <span>🔐 Generate & Mint Verification Hash</span>
      </button>

      {/* Verified Certificate Card */}
      <div className="p-3.5 rounded-xl bg-slate-950/90 border border-emerald-500/60 shadow-[0_0_20px_rgba(16,185,129,0.25)] space-y-2.5">
        <div className="flex items-center justify-between border-b border-slate-800 pb-2">
          <span className="text-xs font-bold text-white">Cryptographic Survey Proof</span>
          <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-emerald-950 border border-emerald-400 text-emerald-300 animate-pulse">
            🔗 BLOCKCHAIN VERIFIED
          </span>
        </div>

        <div>
          <span className="text-[10px] uppercase font-bold text-slate-400 block mb-1">SHA-256 Proof Digest</span>
          <div className="flex items-center gap-2 p-2 rounded bg-slate-900 border border-slate-800 font-mono text-[10px] text-emerald-400 break-all">
            <span className="flex-1">{sampleHash}</span>
            <button
              type="button"
              onClick={handleCopy}
              className="px-2 py-1 bg-slate-800 hover:bg-slate-700 text-white rounded text-[9px] font-bold shrink-0 border border-slate-700 transition-colors"
            >
              {copied ? 'Copied ✓' : 'Copy'}
            </button>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-2 text-xs">
          <div className="p-2 rounded bg-slate-900/60 border border-slate-800">
            <span className="block text-[9px] uppercase text-slate-400">Block Height</span>
            <span className="font-mono text-slate-200 font-bold">#1,492,804</span>
          </div>
          <div className="p-2 rounded bg-slate-900/60 border border-slate-800">
            <span className="block text-[9px] uppercase text-slate-400">Surveyor ID</span>
            <span className="font-mono text-emerald-300 font-bold">OFFICER-DS-7821</span>
          </div>
        </div>
      </div>
    </div>
  );
};

// ─── TAB 8: MAYOR / CITY OVERVIEW DASHBOARD ──────────────────────────────────
const CityOverviewDashboard = () => {
  const { t } = useTranslation();
  const {
    importedParcels,
    buildings,
    infrastructure,
    undergroundFeatures,
    populateAllParcelsWithBuildings,
    delineateParcels,
    setSelectedParcel,
    focusCameraOn,
    addAlert,
    sendMapToCorporator,
    sharedMaps,
    cityRegions
  } = useStore();

  const [activeWardFilter, setActiveWardFilter] = useState('all');
  const [showAuditCertModal, setShowAuditCertModal] = useState(false);
  const [selectedSendRegion, setSelectedSendRegion] = useState('');
  const [lastSentMap, setLastSentMap] = useState(null);

  const totalPlots = importedParcels?.length || 0;
  const matchedPlots = importedParcels?.filter(p => p.status === 'matched').length || 0;
  const pendingPlots = Math.max(0, totalPlots - matchedPlots);
  const complianceRate = totalPlots > 0 ? Math.round((matchedPlots / totalPlots) * 100) : 0;

  const totalPipelines = infrastructure?.length || 0;
  const totalSubAssets = undergroundFeatures?.length || 0;

  // Ward grouping (12 plots divided into 3 wards)
  const ward1Parcels = (importedParcels || []).slice(0, 4);
  const ward2Parcels = (importedParcels || []).slice(4, 8);
  const ward3Parcels = (importedParcels || []).slice(8);

  let displayedParcels = importedParcels || [];
  if (activeWardFilter === 'ward1') displayedParcels = ward1Parcels;
  else if (activeWardFilter === 'ward2') displayedParcels = ward2Parcels;
  else if (activeWardFilter === 'ward3') displayedParcels = ward3Parcels;

  const handlePopulateCity = async () => {
    if (totalPlots === 0) {
      delineateParcels(USER_TWELVE_PLOTS);
      setTimeout(() => {
        populateAllParcelsWithBuildings();
      }, 250);
    } else {
      populateAllParcelsWithBuildings();
    }
  };

  const handleGenerateAuditCert = () => {
    setShowAuditCertModal(true);
    addAlert({
      type: 'success',
      title: '📜 Municipal Compliance Audit Generated',
      message: `Audit Certificate issued for Cadastre Ward #101-112 with ${complianceRate}% compliance rate.`
    });
  };

  return (
    <div className="space-y-3.5">
      <div className="border-b border-slate-700/60 pb-2">
        <h3 className="text-sm font-bold text-slate-100 flex items-center gap-2">
          <BarChart3 className="w-4 h-4 text-emerald-400" />
          <span>{t('datasurvey.headers.cityOverview')}</span>
        </h3>
        <p className="text-[11px] text-slate-400 mt-0.5 leading-relaxed">
          Executive municipal status overview for urban cadastre verification and compliance monitoring.
        </p>
      </div>

      {/* 4 Dynamic Live Stat Cards */}
      <div className="grid grid-cols-2 gap-2">
        <div
          onClick={() => focusCameraOn && focusCameraOn([22, 0, 50])}
          className="p-3 rounded-xl bg-blue-950/40 border border-blue-500/40 space-y-1 text-left cursor-pointer hover:border-blue-400 transition-all"
        >
          <span className="text-[10px] font-bold text-blue-400 uppercase">Plots Delineated</span>
          <span className="text-xl font-bold text-white font-mono block">{totalPlots}</span>
          <span className="text-[9px] text-slate-400">
            {totalPlots > 0 ? `${totalPlots} Cadastral Parcels Active` : 'No parcels loaded (Load in Tab 1)'}
          </span>
        </div>

        <div
          onClick={handlePopulateCity}
          className="p-3 rounded-xl bg-emerald-950/40 border border-emerald-500/40 space-y-1 text-left cursor-pointer hover:border-emerald-400 transition-all"
        >
          <span className="text-[10px] font-bold text-emerald-400 uppercase">3D Models Placed</span>
          <span className="text-xl font-bold text-emerald-300 font-mono block">{matchedPlots}</span>
          <span className="text-[9px] text-emerald-400/80">
            {matchedPlots === totalPlots && totalPlots > 0 ? '100% Fully Matched ✓' : 'Click to Auto-Place All ⚡'}
          </span>
        </div>

        <div className="p-3 rounded-xl bg-yellow-950/40 border border-yellow-500/40 space-y-1 text-left">
          <span className="text-[10px] font-bold text-yellow-400 uppercase">Pending Verification</span>
          <span className="text-xl font-bold text-yellow-300 font-mono block">{pendingPlots}</span>
          <span className="text-[9px] text-yellow-400/80">{pendingPlots > 0 ? `${pendingPlots} plots awaiting 3D model` : 'All plots verified!'}</span>
        </div>

        <div className="p-3 rounded-xl bg-indigo-950/40 border border-indigo-500/40 space-y-1 text-left">
          <span className="text-[10px] font-bold text-indigo-400 uppercase">Underground Utilities</span>
          <span className="text-xl font-bold text-indigo-300 font-mono block">{totalPipelines + totalSubAssets}</span>
          <span className="text-[9px] text-indigo-400/80">{totalPipelines} pipelines • {totalSubAssets} sub-assets</span>
        </div>
      </div>

      {/* Verification Progress Bar */}
      <div className="p-3 rounded-xl bg-slate-950/80 border border-slate-800 space-y-2 shadow-inner">
        <div className="flex justify-between text-xs font-bold text-slate-300">
          <span>Cadastral Compliance Rate</span>
          <span className={`font-mono font-bold ${complianceRate === 100 ? 'text-emerald-400' : 'text-amber-400'}`}>
            {complianceRate}%
          </span>
        </div>
        <div className="h-2.5 w-full bg-slate-800 rounded-full overflow-hidden flex">
          <div
            style={{ width: `${Math.max(6, complianceRate)}%` }}
            className={`transition-all duration-700 ${complianceRate === 100
              ? 'bg-gradient-to-r from-emerald-500 to-teal-400 shadow-[0_0_12px_rgba(16,185,129,0.5)]'
              : 'bg-gradient-to-r from-amber-500 to-emerald-500'
              }`}
          />
        </div>
        <div className="flex justify-between text-[9px] font-mono text-slate-400 pt-0.5">
          <span className="text-emerald-400 font-bold">● {matchedPlots} 3D Matched</span>
          <span className="text-yellow-400 font-bold">● {pendingPlots} Pending Scan</span>
          <span className="text-cyan-400 font-bold">● {totalPlots} Total Registered</span>
        </div>
      </div>

      {/* Mayor Executive Actions Bar */}
      <div className="flex gap-2">
        <button
          type="button"
          onClick={handlePopulateCity}
          className="flex-1 py-2 px-2.5 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white font-bold text-xs rounded-lg shadow-[0_0_15px_rgba(16,185,129,0.35)] flex items-center justify-center gap-1.5 cursor-pointer transition-all"
        >
          <Sparkles className="w-3.5 h-3.5 text-amber-300" />
          <span>⚡ Auto-Populate Full City (100%)</span>
        </button>
        <button
          type="button"
          onClick={handleGenerateAuditCert}
          className="flex-1 py-2 px-2.5 bg-slate-800 hover:bg-slate-700 text-slate-200 font-bold text-xs rounded-lg border border-slate-700 flex items-center justify-center gap-1.5 cursor-pointer transition-colors"
        >
          <FileText className="w-3.5 h-3.5 text-cyan-400" />
          <span>📜 Audit Certificate</span>
        </button>
      </div>

      {/* Municipal Wards Filter & Plot Roster */}
      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <span className="text-[10px] font-bold uppercase text-slate-400 tracking-wider">
            Municipal Ward Breakdown
          </span>
          <div className="flex gap-1 text-[9px]">
            {[
              { id: 'all', label: 'All Wards' },
              { id: 'ward1', label: 'Ward A (West)' },
              { id: 'ward2', label: 'Ward B (Central)' },
              { id: 'ward3', label: 'Ward C (North)' },
            ].map(tab => (
              <button
                key={tab.id}
                type="button"
                onClick={() => setActiveWardFilter(tab.id)}
                className={`px-1.5 py-0.5 rounded transition-colors ${activeWardFilter === tab.id
                  ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 font-bold'
                  : 'text-slate-400 hover:text-slate-200'
                  }`}
              >
                {tab.label}
              </button>
            ))}
          </div>
        </div>

        {/* Parcels in active ward */}
        <div className="grid grid-cols-2 gap-1.5 max-h-36 overflow-y-auto pr-1">
          {displayedParcels.map(p => {
            const isMatched = p.status === 'matched';
            return (
              <div
                key={p.id}
                onClick={() => {
                  setSelectedParcel(p.id);
                  const poly = p.polygon || p.points || p.corners || [];
                  const cx = poly.reduce((s, pt) => s + pt.x, 0) / (poly.length || 1);
                  const cz = poly.reduce((s, pt) => s + pt.z, 0) / (poly.length || 1);
                  focusCameraOn([cx, 12, cz]);
                }}
                className={`p-1.5 rounded-lg border text-[10px] cursor-pointer transition-all flex items-center justify-between ${isMatched
                  ? 'bg-emerald-950/40 border-emerald-500/40 text-emerald-200'
                  : 'bg-slate-900/60 border-slate-800 text-slate-300 hover:border-slate-700'
                  }`}
              >
                <div className="truncate pr-1">
                  <span className="font-bold block truncate">{p.name}</span>
                  <span className="text-[9px] text-slate-400 font-mono">{p.properties?.area || 20}m²</span>
                </div>
                <span className={`text-[8px] font-mono px-1 py-0.5 rounded font-bold ${isMatched ? 'bg-emerald-900/80 text-emerald-300' : 'bg-yellow-950/80 text-yellow-300'
                  }`}>
                  {isMatched ? '✓ CERT' : 'PENDING'}
                </span>
              </div>
            );
          })}
          {displayedParcels.length === 0 && (
            <div className="col-span-2 text-center py-4 text-[11px] text-slate-500">
              No cadastral parcels delineated yet. Click &quot;Auto-Populate Full City&quot; above!
            </div>
          )}
        </div>
      </div>

      {/* Official Audit Certificate Modal */}
      {showAuditCertModal && (
        <div className="p-3.5 rounded-xl bg-slate-950 border-2 border-emerald-400 shadow-[0_0_25px_rgba(16,185,129,0.35)] space-y-2 text-white">
          <div className="flex items-center justify-between border-b border-slate-800 pb-2">
            <div className="flex items-center gap-2">
              <span className="text-base">🏛️</span>
              <div>
                <span className="text-xs font-bold text-emerald-300 block">MUNICIPAL CORPORATION CADASTRAL AUDIT</span>
                <span className="text-[9px] text-slate-400 font-mono">Government of Maharashtra • Urban Development Dept</span>
              </div>
            </div>
            <button
              type="button"
              onClick={() => setShowAuditCertModal(false)}
              className="p-1 text-slate-400 hover:text-white"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          <div className="text-[10px] space-y-1.5 text-slate-300">
            <div className="flex justify-between font-mono bg-slate-900/70 p-2 rounded border border-slate-800">
              <span>CERTIFICATE ID:</span>
              <span className="text-emerald-400 font-bold">MC-URD-2026-PUN-{Date.now().toString().slice(-6)}</span>
            </div>
            <div className="flex justify-between font-mono">
              <span className="text-slate-400">Total Survey Deeds:</span>
              <span className="font-bold text-white">{totalPlots} Parcels</span>
            </div>
            <div className="flex justify-between font-mono">
              <span className="text-slate-400">3D Digital Twin Coverage:</span>
              <span className="font-bold text-emerald-300">{matchedPlots} Completed ({complianceRate}%)</span>
            </div>
            <div className="flex justify-between font-mono">
              <span className="text-slate-400">Sub-Surface Utility Clearance:</span>
              <span className="font-bold text-cyan-300">PASSED (Zero Breach)</span>
            </div>
            <div className="flex justify-between font-mono">
              <span className="text-slate-400">Tax Assessment Readiness:</span>
              <span className="font-bold text-emerald-400">100% Tax Tier Certified</span>
            </div>
          </div>

          <div className="pt-2 border-t border-slate-800 flex justify-between items-center text-[9px] font-mono text-slate-400">
            <span>Official Stamp: VERIFIED ✓</span>
            <button
              type="button"
              onClick={() => setShowAuditCertModal(false)}
              className="px-2.5 py-1 bg-emerald-600 hover:bg-emerald-500 text-white font-bold rounded text-[10px]"
            >
              Done
            </button>
          </div>
        </div>
      )}

      {/* Send 3D Map to Corporator Section */}
      <div className="mt-4 border-t border-slate-700/60 pt-4">
        <h3 className="text-sm font-bold text-slate-100 flex items-center gap-2 mb-3">
          <span>📤</span>
          <span>Send 3D Map to Corporator</span>
        </h3>
        <div className="bg-slate-800/60 border border-emerald-500/30 rounded-xl p-4 space-y-3">
          <div className="flex items-center gap-2 mb-2">
            <div className={`w-2.5 h-2.5 rounded-full ${buildings?.length > 0 ? 'bg-emerald-500' : 'bg-slate-500'}`} />
            <span className="text-xs text-slate-300">
              {buildings?.length > 0 ? '3D Map Ready' : 'No 3D Data Yet'}
            </span>
          </div>

          <select
            value={selectedSendRegion}
            onChange={(e) => setSelectedSendRegion(e.target.value)}
            className="w-full bg-slate-900 border border-slate-700 text-white rounded-lg p-2 text-xs"
          >
            <option value="">Select Region...</option>
            {cityRegions?.filter(r => r.id !== 'demo_ward').map(region => (
              <option key={region.id} value={region.id}>
                {region.zone.toUpperCase()} - {region.name} ({region.corporator})
              </option>
            ))}
          </select>

          <button
            type="button"
            disabled={!selectedSendRegion || !buildings || buildings.length === 0}
            onClick={() => {
              if (selectedSendRegion && buildings?.length > 0) {
                sendMapToCorporator(selectedSendRegion);
                const region = cityRegions?.find(r => r.id === selectedSendRegion);
                if (region) {
                  setLastSentMap({ corporator: region.corporator, regionName: region.name });
                  setTimeout(() => setLastSentMap(null), 5000);
                }
                setSelectedSendRegion('');
              }
            }}
            className="w-full bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 disabled:opacity-50 disabled:cursor-not-allowed text-white rounded-lg px-4 py-2 font-bold text-xs transition-all"
          >
            Send 3D Map
          </button>

          {lastSentMap && (
            <div className="bg-emerald-950/60 border border-emerald-500/40 rounded-lg p-3 text-xs text-emerald-200">
              ✅ 3D Map sent to {lastSentMap.corporator} — {lastSentMap.regionName}
            </div>
          )}

          {sharedMaps && sharedMaps.length > 0 && (
            <div className="pt-3 border-t border-slate-700/50 mt-3">
              <span className="text-[10px] uppercase font-bold text-slate-400 block mb-2">Sent Maps History</span>
              <div className="space-y-2 max-h-32 overflow-y-auto pr-1">
                {sharedMaps.map(map => (
                  <div key={map.id} className="bg-slate-900/60 p-2 rounded border border-slate-800 text-[10px]">
                    <div className="flex justify-between text-slate-300 font-bold mb-1">
                      <span>{map.corporator}</span>
                      <span className="text-slate-500">{new Date(map.timestamp).toLocaleTimeString()}</span>
                    </div>
                    <div className="text-slate-400">{map.regionName}</div>
                    <div className="flex gap-3 mt-1 text-emerald-400/80">
                      <span>🏢 {map.stats?.buildings ?? map.buildingCount ?? 0} buildings</span>
                      <span>🗺️ {map.stats?.parcels ?? map.parcelCount ?? 0} parcels</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

// ─── 9. SEND 3D MAP TO CORPORATOR (WHATSAPP-STYLE TARGETED SHARING) ────────
const SendMapToCorporatorForm = () => {
  const { t } = useTranslation();
  const cityRegions = useStore(state => state.cityRegions) || [];
  const sendMapToCorporator = useStore(state => state.sendMapToCorporator);
  const sharedMaps = useStore(state => state.sharedMaps) || [];
  const buildings = useStore(state => state.buildings) || [];
  const importedParcels = useStore(state => state.importedParcels) || [];
  const infrastructure = useStore(state => state.infrastructure) || [];
  const undergroundFeatures = useStore(state => state.undergroundFeatures) || [];

  const [selectedRegionId, setSelectedRegionId] = useState('greenpark');
  const [zoneFilter, setZoneFilter] = useState('all');
  const [successInfo, setSuccessInfo] = useState(null);

  const selectedTarget = cityRegions.find(r => r.id === selectedRegionId) || cityRegions[0];

  const surveyBuildings = buildings.filter(b =>
    b.isSurvey || b.sourceType === 'LiDAR' || b.sourceType === 'drone' || b.autoAligned || b.isSurveyAsset
  );
  const effectiveBuildingsCount = surveyBuildings.length > 0 ? surveyBuildings.length : buildings.length;
  const parcelCount = importedParcels.length;

  const filteredRegions = zoneFilter === 'all'
    ? cityRegions
    : cityRegions.filter(r => r.zone === zoneFilter);

  const handleSend = () => {
    if (!selectedRegionId) return;
    sendMapToCorporator(selectedRegionId);
    setSuccessInfo({
      corporator: selectedTarget.corporator,
      region: selectedTarget.name,
      time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    });
    setTimeout(() => {
      setSuccessInfo(null);
    }, 8000);
  };

  return (
    <div className="space-y-4">
      {/* Header Banner */}
      <div className="p-3.5 rounded-2xl bg-gradient-to-r from-emerald-950/80 via-slate-900 to-teal-950/80 border-2 border-emerald-500/60 shadow-[0_0_25px_rgba(16,185,129,0.25)] space-y-2">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="w-8 h-8 rounded-xl bg-emerald-500/20 border border-emerald-400/40 flex items-center justify-center text-emerald-300">
              <Send className="w-4 h-4" />
            </span>
            <div>
              <h3 className="text-sm font-bold text-white tracking-wide">
                {t('datasurvey.headers.sendMap')}
              </h3>
              <p className="text-[10px] text-emerald-300 font-mono">
                Direct Cadastral Handshake • Targeted Delivery
              </p>
            </div>
          </div>
          <span className="text-[9px] font-mono px-2 py-0.5 rounded-full bg-emerald-900/60 border border-emerald-400/50 text-emerald-200 font-bold">
            WHATSAPP DISPATCH
          </span>
        </div>
        <p className="text-xs text-slate-300 leading-relaxed">
          Package the active 3D cadastral digital twin and send it directly to a specific Ward Corporator.
        </p>
      </div>

      {/* Payload Summary Telemetry */}
      <div className="p-3 rounded-xl bg-slate-950/70 border border-slate-800 space-y-2">
        <div className="flex items-center justify-between">
          <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
            📦 Survey Package Payload
          </span>
          <span className={`text-[10px] font-mono font-bold flex items-center gap-1 ${effectiveBuildingsCount > 0 || parcelCount > 0 ? 'text-emerald-400' : 'text-yellow-400'
            }`}>
            <span className={`w-2 h-2 rounded-full ${effectiveBuildingsCount > 0 || parcelCount > 0 ? 'bg-emerald-400 animate-ping' : 'bg-yellow-400'}`} />
            {effectiveBuildingsCount > 0 || parcelCount > 0 ? '3D DATA READY TO DISPATCH' : 'GREENFIELD (0 ASSETS)'}
          </span>
        </div>

        <div className="grid grid-cols-3 gap-2 text-xs font-mono">
          <div className="p-2 rounded-lg bg-slate-900 border border-slate-800 text-center">
            <span className="text-[9px] text-slate-500 block">3D TOWERS</span>
            <span className="text-cyan-300 font-bold text-sm">{effectiveBuildingsCount}</span>
          </div>
          <div className="p-2 rounded-lg bg-slate-900 border border-slate-800 text-center">
            <span className="text-[9px] text-slate-500 block">2D PARCELS</span>
            <span className="text-emerald-300 font-bold text-sm">{parcelCount}</span>
          </div>
          <div className="p-2 rounded-lg bg-slate-900 border border-slate-800 text-center">
            <span className="text-[9px] text-slate-500 block">SUB-ASSETS</span>
            <span className="text-purple-300 font-bold text-sm">{infrastructure.length + undergroundFeatures.length}</span>
          </div>
        </div>
      </div>

      {/* Zone Filter Pill Selector */}
      <div className="space-y-1.5">
        <div className="flex items-center justify-between">
          <label className="text-[10px] uppercase font-bold text-slate-400 tracking-wider">
            Select Recipient Corporator
          </label>
          <div className="flex gap-1 text-[9px]">
            {['all', 'north', 'south', 'east', 'west', 'central'].map(zone => (
              <button
                key={zone}
                type="button"
                onClick={() => setZoneFilter(zone)}
                className={`px-1.5 py-0.5 rounded capitalize transition-colors ${zoneFilter === zone
                  ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/50 font-bold'
                  : 'text-slate-500 hover:text-slate-300'
                  }`}
              >
                {zone}
              </button>
            ))}
          </div>
        </div>

        {/* Corporator Roster Grid */}
        <div className="grid grid-cols-2 gap-2 max-h-52 overflow-y-auto pr-1">
          {filteredRegions.map(reg => {
            const isSelected = selectedRegionId === reg.id;
            return (
              <div
                key={reg.id}
                onClick={() => setSelectedRegionId(reg.id)}
                className={`p-2.5 rounded-xl border text-xs cursor-pointer transition-all ${isSelected
                  ? 'bg-gradient-to-b from-emerald-950/80 to-slate-900 border-2 border-emerald-400 text-white shadow-[0_0_18px_rgba(16,185,129,0.35)] scale-[1.02]'
                  : 'bg-slate-900/60 border-slate-800 text-slate-300 hover:border-slate-700 hover:bg-slate-850'
                  }`}
              >
                <div className="flex items-center justify-between mb-1">
                  <span className="font-bold text-xs flex items-center gap-1.5">
                    <span>🏛️</span>
                    <span className="truncate">{reg.corporator}</span>
                  </span>
                  {isSelected && (
                    <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping" />
                  )}
                </div>
                <div className="text-[10px] text-slate-400 truncate font-medium">
                  {reg.name}
                </div>
                <div className="text-[9px] uppercase tracking-wider text-emerald-400/80 font-mono mt-0.5">
                  {reg.zone} ZONE
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Selected Action Card */}
      {selectedTarget && (
        <div className="p-3 rounded-xl bg-slate-950/80 border border-emerald-500/40 space-y-2">
          <div className="text-[11px] text-slate-300 flex items-center justify-between">
            <span>Target Recipient:</span>
            <strong className="text-emerald-300 font-bold">{selectedTarget.corporator} ({selectedTarget.name})</strong>
          </div>

          <button
            type="button"
            onClick={handleSend}
            className="w-full py-3 px-4 rounded-xl bg-gradient-to-r from-emerald-600 via-teal-600 to-cyan-600 hover:from-emerald-500 hover:to-cyan-500 text-white font-extrabold text-xs shadow-[0_0_25px_rgba(16,185,129,0.45)] flex items-center justify-center gap-2 transition-all cursor-pointer transform active:scale-98"
          >
            <Send className="w-4 h-4" />
            <span>Send 3D Map to {selectedTarget.corporator}</span>
          </button>

          <p className="text-[10px] text-slate-400 text-center leading-normal">
            🔒 <strong>Strict Isolation:</strong> Only Corporator <strong className="text-emerald-300">{selectedTarget.corporator}</strong> will receive this map. Other corporators (like Amit Patel) will see a blank canvas until a map is sent to them.
          </p>
        </div>
      )}

      {/* Success Banner */}
      {successInfo && (
        <div className="p-3 rounded-xl bg-emerald-950/80 border-2 border-emerald-400 text-xs text-emerald-200 shadow-[0_0_20px_rgba(16,185,129,0.3)] space-y-1 animate-in fade-in">
          <p className="font-bold text-white flex items-center gap-1.5">
            <span>✅</span>
            <span>3D Map Dispatched Successfully!</span>
          </p>
          <p className="text-[11px] text-slate-300">
            Transmitted to Corporator <strong>{successInfo.corporator}</strong> ({successInfo.region}) at {successInfo.time}. When {successInfo.corporator} logs in, she can click &quot;Import&quot; to save this map permanently!
          </p>
        </div>
      )}

      {/* Sent History */}
      {sharedMaps && sharedMaps.length > 0 && (
        <div className="space-y-2 pt-2 border-t border-slate-800">
          <span className="text-[10px] uppercase font-bold text-slate-400 block tracking-wider">
            Dispatched Transmissions History
          </span>
          <div className="space-y-2 max-h-36 overflow-y-auto pr-1">
            {sharedMaps.map(m => (
              <div key={m.id} className="p-2.5 rounded-lg bg-slate-950/70 border border-slate-800 text-[11px] space-y-1 font-mono">
                <div className="flex justify-between items-center text-white font-bold">
                  <span className="flex items-center gap-1.5">
                    <span>📤</span>
                    <span>{m.targetCorporator} ({m.targetRegionName})</span>
                  </span>
                  <span className={`text-[9px] px-1.5 py-0.2 rounded font-bold uppercase border ${m.status === 'imported'
                    ? 'bg-purple-950/60 text-purple-300 border-purple-500/40'
                    : 'bg-emerald-950/80 text-emerald-300 border-emerald-500/60'
                    }`}>
                    {m.status === 'imported' ? '✓ IMPORTED' : 'PENDING IMPORT'}
                  </span>
                </div>
                <div className="flex justify-between text-[10px] text-slate-400">
                  <span>{m.buildingCount || 0} Buildings • {m.parcelCount || 0} Parcels</span>
                  <span className="text-slate-500">{m.displayTime || new Date(m.timestamp).toLocaleTimeString()}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

// ─── MAIN FLOATING DATA & SURVEY OFFICER PANEL ───────────────────────────────
export default function DataSurveyPanel() {
  const { t } = useTranslation();
  const {
    userRole,
    dataSurveyMode,
    setDataSurveyMode,
    dataSurveyConsoleOpen,
    setDataSurveyConsoleOpen,
    dataSurveyConsoleMinimized,
    setDataSurveyConsoleMinimized
  } = useStore();

  const [isMaximized, setIsMaximized] = useState(false);

  // The panel's non-maximized height is capped at 78vh (see className below).
  // When the user drags it down, its top offset (position.y) must leave at
  // least that much room to the bottom of the viewport, or the OSM picker
  // map near the bottom of the console's content gets clipped by the
  // viewport edge with no way to scroll the page to reach it (the app
  // disables body scroll). This clamp is reused for the initial position
  // (including whatever was last saved to localStorage), every drag move,
  // window resizes, and the reset action, so it always holds regardless of
  // where the panel was last left.
  const PANEL_MAX_HEIGHT_VH = 0.78;
  const clampPosition = (x, y) => {
    const maxY = Math.max(10, window.innerHeight * (1 - PANEL_MAX_HEIGHT_VH) - 10);
    return {
      x: Math.max(10, Math.min(window.innerWidth - 490, x)),
      y: Math.max(10, Math.min(maxY, y)),
    };
  };

  const [position, setPosition] = useState(() => {
    try {
      const saved = localStorage.getItem('urdhva-datasurvey-panel-pos');
      if (saved) {
        const parsed = JSON.parse(saved);
        return clampPosition(parsed.x, parsed.y);
      }
    } catch (e) {
      console.error(e);
    }
    return clampPosition(380, 80);
  });

  // Re-clamp if the viewport is resized smaller after the panel was
  // positioned (e.g. shrinking the browser window), so it never ends up
  // stuck below the visible area.
  useEffect(() => {
    const handleResize = () => {
      setPosition(prev => clampPosition(prev.x, prev.y));
    };
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  const [isDragging, setIsDragging] = useState(false);
  const dragRef = useRef({ startX: 0, startY: 0, initialX: 0, initialY: 0 });

  const handleMouseDown = (e) => {
    if (isMaximized) return;
    if (e.target.closest('button') || e.target.closest('input') || e.target.closest('select')) return;
    setIsDragging(true);
    dragRef.current = {
      startX: e.clientX,
      startY: e.clientY,
      initialX: position.x,
      initialY: position.y
    };
  };

  const handleMouseMove = (e) => {
    if (!isDragging) return;
    const dx = e.clientX - dragRef.current.startX;
    const dy = e.clientY - dragRef.current.startY;
    setPosition(clampPosition(dragRef.current.initialX + dx, dragRef.current.initialY + dy));
  };

  const handleMouseUp = () => {
    if (isDragging) {
      setIsDragging(false);
      localStorage.setItem('urdhva-datasurvey-panel-pos', JSON.stringify(position));
    }
  };

  useEffect(() => {
    if (isDragging) {
      window.addEventListener('mousemove', handleMouseMove);
      window.addEventListener('mouseup', handleMouseUp);
    } else {
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mouseup', handleMouseUp);
    }
    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mouseup', handleMouseUp);
    };
  }, [isDragging, position]);

  const resetPosition = () => {
    setIsMaximized(false);
    const defaultPos = clampPosition(380, 80);
    setPosition(defaultPos);
    localStorage.setItem('urdhva-datasurvey-panel-pos', JSON.stringify(defaultPos));
  };

  if (userRole !== 'datasurvey' || !dataSurveyConsoleOpen) return null;

  if (dataSurveyConsoleMinimized) {
    return (
      <div
        data-floating-panel="true"
        className="fixed bottom-6 right-6 z-[9999] pointer-events-auto bg-slate-900/95 backdrop-blur-xl border-2 border-emerald-500 rounded-xl shadow-[0_10px_30px_rgba(16,185,129,0.3)] p-3 flex items-center gap-3 cursor-pointer hover:bg-slate-800 transition-colors"
        onClick={() => setDataSurveyConsoleMinimized(false)}
      >
        <div className="w-3 h-3 rounded-full bg-emerald-400 animate-pulse" />
        <span className="text-xs font-bold text-white uppercase tracking-wider">{t('datasurvey.officerTitle')}</span>
        <Maximize2 className="w-4 h-4 text-emerald-400" />
      </div>
    );
  }

  const tabs = [
    { id: 'landBoundary', icon: MapPin, label: t('datasurvey.tabs.landBoundary') },
    { id: 'osmMap', icon: Globe, label: t('datasurvey.tabs.osmMap') },
    { id: 'lidarScan', icon: Scan, label: t('datasurvey.tabs.lidar') },
    { id: 'droneScan', icon: Plane, label: t('datasurvey.tabs.drone') },
    { id: 'occupants', icon: Users, label: t('datasurvey.tabs.occupants') },
    { id: 'underground', icon: Route, label: t('datasurvey.tabs.underground') },
    { id: 'comparison', icon: GitCompare, label: t('datasurvey.tabs.comparison') },
    { id: 'blockchain', icon: Shield, label: t('datasurvey.tabs.blockchain') },
    { id: 'cityOverview', icon: BarChart3, label: t('datasurvey.tabs.cityOverview') },
    { id: 'sendMap', icon: Send, label: `📤 ${t('datasurvey.tabs.sendMap')}` }
  ];

  return (
    <div
      data-floating-panel="true"
      style={isMaximized ? {} : { left: `${position.x}px`, top: `${position.y}px` }}
      className={isMaximized
        ? "fixed inset-3 md:inset-6 z-[9999] bg-white/98 backdrop-blur-2xl border-2 border-emerald-300 rounded-2xl shadow-2xl flex flex-col pointer-events-auto overflow-hidden animate-in fade-in zoom-in-95 duration-150"
        : "fixed w-[495px] max-h-[78vh] overflow-y-auto bg-white/98 backdrop-blur-2xl border-2 border-emerald-300/80 rounded-2xl shadow-2xl flex flex-col z-[9999] pointer-events-auto"
      }
    >
      {/* Draggable Header */}
      <div
        onMouseDown={handleMouseDown}
        className={`p-3.5 border-b border-emerald-100 flex items-center justify-between bg-emerald-50/70 select-none ${isMaximized ? 'cursor-default' : isDragging ? 'cursor-grabbing' : 'cursor-grab'}`}
      >
        <div className="flex items-center gap-2.5">
          <GripHorizontal className="w-4 h-4 text-emerald-600/80 cursor-grab hover:text-emerald-700" />
          <div className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse" />
          <div>
            <span className="text-xs font-bold text-slate-900 tracking-wider uppercase block">
              {t('datasurvey.consoleTitle')} {isMaximized && <span className="text-cyan-700 text-[10px] ml-1 font-mono">({t('datasurvey.maximizedView')})</span>}
            </span>
            <span className="text-[9px] text-emerald-700 font-mono font-semibold block">
              {t('datasurvey.consoleSubtitle')}
            </span>
          </div>
        </div>

        <div className="flex items-center gap-1.5">
          <button
            onClick={() => setDataSurveyMode('sendMap')}
            className="px-2.5 py-1 rounded-lg bg-gradient-to-r from-emerald-600 via-teal-600 to-cyan-600 hover:from-emerald-700 hover:to-cyan-700 text-white text-[10px] font-bold shadow-md shadow-emerald-500/20 flex items-center gap-1.5 transition-all cursor-pointer mr-1 active:scale-95"
            title={t('datasurvey.sendMapTooltip')}
          >
            <Send className="w-3 h-3" />
            <span>{t('datasurvey.tabs.sendMap')}</span>
          </button>
          <button
            onClick={() => setIsMaximized(!isMaximized)}
            className="p-1.5 text-slate-500 hover:text-cyan-700 rounded hover:bg-emerald-100 transition-colors cursor-pointer"
            title={isMaximized ? t('corporator.restoreWindow') : t('corporator.maximizeConsole')}
          >
            {isMaximized ? <Minimize2 className="w-3.5 h-3.5 text-cyan-600" /> : <Maximize2 className="w-3.5 h-3.5" />}
          </button>
          <button
            onClick={resetPosition}
            className="p-1.5 text-slate-500 hover:text-emerald-700 rounded hover:bg-emerald-100 transition-colors cursor-pointer"
            title={t('datasurvey.resetPosition')}
          >
            <RotateCcw className="w-3.5 h-3.5" />
          </button>
          <button
            onClick={() => setDataSurveyConsoleMinimized(true)}
            className="p-1.5 text-slate-500 hover:text-yellow-600 rounded hover:bg-slate-100 transition-colors cursor-pointer"
            title={t('datasurvey.minimize')}
          >
            <Minus className="w-3.5 h-3.5" />
          </button>
          <button
            onClick={() => setDataSurveyConsoleOpen(false)}
            className="p-1.5 text-slate-500 hover:text-red-600 rounded hover:bg-red-50 transition-colors cursor-pointer"
            title={t('datasurvey.close')}
          >
            <X className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {/* Toolbar Grid (10 tabs with Send Map) */}
      <div className="p-2.5 border-b border-slate-200 grid grid-cols-5 gap-1.5 bg-slate-50/50">
        {tabs.map(t => {
          const Icon = t.icon;
          const isActive = (dataSurveyMode || 'landBoundary') === t.id;
          return (
            <button
              key={t.id}
              onClick={() => setDataSurveyMode(t.id)}
              className={`p-2 flex flex-col items-center justify-center rounded-xl transition-all cursor-pointer ${isActive
                ? 'bg-emerald-100 border border-emerald-300 text-emerald-800 shadow-2xs font-bold'
                : 'bg-white border border-slate-200 text-slate-600 hover:bg-slate-50 hover:text-slate-900'
                }`}
            >
              <Icon className="w-4 h-4 mb-1 text-current" />
              <span className="text-[10px] font-bold leading-tight truncate max-w-[85px]">{t.label}</span>
            </button>
          );
        })}
      </div>

      {/* Active Form Content Area */}
      <div className="p-4">
        {(!dataSurveyMode || dataSurveyMode === 'landBoundary') && <LandBoundaryForm />}
        {dataSurveyMode === 'osmMap' && <PuneOsmMapSelector />}
        {dataSurveyMode === 'lidarScan' && <LidarSurveySection />}
        {dataSurveyMode === 'droneScan' && <DroneSurveySection />}
        {dataSurveyMode === 'occupants' && <FloorOccupantsForm />}
        {dataSurveyMode === 'underground' && <SubSurfaceForm />}
        {dataSurveyMode === 'comparison' && <ComparisonForm />}
        {dataSurveyMode === 'blockchain' && <BlockchainForm />}
        {dataSurveyMode === 'cityOverview' && <CityOverviewDashboard />}
        {dataSurveyMode === 'sendMap' && <SendMapToCorporatorForm />}
      </div>
    </div>
  );
}
