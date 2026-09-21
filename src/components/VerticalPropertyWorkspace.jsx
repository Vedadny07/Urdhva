import React, { useEffect, useMemo, useState } from 'react'
import useStore from '../store'
import { FileText, Layers3, Network, Download, MapPinned, Ruler, Box } from 'lucide-react'

const UTILITY_META = {
  water: { label: 'Water', color: '#06b6d4' },
  sewer: { label: 'Sewer', color: '#8b5cf6' },
  gas: { label: 'Gas', color: '#f97316' },
  electricity: { label: 'Electricity', color: '#eab308' },
  telecom: { label: 'Telecom', color: '#2563eb' },
}

function num(value) {
  const n = Number(value)
  return Number.isFinite(n) ? n : null
}

function fmt(value, digits = 1) {
  const n = num(value)
  return n == null ? 'Not available' : n.toFixed(digits).replace(/\.0$/, '')
}

function areaToM2(value) {
  if (value == null) return null
  if (typeof value === 'number' && Number.isFinite(value)) return value
  const s = String(value).replace(/,/g, '').toLowerCase()
  const n = parseFloat(s)
  if (!Number.isFinite(n)) return null
  if (s.includes('sq ft') || s.includes('sqft') || s.includes('ft²')) return n * 0.092903
  if (s.includes('acre')) return n * 4046.8564224
  return n
}

function stableId(value = '') {
  let hash = 2166136261
  for (const ch of String(value)) {
    hash ^= ch.charCodeAt(0)
    hash = Math.imul(hash, 16777619)
  }
  return Math.abs(hash >>> 0).toString(36).toUpperCase().padStart(8, '0').slice(0, 8)
}

function demoBuildingCode(feature) {
  return `B-${stableId(feature?.source_id || feature?.id || feature?.name || 'BUILDING').slice(0, 6)}`
}

function demoParcelUlpin(feature) {
  const official = String(feature?.official_ulpin || '').trim()
  if (official) return official
  return `DEMO-ULPIN-${stableId(feature?.source_id || feature?.name || 'URDHVA')}`
}

function buildFloorUnits(feature, linkedRecord, floor, floorHeight) {
  const sourceFloor = linkedRecord?.units?.find((u) => Number(u?.floorNumber) === floor && String(u?.type || '').toLowerCase() === 'floor')
  const familyUnits = Array.isArray(sourceFloor?.families) ? sourceFloor.families.slice(0, 4) : []
  if (familyUnits.length) {
    return familyUnits.map((family, idx) => ({
      label: `U${family.unit || `${floor}${String(idx + 1).padStart(2, '0')}`}`,
      name: family.name || 'Source-linked unit record',
      areaM2: areaToM2(family.area),
      id: `${demoBuildingCode(feature)}-F${String(floor).padStart(2, '0')}-U${String(idx + 1).padStart(2, '0')}`,
      source: 'Existing URDHVA property record',
      volumeM3: areaToM2(family.area) && floorHeight ? areaToM2(family.area) * floorHeight : null,
    }))
  }
  return [1, 2, 3, 4].map((unit) => ({
    label: `U${floor}${String(unit).padStart(2, '0')}`,
    name: 'Prototype flat volume',
    areaM2: null,
    id: `${demoBuildingCode(feature)}-F${String(floor).padStart(2, '0')}-U${String(unit).padStart(2, '0')}`,
    source: 'Synthetic layout',
    volumeM3: null,
  }))
}

export default function VerticalPropertyWorkspace({ feature }) {
  const buildings = useStore((s) => s.buildings) || []
  const maharashtraUlpinResult = useStore((s) => s.maharashtraUlpinResult)
  const geoSelectedUtility = useStore((s) => s.geoSelectedUtility)
  const requestGeoUtility = useStore((s) => s.requestGeoUtility)
  const requestGeoUnderground = useStore((s) => s.requestGeoUnderground)
  const [tab, setTab] = useState('structure')
  const [floor, setFloor] = useState(1)
  const [comparison, setComparison] = useState(null)
  const [comparisonLoading, setComparisonLoading] = useState(false)
  const [sourceInfo, setSourceInfo] = useState(null)

  const linkedRecord = useMemo(() => {
    const sourceId = String(feature?.source_id || '')
    const explicitId = feature?.urdhva_building_id || feature?.property_id
    return buildings.find((b) => String(b?.id || '') === String(explicitId || '')) ||
      buildings.find((b) => String(b?.sourceId || '') === sourceId) ||
      buildings.find((b) => String(b?.name || '').trim().toLowerCase() === String(feature?.name || '').trim().toLowerCase()) || null
  }, [buildings, feature])

  const floors = Math.max(0, Math.min(36, Math.round(num(feature?.levels) ?? num(feature?.estimated_floors) ?? 0)))
  const height = num(feature?.height_m) ?? num(feature?.render_height_m)
  const floorHeight = floors > 0 && height > 0 ? height / floors : 3.2
  const floorUnits = useMemo(() => buildFloorUnits(feature, linkedRecord, Math.min(Math.max(1, floor), Math.max(1, floors)), floorHeight), [feature, linkedRecord, floor, floors, floorHeight])
  const officialUlpin = String(maharashtraUlpinResult?.status === 'resolved' ? maharashtraUlpinResult?.ulpin || '' : feature?.official_ulpin || '').trim()
  const existingParcelRecordId = String(linkedRecord?.baseUlpin || '').trim()
  const parcelDisplayId = officialUlpin || existingParcelRecordId
  const parcelStatus = officialUlpin ? 'Official parcel ULPIN linked' : existingParcelRecordId ? 'Existing URDHVA parcel record linked' : 'Official parcel/ULPIN not linked'
  const parcelSource = officialUlpin ? 'Authorized Maharashtra source' : existingParcelRecordId ? 'Existing URDHVA local property dataset' : 'No authoritative parcel source linked'

  useEffect(() => {
    setFloor((current) => Math.min(Math.max(1, current), Math.max(1, floors || 1)))
  }, [floors])

  useEffect(() => {
    let cancelled = false
    async function loadSources() {
      try {
        const response = await fetch('/api/geo/data-sources', { headers: { Accept: 'application/json' } })
        if (!response.ok) return
        const payload = await response.json()
        if (!cancelled) setSourceInfo(payload)
      } catch (_) {}
    }
    void loadSources()
    return () => { cancelled = true }
  }, [])

  useEffect(() => {
    let cancelled = false
    async function loadComparison() {
      if (!feature) return
      setComparisonLoading(true)
      try {
        const params = new URLSearchParams({
          source_id: String(feature.source_id || ''),
          name: String(feature.name || ''),
          height_m: String(feature.height_m ?? ''),
          levels: String(feature.levels ?? feature.estimated_floors ?? ''),
          footprint_area_m2: String(feature.footprint_area_m2 ?? ''),
        })
        const response = await fetch(`/api/geo/record-reality?${params.toString()}`, { headers: { Accept: 'application/json' } })
        const payload = response.ok ? await response.json() : null
        if (!cancelled) setComparison(payload)
      } catch (_) {
        if (!cancelled) setComparison(null)
      } finally {
        if (!cancelled) setComparisonLoading(false)
      }
    }
    void loadComparison()
    return () => { cancelled = true }
  }, [feature])

  const passport = useMemo(() => ({
    platform: 'URDHVA — 3D Cadastral Intelligence Platform',
    location: feature?.coordinates ? { latitude: feature.coordinates[1], longitude: feature.coordinates[0] } : null,
    building: {
      sourceId: feature?.source_id || null,
      name: feature?.name || null,
      type: feature?.building_type || feature?.class || null,
      heightM: feature?.height_m ?? null,
      renderHeightM: feature?.render_height_m ?? null,
      floors: floors || null,
      undergroundFloors: feature?.levels_underground ?? null,
      footprintAreaM2: feature?.footprint_area_m2 ?? null,
    },
    parcel: {
      officialUlpIn: officialUlpin || null,
      existingUrdhvaParcelId: existingParcelRecordId || null,
      displayParcelId: parcelDisplayId || null,
      source: parcelSource,
      status: parcelStatus,
    },
    vertical: {
      layoutStatus: linkedRecord ? 'Existing URDHVA property record linked' : 'Prototype flat partition',
      floorCount: floors || null,
      flatsPerFloor: linkedRecord ? 'Source-linked where available' : 4,
      currentFloor: floors ? floor : null,
      floorUnits: floorUnits.map((u) => ({ label: u.label, name: u.name, areaM2: u.areaM2, urdhvaVerticalId: u.id })),
      verticalIdentifierRule: 'Parcel ULPIN remains parcel-level; floor/unit identifier is a URDHVA vertical property identifier.',
    },
    underground: geoSelectedUtility ? {
      category: geoSelectedUtility.category,
      name: geoSelectedUtility.name || null,
      depthM: geoSelectedUtility.depth_m ?? null,
      source: geoSelectedUtility.source || null,
      dataStatus: geoSelectedUtility.data_status || null,
    } : null,
    provenance: {
      source: feature?.source || feature?.['@geometry_source'] || null,
      heightSource: feature?.height_source || null,
      floorSource: feature?.levels != null ? 'Source-provided floor count' : feature?.estimated_floors != null ? 'Estimated from source height' : 'Unavailable',
    },
    recordVsReality: comparison?.comparison || null,
  }), [feature, floors, officialUlpin, parcelStatus, linkedRecord, floor, floorUnits, geoSelectedUtility, comparison])

  const downloadPassport = () => {
    const blob = new Blob([JSON.stringify(passport, null, 2)], { type: 'application/json' })
    const url = URL.createObjectURL(blob)
    const anchor = document.createElement('a')
    anchor.href = url
    anchor.download = `URDHVA-Property-Passport-${stableId(feature?.source_id || feature?.name || 'property')}.json`
    anchor.click()
    URL.revokeObjectURL(url)
  }

  const tabs = [
    ['structure', 'Vertical Structure', Layers3],
    ['parcel', 'Parcel + ULPIN', MapPinned],
    ['reality', 'Record vs Reality', Ruler],
    ['underground', 'Underground', Network],
    ['passport', 'Property Passport', FileText],
  ]

  return (
    <section className="rounded-xl border border-cyan-200 bg-white overflow-hidden shadow-sm">
      <div className="px-3 py-2.5 border-b border-slate-200 bg-gradient-to-r from-cyan-50 to-white">
        <div className="flex items-center justify-between gap-2">
          <div>
            <div className="text-[9px] uppercase tracking-wider font-bold text-cyan-800">URDHVA vertical property workspace</div>
            <div className="text-[10px] text-slate-500 mt-0.5">Building → parcel → floor → unit → survey → underground → property passport</div>
          </div>
          <div className="text-right text-[8px] text-slate-500">{linkedRecord ? 'URDHVA record linked' : 'Geographic source context'}</div>
        </div>
        <div className="grid grid-cols-5 gap-1 mt-2">
          {tabs.map(([key, label, Icon]) => (
            <button key={key} type="button" onClick={() => setTab(key)} className={`px-1.5 py-1.5 rounded-md border text-[8px] font-bold flex flex-col items-center gap-1 ${tab === key ? 'bg-cyan-600 text-white border-cyan-600' : 'bg-white text-slate-600 border-slate-200 hover:bg-cyan-50'}`}>
              <Icon className="w-3 h-3" />
              <span className="leading-tight text-center">{label}</span>
            </button>
          ))}
        </div>
        <div className="mt-2 flex flex-wrap gap-1 text-[7px]">
          <span className="px-1.5 py-1 rounded-full bg-slate-100 text-slate-600">Buildings: Overture</span>
          <span className="px-1.5 py-1 rounded-full bg-slate-100 text-slate-600">Detail: OSM</span>
          <span className="px-1.5 py-1 rounded-full bg-slate-100 text-slate-600">Property: URDHVA DB</span>
          <span className={`px-1.5 py-1 rounded-full ${sourceInfo?.sources?.some((source) => String(source?.id || '').startsWith('authorized_') && source.status === 'configured') ? 'bg-emerald-50 text-emerald-700' : 'bg-amber-50 text-amber-700'}`}>Authorized utility GIS: {sourceInfo?.sources?.some((source) => String(source?.id || '').startsWith('authorized_') && source.status === 'configured') ? 'configured' : 'optional / not configured'}</span>
        </div>
      </div>

      <div className="p-3 space-y-3">
        {tab === 'structure' && (
          <>
            <div className="grid grid-cols-3 gap-2">
              <div className="rounded-lg bg-slate-50 border border-slate-200 p-2"><div className="text-[8px] text-slate-400">Floors</div><div className="text-sm font-mono font-bold text-slate-900">{floors || '—'}</div></div>
              <div className="rounded-lg bg-slate-50 border border-slate-200 p-2"><div className="text-[8px] text-slate-400">Floor height</div><div className="text-sm font-mono font-bold text-slate-900">{height ? `${fmt(floorHeight, 2)} m` : '3.2 m est.'}</div></div>
              <div className="rounded-lg bg-slate-50 border border-slate-200 p-2"><div className="text-[8px] text-slate-400">Underground</div><div className="text-sm font-mono font-bold text-slate-900">{feature?.levels_underground ?? '—'}</div></div>
            </div>
            {floors > 0 ? (
              <>
                <div className="flex items-center gap-2">
                  <span className="text-[9px] font-bold text-slate-500">Selected floor</span>
                  <input type="range" min="1" max={String(floors)} value={Math.min(floor, floors)} onChange={(e) => setFloor(Number(e.target.value))} className="flex-1 accent-cyan-600" />
                  <span className="text-[10px] font-mono font-bold text-cyan-700">F{String(Math.min(floor, floors)).padStart(2, '0')}</span>
                </div>
                <div className="grid grid-cols-2 gap-2">
                  {floorUnits.map((unit) => (
                    <div key={unit.id} className="rounded-lg border border-cyan-100 bg-cyan-50/50 p-2">
                      <div className="flex items-center justify-between gap-1"><span className="text-[11px] font-mono font-bold text-slate-900">{unit.label}</span><Box className="w-3 h-3 text-cyan-600" /></div>
                      <div className="text-[8px] text-slate-500 mt-0.5 truncate">{unit.name}</div>
                      <div className="text-[8px] text-slate-600 mt-1">Area: {unit.areaM2 ? `${unit.areaM2.toFixed(1)} m²` : 'visual estimate only'}</div>
                      <div className="text-[8px] text-slate-600">Volume: {unit.volumeM3 ? `${unit.volumeM3.toFixed(1)} m³` : 'visual volume not sourced'}</div>
                      <div className="mt-1 text-[7px] font-mono text-cyan-800 break-all">{unit.id}</div>
                    </div>
                  ))}
                </div>
                <div className="rounded-lg border border-amber-200 bg-amber-50/60 p-2 text-[8px] leading-relaxed text-amber-800">
                  <b>{linkedRecord ? 'Source-linked unit records are shown where the existing URDHVA property dataset has them.' : 'Prototype layout: four visual flat volumes per floor.'}</b> Flat geometry is not claimed as survey-grade unless supplied by CAD/BIM/survey data.
                </div>
              </>
            ) : (
              <div className="rounded-lg border border-slate-200 bg-slate-50 p-3 text-[9px] text-slate-500">No above-ground floor source is available for this geographic building. URDHVA keeps the footprint and reports the vertical data as unavailable.</div>
            )}
          </>
        )}

        {tab === 'parcel' && (
          <>
            <div className={`rounded-lg border p-3 ${officialUlpin ? 'border-emerald-200 bg-emerald-50' : existingParcelRecordId ? 'border-cyan-200 bg-cyan-50' : 'border-amber-200 bg-amber-50'}`}>
              <div className="text-[8px] uppercase tracking-wider font-bold text-slate-500">Official ULPIN status</div>
              <div className="text-sm font-mono font-bold text-slate-900 mt-1 break-all">{parcelDisplayId || 'Not available / not linked'}</div>
              <div className="text-[8px] text-slate-600 mt-1">{officialUlpin ? 'Authoritative parcel ULPIN supplied by the configured Maharashtra source.' : existingParcelRecordId ? 'Existing URDHVA parcel record shown as local property context; it is not claimed to be a newly resolved government ULPIN.' : 'URDHVA does not invent an official ULPIN from a building footprint.'}</div>
            </div>
            <div className="rounded-lg border border-slate-200 p-3 space-y-1.5 text-[9px]">
              <div className="flex justify-between"><span className="text-slate-500">Building footprint</span><span className="font-bold">{feature?.footprint_area_m2 ? `${fmt(feature.footprint_area_m2, 2)} m²` : 'Not available'}</span></div>
              <div className="flex justify-between"><span className="text-slate-500">Cadastral relation</span><span className="font-bold">{officialUlpin || existingParcelRecordId ? 'Linked' : 'Not linked'}</span></div>
              <div className="flex justify-between"><span className="text-slate-500">Parcel source</span><span className="font-bold text-right">{parcelSource}</span></div>
            </div>
          </>
        )}

        {tab === 'reality' && (
          <>
            <div className="grid grid-cols-2 gap-2">
              <div className="rounded-lg border border-slate-200 p-2"><div className="text-[8px] text-slate-400">Geographic record</div><div className="text-[11px] font-bold text-slate-900 mt-1">{feature?.levels ?? feature?.estimated_floors ?? '—'} floors</div><div className="text-[8px] text-slate-500">{feature?.height_m ? `${fmt(feature.height_m, 2)} m source height` : 'height unavailable'}</div></div>
              <div className="rounded-lg border border-slate-200 p-2"><div className="text-[8px] text-slate-400">URDHVA survey record</div><div className="text-[11px] font-bold text-slate-900 mt-1">{comparison?.matched ? `${comparison.record?.actualFloors ?? '—'} actual floors` : 'Not linked'}</div><div className="text-[8px] text-slate-500">{comparison?.matched ? `${comparison.record?.actualDepth ?? '—'} m actual depth` : 'LiDAR / drone / survey link required'}{comparison?.matched && <div className="text-[7px] text-cyan-700 mt-0.5">Drone survey links: {comparison.record?.droneSurveyCount ?? 0}</div>}</div></div>
            </div>
            <div className="rounded-lg border border-slate-200 p-2 text-[8px] text-slate-600">
              {comparisonLoading ? 'Loading matched URDHVA record…' : comparison?.matched ? (
                <div className="space-y-1"><div className="font-bold text-emerald-700">Matched existing URDHVA property record</div><div>Floor difference: <b>{comparison.comparison?.floorDelta ?? '—'}</b></div><div>Depth difference: <b>{comparison.comparison?.depthDeltaM ?? '—'} m</b></div><div className="text-slate-400">Match basis: {comparison.match_basis || 'record linkage'}</div></div>
              ) : 'No linked survey/property record was found for this geographic building. The prototype will not fabricate a “reality” measurement.'}
            </div>
          </>
        )}

        {tab === 'underground' && (
          <>
            <div className="grid grid-cols-2 gap-1.5">
              {Object.entries(UTILITY_META).map(([key, meta]) => (
                <button key={key} type="button" onClick={() => requestGeoUtility(key)} className="rounded-lg border px-2 py-2 text-left hover:bg-slate-50" style={{ borderColor: `${meta.color}55` }}>
                  <div className="flex items-center gap-1.5 text-[9px] font-bold"><span className="w-2 h-2 rounded-full" style={{ background: meta.color }} />{meta.label}</div>
                  <div className="text-[7px] text-slate-500 mt-0.5">Open map layer</div>
                </button>
              ))}
            </div>
            <div className="rounded-lg border border-slate-200 p-3">
              <div className="text-[9px] font-bold text-slate-800">Selected utility</div>
              {geoSelectedUtility ? (
                <div className="mt-2 space-y-1.5 text-[8px]">
                  <div className="flex justify-between"><span className="text-slate-500">Category</span><b className="capitalize">{geoSelectedUtility.category}</b></div>
                  <div className="flex justify-between"><span className="text-slate-500">Depth</span><b>{geoSelectedUtility.depth_m != null ? `${geoSelectedUtility.depth_m} m` : 'Not available'}</b></div>
                  <div className="flex justify-between"><span className="text-slate-500">Source</span><b className="max-w-[65%] text-right">{geoSelectedUtility.source || 'Not available'}</b></div>
                  <button type="button" onClick={() => requestGeoUnderground(geoSelectedUtility.category)} className="mt-2 w-full rounded-lg bg-slate-900 text-white px-2 py-1.5 text-[8px] font-bold">Open underground 3D</button>
                </div>
              ) : (
                <div className="text-[8px] text-slate-500 mt-1">Select a mapped utility line on the geographic map to inspect its depth and underground context.</div>
              )}
            </div>
          </>
        )}

        {tab === 'passport' && (
          <>
            <div className="rounded-lg border border-cyan-200 bg-cyan-50/60 p-3">
              <div className="text-[10px] font-bold text-slate-900">URDHVA Property Passport</div>
              <div className="mt-2 grid grid-cols-2 gap-2 text-[8px]">
                <div><span className="text-slate-400">Building</span><div className="font-bold text-slate-800 truncate">{feature?.name || 'Unnamed building'}</div></div>
                <div><span className="text-slate-400">Parcel</span><div className="font-mono font-bold text-slate-800 truncate">{parcelDisplayId || demoParcelUlpin(feature)}</div></div>
                <div><span className="text-slate-400">Floors</span><div className="font-bold">{floors || 'Not available'}</div></div>
                <div><span className="text-slate-400">Current unit</span><div className="font-mono font-bold">{floorUnits[0]?.id || 'Not available'}</div></div>
                <div><span className="text-slate-400">Record vs Reality</span><div className="font-bold">{comparison?.matched ? 'Linked' : 'Pending survey link'}</div></div>
                <div><span className="text-slate-400">Utility</span><div className="font-bold capitalize">{geoSelectedUtility?.category || 'None selected'}</div></div>
              </div>
            </div>
            <div className="text-[8px] leading-relaxed text-slate-500">The passport separates official parcel ULPIN from URDHVA vertical identifiers. Source, estimated, survey-derived and demo data remain explicitly distinguished.</div>
            <button type="button" onClick={downloadPassport} className="w-full inline-flex items-center justify-center gap-1.5 rounded-lg bg-cyan-700 hover:bg-cyan-800 text-white px-3 py-2 text-[9px] font-bold"><Download className="w-3.5 h-3.5" /> Download Property Passport JSON</button>
          </>
        )}
      </div>
    </section>
  )
}
