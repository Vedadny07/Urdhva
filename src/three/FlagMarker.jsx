import React from 'react'
import { Html } from '@react-three/drei'
import useStore from '../store'

export default function FlagMarker({ building }) {
  const isViolation = (
    (building.actualFloors !== undefined && building.approvedFloors !== undefined && building.actualFloors > building.approvedFloors) ||
    (building.actualDepth !== undefined && building.approvedDepth !== undefined && building.actualDepth < building.approvedDepth - 0.05)
  )

  if (!isViolation) return null

  const [bx, , bz] = building.position
  const topY = building.actualFloors * 3 + 2

  return (
    <group position={[bx, topY, bz]}>
      {/* Flag pole */}
      <mesh position={[0, 0, 0]}>
        <cylinderGeometry args={[0.05, 0.05, 3, 6]} />
        <meshBasicMaterial color="#ef4444" />
      </mesh>

      {/* HTML flag */}
      <Html
        position={[0, 2, 0]}
        center
        distanceFactor={35}
        zIndexRange={[10, 0]}
        style={{ pointerEvents: 'none' }}
      >
        <div style={{
          background: 'rgba(239, 68, 68, 0.9)',
          backdropFilter: 'blur(4px)',
          border: '1px solid rgba(239, 68, 68, 0.5)',
          borderRadius: '8px',
          padding: '4px 10px',
          whiteSpace: 'nowrap',
          fontSize: '11px',
          fontWeight: '600',
          color: 'white',
          display: 'flex',
          alignItems: 'center',
          gap: '4px',
          boxShadow: '0 0 20px rgba(239, 68, 68, 0.3)',
          animation: 'float 3s ease-in-out infinite',
        }}>
          🚩 Violation Detected
        </div>
      </Html>

      {/* Glowing ring at base */}
      <mesh position={[0, -1.5, 0]} rotation={[-Math.PI / 2, 0, 0]}>
        <ringGeometry args={[0.5, 0.8, 32]} />
        <meshBasicMaterial color="#ef4444" transparent opacity={0.4} />
      </mesh>
    </group>
  )
}
