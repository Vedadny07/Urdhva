import React, { useState } from 'react'
import useStore from '../store'
import { useTranslation } from '../utils/i18n'

export default function ClashReport({ infra, clashes }) {
  const { t } = useTranslation()
  const deselectAll = useStore((s) => s.deselectAll)
  const [showImpactReport, setShowImpactReport] = useState(false)

  const toggleImpactReport = () => {
    setShowImpactReport(!showImpactReport)
  }

  const uniqueOwners = [...new Set(clashes.map(c => c.owner))]
  const typeIcon = infra.type === 'metro_tunnel' ? '🚇' : '💧'

  return (
    <div className="space-y-4">
      {/* Header */}
      <div>
        <div className="flex items-center gap-2 mb-1">
          <span className="text-lg">{typeIcon}</span>
          <p className="text-xs text-slate-400 font-mono uppercase tracking-wider">{t('clash.infrastructure')}</p>
        </div>
        <h3 className="text-base font-bold text-slate-900">{infra.label}</h3>
        <p className="text-sm text-cyan-700 font-mono font-medium">{infra.id}</p>
      </div>

      {/* Clash counter */}
      {clashes.length > 0 ? (
        <div className="p-4 rounded-xl bg-red-50 border border-red-200 text-center shadow-2xs">
          <p className="text-3xl font-bold text-red-600">{uniqueOwners.length}</p>
          <p className="text-sm text-red-800 font-medium mt-1">{t('clash.rightsHoldersAffected')}</p>
          <p className="text-xs text-slate-500 mt-0.5">{t('clash.totalConflicts', { count: clashes.length })}</p>
        </div>
      ) : (
        <div className="p-4 rounded-xl bg-emerald-50 border border-emerald-200 text-center shadow-2xs">
          <p className="text-xl font-bold text-emerald-700">{t('clash.clear')}</p>
          <p className="text-sm text-emerald-800 mt-1">{t('clash.noClashes')}</p>
        </div>
      )}

      {/* Clash list */}
      {clashes.length > 0 && (
        <div className="space-y-2">
          <p className="text-xs text-slate-500 uppercase tracking-wider font-semibold">{t('clash.affectedUnits')}</p>
          {clashes.map((clash) => (
            <div
              key={clash.ulpin}
              className="p-3 rounded-lg bg-white border border-red-200 space-y-1 shadow-2xs"
            >
              <div className="flex items-center justify-between">
                <span className="text-sm font-bold text-slate-800">{clash.owner}</span>
                <span className="text-xs text-red-600 font-mono font-semibold">{clash.ulpin}</span>
              </div>
              <p className="text-xs text-slate-600">
                {clash.buildingName} — {clash.type === 'basement' ? t('common.basement') : t('common.parking')}
              </p>
              <p className="text-xs text-red-700 font-medium">
                {t('clash.conflictAtDepth', { from: clash.depthRange[0].toFixed(1), to: clash.depthRange[1].toFixed(1) })}
              </p>
            </div>
          ))}
        </div>
      )}

      {/* Impact Report */}
      {clashes.length > 0 && (
        <div>
          <button
            onClick={toggleImpactReport}
            className={`w-full px-4 py-2.5 text-sm font-semibold rounded-lg transition-all border flex items-center justify-center gap-2 cursor-pointer ${
              showImpactReport
                ? 'bg-red-50 text-red-700 border-red-300'
                : 'bg-white text-slate-700 hover:bg-slate-50 border-slate-300'
            }`}
          >
            {showImpactReport ? t('clash.hideReport') : t('clash.generateReport')}
          </button>

          {showImpactReport && (
            <div className="mt-3 impact-card space-y-3">
              <div className="flex items-center gap-2">
                <span className="text-red-600 text-lg">⚠</span>
                <h4 className="text-sm font-bold text-slate-900">{t('clash.impactReportTitle')}</h4>
              </div>
              <div className="text-xs text-slate-700 space-y-2">
                <p>
                  <strong className="text-slate-900">{t('clash.infrastructure')}:</strong> {infra.label} ({infra.type.replace('_', ' ')})
                </p>
                <p>
                  <strong className="text-slate-900">{t('clash.affectedParcels', { count: clashes.length, buildings: new Set(clashes.map(c => c.buildingId)).size })}</strong>
                </p>
                <p>
                  <strong className="text-slate-900">{t('clash.rightsHoldersNotif')}</strong>
                </p>
                <ul className="list-disc list-inside text-slate-600 pl-2">
                  {clashes.map(c => (
                    <li key={c.ulpin}>{c.owner} — {c.ulpin} (depth {c.depthRange[0].toFixed(1)}m to {c.depthRange[1].toFixed(1)}m)</li>
                  ))}
                </ul>
                <p className="text-amber-800 font-medium pt-1 bg-amber-50 p-2 rounded border border-amber-200">
                  {t('clash.recommendation')}
                </p>
              </div>
              <div className="flex items-center gap-2 pt-1 border-t border-red-200">
                <span className="text-xs text-slate-400">Generated {new Date().toLocaleDateString()}</span>
                <span className="text-xs text-slate-300">|</span>
                <span className="text-xs text-slate-500 font-mono">ULPIN Clash Detector v1.0</span>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Clear button */}
      <button
        onClick={deselectAll}
        className="w-full px-4 py-2 text-xs font-medium rounded-lg text-slate-500 hover:text-slate-800 hover:bg-slate-100 transition-all cursor-pointer"
      >
        {t('clash.clearClash')}
      </button>
    </div>
  )
}
