import React, { useRef } from 'react'
import { useFrame } from '@react-three/fiber'
import { Html } from '@react-three/drei'
import useStore from '../store'

export default function WaypointMarker({ waypoint }) {
  const ringRef = useRef()
  const builderMode = useStore((s) => s.builderMode)
  const builderFrom = useStore((s) => s.builderFrom)
  const builderTo = useStore((s) => s.builderTo)
  const setBuilderFrom = useStore((s) => s.setBuilderFrom)
  const setBuilderTo = useStore((s) => s.setBuilderTo)

  const isFromSelected = builderFrom === waypoint.id
  const isToSelected = builderTo === waypoint.id
  const isSelected = isFromSelected || isToSelected

  useFrame((state) => {
    if (ringRef.current) {
      ringRef.current.rotation.z = state.clock.getElapsedTime() * 0.5
    }
  })

  const handleClick = (e) => {
    e.stopPropagation()
    if (!builderMode) return

    if (!builderFrom) {
      setBuilderFrom(waypoint.id)
    } else if (!builderTo && builderFrom !== waypoint.id) {
      setBuilderTo(waypoint.id)
    } else if (isFromSelected) {
      setBuilderFrom(null)
    } else if (isToSelected) {
      setBuilderTo(null)
    }
  }

  const [x, y, z] = waypoint.position

  const color = isFromSelected ? '#22c55e' : isToSelected ? '#ef4444' : '#22d3ee'

  return (
    <group position={[x, 0.1, z]} onClick={handleClick}>
      {/* Outer ring */}
      <mesh ref={ringRef} rotation={[-Math.PI / 2, 0, 0]}>
        <ringGeometry args={[1.8, 2.2, 6]} />
        <meshBasicMaterial
          color={color}
          transparent
          opacity={builderMode ? 0.8 : 0.3}
        />
      </mesh>

      {/* Inner disc */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.05, 0]}>
        <circleGeometry args={[1.2, 32]} />
        <meshBasicMaterial
          color={isSelected ? color : '#0f1629'}
          transparent
          opacity={0.9}
        />
      </mesh>

      {/* Center dot */}
      <mesh position={[0, 0.15, 0]}>
        <sphereGeometry args={[0.3, 16, 16]} />
        <meshBasicMaterial color={color} />
      </mesh>

      {/* Vertical beam when in builder mode */}
      {builderMode && (
        <mesh position={[0, 4, 0]}>
          <cylinderGeometry args={[0.05, 0.05, 8, 8]} />
          <meshBasicMaterial color={color} transparent opacity={0.3} />
        </mesh>
      )}

      {/* Label */}
      <Html position={[0, 2.5, 0]} center distanceFactor={25} zIndexRange={[10, 0]} style={{ pointerEvents: 'none' }}>
        <div style={{
          background: isSelected ? `${color}33` : 'rgba(15, 22, 41, 0.85)',
          backdropFilter: 'blur(4px)',
          border: `1.5px solid ${color}${isSelected ? 'aa' : '44'}`,
          borderRadius: '50%',
          width: '32px',
          height: '32px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          fontSize: '14px',
          fontWeight: '700',
          color: color,
          fontFamily: 'JetBrains Mono, monospace',
          boxShadow: isSelected ? `0 0 20px ${color}44` : 'none',
          transition: 'all 0.3s ease',
        }}>
          {waypoint.id}
        </div>
      </Html>

      {/* From/To label when selected */}
      {isSelected && (
        <Html position={[0, 4, 0]} center distanceFactor={25} zIndexRange={[10, 0]} style={{ pointerEvents: 'none' }}>
          <div style={{
            fontSize: '10px',
            fontWeight: '600',
            color: color,
            textTransform: 'uppercase',
            letterSpacing: '1px',
          }}>
            {isFromSelected ? 'FROM' : 'TO'}
          </div>
        </Html>
      )}
    </group>
  )
}
