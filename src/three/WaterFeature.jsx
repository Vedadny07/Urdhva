import React, { useMemo } from 'react'
import * as THREE from 'three'
import { Html } from '@react-three/drei'
import useStore from '../store'

// Renders OSM-sourced rivers/streams (as a flat ribbon following the
// centerline) and water polygons — lakes, reservoirs, or a riverbank
// mapped as a closed way/relation (as a flat filled shape) — so a river
// visible on the 2D OSM picker actually shows up in the generated 3D scene.

function RiverRibbon({ feature, undergroundMode }) {
  const { points, width = 12, name } = feature

  const { positions, midpoint } = useMemo(() => {
    if (!points || points.length < 2) return { positions: [], midpoint: null }

    const halfW = width / 2
    const verts = []
    for (let i = 0; i < points.length - 1; i++) {
      const [x1, z1] = points[i]
      const [x2, z2] = points[i + 1]
      const dx = x2 - x1
      const dz = z2 - z1
      const len = Math.hypot(dx, dz)
      if (len < 0.01) continue
      // Perpendicular offset for ribbon width
      const nx = (-dz / len) * halfW
      const nz = (dx / len) * halfW

      // Two triangles forming a quad segment
      verts.push(
        x1 + nx, 0, z1 + nz,
        x1 - nx, 0, z1 - nz,
        x2 + nx, 0, z2 + nz,

        x1 - nx, 0, z1 - nz,
        x2 - nx, 0, z2 - nz,
        x2 + nx, 0, z2 + nz,
      )
    }

    const mid = points[Math.floor(points.length / 2)]
    return { positions: verts, midpoint: mid }
  }, [points, width])

  const geometry = useMemo(() => {
    if (positions.length === 0) return null
    const geo = new THREE.BufferGeometry()
    geo.setAttribute('position', new THREE.Float32BufferAttribute(positions, 3))
    geo.computeVertexNormals()
    return geo
  }, [positions])

  if (!geometry) return null

  return (
    <group>
      <mesh geometry={geometry} position={[0, 0.02, 0]} receiveShadow>
        <meshStandardMaterial
          color="#1d6fa5"
          roughness={0.25}
          metalness={0.35}
          transparent={undergroundMode}
          opacity={undergroundMode ? 0.15 : 0.92}
          depthWrite={!undergroundMode}
        />
      </mesh>
      {!undergroundMode && midpoint && name && (
        <Html position={[midpoint[0], 1.0, midpoint[1]]} center distanceFactor={140} style={{ pointerEvents: 'none' }}>
          <div className="px-2.5 py-1 rounded bg-slate-900/90 border border-sky-600/60 shadow text-[13px] font-mono text-sky-200 font-bold whitespace-nowrap flex items-center gap-1.5">
            <span>🌊</span>
            <span>{name}</span>
          </div>
        </Html>
      )}
    </group>
  )
}

function WaterPolygon({ feature }) {
  const { points, name } = feature

  const { geometry, centroid } = useMemo(() => {
    if (!points || points.length < 3) return { geometry: null, centroid: null }
    const shape = new THREE.Shape()
    shape.moveTo(points[0][0], points[0][1])
    for (let i = 1; i < points.length; i++) {
      shape.lineTo(points[i][0], points[i][1])
    }
    shape.closePath()
    const geo = new THREE.ShapeGeometry(shape)
    // ShapeGeometry is built in XY; rotate to lie flat on XZ ground plane
    geo.rotateX(-Math.PI / 2)

    let cx = 0, cz = 0
    points.forEach(([x, z]) => { cx += x; cz += z })
    cx /= points.length
    cz /= points.length

    return { geometry: geo, centroid: [cx, cz] }
  }, [points])

  if (!geometry) return null

  return (
    <group>
      <mesh geometry={geometry} position={[0, 0.015, 0]} receiveShadow>
        <meshStandardMaterial color="#1d6fa5" roughness={0.25} metalness={0.35} opacity={0.92} transparent />
      </mesh>
      {centroid && name && (
        <Html position={[centroid[0], 1.0, centroid[1]]} center distanceFactor={140} style={{ pointerEvents: 'none' }}>
          <div className="px-2.5 py-1 rounded bg-slate-900/90 border border-sky-600/60 shadow text-[13px] font-mono text-sky-200 font-bold whitespace-nowrap flex items-center gap-1.5">
            <span>🌊</span>
            <span>{name}</span>
          </div>
        </Html>
      )}
    </group>
  )
}

export default function WaterFeatures() {
  const waterFeatures = useStore((s) => s.waterFeatures) || []
  const undergroundMode = useStore((s) => s.undergroundMode)

  if (!waterFeatures.length) return null

  return (
    <group visible={!undergroundMode}>
      {waterFeatures.map((feature) =>
        feature.kind === 'polygon'
          ? <WaterPolygon key={feature.id} feature={feature} />
          : <RiverRibbon key={feature.id} feature={feature} undergroundMode={undergroundMode} />
      )}
    </group>
  )
}
