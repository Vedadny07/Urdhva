import React, { useRef, useMemo } from 'react'
import { useFrame } from '@react-three/fiber'
import { Html } from '@react-three/drei'
import * as THREE from 'three'
import useStore from '../store'

export default function CandidateRoute({ route, isSelected }) {
  const groupRef = useRef()
  const builderType = useStore((s) => s.builderType)
  
  // Base styling for routes
  const styleConfig = {
    danger: { color: '#ef4444', emissive: '#ef4444' }, // Red for route A
    warning: { color: '#eab308', emissive: '#eab308' }, // Yellow/Orange for route B
    success: { color: '#22c55e', emissive: '#22c55e' } // Green/Cyan for route C
  }
  
  const visual = isSelected 
    ? { color: '#06b6d4', emissive: '#06b6d4' } // Selected is bright Cyan
    : styleConfig[route.style] || { color: '#ffffff', emissive: '#ffffff' }

  // Generate tube geometry for multiple segments
  const segments = useMemo(() => {
    const segs = []
    for (let i = 0; i < route.path.length - 1; i++) {
      const start = new THREE.Vector3(...route.path[i])
      const end = new THREE.Vector3(...route.path[i+1])
      const mid = new THREE.Vector3().addVectors(start, end).multiplyScalar(0.5)
      const dir = new THREE.Vector3().subVectors(end, start)
      const len = dir.length()

      const axis = new THREE.Vector3(0, 1, 0)
      const quaternion = new THREE.Quaternion()
      quaternion.setFromUnitVectors(axis, dir.normalize())
      const euler = new THREE.Euler().setFromQuaternion(quaternion)

      segs.push({
        position: [mid.x, mid.y, mid.z],
        rotation: [euler.x, euler.y, euler.z],
        length: len,
      })
    }
    return segs
  }, [route.path])

  const radius = builderType === 'metro' ? 2.5 : builderType === 'pipeline' ? 0.5 : 1.5

  // Label position on the middle segment
  const labelPos = useMemo(() => {
    const midSegmentIndex = Math.floor(segments.length / 2)
    const pos = segments[midSegmentIndex].position
    return [pos[0], pos[1] + radius + 1.5, pos[2]]
  }, [segments, radius])

  useFrame((state) => {
    if (!groupRef.current) return
    const t = state.clock.getElapsedTime()
    
    // Animate opacity/emissive to look like an active simulation
    const pulse = isSelected ? 0.8 + Math.sin(t * 4) * 0.2 : 0.4 + Math.sin(t * 2) * 0.1
    
    groupRef.current.traverse(child => {
      if (child.isMesh && child.material) {
        if (child.material.name === 'core') {
          child.material.opacity = isSelected ? 0.9 : 0.6
          child.material.emissiveIntensity = isSelected ? pulse : 0.3
        } else if (child.material.name === 'wire') {
          child.material.opacity = isSelected ? 0.6 : 0.2
        }
      }
    })
  })

  return (
    <group ref={groupRef}>
      {segments.map((seg, i) => (
        <group key={i}>
          {/* Core Tube */}
          <mesh position={seg.position} rotation={seg.rotation}>
            <cylinderGeometry args={[radius, radius, seg.length, 16]} />
            <meshStandardMaterial
              name="core"
              color={visual.color}
              transparent
              opacity={0.8}
              roughness={0.2}
              metalness={0.4}
              emissive={visual.emissive}
              emissiveIntensity={0.5}
            />
          </mesh>
          
          {/* Outer Hologram Wireframe */}
          <mesh position={seg.position} rotation={seg.rotation}>
            <cylinderGeometry args={[radius + 0.2, radius + 0.2, seg.length, 12]} />
            <meshBasicMaterial 
              name="wire"
              color={visual.color} 
              wireframe 
              transparent 
              opacity={0.3} 
            />
          </mesh>
        </group>
      ))}

      {/* Joints */}
      {route.path.map((point, i) => (
        <mesh key={i} position={point}>
          <sphereGeometry args={[radius, 16, 16]} />
          <meshStandardMaterial
            name="core"
            color={visual.color}
            transparent
            opacity={0.8}
            emissive={visual.emissive}
            emissiveIntensity={0.5}
          />
        </mesh>
      ))}

      {/* Label */}
      <Html position={labelPos} center zIndexRange={[10, 0]} style={{ pointerEvents: 'none', zIndex: isSelected ? 10 : 1 }}>
        <div style={{
          background: `rgba(10, 14, 26, ${isSelected ? 0.9 : 0.6})`,
          backdropFilter: 'blur(4px)',
          border: `1.5px solid ${visual.color}${isSelected ? 'ff' : '88'}`,
          borderRadius: '6px',
          padding: '4px 10px',
          fontSize: isSelected ? '12px' : '10px',
          fontWeight: isSelected ? '700' : '500',
          color: visual.color,
          whiteSpace: 'nowrap',
          fontFamily: 'JetBrains Mono, monospace',
          boxShadow: isSelected ? `0 0 20px ${visual.color}66` : 'none',
          transition: 'all 0.3s ease',
          opacity: isSelected ? 1 : 0.7
        }}>
          {route.name}
          {!isSelected && ` (${route.clashes.length} conflicts)`}
        </div>
      </Html>
      
      {/* Show Clash Markers for this route if it's selected */}
      {isSelected && route.clashes.map((c, i) => {
        // Approximate clash position based on depth
        // We just drop a marker roughly along the line
        const midY = (c.depthRange[0] + c.depthRange[1]) / 2
        
        return (
          <group key={`clash-${i}`} position={[route.path[0][0], midY, route.path[0][2]]}>
             <Html center zIndexRange={[10, 0]}>
                <div style={{
                  background: 'rgba(239, 68, 68, 0.2)',
                  border: '1px solid #ef4444',
                  borderRadius: '4px',
                  padding: '2px 6px',
                  color: '#ef4444',
                  fontSize: '9px',
                  fontWeight: 'bold',
                  whiteSpace: 'nowrap'
                }}>
                  ⚠ {c.owner || 'Conflict'}
                </div>
             </Html>
          </group>
        )
      })}
    </group>
  )
}
