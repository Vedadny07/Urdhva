import React, { useRef, useMemo } from 'react'
import { useFrame } from '@react-three/fiber'
import { Html } from '@react-three/drei'
import * as THREE from 'three'
import useStore from '../store'

export default function InfrastructureLine({ infra, isUserCreated }) {
  const groupRef = useRef()
  const selectInfrastructure = useStore((s) => s.selectInfrastructure)
  const selectedInfra = useStore((s) => s.selectedInfra)
  const show3DLabels = useStore((s) => s.show3DLabels)
  const isSelected = selectedInfra === infra.id
  const isClashing = infra.clashing
  const radius = Number(infra.radius) || 0.5

  // Compute tube geometry for each consecutive pair of path points
  const segments = useMemo(() => {
    if (!infra.path || infra.path.length < 2) return []
    const segs = []
    for (let i = 0; i < infra.path.length - 1; i++) {
      const start = new THREE.Vector3(...infra.path[i])
      const end = new THREE.Vector3(...infra.path[i + 1])
      const mid = new THREE.Vector3().addVectors(start, end).multiplyScalar(0.5)
      const dir = new THREE.Vector3().subVectors(end, start)
      const len = dir.length()

      if (len > 0.001) {
        const axis = new THREE.Vector3(0, 1, 0)
        const quaternion = new THREE.Quaternion()
        quaternion.setFromUnitVectors(axis, dir.clone().normalize())
        const euler = new THREE.Euler().setFromQuaternion(quaternion)

        segs.push({
          position: [mid.x, mid.y, mid.z],
          rotation: [euler.x, euler.y, euler.z],
          length: len,
        })
      }
    }
    return segs
  }, [infra.path])

  // Label position on the middle segment
  const labelPos = useMemo(() => {
    if (segments.length === 0) return [0, 0, 0]
    const midIdx = Math.floor(segments.length / 2)
    const midSeg = segments[midIdx]
    return [midSeg.position[0], midSeg.position[1] + radius + 1.5, midSeg.position[2]]
  }, [segments, radius])

  const handleClick = (e) => {
    e.stopPropagation()
    selectInfrastructure(infra.id)
  }

  // Glow pulse when selected
  useFrame((state) => {
    if (!groupRef.current) return
    if (isSelected || isClashing) {
      const t = state.clock.getElapsedTime()
      const pulseOpacity = 0.4 + Math.sin(t * 3) * 0.2
      const pulseEmissive = isSelected ? 0.6 + Math.sin(t * 3) * 0.3 : 0.3
      groupRef.current.traverse((child) => {
        if (child.isMesh && child.material && child.material.name === 'core-material') {
          child.material.opacity = pulseOpacity
          child.material.emissiveIntensity = pulseEmissive
        }
      })
    }
  })

  const typeColorMap = {
    gas_line: '#ea580c',
    metro_tunnel: '#3b82f6',
    utility_line: '#06b6d4',
    fiber_optic: '#7c3aed',
    sewer_line: '#a855f7',
    power_cable: '#eab308'
  }

  const color = isClashing 
    ? '#ef4444' 
    : (infra.color || typeColorMap[infra.type] || '#ea580c')

  if (segments.length === 0) return null

  return (
    <group ref={groupRef}>
      {/* Segments: Cylinders connecting consecutive points */}
      {segments.map((seg, i) => (
        <group key={`seg-${i}`}>
          {/* Main tube */}
          <mesh
            position={seg.position}
            rotation={seg.rotation}
            onClick={handleClick}
            onPointerOver={() => { document.body.style.cursor = 'pointer' }}
            onPointerOut={() => { document.body.style.cursor = 'auto' }}
          >
            <cylinderGeometry args={[radius, radius, seg.length, 16]} />
            <meshStandardMaterial
              name="core-material"
              color={color}
              transparent
              opacity={isSelected ? 0.95 : 0.85}
              roughness={0.2}
              metalness={0.4}
              emissive={color}
              emissiveIntensity={isSelected ? 0.5 : 0.25}
              side={THREE.DoubleSide}
            />
          </mesh>

          {/* Outer wireframe shell for visual clarity */}
          <mesh position={seg.position} rotation={seg.rotation}>
            <cylinderGeometry args={[radius + 0.08, radius + 0.08, seg.length, 16]} />
            <meshBasicMaterial color={color} wireframe transparent opacity={0.4} />
          </mesh>

          {/* Dashed outline for user-created */}
          {isUserCreated && (
            <mesh position={seg.position} rotation={seg.rotation}>
              <cylinderGeometry args={[radius + 0.15, radius + 0.15, seg.length, 16]} />
              <meshBasicMaterial color={color} wireframe transparent opacity={0.25} />
            </mesh>
          )}
        </group>
      ))}

      {/* Elbow joints / Vertices at every point in the path */}
      {infra.path.map((point, i) => (
        <mesh key={`joint-${i}`} position={point} onClick={handleClick}>
          <sphereGeometry args={[radius, 16, 16]} />
          <meshStandardMaterial
            name="core-material"
            color={color}
            transparent
            opacity={isSelected ? 0.95 : 0.85}
            roughness={0.2}
            metalness={0.4}
            emissive={color}
            emissiveIntensity={isSelected ? 0.5 : 0.25}
          />
        </mesh>
      ))}

      {/* Floating 3D Label */}
      {show3DLabels && (
        <Html position={labelPos} center distanceFactor={25} zIndexRange={[10, 0]} style={{ pointerEvents: 'none' }}>
          <div style={{
            background: isClashing ? 'rgba(239, 68, 68, 0.25)' : `rgba(15, 23, 42, 0.85)`,
            backdropFilter: 'blur(8px)',
            border: `1.5px solid ${color}${isSelected ? 'ff' : '66'}`,
            borderRadius: '6px',
            padding: '4px 10px',
            fontSize: '11px',
            fontWeight: '600',
            color: color,
            whiteSpace: 'nowrap',
            fontFamily: 'JetBrains Mono, monospace',
            display: 'flex',
            alignItems: 'center',
            gap: '5px',
            boxShadow: isSelected ? `0 0 15px ${color}66` : 'none',
          }}>
            {isUserCreated && (
              <span style={{ 
                fontSize: '8px', 
                background: `${color}33`, 
                padding: '1px 4px', 
                borderRadius: '3px',
                border: `1px solid ${color}66` 
              }}>
                CUSTOM
              </span>
            )}
            <span>{infra.label}</span>
            {infra.path.length > 2 && (
              <span style={{ fontSize: '9px', opacity: 0.8 }}>({infra.path.length} pts)</span>
            )}
            {isClashing && <span style={{ color: '#ef4444' }}>⚠️ CLASH</span>}
          </div>
        </Html>
      )}
    </group>
  )
}
