import React, { useState } from 'react'
import useStore from '../store'
import { useTranslation, LANGUAGES } from '../utils/i18n'
import { Globe, Lock, User, AlertCircle } from 'lucide-react'

// Demo credentials seeded on the backend (see backend/database.py seed_users()).
// Shown as a convenience hint since this is a judging/demo deployment — a real
// government rollout would remove this and issue credentials out-of-band.
const DEMO_CREDENTIALS = {
  citizen: { username: 'citizen_demo', password: 'Citizen@123' },
  corporator: { username: 'corporator_demo', password: 'Corporator@123' },
  builder: { username: 'builder_demo', password: 'Builder@123' },
  datasurvey: { username: 'datasurvey_demo', password: 'DataSurvey@123' },
}

export default function LoginPage() {
  const { t, language, setLanguage } = useTranslation()
  const login = useStore((s) => s.login)
  const loginWithRegion = useStore((s) => s.loginWithRegion)
  const loginWithCredentials = useStore((s) => s.loginWithCredentials)
  const cityRegions = useStore((s) => s.cityRegions)
  const startDemoTour = useStore((s) => s.startDemoTour)
  
  const [hoveredRole, setHoveredRole] = useState(null)
  const [selectedRole, setSelectedRole] = useState(null)
  const [isLoggingIn, setIsLoggingIn] = useState(false)
  
  const [selectedRoleForRegion, setSelectedRoleForRegion] = useState(null)
  const [isRegionLoggingIn, setIsRegionLoggingIn] = useState(false)
  const [selectedRegionId, setSelectedRegionId] = useState(null)

  // ── Real credential form state ──
  const [credentialRoleId, setCredentialRoleId] = useState(null)
  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')
  const [credError, setCredError] = useState(null)
  const [isVerifying, setIsVerifying] = useState(false)
  const [authedFullName, setAuthedFullName] = useState(null)

  const roles = [
    {
      id: 'citizen',
      title: t('roles.citizen'),
      icon: '👤',
      color: '#0284c7',
      bgLight: 'bg-cyan-50/70 hover:bg-cyan-50',
      border: 'border-cyan-200 hover:border-cyan-400',
      description: t('roles.citizenDesc'),
      access: ['View 3D Map', 'Floor-wise ULPIN', 'Building Search', 'Read-only Access'],
    },
    {
      id: 'corporator',
      title: t('roles.corporator'),
      icon: '🏛️',
      color: '#9333ea',
      bgLight: 'bg-purple-50/70 hover:bg-purple-50',
      border: 'border-purple-200 hover:border-purple-400',
      description: t('roles.corporatorDesc'),
      access: ['Upload Drone Video → 3D', 'Manage Residents', 'Flag Violations', 'View Names + ULPIN', 'Underground Data (GPR)', 'Set Approved Floors', 'Add/Edit Buildings'],
    },
    {
      id: 'builder',
      title: t('roles.builder'),
      icon: '🏗️',
      color: '#ea580c',
      bgLight: 'bg-orange-50/70 hover:bg-orange-50',
      border: 'border-orange-200 hover:border-orange-400',
      description: t('roles.builderDesc'),
      access: ['View 3D + ULPIN', 'Underground Map', 'Collision Detection', 'Auto-Optimize Routes', 'Plan Metro/Pipeline/Sewer', 'No Resident Names'],
    },
    {
      id: 'datasurvey',
      title: t('roles.datasurvey'),
      icon: '📊',
      color: '#059669',
      bgLight: 'bg-emerald-50/70 hover:bg-emerald-50',
      border: 'border-emerald-200 hover:border-emerald-400',
      description: t('roles.datasurveyDesc'),
      access: ['2D Land Boundary Delineation', 'LiDAR & Drone 3D Scanning', 'Auto-Assign Floors & 3D ULPIN', 'Blockchain & Clash Engine', 'Drone Video Photogrammetry', 'Subterranean Pipeline Plotter', 'GPR Radar Sub-Asset Registry', 'Spatial Comparison & Clash Engine', 'Blockchain & Mayor City Dashboard'],
    },
  ]

  // Clicking a role card no longer logs in instantly — it reveals the
  // username/password form for that role first.
  const handleRoleCardClick = (roleId) => {
    setCredentialRoleId(roleId)
    setUsername('')
    setPassword('')
    setCredError(null)
  }

  const handleCredentialSubmit = async (e) => {
    e.preventDefault()
    if (isVerifying) return
    setIsVerifying(true)
    setCredError(null)

    const result = await loginWithCredentials(username, password)
    setIsVerifying(false)

    if (!result.success) {
      setCredError(result.error || 'Invalid username or password.')
      return
    }

    const roleId = credentialRoleId
    setAuthedFullName(result.fullName)
    setCredentialRoleId(null)

    if (roleId === 'corporator' || roleId === 'citizen') {
      setSelectedRoleForRegion(roleId)
    } else {
      setSelectedRole(roleId)
      setIsLoggingIn(true)
      setTimeout(() => {
        login(roleId, result.fullName)
      }, 800)
    }
  }

  const handleRegionSelect = (regionId) => {
    setSelectedRegionId(regionId)
    setIsRegionLoggingIn(true)
    setTimeout(() => {
      loginWithRegion(selectedRoleForRegion, regionId, authedFullName)
    }, 800)
  }

  const regionsByZone = (cityRegions || [])
    .filter(r => r.id !== 'demo_ward')
    .reduce((acc, region) => {
      if (!acc[region.zone]) acc[region.zone] = []
      acc[region.zone].push(region)
      return acc
    }, {})

  const zoneNames = {
    north: 'North Zone',
    south: 'South Zone',
    east: 'East Zone',
    west: 'West Zone',
    central: 'Central Zone'
  }

  return (
    <div className="w-full min-h-screen flex flex-col items-center justify-start relative py-12 px-4 overflow-y-auto bg-slate-50">
      {/* Subtle grid background */}
      <div className="fixed inset-0 opacity-40 pointer-events-none" style={{
        backgroundImage: 'linear-gradient(rgba(148,163,184,0.15) 1px, transparent 1px), linear-gradient(90deg, rgba(148,163,184,0.15) 1px, transparent 1px)',
        backgroundSize: '40px 40px',
      }} />

      {/* Top right language switcher in LoginPage */}
      <div className="absolute top-6 right-6 z-20 flex items-center gap-1.5 bg-white border border-slate-200 rounded-xl p-1 shadow-sm">
        <Globe className="w-4 h-4 text-slate-400 ml-2" />
        {LANGUAGES.map((l) => (
          <button
            key={l.code}
            onClick={() => setLanguage(l.code)}
            className={`px-2.5 py-1 text-xs font-bold rounded-lg transition-all cursor-pointer ${
              language === l.code
                ? 'bg-cyan-600 text-white shadow-xs'
                : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
            }`}
          >
            {l.label}
          </button>
        ))}
      </div>

      {/* Logo & Title */}
      <div className="relative z-10 text-center mb-10 mt-2">
        <div className="flex items-center justify-center gap-4 mb-3">
          <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-cyan-500 to-teal-600 flex items-center justify-center shadow-lg shadow-cyan-500/20">
            <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <path d="M12 2L2 7l10 5 10-5-10-5z"/>
              <path d="M2 17l10 5 10-5"/>
              <path d="M2 12l10 5 10-5"/>
            </svg>
          </div>
          <div className="text-left">
            <h1 className="text-4xl font-extrabold text-slate-900 tracking-tight">
              {t('common.appName')} <span className="text-cyan-600">3D</span>
            </h1>
            <p className="text-xs text-slate-500 font-semibold tracking-widest uppercase mt-0.5">{t('login.brandTagline')}</p>
          </div>
        </div>
        <p className="text-slate-600 text-sm max-w-md mx-auto font-medium">
          {t('login.brandSub')}
        </p>
      </div>

      {/* Role Cards */}
      <div className="relative z-10 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 px-6 max-w-7xl w-full items-stretch">
        {roles.map((role) => {
          const isHovered = hoveredRole === role.id
          const isSelected = selectedRole === role.id
          
          return (
            <div
              key={role.id}
              onMouseEnter={() => setHoveredRole(role.id)}
              onMouseLeave={() => setHoveredRole(null)}
              onClick={() => !isLoggingIn && handleRoleCardClick(role.id)}
              className={`relative flex flex-col h-full w-full p-6 rounded-2xl cursor-pointer transition-all duration-300 border bg-white shadow-sm
                ${role.border} ${role.bgLight}
                ${isHovered ? 'scale-[1.03] shadow-xl -translate-y-1' : 'scale-100'}
                ${isSelected ? 'ring-2 ring-cyan-500 ring-offset-2' : ''}
                ${isLoggingIn && !isSelected ? 'opacity-30 pointer-events-none' : ''}
              `}
            >
              {/* Role Icon */}
              <div className="text-4xl mb-3">{role.icon}</div>
              
              {/* Title */}
              <h2 className="text-xl font-bold text-slate-900 mb-2">{role.title}</h2>
              
              {/* Description */}
              <p className="text-xs text-slate-600 mb-4 leading-relaxed min-h-[34px]">{role.description}</p>
              
              {/* Access list */}
              <div className="space-y-2 mb-6 flex-1">
                {role.access.slice(0, 4).map((item, i) => (
                  <div key={i} className="flex items-center gap-2 text-xs">
                    <span style={{ color: role.color }} className="font-bold">✓</span>
                    <span className="text-slate-700 font-medium">{item}</span>
                  </div>
                ))}
              </div>
              
              {/* Login Button */}
              <button
                className={`w-full mt-auto py-2.5 rounded-xl text-xs font-bold uppercase tracking-wider transition-all duration-300 border cursor-pointer
                  ${isSelected ? 'animate-pulse' : ''}
                `}
                style={{
                  background: isHovered || isSelected ? role.color : 'transparent',
                  borderColor: role.color,
                  color: isHovered || isSelected ? '#ffffff' : role.color,
                }}
              >
                {isSelected ? t('login.loggingIn') : t('login.loginAs', { role: role.title })}
              </button>
            </div>
          )
        })}
      </div>

      {/* Footer & Demo Button */}
      <div className="relative z-10 mt-12 flex flex-col items-center">
        <button
          onClick={() => {
            if (startDemoTour) startDemoTour()
          }}
          className="mb-6 px-8 py-3 rounded-xl font-bold text-white shadow-md hover:shadow-lg transition-all bg-gradient-to-r from-orange-500 to-amber-500 hover:from-orange-600 hover:to-amber-600 flex items-center gap-2 cursor-pointer active:scale-95 text-sm"
        >
          <span>{t('login.runDemo')}</span>
        </button>
        <div className="text-center">
          <p className="text-xs text-slate-500 font-medium">{t('login.footerHackathon')}</p>
          <p className="text-[10px] text-slate-400 mt-0.5">{t('login.footerTech')}</p>
        </div>
      </div>

      {/* Credential Form Overlay — shown right after a role card is clicked */}
      {credentialRoleId && (() => {
        const role = roles.find(r => r.id === credentialRoleId)
        const demo = DEMO_CREDENTIALS[credentialRoleId]
        return (
          <div className="absolute inset-0 z-50 flex items-center justify-center bg-slate-900/40 backdrop-blur-md p-4">
            <div className="w-full max-w-sm bg-white rounded-3xl shadow-2xl border border-slate-200 p-8 relative">
              <button
                onClick={() => { if (!isVerifying) setCredentialRoleId(null) }}
                className="absolute top-6 left-6 flex items-center gap-2 text-slate-400 hover:text-slate-900 font-semibold text-xs transition-colors cursor-pointer"
              >
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="m15 18-6-6 6-6"/></svg>
                {t('login.backToRoles')}
              </button>

              <div className="text-center mt-6 mb-6">
                <div className="text-4xl mb-2">{role?.icon}</div>
                <h2 className="text-xl font-bold text-slate-900">{role?.title}</h2>
                <p className="text-xs text-slate-500 mt-1">Sign in to continue</p>
              </div>

              <form onSubmit={handleCredentialSubmit} className="space-y-4">
                <div>
                  <label className="text-xs font-bold text-slate-600 uppercase tracking-wider mb-1.5 block">Username</label>
                  <div className="relative">
                    <User className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                    <input
                      type="text"
                      value={username}
                      onChange={(e) => setUsername(e.target.value)}
                      autoFocus
                      autoComplete="username"
                      className="w-full pl-9 pr-3 py-2.5 rounded-xl border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-cyan-500 focus:border-transparent"
                      placeholder="Enter username"
                    />
                  </div>
                </div>

                <div>
                  <label className="text-xs font-bold text-slate-600 uppercase tracking-wider mb-1.5 block">Password</label>
                  <div className="relative">
                    <Lock className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                    <input
                      type="password"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      autoComplete="current-password"
                      className="w-full pl-9 pr-3 py-2.5 rounded-xl border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-cyan-500 focus:border-transparent"
                      placeholder="Enter password"
                    />
                  </div>
                </div>

                {credError && (
                  <div className="flex items-start gap-2 bg-red-50 border border-red-200 text-red-700 text-xs font-medium rounded-xl px-3 py-2.5">
                    <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
                    <span>{credError}</span>
                  </div>
                )}

                <button
                  type="submit"
                  disabled={isVerifying || !username || !password}
                  className="w-full py-2.5 rounded-xl text-sm font-bold uppercase tracking-wider text-white transition-all cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed"
                  style={{ background: role?.color }}
                >
                  {isVerifying ? 'Signing in…' : 'Sign In'}
                </button>
              </form>

              {demo && (
                <p className="text-center text-[10px] text-slate-400 mt-4">
                  Demo login: <span className="font-mono text-slate-500">{demo.username}</span> / <span className="font-mono text-slate-500">{demo.password}</span>
                </p>
              )}

              <p className="text-center text-[10px] text-slate-400 mt-2">
                Forgot access? Contact your administrator.
              </p>
            </div>
          </div>
        )
      })()}

      {/* Region Selection Overlay */}
      {selectedRoleForRegion && (
        <div className="absolute inset-0 z-50 flex flex-col bg-slate-900/40 backdrop-blur-md overflow-y-auto">
          <div className="max-w-5xl w-full mx-auto p-8 py-12 relative min-h-screen bg-white rounded-3xl shadow-2xl my-6 border border-slate-200">
            <button 
              onClick={() => {
                if(!isRegionLoggingIn) setSelectedRoleForRegion(null)
              }}
              className="absolute top-8 left-8 flex items-center gap-2 text-slate-500 hover:text-slate-900 font-semibold text-sm transition-colors cursor-pointer"
            >
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="m15 18-6-6 6-6"/></svg>
              {t('login.backToRoles')}
            </button>
            
            <div className="text-center mb-10 mt-6">
              <h2 className="text-3xl font-extrabold text-slate-900 mb-2">
                {selectedRoleForRegion === 'citizen' ? t('login.selectRegion') : t('login.selectWard')}
              </h2>
              <p className="text-slate-500 uppercase tracking-widest text-xs font-bold">
                {t('login.loggingInAs', { role: selectedRoleForRegion === 'citizen' ? t('roles.citizen') : t('roles.corporator') })}
              </p>
            </div>

            <div className="space-y-6 pb-12">
              {Object.entries(regionsByZone).map(([zone, regions]) => (
                <div key={zone} className="bg-slate-50 border border-slate-200 rounded-2xl p-6">
                  <h3 className="text-lg font-bold text-slate-800 mb-4 flex items-center gap-3">
                    <span className="w-8 h-0.5 bg-slate-300"></span>
                    {zoneNames[zone] || zone}
                    <span className="flex-1 h-0.5 bg-slate-200"></span>
                  </h3>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {regions.map(region => {
                      const isSelected = selectedRegionId === region.id
                      
                      return (
                        <div
                          key={region.id}
                          onClick={() => !isRegionLoggingIn && handleRegionSelect(region.id)}
                          className={`
                            relative p-5 rounded-xl border cursor-pointer transition-all duration-200 bg-white
                            ${selectedRoleForRegion === 'citizen' 
                              ? 'border-cyan-200 hover:border-cyan-400 hover:shadow-md' 
                              : 'border-purple-200 hover:border-purple-400 hover:shadow-md'}
                            ${isSelected ? (selectedRoleForRegion === 'citizen' ? 'ring-2 ring-cyan-500 bg-cyan-50' : 'ring-2 ring-purple-500 bg-purple-50') : ''}
                            ${isRegionLoggingIn && !isSelected ? 'opacity-30 pointer-events-none' : ''}
                          `}
                        >
                          <div className="flex justify-between items-start mb-2">
                            <h4 className="text-base font-bold text-slate-900">{region.name}</h4>
                            <span className={`text-[10px] uppercase tracking-wider px-2 py-0.5 rounded-full border font-bold
                              ${selectedRoleForRegion === 'citizen' 
                                ? 'bg-cyan-50 text-cyan-700 border-cyan-200' 
                                : 'bg-purple-50 text-purple-700 border-purple-200'}
                            `}>
                              {zone}
                            </span>
                          </div>
                          
                          {selectedRoleForRegion === 'corporator' && (
                            <p className="text-xs text-slate-600 flex items-center gap-1.5 mt-2">
                              <span className="text-purple-600">👤</span> {t('login.corporatorLabel')}: <strong className="text-slate-800">{region.corporator}</strong>
                            </p>
                          )}
                          
                          {isSelected && (
                            <div className={`mt-3 text-xs font-bold animate-pulse ${selectedRoleForRegion === 'citizen' ? 'text-cyan-700' : 'text-purple-700'}`}>
                              {t('login.entering', { region: region.name })}
                            </div>
                          )}
                        </div>
                      )
                    })}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
