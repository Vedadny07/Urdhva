import React, { useMemo } from 'react'
import useStore from '../store'

// Deterministic pseudo-random generator (so tree placement is stable across
// re-renders instead of jittering every time the component mounts).
function seededRandom(seed) {
  let s = seed % 2147483647
  if (s <= 0) s += 2147483646
  return () => {
    s = (s * 16807) % 2147483647
    return (s - 1) / 2147483646
  }
}

// Shortest distance from point (px,pz) to the line segment (x1,z1)-(x2,z2).
function distanceToSegment(px, pz, x1, z1, x2, z2) {
  const dx = x2 - x1
  const dz = z2 - z1
  const lenSq = dx * dx + dz * dz
  let t = lenSq > 0 ? ((px - x1) * dx + (pz - z1) * dz) / lenSq : 0
  t = Math.max(0, Math.min(1, t))
  const cx = x1 + t * dx
  const cz = z1 + t * dz
  return Math.hypot(px - cx, pz - cz)
}

// A simple low-poly conifer-style tree: brown trunk + two stacked dark-green
// foliage cones, matching the "parkland / greenery = dark green" legend.
function Tree({ position, scale = 1 }) {
  return (
    <group position={position} scale={scale}>
      <mesh position={[0, 0.55, 0]} castShadow>
        <cylinderGeometry args={[0.11, 0.15, 1.1, 6]} />
        <meshStandardMaterial color="#5c4630" roughness={0.95} />
      </mesh>
      <mesh position={[0, 1.5, 0]} castShadow>
        <coneGeometry args={[0.85, 1.7, 8]} />
        <meshStandardMaterial color="#1f4d2e" roughness={0.9} />
      </mesh>
      <mesh position={[0, 2.35, 0]} castShadow>
        <coneGeometry args={[0.6, 1.2, 8]} />
        <meshStandardMaterial color="#2f6b3f" roughness={0.9} />
      </mesh>
    </group>
  )
}

// Point-in-polygon test (ray casting), used to keep trees out of water
// polygon footprints (lakes / riverbanks).
function pointInPolygon(px, pz, poly) {
  let inside = false
  for (let i = 0, j = poly.length - 1; i < poly.length; j = i++) {
    const [xi, zi] = poly[i]
    const [xj, zj] = poly[j]
    const intersect = ((zi > pz) !== (zj > pz)) &&
      (px < ((xj - xi) * (pz - zi)) / (zj - zi) + xi)
    if (intersect) inside = !inside
  }
  return inside
}

export default function Vegetation() {
  const buildings = useStore((s) => s.buildings)
  const roads = useStore((s) => s.roads)
  const waterFeatures = useStore((s) => s.waterFeatures)
  const undergroundMode = useStore((s) => s.undergroundMode)
  const xrayMode = useStore((s) => s.xrayMode)

  const trees = useMemo(() => {
    const rand = seededRandom(1337)
    const result = []

    const AREA = 100          // half-extent of the scatter area (matches typical building spread)
    const GRID = 13           // spacing between candidate cells
    const KEEP_PROBABILITY = 0.5  // fraction of grid cells that get a candidate tree (clustered look)
    const BUILDING_CLEARANCE = 6
    const ROAD_CLEARANCE = 4.5
    const WATER_CLEARANCE = 3

    const buildingBoxes = (buildings || []).map((b) => {
      const pos = b.position || [0, 0, 0]
      const footprint = b.footprint || [10, 10]
      return {
        bx: pos[0],
        bz: pos[2],
        halfW: (footprint[0] || 10) / 2 + BUILDING_CLEARANCE,
        halfL: (footprint[1] || 10) / 2 + BUILDING_CLEARANCE,
      }
    })

    const roadList = roads || []
    const waterLines = (waterFeatures || []).filter((w) => w.kind !== 'polygon')
    const waterPolys = (waterFeatures || []).filter((w) => w.kind === 'polygon')

    for (let gx = -AREA; gx <= AREA; gx += GRID) {
      for (let gz = -AREA; gz <= AREA; gz += GRID) {
        if (rand() > KEEP_PROBABILITY) continue

        const jx = gx + (rand() - 0.5) * GRID * 0.8
        const jz = gz + (rand() - 0.5) * GRID * 0.8

        const blockedByBuilding = buildingBoxes.some(
          (b) => Math.abs(jx - b.bx) < b.halfW && Math.abs(jz - b.bz) < b.halfL
        )
        if (blockedByBuilding) continue

        const blockedByRoad = roadList.some((r) => {
          const pts = r.points || []
          const clearance = (r.width || 10) / 2 + ROAD_CLEARANCE
          for (let i = 0; i < pts.length - 1; i++) {
            if (distanceToSegment(jx, jz, pts[i][0], pts[i][1], pts[i + 1][0], pts[i + 1][1]) < clearance) return true
          }
          return false
        })
        if (blockedByRoad) continue

        const blockedByWaterLine = waterLines.some((w) => {
          const pts = w.points || []
          const clearance = (w.width || 10) / 2 + WATER_CLEARANCE
          for (let i = 0; i < pts.length - 1; i++) {
            if (distanceToSegment(jx, jz, pts[i][0], pts[i][1], pts[i + 1][0], pts[i + 1][1]) < clearance) return true
          }
          return false
        })
        if (blockedByWaterLine) continue

        const blockedByWaterPoly = waterPolys.some((w) => pointInPolygon(jx, jz, w.points || []))
        if (blockedByWaterPoly) continue

        result.push({ x: jx, z: jz, scale: 0.75 + rand() * 0.55 })
      }
    }

    return result
  }, [buildings, roads, waterFeatures])

  // Keep X-Ray mode uncluttered, and fade trees out (but don't unmount them,
  // to avoid recomputing on every underground toggle) when underground.
  if (xrayMode) return null

  return (
    <group visible={!undergroundMode}>
      {trees.map((t, i) => (
        <Tree key={i} position={[t.x, 0, t.z]} scale={t.scale} />
      ))}
    </group>
  )
}
