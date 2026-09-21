import React, { useState, useEffect, useRef } from 'react';
import useStore from '../store';
import { useTranslation } from '../utils/i18n';
import DroneUpload from './DroneUpload';
import GPRScanner from './GPRScanner';
import LidarScanner from './LidarScanner';
import {
  Building2,
  Database,
  Users,
  Plane,
  Scan,
  Settings2,
  Route,
  AlertTriangle,
  X,
  CheckCircle2,
  Info,
  AlertCircle,
  Car,
  Layers,
  ArrowDown,
  Trash2,
  Minus,
  Maximize2,
  Minimize2,
  GripHorizontal,
  RotateCcw,
  Eye,
  EyeOff,
  MousePointerClick,
  MapPin,
  Mail,
  Bell
} from 'lucide-react';

const FAMILY_COLORS = [
  '#0d9488', '#0891b2', '#2563eb', '#7c3aed',
  '#c026d3', '#e11d48', '#ea580c', '#ca8a04',
  '#16a34a', '#059669', '#0284c7', '#6d28d9',
];

const AlertIcon = ({ type }) => {
  switch (type) {
    case 'danger': return <AlertCircle className="w-4 h-4 text-red-400 flex-shrink-0" />;
    case 'warning': return <AlertTriangle className="w-4 h-4 text-yellow-400 flex-shrink-0" />;
    case 'success': return <CheckCircle2 className="w-4 h-4 text-green-400 flex-shrink-0" />;
    case 'info':
    default: return <Info className="w-4 h-4 text-cyan-400 flex-shrink-0" />;
  }
};

// ─── 1. ADD BUILDING FORM ──────────────────────────────────────────
const AddBuildingForm = () => {
  const { t } = useTranslation();
  const addNewBuilding = useStore(state => state.addNewBuilding);
  const startPlacingBuilding = useStore(state => state.startPlacingBuilding);
  const [formData, setFormData] = useState({
    name: '', width: 14, length: 12, floors: 5, actualFloors: 5, depth: 6, x: 0, z: 0, parkingFloors: 1, basementFloors: 1, shape: 'rectangle'
  });

  const getCalculatedDepth = () => {
    const subLevels = (Number(formData.parkingFloors) || 0) + (Number(formData.basementFloors) || 0);
    const calculatedDepth = subLevels * 3 || 6;
    return Number(formData.depth) >= calculatedDepth ? Number(formData.depth) : calculatedDepth;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const depthVal = getCalculatedDepth();
    await addNewBuilding({
      name: formData.name || 'New Municipal Cadastre',
      shape: formData.shape || 'rectangle',
      position: [Number(formData.x), 0, Number(formData.z)],
      width: Number(formData.width),
      length: Number(formData.length),
      floors: Number(formData.floors),
      actualFloors: Number(formData.actualFloors),
      depth: depthVal,
      actualDepth: depthVal,
      parkingFloors: Number(formData.parkingFloors),
      basementFloors: Number(formData.basementFloors)
    });
    setFormData({ name: '', width: 14, length: 12, floors: 5, actualFloors: 5, depth: 6, x: 0, z: 0, parkingFloors: 1, basementFloors: 1, shape: 'rectangle' });
  };

  const handleDragToMap = () => {
    const depthVal = getCalculatedDepth();
    const buildingName = formData.name.trim() || 'New Municipal Cadastre';
    const shape = formData.shape || 'rectangle';
    const w = Number(formData.width) || 14;
    const l = Number(formData.length) || 12;
    const flCount = Number(formData.actualFloors) || Number(formData.floors) || 5;
    const appFlCount = Number(formData.floors) || 5;

    startPlacingBuilding({
      buildingName,
      name: buildingName,
      shape,
      width: w,
      length: l,
      floors: flCount,
      floorsDetected: flCount,
      approvedFloors: appFlCount,
      actualFloors: flCount,
      depth: depthVal,
      actualDepth: depthVal,
      parkingFloors: Number(formData.parkingFloors) || 1,
      basementFloors: Number(formData.basementFloors) || 1,
      undergroundParkingDetected: (Number(formData.parkingFloors) || 1) + (Number(formData.basementFloors) || 1),
      sourceType: 'Corporator CAD',
      isCorporatorAsset: true,
      positionX: Number(formData.x) || 15,
      positionZ: Number(formData.z) || 15,
    });
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-3">
      <div className="flex items-center justify-between border-b border-slate-700/50 pb-2">
        <h3 className="text-sm font-bold text-slate-200 flex items-center gap-1.5">
          <Building2 className="w-4 h-4 text-cyan-400" /> {t('corporator.headers.addBuilding')}
        </h3>
      </div>
      <div>
        <label className="block text-[10px] uppercase font-semibold text-slate-400 mb-1">Building Name</label>
        <input
          type="text"
          required
          placeholder="e.g. Apex Horizon Tower"
          value={formData.name}
          onChange={e => setFormData({ ...formData, name: e.target.value })}
          className="w-full bg-slate-900/60 border border-slate-700 rounded px-2.5 py-1.5 text-xs text-slate-200 focus:outline-none focus:border-cyan-500"
        />
      </div>

      <div>
        <label className="block text-[10px] uppercase font-semibold text-slate-400 mb-1">Architectural Shape</label>
        <select
          value={formData.shape || 'rectangle'}
          onChange={e => setFormData({ ...formData, shape: e.target.value })}
          className="w-full bg-slate-900/60 border border-slate-700 rounded px-2.5 py-1.5 text-xs text-slate-200 focus:outline-none focus:border-cyan-500 font-mono"
        >
          <option value="rectangle">🔲 Rectangle / Cuboid</option>
          <option value="pentagon">⬟ Pentagon (5-Sided)</option>
          <option value="cylinder">⭕ Cylinder (Circular Tower)</option>
          <option value="hexagon">⬡ Hexagon (6-Sided)</option>
          <option value="l-shape">📐 L-Shaped Complex</option>
          <option value="triangle">🔺 Triangle (Flatiron Prism)</option>
          <option value="octagon">🛑 Octagon (8-Sided)</option>
        </select>
      </div>

      <div className="grid grid-cols-2 gap-2">
        <div>
          <label className="block text-[10px] text-slate-400 mb-1">Width (m)</label>
          <input type="number" min="6" max="40" required value={formData.width} onChange={e => setFormData({ ...formData, width: e.target.value })} className="w-full bg-slate-900/60 border border-slate-700 rounded px-2 py-1 text-xs text-slate-200 font-mono" />
        </div>
        <div>
          <label className="block text-[10px] text-slate-400 mb-1">Length (m)</label>
          <input type="number" min="6" max="40" required value={formData.length} onChange={e => setFormData({ ...formData, length: e.target.value })} className="w-full bg-slate-900/60 border border-slate-700 rounded px-2 py-1 text-xs text-slate-200 font-mono" />
        </div>
      </div>

      <div className="grid grid-cols-2 gap-2">
        <div>
          <label className="block text-[10px] text-slate-400 mb-1">Approved Floors</label>
          <input type="number" min="1" max="30" required value={formData.floors} onChange={e => setFormData({ ...formData, floors: e.target.value })} className="w-full bg-slate-900/60 border border-slate-700 rounded px-2 py-1 text-xs text-slate-200 font-mono text-yellow-400" />
        </div>
        <div>
          <label className="block text-[10px] text-slate-400 mb-1">Actual Floors</label>
          <input type="number" min="1" max="30" required value={formData.actualFloors} onChange={e => setFormData({ ...formData, actualFloors: e.target.value })} className="w-full bg-slate-900/60 border border-slate-700 rounded px-2 py-1 text-xs text-slate-200 font-mono text-cyan-400 font-bold" />
        </div>
      </div>

      {Number(formData.actualFloors) > Number(formData.floors) && (
        <p className="text-[10px] text-red-400 bg-red-950/40 p-1.5 rounded border border-red-500/30">
          ⚠️ Violation: Actual ({formData.actualFloors}) exceeds sanctioned ({formData.floors}). Will flag red.
        </p>
      )}

      <div className="grid grid-cols-2 gap-2">
        <div>
          <label className="block text-[10px] text-slate-400 mb-1">Underground Parking</label>
          <input type="number" min="0" max="5" required value={formData.parkingFloors} onChange={e => setFormData({ ...formData, parkingFloors: e.target.value })} className="w-full bg-slate-900/60 border border-slate-700 rounded px-2 py-1 text-xs text-slate-200 font-mono" />
        </div>
        <div>
          <label className="block text-[10px] text-slate-400 mb-1">Basements Below</label>
          <input type="number" min="0" max="5" required value={formData.basementFloors} onChange={e => setFormData({ ...formData, basementFloors: e.target.value })} className="w-full bg-slate-900/60 border border-slate-700 rounded px-2 py-1 text-xs text-slate-200 font-mono" />
        </div>
      </div>

      <div className="grid grid-cols-2 gap-2">
        <div>
          <label className="block text-[10px] text-slate-400 mb-1 flex justify-between">
            <span>Position X</span>
            <span className="text-cyan-400 font-mono">{formData.x}</span>
          </label>
          <input type="range" min="-35" max="35" value={formData.x} onChange={e => setFormData({ ...formData, x: e.target.value })} className="w-full accent-cyan-500" />
        </div>
        <div>
          <label className="block text-[10px] text-slate-400 mb-1 flex justify-between">
            <span>Position Z</span>
            <span className="text-cyan-400 font-mono">{formData.z}</span>
          </label>
          <input type="range" min="-35" max="35" value={formData.z} onChange={e => setFormData({ ...formData, z: e.target.value })} className="w-full accent-cyan-500" />
        </div>
      </div>

      <div className="grid grid-cols-2 gap-2 pt-1">
        <button
          type="button"
          onClick={handleDragToMap}
          className="py-2 px-3 rounded bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-white font-bold text-xs flex items-center justify-center gap-1.5 transition-all shadow-[0_0_15px_rgba(168,85,247,0.35)] cursor-pointer active:scale-98"
        >
          <MapPin className="w-3.5 h-3.5 text-white" />
          <span>Drag to 3D Map</span>
        </button>
        <button
          type="submit"
          className="py-2 px-3 rounded bg-cyan-600 hover:bg-cyan-500 text-white font-bold text-xs transition-colors shadow-[0_0_15px_rgba(6,182,212,0.35)] cursor-pointer"
        >
          Deploy Direct
        </button>
      </div>
    </form>
  );
};

// ─── 2. MANAGE UNDERGROUND PARKING & BASEMENTS ─────────────────────────
const ManageParkingForm = () => {
  const { t } = useTranslation();
  const { buildings, selectedBuilding, selectBuilding, updateUndergroundParking } = useStore();
  const [buildingId, setBuildingId] = useState(selectedBuilding || (buildings[0]?.id || ''));
  const [parkingFloors, setParkingFloors] = useState(2);
  const [basementFloors, setBasementFloors] = useState(1);
  const [depthPerFloor, setDepthPerFloor] = useState(3.0);
  const [approvedDepth, setApprovedDepth] = useState(-6.0);

  // Sync when selected building changes
  useEffect(() => {
    if (selectedBuilding) {
      setBuildingId(selectedBuilding);
    }
  }, [selectedBuilding]);

  const currBuilding = buildings.find(b => b.id === buildingId);

  useEffect(() => {
    if (currBuilding) {
      const parkCount = currBuilding.units.filter(u => u.type === 'parking').length;
      const baseCount = currBuilding.units.filter(u => u.type === 'basement').length;
      setParkingFloors(Math.max(1, parkCount));
      setBasementFloors(Math.max(1, baseCount));
      setApprovedDepth(currBuilding.approvedDepth || -6.0);
    }
  }, [buildingId, currBuilding]);

  const calculatedDepth = -((Number(parkingFloors) + Number(basementFloors)) * Number(depthPerFloor));
  const isExcavationViolation = calculatedDepth < Number(approvedDepth);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!buildingId) return;
    await updateUndergroundParking(buildingId, {
      parkingFloors: Number(parkingFloors),
      basementFloors: Number(basementFloors),
      depthPerFloor: Number(depthPerFloor),
      approvedDepth: Number(approvedDepth)
    });
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-3">
      <div className="flex items-center justify-between border-b border-slate-700/50 pb-2">
        <h3 className="text-sm font-bold text-white flex items-center gap-1.5">
          <Car className="w-4 h-4 text-cyan-400" /> {t('corporator.headers.parkingManager')}
        </h3>
      </div>

      <div>
        <label className="block text-[10px] uppercase font-semibold text-slate-400 mb-1">Target Building</label>
        <select
          required
          value={buildingId}
          onChange={e => {
            setBuildingId(e.target.value);
            selectBuilding(e.target.value);
          }}
          className="w-full bg-slate-900/60 border border-slate-700 rounded px-2.5 py-1.5 text-xs text-slate-200 focus:outline-none focus:border-cyan-500"
        >
          {buildings.map(b => (
            <option key={b.id} value={b.id}>
              {b.name} ({b.id}) — {b.actualFloors}F / {b.actualDepth}m
            </option>
          ))}
        </select>
      </div>

      {currBuilding && (
        <div className="p-2.5 rounded bg-slate-900/60 border border-slate-700/60 space-y-2 text-xs">
          <div className="flex justify-between text-slate-400 text-[11px]">
            <span>Current Depth:</span>
            <span className="font-mono text-cyan-400 font-bold">{currBuilding.actualDepth}m</span>
          </div>
          <div className="flex justify-between text-slate-400 text-[11px]">
            <span>Sanctioned Limit:</span>
            <span className="font-mono text-yellow-400 font-bold">{currBuilding.approvedDepth}m</span>
          </div>
        </div>
      )}

      <div className="grid grid-cols-2 gap-2">
        <div>
          <label className="block text-[10px] text-slate-400 mb-1">Dedicated Parking Levels</label>
          <input
            type="number"
            min="0"
            max="6"
            required
            value={parkingFloors}
            onChange={e => setParkingFloors(e.target.value)}
            className="w-full bg-slate-900/60 border border-slate-700 rounded px-2 py-1 text-xs text-slate-200 font-mono text-cyan-400 font-bold"
          />
        </div>
        <div>
          <label className="block text-[10px] text-slate-400 mb-1">Basement Storage Levels</label>
          <input
            type="number"
            min="0"
            max="6"
            required
            value={basementFloors}
            onChange={e => setBasementFloors(e.target.value)}
            className="w-full bg-slate-900/60 border border-slate-700 rounded px-2 py-1 text-xs text-slate-200 font-mono"
          />
        </div>
      </div>

      <div className="grid grid-cols-2 gap-2">
        <div>
          <label className="block text-[10px] text-slate-400 mb-1">Height Per Level (m)</label>
          <input
            type="number"
            step="0.5"
            min="2.5"
            max="5"
            required
            value={depthPerFloor}
            onChange={e => setDepthPerFloor(e.target.value)}
            className="w-full bg-slate-900/60 border border-slate-700 rounded px-2 py-1 text-xs text-slate-200 font-mono"
          />
        </div>
        <div>
          <label className="block text-[10px] text-slate-400 mb-1">Sanctioned Depth Limit</label>
          <input
            type="number"
            step="1"
            max="0"
            required
            value={approvedDepth}
            onChange={e => setApprovedDepth(e.target.value)}
            className="w-full bg-slate-900/60 border border-slate-700 rounded px-2 py-1 text-xs text-slate-200 font-mono text-yellow-400"
          />
        </div>
      </div>

      {/* Live Depth Preview */}
      <div className={`p-2.5 rounded text-xs border ${isExcavationViolation ? 'bg-red-950/40 border-red-500/40 text-red-300' : 'bg-cyan-950/30 border-cyan-500/30 text-cyan-300'}`}>
        <div className="flex items-center justify-between font-bold">
          <span>Projected Total Depth:</span>
          <span className="font-mono text-sm">{calculatedDepth.toFixed(1)}m</span>
        </div>
        {isExcavationViolation && (
          <p className="text-[10px] text-red-400 mt-1 flex items-center gap-1">
            <AlertTriangle className="w-3.5 h-3.5 flex-shrink-0" />
            <span>Exceeds sanctioned depth ({approvedDepth}m). Subterranean levels will be flagged as illegal!</span>
          </p>
        )}
      </div>

      <button
        type="submit"
        className="w-full bg-gradient-to-r from-cyan-600 to-blue-600 hover:from-cyan-500 hover:to-blue-500 text-white font-bold py-2 px-4 rounded text-xs transition-all shadow-[0_0_15px_rgba(6,182,212,0.2)]"
      >
        Render Underground Levels in 3D
      </button>
    </form>
  );
};

// ─── 3. ADD RESIDENTS & MULTI-FAMILY 3D PARCEL DIVISION ───────────
const AddResidentForm = () => {
  const { t } = useTranslation();
  const { buildings, selectedBuilding, selectBuilding, setUnitFamilies } = useStore();
  const [buildingId, setBuildingId] = useState(selectedBuilding || (buildings[0]?.id || ''));
  const [ulpin, setUlpin] = useState('');
  const [familyCount, setFamilyCount] = useState(2);
  const [families, setFamilies] = useState([
    { name: '', unit: '101', area: '1200 sq ft' },
    { name: '', unit: '102', area: '1100 sq ft' },
  ]);
  const [successMsg, setSuccessMsg] = useState('');

  // Keep synced if user clicked a building on map
  useEffect(() => {
    if (selectedBuilding && selectedBuilding !== buildingId) {
      setBuildingId(selectedBuilding);
      setUlpin('');
    }
  }, [selectedBuilding]);

  const targetBuilding = buildings.find(b => b.id === buildingId);
  const units = targetBuilding ? targetBuilding.units.filter(u => u.type === 'floor') : [];

  // When unit is chosen, check if it already has families
  useEffect(() => {
    if (ulpin && targetBuilding) {
      const u = targetBuilding.units.find(item => item.ulpin === ulpin);
      if (u && u.families && u.families.length > 0) {
        setFamilyCount(u.families.length);
        setFamilies(u.families);
        return;
      }
      // Default floor number based on ULPIN or floorNumber
      const floorNum = u?.floorNumber || 1;
      setFamilies([
        { name: '', unit: `${floorNum}01`, area: '1200 sq ft' },
        { name: '', unit: `${floorNum}02`, area: '1100 sq ft' },
      ]);
      setFamilyCount(2);
    }
  }, [ulpin, buildingId]);

  const handleFamilyCountChange = (count) => {
    const n = Number(count);
    setFamilyCount(n);
    const u = targetBuilding?.units?.find(item => item.ulpin === ulpin);
    const floorNum = u?.floorNumber || 1;

    setFamilies(prev => {
      const updated = [...prev];
      if (n > prev.length) {
        for (let i = prev.length; i < n; i++) {
          updated.push({
            name: '',
            unit: `${floorNum}0${i + 1}`,
            area: '1150 sq ft'
          });
        }
      } else {
        return updated.slice(0, n);
      }
      return updated;
    });
  };

  const handleFamilyFieldChange = (index, field, value) => {
    setFamilies(prev => {
      const copy = [...prev];
      copy[index] = { ...copy[index], [field]: value };
      return copy;
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!buildingId || !ulpin) return;

    // Ensure all have names
    const validated = families.map((f, i) => ({
      name: f.name.trim() || `Family ${i + 1}`,
      unit: f.unit || `${i + 1}01`,
      area: f.area || '1200 sq ft'
    }));

    await setUnitFamilies(buildingId, ulpin, validated);
    setSuccessMsg(`Partitioned ${ulpin} into ${validated.length} colored spatial parcels!`);
    setTimeout(() => setSuccessMsg(''), 4500);
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-3">
      <div className="flex items-center justify-between border-b border-slate-700/50 pb-2">
        <div>
          <h3 className="text-sm font-bold text-slate-200 flex items-center gap-1.5">
            <Users className="w-4 h-4 text-purple-400" /> {t('corporator.headers.floorPartitioning')}
          </h3>
          <p className="text-[10px] text-slate-400">{t('corporator.headers.floorPartitioningDesc')}</p>
        </div>
      </div>

      {successMsg && (
        <div className="p-2 rounded bg-green-950/40 border border-green-500/40 text-[11px] text-green-300 flex items-center gap-1.5 animate-in fade-in">
          <CheckCircle2 className="w-4 h-4 text-green-400 flex-shrink-0" />
          <span>{successMsg}</span>
        </div>
      )}

      <div>
        <label className="block text-[10px] uppercase font-semibold text-slate-400 mb-1">Select Building</label>
        <select
          required
          value={buildingId}
          onChange={e => {
            setBuildingId(e.target.value);
            setUlpin('');
            selectBuilding(e.target.value);
          }}
          className="w-full bg-slate-900/60 border border-slate-700 rounded px-2.5 py-1.5 text-xs text-slate-200 focus:outline-none focus:border-purple-500"
        >
          {buildings.map(b => (
            <option key={b.id} value={b.id}>
              {b.name} ({b.id})
            </option>
          ))}
        </select>
      </div>

      <div>
        <label className="block text-[10px] uppercase font-semibold text-slate-400 mb-1">Target Floor (3D Parcel ULPIN)</label>
        <select
          required
          value={ulpin}
          onChange={e => setUlpin(e.target.value)}
          className="w-full bg-slate-900/60 border border-slate-700 rounded px-2.5 py-1.5 text-xs text-slate-200 focus:outline-none focus:border-purple-500"
        >
          <option value="">Choose Floor Unit...</option>
          {units.map(u => (
            <option key={u.ulpin} value={u.ulpin}>
              Floor {u.floorNumber} ({u.ulpin}) — {u.families?.length ? `${u.families.length} Families` : 'Vacant'}
            </option>
          ))}
        </select>
      </div>

      {ulpin && (
        <div className="space-y-3 pt-1">
          {/* How many families live here selector */}
          <div className="p-2.5 rounded-lg bg-purple-950/30 border border-purple-500/30">
            <div className="flex items-center justify-between mb-1.5">
              <label className="text-xs font-bold text-purple-300">
                How many families live on this floor?
              </label>
              <span className="text-xs font-mono font-bold text-cyan-400">
                {familyCount} {familyCount === 1 ? 'Family' : 'Families'}
              </span>
            </div>

            <div className="grid grid-cols-6 gap-1">
              {[1, 2, 3, 4, 5, 6].map(num => (
                <button
                  key={num}
                  type="button"
                  onClick={() => handleFamilyCountChange(num)}
                  className={`py-1 rounded text-xs font-bold transition-all border ${familyCount === num
                    ? 'bg-purple-600 text-white border-purple-400 shadow-[0_0_10px_rgba(168,85,247,0.4)]'
                    : 'bg-slate-900/60 border-slate-700 text-slate-400 hover:bg-slate-800'
                    }`}
                >
                  {num}
                </button>
              ))}
            </div>

            <p className="text-[10px] text-purple-300/70 mt-1.5">
              Floor will automatically partition in 3D into <strong>{familyCount} distinct colored volumes</strong>.
            </p>
          </div>

          {/* Dynamic Family Input Cards */}
          <div className="space-y-2 max-h-56 overflow-y-auto pr-1">
            {families.map((fam, idx) => {
              const color = FAMILY_COLORS[idx % FAMILY_COLORS.length];
              return (
                <div
                  key={idx}
                  className="p-2.5 rounded-lg bg-slate-900/70 border border-slate-700/60 space-y-2"
                  style={{ borderLeftColor: color, borderLeftWidth: '3px' }}
                >
                  <div className="flex items-center justify-between">
                    <span className="text-[11px] font-bold text-slate-200 flex items-center gap-1.5">
                      <span className="w-2.5 h-2.5 rounded-full inline-block" style={{ background: color }} />
                      Unit Segment {idx + 1}
                    </span>
                    <span className="text-[9px] font-mono text-slate-500 uppercase">3D Volume Color</span>
                  </div>

                  <div>
                    <input
                      type="text"
                      placeholder={`Head of Family #${idx + 1} (e.g. Ramesh Kumar)`}
                      value={fam.name}
                      onChange={e => handleFamilyFieldChange(idx, 'name', e.target.value)}
                      className="w-full bg-slate-950/70 border border-slate-700/80 rounded px-2 py-1 text-xs text-slate-200 focus:outline-none focus:border-purple-500"
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <input
                        type="text"
                        placeholder="Flat No (e.g. 301)"
                        value={fam.unit}
                        onChange={e => handleFamilyFieldChange(idx, 'unit', e.target.value)}
                        className="w-full bg-slate-950/70 border border-slate-700/80 rounded px-2 py-1 text-xs text-slate-200 font-mono"
                      />
                    </div>
                    <div>
                      <input
                        type="text"
                        placeholder="Area (e.g. 1100 sq ft)"
                        value={fam.area}
                        onChange={e => handleFamilyFieldChange(idx, 'area', e.target.value)}
                        className="w-full bg-slate-950/70 border border-slate-700/80 rounded px-2 py-1 text-xs text-slate-200 font-mono"
                      />
                    </div>
                  </div>
                </div>
              );
            })}
          </div>

          <button
            type="submit"
            className="w-full bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-500 hover:to-pink-500 text-white font-bold py-2 px-4 rounded text-xs transition-all shadow-[0_0_15px_rgba(168,85,247,0.3)] mt-2"
          >
            Save & Partition Floor into {familyCount} Colored Units
          </button>
        </div>
      )}
    </form>
  );
};

// ─── 4. EDIT APPROVED FLOORS & BUILDING ACTIONS ───────────────────
const EditFloorsForm = () => {
  const { t } = useTranslation();
  const { buildings, selectedBuilding, selectBuilding, updateApprovedFloors, deleteBuilding } = useStore();
  const [buildingId, setBuildingId] = useState(selectedBuilding || (buildings[0]?.id || ''));
  const [approvedFloors, setApprovedFloors] = useState(5);

  // Sync if selectedBuilding changes from outside
  useEffect(() => {
    if (selectedBuilding && selectedBuilding !== buildingId) {
      setBuildingId(selectedBuilding);
    }
  }, [selectedBuilding]);

  // Ensure a valid buildingId if none is set
  useEffect(() => {
    if (!buildingId && buildings.length > 0) {
      setBuildingId(buildings[0].id);
    }
  }, [buildings, buildingId]);

  const selectedB = buildings.find(b => b.id === buildingId);

  useEffect(() => {
    if (selectedB) {
      setApprovedFloors(selectedB.approvedFloors || 5);
    }
  }, [buildingId, selectedB]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!buildingId) return;
    await updateApprovedFloors(buildingId, Number(approvedFloors));
  };

  const handleDelete = () => {
    if (!selectedB) return;
    if (window.confirm(`Are you sure you want to permanently delete "${selectedB.name}" (${selectedB.id}) and all its 3D ULPIN units?`)) {
      deleteBuilding(selectedB.id);
      setBuildingId('');
    }
  };

  return (
    <div className="space-y-4">
      <form onSubmit={handleSubmit} className="space-y-3">
        <div className="flex items-center justify-between border-b border-slate-700/50 pb-2">
          <h3 className="text-sm font-bold text-slate-200 flex items-center gap-1.5">
            <Settings2 className="w-4 h-4 text-yellow-400" /> {t('corporator.headers.sanctionedCompliance')}
          </h3>
        </div>
        <div>
          <label className="block text-[10px] uppercase font-semibold text-slate-400 mb-1">Building</label>
          <select
            required
            value={buildingId}
            onChange={e => {
              setBuildingId(e.target.value);
              if (e.target.value) {
                selectBuilding(e.target.value);
              }
            }}
            className="w-full bg-slate-900/60 border border-slate-700 rounded px-2.5 py-1.5 text-xs text-slate-200 focus:outline-none focus:border-yellow-500"
          >
            <option value="">Select Building...</option>
            {buildings.map(b => (
              <option key={b.id} value={b.id}>{b.name} ({b.id})</option>
            ))}
          </select>
        </div>

        {selectedB && (
          <div className="p-3 bg-slate-900/50 rounded border border-slate-700/60 space-y-2 text-xs">
            <div className="flex justify-between">
              <span className="text-slate-400">Actual Floors Built:</span>
              <span className={`font-mono font-bold ${selectedB.actualFloors > approvedFloors ? 'text-red-400' : 'text-green-400'}`}>
                {selectedB.actualFloors} Floors
              </span>
            </div>

            <div>
              <label className="block text-[10px] text-slate-400 mb-1">Approved Limit (Master Plan / RERA)</label>
              <input
                type="number"
                min="1"
                max="30"
                value={approvedFloors}
                onChange={e => setApprovedFloors(e.target.value)}
                className="w-full bg-slate-900 border border-slate-700 rounded px-2 py-1 text-xs text-yellow-400 font-mono font-bold"
              />
            </div>

            {selectedB.actualFloors > approvedFloors && (
              <div className="p-2 rounded bg-red-950/40 border border-red-500/40 text-[10px] text-red-300 flex items-start gap-1">
                <AlertTriangle className="w-3.5 h-3.5 text-red-400 flex-shrink-0 mt-0.5" />
                <span>
                  Unauthorized construction detected! Top {selectedB.actualFloors - approvedFloors} floors will be illuminated in red with violation flags.
                </span>
              </div>
            )}
          </div>
        )}

        <button type="submit" className="w-full bg-yellow-600 hover:bg-yellow-500 text-slate-950 font-bold py-2 px-4 rounded text-xs transition-colors">
          Enforce Sanctioned Limit
        </button>
      </form>

      {/* Danger Zone: Delete Building */}
      {selectedB && (
        <div className="p-3 rounded-lg bg-red-950/30 border border-red-500/30 space-y-2">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs font-bold text-red-400">{t('corporator.deleteBuilding')}</p>
              <p className="text-[10px] text-slate-400">Permanently remove from 3D Cadastre</p>
            </div>
            <button
              type="button"
              onClick={handleDelete}
              className="px-2.5 py-1.5 bg-red-600 hover:bg-red-500 text-white rounded text-xs font-bold transition-colors flex items-center gap-1 shadow-sm"
            >
              <Trash2 className="w-3.5 h-3.5" /> Delete
            </button>
          </div>
        </div>
      )}

      {/* Cadastre Reset to Defaults */}
      <div className="p-3 bg-amber-950/20 border border-amber-500/30 rounded-lg space-y-2 mt-4">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-xs font-bold text-amber-400">↺ Restore Default Master Plan</p>
            <p className="text-[10px] text-slate-400">Recover deleted buildings (Royal Heights) & clear added items</p>
          </div>
          <button
            type="button"
            onClick={() => {
              if (window.confirm('Restore master 3D cadastre? This will recover all deleted buildings and remove any added buildings or test scans.')) {
                useStore.getState().resetCadastre();
                setBuildingId('');
              }
            }}
            className="px-2.5 py-1.5 bg-amber-600 hover:bg-amber-500 text-white rounded text-xs font-bold transition-colors flex items-center gap-1 shadow-sm"
          >
            <span>↺</span> Restore
          </button>
        </div>
      </div>
    </div>
  );
};

// ─── 5. ADD UNDERGROUND FEATURE ──────────────────────────────────
const AddUndergroundForm = () => {
  const { t } = useTranslation();
  const addNewUndergroundFeature = useStore(state => state.addNewUndergroundFeature);
  const [formData, setFormData] = useState({
    type: 'well', label: '', radius: 2, depth: 6, x: 0, z: 0, status: 'active'
  });

  const handleSubmit = async (e) => {
    e.preventDefault();
    await addNewUndergroundFeature({
      type: formData.type,
      label: formData.label,
      position: [Number(formData.x), 0, Number(formData.z)],
      radius: Number(formData.radius),
      depth: Number(formData.depth),
      status: formData.status
    });
    setFormData({ ...formData, label: '' });
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-3">
      <div className="flex items-center justify-between border-b border-slate-700/50 pb-2">
        <h3 className="text-sm font-bold text-slate-200 flex items-center gap-1.5">
          <Database className="w-4 h-4 text-teal-400" /> {t('corporator.headers.assetRegistry')}
        </h3>
      </div>
      <div>
        <label className="block text-[10px] text-slate-400 mb-1">Asset Type</label>
        <select value={formData.type} onChange={e => setFormData({ ...formData, type: e.target.value })} className="w-full bg-slate-900/60 border border-slate-700 rounded px-2 py-1.5 text-xs text-slate-200">
          <option value="well">Ancient Step Well / Borewell</option>
          <option value="septic_tank">Community Septic Tank</option>
          <option value="water_tank">Underground Water Reservoir</option>
          <option value="bunker">Heritage Underground Bunker</option>
          <option value="gas_line">Gas Vault</option>
          <option value="fiber_optic">Fiber Junction Chamber</option>
        </select>
      </div>
      <div>
        <label className="block text-[10px] text-slate-400 mb-1">Label</label>
        <input type="text" required placeholder="e.g. Historic Step Well #4" value={formData.label} onChange={e => setFormData({ ...formData, label: e.target.value })} className="w-full bg-slate-900/60 border border-slate-700 rounded px-2 py-1.5 text-xs text-slate-200" />
      </div>
      <div className="grid grid-cols-2 gap-2">
        <div>
          <label className="block text-[10px] text-slate-400 mb-1">Radius (m)</label>
          <input type="number" min="0.5" step="0.5" required value={formData.radius} onChange={e => setFormData({ ...formData, radius: e.target.value })} className="w-full bg-slate-900/60 border border-slate-700 rounded px-2 py-1 text-xs text-slate-200 font-mono" />
        </div>
        <div>
          <label className="block text-[10px] text-slate-400 mb-1">Depth (m)</label>
          <input type="number" min="1" max="30" required value={formData.depth} onChange={e => setFormData({ ...formData, depth: e.target.value })} className="w-full bg-slate-900/60 border border-slate-700 rounded px-2 py-1 text-xs text-slate-200 font-mono" />
        </div>
      </div>
      <div>
        <label className="block text-[10px] text-slate-400 mb-1">Status</label>
        <select value={formData.status} onChange={e => setFormData({ ...formData, status: e.target.value })} className="w-full bg-slate-900/60 border border-slate-700 rounded px-2 py-1.5 text-xs text-slate-200">
          <option value="active">Active Municipal Asset</option>
          <option value="abandoned">Abandoned / Uncharted</option>
          <option value="protected_monument">Protected ASI Heritage Monument</option>
        </select>
      </div>
      <button type="submit" className="w-full bg-teal-600 hover:bg-teal-500 text-white font-bold py-2 px-4 rounded text-xs transition-colors mt-2">
        Register Subterranean Asset
      </button>
    </form>
  );
};

// ─── 6. ADD INFRASTRUCTURE FORM ──────────────────────────────────
const AddInfrastructureForm = () => {
  const { t } = useTranslation();
  const addNewInfrastructure = useStore(state => state.addNewInfrastructure);
  const infraDraftPoints = useStore(state => state.infraDraftPoints);
  const infraDraftDepth = useStore(state => state.infraDraftDepth);
  const infraDraftRadius = useStore(state => state.infraDraftRadius);
  const infraDraftType = useStore(state => state.infraDraftType);
  const infraDrawingActive = useStore(state => state.infraDrawingActive);
  const setInfraDrawingActive = useStore(state => state.setInfraDrawingActive);
  const setInfraDraftDepth = useStore(state => state.setInfraDraftDepth);
  const setInfraDraftRadius = useStore(state => state.setInfraDraftRadius);
  const setInfraDraftType = useStore(state => state.setInfraDraftType);
  const addInfraDraftPoint = useStore(state => state.addInfraDraftPoint);
  const removeInfraDraftPoint = useStore(state => state.removeInfraDraftPoint);
  const undoLastInfraDraftPoint = useStore(state => state.undoLastInfraDraftPoint);
  const clearInfraDraftPoints = useStore(state => state.clearInfraDraftPoints);

  const [label, setLabel] = useState('Sector 4 Natural Gas Main GP-01');
  const [manualX, setManualX] = useState('10');
  const [manualZ, setManualZ] = useState('10');
  const [isDeploying, setIsDeploying] = useState(false);

  // Automatically activate 3D map ground raycaster when this tab opens
  useEffect(() => {
    setInfraDrawingActive(true);
    return () => {
      // Don't disable prematurely if still drawing, but keep clean
    };
  }, [setInfraDrawingActive]);

  // Type default labels
  const handleTypeChange = (e) => {
    const val = e.target.value;
    setInfraDraftType(val);
    const defaults = {
      gas_line: 'Sector 4 Natural Gas Main GP-01',
      utility_line: 'South Sector Water Main WM-12',
      fiber_optic: 'Central Telecom Fiber Trunk FT-03',
      sewer_line: 'Regional Sewer Interceptor SI-05',
      power_cable: 'High Voltage Underground Cable HV-02',
      metro_tunnel: 'City Metro Line Ext MT-01',
    };
    if (defaults[val]) {
      setLabel(defaults[val]);
    }
  };

  const handleAddManualPoint = (e) => {
    e.preventDefault();
    const x = parseFloat(manualX);
    const z = parseFloat(manualZ);
    if (isNaN(x) || isNaN(z)) return;
    const y = -Math.abs(Number(infraDraftDepth || 4));
    addInfraDraftPoint([x, y, z]);
    // Offset slightly for next point convenience
    setManualX((x + 12).toFixed(1));
    setManualZ((z + 8).toFixed(1));
  };

  const handleLoadSampleRoute = (e) => {
    e.preventDefault();
    clearInfraDraftPoints();
    const d = -Math.abs(Number(infraDraftDepth || 4));
    addInfraDraftPoint([-25, d, -15]);
    addInfraDraftPoint([0, d, -5]);
    addInfraDraftPoint([28, d, 18]);
  };

  const handleSubmit = async (e) => {
    if (e && e.preventDefault) e.preventDefault();
    if (infraDraftPoints.length < 2) {
      alert('Please add at least 2 waypoints by clicking on the 3D map or using "⚡ Quick Route" / "+ Add Waypoint" below.');
      return;
    }

    try {
      setIsDeploying(true);
      await addNewInfrastructure({
        type: infraDraftType,
        label: label.trim() || 'Subterranean Infrastructure',
        path: infraDraftPoints,
        radius: Number(infraDraftRadius) || 0.5,
        depth: Number(infraDraftDepth) || 4,
      });
    } finally {
      setIsDeploying(false);
    }
  };

  const pointCount = infraDraftPoints.length;
  const isGasLine = infraDraftType === 'gas_line';

  return (
    <form onSubmit={handleSubmit} className="space-y-3">
      <div className="flex items-center justify-between border-b border-slate-700/50 pb-2">
        <h3 className="text-sm font-bold text-slate-200 flex items-center gap-1.5">
          <Route className={`w-4 h-4 ${isGasLine ? 'text-orange-400' : 'text-cyan-400'}`} />
          {t('corporator.headers.pipelineNetwork')}
        </h3>
        <span className="text-[10px] px-2 py-0.5 rounded-full font-mono bg-orange-500/20 text-orange-300 border border-orange-500/30">
          3D Cadastre
        </span>
      </div>

      <div>
        <label className="block text-[10px] uppercase font-semibold text-slate-400 mb-1">Infrastructure Type</label>
        <select
          value={infraDraftType}
          onChange={handleTypeChange}
          className="w-full bg-slate-900/60 border border-slate-700 rounded px-2.5 py-1.5 text-xs text-slate-200 focus:outline-none focus:border-orange-500 font-medium"
        >
          <option value="gas_line">🔥 Natural Gas High-Pressure Line</option>
          <option value="utility_line">💧 Water Main Pipeline</option>
          <option value="fiber_optic">🌐 Telecommunication Fiber Trunk</option>
          <option value="sewer_line">🔧 Primary Sewer Interceptor</option>
          <option value="power_cable">⚡ High Voltage Subterranean Grid</option>
          <option value="metro_tunnel">🚇 Underground Transit Tunnel</option>
        </select>
      </div>

      <div>
        <label className="block text-[10px] uppercase font-semibold text-slate-400 mb-1">Pipeline / Tunnel Label</label>
        <input
          type="text"
          required
          placeholder="e.g. Sector 4 Natural Gas Main GP-01"
          value={label}
          onChange={e => setLabel(e.target.value)}
          className="w-full bg-slate-900/60 border border-slate-700 rounded px-2.5 py-1.5 text-xs text-slate-200 focus:outline-none focus:border-orange-500"
        />
      </div>

      <div className="grid grid-cols-2 gap-2">
        <div>
          <label className="block text-[10px] text-slate-400 mb-1">Pipe Radius (m)</label>
          <input
            type="number"
            step="0.1"
            min="0.2"
            max="4"
            required
            value={infraDraftRadius}
            onChange={e => setInfraDraftRadius(e.target.value)}
            className="w-full bg-slate-900/60 border border-slate-700 rounded px-2 py-1 text-xs text-slate-200 font-mono"
          />
        </div>
        <div>
          <label className="block text-[10px] text-slate-400 mb-1 flex justify-between">
            <span>Subsurface Depth</span>
            <span className="text-cyan-400 font-mono font-bold">-{infraDraftDepth}m</span>
          </label>
          <input
            type="number"
            min="1"
            max="25"
            step="0.5"
            required
            value={infraDraftDepth}
            onChange={e => setInfraDraftDepth(e.target.value)}
            className="w-full bg-slate-900/60 border border-slate-700 rounded px-2 py-1 text-xs text-slate-200 font-mono"
          />
        </div>
      </div>

      {/* ─── 3D MAP POINT PICKER CONTROLLER ─── */}
      <div className="p-3 rounded-lg bg-slate-900/90 border-2 border-orange-500/40 space-y-2.5">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-1.5">
            <span className={`w-2.5 h-2.5 rounded-full ${infraDrawingActive ? 'bg-green-400 animate-pulse' : 'bg-slate-500'}`} />
            <span className="text-xs font-bold text-slate-200">
              {infraDrawingActive ? '📍 3D Map Point Selection: ACTIVE' : '3D Point Selection: PAUSED'}
            </span>
          </div>
          <button
            type="button"
            onClick={() => setInfraDrawingActive(!infraDrawingActive)}
            className={`px-2 py-0.5 rounded text-[10px] font-bold border transition-colors ${infraDrawingActive
              ? 'bg-green-950/40 border-green-500/50 text-green-300 hover:bg-green-900/40'
              : 'bg-slate-800 border-slate-600 text-slate-300 hover:bg-slate-700'
              }`}
          >
            {infraDrawingActive ? 'Active' : 'Resume'}
          </button>
        </div>

        {/* Step Guide / Hint Box */}
        <div className="text-[11px] p-2 rounded bg-slate-950/80 border border-slate-800 leading-relaxed text-slate-300">
          {pointCount === 0 && (
            <div className="space-y-1">
              <p className="flex items-center gap-1.5 text-orange-300 font-medium">
                <MousePointerClick className="w-3.5 h-3.5 text-orange-400 shrink-0" />
                <span>Click directly on the 3D ground or enter X, Z below to add points.</span>
              </p>
            </div>
          )}
          {pointCount === 1 && (
            <p className="flex items-center gap-1.5 text-yellow-300 font-medium">
              <MousePointerClick className="w-3.5 h-3.5 text-yellow-400 shrink-0" />
              <span>Point 1 placed. Click another point on map to connect first pipe segment.</span>
            </p>
          )}
          {pointCount >= 2 && (
            <p className="flex items-center gap-1.5 text-emerald-300 font-medium">
              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
              <span>{pointCount} points connected below ground. Click Deploy below!</span>
            </p>
          )}
        </div>

        {/* Manual Waypoint Input & 1-Click Route Preset */}
        <div className="p-2 rounded bg-slate-950/90 border border-slate-800/80 space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Manual Coordinates</span>
            <button
              type="button"
              onClick={handleLoadSampleRoute}
              className="px-2 py-0.5 rounded text-[10px] font-bold bg-purple-950/60 hover:bg-purple-900/60 text-purple-300 border border-purple-500/40 transition-colors"
              title="Click to automatically load a 3-waypoint sample pipeline path across the cadastre"
            >
              ⚡ Quick Route (3 Waypoints)
            </button>
          </div>
          <div className="flex items-center gap-2">
            <div className="flex items-center gap-1">
              <span className="text-[10px] text-slate-400 font-mono">X:</span>
              <input
                type="number"
                value={manualX}
                onChange={e => setManualX(e.target.value)}
                className="w-16 bg-slate-900 border border-slate-700 rounded px-1.5 py-0.5 text-xs text-slate-200 font-mono"
              />
            </div>
            <div className="flex items-center gap-1">
              <span className="text-[10px] text-slate-400 font-mono">Z:</span>
              <input
                type="number"
                value={manualZ}
                onChange={e => setManualZ(e.target.value)}
                className="w-16 bg-slate-900 border border-slate-700 rounded px-1.5 py-0.5 text-xs text-slate-200 font-mono"
              />
            </div>
            <button
              type="button"
              onClick={handleAddManualPoint}
              className="flex-1 py-1 px-2 rounded bg-cyan-900/50 hover:bg-cyan-800/50 text-cyan-300 border border-cyan-500/40 text-[11px] font-bold transition-colors"
            >
              + Add Point
            </button>
          </div>
        </div>

        {/* Plotted Points List */}
        {pointCount > 0 && (
          <div className="space-y-1.5 max-h-40 overflow-y-auto pr-1">
            <div className="flex items-center justify-between text-[10px] uppercase font-mono text-slate-400 pb-1 border-b border-slate-800">
              <span>Waypoints ({pointCount})</span>
              <span>Subterranean Coordinates</span>
            </div>
            {infraDraftPoints.map((pt, idx) => (
              <div
                key={idx}
                className="flex items-center justify-between px-2 py-1 rounded bg-slate-950/60 border border-slate-800/80 text-[11px] font-mono text-slate-300 group hover:border-orange-500/50"
              >
                <div className="flex items-center gap-2">
                  <span className="w-4 h-4 rounded-full bg-orange-600/30 border border-orange-500/60 text-orange-300 flex items-center justify-center text-[9px] font-bold">
                    {idx + 1}
                  </span>
                  <span>X: {pt[0].toFixed(1)}m, Z: {pt[2].toFixed(1)}m</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-[10px] text-cyan-400">{pt[1].toFixed(1)}m</span>
                  <button
                    type="button"
                    onClick={() => removeInfraDraftPoint(idx)}
                    className="text-slate-500 hover:text-red-400 transition-colors p-0.5"
                    title={`Remove point ${idx + 1}`}
                  >
                    <X className="w-3 h-3" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Quick action bar */}
        {pointCount > 0 && (
          <div className="flex items-center gap-2 pt-1">
            <button
              type="button"
              onClick={undoLastInfraDraftPoint}
              className="flex-1 py-1 px-2 rounded bg-slate-800 hover:bg-slate-700 text-slate-300 text-[10px] font-semibold flex items-center justify-center gap-1 transition-colors border border-slate-700"
            >
              <RotateCcw className="w-3 h-3" /> Undo Point
            </button>
            <button
              type="button"
              onClick={clearInfraDraftPoints}
              className="py-1 px-2 rounded bg-red-950/40 hover:bg-red-900/40 text-red-300 text-[10px] font-semibold flex items-center justify-center gap-1 transition-colors border border-red-500/30"
            >
              <Trash2 className="w-3 h-3" /> Clear All
            </button>
          </div>
        )}
      </div>

      {/* Deploy Button */}
      <button
        type="button"
        onClick={handleSubmit}
        disabled={pointCount < 2 || isDeploying}
        className={`w-full font-bold py-2.5 px-4 rounded-lg text-xs transition-all flex items-center justify-center gap-1.5 mt-2 ${pointCount >= 2 && !isDeploying
          ? 'bg-gradient-to-r from-orange-600 to-amber-600 hover:from-orange-500 hover:to-amber-500 text-white shadow-[0_0_20px_rgba(234,88,12,0.35)] cursor-pointer'
          : 'bg-slate-800 text-slate-500 border border-slate-700/60 cursor-not-allowed'
          }`}
      >
        <Route className="w-4 h-4" />
        {isDeploying
          ? 'Deploying to Subterranean Cadastre...'
          : pointCount < 2
            ? `Add At Least 2 Waypoints (${pointCount}/2)`
            : `Deploy Pipeline (${pointCount} Waypoints Connected)`}
      </button>
    </form>
  );
};

// ─── 7. INBOX COMPONENT ───────────────────────────────────────────
const InboxPanel = ({ regionName, sharedMaps, unreadCount, setCorporatorMode }) => {
  const { t } = useTranslation();
  const importReceivedMap = useStore(state => state.importReceivedMap);
  const userRegion = useStore(state => state.userRegion);
  const importedMaps = useStore(state => state.importedMaps);
  const storeSharedMaps = useStore(state => state.sharedMaps) || [];

  // Always use live sharedMaps from store, filtered to user's region and newest first
  const effectiveSharedMaps = (storeSharedMaps.length > 0 ? storeSharedMaps : (sharedMaps || []))
    .filter(m => m.targetRegion === userRegion)
    .sort((a, b) => new Date(b.timestamp || 0) - new Date(a.timestamp || 0));

  const hasImportedForRegion = Boolean(userRegion && importedMaps && importedMaps[userRegion]);
  const activeSourceMapId = userRegion && importedMaps?.[userRegion]?.sourceMapId;

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between border-b border-slate-700/50 pb-2">
        <h3 className="text-sm font-bold text-slate-200 flex items-center gap-1.5">
          <Mail className="w-4 h-4 text-purple-400" /> {t('corporator.headers.mapInbox')} — {regionName}
        </h3>
        {hasImportedForRegion && (
          <span className="text-[9px] font-mono px-2 py-0.5 rounded bg-emerald-950/80 text-emerald-300 border border-emerald-500/50 font-bold">
            ✓ {t('corporator.mapActive')}
          </span>
        )}
      </div>

      {unreadCount > 0 && (
        <div className="bg-gradient-to-r from-purple-900/70 to-emerald-900/60 border border-emerald-500/50 rounded-xl p-3 mb-3 shadow-[0_0_20px_rgba(16,185,129,0.25)]">
          <p className="text-xs text-white font-bold flex items-center gap-2">
            <span className="text-base animate-bounce">📬</span>
            <span>{hasImportedForRegion ? t('corporator.newUpdatedMap') : t('corporator.newMapReceived')}</span>
          </p>
          <p className="text-[11px] text-emerald-200/90 mt-1">
            {t('corporator.clickToImport', { action: hasImportedForRegion ? t('corporator.importUpdate') : t('corporator.importNew'), region: regionName })}
          </p>
        </div>
      )}

      {effectiveSharedMaps.length === 0 ? (
        <div className="p-6 text-center space-y-2 bg-slate-900/50 rounded-xl border border-slate-700/50">
          <div className="text-3xl text-slate-600">{hasImportedForRegion ? '📦' : '📭'}</div>
          <h4 className="text-xs font-bold text-slate-300">
            {hasImportedForRegion ? t('corporator.mapActiveNoNew') : t('corporator.noMapYet')}
          </h4>
          <p className="text-[11px] text-slate-400 leading-relaxed max-w-xs mx-auto">
            {hasImportedForRegion
              ? `Your active 3D map is saved for ${regionName}. Any newly dispatched updates from the Data & Survey Officer will appear here ready to import.`
              : `The Data & Survey Officer has not sent any 3D map for ${regionName} yet.`}
          </p>
          <p className="text-[10px] text-slate-500 font-mono pt-1">
            {hasImportedForRegion
              ? 'You can manage buildings, floors, and underground infrastructure using the toolbar.'
              : 'Your 3D canvas is empty. Once a survey is dispatched to your ward, you will receive an import notice here.'}
          </p>
        </div>
      ) : (
        <div className="space-y-3 max-h-96 overflow-y-auto pr-1">
          {effectiveSharedMaps.map(map => {
            const isPending = map.status === 'pending';
            const isActive = Boolean(activeSourceMapId ? activeSourceMapId === map.id : map.status === 'imported');

            return (
              <div
                key={map.id}
                className={`border rounded-xl p-4 space-y-3 transition-all ${isPending
                  ? 'bg-gradient-to-b from-slate-900/95 to-slate-950/95 border-emerald-500/60 shadow-[0_0_20px_rgba(16,185,129,0.2)]'
                  : 'bg-slate-800/60 border-purple-500/30'
                  }`}
              >
                <div className="flex justify-between items-start">
                  <div>
                    <p className="text-xs font-bold text-white flex items-center gap-1.5">
                      <span>{isPending ? '📬' : '📦'}</span>
                      <span>3D Cadastre Twin — {map.targetRegionName || regionName}</span>
                    </p>
                    <p className="text-[10px] text-slate-400 mt-0.5">
                      Dispatched by: <strong className="text-emerald-400">{map.senderName || 'Data & Survey Officer'}</strong>
                    </p>
                    <p className="text-[9px] text-slate-500 font-mono">
                      {map.displayTime || new Date(map.timestamp).toLocaleString()}
                    </p>
                  </div>
                  <span className={`text-[9px] px-2 py-0.5 rounded-full font-bold uppercase tracking-wider border ${isPending
                    ? 'bg-emerald-950/80 text-emerald-300 border-emerald-500/60 animate-pulse'
                    : isActive
                      ? 'bg-purple-950/60 text-purple-300 border-purple-500/40'
                      : 'bg-slate-800 text-slate-400 border-slate-600/40'
                    }`}>
                    {isPending
                      ? (hasImportedForRegion ? '● New Update (Ready to Import)' : '● Ready to Import')
                      : isActive
                        ? '✓ Active & Saved'
                        : '📦 Previous Version'}
                  </span>
                </div>

                <div className="grid grid-cols-2 gap-2 text-[10px] text-slate-300 bg-slate-950/60 p-2.5 rounded-lg border border-slate-800 font-mono">
                  <div className="flex items-center gap-1.5">
                    <Building2 className="w-3.5 h-3.5 text-cyan-400" />
                    <span>{map.buildingCount || 0} 3D Buildings</span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <Layers className="w-3.5 h-3.5 text-emerald-400" />
                    <span>{map.parcelCount || 0} Cadastral Parcels</span>
                  </div>
                </div>

                {isPending ? (
                  <button
                    type="button"
                    onClick={() => {
                      importReceivedMap(map.id);
                      setCorporatorMode('addBuilding');
                    }}
                    className="w-full bg-gradient-to-r from-emerald-600 via-teal-600 to-cyan-600 hover:from-emerald-500 hover:to-cyan-500 text-white font-bold py-2.5 px-4 rounded-xl text-xs transition-all flex items-center justify-center gap-2 shadow-[0_0_20px_rgba(16,185,129,0.4)] cursor-pointer active:scale-98"
                  >
                    <span>📥</span>
                    <span>{hasImportedForRegion ? 'Import New 3D Map (Update Canvas)' : 'Import to My 3D Map (Permanent)'}</span>
                  </button>
                ) : (
                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() => setCorporatorMode('addBuilding')}
                      className="flex-1 bg-purple-700/40 hover:bg-purple-700/60 text-purple-200 border border-purple-500/40 font-bold py-2 px-3 rounded-lg text-xs transition-all flex items-center justify-center gap-1.5 cursor-pointer"
                    >
                      <span>🏢</span>
                      <span>Manage Floors & Parking →</span>
                    </button>
                    {!isActive && (
                      <button
                        type="button"
                        onClick={() => {
                          importReceivedMap(map.id);
                        }}
                        className="px-3 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 border border-slate-600 font-bold rounded-lg text-xs transition-all flex items-center gap-1 cursor-pointer"
                        title="Switch 3D canvas back to this map version"
                      >
                        <span>↺</span>
                        <span>Re-apply</span>
                      </button>
                    )}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};

// ─── MAIN CORPORATOR PANEL ──────────────────────────────────────────
const CorporatorPanel = () => {
  const { t } = useTranslation();
  const {
    corporatorMode,
    setCorporatorMode,
    alerts,
    dismissAlert,
    userRole,
    corporatorConsoleOpen,
    setCorporatorConsoleOpen,
    corporatorConsoleMinimized,
    setCorporatorConsoleMinimized,
    show3DLabels,
    toggle3DLabels,
    undergroundMode,
    toggleUndergroundMode,
    placingBuilding,
    cancelBuildingPlacement,
    confirmBuildingPlacement,
    userRegion,
    userRegionZone,
    userName,
    cityRegions,
    getUnreadNotificationCount,
    getSharedMapsForRegion,
    markNotificationRead
  } = useStore();

  const [isMaximized, setIsMaximized] = useState(false);
  // The panel's non-maximized height is capped at 82vh (see className
  // below). When dragged down, its top offset must leave at least that
  // much room to the bottom of the viewport, or content near the bottom of
  // the console gets clipped with no way to scroll the page to reach it.
  const CORPORATOR_PANEL_MAX_HEIGHT_VH = 0.82;
  const clampCorporatorPosition = (x, y) => {
    const maxY = Math.max(54, window.innerHeight * (1 - CORPORATOR_PANEL_MAX_HEIGHT_VH) - 10);
    return {
      x: Math.max(8, Math.min(window.innerWidth - 380, x)),
      y: Math.max(54, Math.min(maxY, y)),
    };
  };

  const [position, setPosition] = useState(() => {
    try {
      const saved = localStorage.getItem('corporator_console_pos');
      if (saved) {
        const parsed = JSON.parse(saved);
        return clampCorporatorPosition(parsed.x, parsed.y);
      }
    } catch (_) { }
    return clampCorporatorPosition(20, 68);
  });

  // Re-clamp on viewport resize so the panel never ends up stuck below the
  // visible area after shrinking the browser window.
  useEffect(() => {
    const handleResize = () => {
      setPosition(prev => clampCorporatorPosition(prev.x, prev.y));
    };
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  const [isDragging, setIsDragging] = useState(false);
  const dragStartRef = useRef({ mouseX: 0, mouseY: 0, posX: 20, posY: 68 });

  // Mouse Drag Handler
  const handleMouseDown = (e) => {
    if (isMaximized) return;
    if (e.target.closest('button') || e.target.closest('input') || e.target.closest('select') || e.target.closest('textarea')) {
      return;
    }
    setIsDragging(true);
    dragStartRef.current = {
      mouseX: e.clientX,
      mouseY: e.clientY,
      posX: position.x,
      posY: position.y,
    };
  };

  useEffect(() => {
    const handleMouseMove = (e) => {
      if (!isDragging) return;
      const dx = e.clientX - dragStartRef.current.mouseX;
      const dy = e.clientY - dragStartRef.current.mouseY;
      const newPos = clampCorporatorPosition(dragStartRef.current.posX + dx, dragStartRef.current.posY + dy);
      setPosition(newPos);
      try {
        localStorage.setItem('corporator_console_pos', JSON.stringify(newPos));
      } catch (_) { }
    };

    const handleMouseUp = () => {
      setIsDragging(false);
    };

    if (isDragging) {
      window.addEventListener('mousemove', handleMouseMove);
      window.addEventListener('mouseup', handleMouseUp);
    }
    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mouseup', handleMouseUp);
    };
  }, [isDragging]);

  const resetPosition = () => {
    setIsMaximized(false);
    const def = clampCorporatorPosition(20, 68);
    setPosition(def);
    try {
      localStorage.setItem('corporator_console_pos', JSON.stringify(def));
    } catch (_) { }
  };

  if (userRole !== 'corporator') return null;

  const regionData = cityRegions?.find(r => r.id === userRegion) || {};
  const regionName = regionData.name || userRegion || 'City Region';
  const zoneName = regionData.zone || userRegionZone || 'Central';
  const unreadCount = getUnreadNotificationCount ? getUnreadNotificationCount() : 0;
  const sharedMaps = getSharedMapsForRegion ? getSharedMapsForRegion() : [];

  // 1. When console is closed completely (Cut) -> Show prominent launcher button to get it back
  if (!corporatorConsoleOpen) {
    return (
      <div
        data-floating-panel="true"
        style={{ left: `${position.x}px`, top: `${position.y}px` }}
        className="fixed z-[9999] pointer-events-auto select-none"
      >
        <button
          onClick={() => {
            setCorporatorConsoleOpen(true);
            setCorporatorConsoleMinimized(false);
          }}
          className="group px-4 py-2.5 bg-gradient-to-r from-purple-700 via-purple-600 to-indigo-700 hover:from-purple-600 hover:to-indigo-600 text-white font-bold text-xs rounded-xl shadow-[0_0_25px_rgba(168,85,247,0.45)] border-2 border-purple-400/60 flex items-center gap-2.5 transition-all transform hover:scale-105 active:scale-95"
          title={t('corporator.reopenTitle')}
        >
          <span className="text-base animate-pulse">🛡️</span>
          <span className="tracking-wide">{t('corporator.openConsole')}</span>
          {alerts && alerts.length > 0 && (
            <span className="px-1.5 py-0.5 rounded-full bg-red-500 text-[10px] font-extrabold text-white">
              {alerts.length}
            </span>
          )}
        </button>
      </div>
    );
  }

  // 2. When console is MINIMIZED -> Show sleek compact draggable dock pill
  if (corporatorConsoleMinimized) {
    return (
      <div
        data-floating-panel="true"
        style={{ left: `${position.x}px`, top: `${position.y}px` }}
        className={`fixed z-[9999] pointer-events-auto select-none transition-shadow ${isDragging ? 'cursor-grabbing shadow-[0_0_30px_rgba(168,85,247,0.6)]' : 'cursor-grab'}`}
        onMouseDown={handleMouseDown}
      >
        <div className={`flex items-center gap-2.5 px-3.5 py-2.5 bg-slate-900/98 backdrop-blur-2xl border-2 rounded-xl shadow-[0_10px_35px_rgba(0,0,0,0.8)] text-xs text-white ${placingBuilding ? 'border-cyan-400 shadow-[0_0_25px_rgba(6,182,212,0.4)]' : 'border-purple-500/70'
          }`}>
          <GripHorizontal className={`w-4 h-4 opacity-80 ${placingBuilding ? 'text-cyan-400' : 'text-purple-400'}`} />

          {placingBuilding ? (
            <div className="flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-full bg-cyan-400 animate-ping" />
              <div className="flex flex-col">
                <span className="text-cyan-200 font-bold flex items-center gap-1">
                  <span>📍 {t('corporator.placing')}:</span>
                  <span className="text-white">{placingBuilding.model?.buildingName || t('corporator.tabs.building')}</span>
                </span>
                <span className="text-[10px] text-cyan-300/80 font-mono">
                  X: {placingBuilding.position?.[0] ?? 0}m, Z: {placingBuilding.position?.[1] ?? 0}m • ({placingBuilding.isValid ? t('corporator.validSite') : t('corporator.collision')})
                </span>
              </div>
            </div>
          ) : (
            <div className="flex items-center gap-1.5 font-bold">
              <span className="w-2 h-2 rounded-full bg-purple-400 animate-pulse" />
              <div className="flex flex-col">
                <span className="text-purple-200">{t('corporator.title')}</span>
                <span className="text-[10px] text-purple-400/80 font-mono">({corporatorMode || t('corporator.idle')})</span>
              </div>
            </div>
          )}

          {(alerts && alerts.length > 0) || unreadCount > 0 ? (
            <span className="px-1.5 py-0.2 bg-red-500 border border-red-400 text-white text-[10px] rounded-full font-mono">
              {Math.max((alerts?.length || 0), unreadCount)}
            </span>
          ) : null}

          {placingBuilding && (
            <div className="flex items-center gap-1.5 ml-1 pl-1 border-l border-cyan-500/40">
              <button
                type="button"
                onClick={cancelBuildingPlacement}
                className="px-2 py-1 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded text-[10px] font-bold border border-slate-700 transition-colors"
                title={t('corporator.cancelPlacement')}
              >
                {t('common.cancel')}
              </button>
              <button
                type="button"
                onClick={() => confirmBuildingPlacement()}
                disabled={!placingBuilding.isValid}
                className={`px-2.5 py-1 text-white rounded text-[10px] font-bold transition-all shadow-md ${placingBuilding.isValid
                  ? 'bg-cyan-600 hover:bg-cyan-500 cursor-pointer shadow-[0_0_12px_rgba(6,182,212,0.4)]'
                  : 'bg-slate-800 text-slate-500 border border-slate-700 cursor-not-allowed'
                  }`}
                title={t('corporator.confirmPlacement')}
              >
                ✓ {t('corporator.place')}
              </button>
            </div>
          )}

          <div className="flex items-center gap-1 ml-2 border-l border-slate-700/60 pl-2">
            <button
              onClick={() => setCorporatorConsoleMinimized(false)}
              className="p-1 hover:bg-purple-600/30 text-purple-300 rounded transition-colors"
              title={t('corporator.expandConsole')}
            >
              <Maximize2 className="w-3.5 h-3.5" />
            </button>
            <button
              onClick={() => setCorporatorConsoleOpen(false)}
              className="p-1 hover:bg-red-600/30 text-red-400 rounded transition-colors"
              title={t('corporator.closeConsoleCut')}
            >
              <X className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      </div>
    );
  }

  const modes = [
    { id: 'inbox', icon: Mail, label: t('corporator.tabs.inbox'), badge: unreadCount },
    { id: 'addBuilding', icon: Building2, label: t('corporator.tabs.building') },
    { id: 'manageParking', icon: Car, label: t('corporator.tabs.parking') },
    { id: 'addResident', icon: Users, label: t('corporator.tabs.resident') },
    { id: 'lidarScan', icon: Scan, label: t('corporator.tabs.lidar') },
    { id: 'droneUpload', icon: Plane, label: t('corporator.tabs.drone') },
    { id: 'gprScan', icon: Scan, label: t('corporator.tabs.gpr') },
    { id: 'editFloors', icon: Settings2, label: t('corporator.tabs.floors') },
    { id: 'addUnderground', icon: Database, label: t('corporator.tabs.subAsset') },
    { id: 'addInfra', icon: Route, label: t('corporator.tabs.infra') }
  ];

  return (
    <div
      data-floating-panel="true"
      style={isMaximized ? {} : { left: `${position.x}px`, top: `${position.y}px` }}
      className={isMaximized
        ? "fixed inset-3 md:inset-6 z-[9999] bg-white/98 backdrop-blur-2xl border-2 border-purple-300 rounded-2xl shadow-2xl flex flex-col pointer-events-auto overflow-hidden animate-in fade-in zoom-in-95 duration-150"
        : "fixed w-88 max-h-[82vh] overflow-y-auto bg-white/98 backdrop-blur-2xl border-2 border-purple-300/80 rounded-xl shadow-xl flex flex-col z-[9999] pointer-events-auto"
      }
    >

      {/* Draggable Header */}
      <div
        onMouseDown={handleMouseDown}
        className={`p-3 border-b border-purple-100 flex items-center justify-between bg-purple-50/70 select-none ${isMaximized ? 'cursor-default' : isDragging ? 'cursor-grabbing' : 'cursor-grab'}`}
        title={t('corporator.dragTooltip')}
      >
        <div className="flex items-center gap-2">
          <GripHorizontal className="w-4 h-4 text-purple-600/80 cursor-grab hover:text-purple-700" />
          <div className="w-2.5 h-2.5 rounded-full bg-purple-500 animate-pulse" />
          <div className="flex flex-col">
            <span className="text-xs font-bold text-slate-900 tracking-wide uppercase">
              {t('corporator.title')} {isMaximized && <span className="text-purple-600 text-[10px] ml-1 font-mono">({t('corporator.maximized')})</span>}
            </span>
            <span className="text-[10px] text-purple-700 font-medium">📍 {regionName} • {zoneName} Zone</span>
            {userName && <span className="text-[9px] text-slate-400">{userName}</span>}
          </div>
        </div>

        {/* Window controls: Reset, Toggle Labels, Maximize, Minimize, Close */}
        <div className="flex items-center gap-1">
          {unreadCount > 0 && (
            <button
              onClick={() => setCorporatorMode('inbox')}
              className="relative p-1 text-slate-500 hover:text-purple-700 rounded hover:bg-purple-100 transition-colors mr-1 cursor-pointer"
              title={`${unreadCount} unread notification(s)`}
            >
              <Bell className="w-4 h-4 text-yellow-500" />
              <span className="absolute top-0 right-0 flex h-3 w-3 items-center justify-center rounded-full bg-red-500 text-[8px] font-bold text-white border border-white">
                {unreadCount}
              </span>
            </button>
          )}
          <button
            onClick={toggleUndergroundMode}
            className={`px-2 py-0.5 rounded transition-all text-[10px] font-bold flex items-center gap-1 border cursor-pointer ${undergroundMode
              ? 'bg-cyan-100 text-cyan-800 border-cyan-300 shadow-2xs'
              : 'bg-white text-slate-700 border-slate-300 hover:border-cyan-400 hover:text-cyan-700'
              }`}
            title={undergroundMode ? t('corporator.returnToSurface') : t('corporator.diveUnderground')}
          >
            <span>{undergroundMode ? '🏙️' : '🚇'}</span>
            <span>{undergroundMode ? t('topbar.surfaceView') : t('corporator.underground')}</span>
          </button>
          <button
            onClick={() => setIsMaximized(!isMaximized)}
            className="p-1 text-slate-500 hover:text-purple-700 rounded hover:bg-purple-100 transition-colors cursor-pointer"
            title={isMaximized ? t('corporator.restoreWindow') : t('corporator.maximizeConsole')}
          >
            {isMaximized ? <Minimize2 className="w-3.5 h-3.5 text-purple-600" /> : <Maximize2 className="w-3.5 h-3.5" />}
          </button>
          <button
            onClick={resetPosition}
            className="p-1 text-slate-500 hover:text-purple-700 rounded hover:bg-purple-100 transition-colors cursor-pointer"
            title={t('corporator.snapBack')}
          >
            <RotateCcw className="w-3 h-3" />
          </button>
          <button
            onClick={toggle3DLabels}
            className={`p-1 rounded transition-colors text-[10px] flex items-center gap-0.5 cursor-pointer ${show3DLabels ? 'text-cyan-700 hover:bg-cyan-50' : 'text-slate-400 hover:bg-slate-100'}`}
            title={show3DLabels ? t('corporator.hide3dLabels') : t('corporator.show3dLabels')}
          >
            {show3DLabels ? <Eye className="w-3 h-3" /> : <EyeOff className="w-3 h-3" />}
          </button>
          <button
            onClick={() => setCorporatorConsoleMinimized(true)}
            className="p-1 text-slate-500 hover:text-yellow-600 rounded hover:bg-slate-100 transition-colors font-bold cursor-pointer"
            title={t('corporator.minimizeConsole')}
          >
            <Minus className="w-3.5 h-3.5" />
          </button>
          <button
            onClick={() => setCorporatorConsoleOpen(false)}
            className="p-1 text-slate-500 hover:text-red-600 rounded hover:bg-red-50 transition-colors font-bold cursor-pointer"
            title={t('corporator.closeConsole')}
          >
            <X className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {/* Real-time Alerts */}
      {alerts && alerts.length > 0 && (
        <div className="p-2.5 bg-slate-50 border-b border-slate-200 space-y-1.5 max-h-36 overflow-y-auto">
          {alerts.map(alert => (
            <div key={alert.id} className="flex items-start gap-2 p-1.5 rounded bg-white border border-slate-200 text-xs shadow-2xs">
              <AlertIcon type={alert.type} />
              <div className="flex-1 min-w-0">
                <p className="font-semibold text-slate-800 text-[11px] truncate">{alert.title}</p>
                <p className="text-slate-600 text-[10px] leading-tight">{alert.message}</p>
              </div>
              <button onClick={() => dismissAlert(alert.id)} className="text-slate-400 hover:text-slate-700 ml-1 cursor-pointer">
                <X className="w-3.5 h-3.5" />
              </button>
            </div>
          ))}
        </div>
      )}

      {/* Toolbar */}
      <div className="p-2.5 border-b border-slate-200 grid grid-cols-4 gap-1.5 bg-slate-50/50">
        {modes.map(m => {
          const Icon = m.icon;
          const isActive = corporatorMode === m.id;
          return (
            <button
              key={m.id}
              onClick={() => setCorporatorMode(isActive ? null : m.id)}
              title={m.label}
              className={`relative p-2 flex flex-col items-center justify-center rounded-lg transition-all cursor-pointer ${isActive
                ? 'bg-purple-100 border border-purple-300 text-purple-800 shadow-2xs'
                : 'bg-white border border-slate-200 text-slate-600 hover:bg-slate-50 hover:text-slate-900'
                }`}
            >
              {m.badge > 0 && (
                <span className="absolute top-1 right-1 flex h-2.5 w-2.5 items-center justify-center rounded-full bg-red-500 text-[8px] text-white border border-white" />
              )}
              <Icon className="w-4 h-4 mb-1" />
              <span className="text-[9px] font-bold leading-tight">{m.label}</span>
            </button>
          )
        })}
      </div>

      {/* Active Form */}
      {corporatorMode ? (
        <div className="p-3.5">
          {corporatorMode === 'inbox' && <InboxPanel regionName={regionName} sharedMaps={sharedMaps} unreadCount={unreadCount} markNotificationRead={markNotificationRead} setCorporatorMode={setCorporatorMode} />}
          {corporatorMode === 'addBuilding' && <AddBuildingForm />}
          {corporatorMode === 'manageParking' && <ManageParkingForm />}
          {corporatorMode === 'addResident' && <AddResidentForm />}
          {corporatorMode === 'lidarScan' && <LidarScanner />}
          {corporatorMode === 'droneUpload' && <DroneUpload />}
          {corporatorMode === 'gprScan' && <GPRScanner />}
          {corporatorMode === 'editFloors' && <EditFloorsForm />}
          {corporatorMode === 'addUnderground' && <AddUndergroundForm />}
          {corporatorMode === 'addInfra' && <AddInfrastructureForm />}
        </div>
      ) : (
        <div className="p-4 text-center text-slate-500 text-xs">
          <p>{t('corporator.emptyState')}</p>
        </div>
      )}
    </div>
  );
};

export default CorporatorPanel;
