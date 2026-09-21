import React from 'react'
import useStore from '../store'
import { getFamilyColor } from '../utils/familyColors'
import { useTranslation } from '../utils/i18n'
import { Printer } from 'lucide-react'

export default function FloorDetail({ unit, building }) {
  const { t } = useTranslation()
  const deselectAll = useStore((s) => s.deselectAll)
  const selectUnit = useStore((s) => s.selectUnit)
  const selectedUnit = useStore((s) => s.selectedUnit)
  const userRole = useStore((s) => s.userRole)
  const openPropertyReceipt = useStore((s) => s.openPropertyReceipt)
  const isUnauthorized = unit.status === 'unauthorized'
  const dimensionsMismatch = unit.approvedDimensions &&
    JSON.stringify(unit.approvedDimensions) !== JSON.stringify(unit.actualDimensions) &&
    unit.approvedDimensions[0] !== 0

  const hasFamilies = unit.families && unit.families.length > 0

  const typeLabel = unit.type === 'basement' ? t('common.basement') :
    unit.type === 'parking' ? t('common.parking') :
    `${t('search.floor')} ${unit.floorNumber}`

  const typeIcon = unit.type === 'basement' ? '⬇️' :
    unit.type === 'parking' ? '🅿️' : '🏢'

  return (
    <div className="space-y-4">
      {/* Header */}
      <div>
        <div className="flex items-center gap-2 mb-1">
          <span className="text-lg">{typeIcon}</span>
          <p className="text-xs text-slate-400 font-mono uppercase tracking-wider">{typeLabel}</p>
        </div>
        <h3 className="text-base font-bold text-cyan-700 font-mono tracking-wide">{unit.ulpin}</h3>
        <p className="text-sm text-slate-600 mt-0.5 font-medium">{building.name}</p>
      </div>

      {/* Status */}
      <div>
        <span className={`badge ${isUnauthorized ? 'badge-unauthorized' : 'badge-approved'}`}>
          {isUnauthorized ? t('floor.unauthorized') : t('floor.approved')}
        </span>
      </div>

      {/* Smart Anomaly Explanation */}
      {isUnauthorized && (
        <div className="p-3.5 rounded-xl bg-red-50 border border-red-200 space-y-2.5 shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-red-700 flex items-center gap-1.5">
              <span>⚠️</span>
              <span>{t('floor.smartAnomaly')}</span>
            </span>
            <span className="text-[9px] font-mono px-2 py-0.5 rounded bg-red-100 border border-red-300 text-red-800 font-bold">
              {t('floor.fieldVerificationRequired')}
            </span>
          </div>

          <div className="space-y-1.5 text-[11px] font-mono text-slate-700">
            <div className="flex items-start gap-2">
              <span className="text-red-600 font-bold min-w-[70px]">{t('common.why')}:</span>
              <span className="text-slate-800">
                {building.actualFloors > building.approvedFloors
                  ? `Floor ${unit.floorNumber} exceeds sanctioned limit (${building.approvedFloors} floors permitted)`
                  : 'Floor footprint or vertical boundary exceeds municipal sanction'}
              </span>
            </div>
            <div className="flex items-start gap-2">
              <span className="text-amber-700 font-bold min-w-[70px]">{t('common.what')}:</span>
              <span className="text-slate-700">Compared 2D Cadastre Plan vs. 3D LiDAR Survey Twin</span>
            </div>
            <div className="flex items-start gap-2">
              <span className="text-cyan-700 font-bold min-w-[70px]">{t('common.where')}:</span>
              <span className="text-slate-800">{building.name} • {t('floor.elevation')} {unit.zRange[0]}m to {unit.zRange[1]}m</span>
            </div>
            {building.actualFloors > building.approvedFloors && (
              <div className="flex items-start gap-2">
                <span className="text-purple-700 font-bold min-w-[70px]">{t('common.deviation')}:</span>
                <span className="text-red-700 font-bold">
                  +{building.actualFloors - building.approvedFloors} floors (+{Math.round(((building.actualFloors - building.approvedFloors) / building.approvedFloors) * 100)}% over sanction)
                </span>
              </div>
            )}
          </div>

          <div className="pt-2 border-t border-red-200 flex items-center justify-between text-[10px] text-red-700">
            <span>Notice: MC-GEO-SEC-14</span>
            <span className="font-bold text-red-700">{t('info.escalated')}</span>
          </div>
        </div>
      )}

      {/* Ownership Details */}
      {unit.ownership && (
        <div className="space-y-3 bg-white p-3.5 rounded-xl border border-slate-200 shadow-2xs">
          <div className="flex items-center justify-between border-b border-slate-100 pb-2">
            <span className="text-xs text-slate-500 uppercase tracking-wider font-bold flex items-center gap-1.5">
              <span>📜</span>
              <span>{t('floor.ownershipDetails')}</span>
            </span>
            <span className={`px-2 py-0.5 rounded text-[10px] font-bold border font-mono ${
              unit.ownership.verificationStatus === 'Verified'
                ? 'bg-emerald-50 text-emerald-700 border-emerald-300'
                : unit.ownership.verificationStatus === 'Pending'
                ? 'bg-amber-50 text-amber-700 border-amber-300'
                : 'bg-red-50 text-red-700 border-red-300'
            }`}>
              ● {unit.ownership.verificationStatus}
            </span>
          </div>

          <div className="space-y-2 text-xs">
            <DetailRow
              label={t('floor.ownerName')}
              value={unit.ownership.ownerName}
            />
            <DetailRow
              label={t('floor.ownershipType')}
              value={unit.ownership.ownershipType}
            />
            <DetailRow
              label={t('floor.sharePercent')}
              value={`${unit.ownership.sharePercent}%`}
            />
            <DetailRow
              label={t('floor.regNo')}
              value={unit.ownership.registrationNo}
            />
            <DetailRow
              label={t('floor.mutationDate')}
              value={unit.ownership.mutationDate}
            />
            {unit.ownership.contact && (
              <DetailRow
                label={t('floor.contact')}
                value={unit.ownership.contact}
              />
            )}

            {/* Co-Owners List when there is more than 1 owner */}
            {unit.ownership.coOwners && unit.ownership.coOwners.length > 0 && (
              <div className="pt-2 border-t border-slate-100">
                <p className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider mb-1.5 flex items-center justify-between">
                  <span>{t('floor.coOwners')}</span>
                  <span className="font-mono text-purple-700 font-bold">{unit.ownership.coOwners.length}</span>
                </p>
                <div className="space-y-1.5">
                  {unit.ownership.coOwners.map((co, idx) => (
                    <div key={idx} className="flex items-center justify-between bg-slate-50 p-2 rounded-lg border border-slate-200">
                      <div className="flex items-center gap-1.5">
                        <span className="text-xs">👥</span>
                        <span className="font-semibold text-slate-800 text-xs">
                          {co.name}
                        </span>
                      </div>
                      <span className="font-mono text-purple-700 font-bold text-xs">
                        {co.sharePercent}%
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Spatial & Physical Specs */}
      <div className="space-y-3 bg-white p-3 rounded-xl border border-slate-200 shadow-2xs">
        <DetailRow label={t('floor.owner')} value={(userRole === 'corporator' || userRole === 'datasurvey') ? unit.owner : t('floor.masked')} />
        <DetailRow label={t('floor.depthRange')} value={`${unit.zRange[0]}m to ${unit.zRange[1]}m`} />
        <DetailRow label={t('floor.height')} value={`${unit.zRange[1] - unit.zRange[0]}m`} />

        {/* Dimensions comparison */}
        <div>
          <p className="text-xs text-slate-500 mb-1">{t('floor.dimensions')}</p>
          {unit.approvedDimensions && unit.approvedDimensions[0] > 0 && (
            <p className="text-sm text-slate-600 font-mono">
              Approved: {unit.approvedDimensions.join(' × ')}m
            </p>
          )}
          <p className={`text-sm font-mono ${dimensionsMismatch || isUnauthorized ? 'text-red-600 font-bold' : 'text-slate-700'}`}>
            Actual: {unit.actualDimensions.join(' × ')}m
            {(dimensionsMismatch || (isUnauthorized && unit.approvedDimensions[0] === 0)) && (
              <span className="ml-2 text-xs text-red-600">{t('floor.mismatch')}</span>
            )}
          </p>
        </div>
      </div>

      {/* Multi-Family Section */}
      {hasFamilies && userRole !== 'builder' && (
        <div>
          <div className="flex items-center justify-between mb-2">
            <p className="text-xs text-slate-500 uppercase tracking-wider font-semibold">
              {t('floor.residents', { count: unit.families.length })}
            </p>
          </div>
          <div className="space-y-1.5">
            {unit.families.map((family, i) => {
              const isFamilySelected = selectedUnit === family.ulpin
              return (
                <div
                  key={i}
                  onClick={() => selectUnit(family.ulpin)}
                  className={`p-2.5 rounded-lg transition-all cursor-pointer ${
                    isFamilySelected 
                      ? 'bg-cyan-50 border-2 border-cyan-500 shadow-sm' 
                      : 'bg-white border border-slate-200 hover:border-cyan-400'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <span
                        className="w-3.5 h-3.5 rounded-full flex-shrink-0 shadow-2xs"
                        style={{
                          backgroundColor: getFamilyColor(family, i),
                          boxShadow: `0 0 6px ${getFamilyColor(family, i)}50`,
                        }}
                      />
                      <span className="text-sm font-bold text-slate-800">
                        {(userRole === 'corporator' || userRole === 'datasurvey') ? family.name : '●●●●●●'}
                      </span>
                    </div>
                    <span className="text-xs font-mono text-cyan-700 font-bold">Unit {family.unit || family.flatNumber}</span>
                  </div>
                  <div className="flex items-center justify-between mt-1.5 pl-5 text-xs">
                    <span className="text-slate-500">{family.area ? `${family.area} m²` : '95 m²'}</span>
                    <span className={`px-1.5 py-0.5 rounded font-mono text-[10px] font-bold ${
                      family.type === 'Owner' 
                        ? 'bg-emerald-50 text-emerald-800 border border-emerald-300' 
                        : 'bg-blue-50 text-blue-800 border border-blue-300'
                    }`}>
                      ● {family.type || 'Owner'}
                    </span>
                  </div>
                  {family.ulpin && (
                    <div className="mt-1 pl-5 text-[10px] font-mono text-slate-500 flex items-center justify-between">
                      <span className="text-slate-400">3D ULPIN:</span>
                      <span className="text-emerald-700 font-bold">{family.ulpin}</span>
                    </div>
                  )}
                </div>
              )
            })}
          </div>
        </div>
      )}

      {/* Actions */}
      <div className="pt-2 space-y-2">
        <button
          onClick={() => useStore.getState().checkPropertyConflicts(unit.ulpin)}
          className="w-full px-4 py-2.5 text-sm font-bold rounded-lg bg-red-50 text-red-700 border border-red-200 hover:bg-red-100 hover:border-red-300 transition-all flex items-center justify-center gap-2 cursor-pointer shadow-2xs"
        >
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
            <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"/>
            <line x1="12" y1="9" x2="12" y2="13"/>
            <line x1="12" y1="17" x2="12.01" y2="17"/>
          </svg>
          {t('floor.checkConflicts')}
        </button>
        {userRole !== 'builder' && (
          <button
            onClick={() => openPropertyReceipt(unit, building)}
            className="w-full px-4 py-2.5 text-sm font-medium rounded-lg bg-white text-slate-700 hover:bg-slate-50 transition-all border border-slate-200 flex items-center justify-center gap-2 cursor-pointer shadow-2xs"
          >
            <Printer className="w-3.5 h-3.5 text-slate-500" />
            {t('floor.printReceipt')}
          </button>
        )}
        <button
          onClick={deselectAll}
          className="w-full px-4 py-2 text-xs font-medium rounded-lg text-slate-500 hover:text-slate-800 hover:bg-slate-100 transition-all cursor-pointer"
        >
          {t('floor.backOverview')}
        </button>
      </div>
    </div>
  )
}

function DetailRow({ label, value }) {
  return (
    <div className="flex justify-between items-baseline">
      <span className="text-xs text-slate-500">{label}</span>
      <span className="text-sm text-slate-800 font-mono font-medium">{value}</span>
    </div>
  )
}
