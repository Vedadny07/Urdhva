import React, { useRef, useState, useMemo } from 'react'
import { useFrame } from '@react-three/fiber'
import { Html } from '@react-three/drei'
import * as THREE from 'three'
import useStore from '../store'
import { FAMILY_COLORS, getFamilyColor, hashColor } from '../utils/familyColors'
import { getShapeFootprint } from '../utils/shapeFootprint'

// Sutherland-Hodgman 2D Polygon Clipping against axis-aligned bounds
function clipPolygonToBounds(poly, minX, maxX, minZ, maxZ) {
  let outputList = poly
  const clipEdges = [
    { inside: (p) => p[0] >= minX, intersect: (p1, p2) => [minX, p1[1] + (p2[1] - p1[1]) * (minX - p1[0]) / (p2[0] - p1[0])] },
    { inside: (p) => p[0] <= maxX, intersect: (p1, p2) => [maxX, p1[1] + (p2[1] - p1[1]) * (maxX - p1[0]) / (p2[0] - p1[0])] },
    { inside: (p) => p[1] >= minZ, intersect: (p1, p2) => [p1[0] + (p2[0] - p1[0]) * (minZ - p1[1]) / (p2[1] - p1[1]), minZ] },
    { inside: (p) => p[1] <= maxZ, intersect: (p1, p2) => [p1[0] + (p2[0] - p1[0]) * (maxZ - p1[1]) / (p2[1] - p1[1]), maxZ] },
  ]

  for (const edge of clipEdges) {
    const inputList = outputList
    outputList = []
    if (inputList.length === 0) break
    let s = inputList[inputList.length - 1]
    for (const e of inputList) {
      if (edge.inside(e)) {
        if (!edge.inside(s)) {
          outputList.push(edge.intersect(s, e))
        }
        outputList.push(e)
      } else if (edge.inside(s)) {
        outputList.push(edge.intersect(s, e))
      }
      s = e
    }
  }
  return outputList
}

function polygonArea(pts) {
  let area = 0
  for (let i = 0; i < pts.length; i++) {
    const j = (i + 1) % pts.length
    area += pts[i][0] * pts[j][1] - pts[j][0] * pts[i][1]
  }
  return Math.abs(area) / 2
}

// Color for basement/parking (underground = gray) vs. regular floors
// (building = amber/yellow), matching the reference cadastral color legend.
function typeColor(type) {
  if (type === 'basement') return '#52525b'
  if (type === 'parking') return '#71717a'
  return '#f2b134'
}

export default function FloorBox({ 
  unit, 
  building, 
  explodedOffset,
  onBuildingPress,
  onBuildingDoubleClick,
}) {
  const meshRef = useRef()
  const [hovered, setHovered] = useState(false)
  const [hoveredFamily, setHoveredFamily] = useState(null)

  const viewMode = useStore((s) => s.viewMode)
  const selectedBuilding = useStore((s) => s.selectedBuilding)
  const selectedUnit = useStore((s) => s.selectedUnit)
  const hoveredUnit = useStore((s) => s.hoveredUnit)
  const clashResults = useStore((s) => s.clashResults)
  const selectUnit = useStore((s) => s.selectUnit)
  const setHoveredUnit = useStore((s) => s.setHoveredUnit)
  const userRole = useStore((s) => s.userRole)
  const undergroundMode = useStore((s) => s.undergroundMode)
  const xrayMode = useStore((s) => s.xrayMode)

  const isThisBuilding = selectedBuilding === building.id
  const isExploded = viewMode === 'exploded' && isThisBuilding
  const isSelected = selectedUnit === unit.ulpin
  const isHovered = hoveredUnit === unit.ulpin
  const isUnauthorized = unit.status === 'unauthorized'
  const isClashing = clashResults.some(c => c.ulpin === unit.ulpin)

  const isUndergroundUnit = unit.zRange[0] < 0 || unit.type === 'basement' || unit.type === 'parking'
  const isTranslucentInUnderground = (undergroundMode && !isUndergroundUnit) || (xrayMode && !isUndergroundUnit)

  const hasFamilies = unit.families && unit.families.length > 0 && unit.type === 'floor'
  const isMultiFamily = hasFamilies && unit.families.length > 1

  const unitDims = unit.actualDimensions || []
  const baseFw = building.footprint ? building.footprint[0] : 16
  const baseFd = building.footprint ? building.footprint[1] : 14
  const fw = unit.width || (unitDims[0] && unitDims[0] > 0 ? unitDims[0] : baseFw)
  const fd = unit.length || (unitDims[2] && unitDims[2] > 0 ? unitDims[2] : baseFd)
  const height = unit.zRange[1] - unit.zRange[0]
  const baseY = unit.zRange[0] + height / 2
  const [bx, , bz] = building.position
  const targetY = baseY + (isExploded ? explodedOffset : 0)

  const gap = 0.05
  const slabThickness = Math.max(0.1, height - gap)

  const currentY = useRef(baseY)
  const clashPulse = useRef(0)

  // ═══════════════════════════════════════════════════════
  // GENERIC POINT-CLOUD POLYGON GEOMETRY (Zero shape-enums)
  // ═══════════════════════════════════════════════════════
  const footprintCoords = useMemo(() => {
    if (unit.footprint && Array.isArray(unit.footprint) && unit.footprint.length >= 3) {
      return unit.footprint
    }
    if (building.floors && Array.isArray(building.floors) && building.floors.length > 0) {
      const fl = building.floors.find(f => (f.floor_index !== undefined ? f.floor_index + 1 === unit.floorNumber : false)) || building.floors[unit.floorNumber - 1]
      if (fl?.footprint && Array.isArray(fl.footprint) && fl.footprint.length >= 3) {
        return fl.footprint
      }
    }
    const baseW = building.footprint ? building.footprint[0] : (unit.width || 14)
    const baseL = building.footprint ? building.footprint[1] : (unit.length || 12)
    if (building.shape && building.shape !== 'rectangle') {
      return getShapeFootprint(building.shape, baseW, baseL)
    }
    return [
      [-baseW / 2, -baseL / 2],
      [baseW / 2, -baseL / 2],
      [baseW / 2, baseL / 2],
      [-baseW / 2, baseL / 2],
      [-baseW / 2, -baseL / 2]
    ]
  }, [unit.footprint, building.floors, unit.floorNumber, building.footprint, building.shape, unit.width, unit.length])

  // Single generic extruded polygon geometry (for single-family or utility floors)
  const polygonGeometry = useMemo(() => {
    const shapePts = footprintCoords.map(([x, y]) => new THREE.Vector2(x, y))
    const shape = new THREE.Shape(shapePts)
    const geom = new THREE.ExtrudeGeometry(shape, {
      depth: slabThickness,
      bevelEnabled: false,
    })
    geom.rotateX(Math.PI / 2)
    geom.translate(0, slabThickness / 2, 0)
    return geom
  }, [footprintCoords, slabThickness])

  // Multi-family floor corridor slab + separated apartment parcels
  const baseSlabHeight = 0.08
  const aptThickness = Math.max(0.1, slabThickness - baseSlabHeight)

  // Thin common corridor base slab underneath apartment parcels
  const baseFloorGeometry = useMemo(() => {
    if (!isMultiFamily) return null
    const shapePts = footprintCoords.map(([x, y]) => new THREE.Vector2(x, y))
    const shape = new THREE.Shape(shapePts)
    const geom = new THREE.ExtrudeGeometry(shape, {
      depth: baseSlabHeight,
      bevelEnabled: false,
    })
    geom.rotateX(Math.PI / 2)
    geom.translate(0, -slabThickness / 2 + baseSlabHeight / 2, 0)
    return geom
  }, [isMultiFamily, footprintCoords, slabThickness, baseSlabHeight])

  // Individual apartment sub-geometries with physical corridor separation gaps
  const familyUnits = useMemo(() => {
    if (!isMultiFamily) return []

    const families = unit.families
    const numFamilies = families.length
    const corridorGap = 0.22 // 22cm physical corridor gap between units

    let minX = Infinity, maxX = -Infinity, minZ = Infinity, maxZ = -Infinity
    for (const [x, z] of footprintCoords) {
      if (x < minX) minX = x
      if (x > maxX) maxX = x
      if (z < minZ) minZ = z
      if (z > maxZ) maxZ = z
    }
    const spanX = maxX - minX
    const spanZ = maxZ - minZ

    // Compute partition boxes
    const boxes = []
    if (numFamilies === 2) {
      if (spanX >= spanZ) {
        const mid = minX + spanX / 2
        boxes.push({ minX, maxX: mid - corridorGap / 2, minZ, maxZ })
        boxes.push({ minX: mid + corridorGap / 2, maxX, minZ, maxZ })
      } else {
        const mid = minZ + spanZ / 2
        boxes.push({ minX, maxX, minZ, maxZ: mid - corridorGap / 2 })
        boxes.push({ minX, maxX, minZ: mid + corridorGap / 2, maxZ })
      }
    } else if (numFamilies === 3) {
      if (spanX >= spanZ) {
        const step = spanX / 3
        boxes.push({ minX, maxX: minX + step - corridorGap / 2, minZ, maxZ })
        boxes.push({ minX: minX + step + corridorGap / 2, maxX: minX + 2 * step - corridorGap / 2, minZ, maxZ })
        boxes.push({ minX: minX + 2 * step + corridorGap / 2, maxX, minZ, maxZ })
      } else {
        const step = spanZ / 3
        boxes.push({ minX, maxX, minZ, maxZ: minZ + step - corridorGap / 2 })
        boxes.push({ minX, maxX, minZ: minZ + step + corridorGap / 2, maxZ: minZ + 2 * step - corridorGap / 2 })
        boxes.push({ minX, maxX, minZ: minZ + 2 * step + corridorGap / 2, maxZ })
      }
    } else {
      let cols, rows
      if (numFamilies <= 4) {
        cols = 2
        rows = 2
      } else if (numFamilies <= 6) {
        cols = spanX >= spanZ ? 3 : 2
        rows = spanX >= spanZ ? 2 : 3
      } else {
        cols = Math.ceil(Math.sqrt(numFamilies))
        rows = Math.ceil(numFamilies / cols)
      }
      const stepX = spanX / cols
      const stepZ = spanZ / rows

      for (let r = 0; r < rows; r++) {
        for (let c = 0; c < cols; c++) {
          if (boxes.length >= numFamilies) break
          const bMinX = minX + c * stepX + (c > 0 ? corridorGap / 2 : 0)
          const bMaxX = minX + (c + 1) * stepX - (c < cols - 1 ? corridorGap / 2 : 0)
          const bMinZ = minZ + r * stepZ + (r > 0 ? corridorGap / 2 : 0)
          const bMaxZ = minZ + (r + 1) * stepZ - (r < rows - 1 ? corridorGap / 2 : 0)
          boxes.push({ minX: bMinX, maxX: bMaxX, minZ: bMinZ, maxZ: bMaxZ })
        }
      }
    }

    // Clip each partition box against the floor footprint polygon
    return families.map((family, i) => {
      const box = boxes[i] || boxes[boxes.length - 1]
      let clipped = clipPolygonToBounds(footprintCoords, box.minX, box.maxX, box.minZ, box.maxZ)

      if (!clipped || clipped.length < 3 || polygonArea(clipped) < 0.1) {
        clipped = [
          [box.minX, box.minZ],
          [box.maxX, box.minZ],
          [box.maxX, box.maxZ],
          [box.minX, box.maxZ],
        ]
      }

      // 2D centroid for label placement
      const cx = clipped.reduce((acc, p) => acc + p[0], 0) / clipped.length
      const cz = clipped.reduce((acc, p) => acc + p[1], 0) / clipped.length

      const shapePts = clipped.map(([x, z]) => new THREE.Vector2(x, z))
      const shape = new THREE.Shape(shapePts)
      const geom = new THREE.ExtrudeGeometry(shape, {
        depth: aptThickness,
        bevelEnabled: false,
      })
      geom.rotateX(Math.PI / 2)
      geom.translate(0, -slabThickness / 2 + baseSlabHeight + aptThickness / 2, 0)

      const color = isUnauthorized ? '#dc2626' : getFamilyColor(family, i)

      return {
        family,
        index: i,
        geometry: geom,
        center: [cx, cz],
        color,
      }
    })
  }, [isMultiFamily, unit.families, footprintCoords, slabThickness, aptThickness, isUnauthorized])

  useFrame((state, delta) => {
    // Smooth Y animation for exploded view
    currentY.current = THREE.MathUtils.lerp(currentY.current, targetY, 0.08)

    if (meshRef.current) {
      meshRef.current.position.y = currentY.current
    }

    // Clash pulse
    if (isClashing && meshRef.current) {
      clashPulse.current += delta * 3
      const pulse = (Math.sin(clashPulse.current) + 1) / 2
      meshRef.current.traverse(child => {
        if (child.isMesh && child.material && child.material.emissive) {
          child.material.emissive.setHex(0xff0000)
          child.material.emissiveIntensity = 0.3 + pulse * 0.5
        }
      })
    }
  })

  const handleClick = (e) => {
    e.stopPropagation()
    if (isExploded) {
      selectUnit(unit.ulpin)
    } else if (onBuildingPress) {
      onBuildingPress(e)
    }
  }

  const handleDoubleClick = (e) => {
    e.stopPropagation()
    if (onBuildingDoubleClick) {
      onBuildingDoubleClick(e)
    }
  }

  const handlePointerOver = (e) => {
    e.stopPropagation()
    setHovered(true)
    if (isExploded) {
      setHoveredUnit(unit.ulpin)
    }
    document.body.style.cursor = 'pointer'
  }

  const handlePointerOut = (e) => {
    e.stopPropagation()
    setHovered(false)
    setHoveredFamily(null)
    setHoveredUnit(null)
    document.body.style.cursor = 'auto'
  }

  const baseColor = isUnauthorized
    ? '#dc2626'
    : isClashing
    ? '#ff2222'
    : hasFamilies && unit.families.length === 1
    ? getFamilyColor(unit.families[0], 0)
    : typeColor(unit.type)

  return (
    <group>
      <group
        ref={meshRef}
        position={[bx, baseY, bz]}
        onClick={handleClick}
        onDoubleClick={handleDoubleClick}
        onPointerOver={handlePointerOver}
        onPointerOut={handlePointerOut}
      >
        {/* MULTI-FAMILY FLOOR: Divided colorful apartment parcels with corridor gaps */}
        {isMultiFamily ? (
          <group>
            {/* Dark Slate Corridor Base Slab */}
            {baseFloorGeometry && (
              <mesh geometry={baseFloorGeometry} receiveShadow>
                <meshStandardMaterial
                  color="#0f172a"
                  roughness={0.7}
                  metalness={0.1}
                  transparent={isTranslucentInUnderground}
                  opacity={isTranslucentInUnderground ? 0.22 : 1.0}
                  depthWrite={!isTranslucentInUnderground}
                />
              </mesh>
            )}

            {/* Individual Colorful Family Apartment Parcels */}
            {familyUnits.map((fu) => {
              const isThisFamilyHovered = hoveredFamily === fu.index
              const isThisFamilySelected = selectedUnit === fu.family.ulpin
              return (
                <group key={fu.index}>
                  <mesh
                    geometry={fu.geometry}
                    castShadow
                    receiveShadow
                    onClick={(e) => {
                      e.stopPropagation()
                      if (isExploded) {
                        selectUnit(fu.family.ulpin || unit.ulpin)
                      } else if (onBuildingPress) {
                        onBuildingPress(e)
                      }
                    }}
                    onPointerOver={(e) => {
                      e.stopPropagation()
                      setHoveredFamily(fu.index)
                      setHovered(true)
                      if (isExploded) setHoveredUnit(fu.family.ulpin || unit.ulpin)
                      document.body.style.cursor = 'pointer'
                    }}
                    onPointerOut={(e) => {
                      e.stopPropagation()
                      setHoveredFamily(null)
                    }}
                  >
                    <meshStandardMaterial
                      color={isClashing ? '#ff2222' : fu.color}
                      roughness={0.35}
                      metalness={0.15}
                      emissive={isClashing ? '#ff0000' : fu.color}
                      emissiveIntensity={
                        isThisFamilyHovered || isThisFamilySelected
                          ? 0.5
                          : isHovered || isSelected
                          ? 0.22
                          : 0.08
                      }
                      transparent={isTranslucentInUnderground}
                      opacity={isTranslucentInUnderground ? (xrayMode && !undergroundMode ? 0.35 : 0.22) : 0.95}
                      depthWrite={!isTranslucentInUnderground}
                    />
                  </mesh>

                  {/* High-contrast architectural edge border for each apartment */}
                  <lineSegments>
                    <edgesGeometry args={[fu.geometry]} />
                    <lineBasicMaterial
                      color={isUnauthorized ? '#ef4444' : isThisFamilySelected ? '#38bdf8' : '#0f172a'}
                      transparent
                      opacity={isThisFamilySelected ? 0.9 : 0.65}
                    />
                  </lineSegments>

                  {/* 3D Floating Doorplate Badge in exploded mode or on parcel hover/select */}
                  {(isExploded || isThisFamilyHovered || isThisFamilySelected) && (
                    <Html
                      position={[fu.center[0], slabThickness / 2 + 0.25, fu.center[1]]}
                      center
                      zIndexRange={[20, 0]}
                      style={{
                        pointerEvents: 'none',
                        transition: 'opacity 0.2s, transform 0.2s',
                        opacity: isThisFamilyHovered || isThisFamilySelected || (isExploded && isHovered) ? 1 : 0.85,
                        transform: isThisFamilyHovered || isThisFamilySelected ? 'scale(1.08)' : 'scale(1)',
                      }}
                    >
                      <div
                        style={{
                          background: 'rgba(15, 23, 42, 0.94)',
                          border: `1.5px solid ${fu.color}`,
                          boxShadow: `0 3px 12px ${fu.color}60`,
                          borderRadius: '6px',
                          padding: '3px 8px',
                          fontSize: '10px',
                          fontWeight: 600,
                          color: '#f8fafc',
                          whiteSpace: 'nowrap',
                          pointerEvents: 'none',
                          display: 'flex',
                          alignItems: 'center',
                          gap: '5px',
                        }}
                      >
                        <span
                          style={{
                            width: '7px',
                            height: '7px',
                            borderRadius: '50%',
                            background: fu.color,
                            flexShrink: 0,
                          }}
                        />
                        <span>
                          Unit {fu.family.unit || fu.family.flatNumber}: {(userRole === 'corporator' || userRole === 'datasurvey') ? fu.family.name : 'Resident'}
                        </span>
                      </div>
                    </Html>
                  )}
                </group>
              )
            })}
          </group>
        ) : (
          /* SINGLE-FAMILY / UTILITY FLOOR: Single unified generic extruded polygon */
          <group>
            <mesh geometry={polygonGeometry} castShadow receiveShadow>
              <meshStandardMaterial
                color={isClashing ? '#ff2222' : baseColor}
                roughness={0.45}
                metalness={0.2}
                emissive={baseColor}
                emissiveIntensity={isHovered || isSelected ? 0.2 : 0.03}
                transparent={isTranslucentInUnderground}
                opacity={isTranslucentInUnderground ? (xrayMode && !undergroundMode ? 0.35 : 0.22) : 1.0}
                depthWrite={!isTranslucentInUnderground}
              />
            </mesh>

            {/* Structural Edge Outlines */}
            <lineSegments>
              <edgesGeometry args={[polygonGeometry]} />
              <lineBasicMaterial
                color={isUnauthorized ? '#ef4444' : '#0891b2'}
                transparent
                opacity={0.4}
              />
            </lineSegments>
          </group>
        )}
      </group>

      {/* Red wireframe outline for unauthorized floors */}
      {isUnauthorized && (
        <mesh position={[bx, currentY.current || baseY, bz]} geometry={polygonGeometry}>
          <meshBasicMaterial color="#ff4444" wireframe transparent opacity={0.7} />
        </mesh>
      )}

      {/* Hover label in exploded mode */}
      {isExploded && isHovered && (
        <Html
          position={[bx + fw / 2 + 1, currentY.current || targetY, bz]}
          center={false}
          zIndexRange={[10, 0]}
          style={{ pointerEvents: 'none' }}
        >
          <div className="floating-label" style={{ maxWidth: '220px' }}>
            <div className="ulpin-id">{unit.ulpin}</div>
            
            {(userRole === 'corporator' || userRole === 'datasurvey') ? (
              <>
                <div className="owner-name">{unit.owner}</div>
                {hasFamilies && (
                  <div style={{
                    marginTop: '6px',
                    borderTop: '1px solid rgba(51, 65, 85, 0.5)',
                    paddingTop: '5px',
                    fontSize: '10px',
                  }}>
                    {unit.families.map((f, i) => (
                      <div key={i} style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: '5px',
                        marginTop: i > 0 ? '2px' : 0,
                      }}>
                        <span style={{
                          width: '8px',
                          height: '8px',
                          borderRadius: '2px',
                          background: getFamilyColor(f, i),
                          flexShrink: 0,
                        }}></span>
                        <span style={{ color: '#cbd5e1' }}>{f.name}</span>
                        <span style={{ color: '#475569', fontSize: '9px', marginLeft: 'auto' }}>{f.unit || f.flatNumber}</span>
                      </div>
                    ))}
                  </div>
                )}
              </>
            ) : userRole === 'citizen' ? (
              <>
                <div className="owner-name">Masked for privacy</div>
                {unit.families && unit.families.length > 0 && (
                  <div style={{
                    marginTop: '6px',
                    borderTop: '1px solid rgba(51, 65, 85, 0.5)',
                    paddingTop: '5px',
                    fontSize: '10px',
                    color: '#cbd5e1',
                  }}>
                    {unit.families.length} residents
                  </div>
                )}
              </>
            ) : (
              <div className="owner-name">Owner Details Restricted</div>
            )}
          </div>
        </Html>
      )}
    </group>
  )
}
