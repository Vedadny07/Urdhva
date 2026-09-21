import React, { useRef } from 'react'
import { useFrame } from '@react-three/fiber'
import { Html } from '@react-three/drei'
import * as THREE from 'three'
import useStore from '../store'

export default function UndergroundFeature({ feature }) {
  const show3DLabels = useStore(state => state.show3DLabels)
  const meshRef = useRef()
  const glowRef = useRef()

  const [x, , z] = feature.position
  const depth = feature.depth
  const radius = feature.radius
  const height = Math.abs(depth)

  const isWell = feature.type === 'well'
  const isSeptic = feature.type === 'septic_tank'
  const isWaterTank = feature.type === 'water_tank'
  const isBunker = feature.type === 'bunker'

  // Much more vivid colors
  const colorMap = {
    well: '#0891b2',
    septic_tank: '#65a30d',
    water_tank: '#2563eb',
    bunker: '#dc2626',
    gas_line: '#ea580c',
    fiber_optic: '#7c3aed',
  }
  const iconMap = {
    well: '🕳️',
    septic_tank: '🚽',
    water_tank: '💧',
    bunker: '🏚️',
    gas_line: '🔥',
    fiber_optic: '🌐',
  }

  const color = colorMap[feature.type] || '#0891b2'
  const icon = iconMap[feature.type] || '⬇️'

  useFrame((state) => {
    if (glowRef.current) {
      const t = state.clock.getElapsedTime()
      glowRef.current.material.opacity = 0.5 + Math.sin(t * 1.5) * 0.2
    }
  })

  return (
    <group position={[x, 0, z]}>
      {/* Solid outer cylinder shell — DARK and visible */}
      <mesh ref={meshRef} position={[0, depth / 2, 0]}>
        <cylinderGeometry args={[radius, radius, height, 24, 1, true]} />
        <meshStandardMaterial
          color={color}
          transparent
          opacity={0.7}
          side={THREE.DoubleSide}
          roughness={0.3}
          metalness={0.2}
          emissive={color}
          emissiveIntensity={0.4}
        />
      </mesh>

      {/* Inner fill — semi-solid for visibility */}
      <mesh position={[0, depth / 2, 0]}>
        <cylinderGeometry args={[radius * 0.95, radius * 0.95, height, 24]} />
        <meshStandardMaterial
          color={color}
          transparent
          opacity={0.35}
          roughness={0.5}
          emissive={color}
          emissiveIntensity={0.2}
        />
      </mesh>

      {/* Bottom cap */}
      <mesh position={[0, depth, 0]} rotation={[-Math.PI / 2, 0, 0]}>
        <circleGeometry args={[radius, 24]} />
        <meshStandardMaterial
          color={color}
          transparent
          opacity={0.8}
          emissive={color}
          emissiveIntensity={0.3}
        />
      </mesh>

      {/* Top rim ring — bright and thick */}
      <mesh ref={glowRef} position={[0, 0.08, 0]} rotation={[-Math.PI / 2, 0, 0]}>
        <ringGeometry args={[radius - 0.2, radius + 0.5, 32]} />
        <meshBasicMaterial color={color} transparent opacity={0.6} />
      </mesh>

      {/* Wireframe outline for extra visibility */}
      <mesh position={[0, depth / 2, 0]}>
        <cylinderGeometry args={[radius + 0.1, radius + 0.1, height, 12, 1, true]} />
        <meshBasicMaterial color={color} wireframe transparent opacity={0.5} />
      </mesh>

      {/* Label */}
      {show3DLabels && (
        <Html position={[0, 2.5, 0]} center distanceFactor={25} zIndexRange={[10, 0]} style={{ pointerEvents: 'none' }}>
          <div style={{
            background: 'rgba(10, 14, 26, 0.95)',
            backdropFilter: 'blur(6px)',
            border: `2px solid ${color}`,
            borderRadius: '10px',
            padding: '6px 14px',
            fontSize: '11px',
            fontWeight: '600',
            color: color,
            whiteSpace: 'nowrap',
            display: 'flex',
            alignItems: 'center',
            gap: '6px',
            boxShadow: `0 0 16px ${color}55`,
          }}>
            {icon} {feature.label}
            {feature.status === 'protected_monument' && (
              <span style={{
                color: '#eab308',
                background: 'rgba(234, 179, 8, 0.15)',
                padding: '1px 6px',
                borderRadius: '4px',
                fontSize: '9px',
                fontWeight: '700',
              }}>⚠ PROTECTED</span>
            )}
          </div>
        </Html>
      )}

      {/* Depth indicator line + label */}
      <mesh position={[radius + 0.8, depth / 2, 0]}>
        <cylinderGeometry args={[0.03, 0.03, height, 4]} />
        <meshBasicMaterial color={color} transparent opacity={0.6} />
      </mesh>
      {show3DLabels && (
        <Html position={[radius + 2.2, depth / 2, 0]} center distanceFactor={25} zIndexRange={[10, 0]} style={{ pointerEvents: 'none' }}>
          <div style={{
            fontSize: '10px',
            color: color,
            fontFamily: 'JetBrains Mono, monospace',
            whiteSpace: 'nowrap',
            fontWeight: '600',
            textShadow: `0 0 8px ${color}88`,
          }}>
            {Math.abs(depth)}m deep
          </div>
        </Html>
      )}
    </group>
  )
}
