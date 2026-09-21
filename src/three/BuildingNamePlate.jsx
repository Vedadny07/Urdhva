import React, { useState } from 'react'
import { Html } from '@react-three/drei'
import * as THREE from 'three'
import useStore from '../store'

export default function BuildingNamePlate({ 
  building, 
  isSelected,
  onBuildingPress,
  onBuildingDoubleClick,
}) {
  const [hovered, setHovered] = useState(false)
  const selectBuilding = useStore((s) => s.selectBuilding)
  const explodeBuilding = useStore((s) => s.explodeBuilding)
  const show3DLabels = useStore((s) => s.show3DLabels)
  const undergroundMode = useStore((s) => s.undergroundMode)

  if (!show3DLabels) return null

  const [bx, , bz] = building.position || [0, 0, 0]
  const [fw, fd] = building.footprint || [16, 14]
  const isRadial = building.shape === 'cylinder' || building.shape === 'pentagon' || building.shape === 'hexagon' || building.shape === 'triangle'
  const radius = Math.min(fw, fd) / 2

  // Plaque mounting coordinates on the front facade
  const plaqueZ = isRadial ? bz + radius + 0.35 : bz + fd / 2 + 0.35
  const plaqueY = Math.min(building.actualFloors * 3 * 0.3 + 2.5, 6.0)
  const plaqueWidth = Math.min(fw * 0.65, 8.5)

  const isViolation = building.actualFloors > building.approvedFloors
  const accentColor = isSelected ? '#38bdf8' : isViolation ? '#f43f5e' : '#06b6d4'
  const glowShadow = isSelected 
    ? '0 0 25px rgba(56, 189, 248, 0.65)' 
    : hovered 
    ? '0 0 22px rgba(6, 182, 212, 0.6)' 
    : '0 4px 15px rgba(0, 0, 0, 0.85)'

  const handleClick = (e) => {
    e.stopPropagation()
    if (onBuildingPress) {
      onBuildingPress(e)
    } else {
      selectBuilding(building.id)
    }
  }

  const handleDoubleClick = (e) => {
    e.stopPropagation()
    if (onBuildingDoubleClick) {
      onBuildingDoubleClick(e)
    } else {
      explodeBuilding(building.id)
    }
  }

  // Count underground parking / basement levels
  const basementUnits = building.units ? building.units.filter(u => u.type === 'basement' || u.type === 'parking' || u.zRange[0] < 0) : []
  const undergroundLevels = basementUnits.length

  return (
    <group position={[bx, plaqueY, plaqueZ]}>
      {/* ── Physical 3D Architectural Plaque Mesh ── */}
      <mesh 
        position={[0, 0, 0]} 
        castShadow 
        receiveShadow 
        onClick={handleClick}
        onDoubleClick={handleDoubleClick}
      >
        <boxGeometry args={[plaqueWidth, 1.4, 0.18]} />
        <meshStandardMaterial
          color="#0b1329"
          roughness={0.25}
          metalness={0.75}
          emissive={isSelected ? '#0284c7' : '#0a192f'}
          emissiveIntensity={isSelected ? 0.3 : 0.1}
        />
      </mesh>

      {/* ── Plaque Trim Border (LED Neon Edge) ── */}
      <mesh position={[0, 0, 0.09]}>
        <planeGeometry args={[plaqueWidth + 0.1, 1.5]} />
        <meshBasicMaterial color={accentColor} wireframe transparent opacity={isSelected || hovered ? 0.9 : 0.5} />
      </mesh>

      {/* ── Crisp HTML Architectural Signboard Banner ── */}
      <Html
        position={[0, 0, 0.12]}
        center
        distanceFactor={32}
        zIndexRange={[10, 0]}
        style={{ pointerEvents: 'auto', userSelect: 'none' }}
      >
        <div
          onClick={handleClick}
          onDoubleClick={handleDoubleClick}
          onMouseEnter={() => setHovered(true)}
          onMouseLeave={() => setHovered(false)}
          className={`cursor-pointer transition-all duration-200 transform ${
            hovered || isSelected ? 'scale-105' : 'scale-100'
          }`}
          title={`Click to select & inspect ${building.name}`}
          style={{
            boxShadow: glowShadow,
            borderRadius: '10px',
          }}
        >
          <div className={`px-3.5 py-2.5 rounded-xl flex items-center gap-2.5 backdrop-blur-xl border-2 transition-colors ${
            isSelected
              ? 'bg-slate-900/98 border-cyan-400 text-white shadow-[0_0_25px_rgba(6,182,212,0.5)]'
              : hovered
              ? 'bg-slate-900/95 border-cyan-400/90 text-white'
              : 'bg-slate-950/92 border-slate-700/80 text-slate-200'
          }`}>
            {/* Pulsing Signal Dot */}
            <div className="relative flex items-center justify-center">
              <span className={`w-2.5 h-2.5 rounded-full ${isSelected ? 'bg-cyan-400 animate-ping' : isViolation ? 'bg-rose-500' : 'bg-cyan-400 animate-pulse'}`} />
              <span className={`absolute w-2 h-2 rounded-full ${isSelected ? 'bg-cyan-300' : isViolation ? 'bg-rose-400' : 'bg-cyan-400'}`} />
            </div>

            {/* Building Name & Specifications */}
            <div className="flex flex-col text-left">
              <div className="flex items-center gap-1.5">
                <span className="text-[15px] leading-tight font-black tracking-wide text-white uppercase whitespace-nowrap drop-shadow-md">
                  {building.name}
                </span>
                {isViolation && (
                  <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-rose-950/80 border border-rose-500/60 text-rose-300">
                    +{building.actualFloors - building.approvedFloors}F Unauth
                  </span>
                )}
              </div>
              <div className="text-[11px] font-mono font-semibold text-cyan-300/90 whitespace-nowrap flex items-center gap-1.5 mt-1">
                <span>{building.actualFloors} FLOORS</span>
                <span>•</span>
                <span className="capitalize">{building.shape || 'tower'}</span>
                {undergroundLevels > 0 && (
                  <>
                    <span>•</span>
                    <span className="text-yellow-400 font-bold">🅿️ {undergroundLevels} Levels</span>
                  </>
                )}
                {undergroundMode && (
                  <span className="text-purple-300 font-bold bg-purple-950/80 px-1.5 py-0.5 rounded border border-purple-500/40">
                    Depth -{(undergroundLevels * 3).toFixed(0)}m
                  </span>
                )}
              </div>
            </div>

            {/* Select Indicator Chevron */}
            <div className={`text-xs pl-1 transition-transform ${hovered || isSelected ? 'translate-x-0.5 text-cyan-400 font-bold' : 'text-slate-500'}`}>
              →
            </div>
          </div>
        </div>
      </Html>
    </group>
  )
}
