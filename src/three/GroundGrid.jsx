import React from 'react'
import { Grid } from '@react-three/drei'
import useStore from '../store'

export default function GroundGrid({ onClick, onPointerMove, onPointerOver, onPointerOut, onContextMenu, onPointerDown }) {
  const undergroundMode = useStore((s) => s.undergroundMode)

  return (
    <group>
      {/* Surface grid */}
      <Grid
        args={[2000, 2000]}
        position={[0, -0.01, 0]}
        cellSize={2}
        cellThickness={undergroundMode ? 0.3 : 0.6}
        cellColor={undergroundMode ? '#0d2847' : '#cbd5e1'}
        sectionSize={10}
        sectionThickness={undergroundMode ? 0.6 : 1.1}
        sectionColor={undergroundMode ? '#0284c7' : '#94a3b8'}
        fadeDistance={undergroundMode ? 450 : 1600}
        fadeStrength={1.5}
        followCamera={false}
        infiniteGrid={false}
      />

      {/* Surface ground plane for raycasting and interaction */}
      <mesh
        rotation={[-Math.PI / 2, 0, 0]}
        position={[0, -0.02, 0]}
        receiveShadow
        onClick={onClick}
        onPointerMove={onPointerMove}
        onPointerOver={onPointerOver}
        onPointerOut={onPointerOut}
        onContextMenu={onContextMenu}
        onPointerDown={onPointerDown}
      >
        <planeGeometry args={[2400, 2400]} />
        <meshStandardMaterial
          color={undergroundMode ? "#0a0e1a" : "#f1f5f9"}
          transparent
          opacity={undergroundMode ? 0.12 : 0.95}
          depthWrite={!undergroundMode}
        />
      </mesh>

      {/* Subterranean Depth Grid Layers when Underground Mode is Active */}
      {undergroundMode && (
        <group>
          {[-4, -8, -12, -16].map((depth) => (
            <group key={`depth-grid-${depth}`} position={[0, depth, 0]}>
              <Grid
                args={[200, 200]}
                cellSize={4}
                cellThickness={0.35}
                cellColor="#082f49"
                sectionSize={20}
                sectionThickness={0.7}
                sectionColor="#06b6d4"
                fadeDistance={150}
                fadeStrength={1.6}
                followCamera={false}
                infiniteGrid={false}
              />
              {/* Depth perimeter ring */}
              <mesh rotation={[-Math.PI / 2, 0, 0]}>
                <ringGeometry args={[85, 85.6, 64]} />
                <meshBasicMaterial color="#06b6d4" transparent opacity={0.3} />
              </mesh>
            </group>
          ))}
        </group>
      )}
    </group>
  )
}
