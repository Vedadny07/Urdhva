import React, { useRef, useMemo } from 'react'
import { useFrame } from '@react-three/fiber'
import { Html } from '@react-three/drei'
import * as THREE from 'three'
import useStore from '../store'

const TYPE_COLORS = {
  gas_line: '#ea580c',
  utility_line: '#06b6d4',
  fiber_optic: '#7c3aed',
  sewer_line: '#a855f7',
  power_cable: '#eab308',
  metro_tunnel: '#3b82f6',
}

export default function PipelineDraftPreview() {
  const infraDraftPoints = useStore((s) => s.infraDraftPoints)
  const infraDraftDepth = useStore((s) => s.infraDraftDepth)
  const infraDraftRadius = useStore((s) => s.infraDraftRadius)
  const infraDraftType = useStore((s) => s.infraDraftType)
  const infraDrawingActive = useStore((s) => s.infraDrawingActive)
  const corporatorMode = useStore((s) => s.corporatorMode)

  const groupRef = useRef()
  const color = TYPE_COLORS[infraDraftType] || '#ea580c'
  const radius = Number(infraDraftRadius) || 0.5

  // Only render if drawing is active or there are draft points
  const shouldRender = (infraDrawingActive || corporatorMode === 'addInfra') && infraDraftPoints.length > 0

  // Calculate cylinder segments between consecutive subterranean points
  const segments = useMemo(() => {
    if (infraDraftPoints.length < 2) return []
    const segs = []
    for (let i = 0; i < infraDraftPoints.length - 1; i++) {
      const start = new THREE.Vector3(...infraDraftPoints[i])
      const end = new THREE.Vector3(...infraDraftPoints[i + 1])
      const mid = new THREE.Vector3().addVectors(start, end).multiplyScalar(0.5)
      const dir = new THREE.Vector3().subVectors(end, start)
      const len = dir.length()

      if (len > 0.01) {
        const axis = new THREE.Vector3(0, 1, 0)
        const quaternion = new THREE.Quaternion()
        quaternion.setFromUnitVectors(axis, dir.clone().normalize())
        const euler = new THREE.Euler().setFromQuaternion(quaternion)

        segs.push({
          position: [mid.x, mid.y, mid.z],
          rotation: [euler.x, euler.y, euler.z],
          length: len,
          start: infraDraftPoints[i],
          end: infraDraftPoints[i + 1],
        })
      }
    }
    return segs
  }, [infraDraftPoints])

  // Subterranean pulse animation
  useFrame((state) => {
    if (!groupRef.current) return
    const t = state.clock.getElapsedTime()
    const pulseOpacity = 0.7 + Math.sin(t * 4) * 0.25
    groupRef.current.traverse((child) => {
      if (child.isMesh && child.material && child.material.name === 'draft-pipe-mat') {
        child.material.opacity = pulseOpacity
        child.material.emissiveIntensity = 0.5 + Math.sin(t * 4) * 0.3
      }
    })
  })

  if (!shouldRender) return null

  return (
    <group ref={groupRef}>
      {/* ── 1. GROUND LEVEL MARKERS & VERTICAL PLUMB LINES ── */}
      {infraDraftPoints.map((pt, idx) => {
        const [x, y, z] = pt
        const depthHeight = Math.abs(y)

        return (
          <group key={`draft-marker-${idx}`}>
            {/* Ground Ring */}
            <mesh position={[x, 0.05, z]} rotation={[-Math.PI / 2, 0, 0]}>
              <ringGeometry args={[0.8, 1.1, 32]} />
              <meshBasicMaterial color={color} transparent opacity={0.85} side={THREE.DoubleSide} />
            </mesh>

            {/* Inner Ground Disc */}
            <mesh position={[x, 0.04, z]} rotation={[-Math.PI / 2, 0, 0]}>
              <circleGeometry args={[0.7, 32]} />
              <meshBasicMaterial color="#0b1329" transparent opacity={0.8} />
            </mesh>

            {/* Center Ground Pin */}
            <mesh position={[x, 0.1, z]}>
              <sphereGeometry args={[0.2, 16, 16]} />
              <meshBasicMaterial color={color} />
            </mesh>

            {/* Ground Number Badge */}
            <Html position={[x, 1.4, z]} center distanceFactor={28} zIndexRange={[15, 0]} style={{ pointerEvents: 'none' }}>
              <div style={{
                background: 'rgba(15, 23, 42, 0.92)',
                border: `2px solid ${color}`,
                color: '#ffffff',
                borderRadius: '50%',
                width: '26px',
                height: '26px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: '11px',
                fontWeight: 'bold',
                fontFamily: 'monospace',
                boxShadow: `0 0 12px ${color}aa`,
              }}>
                {idx + 1}
              </div>
            </Html>

            {/* Vertical Plumb Line (Surface down to pipeline depth) */}
            {depthHeight > 0.1 && (
              <mesh position={[x, -depthHeight / 2, z]}>
                <cylinderGeometry args={[0.03, 0.03, depthHeight, 8]} />
                <meshBasicMaterial color={color} transparent opacity={0.45} />
              </mesh>
            )}
          </group>
        )
      })}

      {/* ── 2. SUBTERRANEAN PIPELINE JOINTS ── */}
      {infraDraftPoints.map((pt, idx) => (
        <mesh key={`sub-joint-${idx}`} position={pt}>
          <sphereGeometry args={[radius * 1.15, 20, 20]} />
          <meshStandardMaterial
            name="draft-pipe-mat"
            color={color}
            emissive={color}
            emissiveIntensity={0.6}
            transparent
            opacity={0.85}
            roughness={0.2}
            metalness={0.5}
          />
        </mesh>
      ))}

      {/* ── 3. SUBTERRANEAN PIPELINE CYLINDER SEGMENTS ── */}
      {segments.map((seg, idx) => (
        <group key={`draft-seg-${idx}`}>
          {/* Core Pipe Cylinder */}
          <mesh position={seg.position} rotation={seg.rotation}>
            <cylinderGeometry args={[radius, radius, seg.length, 20]} />
            <meshStandardMaterial
              name="draft-pipe-mat"
              color={color}
              emissive={color}
              emissiveIntensity={0.6}
              transparent
              opacity={0.85}
              roughness={0.2}
              metalness={0.5}
            />
          </mesh>

          {/* Outer Hologram Laser Ring / Wireframe */}
          <mesh position={seg.position} rotation={seg.rotation}>
            <cylinderGeometry args={[radius + 0.12, radius + 0.12, seg.length, 12]} />
            <meshBasicMaterial color={color} wireframe transparent opacity={0.4} />
          </mesh>

          {/* Segment distance label */}
          <Html
            position={[seg.position[0], seg.position[1] + radius + 0.8, seg.position[2]]}
            center
            distanceFactor={30}
            zIndexRange={[12, 0]}
            style={{ pointerEvents: 'none' }}
          >
            <div style={{
              background: 'rgba(15, 23, 42, 0.85)',
              border: `1px solid ${color}88`,
              borderRadius: '4px',
              padding: '2px 6px',
              color: '#f1f5f9',
              fontSize: '9px',
              fontFamily: 'monospace',
              whiteSpace: 'nowrap',
            }}>
              {seg.length.toFixed(1)}m (P{idx + 1}→P{idx + 2})
            </div>
          </Html>
        </group>
      ))}
    </group>
  )
}
