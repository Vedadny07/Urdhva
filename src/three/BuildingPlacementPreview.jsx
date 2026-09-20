import React, { useRef, useMemo } from 'react'
import { useFrame } from '@react-three/fiber'
import { Html } from '@react-three/drei'
import * as THREE from 'three'
import useStore from '../store'
import { getShapeFootprint } from '../utils/shapeFootprint'

export default function BuildingPlacementPreview() {
  const placingBuilding = useStore((s) => s.placingBuilding)
  const groupRef = useRef()

  const model = placingBuilding?.model || null
  const position = placingBuilding?.position || [15, 15]
  const isValid = placingBuilding?.isValid ?? true

  const [posX, posZ] = position
  const color = isValid ? '#06b6d4' : '#ef4444'
  const emissiveColor = isValid ? '#0891b2' : '#b91c1c'

  const isLidar = model?.sourceType === 'LiDAR' || model?.isLidarAsset || Boolean(model?.pointCount)

  // 1. Model floors array with footprints
  const modelFloors = useMemo(() => {
    if (model?.floors && Array.isArray(model.floors) && model.floors.length > 0) {
      return model.floors
    }

    const numF = Math.max(1, Number(model?.floorsDetected || model?.floors) || 6)
    const w = Number(model?.width) || 16
    const l = Number(model?.length) || 14
    const shape = model?.shape || 'rectangle'
    const shapeFp = getShapeFootprint(shape, w, l)

    const list = []
    for (let f = 0; f < numF; f++) {
      list.push({
        floor_index: f,
        z_height: f * 3.2,
        slab_thickness: 3.2,
        footprint: shapeFp,
        is_approximate: false,
        fit_type: shape
      })
    }
    return list
  }, [model])

  // 2. Extruded polygon geometry per floor with clean vertical stacking (y = 0 base)
  const floorGhostMeshes = useMemo(() => {
    return modelFloors.map((f, idx) => {
      const footprint = f.footprint || [
        [-8, -7], [8, -7], [8, 7], [-8, 7], [-8, -7]
      ]
      const thickness = Math.max(0.2, (f.slab_thickness || 3.2) - 0.08)
      const shapePts = footprint.map(([x, y]) => new THREE.Vector2(x, y))
      const shape = new THREE.Shape(shapePts)
      const geom = new THREE.ExtrudeGeometry(shape, {
        depth: thickness,
        bevelEnabled: false,
      })
      geom.rotateX(Math.PI / 2)
      geom.translate(0, thickness / 2, 0)
      const y = (f.z_height !== undefined ? f.z_height : idx * 3.2) + thickness / 2

      const xs = footprint.map(p => p[0])
      const ys = footprint.map(p => p[1])
      const minX = Math.min(...xs)
      const maxX = Math.max(...xs)
      const minY = Math.min(...ys)
      const maxY = Math.max(...ys)
      const spanX = maxX - minX
      const spanY = maxY - minY

      const isTop = idx === modelFloors.length - 1 && modelFloors.length >= 6
      const isPodium = idx < Math.floor(modelFloors.length * 0.5)
      const isSetbackTower = !isPodium && !isTop

      let tierColor = color
      let tierEmissive = emissiveColor
      let slabOpacity = 0.72

      if (isLidar) {
        if (isPodium) {
          tierColor = isValid ? '#0284c7' : '#ef4444'
          tierEmissive = isValid ? '#0369a1' : '#b91c1c'
          slabOpacity = 0.75
        } else if (isSetbackTower) {
          tierColor = isValid ? '#06b6d4' : '#ef4444'
          tierEmissive = isValid ? '#0891b2' : '#b91c1c'
          slabOpacity = 0.82
        } else if (isTop) {
          tierColor = isValid ? '#f59e0b' : '#ef4444'
          tierEmissive = isValid ? '#d97706' : '#b91c1c'
          slabOpacity = 0.90
        }
      }

      return {
        geom,
        y,
        thickness,
        spanX,
        spanY,
        radius: Math.min(spanX, spanY) / 2,
        footprint,
        isPodium,
        isSetbackTower,
        isTop,
        tierColor,
        tierEmissive,
        slabOpacity
      }
    })
  }, [modelFloors, color, emissiveColor, isValid, isLidar])

  // 3. Realistic LiDAR Point Cloud Laser Simulation
  const laserPointData = useMemo(() => {
    if (!isLidar) return null

    if (model?.pointCloudData?.positions && model.pointCloudData.positions.length > 0) {
      const rawPos = model.pointCloudData.positions
      const rawCol = model.pointCloudData.colors
      const posArray = new Float32Array(rawPos.length)
      for (let i = 0; i < rawPos.length; i += 3) {
        posArray[i] = rawPos[i]
        posArray[i + 1] = rawPos[i + 1]
        posArray[i + 2] = rawPos[i + 2]
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
    const totalFloors = floorGhostMeshes.length
    const maxY = Math.max(1, totalFloors * 3.2)

    floorGhostMeshes.forEach((fg) => {
      const coords = fg.footprint
      const numV = coords.length
      const ptsPerFloor = 140

      for (let i = 0; i < ptsPerFloor; i++) {
        const seg = i % Math.max(1, numV - 1)
        const p1 = coords[seg]
        const p2 = coords[seg + 1] || coords[0]
        const frac = i / ptsPerFloor
        let px = p1[0] + (p2[0] - p1[0]) * frac
        let pz = p1[1] + (p2[1] - p1[1]) * frac
        let py = fg.y + Math.random() * fg.thickness

        px += (Math.random() - 0.5) * 0.12
        pz += (Math.random() - 0.5) * 0.12
        pts.push(px, py, pz)

        const normY = Math.min(1, Math.max(0, py / maxY))
        const col = new THREE.Color()
        if (normY < 0.3) {
          col.setHSL(0.65 - normY * 0.5, 1.0, 0.55)
        } else if (normY < 0.7) {
          col.setHSL(0.5 - (normY - 0.3) * 0.7, 1.0, 0.55)
        } else {
          col.setHSL(0.12 - (normY - 0.7) * 0.4, 1.0, 0.55)
        }
        colors.push(col.r, col.g, col.b)
      }
    })

    const geom = new THREE.BufferGeometry()
    geom.setAttribute('position', new THREE.Float32BufferAttribute(pts, 3))
    geom.setAttribute('color', new THREE.Float32BufferAttribute(colors, 3))
    return geom
  }, [isLidar, model, floorGhostMeshes])

  const baseFloor = floorGhostMeshes[0]
  const groundOutlinePoints = useMemo(() => {
    if (!baseFloor) return []
    return baseFloor.footprint.map(p => new THREE.Vector3(p[0], 0.08, p[1]))
  }, [baseFloor])

  useFrame((state) => {
    if (!groupRef.current) return
    const t = state.clock.getElapsedTime()
    const pulse = 0.65 + Math.sin(t * 3.5) * 0.12
    groupRef.current.traverse((child) => {
      if (child.isMesh) {
        child.raycast = () => {}
        if (child.material && child.material.name === 'ghost-mat') {
          child.material.opacity = pulse
        }
      }
    })
  })

  if (!placingBuilding || !placingBuilding.model) return null

  const totalHeight = modelFloors.length * 3.2
  const setbackFloor = floorGhostMeshes.find(f => f.isSetbackTower)

  return (
    <group ref={groupRef} position={[posX, 0, posZ]}>
      {/* 1. REALISTIC LIDAR LASER POINT RETURNS */}
      {laserPointData && (
        <points geometry={laserPointData}>
          <pointsMaterial
            size={0.14}
            vertexColors
            transparent
            opacity={0.9}
            blending={THREE.AdditiveBlending}
          />
        </points>
      )}

      {/* 2. INDIVIDUAL ARCHITECTURAL FLOOR SLABS */}
      {floorGhostMeshes.map((fg, idx) => (
        <group key={`ghost-floor-${idx}`} position={[0, fg.y, 0]}>
          <mesh geometry={fg.geom}>
            <meshStandardMaterial
              name="ghost-mat"
              color={fg.tierColor}
              emissive={fg.tierEmissive}
              emissiveIntensity={0.4}
              transparent
              opacity={fg.slabOpacity}
              roughness={0.25}
              metalness={0.3}
            />
          </mesh>
          <lineSegments>
            <edgesGeometry args={[fg.geom]} />
            <lineBasicMaterial
              color={fg.isTop ? '#fde047' : fg.isSetbackTower ? '#38bdf8' : '#67e8f9'}
              transparent
              opacity={0.85}
            />
          </lineSegments>
        </group>
      ))}

      {/* 3. GLOWING SETBACK TERRACE HIGHLIGHT */}
      {setbackFloor && (
        <group position={[0, setbackFloor.y, 0]}>
          <lineLoop>
            <bufferGeometry>
              <bufferAttribute
                attach="attributes-position"
                count={setbackFloor.footprint.length}
                array={new Float32Array(setbackFloor.footprint.flatMap(p => [p[0], 0.05, p[1]]))}
                itemSize={3}
              />
            </bufferGeometry>
            <lineBasicMaterial color="#38bdf8" linewidth={2} />
          </lineLoop>
        </group>
      )}

      {/* 4. CADASTRE GROUND PLOT OUTLINE */}
      {groundOutlinePoints.length > 0 && (
        <group position={[0, 0, 0]}>
          <lineLoop>
            <bufferGeometry>
              <bufferAttribute
                attach="attributes-position"
                count={groundOutlinePoints.length}
                array={new Float32Array(groundOutlinePoints.flatMap(p => [p.x, p.y, p.z]))}
                itemSize={3}
              />
            </bufferGeometry>
            <lineBasicMaterial color={color} linewidth={3} />
          </lineLoop>
        </group>
      )}

      {/* 5. FLOATING ARCHITECTURAL TIER IDENTIFIER TAGS */}
      <Html
        position={[0, totalHeight + 1.8, 0]}
        center
        style={{ pointerEvents: 'none', userSelect: 'none' }}
      >
        <div className="flex flex-col items-center gap-1 text-center font-mono pointer-events-none select-none">
          <div className="px-2.5 py-1 rounded-full bg-slate-950/90 border border-cyan-400/80 shadow-[0_0_20px_rgba(6,182,212,0.5)] text-white text-[11px] font-bold flex items-center gap-1.5 whitespace-nowrap">
            <span className="w-2 h-2 rounded-full bg-cyan-400 animate-ping" />
            <span>{model.buildingName || 'LiDAR 3D Cadastre'}</span>
            <span className="px-1.5 py-0.2 rounded bg-cyan-900 text-cyan-300 text-[9px]">
              {modelFloors.length} FLOORS
            </span>
          </div>
          {isLidar && (
            <div className="px-2 py-0.5 rounded bg-purple-950/90 border border-purple-400/60 text-purple-200 text-[9px] font-semibold whitespace-nowrap shadow-md">
              {model.shapeTitle || `${modelFloors.length}-Floor Cadastral Profile`}
            </div>
          )}
        </div>
      </Html>
    </group>
  )
}
