import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import useStore from '../store'
import { Compass, Layers3, Rotate3d, DatabaseZap, Gauge, RefreshCw, MapPinned, Building2, Maximize2, Box, Target } from 'lucide-react'
import { expandOsmFeaturesToFloorFeatures, summarizeOsmFloorFeatures } from '../utils/osm3d'
import Underground3DExplorer from './Underground3DExplorer'
import { buildDemoUtilityFeaturesFromRoads, isDemoUtilityFeature } from '../utils/demoUtilityNetwork'

const INDIA_CENTER = [78.9629, 22.5937]
const INDIA_ZOOM = 4.6
const OVERTURE_RELEASE = '2026-08-19.0'
const OVERTURE_BUILDINGS = `https://overturemaps-extras-us-west-2.s3.us-west-2.amazonaws.com/tiles/${OVERTURE_RELEASE}/buildings.pmtiles`
const OVERTURE_TRANSPORTATION = `https://overturemaps-extras-us-west-2.s3.us-west-2.amazonaws.com/tiles/${OVERTURE_RELEASE}/transportation.pmtiles`
const OVERTURE_BASE = `https://overturemaps-extras-us-west-2.s3.us-west-2.amazonaws.com/tiles/${OVERTURE_RELEASE}/base.pmtiles`
const OSM_DEFAULT_FLOOR_HEIGHT_M = 3.2

function asNumber(value) {
  const n = Number(value)
  return Number.isFinite(n) ? n : null
}

function parseMaybeObject(value) {
  if (value == null) return null
  if (typeof value === 'object') return value
  try { return JSON.parse(value) } catch (_) { return null }
}

function pickPrimaryName(props = {}) {
  if (props['@name']) return props['@name']
  if (props.name) return props.name
  const names = parseMaybeObject(props.names)
  return names?.primary || names?.common || null
}

function projectMeters(lon, lat, lat0) {
  return [lon * 111320 * Math.cos(lat0 * Math.PI / 180), lat * 110540]
}

function ringMetrics(ring) {
  if (!Array.isArray(ring) || ring.length < 3) return null
  const pts = ring.filter(p => Array.isArray(p) && p.length >= 2)
  if (pts.length < 3) return null
  const lat0 = pts.reduce((s, p) => s + Number(p[1]), 0) / pts.length
  const local = pts.map(p => projectMeters(Number(p[0]), Number(p[1]), lat0))
  let area2 = 0
  for (let i = 0; i < local.length; i++) {
    const [x1, y1] = local[i]
    const [x2, y2] = local[(i + 1) % local.length]
    area2 += x1 * y2 - x2 * y1
  }
  const area = Math.abs(area2) / 2
  const xs = local.map(p => p[0])
  const ys = local.map(p => p[1])
  return {
    area,
    length: Math.max(...xs) - Math.min(...xs),
    breadth: Math.max(...ys) - Math.min(...ys),
  }
}

function geometryMetrics(geometry) {
  if (!geometry) return null
  const type = geometry.type
  const coordinates = geometry.coordinates
  if (type === 'Polygon') return ringMetrics(coordinates?.[0])
  if (type === 'MultiPolygon') {
    const parts = (coordinates || []).map(poly => ringMetrics(poly?.[0])).filter(Boolean)
    if (!parts.length) return null
    return parts.reduce((best, item) => (item.area > best.area ? item : best), parts[0])
  }
  return null
}

function deterministicFeatureId(feature, layerType) {
  const props = feature?.properties || {}
  if (props.id != null) return String(props.id)
  if (feature?.id != null) return String(feature.id)
  const metrics = geometryMetrics(feature?.geometry)
  const coords = feature?.geometry?.coordinates?.[0]?.[0]
  if (Array.isArray(coords)) return `${layerType}-${Number(coords[0]).toFixed(6)}-${Number(coords[1]).toFixed(6)}`
  return `${layerType}-${metrics?.area ? Math.round(metrics.area) : 'unknown'}`
}

function sourceLabel(props = {}) {
  const candidate = props['@geometry_source'] || props.geometry_source || props['@height_source'] || props.height_source
  if (!candidate) return 'Overture Buildings'
  if (typeof candidate === 'string') return candidate
  if (Array.isArray(candidate)) return candidate.join(', ')
  if (typeof candidate === 'object') return JSON.stringify(candidate)
  return String(candidate)
}

export function normalizeGeographicFeature(feature, layerType) {
  const props = { ...(feature?.properties || {}) }
  const height = asNumber(props.height ?? props.height_m ?? props.building_height)
  const levels = asNumber(props.num_floors ?? props.levels ?? props['building:levels'] ?? props['building:levels:aboveground'])
  const estimatedFloorsRaw = asNumber(props.estimated_floors)
  const levelsUnderground = asNumber(props.num_floors_underground ?? props.levels_underground)
  const minHeight = asNumber(props.min_height ?? props.min_height_m)
  const minFloor = asNumber(props.min_floor)
  const roofHeight = asNumber(props.roof_height ?? props.roof_height_m)
  const sourceHeight = height && height > 0 ? Number(height.toFixed(2)) : null
  const sourceLevels = levels != null && levels > 0 ? Math.min(36, Math.round(levels)) : null
  const derivedEstimatedFloors = sourceHeight ? Math.min(36, Math.max(1, Math.round(sourceHeight / OSM_DEFAULT_FLOOR_HEIGHT_M))) : null
  const estimatedFloors = estimatedFloorsRaw != null && estimatedFloorsRaw > 0 ? Math.min(36, Math.round(estimatedFloorsRaw)) : (sourceLevels == null ? derivedEstimatedFloors : null)
  const heightEstimate = sourceHeight == null && sourceLevels ? Number((sourceLevels * OSM_DEFAULT_FLOOR_HEIGHT_M + (roofHeight || 0)).toFixed(2)) : null
  const renderHeight = sourceHeight || heightEstimate || 0.35
  const floorHeight = sourceLevels ? Number(((sourceHeight || heightEstimate) / sourceLevels).toFixed(2)) : null
  const dataStatus = sourceHeight
    ? 'source_height'
    : sourceLevels
      ? 'source_levels_estimated_height'
      : 'footprint_only'
  const metrics = geometryMetrics(feature?.geometry)
  const source = sourceLabel(props)
  return {
    ...props,
    name: pickPrimaryName(props),
    source,
    source_id: deterministicFeatureId(feature, layerType),
    height_m: sourceHeight,
    render_height_m: Number(renderHeight.toFixed(2)),
    estimated_height_m: heightEstimate,
    levels: sourceLevels,
    estimated_floors: estimatedFloors != null && estimatedFloors > 0 ? Math.min(36, Math.round(estimatedFloors)) : null,
    levels_underground: levelsUnderground != null && levelsUnderground > 0 ? Math.round(levelsUnderground) : null,
    min_height_m: minHeight && minHeight > 0 ? Number(minHeight.toFixed(2)) : null,
    min_floor: minFloor != null ? Number(minFloor) : null,
    roof_height_m: roofHeight && roofHeight > 0 ? Number(roofHeight.toFixed(2)) : null,
    floor_height_m: floorHeight,
    floor_height_source: sourceLevels ? (sourceHeight ? 'Derived from source height / source floors' : 'Visualization estimate: 3.2 m default floor height') : 'Unavailable',
    length_m: metrics?.length ? Number(metrics.length.toFixed(2)) : null,
    breadth_m: metrics?.breadth ? Number(metrics.breadth.toFixed(2)) : null,
    footprint_area_m2: metrics?.area ? Number(metrics.area.toFixed(2)) : null,
    footprint_metrics_source: 'Computed from source footprint geometry',
    height_source: props['@height_source'] || (sourceHeight ? 'Source-provided height' : sourceLevels ? 'Estimated for visualization from source floors' : 'Unavailable'),
    floors_status: sourceLevels ? 'Source-provided' : estimatedFloors ? 'Estimated from source height' : 'Unavailable',
    confidence: sourceHeight ? 'Source-provided' : sourceLevels ? 'Estimated height from source floor count' : 'Footprint only',
    data_status: dataStatus,
    building_part: layerType === 'building_part' ? 'building_part' : (props.building_part || null),
    parent_building_id: layerType === 'building_part' ? (props.building_id || props.parent_building_id || null) : null,
    provider_type: layerType,
    geometry: feature?.geometry || null,
  }
}

function normalizeOsmFeature(feature) {
  const props = { ...(feature?.properties || {}) }
  const geometry = feature?.geometry || null
  const metrics = geometryMetrics(geometry)
  const height = asNumber(props.height_m ?? props.height)
  const levels = asNumber(props.levels ?? props.levels_aboveground ?? props['building:levels'])
  const estimated = asNumber(props.render_height_m ?? props.estimated_height_m)
  const sourceId = props.source_id || (props.id != null ? `way/${props.id}` : deterministicFeatureId(feature, 'osm'))
  const sourceHeight = height != null && height > 0 ? Number(height.toFixed(2)) : null
  const sourceLevels = levels != null && levels > 0 ? Math.min(36, Math.round(levels)) : null
  const estimatedHeight = sourceHeight == null && (estimated != null && estimated > 0) ? Number(estimated.toFixed(2)) : null
  return {
    ...props,
    geometry,
    name: props.name || props.building_type || null,
    source: props.source || 'OpenStreetMap via Overpass API',
    source_id: sourceId,
    height_m: sourceHeight,
    levels: sourceLevels,
    estimated_floors: asNumber(props.estimated_floors) != null && Number(props.estimated_floors) > 0 ? Math.min(36, Math.round(Number(props.estimated_floors))) : null,
    estimated_height_m: estimatedHeight,
    render_height_m: sourceHeight || estimatedHeight || 0.35,
    length_m: metrics?.length ? Number(metrics.length.toFixed(2)) : (props.length_m || null),
    breadth_m: metrics?.breadth ? Number(metrics.breadth.toFixed(2)) : (props.breadth_m || null),
    footprint_area_m2: metrics?.area ? Number(metrics.area.toFixed(2)) : (props.footprint_area_m2 || null),
    footprint_metrics_source: 'Computed from source footprint geometry',
    floor_height_m: props.floor_height_m ?? (sourceLevels ? Number(((sourceHeight || (sourceLevels * 3.2)) / sourceLevels).toFixed(2)) : null),
    floor_height_source: props.floor_height_source || (sourceLevels ? (sourceHeight ? 'Derived from source height / source floors' : 'Visualization estimate: 3.2 m default floor height') : 'Unavailable'),
    provider_type: 'osm_detail',
    data_status: props.data_status || (sourceHeight ? 'source_height' : sourceLevels ? 'source_levels_estimated_height' : 'footprint_only'),
    height_source: props.height_source || (sourceHeight ? 'OSM height tag' : sourceLevels ? 'Estimated for visualization from OSM building:levels' : 'Unavailable'),
    floors_status: props.floors_status || (sourceLevels ? 'Source-provided' : (Number(props.estimated_floors) > 0 ? 'Estimated from source height' : 'Unavailable')),
    confidence: props.confidence || (sourceHeight ? 'Source-provided' : sourceLevels ? 'Estimated height from source floor count' : 'Footprint only'),
    building_part: props.building_part || null,
  }
}

function makeParcelFeature(result) {
  if (!result?.geometry) return null
  if (result.geometry.type === 'Feature') return result.geometry
  if (result.geometry.type === 'FeatureCollection') return result.geometry.features?.[0] || null
  return { type: 'Feature', geometry: result.geometry, properties: { ulpin: result.ulpin || '' } }
}

function getLodLabel(zoom) {
  const z = Number(zoom)
  if (!Number.isFinite(z) || z < 7) return 'COUNTRY / STATE CONTEXT'
  if (z < 11) return 'DISTRICT / CITY CONTEXT'
  if (z < 13) return 'CITY BUILDING FOOTPRINTS'
  if (z < 16) return 'NEIGHBORHOOD 3D + OSM DETAIL'
  return 'PROPERTY-LEVEL GEOGRAPHIC DETAIL'
}

function utilityEnabledForEffect(layers) {
  return Object.values(layers || {}).some(Boolean)
}

export default function Geographic3DMap() {
  const mapContainerRef = useRef(null)
  const mapRef = useRef(null)
  const protocolRef = useRef(null)
  const basemapBuildingsHiddenRef = useRef(false)
  const lastAppliedLocationRef = useRef('')
  const osmDetailTimerRef = useRef(null)
  const osmDetailAbortRef = useRef(null)
  const lastOsmDetailKeyRef = useRef('')
  const utilityTimerRef = useRef(null)
  const utilityAbortRef = useRef(null)
  const lastUtilityKeyRef = useRef('')
  const utilityCacheRef = useRef(new Map())
  const [status, setStatus] = useState('Preparing nationwide 3D data layers…')
  const [mapError, setMapError] = useState('')
  const [building3DVisible, setBuilding3DVisible] = useState(true)
  const [building2DVisible, setBuilding2DVisible] = useState(true)
  const [roadLayerVisible, setRoadLayerVisible] = useState(true)
  const [waterLayerVisible, setWaterLayerVisible] = useState(false)
  const [osmDetailVisible, setOsmDetailVisible] = useState(true)
  const [osmFloorMode, setOsmFloorMode] = useState(true)
  const [undergroundLayers, setUndergroundLayers] = useState({ water: false, sewer: false, gas: false, electricity: false, telecom: false, basements: false })
  const [utilityCounts, setUtilityCounts] = useState({ water: 0, sewer: 0, gas: 0, electricity: 0, telecom: 0, basements: 0 })
  const [utilitySourceMode, setUtilitySourceMode] = useState('source-mapped')
  const [utilityFeatures, setUtilityFeatures] = useState([])
  const utilityFeaturesRef = useRef([])
  const [selectedUtility, setSelectedUtility] = useState(null)
  const [underground3DOpen, setUnderground3DOpen] = useState(false)
  const [utilityNetworkLoading, setUtilityNetworkLoading] = useState(false)
  const undergroundLayersRef = useRef(undergroundLayers)
  undergroundLayersRef.current = undergroundLayers
  utilityFeaturesRef.current = utilityFeatures
  const [overtureReady, setOvertureReady] = useState(false)
  const [mapReady, setMapReady] = useState(false)
  const [stats, setStats] = useState({ buildings: 0 })
  const [zoomLevel, setZoomLevel] = useState(INDIA_ZOOM)

  const geoLocation = useStore(s => s.geoLocation)
  const geoSelectedFeature = useStore(s => s.geoSelectedFeature)
  const maharashtraUlpinResult = useStore(s => s.maharashtraUlpinResult)
  const geoUtilityRequest = useStore(s => s.geoUtilityRequest)
  const geoUndergroundRequest = useStore(s => s.geoUndergroundRequest)
  const setGeoSelectedFeature = useStore(s => s.setGeoSelectedFeature)
  const setGeoSelectedUtility = useStore(s => s.setGeoSelectedUtility)

  const hideBasemapBuildings = useCallback(() => {
    const map = mapRef.current
    if (!map || basemapBuildingsHiddenRef.current) return
    try {
      const style = map.getStyle()
      let hiddenAny = false
      ;(style?.layers || []).forEach(layer => {
        const id = String(layer.id || '').toLowerCase()
        const sourceLayer = String(layer['source-layer'] || '').toLowerCase()
        const looksBuilding = id.includes('building') || sourceLayer.includes('building')
        const isURDHVA = id.startsWith('urdhva-') || id.startsWith('overture-')
        if (looksBuilding && !isURDHVA && map.getLayer(layer.id)) {
          try {
            map.setLayoutProperty(layer.id, 'visibility', 'none')
            hiddenAny = true
          } catch (_) {}
        }
      })
      if (hiddenAny) basemapBuildingsHiddenRef.current = true
    } catch (_) {}
  }, [])

  useEffect(() => {
    if (!mapContainerRef.current) return undefined
    const maplibregl = window.maplibregl
    const pmtiles = window.pmtiles
    if (!maplibregl) {
      setMapError('MapLibre could not be loaded. Check internet access and reload.')
      return undefined
    }
    if (!pmtiles?.Protocol) {
      setMapError('PMTiles support could not be loaded. Check internet access and reload.')
      return undefined
    }

    let protocol = null
    try {
      try { maplibregl.removeProtocol('pmtiles') } catch (_) {}
      protocol = new pmtiles.Protocol({ metadata: false })
      maplibregl.addProtocol('pmtiles', protocol.tile)
      protocolRef.current = protocol
    } catch (error) {
      console.error('URDHVA PMTiles protocol error:', error)
      setMapError('Nationwide 3D tile protocol could not be initialized.')
      return undefined
    }

    const map = new maplibregl.Map({
      container: mapContainerRef.current,
      style: 'https://tiles.openfreemap.org/styles/liberty',
      center: INDIA_CENTER,
      zoom: INDIA_ZOOM,
      pitch: 32,
      bearing: 0,
      antialias: true,
      attributionControl: true,
      dragRotate: true,
      touchPitch: true,
      touchZoomRotate: true,
      minZoom: 3,
      maxZoom: 20,
    })
    mapRef.current = map
    map.addControl(new maplibregl.NavigationControl({ visualizePitch: true }), 'top-right')
    map.addControl(new maplibregl.ScaleControl({ maxWidth: 140, unit: 'metric' }), 'bottom-right')

    const addLayers = () => {
      if (map.getSource('overture-buildings')) return
      try {
        map.addSource('overture-buildings', {
          type: 'vector',
          url: `pmtiles://${OVERTURE_BUILDINGS}`,
          attribution: '© Overture Maps Foundation',
        })
        map.addSource('overture-transportation', {
          type: 'vector',
          url: `pmtiles://${OVERTURE_TRANSPORTATION}`,
          attribution: '© Overture Maps Foundation',
        })
        map.addSource('overture-base', {
          type: 'vector',
          url: `pmtiles://${OVERTURE_BASE}`,
          attribution: '© Overture Maps Foundation',
        })
        map.addSource('maharashtra-ulpin-parcel', {
          type: 'geojson',
          data: { type: 'FeatureCollection', features: [] },
        })
        map.addSource('urdhva-selected-floor-slabs', {
          type: 'geojson',
          data: { type: 'FeatureCollection', features: [] },
        })
        map.addSource('osm-underground-utilities', {
          type: 'geojson',
          data: { type: 'FeatureCollection', features: [] },
        })
        map.addSource('osm-basement-footprints', {
          type: 'geojson',
          data: { type: 'FeatureCollection', features: [] },
        })

        map.addLayer({
          id: 'overture-water', type: 'fill', source: 'overture-base', 'source-layer': 'water', minzoom: 4,
          paint: { 'fill-color': '#3187bd', 'fill-opacity': 0.58, 'fill-outline-color': '#1f6a96' },
        })
        map.addLayer({
          id: 'overture-roads', type: 'line', source: 'overture-transportation', 'source-layer': 'segment', minzoom: 7,
          filter: ['==', ['get', 'subtype'], 'road'],
          layout: { 'line-cap': 'round', 'line-join': 'round' },
          paint: {
            'line-color': ['match', ['get', 'class'], 'motorway', '#195b34', 'trunk', '#22663c', 'primary', '#2f8149', 'secondary', '#3f9455', 'tertiary', '#58a767', '#6eb77c'],
            'line-width': ['interpolate', ['linear'], ['zoom'], 7, 0.7, 11, 1.5, 14, 2.8, 18, 5],
            'line-opacity': 0.82,
          },
        })

        const sourceHeightExpr = ['coalesce',
          ['to-number', ['get', 'height']],
          ['to-number', ['get', 'height_m']],
          ['to-number', ['get', 'building_height']],
          ['to-number', ['get', 'height_estimate']],
          ['to-number', ['get', 'estimated_height_m']],
          0,
        ]
        const sourceFloorsExpr = ['coalesce',
          ['to-number', ['get', 'num_floors']],
          ['to-number', ['get', 'levels']],
          ['to-number', ['get', 'building:levels']],
          ['to-number', ['get', 'building:levels:aboveground']],
          0,
        ]
        const buildingPaintColor = ['case', ['>', sourceHeightExpr, 0], '#d5a325', ['>', sourceFloorsExpr, 0], '#efbb39', '#aeb8c3']
        const buildingHeight = ['case',
          ['>', sourceHeightExpr, 0], sourceHeightExpr,
          ['>', sourceFloorsExpr, 0], ['*', sourceFloorsExpr, OSM_DEFAULT_FLOOR_HEIGHT_M],
          0.35,
        ]
        const buildingBase = ['coalesce', ['to-number', ['get', 'min_height']], ['to-number', ['get', 'min_height_m']], 0]
        const partHeight = ['case',
          ['>', sourceHeightExpr, 0], sourceHeightExpr,
          ['>', sourceFloorsExpr, 0], ['*', sourceFloorsExpr, OSM_DEFAULT_FLOOR_HEIGHT_M],
          0.35,
        ]

        map.addLayer({
          id: 'overture-building-footprints', type: 'fill', source: 'overture-buildings', 'source-layer': 'building', minzoom: 12,
          paint: { 'fill-color': buildingPaintColor, 'fill-opacity': 0.23, 'fill-outline-color': '#6b5a20' },
        })
        map.addLayer({
          id: 'overture-buildings-3d', type: 'fill-extrusion', source: 'overture-buildings', 'source-layer': 'building', minzoom: 12,
          paint: {
            'fill-extrusion-color': buildingPaintColor,
            'fill-extrusion-height': buildingHeight,
            'fill-extrusion-base': buildingBase,
            'fill-extrusion-opacity': 0.9,
            'fill-extrusion-vertical-gradient': true,
          },
        })
        map.addLayer({
          id: 'overture-building-labels', type: 'symbol', source: 'overture-buildings', 'source-layer': 'building', minzoom: 15,
          layout: {
            'text-field': ['coalesce', ['get', '@name'], ['get', 'name'], ''],
            'text-size': ['interpolate', ['linear'], ['zoom'], 15, 9, 18, 12],
            'text-anchor': 'center',
            'text-allow-overlap': false,
            'text-optional': true,
          },
          paint: {
            'text-color': '#334155',
            'text-halo-color': '#ffffff',
            'text-halo-width': 1.2,
            'text-opacity': 0.9,
          },
        })
        map.addLayer({
          id: 'overture-building-parts-3d', type: 'fill-extrusion', source: 'overture-buildings', 'source-layer': 'building_part', minzoom: 14,
          paint: {
            'fill-extrusion-color': ['case', ['>', ['coalesce', ['to-number', ['get', 'height']], 0], 0], '#c9931f', ['>', ['coalesce', ['to-number', ['get', 'num_floors']], 0], 0], '#e8ad31', '#9faab5'],
            'fill-extrusion-height': partHeight,
            'fill-extrusion-base': ['coalesce', ['to-number', ['get', 'min_height']], 0],
            'fill-extrusion-opacity': 0.92,
            'fill-extrusion-vertical-gradient': true,
          },
        })
        // Hit layers cover both tall and zero-height footprints, so every loaded
        // geographic building remains selectable even when vertical data is absent.
        map.addLayer({
          id: 'overture-building-hit', type: 'fill', source: 'overture-buildings', 'source-layer': 'building', minzoom: 12,
          paint: { 'fill-color': '#ffffff', 'fill-opacity': 0.01 },
        })
        map.addLayer({
          id: 'overture-building-parts-hit', type: 'fill', source: 'overture-buildings', 'source-layer': 'building_part', minzoom: 13,
          paint: { 'fill-color': '#ffffff', 'fill-opacity': 0.01 },
        })
        map.addLayer({
          id: 'overture-building-highlight', type: 'line', source: 'overture-buildings', 'source-layer': 'building', minzoom: 12,
          filter: ['==', ['get', 'id'], ''],
          paint: { 'line-color': '#00a7c7', 'line-width': ['interpolate', ['linear'], ['zoom'], 12, 2, 18, 5], 'line-opacity': 0.98 },
        })
        map.addLayer({
          id: 'overture-building-part-highlight', type: 'line', source: 'overture-buildings', 'source-layer': 'building_part', minzoom: 14,
          filter: ['==', ['get', 'id'], ''],
          paint: { 'line-color': '#00a7c7', 'line-width': 3.5, 'line-opacity': 0.98 },
        })

        // OSM detail overlay: this is the nationwide equivalent of the
        // existing Pune OSM workflow, loaded only for the current city/neighborhood
        // viewport. Overture remains the fast nationwide base layer.
        map.addSource('osm-detail-buildings', {
          type: 'geojson',
          data: { type: 'FeatureCollection', features: [] },
        })
        // Nationwide floor stack: one source-backed OSM polygon per visible floor.
        // This is the scalable geographic equivalent of the friend's Pune floor pipeline.
        map.addSource('osm-detail-floors', {
          type: 'geojson',
          data: { type: 'FeatureCollection', features: [] },
        })
        const osmBuildingPaint = ['case',
          ['>', ['coalesce', ['to-number', ['get', 'height_m']], 0], 0], '#d5a325',
          ['>', ['coalesce', ['to-number', ['get', 'levels']], 0], 0], '#efbb39',
          '#aeb8c3',
        ]
        const osmExtrusionHeight = ['coalesce', ['to-number', ['get', 'render_height_m']], ['to-number', ['get', 'height_m']], 0.35]
        map.addLayer({
          id: 'osm-detail-building-footprints', type: 'fill', source: 'osm-detail-buildings', minzoom: 13,
          paint: { 'fill-color': osmBuildingPaint, 'fill-opacity': 0.18, 'fill-outline-color': '#8b6b1c' },
        })
        map.addLayer({
          id: 'osm-detail-buildings-3d', type: 'fill-extrusion', source: 'osm-detail-buildings', minzoom: 13,
          filter: ['all', ['==', ['get', 'building_part'], null], ['>', ['coalesce', ['to-number', ['get', 'render_height_m']], 0], 0.36]],
          paint: {
            'fill-extrusion-color': osmBuildingPaint,
            'fill-extrusion-height': osmExtrusionHeight,
            'fill-extrusion-base': ['coalesce', ['to-number', ['get', 'min_height_m']], 0],
            'fill-extrusion-opacity': ['case',
              ['>', ['coalesce', ['to-number', ['get', 'levels']], 0], 1], 0.20,
              ['>', ['coalesce', ['to-number', ['get', 'estimated_floors']], 0], 1], 0.20,
              0.96,
            ],
            'fill-extrusion-vertical-gradient': true,
          },
        })
        map.addLayer({
          id: 'osm-detail-floors-3d', type: 'fill-extrusion', source: 'osm-detail-floors', minzoom: 13.5,
          layout: { visibility: 'visible' },
          paint: {
            'fill-extrusion-color': ['interpolate', ['linear'], ['get', 'floor'], 1, '#f4c95d', 8, '#e3a72f', 16, '#c98219', 30, '#9f6416'],
            'fill-extrusion-height': ['get', 'slab_top_m'],
            'fill-extrusion-base': ['get', 'slab_base_m'],
            'fill-extrusion-opacity': 0.88,
            'fill-extrusion-vertical-gradient': true,
          },
        })
        map.addLayer({
          id: 'osm-detail-building-hit', type: 'fill', source: 'osm-detail-buildings', minzoom: 13,
          filter: ['==', ['get', 'building_part'], null],
          paint: { 'fill-color': '#ffffff', 'fill-opacity': 0.01 },
        })
        map.addLayer({
          id: 'osm-detail-building-highlight', type: 'line', source: 'osm-detail-buildings', minzoom: 13,
          filter: ['==', ['get', 'source_id'], ''],
          paint: { 'line-color': '#00a7c7', 'line-width': ['interpolate', ['linear'], ['zoom'], 14, 2, 18, 5], 'line-opacity': 1 },
        })
        map.addLayer({
          id: 'osm-detail-building-parts-3d', type: 'fill-extrusion', source: 'osm-detail-buildings', minzoom: 14,
          filter: ['!=', ['get', 'building_part'], null],
          paint: {
            'fill-extrusion-color': '#c58b1b',
            'fill-extrusion-height': osmExtrusionHeight,
            'fill-extrusion-base': ['coalesce', ['to-number', ['get', 'min_height_m']], 0],
            'fill-extrusion-opacity': 0.72,
            'fill-extrusion-vertical-gradient': true,
          },
        })

        map.addLayer({
          id: 'maharashtra-ulpin-parcel-fill', type: 'fill', source: 'maharashtra-ulpin-parcel',
          paint: { 'fill-color': '#14b8a6', 'fill-opacity': 0.18 },
        })
        map.addLayer({
          id: 'maharashtra-ulpin-parcel-line', type: 'line', source: 'maharashtra-ulpin-parcel',
          paint: { 'line-color': '#0f766e', 'line-width': 3.5, 'line-dasharray': [1.5, 1.5] },
        })
        map.addLayer({
          id: 'urdhva-selected-floor-slabs', type: 'fill-extrusion', source: 'urdhva-selected-floor-slabs', minzoom: 13,
          paint: {
            'fill-extrusion-color': '#475569',
            'fill-extrusion-height': ['get', 'slab_top_m'],
            'fill-extrusion-base': ['get', 'slab_base_m'],
            'fill-extrusion-opacity': 0.72,
            'fill-extrusion-vertical-gradient': false,
          },
        })

        const undergroundLineConfig = [
          ['urdhva-underground-water', 'water', '#06b6d4'],
          ['urdhva-underground-sewer', 'sewer', '#8b5cf6'],
          ['urdhva-underground-gas', 'gas', '#f97316'],
          ['urdhva-underground-electricity', 'electricity', '#eab308'],
          ['urdhva-underground-telecom', 'telecom', '#2563eb'],
        ]
        undergroundLineConfig.forEach(([id, category, color]) => {
          map.addLayer({
            id: `${id}-glow`, type: 'line', source: 'osm-underground-utilities', minzoom: 11.5,
            filter: ['==', ['get', 'category'], category],
            layout: { 'line-cap': 'round', 'line-join': 'round', visibility: 'none' },
            paint: { 'line-color': color, 'line-width': ['interpolate', ['linear'], ['zoom'], 11.5, 5, 14, 8, 18, 12], 'line-opacity': 0.18 },
          })
          map.addLayer({
            id, type: 'line', source: 'osm-underground-utilities', minzoom: 11.5,
            filter: ['==', ['get', 'category'], category],
            layout: { 'line-cap': 'round', 'line-join': 'round', visibility: 'none' },
            paint: {
              'line-color': color,
              'line-width': ['interpolate', ['linear'], ['zoom'], 11.5, 2.2, 14, 4.2, 18, 7],
              'line-opacity': 0.97,
            },
          })
        })
        map.addLayer({
          id: 'urdhva-underground-hit', type: 'line', source: 'osm-underground-utilities', minzoom: 11.5,
          layout: { 'line-cap': 'round', 'line-join': 'round', visibility: 'none' },
          paint: { 'line-color': '#ffffff', 'line-width': 14, 'line-opacity': 0.01 },
        })
        map.addLayer({
          id: 'urdhva-basement-footprints', type: 'line', source: 'osm-basement-footprints', minzoom: 13,
          layout: { visibility: 'none' },
          paint: { 'line-color': '#db2777', 'line-width': 3, 'line-dasharray': [2, 1.3], 'line-opacity': 0.95 },
        })

        setOvertureReady(true)
        setStatus('Nationwide 3D vector layers ready • visible tiles load progressively')
        hideBasemapBuildings()
      } catch (error) {
        console.error('URDHVA Overture layer error:', error)
        setMapError('Nationwide building tiles could not be initialized. The geographic basemap remains available.')
      }
    }

    const countVisibleBuildings = () => {
      try {
        if (map.getZoom() < 12) {
          setStats({ buildings: 0 })
          return
        }
        const layers = ['overture-buildings-3d', 'overture-building-parts-3d']
        if (osmDetailVisible && map.getLayer('osm-detail-buildings-3d')) layers.push('osm-detail-buildings-3d')
        if (osmDetailVisible && osmFloorMode && map.getLayer('osm-detail-floors-3d')) layers.push('osm-detail-floors-3d')
        const hits = map.queryRenderedFeatures(undefined, { layers })
        const ids = new Set(hits.map(f => f?.properties?.id || f?.id || JSON.stringify(f?.geometry?.coordinates?.[0]?.[0] || '')).filter(Boolean))
        setStats({ buildings: ids.size })
        setStatus(ids.size ? `${ids.size.toLocaleString()} visible source building features • vector tiles` : 'No building features in this viewport at this zoom')
      } catch (_) {}
    }

    const enrichSelectedBuilding = async (normalized, event) => {
      const current = normalized
      // Enrich when either height OR floor data is missing. This lets an Overture
      // building that has a source height but no floor count pick up OSM levels,
      // which is important for the floor-wise 3D preview.
      const hasHeight = Number(current.height_m) > 0
      const hasFloors = Number(current.levels || current.num_floors || 0) > 0
      if ((hasHeight && hasFloors) || !event?.lngLat) return
      try {
        const params = new URLSearchParams({ lat: event.lngLat.lat.toFixed(7), lon: event.lngLat.lng.toFixed(7), radius: '35' })
        const response = await fetch(`/api/geo/building-detail?${params.toString()}`, { headers: { Accept: 'application/json' } })
        if (!response.ok) return
        const payload = await response.json()
        if (!payload?.building) return
        const merged = {
          ...current,
          ...payload.building,
          geometry: current.geometry || payload.building.geometry || null,
          coordinates: current.coordinates,
          map_zoom: current.map_zoom,
          source: payload.building.source || current.source,
          source_id: payload.building.source_id || current.source_id,
          building_parts: payload.building_parts || current.building_parts || [],
          enrichment: 'OpenStreetMap detailed building attributes',
        }
        setGeoSelectedFeature(merged)
      } catch (error) {
        console.debug('URDHVA selected-building OSM enrichment unavailable:', error)
      }
    }

    const onClick = (event) => {
      try {
        const utilityHitLayers = ['urdhva-underground-hit', 'urdhva-underground-water', 'urdhva-underground-sewer', 'urdhva-underground-gas', 'urdhva-underground-electricity', 'urdhva-underground-telecom'].filter(id => map.getLayer(id))
        if (utilityHitLayers.length) {
          const utilityHits = map.queryRenderedFeatures(event.point, { layers: utilityHitLayers })
          if (utilityHits.length) {
            const hit = utilityHits[0]
            const props = hit.properties || {}
            const selectedUtilityFeature = {
              category: props.category || 'utility',
              name: props.name || null,
              operator: props.operator || null,
              substance: props.substance || null,
              location: props.location || null,
              depth_m: props.depth_m != null ? Number(props.depth_m) : null,
              diameter_m: props.diameter_m != null ? Number(props.diameter_m) : null,
              voltage: props.voltage || null,
              source: props.source || 'OpenStreetMap via Overpass API',
              source_id: props.source_id || hit.id || null,
              data_status: props.data_status || 'source-mapped',
              network_id: props.network_id || null,
              network_segment: props.network_segment != null ? Number(props.network_segment) : null,
              network_connected: Boolean(props.network_connected),
              geometry: hit.geometry || null,
            }
            setSelectedUtility(selectedUtilityFeature)
            setGeoSelectedUtility(selectedUtilityFeature)
            setUnderground3DOpen(true)
            return
          }
        }
        const layers = ['overture-building-parts-3d', 'overture-buildings-3d', 'overture-building-parts-hit', 'overture-building-hit']
        if (osmDetailVisible && map.getLayer('osm-detail-buildings-3d')) layers.unshift('osm-detail-buildings-3d', 'osm-detail-building-hit')
        const mapHits = map.queryRenderedFeatures(event.point, { layers })
        if (!mapHits.length) return
        // Prefer the parent building over a duplicate building-part hit when both overlap.
        let feature = mapHits.find(f => f?.layer?.['source-layer'] === 'building') || mapHits[0]
        const layerId = feature?.layer?.['source-layer'] || 'building'
        const layerType = String(layerId) === 'building_part' ? 'building_part' : 'building'
        // Some MapLibre builds omit source geometry from rendered-hit objects. Recover
        // the same feature from the vector tile source so the selected preview can use
        // the real polygon rather than falling back to a generic box.
        if (!feature?.geometry) {
          try {
            const hitId = feature?.properties?.id || feature?.id || null
            const sourceFeatures = map.querySourceFeatures('overture-buildings', { sourceLayer: layerType })
            const recovered = sourceFeatures.find(item => String(item?.properties?.id || item?.id || '') === String(hitId || ''))
            if (recovered?.geometry) feature = recovered
          } catch (_) {}
        }
        const isOsmDetail = String(feature?.layer?.id || '').startsWith('osm-detail-')
        const normalized = isOsmDetail ? normalizeOsmFeature(feature) : normalizeGeographicFeature(feature, layerType)
        normalized.coordinates = [event.lngLat.lng, event.lngLat.lat]
        normalized.map_zoom = map.getZoom()
        normalized.source = normalized['@geometry_source'] || normalized.source || (isOsmDetail ? 'OpenStreetMap via Overpass API' : 'Overture Buildings')
        normalized.provider_type = isOsmDetail ? 'osm_detail' : normalized.provider_type

        // Pull visible child parts from the same Overture vector tiles so the selected
        // building can be reconstructed with the source-defined sub-geometries.
        const parentId = feature.properties?.id || feature.id || null
        const visibleParts = []
        if (layerType === 'building' && parentId) {
          try {
            const sourceParts = map.querySourceFeatures('overture-buildings', { sourceLayer: 'building_part' })
            for (const part of sourceParts || []) {
              const props = part?.properties || {}
              const partParent = props.building_id || props.parent_building_id || props.parent_id || props.building || null
              if (partParent != null && String(partParent) === String(parentId)) {
                visibleParts.push(normalizeGeographicFeature(part, 'building_part'))
              }
            }
          } catch (_) {}
        }
        const dedupedParts = []
        const seenPartIds = new Set()
        for (const part of visibleParts) {
          const id = String(part.source_id || part.id || '')
          if (!id || seenPartIds.has(id)) continue
          seenPartIds.add(id)
          dedupedParts.push(part)
        }
        normalized.building_parts = dedupedParts.slice(0, 24)
        normalized.parts_count = normalized.building_parts.length
        normalized.coordinates = [event.lngLat.lng, event.lngLat.lat]
        normalized.enrichment = 'Overture Buildings source feature'
        setGeoSelectedFeature(normalized)

        const highlightId = feature.properties?.id || feature.id || ''
        const highlightLayer = layerType === 'building_part' ? 'overture-building-part-highlight' : 'overture-building-highlight'
        if (highlightId && map.getLayer(highlightLayer)) map.setFilter(highlightLayer, ['==', ['get', 'id'], highlightId])

        // OSM detail features are already enriched by the viewport query. Only
        // fallback to the small building-detail request for Overture features.
        if (!isOsmDetail) void enrichSelectedBuilding(normalized, event)
      } catch (error) {
        console.error('URDHVA geographic building click error:', error)
        setMapError('This building could not be inspected. Try the next source feature.')
      }
    }

    const onMoveEnd = () => {
      setZoomLevel(map.getZoom())
      countVisibleBuildings()
    }
    const onMouseMove = event => {
      try {
        const layers = ['overture-buildings-3d', 'overture-building-parts-3d', 'overture-building-hit', 'overture-building-parts-hit', 'urdhva-underground-hit'].filter(id => map.getLayer(id))
        if (osmDetailVisible && map.getLayer('osm-detail-buildings-3d')) layers.unshift('osm-detail-buildings-3d', 'osm-detail-building-hit')
        const hits = map.queryRenderedFeatures(event.point, { layers })
        map.getCanvas().style.cursor = hits.length ? 'pointer' : ''
      } catch (_) {}
    }

    const loadOsmDetailViewport = async () => {
      if (!mapReady && map.getZoom() < 13) return
      const zoom = map.getZoom()
      if (zoom < 13) {
        const empty = { type: 'FeatureCollection', features: [] }
        try { map.getSource('osm-detail-buildings')?.setData(empty) } catch (_) {}
        try { map.getSource('osm-detail-floors')?.setData(empty) } catch (_) {}
        return
      }
      const bounds = map.getBounds()
      const west = Number(bounds.getWest())
      const south = Number(bounds.getSouth())
      const east = Number(bounds.getEast())
      const north = Number(bounds.getNorth())
      const key = `${west.toFixed(3)}|${south.toFixed(3)}|${east.toFixed(3)}|${north.toFixed(3)}|${zoom.toFixed(1)}`
      if (lastOsmDetailKeyRef.current === key) return
      lastOsmDetailKeyRef.current = key
      if (osmDetailAbortRef.current) osmDetailAbortRef.current.abort()
      const controller = new AbortController()
      osmDetailAbortRef.current = controller
      setStatus('Loading real OSM buildings for the visible area…')
      try {
        const params = new URLSearchParams({
          west: west.toFixed(6), south: south.toFixed(6), east: east.toFixed(6), north: north.toFixed(6), zoom: zoom.toFixed(1),
        })
        const response = await fetch(`/api/geo/osm-viewport?${params.toString()}`, { signal: controller.signal, headers: { Accept: 'application/json' } })
        if (!response.ok) throw new Error(`OSM detail ${response.status}`)
        const payload = await response.json()
        if (controller.signal.aborted) return
        const buildings = payload?.buildings || { type: 'FeatureCollection', features: [] }
        const source = map.getSource('osm-detail-buildings')
        if (source && typeof source.setData === 'function') source.setData(buildings)
        const floorFeatures = expandOsmFeaturesToFloorFeatures(buildings)
        const floorSource = map.getSource('osm-detail-floors')
        if (floorSource && typeof floorSource.setData === 'function') floorSource.setData(floorFeatures)
        const count = buildings?.features?.length || 0
        const floorSummary = summarizeOsmFloorFeatures(floorFeatures)
        setStatus(count ? `${count.toLocaleString()} real OSM buildings • ${floorSummary.floorFeatures.toLocaleString()} floor volumes • ${floorSummary.sourceFloorBuildings.toLocaleString()} source-floor buildings${floorSummary.estimatedFloorBuildings ? ` • ${floorSummary.estimatedFloorBuildings.toLocaleString()} estimated-floor buildings` : ''}` : 'No detailed OSM buildings returned for this viewport • using nationwide vector coverage')
      } catch (error) {
        if (error?.name === 'AbortError') return
        console.debug('URDHVA OSM detail overlay unavailable:', error)
        setStatus('OSM detail temporarily unavailable • nationwide vector buildings remain visible')
      }
    }

    const scheduleOsmDetail = () => {
      if (osmDetailTimerRef.current) clearTimeout(osmDetailTimerRef.current)
      osmDetailTimerRef.current = setTimeout(() => { void loadOsmDetailViewport() }, 700)
    }

    const loadUndergroundViewport = async () => {
      const mapNow = mapRef.current
      if (!mapNow || !utilityEnabledForEffect(undergroundLayersRef.current)) return
      const zoom = mapNow.getZoom()
      if (zoom < 11) {
        try { mapNow.getSource('osm-underground-utilities')?.setData({ type: 'FeatureCollection', features: [] }) } catch (_) {}
        try { mapNow.getSource('osm-basement-footprints')?.setData({ type: 'FeatureCollection', features: [] }) } catch (_) {}
        setUtilityCounts({ water: 0, sewer: 0, gas: 0, electricity: 0, telecom: 0, basements: 0 })
        setUtilityFeatures([])
        utilityFeaturesRef.current = []
        setSelectedUtility(null); setGeoSelectedUtility(null)
        setStatus('Zoom in a little more to load underground utility layers')
        return
      }
      const bounds = mapNow.getBounds()
      const west = Number(bounds.getWest()), south = Number(bounds.getSouth()), east = Number(bounds.getEast()), north = Number(bounds.getNorth())
      const activeCategories = ['water', 'sewer', 'gas', 'electricity', 'telecom'].filter(category => undergroundLayersRef.current[category])
      const includeBasements = Boolean(undergroundLayersRef.current.basements)
      const key = `${activeCategories.join(',')}|b${includeBasements ? 1 : 0}|${west.toFixed(3)}|${south.toFixed(3)}|${east.toFixed(3)}|${north.toFixed(3)}|${zoom.toFixed(1)}`
      if (lastUtilityKeyRef.current === key) return
      lastUtilityKeyRef.current = key
      if (utilityAbortRef.current) utilityAbortRef.current.abort()
      const controller = new AbortController()
      utilityAbortRef.current = controller

      // Fast visual response: show an explicitly labelled road-aligned demo while the source query runs.
      const demoPreview = activeCategories.flatMap(category => buildDemoUtilityFeaturesFromRoads(mapNow, category, 90))
      if (demoPreview.length) {
        try { mapNow.getSource('osm-underground-utilities')?.setData({ type: 'FeatureCollection', features: demoPreview }) } catch (_) {}
        setUtilityFeatures(demoPreview)
        utilityFeaturesRef.current = demoPreview
        setUtilityCounts(prev => ({ ...prev, ...Object.fromEntries(activeCategories.map(category => [category, demoPreview.filter(f => f?.properties?.category === category).length])) }))
        setUtilitySourceMode('loading-demo')
        setStatus('Demo corridors shown immediately • loading source-mapped utilities in background…')
      } else {
        setStatus('Loading source-mapped underground utilities…')
      }

      const cacheKey = `${activeCategories.join(',')}|b${includeBasements ? 1 : 0}|${west.toFixed(3)}|${south.toFixed(3)}|${east.toFixed(3)}|${north.toFixed(3)}|${zoom.toFixed(1)}`
      const cachedPayload = utilityCacheRef.current.get(cacheKey)
      if (cachedPayload) {
        const allCached = activeCategories.flatMap(category => cachedPayload?.utilities?.[category]?.features || [])
        const cachedFeatures = allCached.length ? allCached : demoPreview
        try { mapNow.getSource('osm-underground-utilities')?.setData({ type: 'FeatureCollection', features: cachedFeatures }) } catch (_) {}
        try { mapNow.getSource('osm-basement-footprints')?.setData(cachedPayload?.basements || { type: 'FeatureCollection', features: [] }) } catch (_) {}
        setUtilityFeatures(cachedFeatures)
        utilityFeaturesRef.current = cachedFeatures
        setUtilityCounts({ water: Number(cachedPayload?.counts?.water || (demoPreview.filter(f => f?.properties?.category === 'water').length)), sewer: Number(cachedPayload?.counts?.sewer || (demoPreview.filter(f => f?.properties?.category === 'sewer').length)), gas: Number(cachedPayload?.counts?.gas || (demoPreview.filter(f => f?.properties?.category === 'gas').length)), electricity: Number(cachedPayload?.counts?.electricity || (demoPreview.filter(f => f?.properties?.category === 'electricity').length)), telecom: Number(cachedPayload?.counts?.telecom || (demoPreview.filter(f => f?.properties?.category === 'telecom').length)), basements: Number(cachedPayload?.counts?.basements || 0) })
        setUtilitySourceMode(allCached.length ? 'source-mapped' : (demoPreview.length ? 'demo-only' : 'source-mapped'))
        setStatus(allCached.length ? 'Loaded cached source-mapped underground utilities' : (demoPreview.length ? 'Using demo corridors • no source-mapped utility geometry returned' : 'No source-mapped underground utility features in this viewport'))
        return
      }

      try {
        const params = new URLSearchParams({
          west: west.toFixed(6), south: south.toFixed(6), east: east.toFixed(6), north: north.toFixed(6),
          zoom: zoom.toFixed(1), categories: activeCategories.join(','), basements: includeBasements ? '1' : '0',
        })
        const utilityTimeout = window.setTimeout(() => controller.abort(), 7000)
        let response
        try {
          response = await fetch(`/api/geo/underground-viewport?${params.toString()}`, { signal: controller.signal, headers: { Accept: 'application/json' }, cache: 'no-store' })
        } finally {
          window.clearTimeout(utilityTimeout)
        }
        if (!response.ok) throw new Error(`Underground utility source ${response.status}`)
        const payload = await response.json()
        if (controller.signal.aborted) return
        utilityCacheRef.current.set(cacheKey, payload)
        if (utilityCacheRef.current.size > 48) utilityCacheRef.current.delete(utilityCacheRef.current.keys().next().value)
        const all = activeCategories.flatMap(category => payload?.utilities?.[category]?.features || [])
        const displayFeatures = all.length ? all : demoPreview
        mapNow.getSource('osm-underground-utilities')?.setData({ type: 'FeatureCollection', features: displayFeatures })
        mapNow.getSource('osm-basement-footprints')?.setData(payload?.basements || { type: 'FeatureCollection', features: [] })
        setUtilityFeatures(displayFeatures)
        utilityFeaturesRef.current = displayFeatures
        const counts = payload?.counts || {}
        const demoCounts = {
          water: demoPreview.filter(f => f?.properties?.category === 'water').length,
          sewer: demoPreview.filter(f => f?.properties?.category === 'sewer').length,
          gas: demoPreview.filter(f => f?.properties?.category === 'gas').length,
          electricity: demoPreview.filter(f => f?.properties?.category === 'electricity').length,
          telecom: demoPreview.filter(f => f?.properties?.category === 'telecom').length,
        }
        const totalSource = activeCategories.reduce((n, category) => n + Number(counts?.[category] || 0), 0)
        setUtilityCounts({ water: Number(counts.water || demoCounts.water), sewer: Number(counts.sewer || demoCounts.sewer), gas: Number(counts.gas || demoCounts.gas), electricity: Number(counts.electricity || demoCounts.electricity), telecom: Number(counts.telecom || demoCounts.telecom), basements: Number(counts.basements || 0) })
        setUtilitySourceMode(totalSource || Number(counts.basements || 0) ? (demoPreview.length && !all.length ? 'source-plus-demo' : 'source-mapped') : (demoPreview.length ? 'demo-only' : 'source-mapped'))
        setStatus(totalSource || Number(counts.basements || 0) ? `${totalSource.toLocaleString()} source-mapped utility features loaded` : (demoPreview.length ? 'No source utility geometry returned • demo corridors remain visible' : 'No source-mapped utility features in the focused viewport'))
      } catch (error) {
        if (error?.name === 'AbortError') return
        console.debug('URDHVA underground utility overlay unavailable:', error)
        setStatus('Source utility query unavailable • demo corridors remain visible for prototype demonstration')
      }
    }

    const scheduleUnderground = () => {
      if (utilityTimerRef.current) clearTimeout(utilityTimerRef.current)
      if (!utilityEnabledForEffect(undergroundLayersRef.current)) return
      utilityTimerRef.current = setTimeout(() => { void loadUndergroundViewport() }, 220)
    }

    map.on('load', () => {
      addLayers()
      countVisibleBuildings()
      setZoomLevel(map.getZoom())
      setMapReady(true)
      setTimeout(() => { void loadOsmDetailViewport() }, 900)
      setTimeout(() => { void loadUndergroundViewport() }, 320)
    })
    map.on('styledata', hideBasemapBuildings)
    map.on('moveend', onMoveEnd)
    map.on('moveend', scheduleOsmDetail)
    map.on('moveend', scheduleUnderground)
    map.on('zoomend', scheduleOsmDetail)
    map.on('zoomend', scheduleUnderground)
    map.on('mousemove', onMouseMove)
    map.on('click', onClick)
    map.on('error', event => {
      console.error('URDHVA map error:', event?.error || event)
      setMapError(previous => previous || 'A geographic tile failed to load; retry or continue exploring.')
    })

    const resizeObserver = new ResizeObserver(() => map.resize())
    resizeObserver.observe(mapContainerRef.current)

    return () => {
      resizeObserver.disconnect()
      if (osmDetailTimerRef.current) clearTimeout(osmDetailTimerRef.current)
      osmDetailTimerRef.current = null
      if (osmDetailAbortRef.current) osmDetailAbortRef.current.abort()
      osmDetailAbortRef.current = null
      if (utilityTimerRef.current) clearTimeout(utilityTimerRef.current)
      utilityTimerRef.current = null
      if (utilityAbortRef.current) utilityAbortRef.current.abort()
      utilityAbortRef.current = null
      try { map.remove() } catch (_) {}
      mapRef.current = null
      setMapReady(false)
      basemapBuildingsHiddenRef.current = false
      try { maplibregl.removeProtocol('pmtiles') } catch (_) {}
      protocolRef.current = null
      setOvertureReady(false)
    }
  }, [hideBasemapBuildings, setGeoSelectedFeature])

  useEffect(() => {
    const map = mapRef.current
    if (!map || !mapReady || !geoLocation) return
    const lat = Number(geoLocation.lat)
    const lon = Number(geoLocation.lon)
    if (!Number.isFinite(lat) || !Number.isFinite(lon)) return
    const key = `${lat.toFixed(6)}|${lon.toFixed(6)}|${geoLocation.zoom || ''}|${geoLocation.label || ''}`
    if (lastAppliedLocationRef.current === key) return
    lastAppliedLocationRef.current = key
    setGeoSelectedFeature(null)
    const bbox = Array.isArray(geoLocation.boundingbox) ? geoLocation.boundingbox.map(Number) : null
    const valid = bbox && bbox.length === 4 && bbox.every(Number.isFinite) && bbox[0] < bbox[1] && bbox[2] < bbox[3]
    if (valid) {
      map.fitBounds([[bbox[2], bbox[0]], [bbox[3], bbox[1]]], {
        padding: 90,
        maxZoom: Math.min(18, Math.max(13, Number(geoLocation.zoom) || 14.5)),
        pitch: 58,
        duration: 1000,
        essential: true,
      })
    } else {
      map.flyTo({ center: [lon, lat], zoom: Math.max(Number(geoLocation.zoom) || 13.5, 12), pitch: 58, duration: 1000, essential: true })
    }
    setStatus(`Opening ${geoLocation.label || 'selected location'} • loading only visible vector tiles…`)
    if (osmDetailTimerRef.current) clearTimeout(osmDetailTimerRef.current)
    osmDetailTimerRef.current = setTimeout(() => {
      const currentMap = mapRef.current
      if (currentMap && currentMap.getZoom() >= 13) {
        lastOsmDetailKeyRef.current = ''
        currentMap.triggerRepaint()
      }
    }, 1100)
  }, [geoLocation, mapReady, setGeoSelectedFeature])

  useEffect(() => {
    const map = mapRef.current
    if (!map || !overtureReady) return
    const visibility = (id, visible) => {
      if (map.getLayer(id)) map.setLayoutProperty(id, 'visibility', visible ? 'visible' : 'none')
    }
    const utilitiesOn = utilityEnabledForEffect(undergroundLayers)
    visibility('overture-buildings-3d', building3DVisible)
    visibility('overture-building-footprints', building2DVisible)
    visibility('overture-building-parts-3d', building3DVisible)
    visibility('overture-building-labels', building3DVisible || building2DVisible)
    visibility('overture-building-hit', building3DVisible || building2DVisible)
    visibility('overture-building-parts-hit', building3DVisible || building2DVisible)
    visibility('overture-building-highlight', building3DVisible || building2DVisible)
    visibility('overture-building-part-highlight', building3DVisible || building2DVisible)
    visibility('osm-detail-buildings-3d', building3DVisible && osmDetailVisible)
    visibility('osm-detail-floors-3d', building3DVisible && osmDetailVisible && osmFloorMode)
    visibility('osm-detail-building-parts-3d', building3DVisible && osmDetailVisible)
    visibility('osm-detail-building-footprints', building2DVisible && osmDetailVisible)
    visibility('osm-detail-building-hit', (building3DVisible || building2DVisible) && osmDetailVisible)
    visibility('osm-detail-building-highlight', (building3DVisible || building2DVisible) && osmDetailVisible)
    visibility('overture-roads', roadLayerVisible)
    visibility('overture-water', waterLayerVisible)
    visibility('urdhva-underground-water', undergroundLayers.water)
    visibility('urdhva-underground-sewer', undergroundLayers.sewer)
    visibility('urdhva-underground-gas', undergroundLayers.gas)
    visibility('urdhva-underground-electricity', undergroundLayers.electricity)
    visibility('urdhva-underground-telecom', undergroundLayers.telecom)
    visibility('urdhva-underground-hit', utilitiesOn)
    visibility('urdhva-basement-footprints', undergroundLayers.basements)
  }, [building3DVisible, building2DVisible, osmDetailVisible, osmFloorMode, roadLayerVisible, waterLayerVisible, undergroundLayers, overtureReady])

  useEffect(() => {
    if (!mapReady || !overtureReady) return
    lastUtilityKeyRef.current = ''
    if (undergroundLayersRef.current && utilityEnabledForEffect(undergroundLayersRef.current)) {
      try { mapRef.current?.fire('moveend') } catch (_) {}
    } else {
      setSelectedUtility(null); setGeoSelectedUtility(null)
      try { mapRef.current?.getSource('osm-underground-utilities')?.setData({ type: 'FeatureCollection', features: [] }) } catch (_) {}
      try { mapRef.current?.getSource('osm-basement-footprints')?.setData({ type: 'FeatureCollection', features: [] }) } catch (_) {}
      setUtilityCounts({ water: 0, sewer: 0, gas: 0, electricity: 0, telecom: 0, basements: 0 })
      setUtilityFeatures([])
      utilityFeaturesRef.current = []
      setUnderground3DOpen(false)
    }
  }, [undergroundLayers, mapReady, overtureReady])

  useEffect(() => {
    const request = geoUtilityRequest
    const map = mapRef.current
    if (!map || !overtureReady || !request?.category || !['water','sewer','gas','electricity','telecom'].includes(request.category)) return
    setUndergroundLayers(prev => ({ ...prev, [request.category]: true }))
    if (map.getZoom() < 13) map.easeTo({ zoom: 14.2, duration: 500, essential: true })
    lastUtilityKeyRef.current = ''
    window.setTimeout(() => { try { mapRef.current?.fire('moveend') } catch (_) {} }, 120)
  }, [geoUtilityRequest, overtureReady])

  useEffect(() => {
    const request = geoUndergroundRequest
    if (!request?.token) return
    if (request.category && ['water','sewer','gas','electricity','telecom'].includes(request.category)) {
      setUndergroundLayers(prev => ({ ...prev, [request.category]: true }))
    }
    setUnderground3DOpen(true)
  }, [geoUndergroundRequest])

  useEffect(() => {
    const map = mapRef.current
    if (!map || !overtureReady) return
    const source = map.getSource('maharashtra-ulpin-parcel')
    if (!source || typeof source.setData !== 'function') return
    const feature = makeParcelFeature(maharashtraUlpinResult)
    source.setData(feature ? { type: 'FeatureCollection', features: [feature] } : { type: 'FeatureCollection', features: [] })
    const visible = Boolean(feature)
    ;['maharashtra-ulpin-parcel-fill', 'maharashtra-ulpin-parcel-line'].forEach(id => {
      if (map.getLayer(id)) map.setLayoutProperty(id, 'visibility', visible ? 'visible' : 'none')
    })
  }, [maharashtraUlpinResult, overtureReady])

  useEffect(() => {
    const map = mapRef.current
    if (!map) return
    const feature = geoSelectedFeature
    const isOsmDetail = feature?.provider_type === 'osm_detail'
    const isPart = feature?.building_part === 'building_part'
    const normalLayer = 'overture-building-highlight'
    const partLayer = 'overture-building-part-highlight'
    const osmLayer = 'osm-detail-building-highlight'
    if (map.getLayer(normalLayer)) map.setFilter(normalLayer, ['==', ['get', 'id'], !isOsmDetail && !isPart && feature?.source_id ? String(feature.source_id).replace(/^way\//, '') : ''])
    if (map.getLayer(partLayer)) map.setFilter(partLayer, ['==', ['get', 'id'], !isOsmDetail && isPart && feature?.source_id ? String(feature.source_id).replace(/^way\//, '') : ''])
    if (map.getLayer(osmLayer)) map.setFilter(osmLayer, ['==', ['get', 'source_id'], isOsmDetail && feature?.source_id ? String(feature.source_id) : ''])
  }, [geoSelectedFeature])

  useEffect(() => {
    const map = mapRef.current
    if (!map || !overtureReady) return
    const source = map.getSource('urdhva-selected-floor-slabs')
    if (!source || typeof source.setData !== 'function') return

    const feature = geoSelectedFeature
    const floors = Number(feature?.levels || feature?.num_floors || 0)
    const geometry = feature?.geometry
    if (!geometry || !Number.isFinite(floors) || floors < 2) {
      source.setData({ type: 'FeatureCollection', features: [] })
      return
    }

    const totalHeightRaw = Number(feature?.height_m || feature?.height || feature?.estimated_height_m || feature?.render_height_m || floors * 3.2)
    const totalHeight = Number.isFinite(totalHeightRaw) && totalHeightRaw > 0 ? totalHeightRaw : floors * 3.2
    const baseHeightRaw = Number(feature?.min_height_m || feature?.min_height || 0)
    const baseHeight = Number.isFinite(baseHeightRaw) && baseHeightRaw > 0 ? baseHeightRaw : 0
    const floorHeight = totalHeight / floors

    const slabFeatures = []
    for (let floor = 1; floor < Math.min(36, Math.round(floors)); floor += 1) {
      slabFeatures.push({
        type: 'Feature',
        geometry,
        properties: {
          floor,
          slab_base_m: Number((baseHeight + floor * floorHeight).toFixed(3)),
          slab_top_m: Number((baseHeight + floor * floorHeight + 0.08).toFixed(3)),
        },
      })
    }
    source.setData({ type: 'FeatureCollection', features: slabFeatures })
  }, [geoSelectedFeature, overtureReady])

  const focusUtilityNetwork = async (categoryOverride = null, radiusKmOverride = 1) => {
    const map = mapRef.current
    const category = categoryOverride || selectedUtility?.category
    if (!map || !category || !['water', 'sewer', 'gas', 'electricity', 'telecom'].includes(category)) return
    setUtilityNetworkLoading(true)
    const radiusKm = Number.isFinite(Number(radiusKmOverride)) ? Math.max(0.5, Math.min(Number(radiusKmOverride), 3)) : 1
    try {
      const geometry = selectedUtility?.geometry
      let center = [map.getCenter().lng, map.getCenter().lat]
      const first = geometry?.coordinates?.[0]
      if (Array.isArray(first) && first.length >= 2 && Number.isFinite(Number(first[0])) && Number.isFinite(Number(first[1]))) {
        center = [Number(first[0]), Number(first[1])]
      }
      const immediateDemo = buildDemoUtilityFeaturesFromRoads(map, category, radiusKm >= 2 ? 180 : 120)
      if (immediateDemo.length) {
        const existingOther = utilityFeaturesRef.current.filter(feature => String(feature?.properties?.category || '') !== category)
        const immediateMerged = [...existingOther, ...immediateDemo]
        utilityFeaturesRef.current = immediateMerged
        map.getSource('osm-underground-utilities')?.setData({ type: 'FeatureCollection', features: immediateMerged })
        setUtilityFeatures(immediateMerged)
        setUtilityCounts(prev => ({ ...prev, [category]: immediateDemo.length }))
        setUtilitySourceMode('loading-demo')
        setStatus(`${immediateDemo.length.toLocaleString()} CONNECTED ${category.toUpperCase()} DEMO network segments shown immediately • fetching source network…`)
      }

      const demoParams = new URLSearchParams({ lon: center[0].toFixed(7), lat: center[1].toFixed(7), category, radius_km: String(radiusKm) })
      const demoPromise = fetch(`/api/geo/utility-demo-network?${demoParams.toString()}`, { headers: { Accept: 'application/json' }, cache: 'no-store' })
        .then(async response => response.ok ? response.json() : null).catch(() => null)

      const params = new URLSearchParams({ lon: center[0].toFixed(7), lat: center[1].toFixed(7), category, radius_km: String(radiusKm), zoom: Math.max(13, Number(map.getZoom().toFixed(1))).toString() })
      const controller = new AbortController()
      const timeout = window.setTimeout(() => controller.abort(), 12000)
      const sourcePromise = fetch(`/api/geo/underground-network?${params.toString()}`, { signal: controller.signal, headers: { Accept: 'application/json' }, cache: 'no-store' })
        .then(async response => { if (!response.ok) throw new Error(`Network source ${response.status}`); return response.json() })
        .finally(() => window.clearTimeout(timeout))

      // If no local road tiles exist yet, show the backend's connected road network
      // as soon as it returns; the source utility query continues independently.
      const demoPayload = await Promise.race([demoPromise, new Promise(resolve => window.setTimeout(() => resolve(null), 6000))])
      const demoFeatures = Array.isArray(demoPayload?.features) ? demoPayload.features : []
      if (!immediateDemo.length && demoFeatures.length) {
        const existingOther = utilityFeaturesRef.current.filter(feature => String(feature?.properties?.category || '') !== category)
        const demoMerged = [...existingOther, ...demoFeatures]
        utilityFeaturesRef.current = demoMerged
        map.getSource('osm-underground-utilities')?.setData({ type: 'FeatureCollection', features: demoMerged })
        setUtilityFeatures(demoMerged)
        setUtilityCounts(prev => ({ ...prev, [category]: demoFeatures.length }))
        setUtilitySourceMode('loading-demo')
        setStatus(`${demoFeatures.length.toLocaleString()} CONNECTED ${category.toUpperCase()} DEMO network segments shown • source query running…`)
      }

      try {
        const payload = await sourcePromise
        const networkFeatures = Array.isArray(payload?.features) ? payload.features : []
        if (networkFeatures.length) {
          const existingOther = utilityFeaturesRef.current.filter(feature => String(feature?.properties?.category || '') !== category)
          const merged = [...existingOther, ...networkFeatures]
          utilityFeaturesRef.current = merged
          map.getSource('osm-underground-utilities')?.setData({ type: 'FeatureCollection', features: merged })
          setUtilityFeatures(merged)
          setUtilityCounts(prev => ({ ...prev, [category]: networkFeatures.length }))
          setUtilitySourceMode('source-mapped')
          const coords = networkFeatures.flatMap(feature => feature?.geometry?.type === 'LineString' ? feature.geometry.coordinates : feature?.geometry?.type === 'MultiLineString' ? feature.geometry.coordinates.flat() : [])
          const lngs = coords.map(point => Number(point?.[0])).filter(Number.isFinite)
          const lats = coords.map(point => Number(point?.[1])).filter(Number.isFinite)
          if (lngs.length >= 2 && lats.length >= 2) map.fitBounds([[Math.min(...lngs), Math.min(...lats)], [Math.max(...lngs), Math.max(...lats)]], { padding: 90, maxZoom: radiusKm >= 2 ? 16 : 16.8, duration: 700, essential: true })
          setStatus(`${networkFeatures.length.toLocaleString()} SOURCE-MAPPED ${category.toUpperCase()} network features loaded`)
        } else {
          const fallback = demoFeatures.length ? demoFeatures : immediateDemo
          if (fallback.length) {
            setUtilitySourceMode('demo-only')
            setUtilityCounts(prev => ({ ...prev, [category]: fallback.length }))
            const coords = fallback.flatMap(feature => feature?.geometry?.coordinates || [])
            const lngs = coords.map(point => Number(point?.[0])).filter(Number.isFinite)
            const lats = coords.map(point => Number(point?.[1])).filter(Number.isFinite)
            if (lngs.length >= 2 && lats.length >= 2) map.fitBounds([[Math.min(...lngs), Math.min(...lats)], [Math.max(...lngs), Math.max(...lats)]], { padding: 90, maxZoom: radiusKm >= 2 ? 16 : 16.8, duration: 650, essential: true })
            setStatus(`${fallback.length.toLocaleString()} CONNECTED DEMO ${category.toUpperCase()} network segments • no source-mapped utility route returned here`)
          } else setStatus('No utility or mapped road geometry returned for this focus area')
        }
      } catch (error) {
        const fallback = demoFeatures.length ? demoFeatures : immediateDemo
        if (fallback.length) {
          const existingOther = utilityFeaturesRef.current.filter(feature => String(feature?.properties?.category || '') !== category)
          const merged = [...existingOther, ...fallback]
          utilityFeaturesRef.current = merged
          map.getSource('osm-underground-utilities')?.setData({ type: 'FeatureCollection', features: merged })
          setUtilityFeatures(merged)
          setUtilityCounts(prev => ({ ...prev, [category]: fallback.length }))
          setUtilitySourceMode('demo-only')
          setStatus(`${fallback.length.toLocaleString()} CONNECTED DEMO ${category.toUpperCase()} network segments • source query timed out`)
        } else setStatus('Utility source unavailable and no mapped road geometry was returned')
      }
      setUnderground3DOpen(true)
    } catch (error) {
      console.debug('URDHVA utility network focus unavailable:', error)
      setStatus(`Unable to load ${category} network right now`)
    } finally {
      setUtilityNetworkLoading(false)
    }
  }

  const activeUtilityCategory = useMemo(() => {
    const allowed = ['water', 'sewer', 'gas', 'electricity', 'telecom']
    if (selectedUtility?.category && allowed.includes(selectedUtility.category)) return selectedUtility.category
    return allowed.find(key => undergroundLayers[key]) || null
  }, [undergroundLayers, selectedUtility])

  const resetView = () => {
    const map = mapRef.current
    if (!map) return
    if (geoLocation) {
      map.flyTo({ center: [geoLocation.lon, geoLocation.lat], zoom: geoLocation.zoom || 14, pitch: 58, bearing: 0, duration: 850, essential: true })
    } else {
      map.flyTo({ center: INDIA_CENTER, zoom: INDIA_ZOOM, pitch: 32, bearing: 0, duration: 850, essential: true })
    }
  }

  const view3D = () => mapRef.current?.easeTo({ pitch: 62, duration: 500, essential: true })

  const retry = () => {
    setMapError('')
    mapRef.current?.resize()
    mapRef.current?.triggerRepaint()
    if (mapRef.current?.getZoom() >= 12) setStatus('Retrying visible 3D vector tiles…')
  }

  return (
    <div className="relative w-full h-full overflow-hidden bg-slate-200">
      <div ref={mapContainerRef} className="absolute inset-0" />

      <div className="absolute top-4 left-4 z-10 pointer-events-none">
        <div className="bg-white/95 backdrop-blur-md border border-slate-200 rounded-2xl shadow-lg px-4 py-3 max-w-[440px]">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-xl bg-cyan-50 border border-cyan-200 flex items-center justify-center"><Rotate3d className="w-4 h-4 text-cyan-700" /></div>
            <div>
              <div className="text-sm font-bold text-slate-900">URDHVA Nationwide 3D</div>
              <div className="text-[10px] text-slate-500 font-medium">Real vector buildings • roads • water • clickable source features</div>
            </div>
          </div>
          <div className="mt-2 text-[10px] font-mono text-slate-500">{status}</div>
        </div>
      </div>

      <div className="absolute top-4 right-16 z-10 flex items-center gap-1.5">
        <button type="button" onClick={view3D} className="px-2.5 py-1.5 bg-white/95 border border-slate-200 rounded-lg shadow text-[10px] font-bold text-cyan-800 hover:bg-cyan-50 cursor-pointer flex items-center gap-1.5"><Rotate3d className="w-3.5 h-3.5" /> 3D</button>
        <button type="button" onClick={resetView} className="px-2.5 py-1.5 bg-white/95 border border-slate-200 rounded-lg shadow text-[10px] font-bold text-slate-700 hover:bg-slate-50 cursor-pointer flex items-center gap-1.5"><Compass className="w-3.5 h-3.5" /> Reset</button>
      </div>

      <div className="absolute top-20 right-4 z-10 w-[350px] bg-white/95 border border-slate-200 rounded-xl shadow-lg p-2.5 backdrop-blur-md">
        <div className="flex items-center gap-1.5 text-[10px] uppercase tracking-wider font-bold text-slate-500 mb-2"><Layers3 className="w-3 h-3" /> URDHVA map layers</div>
        <div className="grid grid-cols-2 gap-2">
          <div className="rounded-lg border border-slate-200 p-2">
            <div className="text-[9px] uppercase font-bold tracking-wider text-slate-400 mb-1">Buildings</div>
            {[
              ['3D buildings', building3DVisible, setBuilding3DVisible, '#0ea5e9'],
              ['2D footprints', building2DVisible, setBuilding2DVisible, '#2563eb'],
              ['OSM detail', osmDetailVisible, setOsmDetailVisible, '#14b8a6'],
              ['Floor-by-floor', osmFloorMode, setOsmFloorMode, '#f59e0b'],
            ].map(([label, active, setter, color]) => (
              <label key={label} className="flex items-center justify-between py-1 text-[10px] text-slate-700 cursor-pointer"><span className="flex items-center gap-1.5"><span className="w-2 h-2 rounded-sm" style={{ background: color }} />{label}</span><input type="checkbox" checked={active} onChange={e => setter(e.target.checked)} className="accent-cyan-600" /></label>
            ))}
          </div>
          <div className="rounded-lg border border-slate-200 p-2">
            <div className="text-[9px] uppercase font-bold tracking-wider text-slate-400 mb-1">Context</div>
            {[
              ['Roads', roadLayerVisible, setRoadLayerVisible],
              ['Surface water', waterLayerVisible, setWaterLayerVisible],
            ].map(([label, active, setter]) => (
              <label key={label} className="flex items-center justify-between py-1 text-[10px] text-slate-700 cursor-pointer"><span>{label}</span><input type="checkbox" checked={active} onChange={e => setter(e.target.checked)} className="accent-cyan-600" /></label>
            ))}
            <div className="mt-2 text-[8px] text-slate-400 leading-relaxed">3D and 2D controls are independent so the same geographic building can be inspected from either perspective.</div>
          </div>
        </div>

        <div className="mt-2 rounded-lg border border-slate-200 p-2">
          <div className="text-[9px] uppercase font-bold tracking-wider text-slate-400 mb-1">Underground / Utility search</div>
          <div className="grid grid-cols-2 gap-x-3 gap-y-1">
            {[
              ['Water pipeline', 'water', '#06b6d4'],
              ['Sewer', 'sewer', '#8b5cf6'],
              ['Gas pipeline', 'gas', '#f97316'],
              ['Electricity cable', 'electricity', '#eab308'],
              ['Telecom cable', 'telecom', '#2563eb'],
              ['Basements', 'basements', '#db2777'],
            ].map(([label, key, color]) => (
              <label key={key} className="flex items-center justify-between gap-2 py-1 text-[10px] text-slate-700 cursor-pointer"><span className="flex items-center gap-1.5 min-w-0"><span className="w-2.5 h-2.5 rounded-full shrink-0" style={{ background: color }} />{label}</span><span className="flex items-center gap-1"><span className="text-[8px] font-mono text-slate-400">{utilityCounts[key] || 0}{(['water','sewer','gas','electricity','telecom'].includes(key) && (utilitySourceMode === 'loading-demo' || utilitySourceMode === 'demo-only' || utilitySourceMode === 'source-plus-demo')) ? ' D' : ''}</span><input type="checkbox" checked={Boolean(undergroundLayers[key])} onChange={e => {
                const checked = e.target.checked
                setUndergroundLayers(prev => ({ ...prev, [key]: checked }))
                if (checked && key !== 'basements') {
                  const mapNow = mapRef.current
                  if (mapNow && mapNow.getZoom() < 12.5) mapNow.easeTo({ zoom: 14, duration: 650 })
                  // The viewport loader now gives an immediate DEMO preview and then
                  // replaces it with source-mapped data. Use the wider 3 km query only
                  // when the user explicitly asks for the full network.
                }
              }} className="accent-cyan-600" /></span></label>
            ))}
          </div>
          <div className="mt-1.5 flex items-center justify-between gap-2">
            <div className="text-[8px] text-slate-500 leading-relaxed">Source-mapped utilities are preferred. When none are returned, URDHVA shows a clearly labelled DEMO corridor aligned to real mapped roads so the SIH workflow remains visible; demo depth is not authoritative.</div>
            {(utilitySourceMode === 'source-plus-demo' || utilitySourceMode === 'loading-demo' || utilitySourceMode === 'demo-only') && <span className="shrink-0 rounded-full border border-amber-200 bg-amber-50 px-1.5 py-0.5 text-[8px] font-bold text-amber-700">DEMO PREVIEW / FALLBACK</span>}
            <button type="button" onClick={() => { lastUtilityKeyRef.current = ''; try { mapRef.current?.fire('moveend') } catch (_) {} }} className="shrink-0 inline-flex items-center gap-1 px-2 py-1 rounded-md border border-slate-200 bg-slate-50 text-[8px] font-bold text-slate-600 cursor-pointer"><RefreshCw className="w-3 h-3" /> Reload</button>
          </div>
          {activeUtilityCategory && (
            <button type="button" onClick={() => focusUtilityNetwork(activeUtilityCategory, 1)} disabled={utilityNetworkLoading} className="mt-2 w-full inline-flex items-center justify-center gap-1 px-2 py-1.5 rounded-md border border-slate-200 bg-slate-50 text-[8px] font-bold text-slate-700 cursor-pointer disabled:opacity-60"><Target className="w-3 h-3" /> {utilityNetworkLoading ? 'Searching utility network…' : `Show ${activeUtilityCategory} network (~1 km)`}</button>
          )}
          {selectedUtility?.category && ['water','sewer','gas','electricity','telecom'].includes(selectedUtility.category) && (
            <div className="mt-2 grid grid-cols-2 gap-1.5">
              <button type="button" onClick={() => focusUtilityNetwork(null, 3)} disabled={utilityNetworkLoading} className="inline-flex items-center justify-center gap-1 px-2 py-1.5 rounded-md border border-cyan-200 bg-cyan-50 text-[8px] font-bold text-cyan-800 cursor-pointer disabled:opacity-60"><Target className="w-3 h-3" /> {utilityNetworkLoading ? 'Loading network…' : 'Expand network (~3 km)'}</button>
              <button type="button" onClick={() => setUnderground3DOpen(true)} className="inline-flex items-center justify-center gap-1 px-2 py-1.5 rounded-md border border-slate-200 bg-slate-50 text-[8px] font-bold text-slate-700 cursor-pointer"><Box className="w-3 h-3" /> 3D depth view</button>
            </div>
          )}
        </div>

        <div className="pt-2 mt-2 border-t border-slate-200 text-[9px] text-slate-500 space-y-1">
          <div className="flex items-center gap-1.5"><DatabaseZap className="w-3 h-3 text-emerald-600" /> Overture PMTiles + OSM / Overpass detail</div>
          <div className="flex items-center gap-1.5"><Building2 className="w-3 h-3 text-amber-600" /> Building height/floors keep source provenance</div>
          <div className="flex items-center gap-1.5"><Gauge className="w-3 h-3 text-cyan-600" /> Utility requests are viewport-limited, debounced and cached</div>
          {maharashtraUlpinResult?.status === 'resolved' && <div className="flex items-center gap-1.5 text-emerald-700"><MapPinned className="w-3 h-3" /> ULPIN parcel highlighted</div>}
        </div>
      </div>

      {underground3DOpen && utilityFeatures.length > 0 && (
        <div className="absolute top-20 left-4 z-20 w-[520px] max-w-[calc(100vw-32px)] bg-slate-950 border border-cyan-500/40 rounded-xl shadow-2xl overflow-hidden">
          <div className="flex items-center justify-between gap-2 px-3 py-2 border-b border-slate-800">
            <div>
              <div className="text-[9px] uppercase tracking-wider font-bold text-cyan-300">URDHVA underground 3D explorer</div>
              <div className="text-[8px] text-slate-400 mt-0.5">Network context + depth-aware source geometry • unknown depths stay unassigned</div>
            </div>
            <button type="button" onClick={() => setUnderground3DOpen(false)} className="px-2 py-1 rounded-md bg-slate-800 text-slate-300 text-[9px] cursor-pointer">×</button>
          </div>
          <Underground3DExplorer
            features={utilityFeatures}
            selectedFeature={selectedUtility}
            selectedBuilding={geoSelectedFeature}
            selectedCategory={selectedUtility?.category || null}
            onClose={() => setUnderground3DOpen(false)}
            height="h-96"
          />
        </div>
      )}

      {mapError && (
        <div className="absolute bottom-16 left-1/2 -translate-x-1/2 z-20 px-4 py-3 bg-white/96 border border-amber-300 rounded-xl shadow-lg text-center max-w-md">
          <div className="text-[11px] font-bold text-amber-900">Geographic data notice</div>
          <div className="text-[10px] text-slate-600 mt-1">{mapError}</div>
          <button type="button" onClick={retry} className="mt-2 inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-100 border border-slate-300 text-[10px] font-bold text-slate-700 cursor-pointer"><RefreshCw className="w-3 h-3" /> Retry</button>
        </div>
      )}

      {selectedUtility && (
        <div className="absolute bottom-36 left-4 z-20 w-72 bg-white/95 border border-slate-200 rounded-xl shadow-lg p-3 backdrop-blur-md">
          <div className="flex items-center justify-between gap-2">
            <div className="text-[10px] uppercase tracking-wider font-bold text-slate-500">Selected underground feature</div>
            <button type="button" onClick={() => { setSelectedUtility(null); setGeoSelectedUtility(null) }} className="text-slate-400 hover:text-slate-700 text-xs">×</button>
          </div>
          <div className="mt-1.5 text-sm font-bold capitalize text-slate-900">{String(selectedUtility.category || 'utility').replace('_', ' ')}</div>
          <div className="grid grid-cols-2 gap-1.5 mt-2 text-[9px]">
            <div className="rounded bg-slate-50 p-1.5"><span className="text-slate-400">Name</span><div className="font-semibold text-slate-700 truncate">{selectedUtility.name || 'Not available'}</div></div>
            <div className="rounded bg-slate-50 p-1.5"><span className="text-slate-400">Operator</span><div className="font-semibold text-slate-700 truncate">{selectedUtility.operator || 'Not available'}</div></div>
            <div className="rounded bg-slate-50 p-1.5"><span className="text-slate-400">Depth</span><div className="font-semibold text-slate-700">{selectedUtility.depth_m != null ? `${selectedUtility.depth_m} m` : 'Not available'}</div></div>
            <div className="rounded bg-slate-50 p-1.5"><span className="text-slate-400">Substance</span><div className="font-semibold text-slate-700 truncate">{selectedUtility.substance || 'Not available'}</div></div>
          </div>
          <div className="mt-2 text-[8px] text-slate-500">{selectedUtility.source} • {selectedUtility.data_status}</div>
          <div className="mt-1 rounded bg-slate-50 border border-slate-100 p-1.5 text-[7.5px]"><span className="text-slate-400">Network path</span><div className="font-bold text-slate-700 truncate">{selectedUtility.network_id || (selectedUtility.network_connected ? 'Connected network' : 'Mapped segment')}</div>{selectedUtility.network_connected ? <div className="text-emerald-700 mt-0.5">Topologically connected for visualization</div> : null}</div>
          <div className="mt-2 grid grid-cols-3 gap-1 text-[7.5px]">
            <div className="rounded bg-slate-50 border border-slate-100 p-1.5"><span className="text-slate-400">Network</span><div className="font-bold text-slate-700">{utilityCounts[selectedUtility.category] || 0}</div></div>
            <div className="rounded bg-slate-50 border border-slate-100 p-1.5"><span className="text-slate-400">Depth</span><div className="font-bold text-slate-700">{selectedUtility.depth_m != null ? `${selectedUtility.depth_m} m` : 'N/A'}</div></div>
            <div className="rounded bg-slate-50 border border-slate-100 p-1.5"><span className="text-slate-400">Crossing</span><div className="font-bold text-slate-700">{geoSelectedFeature ? (featureCrossesBuilding(selectedUtility, geoSelectedFeature) ? 'YES' : 'NO') : 'Area'}</div></div>
          </div>
          {isDemoUtilityFeature({ properties: selectedUtility }) && <div className="mt-1.5 rounded-md border border-amber-200 bg-amber-50 px-2 py-1 text-[8px] font-semibold text-amber-700">DEMO VISUALIZATION • road-aligned prototype route • depth is illustrative</div>}
          {['water','sewer','gas','electricity','telecom'].includes(selectedUtility.category) && (
            <div className="mt-2 grid grid-cols-2 gap-1.5">
              <button type="button" onClick={() => focusUtilityNetwork(null, 3)} disabled={utilityNetworkLoading} className="inline-flex items-center justify-center gap-1 px-2 py-1.5 rounded-md bg-cyan-600 text-white text-[8px] font-bold cursor-pointer disabled:opacity-60"><Maximize2 className="w-3 h-3" /> Full network</button>
              <button type="button" onClick={() => setUnderground3DOpen(true)} className="inline-flex items-center justify-center gap-1 px-2 py-1.5 rounded-md bg-slate-900 text-white text-[8px] font-bold cursor-pointer"><Box className="w-3 h-3" /> Underground 3D</button>
            </div>
          )}
        </div>
      )}

      <div className="absolute bottom-4 left-4 z-10 bg-white/95 border border-slate-200 rounded-xl shadow-lg px-3 py-2 text-[9px] text-slate-600 space-y-1">
        <div className="font-bold text-slate-800">3D source legend</div>
        <div className="flex items-center gap-2"><span className="w-3 h-3 rounded-sm" style={{ background: '#d5a325' }} /> Source height</div>
        <div className="flex items-center gap-2"><span className="w-3 h-3 rounded-sm" style={{ background: '#efbb39' }} /> Source floors • estimated height</div>
        <div className="flex items-center gap-2"><span className="w-3 h-3 rounded-sm" style={{ background: '#aeb8c3' }} /> Footprint only • visual base thickness</div>
        <div className="flex items-center gap-2"><span className="w-3 h-3 rounded-sm" style={{ background: '#0ea5e9' }} /> OSM detail loaded at city/neighborhood zoom</div>
        <div className="flex items-center gap-2"><span className="w-3 h-3 rounded-sm" style={{ background: '#8b5cf6' }} /> Height: OSM source → exact; OSM floors → 3.2 m/floor estimate</div>
        <div className="flex items-center gap-2"><span className="w-3 h-3 rounded-sm" style={{ background: '#14b8a6' }} /> Official ULPIN parcel when resolved</div>        <div className="mt-1 pt-1 border-t border-slate-200 font-semibold text-slate-700">Underground utility colors</div>
        <div className="flex items-center gap-2"><span className="w-3 h-1 rounded" style={{ background: '#06b6d4' }} /> Water</div>
        <div className="flex items-center gap-2"><span className="w-3 h-1 rounded" style={{ background: '#8b5cf6' }} /> Sewer</div>
        <div className="flex items-center gap-2"><span className="w-3 h-1 rounded" style={{ background: '#f97316' }} /> Gas</div>
        <div className="flex items-center gap-2"><span className="w-3 h-1 rounded" style={{ background: '#eab308' }} /> Electricity</div>
        <div className="flex items-center gap-2"><span className="w-3 h-1 rounded" style={{ background: '#2563eb' }} /> Telecom</div>
        <div className="flex items-center gap-2"><span className="w-3 h-1 rounded" style={{ background: '#db2777' }} /> Mapped basements</div>

      </div>

      <div className="absolute bottom-4 right-5 z-10 bg-white/95 border border-slate-200 rounded-xl shadow-lg px-3 py-2 text-[9px] text-slate-600 space-y-1.5 min-w-[260px]">
        <div className="flex items-center justify-between gap-4">
          <span className="font-bold text-slate-800">{getLodLabel(zoomLevel)}</span>
          <span className="font-mono text-cyan-700">z{Number(zoomLevel).toFixed(1)}</span>
        </div>
        <div>{stats.buildings > 0 ? `${stats.buildings.toLocaleString()} visible source building features` : 'Zoom in to load building vector tiles'} • click a building to inspect</div>
      </div>
    </div>
  )
}
