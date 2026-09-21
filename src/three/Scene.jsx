import React, { useRef, useEffect, useCallback } from 'react'
import { useFrame, useThree } from '@react-three/fiber'
import { OrbitControls, Html } from '@react-three/drei'
import * as THREE from 'three'
import GroundGrid from './GroundGrid'
import RoadNetwork from './RoadNetwork'
import Vegetation from './Vegetation'
import WaterFeatures from './WaterFeature'
import Building from './Building'
import InfrastructureLine from './InfrastructureLine'
import WaypointMarker from './WaypointMarker'
import UndergroundFeature from './UndergroundFeature'
import CandidateRoute from './CandidateRoute'
import PipelineDraftPreview from './PipelineDraftPreview'
import BuildingPlacementPreview from './BuildingPlacementPreview'
import ParcelOutline from './ParcelOutline'
import useStore from '../store'

export default function Scene() {
  const buildings = useStore((s) => s.buildings)
  const infrastructure = useStore((s) => s.infrastructure)
  const undergroundFeatures = useStore((s) => s.undergroundFeatures)
  const waypoints = useStore((s) => s.waypoints)
  const selectedBuilding = useStore((s) => s.selectedBuilding)
  const selectedUnit = useStore((s) => s.selectedUnit)
  const hoveredUnit = useStore((s) => s.hoveredUnit)
  const viewMode = useStore((s) => s.viewMode)
  const deselectAll = useStore((s) => s.deselectAll)
  const userInfrastructure = useStore((s) => s.userInfrastructure)
  const candidateRoutes = useStore((s) => s.candidateRoutes)
  const selectedCandidateId = useStore((s) => s.selectedCandidateId)
  const focusCameraOn = useStore((s) => s.focusCameraOn)
  const optimizationStatus = useStore((s) => s.optimizationStatus)
  const builderResult = useStore((s) => s.builderResult)
  const infraDrawingActive = useStore((s) => s.infraDrawingActive)
  const corporatorMode = useStore((s) => s.corporatorMode)
  const infraDraftDepth = useStore((s) => s.infraDraftDepth)
  const addInfraDraftPoint = useStore((s) => s.addInfraDraftPoint)
  const placingBuilding = useStore((s) => s.placingBuilding)
  const updatePlacementPosition = useStore((s) => s.updatePlacementPosition)
  const confirmBuildingPlacement = useStore((s) => s.confirmBuildingPlacement)
  const undergroundMode = useStore((s) => s.undergroundMode)
  const xrayMode = useStore((s) => s.xrayMode)
  const importedParcels = useStore((s) => s.importedParcels)
  const selectedParcel = useStore((s) => s.selectedParcel)
  const setSelectedParcel = useStore((s) => s.setSelectedParcel)
  const userRole = useStore((s) => s.userRole)
  const userRegion = useStore((s) => s.userRegion)
  const userName = useStore((s) => s.userName)
  const importedMaps = useStore((s) => s.importedMaps)
  const demoTourActive = useStore((s) => s.demoTourActive)
  const isDataSurvey = userRole === 'datasurvey'
  const isCorporatorOrCitizen = userRole === 'corporator' || userRole === 'citizen'
  const isDemoMap = userRegion === 'demo_ward' || demoTourActive || userName === 'Hon. Evaluation Jury' || userName === 'Judge Demo Mode'
  const hasRegionMap = Boolean(isDemoMap || (isCorporatorOrCitizen && (!userRegion || (importedMaps && importedMaps[userRegion]) || buildings.length > 0)))

  // ═══════════════════════════════════════════════════════
  // REGION MAP DISPLAY LOGIC
  // 1. Data & Survey Officer: Sees active survey buildings/parcels being created
  // 2. Corporator & Citizen: Sees imported region map OR any buildings placed/added in their ward!
  //    (Except Demo Mode which displays the full 3D Master Cadastre for judges)
  // 3. Builder: Sees city infrastructure masterplan
  // ═══════════════════════════════════════════════════════
  const visibleBuildings = isDataSurvey
    ? buildings.filter(b => b.isSurvey || b.sourceType === 'LiDAR' || b.sourceType === 'drone' || b.sourceType === 'OSM' || b.isOSM || b.autoAligned || b.isSurveyAsset)
    : isCorporatorOrCitizen
    ? (hasRegionMap ? buildings : buildings.filter(b => b.sourceType === 'LiDAR' || b.isLidarAsset || b.sourceType === 'OSM' || b.isOSM || b.isSurvey || b.isCorporatorAsset || b.id?.startsWith('UP')))
    : buildings

  const visibleInfrastructure = isDataSurvey
    ? infrastructure.filter(i => i.isSurvey || i.isUserCreated || i.id?.startsWith('infra-') || i.id?.startsWith('user-'))
    : isCorporatorOrCitizen
    ? (hasRegionMap ? infrastructure : infrastructure.filter(i => i.isSurvey || i.isUserCreated || i.id?.startsWith('infra-') || i.id?.startsWith('user-')))
    : infrastructure

  const visibleUndergroundFeatures = isDataSurvey
    ? undergroundFeatures.filter(f => f.isSurvey || f.isUserCreated || f.id?.startsWith('sub-asset-') || (f.id?.includes('-') && !['well-01', 'septic-01', 'bunker-01', 'watertank-01'].includes(f.id)))
    : isCorporatorOrCitizen
    ? (hasRegionMap ? undergroundFeatures : [])
    : undergroundFeatures

  const visibleParcels = isDataSurvey
    ? importedParcels
    : isCorporatorOrCitizen
    ? (hasRegionMap ? importedParcels : [])
    : importedParcels

  const visibleWaypoints = isDataSurvey || isCorporatorOrCitizen ? [] : waypoints

  const { camera, raycaster, pointer } = useThree()
  const groundPlane = useRef(new THREE.Plane(new THREE.Vector3(0, 1, 0), 0))
  const planeIntersect = useRef(new THREE.Vector3())

  const controlsRef = useRef()
  const isAnimating = useRef(false)
  const animTarget = useRef(new THREE.Vector3(0, 5, 0))
  const animPosition = useRef(new THREE.Vector3(40, 35, 40))
  const animStartCam = useRef(new THREE.Vector3())
  const animStartTarget = useRef(new THREE.Vector3())
  const animStartTime = useRef(0)
  const animDuration = 0.65 // Smooth 650ms transition

  const prevSelectedBuilding = useRef(null)
  const prevSelectedUnit = useRef(null)
  const prevViewMode = useRef(viewMode)
  const prevUndergroundMode = useRef(undergroundMode)

  // Find selected building data for camera focus
  const selectedBuildingData = buildings.find(b => b.id === selectedBuilding)
  let selectedUnitData = null
  if (selectedBuildingData && selectedUnit) {
    selectedUnitData = selectedBuildingData.units.find(u => u.ulpin === selectedUnit)
  }

  // Cancel programmatic camera animation immediately on any user interaction (scroll, drag, touch)
  useEffect(() => {
    const controls = controlsRef.current
    if (!controls) return

    const onUserInteraction = () => {
      isAnimating.current = false
    }

    controls.addEventListener('start', onUserInteraction)
    window.addEventListener('wheel', onUserInteraction, { passive: true })
    window.addEventListener('pointerdown', onUserInteraction, { passive: true })

    return () => {
      controls.removeEventListener('start', onUserInteraction)
      window.removeEventListener('wheel', onUserInteraction)
      window.removeEventListener('pointerdown', onUserInteraction)
    }
  }, [])

  // Detect selection change and start camera animation
  useEffect(() => {
    let shouldAnimate = false

    if (focusCameraOn) {
      const [fx, fy, fz, customDist] = focusCameraOn
      animTarget.current.set(fx, fy, fz)
      const dist = customDist || 48
      const camY = Math.max(fy + dist * 0.75, 36)
      animPosition.current.set(fx + dist * 0.7, camY, fz + dist * 0.7)
      shouldAnimate = true
      useStore.setState({ focusCameraOn: null })
    } else if (selectedUnit !== prevSelectedUnit.current) {
      prevSelectedUnit.current = selectedUnit
      if (selectedUnitData && selectedBuildingData) {
        // Focus closely on the specific unit
        const [bx, , bz] = selectedBuildingData.position
        
        // Calculate the exploded Y offset if view is exploded
        const height = selectedUnitData.zRange[1] - selectedUnitData.zRange[0]
        const baseY = selectedUnitData.zRange[0] + height / 2
        const floorIdx = selectedBuildingData.units.findIndex(u => u.ulpin === selectedUnit)
        const offset = (floorIdx - selectedBuildingData.units.length / 2) * 2
        const targetY = viewMode === 'exploded' ? baseY + offset : baseY

        animTarget.current.set(bx, targetY, bz)
        animPosition.current.set(bx + 18, targetY + 10, bz + 18)
        shouldAnimate = true
      }
    } else if (
      selectedBuilding !== prevSelectedBuilding.current ||
      (selectedBuilding && viewMode !== prevViewMode.current)
    ) {
      prevSelectedBuilding.current = selectedBuilding
      prevViewMode.current = viewMode

      if (selectedBuildingData) {
        const [bx, , bz] = selectedBuildingData.position
        const buildingHeight = (selectedBuildingData.actualFloors * 3) / 2
        animTarget.current.set(bx, buildingHeight, bz)
        // In exploded mode, provide comfortable framing (36m) so the entire vertical stack is visible
        const dist = viewMode === 'exploded' ? 36 : 26
        const camY = viewMode === 'exploded' ? buildingHeight + 20 : buildingHeight + 14
        animPosition.current.set(bx + dist, camY, bz + dist)
        shouldAnimate = true
      } else if (!selectedBuilding) {
        shouldAnimate = false
        isAnimating.current = false
      }
    } else if (undergroundMode !== prevUndergroundMode.current) {
      prevUndergroundMode.current = undergroundMode
      if (undergroundMode) {
        // Smoothly dive camera into subterranean layer
        animTarget.current.set(0, -6, 0)
        animPosition.current.set(28, -8, 28)
        shouldAnimate = true
      } else {
        // Ascend smoothly back to surface
        animTarget.current.set(0, 5, 0)
        animPosition.current.set(45, 38, 45)
        shouldAnimate = true
      }
    }

    if (shouldAnimate && controlsRef.current) {
      animStartCam.current.copy(controlsRef.current.object.position)
      animStartTarget.current.copy(controlsRef.current.target)
      animStartTime.current = performance.now()
      isAnimating.current = true
    }
  }, [selectedBuilding, selectedBuildingData, selectedUnit, selectedUnitData, viewMode, focusCameraOn, undergroundMode])

  useFrame(() => {
    if (controlsRef.current && isAnimating.current) {
      const elapsed = (performance.now() - animStartTime.current) / 1000
      const progress = Math.min(elapsed / animDuration, 1)

      // Smooth cubic ease-out: 1 - (1 - t)^3
      const ease = 1 - Math.pow(1 - progress, 3)

      controlsRef.current.target.lerpVectors(animStartTarget.current, animTarget.current, ease)
      controlsRef.current.object.position.lerpVectors(animStartCam.current, animPosition.current, ease)
      controlsRef.current.update()

      if (progress >= 1) {
        isAnimating.current = false
      }
    }

    // High-precision ground plane cursor tracking during site placement
    if (placingBuilding && placingBuilding.model) {
      raycaster.setFromCamera(pointer, camera)
      if (raycaster.ray.intersectPlane(groundPlane.current, planeIntersect.current)) {
        const gx = Math.max(-180, Math.min(180, Math.round(planeIntersect.current.x)))
        const gz = Math.max(-180, Math.min(180, Math.round(planeIntersect.current.z)))
        const curPos = placingBuilding.position || [0, 0]
        if (gx !== curPos[0] || gz !== curPos[1]) {
          const valid = checkCollision(gx, gz, placingBuilding.model)
          updatePlacementPosition(gx, gz, valid)
        }
      }
    }
  })

  // Check collision with existing buildings
  const checkCollision = useCallback((gx, gz, model) => {
    const relevantBuildings = isDataSurvey 
      ? buildings.filter(b => b.isSurvey || b.sourceType === 'LiDAR' || b.source_type === 'drone' || b.isLidarAsset)
      : buildings
    const mw = Number(model?.width) || 16
    const ml = Number(model?.length) || 14
    for (const b of relevantBuildings) {
      if (model?.id && b.id === model.id) continue
      if (model?.parcelId && b.parcelId === model.parcelId) continue
      if (model?.buildingName && b.name === model.buildingName) continue
      const [bx, , bz] = b.position
      const bw = b.footprint ? b.footprint[0] : (b.width || 14)
      const bl = b.footprint ? b.footprint[1] : (b.length || 12)
      if (Math.abs(gx - bx) < (mw + bw) / 2 + 0.8 && Math.abs(gz - bz) < (ml + bl) / 2 + 0.8) {
        return false // Overlap detected!
      }
    }
    return true
  }, [buildings, isDataSurvey])

  // Click on empty space or ground
  const handleBackgroundClick = useCallback((e) => {
    // Prevent accidental clicks during camera drag / orbit
    if (e.delta && e.delta > 3) return

    if (placingBuilding && placingBuilding.model) {
      e.stopPropagation()
      raycaster.setFromCamera(pointer, camera)
      if (raycaster.ray.intersectPlane(groundPlane.current, planeIntersect.current)) {
        const gx = Math.max(-180, Math.min(180, Math.round(planeIntersect.current.x)))
        const gz = Math.max(-180, Math.min(180, Math.round(planeIntersect.current.z)))
        const valid = checkCollision(gx, gz, placingBuilding.model)
        if (!valid) {
          useStore.getState().addAlert({
            type: 'danger',
            title: '⚠️ Placement Conflict',
            message: 'Cannot place building here! Site overlaps an existing building parcel.',
          })
          return
        }
        confirmBuildingPlacement([gx, gz])
      }
      return
    }

    if (infraDrawingActive && (corporatorMode === 'addInfra' || isDataSurvey)) {
      e.stopPropagation()
      const x = Math.round(e.point.x * 10) / 10
      const z = Math.round(e.point.z * 10) / 10
      const y = -Math.abs(Number(infraDraftDepth || 4))
      addInfraDraftPoint([x, y, z])
      return
    }

    if (e.object && e.object.geometry &&
        (e.object.geometry.type === 'PlaneGeometry' || e.object.geometry.type === 'RingGeometry')) {
      deselectAll()
    }
  }, [placingBuilding, checkCollision, updatePlacementPosition, infraDrawingActive, corporatorMode, isDataSurvey, infraDraftDepth, addInfraDraftPoint, deselectAll, raycaster, pointer, camera])

  const handleGroundPointerMove = useCallback((e) => {
    if (placingBuilding && e.point) {
      const gx = Math.round(e.point.x)
      const gz = Math.round(e.point.z)
      const valid = checkCollision(gx, gz, placingBuilding.model)
      updatePlacementPosition(gx, gz, valid)
    }
  }, [placingBuilding, checkCollision, updatePlacementPosition])

  const handleGroundPointerOver = () => {
    if (placingBuilding) {
      document.body.style.cursor = 'grab'
    } else if (infraDrawingActive && (corporatorMode === 'addInfra' || isDataSurvey)) {
      document.body.style.cursor = 'crosshair'
    }
  }

  const handleGroundPointerOut = () => {
    document.body.style.cursor = 'auto'
  }

  // Right-click building placement handler
  const handleGroundRightClick = useCallback((e) => {
    if (e && e.preventDefault) e.preventDefault()
    if (e && e.stopPropagation) e.stopPropagation()

    if (placingBuilding && placingBuilding.model) {
      raycaster.setFromCamera(pointer, camera)
      if (raycaster.ray.intersectPlane(groundPlane.current, planeIntersect.current)) {
        const gx = Math.max(-180, Math.min(180, Math.round(planeIntersect.current.x)))
        const gz = Math.max(-180, Math.min(180, Math.round(planeIntersect.current.z)))
        const valid = checkCollision(gx, gz, placingBuilding.model)
        if (!valid) {
          useStore.getState().addAlert({
            type: 'danger',
            title: '⚠️ Placement Conflict',
            message: 'Cannot place building here! Site overlaps an existing building parcel.',
          })
          return
        }
        confirmBuildingPlacement([gx, gz])
      }
    }
  }, [placingBuilding, checkCollision, confirmBuildingPlacement, raycaster, pointer, camera])

  const handleGroundPointerDown = useCallback((e) => {
    if (e.button === 2 && placingBuilding && placingBuilding.model) {
      handleGroundRightClick(e)
    }
  }, [handleGroundRightClick, placingBuilding])

  // Window-level context menu listener during building placement
  useEffect(() => {
    const onWindowContextMenu = (e) => {
      e.preventDefault()
      const state = useStore.getState()
      if (state.placingBuilding && state.placingBuilding.model) {
        raycaster.setFromCamera(pointer, camera)
        if (raycaster.ray.intersectPlane(groundPlane.current, planeIntersect.current)) {
          const gx = Math.max(-180, Math.min(180, Math.round(planeIntersect.current.x)))
          const gz = Math.max(-180, Math.min(180, Math.round(planeIntersect.current.z)))
          const valid = state.checkCollision(gx, gz, state.placingBuilding.model)
          if (!valid) {
            state.addAlert({
              type: 'danger',
              title: '⚠️ Placement Conflict',
              message: 'Cannot place building here! Site overlaps an existing building parcel.',
            })
            return
          }
          state.confirmBuildingPlacement([gx, gz])
        }
      }
    }
    window.addEventListener('contextmenu', onWindowContextMenu)
    return () => window.removeEventListener('contextmenu', onWindowContextMenu)
  }, [raycaster, pointer, camera])

  // Keyboard navigation (WASD / Arrow Keys for free map pan) + Escape to deselect
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.target.tagName === 'INPUT' || e.target.tagName === 'TEXTAREA' || e.target.tagName === 'SELECT') {
        return
      }

      if (e.key === 'Escape') {
        if (placingBuilding) {
          useStore.getState().cancelBuildingPlacement()
        } else {
          deselectAll()
        }
        return
      }

      const controls = controlsRef.current
      if (!controls) return

      const moveStep = 6
      const forward = new THREE.Vector3()
      camera.getWorldDirection(forward)
      forward.y = 0
      forward.normalize()

      const right = new THREE.Vector3()
      right.crossVectors(forward, new THREE.Vector3(0, 1, 0)).normalize()

      let moved = false
      if (e.key === 'ArrowUp' || e.key === 'w' || e.key === 'W') {
        controls.target.addScaledVector(forward, moveStep)
        camera.position.addScaledVector(forward, moveStep)
        moved = true
      } else if (e.key === 'ArrowDown' || e.key === 's' || e.key === 'S') {
        controls.target.addScaledVector(forward, -moveStep)
        camera.position.addScaledVector(forward, -moveStep)
        moved = true
      } else if (e.key === 'ArrowLeft' || e.key === 'a' || e.key === 'A') {
        controls.target.addScaledVector(right, -moveStep)
        camera.position.addScaledVector(right, -moveStep)
        moved = true
      } else if (e.key === 'ArrowRight' || e.key === 'd' || e.key === 'D') {
        controls.target.addScaledVector(right, moveStep)
        camera.position.addScaledVector(right, moveStep)
        moved = true
      }

      if (moved) {
        isAnimating.current = false
        controls.update()
      }
    }

    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [camera, deselectAll, placingBuilding])

  return (
    <>
      {/* Controls — Free zooming, horizontal pan across ground, and 360° navigation */}
      <OrbitControls
        ref={controlsRef}
        enableDamping
        dampingFactor={0.08}
        enablePan={true}
        panSpeed={1.4}
        screenSpacePanning={false}
        minDistance={undergroundMode ? 2 : 5}
        maxDistance={1200}
        maxPolarAngle={undergroundMode ? Math.PI : Math.PI / 2.05}
        minPolarAngle={0}
        mouseButtons={{
          LEFT: THREE.MOUSE.PAN,
          MIDDLE: THREE.MOUSE.DOLLY,
          RIGHT: placingBuilding ? null : THREE.MOUSE.ROTATE
        }}
        makeDefault
      />

      {/* Lighting — High clarity at both close-up and wide city zoom levels in Light Theme */}
      <ambientLight intensity={undergroundMode ? 0.65 : 0.88} />
      <directionalLight
        position={[150, 250, 100]}
        intensity={undergroundMode ? 0.45 : 1.3}
        castShadow
        shadow-mapSize-width={2048}
        shadow-mapSize-height={2048}
        shadow-camera-far={1200}
        shadow-camera-left={-500}
        shadow-camera-right={500}
        shadow-camera-top={500}
        shadow-camera-bottom={-500}
      />
      <directionalLight position={[-120, 160, -90]} intensity={0.65} />
      <hemisphereLight args={['#e0f2fe', '#f1f5f9', 0.85]} />

      {/* Fog — Adjusted for light map canvas so distant terrain matches light backdrop */}
      <fog attach="fog" args={[undergroundMode ? '#050c18' : '#f1f5f9', undergroundMode ? 80 : 1200, undergroundMode ? 350 : 4500]} />

      {/* Subterranean Point Light Illumination when Underground or X-Ray */}
      {(undergroundMode || xrayMode) && (
        <group>
          <pointLight position={[0, -8, 0]} intensity={xrayMode && !undergroundMode ? 1.8 : 2.6} distance={150} color="#06b6d4" />
          <pointLight position={[30, -12, 30]} intensity={xrayMode && !undergroundMode ? 1.2 : 1.8} distance={120} color="#3b82f6" />
          <pointLight position={[-30, -10, -30]} intensity={xrayMode && !undergroundMode ? 1.2 : 1.8} distance={120} color="#a855f7" />
        </group>
      )}

      {/* 3D Road Network (Expressways, Avenues & OpenStreetMap Streets) */}
      <RoadNetwork />

      {/* Ground */}
      <GroundGrid 
        onClick={handleBackgroundClick}
        onPointerMove={handleGroundPointerMove}
        onPointerOver={handleGroundPointerOver}
        onPointerOut={handleGroundPointerOut}
        onContextMenu={handleGroundRightClick}
        onPointerDown={handleGroundPointerDown}
      />

      {/* Rivers, streams, and water bodies imported from OpenStreetMap */}
      <WaterFeatures />

      {/* Parkland / greenery scattered between buildings and roads */}
      <Vegetation />

      {/* Live draft pipeline preview during interactive plotting */}
      <PipelineDraftPreview />

      {/* Interactive 3D Hologram Ghost Placement Preview */}
      {placingBuilding && <BuildingPlacementPreview />}

      {/* 2D Parcel Outlines from Data & Survey Officer imports */}
      {visibleParcels && visibleParcels.map(parcel => (
        <ParcelOutline
          key={parcel.id}
          parcel={parcel}
          isSelected={selectedParcel === parcel.id}
          onClick={() => setSelectedParcel(parcel.id)}
        />
      ))}

      {/* Buildings (Empty initially for Data & Survey Officer until placed) */}
      {visibleBuildings.map(building => (
        <Building key={building.id} building={building} />
      ))}

      {/* Existing infrastructure */}
      {visibleInfrastructure.map(infra => (
        <InfrastructureLine key={infra.id} infra={infra} />
      ))}

      {/* User-created infrastructure */}
      {userInfrastructure.map(infra => (
        <InfrastructureLine key={infra.id} infra={infra} isUserCreated />
      ))}

      {/* Underground features (wells, septic tanks) */}
      {visibleUndergroundFeatures.map(feature => (
        <UndergroundFeature key={feature.id} feature={feature} />
      ))}

      {/* Initial proposed route (before optimization) */}
      {builderResult && optimizationStatus === 'idle' && (
         <CandidateRoute 
            route={{
              name: 'CURRENT PROPOSAL',
              path: builderResult.path,
              clashes: builderResult.clashes,
              style: builderResult.isHighRisk ? 'danger' : 'warning'
            }} 
            isSelected={false} 
         />
      )}

      {/* Candidate Routes (during optimization) */}
      {candidateRoutes.map(route => (
        <CandidateRoute 
          key={route.id} 
          route={route} 
          isSelected={selectedCandidateId === route.id} 
        />
      ))}

      {/* Waypoints A, B, C, D */}
      {visibleWaypoints.map(wp => (
        <WaypointMarker key={wp.id} waypoint={wp} />
      ))}
    </>
  )
}
