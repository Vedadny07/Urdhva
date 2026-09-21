import React, { useState } from 'react'
import useStore from '../store'
import FloorDetail from './FloorDetail'
import ClashReport from './ClashReport'
import InfraBuilder from './InfraBuilder'
import { useTranslation } from '../utils/i18n'
import { Trash2, MapPin, Check, X, Sliders, Box, Maximize2, Minimize2 } from 'lucide-react'

export default function InfoPanel() {
  const { t } = useTranslation()
  const [isMaximized, setIsMaximized] = useState(false)
  const selectedUnit = useStore((s) => s.selectedUnit)
  const selectedBuilding = useStore((s) => s.selectedBuilding)
  const selectedInfra = useStore((s) => s.selectedInfra)
  const clashResults = useStore((s) => s.clashResults)
  const buildings = useStore((s) => s.buildings)
  const infrastructure = useStore((s) => s.infrastructure)
  const userInfrastructure = useStore((s) => s.userInfrastructure)
  const builderMode = useStore((s) => s.builderMode)
  const userRole = useStore((s) => s.userRole)
  const placingBuilding = useStore((s) => s.placingBuilding)
  const confirmBuildingPlacement = useStore((s) => s.confirmBuildingPlacement)
  const cancelBuildingPlacement = useStore((s) => s.cancelBuildingPlacement)
  const updatePlacementPosition = useStore((s) => s.updatePlacementPosition)
  const checkCollision = useStore((s) => s.checkCollision)
  const userRegion = useStore((s) => s.userRegion)
  const userRegionZone = useStore((s) => s.userRegionZone)
  const cityRegions = useStore((s) => s.cityRegions) || []
  const sharedMaps = useStore((s) => s.sharedMaps) || []
  const geoPropertyContext = useStore((s) => s.geoPropertyContext)
  const setGeoLocation = useStore((s) => s.setGeoLocation)
  const clearGeoPropertyContext = useStore((s) => s.clearGeoPropertyContext)

  // Find selected unit data
  let unitData = null
  let buildingData = null
  if (selectedUnit) {
    for (const b of buildings) {
      const unit = b.units.find(u => u.ulpin === selectedUnit || u.families?.some(f => f.ulpin === selectedUnit))
      if (unit) {
        unitData = unit
        buildingData = b
        break
      }
    }
  } else if (selectedBuilding) {
    buildingData = buildings.find(b => b.id === selectedBuilding)
  }

  // Find selected infra
  const allInfra = [...infrastructure, ...userInfrastructure]
  const infraData = selectedInfra
    ? allInfra.find(i => i.id === selectedInfra)
    : null
    
  const roleLabels = {
    citizen: t('info.citizenInspector'),
    corporator: t('info.corporatorConsole'),
    builder: t('info.builderTools'),
  }

  const headerTitle = placingBuilding
    ? t('info.placementMode')
    : (roleLabels[userRole] || t('info.inspector'))

  return (
    <div data-floating-panel="true" className={isMaximized
      ? "fixed inset-4 md:inset-8 z-[9999] bg-white/98 backdrop-blur-2xl border-2 border-purple-400 rounded-2xl shadow-2xl flex flex-col pointer-events-auto overflow-hidden animate-in fade-in zoom-in-95 duration-150"
      : "h-full flex flex-col glass-panel border-l border-slate-200 overflow-hidden"
    }>
      {/* Panel header */}
      <div className="px-5 py-3.5 border-b border-slate-200 flex items-center justify-between bg-slate-50/50">
        <h2 className="text-sm font-bold text-slate-800 tracking-wide uppercase flex items-center gap-2">
          {placingBuilding ? (
            <span className="w-2.5 h-2.5 rounded-full bg-cyan-500 animate-ping" />
          ) : (
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="text-cyan-600">
              <circle cx="12" cy="12" r="10"/>
              <path d="M12 16v-4"/>
              <path d="M12 8h.01"/>
            </svg>
          )}
          <span>{headerTitle}</span>
          {isMaximized && <span className="text-purple-600 text-[10px] ml-1 font-mono font-bold">(MAXIMIZED VIEW)</span>}
        </h2>

        <button
          onClick={() => setIsMaximized(!isMaximized)}
          className="px-2 py-1 rounded-lg bg-white hover:bg-slate-100 text-slate-600 hover:text-slate-900 transition-colors border border-slate-300 flex items-center gap-1.5 text-xs cursor-pointer shadow-sm"
          title={isMaximized ? t('common.restore') : t('common.maximize')}
        >
          {isMaximized ? (
            <>
              <Minimize2 className="w-3.5 h-3.5 text-purple-600" />
              <span className="text-[10px] font-bold">{t('common.restore')}</span>
            </>
          ) : (
            <>
              <Maximize2 className="w-3.5 h-3.5 text-purple-600" />
              <span className="text-[10px] font-bold">{t('common.maximize')}</span>
            </>
          )}
        </button>
      </div>

      {/* Panel content */}
      <div className="flex-1 overflow-y-auto px-5 py-4 space-y-4">
        {geoPropertyContext && (
          <div className="rounded-xl border border-cyan-200 bg-cyan-50/70 p-3 shadow-sm">
            <div className="flex items-center justify-between gap-2">
              <div className="text-[10px] uppercase tracking-wider font-bold text-cyan-800">Geographic building handoff</div>
              <span className="text-[9px] font-mono text-cyan-700">{geoPropertyContext.sourceId || 'source unavailable'}</span>
            </div>
            <div className="text-xs font-bold text-slate-900 mt-1 truncate">{geoPropertyContext.name}</div>
            <div className="text-[9px] text-slate-600 mt-1 leading-relaxed">{geoPropertyContext.note}</div>
            <div className="grid grid-cols-2 gap-2 mt-2">
              <div className="rounded-lg bg-white border border-cyan-100 p-2"><div className="text-[9px] text-slate-400">Source</div><div className="text-[10px] font-semibold text-slate-800 truncate">{geoPropertyContext.source || 'Not available'}</div></div>
              <div className="rounded-lg bg-white border border-cyan-100 p-2"><div className="text-[9px] text-slate-400">Floors</div><div className="text-[10px] font-semibold text-slate-800">{geoPropertyContext.floors || 'Not available'}{geoPropertyContext.floors ? ` · ${geoPropertyContext.floorsStatus}` : ''}</div></div>
            </div>
            <div className="flex gap-2 mt-3">
              <button type="button" onClick={() => {
                const c = geoPropertyContext.coordinates || []
                if (Array.isArray(c) && c.length >= 2) setGeoLocation({ lat: Number(c[1]), lon: Number(c[0]), zoom: 17, pitch: 58, label: geoPropertyContext.name, type: 'building', source: geoPropertyContext.source })
                clearGeoPropertyContext()
              }} className="flex-1 px-2.5 py-1.5 rounded-lg bg-white border border-cyan-200 text-[9px] font-bold text-cyan-800 hover:bg-cyan-100 cursor-pointer">Return to City 3D</button>
              <button type="button" onClick={clearGeoPropertyContext} className="px-2.5 py-1.5 rounded-lg bg-white border border-slate-300 text-[9px] font-bold text-slate-700 hover:bg-slate-50 cursor-pointer">Clear</button>
            </div>
          </div>
        )}
        {userRegion && (
          <>
            <div className="bg-white border border-cyan-200 rounded-xl p-3 mb-4 shadow-sm">
              <div className="flex items-center gap-2 mb-2">
                <span className="text-base">📍</span>
                <span className="text-sm font-bold text-slate-800">{t('info.yourRegion')}: {cityRegions.find(r => r.id === userRegion)?.name || userRegion}</span>
              </div>
              <div className="flex flex-col gap-1.5">
                <span className="px-2 py-0.5 w-fit rounded-md bg-cyan-50 border border-cyan-200 text-[10px] font-mono text-cyan-700 font-bold uppercase">
                  {cityRegions.find(r => r.id === userRegion)?.zone || userRegionZone || 'Unknown'} {t('info.zone')}
                </span>
                <div className="text-xs text-slate-600 mt-0.5">
                  <span className="text-slate-400">{t('info.wardCorporator')}: </span>
                  <span className="font-semibold text-cyan-700">{cityRegions.find(r => r.id === userRegion)?.corporator || t('info.pendingAssignment')}</span>
                </div>
              </div>
            </div>

            {(() => {
              const sharedMap = sharedMaps.find(m => m.toRegion === userRegion)
              if (sharedMap) {
                return (
                  <div className="bg-emerald-50/70 border border-emerald-200 rounded-xl p-3 mb-4 shadow-sm">
                    <p className="text-xs font-bold text-emerald-800 mb-2">
                      {t('info.mapAvailable', { region: cityRegions.find(r => r.id === userRegion)?.name || userRegion })}
                    </p>
                    <div className="flex gap-2">
                      <span className="px-2 py-1 bg-white rounded border border-emerald-200 text-[10px] font-mono text-emerald-700 font-semibold shadow-2xs">
                        {t('info.buildingCount', { count: sharedMap.buildingsCount || 0 })}
                      </span>
                      <span className="px-2 py-1 bg-white rounded border border-emerald-200 text-[10px] font-mono text-emerald-700 font-semibold shadow-2xs">
                        {t('info.parcelCount', { count: sharedMap.parcelsCount || 0 })}
                      </span>
                    </div>
                  </div>
                )
              }
              return (
                <div className="bg-slate-50 border border-slate-200 rounded-xl p-3 mb-4 shadow-2xs">
                  <p className="text-xs font-medium text-slate-500">
                    {t('info.mapPending')}
                  </p>
                </div>
              )
            })()}
          </>
        )}

        {/* If user is placing building, show dedicated Site Placement Workbench */}
        {placingBuilding ? (
          <BuildingPlacementWorkbench
            placing={placingBuilding}
            onConfirm={() => confirmBuildingPlacement()}
            onCancel={cancelBuildingPlacement}
            onNudge={(dx, dz) => {
              const [curX, curZ] = placingBuilding.position || [0, 0]
              const nx = curX + dx
              const nz = curZ + dz
              const valid = checkCollision(nx, nz, placingBuilding.model)
              updatePlacementPosition(nx, nz, valid)
              useStore.setState({ focusCameraOn: [nx, 8, nz] })
            }}
          />
        ) : selectedInfra && infraData ? (
          <ClashReport infra={infraData} clashes={clashResults} />
        ) : unitData ? (
          <FloorDetail unit={unitData} building={buildingData} />
        ) : buildingData ? (
          <BuildingOverview building={buildingData} />
        ) : builderMode && userRole !== 'citizen' ? (
          <InfraBuilder />
        ) : (
          <EmptyState />
        )}

        {/* Always show builder button at bottom when not already in builder mode, placing, or viewing something */}
        {userRole !== 'citizen' && !builderMode && !placingBuilding && !selectedInfra && !unitData && !buildingData && (
          <div className="pt-2 border-t border-slate-200">
            <InfraBuilder />
          </div>
        )}
      </div>
    </div>
  )
}

function BuildingPlacementWorkbench({ placing, onConfirm, onCancel, onNudge }) {
  const { t } = useTranslation()
  const model = placing?.model || {}
  const position = placing?.position || [0, 0]
  const isValid = placing?.isValid ?? true
  const [posX, posZ] = position
  const floors = Number(model?.floorsDetected || model?.floors) || 6
  const heightM = (floors * 3.0).toFixed(1)
  const shape = model?.shape || 'rectangle'
  const width = model?.width || 16
  const length = model?.length || 14
  const parking = model?.undergroundParkingDetected || 2

  return (
    <div className="space-y-4 animate-in fade-in">
      {/* Title Card */}
      <div className="p-3.5 rounded-xl bg-cyan-50 border border-cyan-200 space-y-2 shadow-sm">
        <div className="flex items-center justify-between">
          <span className="text-xs font-bold text-cyan-800 flex items-center gap-1.5">
            <MapPin className="w-4 h-4 text-cyan-600" />
            <span>{t('info.activePlacement')}</span>
          </span>
          <span className={`text-[10px] font-mono px-2 py-0.5 rounded font-bold border ${
            isValid 
              ? 'bg-emerald-100 text-emerald-800 border-emerald-300' 
              : 'bg-red-100 text-red-800 border-red-300'
          }`}>
            {isValid ? t('info.validSite') : t('info.collision')}
          </span>
        </div>
        <h3 className="text-base font-bold text-slate-900 tracking-wide">
          {model.buildingName || 'UAV Reconstructed High-Rise'}
        </h3>
        <p className="text-xs text-slate-600 leading-relaxed">
          {t('info.placementHint')}
        </p>
      </div>

      {/* Reconstructed Specs */}
      <div className="p-3 rounded-lg bg-white border border-slate-200 space-y-2 shadow-2xs">
        <span className="text-[11px] font-bold text-slate-700 flex items-center gap-1.5">
          <Box className="w-3.5 h-3.5 text-cyan-600" />
          <span>{t('info.synthesizedDims')}</span>
        </span>
        <div className="grid grid-cols-2 gap-2 text-xs font-mono">
          <div className="p-2 rounded bg-slate-50 border border-slate-200">
            <span className="text-[9px] text-slate-500 block">{t('info.shape')}</span>
            <span className="text-purple-700 font-bold uppercase">{shape}</span>
          </div>
          <div className="p-2 rounded bg-slate-50 border border-slate-200">
            <span className="text-[9px] text-slate-500 block">{t('info.totalFloors')}</span>
            <span className="text-cyan-700 font-bold">{floors}F (+{heightM}m)</span>
          </div>
          <div className="p-2 rounded bg-slate-50 border border-slate-200">
            <span className="text-[9px] text-slate-500 block">{t('info.parcelFootprint')}</span>
            <span className="text-slate-800 font-bold">{width}m × {length}m</span>
          </div>
          <div className="p-2 rounded bg-slate-50 border border-slate-200">
            <span className="text-[9px] text-slate-500 block">{t('info.basementDecks')}</span>
            <span className="text-amber-700 font-bold">{parking} Underground</span>
          </div>
        </div>
      </div>

      {/* Real-Time Coordinates & Precision Nudge */}
      <div className="p-3 rounded-lg bg-white border border-slate-200 space-y-2.5 shadow-2xs">
        <div className="flex items-center justify-between">
          <span className="text-[11px] font-bold text-slate-700 flex items-center gap-1.5">
            <Sliders className="w-3.5 h-3.5 text-cyan-600" />
            <span>{t('info.mapCoords')}</span>
          </span>
          <span className="text-[10px] font-mono text-cyan-700 font-bold">
            X: {posX}m | Z: {posZ}m
          </span>
        </div>

        {/* Nudge Buttons */}
        <div className="grid grid-cols-3 gap-1.5 text-xs font-mono">
          <div />
          <button
            type="button"
            onClick={() => onNudge(0, -5)}
            className="py-1.5 px-2 rounded bg-slate-100 hover:bg-slate-200 text-slate-700 text-center font-bold border border-slate-300"
          >
            ↑ -Z (North)
          </button>
          <div />
          <button
            type="button"
            onClick={() => onNudge(-5, 0)}
            className="py-1.5 px-2 rounded bg-slate-100 hover:bg-slate-200 text-slate-700 text-center font-bold border border-slate-300"
          >
            ← -X (West)
          </button>
          <div className="flex items-center justify-center text-[10px] text-slate-500 font-bold">
            5m Step
          </div>
          <button
            type="button"
            onClick={() => onNudge(5, 0)}
            className="py-1.5 px-2 rounded bg-slate-100 hover:bg-slate-200 text-slate-700 text-center font-bold border border-slate-300"
          >
            +X (East) →
          </button>
          <div />
          <button
            type="button"
            onClick={() => onNudge(0, 5)}
            className="py-1.5 px-2 rounded bg-slate-100 hover:bg-slate-200 text-slate-700 text-center font-bold border border-slate-300"
          >
            ↓ +Z (South)
          </button>
          <div />
        </div>
      </div>

      {/* Confirmation & Cancel Action Buttons */}
      <div className="space-y-2 pt-1">
        <button
          type="button"
          onClick={onConfirm}
          disabled={!isValid}
          className={`w-full py-3 px-4 rounded-xl font-bold text-sm flex items-center justify-center gap-2 transition-all shadow-md ${
            isValid
              ? 'bg-gradient-to-r from-emerald-600 via-teal-600 to-cyan-600 hover:from-emerald-700 hover:to-cyan-700 text-white shadow-emerald-500/20 transform hover:scale-[1.01] active:scale-[0.99] cursor-pointer'
              : 'bg-slate-200 text-slate-400 cursor-not-allowed border border-slate-300'
          }`}
        >
          <Check className="w-4 h-4 text-white" />
          <span>{isValid ? t('info.confirmPlacement') : t('info.cannotPlace')}</span>
        </button>

        <button
          type="button"
          onClick={onCancel}
          className="w-full py-2 px-3 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs border border-slate-300 flex items-center justify-center gap-1.5 transition-colors cursor-pointer"
        >
          <X className="w-3.5 h-3.5 text-slate-500" />
          <span>{t('info.cancelPlacement')}</span>
        </button>
      </div>
    </div>
  )
}

function BuildingOverview({ building }) {
  const { t } = useTranslation()
  const userRole = useStore((s) => s.userRole)

  if (!building) return null

  const units = building.units || []
  const footprint = building.footprint || [12, 12]

  const isViolation = (building.actualFloors || 0) > (building.approvedFloors || 0) ||
    (building.actualDepth || 0) < (building.approvedDepth || 0)

  // Count total families
  const totalFamilies = units.reduce((sum, unit) => {
    return sum + (unit.families ? unit.families.length : 0)
  }, 0)

  return (
    <div className="space-y-4">
      <div>
        <div className="flex items-center justify-between">
          <p className="text-xs text-slate-400 font-mono uppercase tracking-wider">{t('info.buildingTitle')}</p>
          {/* Data Source & Confidence Tag */}
          <div className="flex items-center gap-1.5">
            {building.sourceType === 'LiDAR' || building.source_type === 'LiDAR' || building.id?.includes('LIDAR') ? (
              <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-emerald-50 border border-emerald-300 text-emerald-800 font-bold flex items-center gap-1 shadow-2xs">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-ping" />
                <span>🟢 LiDAR Point Cloud (99.4%)</span>
              </span>
            ) : building.sourceType === 'drone' || building.source_type === 'drone' ? (
              <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-cyan-50 border border-cyan-300 text-cyan-800 font-bold flex items-center gap-1 shadow-2xs">
                <span>🛸 Drone Photogrammetry (98.2%)</span>
              </span>
            ) : (
              <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-slate-100 border border-slate-300 text-slate-700 font-medium">
                <span>📋 Cadastral Master Record</span>
              </span>
            )}
          </div>
        </div>
        <h3 className="text-lg font-bold text-slate-900 mt-1">{building.name}</h3>
        <p className="text-sm text-cyan-700 font-mono font-medium">{building.id}</p>
      </div>

      {/* Cadastral Verification Metadata */}
      <div className="p-2.5 rounded-lg bg-white border border-slate-200 text-xs font-mono space-y-1 shadow-2xs">
        <div className="flex justify-between text-slate-700 text-[11px]">
          <span className="text-slate-400">{t('info.dataSource')}:</span>
          <span className="text-cyan-700 font-bold">
            {building.sourceType === 'LiDAR' ? 'LiDAR 3D Point Cloud' : building.sourceType === 'drone' ? 'UAV Drone AI Mesh' : 'Municipal Cadastre Title'}
          </span>
        </div>
        <div className="flex justify-between text-slate-700 text-[11px]">
          <span className="text-slate-400">{t('info.verificationConfidence')}:</span>
          <span className="text-emerald-700 font-bold">
            {building.confidence ? `${Math.round(building.confidence * 100)}%` : '99.1% (High Fidelity)'}
          </span>
        </div>
        <div className="flex justify-between text-slate-700 text-[11px]">
          <span className="text-slate-400">{t('info.auditStatus')}:</span>
          <span className={isViolation ? "text-red-600 font-bold" : "text-emerald-700 font-bold"}>
            {isViolation ? t('info.deviationFlagged') : t('info.verifiedCompliant')}
          </span>
        </div>
      </div>

      {/* Smart Anomaly Explanation */}
      {isViolation && (
        <div className="p-3.5 rounded-xl bg-red-50 border border-red-200 space-y-2 shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-red-700 flex items-center gap-1.5">
              <span>⚠️</span>
              <span>{t('info.smartAnomaly')}</span>
            </span>
            <span className="text-[9px] font-mono px-2 py-0.5 rounded bg-red-100 border border-red-300 text-red-800 font-bold">
              {t('info.fieldVerificationRequired')}
            </span>
          </div>

          <div className="space-y-1 text-[11px] font-mono text-slate-700">
            <div className="flex items-start gap-1.5">
              <span className="text-red-600 font-bold min-w-[75px]">{t('common.why')}:</span>
              <span className="text-slate-800">
                {(building.actualFloors || 0) > (building.approvedFloors || 0)
                  ? `Physical construction (${building.actualFloors}F) exceeds sanctioned master plan (${building.approvedFloors}F)`
                  : 'Subterranean basement excavation breaches sanctioned depth limit'}
              </span>
            </div>
            <div className="flex items-start gap-1.5">
              <span className="text-amber-700 font-bold min-w-[75px]">{t('common.what')}:</span>
              <span className="text-slate-700">Municipal Sanction Plan vs. 3D Digital Twin Scan</span>
            </div>
            <div className="flex items-start gap-1.5">
              <span className="text-cyan-700 font-bold min-w-[75px]">{t('common.where')}:</span>
              <span className="text-slate-800">
                {(building.actualFloors || 0) > (building.approvedFloors || 0)
                  ? `Floors ${(building.approvedFloors || 0) + 1} through ${building.actualFloors}`
                  : `Depth ${(building.actualDepth || 0)}m (approved ${(building.approvedDepth || 0)}m)`}
              </span>
            </div>
            <div className="flex items-start gap-1.5">
              <span className="text-purple-700 font-bold min-w-[75px]">{t('common.deviation')}:</span>
              <span className="text-red-700 font-bold">
                {(building.actualFloors || 0) > (building.approvedFloors || 0)
                  ? `+${(building.actualFloors || 0) - (building.approvedFloors || 0)} Unauthorized Floors (+${Math.round((((building.actualFloors || 0) - (building.approvedFloors || 0)) / (building.approvedFloors || 1)) * 100)}%)`
                  : `${((building.actualDepth || 0) - (building.approvedDepth || 0)).toFixed(1)}m Unauthorized Excavation`}
              </span>
            </div>
          </div>

          <div className="pt-2 border-t border-red-200 flex items-center justify-between text-[10px] text-red-700">
            <span>{t('info.notice')}: RERA Sec 11 / MC-SEC-14</span>
            <span className="font-bold text-red-700">{t('info.escalated')}</span>
          </div>
        </div>
      )}

      <div className="grid grid-cols-2 gap-3">
        <InfoCard label={t('info.floors')} value={`${building.actualFloors || 0}`} warn={(building.actualFloors || 0) > (building.approvedFloors || 0)} />
        <InfoCard label={t('info.shape')} value={(building.shape || 'rectangle').toUpperCase()} />
        <InfoCard label={t('info.footprint')} value={`${footprint[0]}×${footprint[1]}m`} />
        <InfoCard label={t('info.depth')} value={`${building.actualDepth || 0}m`} warn={(building.actualDepth || 0) < (building.approvedDepth || 0)} />
        <InfoCard label={t('info.units')} value={`${units.length}`} />
        <InfoCard label={t('info.families')} value={`${totalFamilies}`} />
        <InfoCard label={t('info.groundArea')} value={`${Math.round(footprint[0] * footprint[1])} m²`} />
        <InfoCard label={t('info.type')} value={units.some(u => u.families?.some(f => {
          const areaNum = typeof f.area === 'number' ? f.area : parseFloat(String(f.area || '0'));
          return areaNum > 2000;
        })) ? t('info.commercial') : t('info.residential')} />
      </div>

      <div className="pt-2">
        <p className="text-xs text-slate-500 mb-2">{t('info.clickFloorHint')}</p>
      </div>

      {/* Quick Dive Underground Button */}
      <div className="pt-2">
        <button
          onClick={() => useStore.getState().toggleUndergroundMode()}
          className={`w-full px-3 py-2 rounded-xl text-xs font-bold border transition-all flex items-center justify-center gap-2 cursor-pointer shadow-sm ${
            useStore.getState().undergroundMode
              ? 'bg-cyan-50 text-cyan-800 border-cyan-300 shadow-cyan-500/10'
              : 'bg-white hover:bg-slate-50 text-cyan-700 border-slate-200'
          }`}
        >
          <span>{useStore.getState().undergroundMode ? '🏙️' : '🚇'}</span>
          <span>{useStore.getState().undergroundMode ? t('info.returnToSurface') : t('info.goUndergroundInspect')}</span>
        </button>
      </div>

      {(userRole === 'corporator' || userRole === 'datasurvey') && (
        <div className="pt-3 border-t border-slate-200">
          <button
            onClick={() => {
              if (window.confirm(t('info.deleteBuildingConfirm', { name: building.name, id: building.id }))) {
                useStore.getState().deleteBuilding(building.id);
              }
            }}
            className="w-full px-3 py-2 rounded-lg bg-red-50 hover:bg-red-100 text-red-700 border border-red-200 text-xs font-bold transition-all flex items-center justify-center gap-1.5 shadow-2xs cursor-pointer"
          >
            <Trash2 className="w-3.5 h-3.5 text-red-600" />
            {t('info.deleteBuilding')}
          </button>
        </div>
      )}
    </div>
  )
}

function InfoCard({ label, value, warn }) {
  return (
    <div className={`p-3 rounded-lg shadow-2xs ${warn ? 'bg-red-50 border border-red-200' : 'bg-white border border-slate-200'}`}>
      <p className="text-xs text-slate-500 font-medium">{label}</p>
      <p className={`text-lg font-bold mt-0.5 ${warn ? 'text-red-600' : 'text-slate-800'}`}>{value}</p>
    </div>
  )
}

function EmptyState() {
  const { t } = useTranslation()
  const undergroundMode = useStore((s) => s.undergroundMode)
  const toggleUndergroundMode = useStore((s) => s.toggleUndergroundMode)

  return (
    <div className="h-full flex flex-col items-center justify-center text-center px-4 min-h-[300px]">
      <div className="w-16 h-16 rounded-2xl bg-slate-100 border border-slate-200 flex items-center justify-center mb-4 shadow-sm">
        <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className="text-slate-400">
          <path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z"/>
          <polyline points="3.27 6.96 12 12.01 20.73 6.96"/>
          <line x1="12" y1="22.08" x2="12" y2="12"/>
        </svg>
      </div>
      <p className="text-sm text-slate-700 font-bold">{t('info.noSelection')}</p>
      <p className="text-xs text-slate-500 mt-1 leading-relaxed max-w-[240px]">
        {t('info.noSelectionDesc')}
      </p>

      {/* Prominent Go Underground Button for Citizen/Inspector */}
      <div className="mt-4 w-full max-w-[240px]">
        <button
          onClick={toggleUndergroundMode}
          className={`w-full px-3 py-2 rounded-xl text-xs font-bold border transition-all flex items-center justify-center gap-2 cursor-pointer shadow-sm ${
            undergroundMode
              ? 'bg-cyan-50 text-cyan-800 border-cyan-300 shadow-cyan-500/10'
              : 'bg-white hover:bg-slate-50 text-cyan-700 border-slate-300'
          }`}
        >
          <span>{undergroundMode ? '🏙️' : '🚇'}</span>
          <span>{undergroundMode ? t('info.returnToSurface') : t('info.goUndergroundInspect')}</span>
        </button>
      </div>

      <div className="mt-5 space-y-1.5 text-xs text-slate-500 font-medium text-left bg-slate-50 p-3 rounded-xl border border-slate-200/80 w-full max-w-[280px]">
        <p>{t('info.hintExplode')}</p>
        <p>{t('info.hintBanner')}</p>
        <p>{t('info.hintFloor')}</p>
        <p>{t('info.hintPipe')}</p>
      </div>
    </div>
  )
}
