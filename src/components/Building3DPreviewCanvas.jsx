import React, { useRef, useMemo, useState } from 'react'
import { Canvas, useFrame } from '@react-three/fiber'
import { OrbitControls } from '@react-three/drei'
import * as THREE from 'three'

function ReconstructedLidarPolygonMesh({ 
  floors = [], 
  undergroundParking = 0,
  viewMode = 'reconstructed', // 'reconstructed' | 'points' | 'wireframe'
  pointCloudData = null,
  pointDensity = 1.0,
  pointSize = 0.08
}) {
  const groupRef = useRef()
  const totalFloors = Math.max(1, floors.length)
  const lastFl = floors[floors.length - 1]
  const totalModelHeight = lastFl
    ? ((lastFl.z_height !== undefined ? lastFl.z_height : (floors.length - 1) * 3.1) + (lastFl.slab_thickness || 3.1)) * 0.4
    : totalFloors * 1.25
  const height = totalModelHeight

  // Auto-rotation
  useFrame((state, delta) => {
    if (groupRef.current) {
      groupRef.current.rotation.y += delta * 0.35
    }
  })

  // Per-floor extruded polygon geometry
  const floorGeometries = useMemo(() => {
    return floors.map((f, idx) => {
      const footprint = f.footprint || [
        [-8, -6], [8, -6], [8, 6], [-8, 6], [-8, -6]
      ]
      const rawThickness = f.slab_thickness || 3.1
      const thickness = Math.max(0.2, rawThickness * 0.4)
      const shapePts = footprint.map(([x, y]) => new THREE.Vector2(x * 0.4, y * 0.4))
      const shape = new THREE.Shape(shapePts)
      const geom = new THREE.ExtrudeGeometry(shape, {
        depth: thickness,
        bevelEnabled: false,
      })
      geom.rotateX(Math.PI / 2)
      geom.translate(0, thickness / 2, 0)
      const zBase = f.z_height !== undefined ? f.z_height : idx * 3.1
      const yPos = (zBase + rawThickness / 2) * 0.4
      return {
        floorIndex: f.floor_index !== undefined ? f.floor_index : idx,
        geom,
        yPos,
        thickness,
        isApproximate: f.is_approximate || false,
        footprint
      }
    })
  }, [floors])

  // Realistic High-Density LiDAR Laser Point Cloud Returns with Elevation Gradient
  const lidarPointData = useMemo(() => {
    const SCALE = 0.4

    // If external stream buffer provided (from backend /api/lidar/sample-scan or upload)
    if (pointCloudData && pointCloudData.positions && pointCloudData.positions.length > 0) {
      const rawPos = pointCloudData.positions
      const rawCol = pointCloudData.colors
      const posArray = new Float32Array(rawPos.length)

      for (let i = 0; i < rawPos.length; i += 3) {
        const lx = rawPos[i]
        const ly = rawPos[i + 1]
        const lz = rawPos[i + 2]
        // Map LiDAR coordinate frame (X, Y_depth, Z_elevation) to Three.js (X, Y_up, Z_depth)
        posArray[i] = lx * SCALE
        posArray[i + 1] = lz * SCALE
        posArray[i + 2] = ly * SCALE
      }

      const geom = new THREE.BufferGeometry()
      geom.setAttribute('position', new THREE.BufferAttribute(posArray, 3))
      if (rawCol && rawCol.length === rawPos.length) {
        geom.setAttribute('color', new THREE.BufferAttribute(new Float32Array(rawCol), 3))
      }
      return geom
    }

    const pts = []
    const colors = []
    const ptsPerFloor = Math.round(180 * pointDensity)
    const minY = 0
    const maxY = Math.max(1, totalFloors * 1.5)

    floorGeometries.forEach((fg) => {
      const coords = fg.footprint
      const numV = coords.length
      for (let i = 0; i < ptsPerFloor; i++) {
        const seg = i % Math.max(1, numV - 1)
        const p1 = coords[seg]
        const p2 = coords[seg + 1] || coords[0]
        const frac = (i / ptsPerFloor)
        let px = (p1[0] + (p2[0] - p1[0]) * frac) * 0.4
        let pz = (p1[1] + (p2[1] - p1[1]) * frac) * 0.4
        let py = fg.yPos + (Math.random() * fg.thickness)

        // Realistic LiDAR beam dispersion noise
        px += (Math.random() - 0.5) * 0.08
        pz += (Math.random() - 0.5) * 0.08
        pts.push(px, py, pz)

        // Spectral Elevation Gradient (Blue -> Cyan -> Yellow -> Orange -> Magenta)
        const normY = Math.min(1, Math.max(0, py / maxY))
        const col = new THREE.Color()
        if (normY < 0.25) {
          col.setHSL(0.65 - normY * 0.6, 1.0, 0.55) // Navy to Cyan
        } else if (normY < 0.65) {
          col.setHSL(0.5 - (normY - 0.25) * 0.7, 1.0, 0.55) // Cyan to Yellow/Green
        } else {
          col.setHSL(0.12 - (normY - 0.65) * 0.4, 1.0, 0.55) // Yellow to Red/Magenta
        }
        colors.push(col.r, col.g, col.b)
      }
    })

    const geom = new THREE.BufferGeometry()
    geom.setAttribute('position', new THREE.Float32BufferAttribute(pts, 3))
    geom.setAttribute('color', new THREE.Float32BufferAttribute(colors, 3))
    return geom
  }, [floorGeometries, pointCloudData, pointDensity, totalFloors])

  return (
    <group ref={groupRef} position={[0, -height / 2 + 0.4, 0]}>
      {/* ── 1. LiDAR Laser Point Cloud Returns ── */}
      {lidarPointData && (viewMode === 'points' || viewMode === 'wireframe') && (
        <points geometry={lidarPointData}>
          <pointsMaterial
            size={pointSize}
            vertexColors
            transparent
            opacity={viewMode === 'points' ? 0.95 : 0.6}
            blending={THREE.AdditiveBlending}
          />
        </points>
      )}

      {/* ── 2. Ground Cadastre Base Grid ── */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0, 0]}>
        <planeGeometry args={[16, 16]} />
        <meshBasicMaterial color="#06b6d4" wireframe transparent opacity={0.25} />
      </mesh>

      {/* ── 3. Subterranean Parking & Basements ── */}
      {undergroundParking > 0 && (
        <group position={[0, -0.45 * undergroundParking, 0]}>
          <mesh>
            <boxGeometry args={[7, 0.9 * undergroundParking, 6]} />
            <meshStandardMaterial color="#1e293b" transparent opacity={0.5} roughness={0.7} />
          </mesh>
          <mesh>
            <boxGeometry args={[7.02, 0.9 * undergroundParking + 0.02, 6.02]} />
            <meshBasicMaterial color="#64748b" wireframe transparent opacity={0.4} />
          </mesh>
        </group>
      )}

      {/* ── 4. Synthesized Floor-by-Floor Polygon Meshes ── */}
      {(viewMode === 'reconstructed' || viewMode === 'wireframe') && floorGeometries.map((fg) => {
        const clr = fg.isApproximate ? '#d97706' : '#0891b2'
        const emissive = fg.isApproximate ? '#b45309' : '#0284c7'

        return (
          <group key={`floor-poly-${fg.floorIndex}`} position={[0, fg.yPos, 0]}>
            <mesh geometry={fg.geom}>
              <meshPhysicalMaterial
                color={clr}
                emissive={emissive}
                emissiveIntensity={0.25}
                transparent
                opacity={viewMode === 'wireframe' ? 0.25 : 0.8}
                roughness={0.2}
                metalness={0.7}
              />
            </mesh>

            {/* Edge outlines matching polygon */}
            <lineSegments>
              <edgesGeometry args={[fg.geom]} />
              <lineBasicMaterial color="#38bdf8" transparent opacity={0.6} />
            </lineSegments>
          </group>
        )
      })}

      {/* ── 5. Roof Crown Beacon ── */}
      <group position={[0, height + 0.2, 0]}>
        <mesh>
          <cylinderGeometry args={[0.05, 0.12, 0.6, 8]} />
          <meshStandardMaterial color="#f59e0b" emissive="#d97706" emissiveIntensity={0.8} />
        </mesh>
        <mesh position={[0, 0.35, 0]}>
          <sphereGeometry args={[0.1, 12, 12]} />
          <meshBasicMaterial color="#fbbf24" />
        </mesh>
      </group>
    </group>
  )
}

export default function Building3DPreviewCanvas({ 
  floors = [], 
  undergroundParking = 0,
  pointCloudData = null,
  initialViewMode = 'reconstructed', // 'reconstructed' | 'points' | 'wireframe'
  activeViewMode = null,
  allowControls = true,
  height = 'h-52'
}) {
  const [viewMode, setViewMode] = useState(activeViewMode || initialViewMode)

  React.useEffect(() => {
    if (activeViewMode) {
      setViewMode(activeViewMode)
    }
  }, [activeViewMode])

  const [pointDensity, setPointDensity] = useState(1.0)
  const [pointSize, setPointSize] = useState(0.08)
  const totalFloors = Math.max(1, floors.length)

  const fitBadge = useMemo(() => {
    if (!floors || floors.length === 0) return 'REGULARIZED CAD MESH';
    const hasPrimitive = floors.some(f => f.fit_type && f.fit_type !== 'arbitrary');
    const hasArbitrary = floors.some(f => f.fit_type === 'arbitrary');
    if (hasPrimitive && hasArbitrary) return 'REGULARIZED HYBRID HULL';
    if (hasPrimitive) return 'REGULARIZED PRIMITIVE MESH';
    return 'ARBITRARY POLYGON HULL';
  }, [floors]);

  return (
    <div className={`w-full ${height} rounded-lg overflow-hidden relative bg-gradient-to-b from-slate-950 via-slate-900 to-indigo-950/40 border border-cyan-500/40 shadow-inner`}>
      <Canvas
        camera={{ position: [13, 10, 13], fov: 42 }}
        gl={{ preserveDrawingBuffer: true, powerPreference: 'default' }}
        style={{ width: '100%', height: '100%', background: 'transparent' }}
      >
        <ambientLight intensity={0.7} />
        <directionalLight position={[12, 16, 10]} intensity={1.2} />
        <pointLight position={[-10, 10, -10]} intensity={0.6} color="#38bdf8" />
        <pointLight position={[10, -5, 10]} intensity={0.4} color="#a855f7" />
        
        <ReconstructedLidarPolygonMesh
          floors={floors}
          undergroundParking={Number(undergroundParking) || 0}
          viewMode={viewMode}
          pointCloudData={pointCloudData}
          pointDensity={pointDensity}
          pointSize={pointSize}
        />
        
        <OrbitControls
          enableZoom={true}
          enablePan={false}
          autoRotate={false}
          maxPolarAngle={Math.PI / 2.05}
          minPolarAngle={Math.PI / 8}
        />
      </Canvas>

      {/* Top Left: Mode Selector Tabs */}
      {allowControls && (
        <div className="absolute top-2 left-2 flex items-center gap-1 z-10 pointer-events-auto bg-slate-950/90 p-0.5 rounded-lg border border-slate-700/80 shadow">
          <button
            type="button"
            onClick={() => setViewMode('points')}
            className={`text-[9px] font-mono font-bold px-2 py-0.5 rounded transition-all ${
              viewMode === 'points'
                ? 'bg-cyan-600 text-white shadow-[0_0_10px_rgba(6,182,212,0.4)]'
                : 'text-slate-400 hover:text-cyan-300'
            }`}
          >
            [RAW LiDAR]
          </button>
          <button
            type="button"
            onClick={() => setViewMode('reconstructed')}
            className={`text-[9px] font-mono font-bold px-2 py-0.5 rounded transition-all ${
              viewMode === 'reconstructed'
                ? 'bg-purple-600 text-white shadow-[0_0_10px_rgba(168,85,247,0.4)]'
                : 'text-slate-400 hover:text-purple-300'
            }`}
          >
            [RECONSTRUCTED MODEL]
          </button>
          <button
            type="button"
            onClick={() => setViewMode('wireframe')}
            className={`text-[9px] font-mono px-1.5 py-0.5 rounded transition-all ${
              viewMode === 'wireframe'
                ? 'bg-amber-600/80 text-white'
                : 'text-slate-400 hover:text-amber-300'
            }`}
            title="Wireframe & Cloud Overlay"
          >
            HYBRID
          </button>
        </div>
      )}

      {/* Top Right: Point Density & Size Controls (when Point Cloud is active) */}
      {allowControls && viewMode === 'points' && (
        <div className="absolute top-2 right-2 flex items-center gap-1.5 z-10 pointer-events-auto bg-slate-950/90 px-2 py-0.5 rounded border border-cyan-500/30 text-[9px] font-mono text-cyan-300 shadow">
          <span>Density:</span>
          <button
            type="button"
            onClick={() => setPointDensity(d => d === 1.0 ? 2.0 : (d === 2.0 ? 0.5 : 1.0))}
            className="font-bold underline hover:text-white"
          >
            {pointDensity === 2.0 ? 'High' : (pointDensity === 0.5 ? 'Low' : 'Med')}
          </button>
          <span className="text-slate-600">|</span>
          <span>Size:</span>
          <button
            type="button"
            onClick={() => setPointSize(s => s === 0.08 ? 0.12 : (s === 0.12 ? 0.05 : 0.08))}
            className="font-bold underline hover:text-white"
          >
            {pointSize === 0.12 ? 'L' : (pointSize === 0.05 ? 'S' : 'M')}
          </button>
        </div>
      )}

      {/* Bottom Right: Floor Specs Badge */}
      <div className="absolute bottom-2 right-2 text-[9px] font-mono text-slate-200 bg-slate-950/90 px-2.5 py-0.5 rounded border border-slate-700/80 shadow pointer-events-none flex items-center gap-1.5">
        <span className="text-cyan-400 font-bold">{totalFloors} FLOORS</span>
        <span>•</span>
        <span className="text-purple-300 font-bold">{fitBadge}</span>
        <span>•</span>
        <span>+{(totalFloors * 3.0).toFixed(1)}m</span>
      </div>
    </div>
  )
}
