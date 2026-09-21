import React, { useEffect, useState, Component } from 'react'
import { Canvas } from '@react-three/fiber'
import Scene from './three/Scene'
import TopBar from './components/TopBar'
import InfoPanel from './components/InfoPanel'
import Geographic3DMap from './components/Geographic3DMap'
import GeographicInspector from './components/GeographicInspector'
import LoginPage from './components/LoginPage'
import IntroScreen from './components/IntroScreen'
import CorporatorPanel from './components/CorporatorPanel'
import DataSurveyPanel from './components/DataSurveyPanel'
import DemoTour from './components/DemoTour'
import PropertyReceipt from './components/PropertyReceipt'
import useStore from './store'
import { useTranslation } from './utils/i18n'
import { Info, ChevronDown } from 'lucide-react'

class ErrorBoundary extends Component {
  constructor(props) {
    super(props)
    this.state = { hasError: false, error: null }
  }
  static getDerivedStateFromError(error) {
    return { hasError: true, error }
  }
  componentDidCatch(error, info) {
    console.error('ErrorBoundary captured error:', error, info)
  }
  render() {
    if (this.state.hasError) {
      return (
        <div className="p-4 rounded-lg bg-red-50 border border-red-200 text-red-700 m-4 text-xs space-y-2">
          <p className="font-bold text-sm text-red-800">View Reset Required</p>
          <p>{this.state.error?.message || 'A visual component encountered an issue.'}</p>
          <button
            onClick={() => this.setState({ hasError: false, error: null })}
            className="px-3 py-1 bg-red-600 hover:bg-red-700 text-white rounded text-xs font-semibold cursor-pointer"
          >
            Recover View
          </button>
        </div>
      )
    }
    return this.props.children
  }
}

export default function App() {
  const { t } = useTranslation()
  // ── ALL HOOKS FIRST (Rules of Hooks — no hooks after a conditional return) ─
  const [introComplete, setIntroComplete] = useState(false)

  // All store subscriptions must be at the top level, always called
  const loginDirect = useStore((s) => s.login)
  const setBuildings = useStore((s) => s.setBuildings)
  const setInfrastructure = useStore((s) => s.setInfrastructure)
  const setUndergroundFeatures = useStore((s) => s.setUndergroundFeatures)
  const setWaypoints = useStore((s) => s.setWaypoints)
  const userRole = useStore((s) => s.userRole)
  const infraDrawingActive = useStore((s) => s.infraDrawingActive)
  const corporatorMode = useStore((s) => s.corporatorMode)
  const infraDraftPoints = useStore((s) => s.infraDraftPoints)
  const infraDraftType = useStore((s) => s.infraDraftType)
  const infraDraftDepth = useStore((s) => s.infraDraftDepth)
  const undoLastInfraDraftPoint = useStore((s) => s.undoLastInfraDraftPoint)
  const clearInfraDraftPoints = useStore((s) => s.clearInfraDraftPoints)
  const placingBuilding = useStore((s) => s.placingBuilding)
  const confirmBuildingPlacement = useStore((s) => s.confirmBuildingPlacement)
  const cancelBuildingPlacement = useStore((s) => s.cancelBuildingPlacement)
  const undergroundMode = useStore((s) => s.undergroundMode)
  const xrayMode = useStore((s) => s.xrayMode)
  const addNewInfrastructure = useStore((s) => s.addNewInfrastructure)
  const userRegion = useStore((s) => s.userRegion)
  const userName = useStore((s) => s.userName)
  const cityRegions = useStore((s) => s.cityRegions)
  const sharedMaps = useStore((s) => s.sharedMaps)
  const importedMaps = useStore((s) => s.importedMaps)
  const importReceivedMap = useStore((s) => s.importReceivedMap)
  const demoTourActive = useStore((s) => s.demoTourActive)
  const geographicMode = useStore((s) => s.geographicMode)

  // Legend auto-collapses to a small icon by default so it doesn't
  // permanently compete for bottom-left space with the Survey Console /
  // Inspector CTAs; it opens automatically while X-Ray or Underground mode
  // is active. `legendManualOverride` lets the user pin it open/closed —
  // any override resets back to automatic the next time X-Ray/Underground
  // mode changes.
  const [legendManualOverride, setLegendManualOverride] = useState(null)
  useEffect(() => {
    setLegendManualOverride(null)
  }, [xrayMode, undergroundMode])
  const legendAutoOpen = xrayMode || undergroundMode
  const legendOpen = legendManualOverride !== null ? legendManualOverride : legendAutoOpen

  const isDemoActive = demoTourActive || userName === 'Hon. Evaluation Jury' || userName === 'Judge Demo Mode' || userRegion === 'demo_ward'

  const regionInfo = userRegion ? cityRegions?.find(r => r.id === userRegion) : null
  const hasImportedMap = Boolean(isDemoActive || (userRegion && importedMaps && importedMaps[userRegion]))
  const pendingMapForCorporator = userRole === 'corporator' && userRegion && !isDemoActive
    ? [...(sharedMaps || [])].reverse().find(m => m.targetRegion === userRegion && m.status === 'pending')
    : null

  // Load data from FastAPI backend or fallback to local files
  useEffect(() => {
    async function loadData() {
      try {
        const [bRes, iRes, ufRes] = await Promise.all([
          fetch('/api/buildings').then(r => r.ok ? r.json() : Promise.reject()),
          fetch('/api/infrastructure').then(r => r.ok ? r.json() : Promise.reject()),
          fetch('/api/underground-features').then(r => r.ok ? r.json() : Promise.reject()),
        ])

        if (bRes && bRes.buildings && bRes.buildings.length > 0) {
          setBuildings(bRes.buildings)
          setInfrastructure(iRes.infrastructure || [])
          setUndergroundFeatures(ufRes.undergroundFeatures || [])

          // Load default waypoints
          const wpRes = await fetch('/data/buildings.json').then(r => r.json()).catch(() => ({}))
          if (wpRes.waypoints) setWaypoints(wpRes.waypoints)
          return
        }
      } catch (e) {
        console.info('FastAPI not reachable directly or empty, loading local cadastre data...', e)
      }

      // Fallback
      Promise.all([
        fetch('/data/buildings.json').then(r => r.json()),
        fetch('/data/infrastructure.json').then(r => r.json()),
      ]).then(([buildingsData, infraData]) => {
        setBuildings(buildingsData.buildings)
        setInfrastructure(infraData.infrastructure)
        if (buildingsData.undergroundFeatures) {
          setUndergroundFeatures(buildingsData.undergroundFeatures)
        }
        if (buildingsData.waypoints) {
          setWaypoints(buildingsData.waypoints)
        }
      }).catch(err => {
        console.error('Failed to load mock data:', err)
      })
    }

    loadData()
  }, [setBuildings, setInfrastructure, setUndergroundFeatures, setWaypoints])

  // Real-time multi-tab synchronization for sharedMaps & importedMaps
  useEffect(() => {
    const handleStorage = (e) => {
      if (e.key === 'urdhva_shared_maps_v5' && e.newValue) {
        try {
          useStore.setState({ sharedMaps: JSON.parse(e.newValue) })
        } catch (_) { }
      }
      if (e.key === 'urdhva_imported_maps_v5' && e.newValue) {
        try {
          useStore.setState({ importedMaps: JSON.parse(e.newValue) })
        } catch (_) { }
      }
    }
    window.addEventListener('storage', handleStorage)
    return () => window.removeEventListener('storage', handleStorage)
  }, [])
  // ── END OF HOOKS ────────────────────────────────────────────────────────────

  // ── Intro gate — safe to use after all hooks ────────────────────────────────
  const handleIntroComplete = (roleId) => {
    setIntroComplete(true)
    if (roleId === 'builder' || roleId === 'datasurvey') {
      loginDirect(roleId)
    }
  }

  if (!introComplete) {
    return <IntroScreen onComplete={handleIntroComplete} />
  }
  // ───────────────────────────────────────────────────────────────────────────

  if (!userRole) {
    return <LoginPage />
  }

  return (
    <div className="w-screen h-screen flex flex-col bg-slate-50 overflow-hidden">
      {/* Top Bar */}
      <TopBar />

      {/* Main content */}
      <div className="flex-1 min-h-0 flex pt-[48px]">
        {/* Main 3D workspace — geographic city explorer OR existing property 3D */}
        <div className="flex-[7] min-h-0 min-w-0 relative">
          {geographicMode ? (
            <ErrorBoundary>
              <Geographic3DMap />
            </ErrorBoundary>
          ) : (
            <ErrorBoundary>
              <Canvas
                shadows
                camera={{
                  position: [50, 45, 50],
                  fov: 45,
                  near: 0.1,
                  far: 2500,
                }}
                gl={{
                  antialias: true,
                  toneMapping: 3,
                  toneMappingExposure: 1.0,
                }}
                style={{ background: '#f8fafc' }}
                onContextMenu={(e) => e.preventDefault()}
              >
                <Scene />
              </Canvas>
            </ErrorBoundary>
          )}

          {/* Corporator overlay panel */}
          <CorporatorPanel />
          <DataSurveyPanel />
          <DemoTour />

          {/* ── 1. INCOMING 3D MAP NOTIFICATION FOR CORPORATOR (WITH PERMANENT IMPORT BUTTON) ── */}
          {userRole === 'corporator' && pendingMapForCorporator && (
            <div className="absolute top-4 left-1/2 -translate-x-1/2 z-30 pointer-events-auto flex items-center gap-3.5 px-5 py-3 rounded-2xl bg-white/98 border-2 border-emerald-500 shadow-xl backdrop-blur-2xl text-slate-800 select-none animate-in fade-in">
              <div className="w-10 h-10 rounded-xl bg-emerald-50 border border-emerald-300 flex items-center justify-center text-xl flex-shrink-0 animate-bounce">
                📬
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <span className="w-2 h-2 rounded-full bg-emerald-500 animate-ping" />
                  <span className="text-xs font-bold text-slate-900">
                    {hasImportedMap ? 'New Updated' : 'New'} 3D Map Received for {regionInfo?.name || userRegion}!
                  </span>
                </div>
                <p className="text-[11px] text-slate-600 mt-0.5">
                  Data & Survey Officer dispatched <strong>{pendingMapForCorporator.buildingCount || 0} 3D Buildings</strong> and <strong>{pendingMapForCorporator.parcelCount || 0} Parcels</strong>.
                </p>
              </div>
              <button
                type="button"
                onClick={() => importReceivedMap(pendingMapForCorporator.id)}
                className="ml-2 px-4 py-2 rounded-xl bg-gradient-to-r from-emerald-600 via-teal-600 to-cyan-600 hover:from-emerald-500 hover:to-cyan-500 text-white font-bold text-xs shadow-md shadow-emerald-500/30 cursor-pointer transition-all active:scale-95 whitespace-nowrap"
              >
                📥 {hasImportedMap ? 'Import & Update 3D Map' : 'Import to My 3D Map'}
              </button>
            </div>
          )}

          {/* ── 2. BLANK 3D MAP NOTICE FOR CORPORATOR (WHEN NO MAP SENT YET) ── */}
          {userRole === 'corporator' && !hasImportedMap && !pendingMapForCorporator && (
            <div className="absolute top-4 left-1/2 -translate-x-1/2 z-20 pointer-events-none px-4 py-2.5 rounded-xl bg-white/95 border border-purple-300 shadow-lg backdrop-blur-xl text-center text-slate-800 select-none">
              <p className="text-xs font-bold text-purple-700 flex items-center justify-center gap-1.5">
                <span>📭</span>
                <span>No 3D Map Received Yet</span>
              </p>
              <p className="text-[11px] text-slate-600 mt-0.5">
                The Data & Survey Officer has not sent a 3D map for <strong>{regionInfo?.name || userRegion}</strong> yet.
              </p>
              <p className="text-[10px] text-slate-400 font-mono mt-0.5">
                3D Canvas is blank until a survey is dispatched to Corporator {userName}.
              </p>
            </div>
          )}

          {/* ── 3. CITIZEN NOTICE (WHEN REGION MAP PENDING) ── */}
          {userRole === 'citizen' && !hasImportedMap && (
            <div className="absolute top-4 left-1/2 -translate-x-1/2 z-20 pointer-events-none px-4 py-2 rounded-xl bg-white/95 border border-cyan-300 text-center text-slate-800 backdrop-blur-md select-none shadow-md">
              <p className="text-xs font-bold text-cyan-800">📍 {regionInfo?.name || userRegion} • Citizen Portal</p>
              <p className="text-[11px] text-slate-500 mt-0.5">No 3D map available for this region yet. Awaiting municipal survey submission.</p>
            </div>
          )}

          {/* Interactive Pipeline Plotting Top HUD Banner */}
          {infraDrawingActive && (corporatorMode === 'addInfra' || userRole === 'datasurvey') && (
            <div className="absolute top-4 left-1/2 -translate-x-1/2 z-30 pointer-events-auto flex items-center gap-3 px-4 py-2 rounded-xl bg-white/95 border-2 border-orange-400 shadow-lg backdrop-blur-md text-slate-800 text-xs select-none animate-in fade-in">
              <div className="flex items-center gap-2 font-bold text-orange-700">
                <span className="w-2.5 h-2.5 rounded-full bg-orange-500 animate-ping" />
                <span>{infraDraftType === 'gas_line' ? '🔥 Gas Pipeline Plotter' : '🔧 Subterranean Pipeline Plotter'}</span>
              </div>
              <div className="h-4 w-px bg-slate-300" />
              <div className="text-slate-600 text-[11px]">
                {infraDraftPoints.length === 0 ? (
                  <span>Click anywhere on 3D map ground to place <strong>Point 1</strong></span>
                ) : infraDraftPoints.length === 1 ? (
                  <span><strong>1 point</strong> placed. Click map to connect first segment</span>
                ) : (
                  <span><strong>{infraDraftPoints.length} points</strong> connected at <strong>-{infraDraftDepth}m</strong> below ground</span>
                )}
              </div>
              {infraDraftPoints.length > 0 && (
                <div className="flex items-center gap-1.5 ml-1">
                  <button
                    onClick={undoLastInfraDraftPoint}
                    className="px-2 py-1 rounded bg-slate-100 hover:bg-slate-200 text-slate-700 text-[10px] font-bold transition-colors border border-slate-300 cursor-pointer"
                    title="Undo last point"
                  >
                    ↺ Undo
                  </button>
                  <button
                    onClick={clearInfraDraftPoints}
                    className="px-2 py-1 rounded bg-red-50 hover:bg-red-100 text-red-700 border border-red-200 text-[10px] font-bold transition-colors cursor-pointer"
                    title="Clear all points"
                  >
                    Clear
                  </button>
                  {infraDraftPoints.length >= 2 && (
                    <button
                      onClick={() => {
                        addNewInfrastructure({
                          type: infraDraftType,
                          label: `${infraDraftType === 'gas_line' ? 'Natural Gas Grid' : 'Subsurface Line'} (${infraDraftPoints.length} Pts)`,
                          path: infraDraftPoints,
                          radius: 0.5,
                          depth: infraDraftDepth
                        })
                      }}
                      className="px-2.5 py-1 rounded bg-orange-600 hover:bg-orange-500 text-white font-bold text-[10px] shadow-sm transition-all cursor-pointer"
                    >
                      ✓ Deploy ({infraDraftPoints.length} pts)
                    </button>
                  )}
                </div>
              )}
            </div>
          )}

          {/* Interactive Building Site Placement Top HUD Banner */}
          {placingBuilding && (
            <div className="absolute top-4 left-1/2 -translate-x-1/2 z-30 pointer-events-auto flex items-center gap-3 px-4 py-2.5 rounded-xl bg-white/98 border-2 border-cyan-400 shadow-xl backdrop-blur-md text-slate-800 text-xs select-none animate-in fade-in">
              <div className="flex items-center gap-2 font-bold text-cyan-800">
                <span className="w-2.5 h-2.5 rounded-full bg-cyan-500 animate-ping" />
                <span>🏗️ Site Placement: {placingBuilding.model?.buildingName || 'Synthesized Tower'}</span>
              </div>
              <div className="h-4 w-px bg-slate-300" />
              <div className="text-slate-600 text-[11px] font-mono">
                <span>
                  {placingBuilding.model?.floorsDetected || placingBuilding.model?.floors?.length || placingBuilding.model?.floors || 6} Floors • {
                    placingBuilding.model?.shapeTitle
                      ? placingBuilding.model.shapeTitle
                      : (placingBuilding.model?.sourceType === 'LiDAR' || placingBuilding.model?.isLidarAsset)
                        ? 'LiDAR Multi-Tier Profile (Podium + Tower + Penthouse)'
                        : (placingBuilding.model?.shape || 'CAD Model').toUpperCase()
                  } • X: {placingBuilding.position?.[0] ?? 0}m, Z: {placingBuilding.position?.[1] ?? 0}m
                </span>
              </div>
              <span className="px-2 py-0.5 rounded bg-cyan-50 text-cyan-800 font-mono text-[10px] border border-cyan-300">
                🖱️ Left Click Ground or 'Confirm' to Place • Drag to Move Map
              </span>
              <div className="flex items-center gap-2 ml-2">
                <span className={`px-2 py-0.5 rounded text-[10px] font-bold border ${placingBuilding.isValid ? 'bg-emerald-50 border-emerald-300 text-emerald-800' : 'bg-red-50 border-red-300 text-red-800'}`}>
                  {placingBuilding.isValid ? '✅ Clear Site' : '⚠️ Collision Overlap'}
                </span>
                <button
                  onClick={cancelBuildingPlacement}
                  className="px-2.5 py-1 rounded bg-slate-100 hover:bg-slate-200 text-slate-700 text-[10px] font-bold transition-colors border border-slate-300 cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  onClick={() => confirmBuildingPlacement()}
                  disabled={!placingBuilding.isValid}
                  className={`px-3 py-1 rounded text-white font-bold text-[10px] transition-all flex items-center gap-1 ${placingBuilding.isValid
                      ? 'bg-gradient-to-r from-cyan-600 to-blue-600 hover:from-cyan-500 hover:to-blue-500 shadow-md shadow-cyan-500/20 cursor-pointer'
                      : 'bg-slate-200 text-slate-400 border border-slate-300 cursor-not-allowed'
                    }`}
                >
                  ✓ Confirm Placement
                </button>
              </div>
            </div>
          )}

          {/* Bottom-left: collapsible Legend (auto-expands during X-Ray /
              Underground mode; the standalone "Go Underground" pill that
              used to live here was removed — that action already exists in
              the TopBar and as the Inspector CTA in InfoPanel) */}
          <div className="absolute bottom-4 left-4 flex flex-col gap-2 z-10 pointer-events-auto">
            {legendOpen ? (
              <div data-floating-panel="true" className="glass-panel rounded-lg p-3 text-xs space-y-1.5 shadow-md w-48">
                <div className="flex items-center justify-between mb-1">
                  <p className="text-slate-400 font-bold text-[10px] uppercase tracking-wider">{t('common.legend')}</p>
                  <button
                    onClick={() => setLegendManualOverride(false)}
                    title="Collapse legend"
                    className="p-0.5 rounded hover:bg-slate-200 text-slate-400 hover:text-slate-700 transition-colors cursor-pointer"
                  >
                    <ChevronDown className="w-3.5 h-3.5" />
                  </button>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 rounded-sm border border-slate-300" style={{ background: '#cbd5e1' }}></div>
                  <span className="text-slate-700 font-medium">{t('common.basement')}</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 rounded-sm border border-slate-300" style={{ background: '#94a3b8' }}></div>
                  <span className="text-slate-700 font-medium">{t('common.parking')}</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 rounded-sm" style={{ background: '#10b981' }}></div>
                  <span className="text-slate-700 font-medium">{t('common.approvedFloor')}</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 rounded-sm" style={{ background: '#ef4444' }}></div>
                  <span className="text-slate-700 font-medium">{t('common.unauthorized')}</span>
                </div>
                <div className="flex items-center gap-2 pt-1 border-t border-slate-200">
                  <div className="w-3 h-3 rounded-sm opacity-80" style={{ background: '#3b82f6' }}></div>
                  <span className="text-slate-700 font-medium">{t('common.metroTunnel')}</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 rounded-sm opacity-80" style={{ background: '#f97316' }}></div>
                  <span className="text-slate-700 font-medium">{t('common.utilityLine')}</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 rounded-full opacity-80" style={{ background: '#06b6d4' }}></div>
                  <span className="text-slate-700 font-medium">{t('common.wellFeature')}</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 rounded-full border-2 border-cyan-500"></div>
                  <span className="text-slate-700 font-medium">{t('common.waypoint')}</span>
                </div>
              </div>
            ) : (
              <button
                onClick={() => setLegendManualOverride(true)}
                title={t('common.legend')}
                data-floating-panel="true"
                className="w-9 h-9 rounded-full glass-panel shadow-md flex items-center justify-center text-slate-500 hover:text-cyan-700 hover:bg-cyan-50 transition-colors cursor-pointer"
              >
                <Info className="w-4 h-4" />
              </button>
            )}
          </div>

          {/* Bottom-right instructions */}
          <div data-floating-panel="true" className="absolute bottom-4 right-[30%] glass-panel rounded-lg px-3 py-2 text-xs text-slate-500 select-none shadow-md">
            <span className="text-cyan-700 font-bold">{t('common.navHelp.moveMap')}:</span> {t('common.navHelp.moveDesc')} · <span className="text-purple-700 font-bold">{t('common.navHelp.rotate')}:</span> {t('common.navHelp.rotateDesc')} · <span className="text-slate-600 font-bold">{t('common.navHelp.zoom')}:</span> {t('common.navHelp.zoomDesc')} · <span className="text-slate-600 font-bold">{t('common.navHelp.escape')}:</span> {t('common.navHelp.escapeDesc')}
          </div>
        </div>

        {/* Inspector — 30% */}
        <div className="flex-[3] min-w-[300px] max-w-[420px] min-h-0 h-full overflow-hidden">
          <ErrorBoundary>
            {geographicMode ? <GeographicInspector /> : <InfoPanel />}
          </ErrorBoundary>
        </div>
      </div>

      {/* Printable ULPIN Property Receipt — global modal, opened from
          SearchBar's dropdown or InfoPanel's unit detail section */}
      <PropertyReceipt />
    </div>
  )
}
