import React, { useState, useRef, useEffect } from 'react'
import useStore from '../store'
import SearchBar from './SearchBar'
import { useTranslation, LANGUAGES } from '../utils/i18n'
import {
  Globe, ChevronDown, LogOut, Microscope, Eye, TrainFront, Building2,
  Box, Diamond, RotateCcw, Play, SlidersHorizontal, X, MapPin
} from 'lucide-react'

export default function TopBar() {
  const { t, language, setLanguage } = useTranslation()
  const [langMenuOpen, setLangMenuOpen] = useState(false)
  const [viewMenuOpen, setViewMenuOpen] = useState(false)
  const langMenuRef = useRef(null)
  const viewMenuRef = useRef(null)

  const viewMode = useStore((s) => s.viewMode)
  const selectedBuilding = useStore((s) => s.selectedBuilding)
  const buildings = useStore((s) => s.buildings)
  const infrastructure = useStore((s) => s.infrastructure)
  const userInfrastructure = useStore((s) => s.userInfrastructure)
  const builderMode = useStore((s) => s.builderMode)
  const toggleViewMode = useStore((s) => s.toggleViewMode)
  const deselectAll = useStore((s) => s.deselectAll)
  const openBuilder = useStore((s) => s.openBuilder)
  const closeBuilder = useStore((s) => s.closeBuilder)

  const userRole = useStore((s) => s.userRole)
  const logout = useStore((s) => s.logout)
  const startDemoTour = useStore((s) => s.startDemoTour)
  const corporatorMode = useStore((s) => s.corporatorMode)
  const setCorporatorMode = useStore((s) => s.setCorporatorMode)
  const corporatorConsoleOpen = useStore((s) => s.corporatorConsoleOpen)
  const setCorporatorConsoleOpen = useStore((s) => s.setCorporatorConsoleOpen)
  const corporatorConsoleMinimized = useStore((s) => s.corporatorConsoleMinimized)
  const dataSurveyConsoleOpen = useStore((s) => s.dataSurveyConsoleOpen)
  const setDataSurveyConsoleOpen = useStore((s) => s.setDataSurveyConsoleOpen)
  const dataSurveyConsoleMinimized = useStore((s) => s.dataSurveyConsoleMinimized)
  const setDataSurveyConsoleMinimized = useStore((s) => s.setDataSurveyConsoleMinimized)
  const alerts = useStore((s) => s.alerts) || []
  const undergroundMode = useStore((s) => s.undergroundMode)
  const toggleUndergroundMode = useStore((s) => s.toggleUndergroundMode)
  const xrayMode = useStore((s) => s.xrayMode)
  const toggleXrayMode = useStore((s) => s.toggleXrayMode)
  const userRegion = useStore((s) => s.userRegion)
  const userName = useStore((s) => s.userName)
  const cityRegions = useStore((s) => s.cityRegions)
  const geographicMode = useStore((s) => s.geographicMode)
  const setGeographicMode = useStore((s) => s.setGeographicMode)

  const regionInfo = userRegion ? cityRegions.find(r => r.id === userRegion) : null

  // Click outside to close dropdown menus
  useEffect(() => {
    function handleClickOutside(e) {
      if (langMenuRef.current && !langMenuRef.current.contains(e.target)) {
        setLangMenuOpen(false)
      }
      if (viewMenuRef.current && !viewMenuRef.current.contains(e.target)) {
        setViewMenuOpen(false)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  const roleColors = {
    citizen: 'text-cyan-700 bg-cyan-50 border-cyan-300',
    corporator: 'text-purple-700 bg-purple-50 border-purple-300',
    builder: 'text-orange-700 bg-orange-50 border-orange-300',
    datasurvey: 'text-emerald-700 bg-emerald-50 border-emerald-300',
  }

  const roleLabels = {
    citizen: t('roles.citizen'),
    corporator: t('roles.corporator'),
    builder: t('roles.builder'),
    datasurvey: t('roles.datasurvey'),
  }

  const roleColor = roleColors[userRole] || roleColors.citizen
  const roleLabel = roleLabels[userRole] || t('roles.guest')

  const currentLang = LANGUAGES.find(l => l.code === language) || LANGUAGES[0]

  const handleResetMap = () => {
    if (window.confirm(t('topbar.resetConfirm'))) {
      useStore.getState().resetCadastre();
    }
    setViewMenuOpen(false)
  }

  const activeSecondaryCount = [xrayMode, undergroundMode, viewMode === 'exploded'].filter(Boolean).length

  return (
    <div data-floating-panel="true" className="absolute top-0 left-0 right-0 z-50 glass-panel px-4 sm:px-6 py-2 sm:py-2.5 flex flex-wrap items-center justify-between gap-y-2 border-b border-slate-200">
      {/* Title */}
      <div className="flex items-center gap-3 min-w-0 shrink-0">
        <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-cyan-500 to-teal-600 flex items-center justify-center shadow-sm shadow-cyan-500/20 shrink-0">
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
            <path d="M12 2L2 7l10 5 10-5-10-5z"/>
            <path d="M2 17l10 5 10-5"/>
            <path d="M2 12l10 5 10-5"/>
          </svg>
        </div>
        <div className="min-w-0">
          <h1 className="text-base font-bold tracking-tight text-slate-800 flex items-center gap-1.5 whitespace-nowrap">
            {t('common.appName')} <span className="text-cyan-600 font-semibold">—</span> <span className="text-slate-500 font-normal text-xs hidden sm:inline">{t('common.subTitle')}</span>
          </h1>
        </div>
        <div className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider border ${roleColor} ml-1 shrink-0`}>
          {roleLabel}
        </div>
        {regionInfo && (
          <div className="hidden md:flex items-center gap-1.5 ml-1 shrink-0">
            <MapPin className="w-3 h-3 text-slate-400" />
            <span className="text-[10px] text-slate-600 font-medium whitespace-nowrap">{regionInfo.name}</span>
            {userName && userName !== 'Citizen' && (
              <span className="text-[10px] text-slate-400 whitespace-nowrap">• {userName}</span>
            )}
          </div>
        )}
      </div>

      {/* Center Search Bar — unified property/ULPIN + geographic location search */}
      <div className="hidden md:flex flex-1 justify-center min-w-0 px-2 order-3 lg:order-none basis-full lg:basis-auto">
        <div className="flex items-center gap-1.5">
          <SearchBar />
          <button
            type="button"
            onClick={() => setGeographicMode(!geographicMode)}
            title={geographicMode ? 'Return to detailed Property 3D' : 'Open India Geographic 3D'}
            className={`shrink-0 px-2.5 py-2 rounded-xl border text-[10px] font-bold flex items-center gap-1.5 transition-all cursor-pointer ${geographicMode ? 'bg-cyan-100 text-cyan-900 border-cyan-300 shadow-sm' : 'bg-white text-slate-700 border-slate-300 hover:bg-slate-50'}`}
          >
            <Globe className="w-3.5 h-3.5" />
            <span className="hidden xl:inline">{geographicMode ? 'Property 3D' : 'City 3D'}</span>
          </button>
        </div>
      </div>

      {/* Center status */}
      <div className="hidden xl:flex items-center gap-2 text-xs text-slate-500 font-medium shrink-0">
        <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></div>
        <span className="whitespace-nowrap">{t('topbar.buildingsCount', { count: buildings.length })}</span>
        <span className="text-slate-300 mx-1">|</span>
        <span className="whitespace-nowrap">{t('topbar.infrastructureCount', { count: infrastructure.length + userInfrastructure.length })}</span>
        {userInfrastructure.length > 0 && (
          <>
            <span className="text-slate-300 mx-1">|</span>
            <span className="text-cyan-600 font-semibold whitespace-nowrap">{t('topbar.userBuiltCount', { count: userInfrastructure.length })}</span>
          </>
        )}
      </div>

      {/* Controls */}
      <div className="flex items-center flex-wrap justify-end gap-1.5 gap-y-1.5 min-w-0">
        {selectedBuilding && (
          <button
            onClick={deselectAll}
            className="shrink-0 whitespace-nowrap px-3 py-1.5 text-xs font-medium rounded-lg bg-slate-100 text-slate-700 hover:bg-slate-200 transition-all border border-slate-300 cursor-pointer"
          >
            {t('topbar.collapse')}
          </button>
        )}

        {userRole === 'corporator' && (
          <button
            onClick={() => {
              if (corporatorConsoleOpen && !corporatorConsoleMinimized) {
                setCorporatorConsoleOpen(false);
              } else {
                setCorporatorConsoleOpen(true);
                setCorporatorConsoleMinimized(false);
                if (!corporatorMode) setCorporatorMode('addBuilding');
              }
            }}
            className={`shrink-0 whitespace-nowrap px-3 py-1.5 text-xs font-semibold rounded-lg transition-all border flex items-center gap-1.5 cursor-pointer ${
              corporatorConsoleOpen && !corporatorConsoleMinimized
                ? 'bg-purple-100 text-purple-800 border-purple-300 shadow-sm'
                : 'bg-slate-100 text-slate-700 border-slate-300 hover:bg-slate-200'
            }`}
          >
            {t('topbar.corporatorTools')}
            {alerts.length > 0 && (
              <span className="bg-red-500 text-white text-[10px] px-1.5 py-0.5 rounded-full ml-1">
                {alerts.length}
              </span>
            )}
          </button>
        )}

        {userRole === 'datasurvey' && (
          <button
            onClick={() => {
              if (dataSurveyConsoleOpen && !dataSurveyConsoleMinimized) {
                setDataSurveyConsoleMinimized(true);
              } else {
                setDataSurveyConsoleOpen(true);
                setDataSurveyConsoleMinimized(false);
              }
            }}
            className={`shrink-0 whitespace-nowrap px-3 py-1.5 text-xs font-semibold rounded-lg transition-all border flex items-center gap-1.5 cursor-pointer ${
              dataSurveyConsoleOpen && !dataSurveyConsoleMinimized
                ? 'bg-emerald-100 text-emerald-800 border-emerald-300 shadow-sm'
                : 'bg-slate-100 text-slate-700 border-slate-300 hover:bg-slate-200'
            }`}
          >
            {t('topbar.surveyConsole')}
          </button>
        )}

        {userRole !== 'citizen' && userRole !== 'datasurvey' && (
          <button
            onClick={builderMode ? closeBuilder : openBuilder}
            className={`shrink-0 whitespace-nowrap px-3 py-1.5 text-xs font-semibold rounded-lg transition-all border-2 flex items-center gap-1.5 cursor-pointer ${
              builderMode
                ? 'bg-orange-500 text-white border-orange-500 shadow-sm'
                : 'bg-white text-orange-700 border-orange-300 hover:bg-orange-50'
            }`}
          >
            <Building2 className="w-3.5 h-3.5" />
            {t('topbar.builder')}
          </button>
        )}

        <div className="hidden lg:block w-px h-5 bg-slate-200 shrink-0" />

        {/* ── View controls dropdown (X-Ray / Underground / Exploded / Reset) ── */}
        <div className="relative shrink-0" ref={viewMenuRef}>
          <button
            onClick={() => setViewMenuOpen(!viewMenuOpen)}
            className={`whitespace-nowrap px-3 py-1.5 text-xs font-semibold rounded-lg transition-all border flex items-center gap-1.5 cursor-pointer ${
              activeSecondaryCount > 0
                ? 'bg-cyan-100 text-cyan-900 border-cyan-400 shadow-sm'
                : 'bg-slate-100 text-slate-700 border-slate-300 hover:bg-slate-200'
            }`}
          >
            <SlidersHorizontal className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">{t('topbar.view')}</span>
            {activeSecondaryCount > 0 && (
              <span className="bg-cyan-600 text-white text-[10px] px-1.5 py-0.5 rounded-full">
                {activeSecondaryCount}
              </span>
            )}
            <ChevronDown className="w-3 h-3" />
          </button>

          {viewMenuOpen && (
            <div className="absolute right-0 top-full mt-1.5 w-56 bg-white border border-slate-200 rounded-xl shadow-lg py-1.5 z-50 animate-in fade-in zoom-in-95">
              <div className="px-3 py-1 text-[10px] font-bold text-slate-400 uppercase tracking-wider border-b border-slate-100 mb-1">
                {t('topbar.viewControls')}
              </div>

              <button
                onClick={() => { toggleXrayMode(); setViewMenuOpen(false) }}
                className={`w-full px-3 py-2 text-left text-xs font-medium flex items-center gap-2 transition-colors cursor-pointer ${
                  xrayMode ? 'bg-amber-50 text-amber-900' : 'text-slate-700 hover:bg-slate-50'
                }`}
              >
                {xrayMode ? <Eye className="w-3.5 h-3.5 text-amber-600" /> : <Microscope className="w-3.5 h-3.5 text-amber-600" />}
                <span>{t('topbar.xray')}</span>
                {xrayMode && <span className="ml-auto text-[9px] font-bold text-amber-700 uppercase">{t('topbar.on') || 'On'}</span>}
              </button>

              <button
                onClick={() => { toggleUndergroundMode(); setViewMenuOpen(false) }}
                className={`w-full px-3 py-2 text-left text-xs font-medium flex items-center gap-2 transition-colors cursor-pointer ${
                  undergroundMode ? 'bg-cyan-50 text-cyan-900' : 'text-slate-700 hover:bg-slate-50'
                }`}
              >
                {undergroundMode ? <Building2 className="w-3.5 h-3.5 text-cyan-600" /> : <TrainFront className="w-3.5 h-3.5 text-cyan-600" />}
                <span>{undergroundMode ? t('topbar.surfaceView') : t('topbar.goUnderground')}</span>
                {undergroundMode && <span className="ml-auto text-[9px] font-bold text-cyan-700 uppercase">{t('topbar.on') || 'On'}</span>}
              </button>

              <button
                onClick={() => { toggleViewMode(); setViewMenuOpen(false) }}
                className={`w-full px-3 py-2 text-left text-xs font-medium flex items-center gap-2 transition-colors cursor-pointer ${
                  viewMode === 'exploded' ? 'bg-cyan-50 text-cyan-900' : 'text-slate-700 hover:bg-slate-50'
                }`}
              >
                {viewMode === 'exploded' ? <Diamond className="w-3.5 h-3.5 text-cyan-600" /> : <Box className="w-3.5 h-3.5 text-cyan-600" />}
                <span>{viewMode === 'normal' ? t('topbar.normal') : t('topbar.exploded')}</span>
                {viewMode === 'exploded' && <span className="ml-auto text-[9px] font-bold text-cyan-700 uppercase">{t('topbar.on') || 'On'}</span>}
              </button>

              <div className="my-1 border-t border-slate-100" />

              <button
                onClick={handleResetMap}
                className="w-full px-3 py-2 text-left text-xs font-medium flex items-center gap-2 text-slate-600 hover:bg-slate-50 transition-colors cursor-pointer"
              >
                <RotateCcw className="w-3.5 h-3.5" />
                <span>{t('topbar.resetMap')}</span>
              </button>
            </div>
          )}
        </div>

        <button
          onClick={startDemoTour}
          title={t('topbar.judgeDemoTitle')}
          className="shrink-0 whitespace-nowrap px-3 py-1.5 text-xs font-bold rounded-lg bg-gradient-to-r from-orange-500 to-amber-500 hover:from-orange-600 hover:to-amber-600 text-white shadow-sm transition-all flex items-center gap-1.5 cursor-pointer active:scale-95"
        >
          <Play className="w-3.5 h-3.5" />
          <span className="hidden sm:inline">{t('topbar.judgeDemo')}</span>
        </button>

        <div className="hidden lg:block w-px h-5 bg-slate-200 shrink-0" />

        {/* ── Language Switcher Dropdown (EN / हि / मर) ── */}
        <div className="relative shrink-0" ref={langMenuRef}>
          <button
            onClick={() => setLangMenuOpen(!langMenuOpen)}
            className="whitespace-nowrap px-2.5 py-1.5 text-xs font-bold rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-800 border border-slate-300 flex items-center gap-1.5 transition-all shadow-sm cursor-pointer"
            title={t('topbar.langSelector')}
          >
            <Globe className="w-3.5 h-3.5 text-cyan-600" />
            <span>{currentLang.short}</span>
            <ChevronDown className="w-3 h-3 text-slate-500" />
          </button>

          {langMenuOpen && (
            <div className="absolute right-0 top-full mt-1.5 w-36 bg-white border border-slate-200 rounded-xl shadow-lg py-1.5 z-50 animate-in fade-in zoom-in-95">
              <div className="px-3 py-1 text-[10px] font-bold text-slate-400 uppercase tracking-wider border-b border-slate-100 mb-1">
                {t('topbar.langSelector')}
              </div>
              {LANGUAGES.map((l) => (
                <button
                  key={l.code}
                  onClick={() => {
                    setLanguage(l.code)
                    setLangMenuOpen(false)
                  }}
                  className={`w-full px-3 py-1.5 text-left text-xs font-medium flex items-center justify-between transition-colors cursor-pointer ${
                    language === l.code
                      ? 'bg-cyan-50 text-cyan-700 font-bold'
                      : 'text-slate-700 hover:bg-slate-50'
                  }`}
                >
                  <div className="flex items-center gap-2">
                    <span className="text-sm">{l.flag}</span>
                    <span>{l.label}</span>
                  </div>
                  <span className="text-[10px] font-mono font-bold text-slate-400">{l.short}</span>
                </button>
              ))}
            </div>
          )}
        </div>

        <button
          onClick={logout}
          className="shrink-0 whitespace-nowrap ml-1 px-3 py-1.5 text-xs font-semibold rounded-lg bg-red-50 text-red-600 border border-red-200 hover:bg-red-100 transition-all cursor-pointer flex items-center gap-1.5"
        >
          <LogOut className="w-3.5 h-3.5" />
          <span>{t('topbar.logout')}</span>
        </button>
      </div>
    </div>
  )
}
