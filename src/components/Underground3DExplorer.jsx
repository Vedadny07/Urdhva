import React, { useMemo, useState } from 'react'
import { Canvas } from '@react-three/fiber'
import { Grid, Html, Line, OrbitControls } from '@react-three/drei'
import * as THREE from 'three'

const COLORS = {
  water: '#06b6d4',
  sewer: '#8b5cf6',
  gas: '#f97316',
  electricity: '#eab308',
  telecom: '#2563eb',
  other_pipeline: '#94a3b8',
}

function lineCoords(geometry) {
  if (!geometry) return []
  if (geometry.type === 'LineString') return geometry.coordinates || []
  if (geometry.type === 'MultiLineString') return (geometry.coordinates || []).flat()
  return []
}

function polygonRing(geometry) {
  if (!geometry) return []
  if (geometry.type === 'Polygon') return geometry.coordinates?.[0] || []
  if (geometry.type === 'MultiPolygon') return geometry.coordinates?.[0]?.[0] || []
  return []
}

function centroidOf(points) {
  const valid = (points || []).filter(p => Array.isArray(p) && Number.isFinite(Number(p[0])) && Number.isFinite(Number(p[1])))
  if (!valid.length) return [0, 0]
  return [valid.reduce((s, p) => s + Number(p[0]), 0) / valid.length, valid.reduce((s, p) => s + Number(p[1]), 0) / valid.length]
}

function localMeters(lon, lat, centerLon, centerLat) {
  const yScale = 110540
  const xScale = 111320 * Math.max(0.2, Math.cos(centerLat * Math.PI / 180))
  return [(lon - centerLon) * xScale, (lat - centerLat) * yScale]
}

function pointInsideRing(point, ring) {
  const [x, y] = point
  let inside = false
  for (let i = 0, j = ring.length - 1; i < ring.length; j = i++) {
    const xi = Number(ring[i]?.[0]), yi = Number(ring[i]?.[1])
    const xj = Number(ring[j]?.[0]), yj = Number(ring[j]?.[1])
    const intersect = ((yi > y) !== (yj > y)) && (x < (xj - xi) * (y - yi) / ((yj - yi) || 1e-12) + xi)
    if (intersect) inside = !inside
  }
  return inside
}

function orientation(a, b, c) {
  const value = (Number(b[1]) - Number(a[1])) * (Number(c[0]) - Number(b[0])) - (Number(b[0]) - Number(a[0])) * (Number(c[1]) - Number(b[1]))
  if (Math.abs(value) < 1e-12) return 0
  return value > 0 ? 1 : 2
}

function onSegment(a, b, c) {
  return Math.min(a[0], c[0]) <= b[0] + 1e-12 && b[0] <= Math.max(a[0], c[0]) + 1e-12 && Math.min(a[1], c[1]) <= b[1] + 1e-12 && b[1] <= Math.max(a[1], c[1]) + 1e-12
}

function segmentsIntersect(p1, q1, p2, q2) {
  const o1 = orientation(p1, q1, p2)
  const o2 = orientation(p1, q1, q2)
  const o3 = orientation(p2, q2, p1)
  const o4 = orientation(p2, q2, q1)
  if (o1 !== o2 && o3 !== o4) return true
  if (o1 === 0 && onSegment(p1, p2, q1)) return true
  if (o2 === 0 && onSegment(p1, q2, q1)) return true
  if (o3 === 0 && onSegment(p1, p1, q2)) return true
  if (o4 === 0 && onSegment(p1, q1, q2)) return true
  return false
}

function featureCrossesBuilding(feature, building) {
  const ring = polygonRing(building?.geometry)
  const coords = lineCoords(feature?.geometry)
  if (ring.length < 3 || coords.length < 2) return false
  if (coords.some(point => pointInsideRing(point, ring))) return true
  for (let i = 0; i < coords.length - 1; i += 1) {
    for (let j = 0; j < ring.length - 1; j += 1) {
      if (segmentsIntersect(coords[i], coords[i + 1], ring[j], ring[j + 1])) return true
    }
  }
  return false
}

function distanceMeters(a, b) {
  const lat0 = ((Number(a?.[1]) || 0) + (Number(b?.[1]) || 0)) / 2
  const x = (Number(b?.[0]) - Number(a?.[0])) * 111320 * Math.cos(lat0 * Math.PI / 180)
  const y = (Number(b?.[1]) - Number(a?.[1])) * 110540
  return Math.hypot(x, y)
}

function featureMidpoint(feature) {
  const pts = lineCoords(feature?.geometry)
  if (!pts.length) return null
  return pts[Math.floor(pts.length / 2)]
}

function networkCenter(features, building) {
  if (building?.geometry) {
    const ring = polygonRing(building.geometry)
    if (ring.length >= 3) return centroidOf(ring)
  }
  let lon = 0
  let lat = 0
  let count = 0
  for (const feature of features || []) {
    for (const point of lineCoords(feature?.geometry)) {
      const x = Number(point?.[0])
      const y = Number(point?.[1])
      if (!Number.isFinite(x) || !Number.isFinite(y)) continue
      lon += x
      lat += y
      count += 1
    }
  }
  return count ? [lon / count, lat / count] : [0, 0]
}

function GroundDivider({ size = 9 }) {
  return (
    <group>
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0, 0]}>
        <planeGeometry args={[size, size]} />
        <meshBasicMaterial color="#94a3b8" transparent opacity={0.08} side={THREE.DoubleSide} />
      </mesh>
      <mesh position={[0, 0.01, 0]}>
        <boxGeometry args={[size, 0.035, 0.035]} />
        <meshBasicMaterial color="#67e8f9" transparent opacity={0.8} />
      </mesh>
      <Html position={[size / 2 - 0.25, 0.12, 0]} center style={{ pointerEvents: 'none' }}>
        <div style={{ background: 'rgba(8,47,73,.94)', border: '1px solid rgba(103,232,249,.7)', color: '#a5f3fc', borderRadius: 6, padding: '3px 5px', fontSize: 8, fontWeight: 800, whiteSpace: 'nowrap' }}>GROUND • 0 m</div>
      </Html>
    </group>
  )
}

function BuildingVolume({ building, center, verticalScale }) {
  const model = useMemo(() => {
    const ring = polygonRing(building?.geometry)
    if (ring.length < 3) return null
    const points = ring.map(point => {
      const [x, z] = localMeters(Number(point[0]), Number(point[1]), center[0], center[1])
      return [x, z]
    })
    const sourceHeight = Number(building?.height_m || building?.height || 0)
    const levels = Number(building?.levels || building?.num_floors || building?.estimated_floors || 0)
    const height = sourceHeight > 0 ? sourceHeight : levels > 0 ? levels * 3.2 : Number(building?.render_height_m || 0.35)
    const safeHeight = Number.isFinite(height) && height > 0 ? Math.min(height, 180) : 12
    const shape = new THREE.Shape()
    points.forEach(([x, z], index) => index === 0 ? shape.moveTo(x, z) : shape.lineTo(x, z))
    shape.closePath()
    const geometry = new THREE.ExtrudeGeometry(shape, { depth: safeHeight * verticalScale, bevelEnabled: false, steps: 1 })
    geometry.rotateX(-Math.PI / 2)
    geometry.translate(0, 0.02, 0)
    geometry.computeBoundingBox()
    return { geometry, height: safeHeight, levels: Math.min(36, Math.max(0, Math.round(levels))) }
  }, [building, center, verticalScale])

  if (!model) return null
  const sourceFloors = model.levels
  const undergroundLevels = Math.min(6, Math.max(0, Math.round(Number(building?.levels_underground || building?.num_floors_underground || 0))))
  const floorHeight = sourceFloors > 0 ? (model.height * verticalScale) / sourceFloors : 0
  const basementHeight = Math.max(0.18, verticalScale * 3.0)
  const labelX = Math.max(1.4, (model.geometry.boundingBox?.max.x || 1) + 0.4)
  const bodyWidth = Math.max(0.8, (model.geometry.boundingBox?.max.x || 1) - (model.geometry.boundingBox?.min.x || -1))
  const bodyDepth = Math.max(0.8, (model.geometry.boundingBox?.max.z || 1) - (model.geometry.boundingBox?.min.z || -1))

  return (
    <group>
      <mesh geometry={model.geometry}>
        <meshBasicMaterial color="#d5a325" transparent opacity={0.10} side={THREE.DoubleSide} depthWrite={false} />
      </mesh>
      <mesh geometry={model.geometry}>
        <meshBasicMaterial color="#cbd5e1" wireframe transparent opacity={0.34} />
      </mesh>
      {sourceFloors > 0 && Array.from({ length: Math.min(36, sourceFloors) }, (_, index) => (
        <group key={`floor-marker-${index}`}>
          <mesh position={[0, (index + 1) * floorHeight, 0]}>
            <boxGeometry args={[bodyWidth, 0.012, bodyDepth]} />
            <meshBasicMaterial color="#fbbf24" transparent opacity={0.32} />
          </mesh>
          {(index === sourceFloors - 1 || index % 5 === 0) && (
            <Html position={[labelX, (index + 0.7) * floorHeight, 0]} center style={{ pointerEvents: 'none' }}>
              <div style={{ background: 'rgba(15,23,42,.88)', border: '1px solid rgba(251,191,36,.35)', color: '#f8fafc', borderRadius: 5, padding: '2px 4px', fontSize: 7.5, fontWeight: 800 }}>F{String(index + 1).padStart(2, '0')}</div>
            </Html>
          )}
        </group>
      ))}
      {undergroundLevels > 0 && Array.from({ length: undergroundLevels }, (_, index) => (
        <group key={`basement-marker-${index}`}>
          <mesh position={[0, -(index + 0.55) * basementHeight, 0]}>
            <boxGeometry args={[bodyWidth, 0.025, bodyDepth]} />
            <meshBasicMaterial color="#db2777" transparent opacity={0.28} />
          </mesh>
          <Html position={[labelX, -(index + 0.65) * basementHeight, 0]} center style={{ pointerEvents: 'none' }}>
            <div style={{ background: 'rgba(80,7,36,.88)', border: '1px solid rgba(244,114,182,.5)', color: '#f9a8d4', borderRadius: 5, padding: '2px 4px', fontSize: 7.5, fontWeight: 800 }}>B{index + 1}</div>
          </Html>
        </group>
      ))}
      <Html position={[labelX, model.height * verticalScale + 0.15, 0]} center style={{ pointerEvents: 'none' }}>
        <div style={{ background: 'rgba(15,23,42,.92)', border: '1px solid rgba(148,163,184,.6)', color: '#e2e8f0', borderRadius: 7, padding: '4px 7px', fontSize: 8, whiteSpace: 'nowrap' }}>
          <b>{building.name || building.source_id || 'Selected building'}</b><br />{sourceFloors || '?'} source/estimated floors • ground = 0 m
        </div>
      </Html>
    </group>
  )
}

function SelectedUtilityTube({ points, color, radius = 0.035 }) {
  const geometry = useMemo(() => {
    if (!Array.isArray(points) || points.length < 2) return null
    const vectors = points
      .filter(p => Array.isArray(p) && p.length >= 3)
      .map(([x, y, z]) => new THREE.Vector3(Number(x), Number(y), Number(z)))
    if (vectors.length < 2) return null
    const curve = new THREE.CurvePath()
    for (let i = 0; i < vectors.length - 1; i += 1) {
      curve.add(new THREE.LineCurve3(vectors[i], vectors[i + 1]))
    }
    return new THREE.TubeGeometry(curve, Math.min(240, Math.max(24, vectors.length * 12)), radius, 8, false)
  }, [points, radius])
  if (!geometry) return null
  return (
    <mesh geometry={geometry}>
      <meshStandardMaterial color={color} roughness={0.38} metalness={0.15} />
    </mesh>
  )
}

function UtilityNetwork({ features, selectedFeature, selectedCategory, maxDepthToShow, selectedBuilding }) {
  const model = useMemo(() => {
    const chosenId = String(selectedFeature?.source_id || '')
    const filteredAll = (features || [])
      .filter(feature => feature?.geometry)
      .filter(feature => ['water', 'sewer', 'gas', 'electricity', 'telecom', 'other_pipeline'].includes(String(feature?.properties?.category || '')))
      .filter(feature => !selectedCategory || String(feature?.properties?.category || '') === selectedCategory || String(feature?.properties?.source_id || '') === chosenId)
      .slice(0, 700)

    const buildingCenter = selectedBuilding?.geometry ? centroidOf(polygonRing(selectedBuilding.geometry)) : null
    const filtered = buildingCenter
      ? filteredAll.filter(feature => {
          const mid = featureMidpoint(feature)
          return String(feature?.properties?.source_id || '') === chosenId || (mid && distanceMeters(buildingCenter, mid) <= 1000)
        }).concat(filteredAll.filter(feature => String(feature?.properties?.source_id || '') === chosenId).filter(feature => !filteredAll.some(f => String(f?.properties?.source_id || '') === String(feature?.properties?.source_id || ''))))
      : filteredAll

    const visible = filtered.length ? filtered : filteredAll
    const center = networkCenter(visible, selectedBuilding)
    const points = visible.flatMap(feature => lineCoords(feature.geometry))
    let maxAbs = 1
    for (const point of points) {
      const [x, z] = localMeters(Number(point[0]), Number(point[1]), center[0], center[1])
      maxAbs = Math.max(maxAbs, Math.abs(x), Math.abs(z))
    }
    const buildingRing = polygonRing(selectedBuilding?.geometry)
    if (buildingRing.length >= 3) {
      for (const point of buildingRing) {
        const [x, z] = localMeters(Number(point[0]), Number(point[1]), center[0], center[1])
        maxAbs = Math.max(maxAbs, Math.abs(x), Math.abs(z))
      }
    }
    const areaScale = Math.min(0.0048, 5.2 / maxAbs)
    const verticalExaggeration = 2.6
    const lines = visible.map((feature, index) => {
      const props = feature.properties || {}
      const category = String(props.category || 'other_pipeline')
      const color = COLORS[category] || COLORS.other_pipeline
      const depth = Number(props.depth_m)
      const hasDepth = Number.isFinite(depth) && depth >= 0
      const withinSlice = !hasDepth || depth <= maxDepthToShow
      if (!withinSlice) return null
      const demo = props.data_status === 'demo-visualization' || props.demo === true
      const mappedPoints = lineCoords(feature.geometry).map(point => {
        const [x, z] = localMeters(Number(point[0]), Number(point[1]), center[0], center[1])
        const y = hasDepth ? -(depth * verticalExaggeration * areaScale) : -0.09
        return [x * areaScale, y, z * areaScale]
      })
      return {
        key: String(props.source_id || `utility-${index}`),
        color,
        points: mappedPoints,
        category,
        depth: hasDepth ? depth : null,
        hasDepth,
        demo,
        selected: String(props.source_id || '') === chosenId,
        underBuilding: featureCrossesBuilding(feature, selectedBuilding),
        label: props.name || props.operator || props.substance || category,
      }
    }).filter(Boolean).filter(item => item.points.length >= 2)

    return { lines, center, areaScale, verticalExaggeration }
  }, [features, selectedFeature, selectedCategory, maxDepthToShow, selectedBuilding])

  const buildingHeightScale = model.areaScale * model.verticalExaggeration

  return (
    <>
      <GroundDivider size={12} />
      <Grid args={[12, 12]} position={[0, -0.04, 0]} cellSize={0.5} cellThickness={0.45} cellColor="#334155" sectionColor="#64748b" fadeDistance={18} fadeStrength={2} />
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0, 0]}>
        <planeGeometry args={[11, 11]} />
        <meshBasicMaterial color="#cbd5e1" transparent opacity={0.10} side={THREE.DoubleSide} />
      </mesh>
      {selectedBuilding && <BuildingVolume building={selectedBuilding} center={model.center} verticalScale={buildingHeightScale} />}
      {model.lines.map((line, index) => (
        <group key={line.key}>
          <Line points={line.points} color={line.color} lineWidth={line.selected ? 5.5 : line.underBuilding ? 3.8 : 2.5} transparent opacity={line.selected ? 1 : line.hasDepth ? 0.92 : 0.46} dashed={!line.hasDepth} dashSize={0.14} gapSize={0.10} />
          {line.hasDepth && (line.selected || line.demo || index < 320) && <SelectedUtilityTube points={line.points} color={line.color} radius={line.selected ? 0.05 : line.demo ? 0.028 : 0.018} />}
          {line.selected && (
            <Html position={line.points[Math.floor(line.points.length / 2)]} center style={{ pointerEvents: 'none' }}>
              <div style={{ background: 'rgba(15,23,42,.96)', color: '#fff', border: `1px solid ${line.color}`, borderRadius: 7, padding: '4px 6px', fontSize: 8, whiteSpace: 'nowrap' }}>
                <b style={{ color: line.color }}>{line.label}</b><br />
                {line.hasDepth ? `${line.depth} m • ${line.demo ? 'demo depth' : 'source depth'}` : 'Depth unavailable • plan route only'}<br />
                {line.hasDepth ? <span style={{ color: '#93c5fd' }}>3D pipe/cable shown below ground</span> : null}<br />
                {line.underBuilding ? <span style={{ color: '#fbbf24' }}>Crosses selected building footprint</span> : <span style={{ color: '#94a3b8' }}>No building-footprint crossing detected</span>}
              </div>
            </Html>
          )}
        </group>
      ))}
      <Html position={[-5.1, 0.16, -5.05]} style={{ pointerEvents: 'none' }}>
        <div style={{ background: 'rgba(15,23,42,.92)', color: '#cbd5e1', borderRadius: 7, padding: '5px 7px', fontSize: 8, lineHeight: 1.35, whiteSpace: 'nowrap' }}>
          <b style={{ color: '#67e8f9' }}>UNDERGROUND 3D</b><br />Solid = known depth • dashed = depth unavailable
          {features.some(f => f?.properties?.data_status === 'demo-visualization') && <><br /><span style={{ color: '#fbbf24' }}>DEMO = road-aligned prototype visualization</span></>}
        </div>
      </Html>
    </>
  )
}

export default function Underground3DExplorer({ features = [], selectedFeature = null, selectedBuilding = null, selectedCategory = null, height = 'h-80' }) {
  const depthFeatures = useMemo(() => features.filter(feature => Number.isFinite(Number(feature?.properties?.depth_m)) && Number(feature.properties.depth_m) >= 0), [features])
  const maxDepth = useMemo(() => Math.max(1, depthFeatures.reduce((max, feature) => Math.max(max, Number(feature?.properties?.depth_m) || 0), 0)), [depthFeatures])
  const [depthSlice, setDepthSlice] = useState(maxDepth)

  React.useEffect(() => { setDepthSlice(maxDepth) }, [maxDepth])

  const demoCount = features.filter(f => f?.properties?.data_status === 'demo-visualization').length
  const crossing = selectedFeature && selectedBuilding ? featureCrossesBuilding(selectedFeature, selectedBuilding) : false

  return (
    <div className={`${height} relative bg-slate-950`}>
      <Canvas camera={{ position: [7.4, 6.2, 7.4], fov: 42 }} gl={{ antialias: true, powerPreference: 'default' }}>
        <ambientLight intensity={0.7} />
        <UtilityNetwork features={features} selectedFeature={selectedFeature} selectedCategory={selectedCategory} maxDepthToShow={depthSlice} selectedBuilding={selectedBuilding} />
        <OrbitControls enablePan enableZoom minPolarAngle={Math.PI / 7} maxPolarAngle={Math.PI / 2.02} />
      </Canvas>

      <div className="absolute top-2 right-2 rounded-md bg-slate-900/90 border border-slate-700 px-2 py-1 text-[8px] text-slate-300 pointer-events-none">
        {selectedBuilding ? `Selected building + utility network context (~1 km)` : 'Area network context'}
      </div>

      {selectedFeature && selectedBuilding && (
        <div className={`absolute top-2 left-2 rounded-md border px-2 py-1 text-[8px] font-bold pointer-events-none ${crossing ? 'border-amber-400/60 bg-amber-500/10 text-amber-300' : 'border-slate-700 bg-slate-900/90 text-slate-300'}`}>
          {crossing ? 'UTILITY CROSSES SELECTED BUILDING FOOTPRINT' : 'NO SOURCE FOOTPRINT CROSSING DETECTED'}
        </div>
      )}

      {depthFeatures.length > 0 && (
        <div className="absolute left-2 top-12 bottom-14 w-32 rounded-lg bg-slate-900/90 border border-slate-700 px-2 py-2 text-[8px] text-slate-300">
          <div className="font-bold text-cyan-300 uppercase tracking-wider">Depth slice</div>
          <input type="range" min="0.1" max={Math.max(1, maxDepth)} step="0.1" value={Math.min(depthSlice, maxDepth)} onChange={e => setDepthSlice(Number(e.target.value))} className="w-full mt-2 accent-cyan-500" />
          <div className="flex items-center justify-between mt-1"><span>0 m</span><span>-{depthSlice.toFixed(1)} m</span></div>
          <div className="mt-2 text-slate-500">Solid depth uses the mapped/demo value on each feature. Demo depths are illustrative.</div>
        </div>
      )}

      <div className="absolute left-2 bottom-2 right-2 flex items-end justify-between gap-2 pointer-events-none">
        <div className="rounded-lg bg-slate-900/90 border border-slate-700 px-2 py-1.5 text-[8px] text-slate-300">
          <b className="text-cyan-300">{selectedCategory ? `${selectedCategory.toUpperCase()} network` : 'Utility network'}</b> • {features.length.toLocaleString()} loaded features{demoCount ? ` • ${demoCount} DEMO` : ''}
        </div>
        <div className="rounded-lg bg-slate-900/90 border border-slate-700 px-2 py-1.5 text-[8px] text-right text-slate-300">
          <b className="text-amber-300">Known depth</b>: {depthFeatures.length ? `up to ${maxDepth.toFixed(1)} m` : 'none mapped'}<br />
          <span className="text-slate-500">Vertical depth exaggerated 2.6× for visibility</span>
        </div>
      </div>
    </div>
  )
}
