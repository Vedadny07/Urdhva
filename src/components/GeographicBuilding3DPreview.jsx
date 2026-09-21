import React, { useMemo, useState } from 'react'
import { Canvas } from '@react-three/fiber'
import { Html, OrbitControls, PerspectiveCamera } from '@react-three/drei'
import * as THREE from 'three'

function safeNumber(value, fallback = 0) {
  const n = Number(value)
  return Number.isFinite(n) ? n : fallback
}

function polygonPartsFromGeometry(geometry) {
  if (!geometry) return []
  if (geometry.type === 'Polygon') return [geometry.coordinates]
  if (geometry.type === 'MultiPolygon') return Array.isArray(geometry.coordinates) ? geometry.coordinates : []
  return []
}

function projectLonLatRing(ring, centerLon, centerLat) {
  const latScale = 110540
  const lonScale = 111320 * Math.cos(centerLat * Math.PI / 180)
  return ring
    .filter(p => Array.isArray(p) && p.length >= 2)
    .map(([lon, lat]) => [
      (Number(lon) - centerLon) * lonScale,
      (Number(lat) - centerLat) * latScale,
    ])
}

function getFootprintModelData(feature) {
  const geometries = []
  const parts = polygonPartsFromGeometry(feature?.geometry)
  for (const poly of parts) {
    if (!Array.isArray(poly) || !poly[0]) continue
    const outer = poly[0]
    if (outer.length < 3) continue
    const centerLon = outer.reduce((sum, p) => sum + Number(p?.[0] || 0), 0) / outer.length
    const centerLat = outer.reduce((sum, p) => sum + Number(p?.[1] || 0), 0) / outer.length
    const outerMeters = projectLonLatRing(outer, centerLon, centerLat)
    geometries.push({ outer: outerMeters, holes: (poly.slice(1) || []).map(r => projectLonLatRing(r, centerLon, centerLat)).filter(r => r.length >= 3), centerLon, centerLat })
  }

  if (!geometries.length) return null

  const largest = geometries.reduce((best, current) => {
    const area = Math.abs(current.outer.reduce((a, p, i, arr) => a + p[0] * arr[(i + 1) % arr.length][1] - arr[(i + 1) % arr.length][0] * p[1], 0)) / 2
    const bestArea = Math.abs(best.outer.reduce((a, p, i, arr) => a + p[0] * arr[(i + 1) % arr.length][1] - arr[(i + 1) % arr.length][0] * p[1], 0)) / 2
    return area > bestArea ? current : best
  }, geometries[0])

  const xs = largest.outer.map(p => p[0])
  const ys = largest.outer.map(p => p[1])
  const minX = Math.min(...xs)
  const maxX = Math.max(...xs)
  const minY = Math.min(...ys)
  const maxY = Math.max(...ys)
  const centerX = (minX + maxX) / 2
  const centerY = (minY + maxY) / 2
  const centeredOuter = largest.outer.map(([x, y]) => [x - centerX, y - centerY])
  const centeredHoles = largest.holes.map(r => r.map(([x, y]) => [x - centerX, y - centerY]))
  const footprintWidth = Math.max(0.01, maxX - minX)
  const footprintDepth = Math.max(0.01, maxY - minY)

  return {
    outer: centeredOuter,
    holes: centeredHoles,
    width: footprintWidth,
    depth: footprintDepth,
    center: [largest.centerLon, largest.centerLat],
  }
}

function makeShape(model) {
  const shape = new THREE.Shape(model.outer.map(([x, y]) => new THREE.Vector2(x, y)))
  for (const holeRing of model.holes || []) {
    const path = new THREE.Path(holeRing.map(([x, y]) => new THREE.Vector2(x, y)))
    shape.holes.push(path)
  }
  return shape
}

function FootprintSlab({ model, y, thickness, scale, color, opacity = 1 }) {
  const geometry = useMemo(() => {
    const shape = makeShape(model)
    const geom = new THREE.ExtrudeGeometry(shape, { depth: thickness / scale, bevelEnabled: false, steps: 1 })
    geom.rotateX(Math.PI / 2)
    geom.translate(0, thickness / (2 * scale), 0)
    geom.scale(scale, scale, scale)
    return geom
  }, [model, thickness, scale])

  return (
    <mesh geometry={geometry} position={[0, y, 0]} castShadow receiveShadow>
      <meshStandardMaterial color={color} transparent={opacity < 1} opacity={opacity} roughness={0.78} metalness={0.05} />
    </mesh>
  )
}

function FloorBands({ model, floors, totalHeight, scale, sourceFloors }) {
  if (floors < 2) return null
  const floorHeight = totalHeight / floors
  return (
    <>
      {Array.from({ length: Math.min(36, floors - 1) }, (_, index) => {
        const y = (index + 1) * floorHeight
        return (
          <FootprintSlab
            key={`slab-${index}`}
            model={model}
            y={y * scale - totalHeight * scale / 2}
            thickness={0.035}
            scale={scale}
            color={sourceFloors ? '#334155' : '#7c5a11'}
            opacity={0.96}
          />
        )
      })}
    </>
  )
}


function stableDemoCode(value = '') {
  let hash = 2166136261
  for (const ch of String(value)) {
    hash ^= ch.charCodeAt(0)
    hash = Math.imul(hash, 16777619)
  }
  return Math.abs(hash >>> 0).toString(36).toUpperCase().padStart(8, '0').slice(0, 8)
}

function demoParcelUlpin(feature) {
  const existing = String(feature?.ulpin || feature?.official_ulpin || '').trim()
  if (existing) return existing
  return `DUMMY-ULPIN-${stableDemoCode(feature?.source_id || feature?.name || 'URDHVA')}`
}

function demoBuildingCode(feature) {
  const raw = String(feature?.source_id || feature?.id || 'BUILDING')
  return `B-${stableDemoCode(raw).slice(0, 6)}`
}

function polygonSignedArea(points) {
  let area = 0
  for (let i = 0; i < points.length; i += 1) {
    const a = points[i]; const b = points[(i + 1) % points.length]
    area += Number(a[0]) * Number(b[1]) - Number(b[0]) * Number(a[1])
  }
  return area / 2
}

function clipPolygon(points, axis, bound, keepLess) {
  if (!Array.isArray(points) || points.length < 3) return []
  const inside = (p) => keepLess ? p[axis] <= bound + 1e-7 : p[axis] >= bound - 1e-7
  const intersect = (a, b) => {
    const da = Number(a[axis]) - bound
    const db = Number(b[axis]) - bound
    const t = da / ((da - db) || 1e-12)
    return [
      Number(a[0]) + (Number(b[0]) - Number(a[0])) * t,
      Number(a[1]) + (Number(b[1]) - Number(a[1])) * t,
    ]
  }
  const out = []
  let previous = points[points.length - 1]
  let prevInside = inside(previous)
  for (const current of points) {
    const currInside = inside(current)
    if (currInside !== prevInside) out.push(intersect(previous, current))
    if (currInside) out.push(current)
    previous = current
    prevInside = currInside
  }
  return out.length >= 3 ? out : []
}

function footprintUnitPolygons(model, unitCount) {
  const outer = (model?.outer || []).filter((p, i, arr) => i === 0 || p[0] !== arr[i - 1][0] || p[1] !== arr[i - 1][1])
  if (outer.length < 3) return []

  const areaOf = (poly) => Math.abs(polygonSignedArea(poly))
  const pieces = [outer]
  // Recursively bisect the largest available footprint piece. This creates
  // four shape-conforming unit footprints without ever extending outside the
  // source building polygon, even for L-shapes and irregular polygons.
  while (pieces.length < Math.max(1, unitCount)) {
    let bestIndex = -1
    let bestArea = 0
    for (let i = 0; i < pieces.length; i += 1) {
      const poly = pieces[i]
      const xs = poly.map(p => p[0]); const zs = poly.map(p => p[1])
      const width = Math.max(...xs) - Math.min(...xs)
      const depth = Math.max(...zs) - Math.min(...zs)
      if (poly.length >= 4 && areaOf(poly) > bestArea && Math.max(width, depth) > 0.35) {
        bestIndex = i
        bestArea = areaOf(poly)
      }
    }
    if (bestIndex < 0) break
    const target = pieces[bestIndex]
    const xs = target.map(p => p[0]); const zs = target.map(p => p[1])
    const width = Math.max(...xs) - Math.min(...xs)
    const depth = Math.max(...zs) - Math.min(...zs)
    const axis = width >= depth ? 0 : 1
    const minV = Math.min(...target.map(p => p[axis])); const maxV = Math.max(...target.map(p => p[axis]))
    const middle = (minV + maxV) / 2
    const a = clipPolygon(target, axis, middle, true)
    const b = clipPolygon(target, axis, middle, false)
    if (a.length < 3 || b.length < 3 || areaOf(a) < 0.01 || areaOf(b) < 0.01) break
    pieces.splice(bestIndex, 1, a, b)
  }
  return pieces.slice(0, Math.max(1, unitCount)).filter(poly => poly.length >= 3 && areaOf(poly) > 0.01)
}

function extrudedUnitGeometry(polygon, floorHeight, scale) {
  if (!polygon?.length) return null
  const shape = new THREE.Shape(polygon.map(([x, z]) => new THREE.Vector2(x, z)))
  shape.closePath()
  const depth = Math.max(0.04, floorHeight * 0.78 / scale)
  const geometry = new THREE.ExtrudeGeometry(shape, { depth, bevelEnabled: false, steps: 1 })
  geometry.rotateX(Math.PI / 2)
  geometry.translate(0, depth / 2, 0)
  geometry.scale(scale, scale, scale)
  return geometry
}

function UnitBlock({ model, floor, unitIndex, unitCount, unitAreas = [], floorHeight, scale, selected, buildingCode, parcelUlpin, unitData }) {
  const polygons = useMemo(() => footprintUnitPolygons(model, unitCount), [model, unitCount])
  const polygon = polygons[unitIndex]
  const sourceArea = Number(unitAreas[unitIndex] || 0)
  const areaM2 = sourceArea > 0 ? sourceArea : (polygon ? Math.abs(polygonSignedArea(polygon)) / Math.max(0.0001, scale * scale) : 0)
  const volumeM3 = areaM2 > 0 ? areaM2 * floorHeight : null
  const y = (floor - 0.5) * floorHeight * scale
  const id = unitData?.label || `U${floor}${String(unitIndex + 1).padStart(2, '0')}`
  const verticalId = unitData?.id || `${buildingCode}-F${String(floor).padStart(2, '0')}-${id}`
  const colors = ['#22c55e', '#38bdf8', '#f59e0b', '#a78bfa']
  const geometry = useMemo(() => extrudedUnitGeometry(polygon, floorHeight, scale), [polygon, floorHeight, scale])
  if (!geometry) return null
  const cx = polygon.reduce((sum, p) => sum + p[0], 0) / polygon.length
  const cz = polygon.reduce((sum, p) => sum + p[1], 0) / polygon.length
  return (
    <group position={[0, y, 0]}>
      <mesh geometry={geometry} castShadow receiveShadow>
        <meshStandardMaterial color={colors[unitIndex % colors.length]} transparent opacity={selected ? 0.80 : 0.16} roughness={0.72} metalness={0.02} side={THREE.DoubleSide} />
      </mesh>
      {selected && (
        <Html position={[cx * scale, Math.max(0.14, floorHeight * scale * 0.40), cz * scale]} center distanceFactor={3.4} style={{ pointerEvents: 'none' }}>
          <div style={{ background: 'rgba(15,23,42,0.97)', color: '#fff', border: '1px solid rgba(103,232,249,0.9)', borderRadius: 8, padding: '5px 7px', whiteSpace: 'nowrap', boxShadow: '0 4px 14px rgba(0,0,0,.32)', fontFamily: 'ui-monospace, SFMono-Regular, Menlo, monospace', fontSize: 8.5, lineHeight: 1.25 }}>
            <div style={{ fontWeight: 900, color: '#67e8f9' }}>{id}</div>
            <div style={{ color: '#fbbf24', fontSize: 7.5 }}>PARCEL ULPIN {parcelUlpin}</div>
            {unitData?.name && <div style={{ color: '#cbd5e1', fontSize: 7.2 }}>{unitData.name}</div>}
            <div style={{ color: '#94a3b8', fontSize: 7.2 }}>{areaM2.toFixed(1)} m² {sourceArea > 0 ? 'source area' : 'shape-derived demo area'} • {volumeM3 ? `${volumeM3.toFixed(1)} m³` : 'volume unavailable'}</div>
            <div style={{ color: '#cbd5e1', fontSize: 7.5 }}>{verticalId}</div>
          </div>
        </Html>
      )}
    </group>
  )
}

function DemoFloorUnits({ model, feature, propertyRecord, floors, totalHeight, scale, selectedFloor }) {
  if (!model || floors < 1) return null
  const floorHeight = totalHeight / floors
  const buildingCode = demoBuildingCode(feature)
  const parcelUlpin = demoParcelUlpin(feature)
  return (
    <>
      {Array.from({ length: Math.min(36, floors) }, (_, index) => {
        const floorNumber = index + 1
        const sourceFloor = propertyRecord?.units?.find((u) => Number(u?.floorNumber) === floorNumber && String(u?.type || '').toLowerCase() === 'floor')
        const familyUnits = Array.isArray(sourceFloor?.families) ? sourceFloor.families.slice(0, 4) : []
        const count = familyUnits.length || 4
        const unitData = familyUnits.map((family, familyIndex) => {
          const rawArea = String(family?.area || '')
          const parsed = Number.parseFloat(rawArea.replace(/,/g, ''))
          const areaM2 = Number.isFinite(parsed) ? (/sq\s*ft|sqft|ft²/i.test(rawArea) ? parsed * 0.092903 : parsed) : null
          return {
            label: family?.unit ? `U${family.unit}` : `U${floorNumber}${String(familyIndex + 1).padStart(2, '0')}`,
            name: family?.name || 'Source-linked unit',
            areaM2,
            id: `${buildingCode}-F${String(floorNumber).padStart(2, '0')}-U${String(familyIndex + 1).padStart(2, '0')}`,
          }
        })
        const finalUnitData = unitData.length ? unitData : [null, null, null, null]
        const unitAreas = finalUnitData.map(item => Number(item?.areaM2) || 0)
        return (
          <group key={`units-floor-${index}`}>
            {Array.from({ length: count }, (_, unitIndex) => (
              <UnitBlock
                key={`unit-${floorNumber}-${unitIndex + 1}`}
                model={model}
                floor={floorNumber}
                unitIndex={unitIndex}
                unitCount={count}
                unitData={finalUnitData[unitIndex]}
                unitAreas={unitAreas}
                floorHeight={floorHeight}
                scale={scale}
                selected={floorNumber === selectedFloor}
                buildingCode={buildingCode}
                parcelUlpin={parcelUlpin}
              />
            ))}
          </group>
        )
      })}
    </>
  )
}

function PartModel({ part, parentHeight, parentFloors, scale, verticalOffset = 0, color = '#d5a325' }) {
  const model = useMemo(() => getFootprintModelData(part), [part])
  if (!model) return null
  const partHeight = safeNumber(part.height_m, safeNumber(part.height, 0))
  const partFloors = Math.max(0, Math.round(safeNumber(part.levels, safeNumber(part.num_floors, 0))))
  const totalHeight = partHeight > 0 ? partHeight : partFloors > 0 ? partFloors * 3.2 : parentHeight
  const baseHeight = Math.max(0, safeNumber(part.min_height_m, safeNumber(part.min_height, 0)))
  const top = Math.max(totalHeight + baseHeight, baseHeight + 0.15)
  const center = (baseHeight + top) / 2
  return (
    <group position={[0, verticalOffset, 0]}>
      <FootprintSlab model={model} y={center * scale} thickness={Math.max(0.08, (top - baseHeight) * scale)} scale={scale} color={color} opacity={0.94} />
      {partFloors > 1 && (
        <FloorBands model={model} floors={partFloors} totalHeight={(top - baseHeight)} scale={scale} sourceFloors />
      )}
    </group>
  )
}

function GroundDivider({ model, scale }) {
  const span = Math.max(model?.width || 1, model?.depth || 1) * scale * 0.95
  return (
    <group>
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0, 0]}>
        <planeGeometry args={[Math.max(2.8, span * 3.0), Math.max(2.2, span * 2.2)]} />
        <meshStandardMaterial color="#0f172a" transparent opacity={0.18} roughness={1} />
      </mesh>
      <mesh position={[0, 0.002, 0]}>
        <boxGeometry args={[Math.max(2.8, span * 2.9), 0.022, Math.max(0.028, span * 2.2)]} />
        <meshBasicMaterial color="#67e8f9" transparent opacity={0.65} />
      </mesh>
      <Html position={[Math.max(1.15, span * 1.15), 0.08, 0]} center style={{ pointerEvents: 'none' }}>
        <div style={{ background: 'rgba(8,47,73,.94)', color: '#a5f3fc', border: '1px solid rgba(103,232,249,.7)', borderRadius: 7, padding: '3px 5px', fontSize: 8, fontWeight: 800, whiteSpace: 'nowrap' }}>GROUND • 0 m</div>
      </Html>
    </group>
  )
}

function BasementStack({ model, levels, scale }) {
  if (!model || levels < 1) return null
  const maxLevels = Math.min(6, Math.round(levels))
  const basementHeight = Math.max(0.12, 3.0 * scale)
  return (
    <group>
      {Array.from({ length: maxLevels }, (_, index) => {
        const y = -(index + 0.5) * basementHeight
        return (
          <group key={`basement-${index}`} position={[0, y, 0]}>
            <FootprintSlab model={model} y={0} thickness={basementHeight * 0.72} scale={scale} color="#db2777" opacity={0.28} />
            <Html position={[Math.max(1.1, model.width * scale * 1.0), 0.02, 0]} center style={{ pointerEvents: 'none' }}>
              <div style={{ background: 'rgba(80,7,36,.92)', color: '#f9a8d4', border: '1px solid rgba(244,114,182,.7)', borderRadius: 6, padding: '2px 4px', fontSize: 7, fontWeight: 800 }}>B{index + 1} • SOURCE UNDERGROUND LEVEL</div>
            </Html>
          </group>
        )
      })}
    </group>
  )
}

function VerticalModel({ feature, propertyRecord, selectedFloor }) {
  const model = useMemo(() => getFootprintModelData(feature), [feature])
  const parts = useMemo(() => Array.isArray(feature?.building_parts) ? feature.building_parts : [], [feature])
  const floors = Math.max(0, Math.round(safeNumber(feature?.levels, safeNumber(feature?.num_floors, 0))))
  const undergroundLevels = Math.max(0, Math.round(safeNumber(feature?.levels_underground, safeNumber(feature?.num_floors_underground, 0))))
  const sourceHeight = safeNumber(feature?.height_m, safeNumber(feature?.height, 0))
  const estimatedHeight = safeNumber(feature?.estimated_height_m, 0)
  const visualHeight = safeNumber(feature?.render_height_m, 0)
  const totalHeight = sourceHeight > 0 ? sourceHeight : floors > 0 ? estimatedHeight || visualHeight || floors * 3.2 : visualHeight
  const maxDimension = model ? Math.max(model.width, model.depth, totalHeight || 0.5) : 1
  const scale = Math.min(3.5 / maxDimension, 1)
  const hasVerticalData = sourceHeight > 0 || floors > 0

  if (!model) {
    return (
      <group>
        <mesh position={[0, 0, 0]}>
          <boxGeometry args={[1.8, 0.08, 1.5]} />
          <meshStandardMaterial color="#94a3b8" />
        </mesh>
      </group>
    )
  }

  const floorHeight = floors > 0 ? totalHeight / floors : totalHeight || 0.15
  const colors = floors > 0 && feature.levels != null ? '#e2a928' : '#efb93c'

  return (
    <group>
      <GroundDivider model={model} scale={scale} />
      {hasVerticalData ? (
        <>
          {floors > 0 ? (
            Array.from({ length: Math.min(36, floors) }, (_, index) => (
              <FootprintSlab
                key={`floor-${index}`}
                model={model}
                y={(index * floorHeight + floorHeight / 2) * scale}
                thickness={Math.max(0.10, floorHeight * scale * 0.82)}
                scale={scale}
                color={colors}
                opacity={0.72}
              />
            ))
          ) : (
            <FootprintSlab model={model} y={Math.max(0.08, totalHeight * scale / 2)} thickness={Math.max(0.12, totalHeight * scale)} scale={scale} color="#d5a325" opacity={0.95} />
          )}
          <FloorBands model={model} floors={floors} totalHeight={totalHeight} scale={scale} sourceFloors={feature.levels != null} />
        </>
      ) : (
        <FootprintSlab model={model} y={0.04} thickness={0.08} scale={scale} color="#94a3b8" opacity={0.95} />
      )}

      {undergroundLevels > 0 && <BasementStack model={model} levels={undergroundLevels} scale={scale} />}

      {floors > 0 && (
        <DemoFloorUnits model={model} feature={feature} propertyRecord={propertyRecord} floors={floors} totalHeight={totalHeight} scale={scale} selectedFloor={selectedFloor} />
      )}

      {parts.length > 0 && parts.slice(0, 24).map((part, index) => (
        <PartModel
          key={part.source_id || `${index}`}
          part={part}
          parentHeight={totalHeight}
          parentFloors={floors}
          scale={scale}
          color={index % 2 === 0 ? '#d5a325' : '#c9931f'}
        />
      ))}
    </group>
  )
}

export default function GeographicBuilding3DPreview({ feature, propertyRecord = null }) {
  const [selectedFloor, setSelectedFloor] = useState(1)
  const metrics = useMemo(() => {
    const floors = feature?.levels != null ? Number(feature.levels) : (feature?.num_floors != null ? Number(feature.num_floors) : (feature?.estimated_floors != null ? Number(feature.estimated_floors) : 0))
    const height = feature?.height_m != null ? Number(feature.height_m) : Number(feature?.height || 0)
    const parts = Array.isArray(feature?.building_parts) ? feature.building_parts.length : 0
    return {
      floors: Number.isFinite(floors) && floors > 0 ? Math.round(floors) : 0,
      height: Number.isFinite(height) && height > 0 ? height : (Number.isFinite(Number(feature?.render_height_m)) && Number(feature.render_height_m) > 0 ? Number(feature.render_height_m) : 0),
      undergroundLevels: Number.isFinite(Number(feature?.levels_underground)) && Number(feature.levels_underground) > 0 ? Math.round(Number(feature.levels_underground)) : 0,
      parts,
      sourceHeight: feature?.height_source || feature?.['@height_source'] || null,
      geometryAvailable: Boolean(feature?.geometry),
    }
  }, [feature])

  if (!feature?.geometry) {
    return (
      <section className="rounded-xl border border-slate-300 bg-slate-100 overflow-hidden">
        <div className="px-3 py-2.5 border-b border-slate-200">
          <div className="text-[9px] uppercase tracking-wider font-bold text-slate-500">Selected building • source-shaped 3D</div>
          <div className="text-[10px] text-slate-600 mt-1">Source geometry unavailable. URDHVA does not substitute a generic building shape.</div>
        </div>
        <div className="h-40 flex items-center justify-center px-6 text-center text-[10px] text-slate-500">Geometry is not available from the geographic source for this feature.</div>
      </section>
    )
  }

  return (
    <section className="rounded-xl border border-cyan-200 bg-slate-950 overflow-hidden">
      <div className="px-3 py-2.5 border-b border-slate-800 flex items-center justify-between gap-2">
        <div>
          <div className="text-[9px] uppercase tracking-wider font-bold text-cyan-300">Selected building • source-shaped 3D</div>
          <div className="text-[10px] text-slate-300 mt-0.5">
            {metrics.geometryAvailable ? (metrics.floors > 0 ? `${Math.min(36, metrics.floors)} floors • ${propertyRecord ? 'linked unit volumes where available' : '4 prototype flat volumes/floor'}` : 'Source footprint geometry') : 'Source geometry unavailable'}
            {metrics.undergroundLevels > 0 ? ` • ${Math.min(6, metrics.undergroundLevels)} basement levels` : ''}
            {metrics.parts > 0 ? ` • ${metrics.parts} building parts` : ''}
          </div>
        </div>
        <div className="text-[9px] text-slate-400 text-right leading-tight">
          {metrics.height > 0 ? `${metrics.height.toFixed(1).replace(/\.0$/, '')} m render` : 'Height unavailable'}
          <br />
          {metrics.floors > 0 ? (feature.height_m > 0 && feature.levels != null ? 'Source height • source floors' : feature.height_m == null && feature.levels != null ? 'Source floors • estimated height' : feature.height_m > 0 ? 'Source height • estimated floors' : 'Estimated floors') : 'No floor source'}
        </div>
      </div>
      {metrics.floors > 0 && (
        <div className="px-3 py-2 border-b border-slate-800 bg-slate-900/95">
          <div className="flex items-center justify-between gap-2">
            <div>
              <div className="text-[9px] uppercase tracking-wider font-bold text-cyan-300">Vertical property prototype</div>
              <div className="text-[9px] text-slate-400 mt-0.5">Shape-aware 4-unit prototype partition per floor • synthetic only when unit geometry is unavailable</div>
            </div>
            <div className="text-right">
              <div className="text-[8px] uppercase tracking-wider text-slate-500">Dummy parcel ULPIN</div>
              <div className="text-[9px] font-mono font-bold text-amber-300">{demoParcelUlpin(feature)}</div>
            </div>
          </div>
          <div className="mt-2 flex items-center gap-2">
            <span className="text-[8px] text-slate-500 w-12">Floor</span>
            <input
              aria-label="Select floor"
              type="range"
              min="1"
              max={String(Math.min(36, metrics.floors))}
              value={Math.min(selectedFloor, Math.min(36, metrics.floors))}
              onChange={(e) => setSelectedFloor(Number(e.target.value))}
              className="flex-1 accent-cyan-400"
            />
            <span className="text-[9px] font-mono font-bold text-cyan-200 w-10 text-right">F{String(Math.min(selectedFloor, 36)).padStart(2, '0')}</span>
          </div>
        </div>
      )}
      <div className="h-[360px] w-full">
        <Canvas shadows dpr={[1, 1.5]} gl={{ antialias: true }}>
          <PerspectiveCamera makeDefault position={[3.2, 2.8, 4.6]} fov={40} />
          <ambientLight intensity={1.25} />
          <directionalLight position={[4, 6, 5]} intensity={2.1} castShadow />
          <directionalLight position={[-3, 3, -3]} intensity={0.9} />
          <gridHelper args={[6.2, 20, '#334155', '#1e293b']} />
          <VerticalModel feature={feature || {}} propertyRecord={propertyRecord} selectedFloor={Math.min(selectedFloor, Math.max(1, metrics.floors || 1))} />
          <OrbitControls enablePan={false} minDistance={2.6} maxDistance={7} autoRotate={false} />
        </Canvas>
      </div>
      {metrics.floors > 0 && (
        <div className="px-3 py-2 border-t border-slate-800 bg-slate-900/80">
          <div className="grid grid-cols-2 gap-1.5 max-h-28 overflow-y-auto pr-1">
            {Array.from({ length: Math.min(36, metrics.floors) }, (_, i) => {
              const floor = i + 1
              const buildingCode = demoBuildingCode(feature)
              return (
                <button
                  key={floor}
                  type="button"
                  onClick={() => setSelectedFloor(floor)}
                  className={`text-left rounded-lg border px-2 py-1.5 ${floor === Math.min(selectedFloor, 36) ? 'border-cyan-300 bg-cyan-950/80' : 'border-slate-700 bg-slate-800/80 hover:bg-slate-800'}`}
                >
                  <div className="flex items-center justify-between gap-2">
                    <span className="text-[9px] font-mono font-bold text-slate-100">F{String(floor).padStart(2, '0')}</span>
                    <span className="text-[8px] text-amber-300">{demoParcelUlpin(feature)}</span>
                  </div>
                  <div className="mt-1 grid grid-cols-2 gap-1">
                    {[1, 2, 3, 4].map(unit => (
                      <div key={unit} className="rounded bg-slate-900/80 px-1 py-1 text-[7px] font-mono text-slate-300">
                        U{floor}{String(unit).padStart(2, '0')} · {buildingCode}-F{String(floor).padStart(2, '0')}-U{String(unit).padStart(2, '0')}
                      </div>
                    ))}
                  </div>
                </button>
              )
            })}
          </div>
          <div className="text-[8px] text-slate-500 mt-2 leading-relaxed">Dummy ULPIN is shown only as prototype parcel context. The floor/unit strings are URDHVA demo vertical identifiers and are not official ULPINs.</div>
        </div>
      )}
      <div className="px-3 py-2 border-t border-slate-800 text-[9px] text-slate-400 leading-relaxed">
        The preview uses the selected building's actual source footprint geometry. Floor/unit volumes are clipped to the real footprint shape, so irregular or L-shaped buildings do not receive rectangular cubes outside their source footprint. Source height/floors remain source-backed when available; unit geometry is synthetic unless CAD/BIM/survey geometry is supplied.
      </div>
    </section>
  )
}
