import React, { useMemo, useRef } from 'react'
import FloorBox from './FloorBox'
import FlagMarker from './FlagMarker'
import BuildingNamePlate from './BuildingNamePlate'
import useStore from '../store'

export default function Building({ building }) {
  const viewMode = useStore((s) => s.viewMode)
  const selectedBuilding = useStore((s) => s.selectedBuilding)
  const selectBuilding = useStore((s) => s.selectBuilding)
  const explodeBuilding = useStore((s) => s.explodeBuilding)

  const lastClickRef = useRef(0)

  const isThisBuilding = selectedBuilding === building.id
  const isExploded = viewMode === 'exploded' && isThisBuilding

  // Sort units by zRange bottom for correct stacking
  const sortedUnits = useMemo(() => {
    return [...building.units].sort((a, b) => a.zRange[0] - b.zRange[0])
  }, [building.units])

  // Calculate exploded offsets — each unit moves apart by an increasing gap
  const explodedOffsets = useMemo(() => {
    const gap = 2.0 // gap between exploded floors
    return sortedUnits.map((_, index) => {
      // Center the explosion around the midpoint
      const mid = (sortedUnits.length - 1) / 2
      return (index - mid) * gap
    })
  }, [sortedUnits])

  const handleBuildingPress = (e) => {
    if (e && e.stopPropagation) e.stopPropagation()
    const now = Date.now()
    const diff = now - lastClickRef.current

    if (diff > 0 && diff < 450) {
      // Double click detected! Explode building into slices
      lastClickRef.current = 0
      explodeBuilding(building.id)
    } else {
      // Single click: select building
      lastClickRef.current = now
      selectBuilding(building.id)
    }
  }

  const handleBuildingDoubleClick = (e) => {
    if (e && e.stopPropagation) e.stopPropagation()
    lastClickRef.current = 0
    explodeBuilding(building.id)
  }

  return (
    <group 
      onClick={handleBuildingPress}
      onDoubleClick={handleBuildingDoubleClick}
    >
      {sortedUnits.map((unit, index) => (
        <FloorBox
          key={unit.ulpin}
          unit={unit}
          building={building}
          explodedOffset={explodedOffsets[index]}
          onBuildingPress={handleBuildingPress}
          onBuildingDoubleClick={handleBuildingDoubleClick}
        />
      ))}

      {/* Always-visible flag for violation buildings */}
      <FlagMarker building={building} />

      {/* Prominent Architectural Facade Name Plate Banner */}
      <BuildingNamePlate 
        building={building} 
        isSelected={isThisBuilding} 
        onBuildingPress={handleBuildingPress}
        onBuildingDoubleClick={handleBuildingDoubleClick}
      />
    </group>
  )
}

