import React, { useMemo } from 'react'
import { Line, Html } from '@react-three/drei'
import * as THREE from 'three'
import useStore from '../store'

const STATUS_COLORS = {
  imported: '#22d3ee', // Cyan
  matched: '#10b981', // Emerald
  needs_verification: '#eab308', // Amber
  mismatch: '#ef4444', // Red
}

export default function ParcelOutline({ parcel, isSelected, onClick }) {
  const undergroundMode = useStore((s) => s.undergroundMode)
  
  const color = STATUS_COLORS[parcel.status] || '#22d3ee'
  const poly = parcel.polygon || parcel.points || []
  
  const points = useMemo(() => {
    if (!poly || poly.length === 0) return []
    const pts = poly.map(p => new THREE.Vector3(p.x, 0.15, p.z))
    pts.push(pts[0].clone()) // close the loop
    return pts
  }, [poly])

  // Compute centroid, shape for fill, and edge segments for dimension labels
  const { shape, centroid, edges, areaCalc } = useMemo(() => {
    if (!poly || poly.length === 0) {
      return { shape: null, centroid: new THREE.Vector3(), edges: [], areaCalc: 0 }
    }

    const shp = new THREE.Shape()
    let cx = 0, cz = 0
    poly.forEach((p, i) => {
      if (i === 0) shp.moveTo(p.x, -p.z)
      else shp.lineTo(p.x, -p.z)
      cx += p.x
      cz += p.z
    })
    cx /= poly.length
    cz /= poly.length

    // Compute edge midpoints and lengths
    const edgeList = []
    for (let i = 0; i < poly.length; i++) {
      const p1 = poly[i]
      const p2 = poly[(i + 1) % poly.length]
      const dx = p2.x - p1.x
      const dz = p2.z - p1.z
      const dist = Math.sqrt(dx * dx + dz * dz)
      edgeList.push({
        midX: (p1.x + p2.x) / 2,
        midZ: (p1.z + p2.z) / 2,
        length: dist.toFixed(1),
      })
    }

    // Rough polygon area estimation
    let area = 0
    for (let i = 0; i < poly.length; i++) {
      const j = (i + 1) % poly.length
      area += poly[i].x * poly[j].z
      area -= poly[j].x * poly[i].z
    }
    area = Math.abs(area) / 2

    return { 
      shape: shp, 
      centroid: new THREE.Vector3(cx, 0.15, cz),
      edges: edgeList,
      areaCalc: Math.round(area) || parcel.properties?.area || 450
    }
  }, [poly, parcel.properties])

  if (points.length === 0) return null

  return (
    <group onClick={(e) => { e.stopPropagation(); onClick && onClick(); }}>
      {/* 1. Main 2D Boundary Outer Line */}
      <Line
        points={points}
        color={color}
        lineWidth={isSelected ? 4 : 2.5}
      />

      {/* 2. Boundary Ground Fill Surface */}
      {shape && (
        <mesh position={[0, 0.04, 0]} rotation={[-Math.PI / 2, 0, 0]}>
          <shapeGeometry args={[shape]} />
          <meshBasicMaterial 
            color={color} 
            transparent 
            opacity={isSelected ? 0.15 : 0.06} 
            side={THREE.DoubleSide} 
            depthWrite={false}
          />
        </mesh>
      )}

      {/* 3. Sleek Low-Profile Survey Marker Pins */}
      {poly.map((p, idx) => (
        <group key={idx} position={[p.x, 0.08, p.z]}>
          <mesh>
            <cylinderGeometry args={[0.08, 0.1, 0.05, 8]} />
            <meshStandardMaterial 
              color={color} 
              emissive={color} 
              emissiveIntensity={0.8} 
              roughness={0.3}
            />
          </mesh>
        </group>
      ))}

      {/* 4. Edge Dimension Markers (Only shown when parcel is selected) */}
      {!undergroundMode && isSelected && edges.map((edge, idx) => (
        <Html 
          key={idx} 
          position={[edge.midX, 0.25, edge.midZ]} 
          center 
          zIndexRange={[50, 0]}
        >
          <div style={{
            fontSize: '8.5px',
            fontFamily: 'monospace',
            fontWeight: 'bold',
            background: 'rgba(15, 23, 42, 0.9)',
            border: `1px solid ${color}`,
            padding: '1px 4px',
            borderRadius: '3px',
            color: '#38bdf8',
            whiteSpace: 'nowrap',
            pointerEvents: 'none',
            boxShadow: '0 2px 6px rgba(0,0,0,0.6)'
          }}>
            {edge.length}m
          </div>
        </Html>
      ))}

      {/* 5. Center Cadastral Title Badge - Clean & Non-Cluttering */}
      {!undergroundMode && parcel.status !== 'matched' && (
        <Html position={[centroid.x, 0.15, centroid.z]} center zIndexRange={[isSelected ? 100 : 20, 0]}>
          <div 
            onClick={(e) => { e.stopPropagation(); onClick && onClick(); }}
            style={{
              fontSize: isSelected ? '10px' : '8.5px',
              fontFamily: 'sans-serif',
              fontWeight: 'bold',
              background: isSelected ? 'rgba(10, 14, 26, 0.95)' : 'rgba(15, 23, 42, 0.82)',
              border: `1px solid ${isSelected ? '#38bdf8' : color + '70'}`,
              boxShadow: isSelected ? '0 0 12px rgba(56, 189, 248, 0.5)' : '0 1px 4px rgba(0,0,0,0.5)',
              padding: isSelected ? '3px 7px' : '1px 5px',
              borderRadius: '5px',
              color: '#f8fafc',
              whiteSpace: 'nowrap',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '4px',
              transition: 'all 0.15s ease'
            }}
          >
            <span style={{ color, fontSize: '7px' }}>●</span>
            <span>{parcel.name}</span>
            {isSelected && (
              <span style={{ color: '#38bdf8', fontSize: '8px', fontFamily: 'monospace' }}>
                ({areaCalc}m²)
              </span>
            )}
          </div>
        </Html>
      )}

      {/* 6. Floating Overhead Badge when Matched & Selected */}
      {!undergroundMode && isSelected && parcel.status === 'matched' && (
        <Html position={[centroid.x, 22.0, centroid.z]} center zIndexRange={[120, 0]}>
          <div 
            style={{
              fontSize: '10px',
              fontFamily: 'sans-serif',
              fontWeight: 'bold',
              background: 'rgba(10, 14, 26, 0.95)',
              border: '1.5px solid #10b981',
              boxShadow: '0 0 15px rgba(16, 185, 129, 0.5)',
              padding: '3px 8px',
              borderRadius: '6px',
              color: '#ffffff',
              whiteSpace: 'nowrap',
              textAlign: 'center'
            }}
          >
            <div style={{ color: '#34d399', display: 'flex', alignItems: 'center', gap: '4px', justifyContent: 'center' }}>
              <span>✓</span>
              <span>{parcel.name}</span>
            </div>
            <div style={{ fontSize: '8px', color: '#94a3b8', fontFamily: 'monospace' }}>
              {areaCalc}m² • 3D Model Centered
            </div>
          </div>
        </Html>
      )}
    </group>
  )
}
