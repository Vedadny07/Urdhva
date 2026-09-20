import React from 'react'
import useStore from '../store'

const INFRA_TYPES = [
  { id: 'metro', label: 'Metro Tunnel', icon: '🚇', color: '#3b82f6' },
  { id: 'pipeline', label: 'Water Pipeline', icon: '💧', color: '#f97316' },
  { id: 'sewer', label: 'Sewer Line', icon: '🔧', color: '#a855f7' },
  { id: 'electricity', label: 'Power Cable', icon: '⚡', color: '#eab308' },
  { id: 'bridge', label: 'Underpass', icon: '🌉', color: '#22d3ee' },
]

export default function InfraBuilder() {
  const builderMode = useStore((s) => s.builderMode)
  const builderType = useStore((s) => s.builderType)
  const builderFrom = useStore((s) => s.builderFrom)
  const builderTo = useStore((s) => s.builderTo)
  const builderDepth = useStore((s) => s.builderDepth)
  const builderDeviation = useStore((s) => s.builderDeviation)
  const builderResult = useStore((s) => s.builderResult)
  const optimizationStatus = useStore((s) => s.optimizationStatus)
  const candidateRoutes = useStore((s) => s.candidateRoutes)
  const selectedCandidateId = useStore((s) => s.selectedCandidateId)
  
  const waypoints = useStore((s) => s.waypoints)
  const openBuilder = useStore((s) => s.openBuilder)
  const closeBuilder = useStore((s) => s.closeBuilder)
  const setBuilderType = useStore((s) => s.setBuilderType)
  const setBuilderFrom = useStore((s) => s.setBuilderFrom)
  const setBuilderTo = useStore((s) => s.setBuilderTo)
  const setBuilderDepth = useStore((s) => s.setBuilderDepth)
  const setBuilderDeviation = useStore((s) => s.setBuilderDeviation)
  const analyzeRoute = useStore((s) => s.analyzeRoute)
  const autoOptimize = useStore((s) => s.autoOptimize)
  const setSelectedCandidate = useStore((s) => s.setSelectedCandidate)
  const applySelectedRoute = useStore((s) => s.applySelectedRoute)

  if (!builderMode) {
    return (
      <button
        onClick={openBuilder}
        className="w-full px-4 py-3 text-sm font-medium rounded-xl transition-all border flex items-center justify-center gap-2
          bg-gradient-to-r from-purple-500/10 to-blue-500/10 text-purple-300 border-purple-500/30
          hover:from-purple-500/20 hover:to-blue-500/20 hover:border-purple-500/50 hover:shadow-[0_0_20px_rgba(168,85,247,0.15)]"
      >
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z"/>
        </svg>
        SPATIAL WHAT-IF
      </button>
    )
  }

  const canAnalyze = builderType && builderFrom && builderTo && builderFrom !== builderTo

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-start justify-between border-b border-slate-700/50 pb-3">
        <div>
          <h3 className="text-sm font-bold text-white tracking-wider flex items-center gap-2">
            <span className="text-purple-400">⚡</span> SPATIAL WHAT-IF
          </h3>
          <p className="text-[10px] text-slate-400 mt-1 uppercase tracking-wide">Design infrastructure. Test consequences. Find the safest route.</p>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => useStore.getState().toggleUndergroundMode()}
            title={useStore.getState().undergroundMode ? "Return to surface" : "Dive camera underground"}
            className={`px-2 py-1 text-[10px] font-bold rounded-lg border flex items-center gap-1 transition-all ${
              useStore.getState().undergroundMode
                ? 'bg-cyan-500/20 text-cyan-300 border-cyan-400 shadow-[0_0_10px_rgba(6,182,212,0.3)]'
                : 'bg-slate-800 text-slate-300 border-slate-700 hover:border-cyan-400'
            }`}
          >
            <span>{useStore.getState().undergroundMode ? '🏙️' : '🚇'}</span>
            <span>{useStore.getState().undergroundMode ? 'Surface' : 'Underground'}</span>
          </button>
          <button onClick={closeBuilder} className="text-xs text-slate-500 hover:text-slate-300">✕</button>
        </div>
      </div>

      {/* Step 1: Settings */}
      {optimizationStatus === 'idle' && !builderResult && (
        <div className="space-y-4 animate-in fade-in slide-in-from-bottom-2 duration-300">
          <div>
            <label className="text-[10px] text-slate-500 uppercase tracking-wider block mb-2 font-semibold">Infrastructure</label>
            <div className="grid grid-cols-2 gap-1.5">
              {INFRA_TYPES.map(type => (
                <button
                  key={type.id}
                  onClick={() => setBuilderType(type.id)}
                  className={`px-3 py-2 text-[11px] font-medium rounded-lg transition-all border text-left flex items-center gap-2 ${
                    builderType === type.id
                      ? 'bg-opacity-20 border-opacity-50'
                      : 'bg-slate-800/50 border-slate-700/30 hover:bg-slate-700/50 text-slate-400'
                  }`}
                  style={builderType === type.id ? {
                    backgroundColor: `${type.color}20`,
                    borderColor: `${type.color}60`,
                    color: type.color,
                  } : undefined}
                >
                  <span>{type.icon}</span>
                  {type.label}
                </button>
              ))}
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-[10px] text-slate-500 uppercase tracking-wider block mb-1 font-semibold">Start</label>
              <select
                value={builderFrom || ''}
                onChange={(e) => setBuilderFrom(e.target.value || null)}
                className="w-full px-3 py-2 text-xs rounded-lg bg-slate-800/80 border border-slate-700/50 text-slate-200 focus:outline-none focus:border-purple-500/50"
              >
                <option value="">Select...</option>
                {waypoints.filter(w => w.id !== builderTo).map(wp => (
                  <option key={wp.id} value={wp.id}>Point {wp.id}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="text-[10px] text-slate-500 uppercase tracking-wider block mb-1 font-semibold">End</label>
              <select
                value={builderTo || ''}
                onChange={(e) => setBuilderTo(e.target.value || null)}
                className="w-full px-3 py-2 text-xs rounded-lg bg-slate-800/80 border border-slate-700/50 text-slate-200 focus:outline-none focus:border-purple-500/50"
              >
                <option value="">Select...</option>
                {waypoints.filter(w => w.id !== builderFrom).map(wp => (
                  <option key={wp.id} value={wp.id}>Point {wp.id}</option>
                ))}
              </select>
            </div>
          </div>

          <div>
            <div className="flex justify-between mb-1">
              <label className="text-[10px] text-slate-500 uppercase tracking-wider font-semibold">Depth</label>
              <span className="text-xs font-mono text-cyan-400">{Math.abs(builderDepth)}m</span>
            </div>
            <input
              type="range" min="-25" max="-2" step="1"
              value={builderDepth}
              onChange={(e) => setBuilderDepth(parseFloat(e.target.value))}
              className="w-full h-1.5 rounded-full appearance-none bg-slate-700 accent-cyan-500"
            />
          </div>

          <div>
            <div className="flex justify-between mb-1">
              <label className="text-[10px] text-slate-500 uppercase tracking-wider font-semibold">Maximum Deviation</label>
              <span className="text-xs font-mono text-purple-400">{builderDeviation}%</span>
            </div>
            <input
              type="range" min="0" max="50" step="5"
              value={builderDeviation}
              onChange={(e) => setBuilderDeviation(parseFloat(e.target.value))}
              className="w-full h-1.5 rounded-full appearance-none bg-slate-700 accent-purple-500"
            />
          </div>

          <button
            disabled={!canAnalyze}
            onClick={analyzeRoute}
            className={`w-full mt-2 px-4 py-3 text-sm font-semibold rounded-xl transition-all ${
              canAnalyze
                ? 'bg-slate-700/80 text-white hover:bg-slate-600 border border-slate-600'
                : 'bg-slate-800/50 text-slate-500 cursor-not-allowed border border-slate-800'
            }`}
          >
            ANALYZE ROUTE
          </button>
        </div>
      )}

      {/* Step 2: Analysis Results */}
      {builderResult && optimizationStatus === 'idle' && (
        <div className="space-y-4 animate-in fade-in slide-in-from-right-2 duration-300">
          <div className="p-4 rounded-xl border bg-slate-800/50 border-slate-700">
            <h4 className="text-xs text-slate-400 uppercase tracking-wider font-semibold mb-3">Current Route</h4>
            
            <div className="grid grid-cols-2 gap-3 mb-4">
              <div className="bg-slate-900/50 p-2 rounded-lg border border-slate-700/50">
                <p className="text-[10px] text-slate-500 uppercase">Conflicts</p>
                <p className={`text-xl font-bold mt-0.5 ${builderResult.clashes.length > 0 ? 'text-red-400' : 'text-green-400'}`}>
                  {builderResult.clashes.length}
                </p>
              </div>
              <div className="bg-slate-900/50 p-2 rounded-lg border border-slate-700/50">
                <p className="text-[10px] text-slate-500 uppercase">Risk Score</p>
                <p className={`text-xl font-bold mt-0.5 ${builderResult.isHighRisk ? 'text-red-400' : 'text-yellow-400'}`}>
                  {builderResult.riskScore}
                </p>
              </div>
            </div>

            {builderResult.clashes.length > 0 && (
              <div className="space-y-2 mb-4 max-h-[150px] overflow-y-auto pr-1">
                {builderResult.clashes.map((clash, i) => (
                  <div key={i} className="text-[11px] p-2 rounded bg-red-500/10 border border-red-500/20">
                    <p className="font-semibold text-red-300">{clash.owner || clash.label}</p>
                    <p className="text-red-400/80 flex justify-between mt-0.5">
                      <span>{clash.type}</span>
                      <span className="font-mono">{clash.depthRange[0].toFixed(0)}m to {clash.depthRange[1].toFixed(0)}m</span>
                    </p>
                  </div>
                ))}
              </div>
            )}

            <button
              onClick={() => {
                const s = useStore.getState()
                s.setBuilderResult(null)
              }}
              className="text-xs text-slate-400 hover:text-white underline"
            >
              ← Edit Parameters
            </button>
          </div>

          <button
            onClick={autoOptimize}
            className="w-full px-4 py-4 text-sm font-bold rounded-xl transition-all flex items-center justify-center gap-2
              bg-gradient-to-r from-purple-600 to-blue-600 text-white shadow-[0_0_30px_rgba(168,85,247,0.3)]
              hover:from-purple-500 hover:to-blue-500 hover:scale-[1.02] active:scale-[0.98]"
          >
            ⚡ AUTO-OPTIMIZE ROUTE
          </button>
          
          <button
             onClick={autoOptimize}
             className="w-full px-4 py-2.5 text-xs font-bold rounded-xl transition-all border border-cyan-500/50 text-cyan-400 hover:bg-cyan-500/10"
          >
            SHOW BEST POSSIBLE ROUTE
          </button>
        </div>
      )}

      {/* Step 3: Analyzing / Crunching */}
      {optimizationStatus === 'analyzing' && (
        <div className="py-12 flex flex-col items-center justify-center text-center space-y-4 animate-in fade-in duration-300">
          <div className="w-12 h-12 border-4 border-purple-500/30 border-t-purple-500 rounded-full animate-spin"></div>
          <div>
            <p className="text-sm font-bold text-white tracking-wider">CALCULATING ALTERNATIVES</p>
            <p className="text-xs text-slate-400 mt-1">Analyzing spatial constraints...</p>
          </div>
        </div>
      )}

      {/* Step 4: Optimization Results */}
      {optimizationStatus === 'optimized' && candidateRoutes.length > 0 && (
        <div className="space-y-4 animate-in slide-in-from-bottom-4 duration-500">
          <h4 className="text-xs text-slate-400 uppercase tracking-wider font-semibold">Alternatives Generated</h4>
          
          <div className="space-y-2">
            {candidateRoutes.map((route) => {
              const isSelected = selectedCandidateId === route.id;
              
              return (
                <div 
                  key={route.id}
                  onClick={() => setSelectedCandidate(route.id)}
                  className={`p-3 rounded-xl border transition-all cursor-pointer ${
                    isSelected 
                      ? 'bg-slate-800 border-cyan-500 shadow-[0_0_15px_rgba(6,182,212,0.2)]' 
                      : 'bg-slate-900/50 border-slate-700 hover:bg-slate-800/80 hover:border-slate-600'
                  }`}
                >
                  <div className="flex justify-between items-start mb-2">
                    <h5 className={`text-xs font-bold ${route.isRecommended ? 'text-cyan-400' : 'text-slate-200'}`}>
                      {route.name}
                    </h5>
                    {route.isRecommended && (
                      <span className="text-[10px] bg-cyan-500/20 text-cyan-400 px-2 py-0.5 rounded-full font-bold border border-cyan-500/30">
                        ✅ RECOMMENDED
                      </span>
                    )}
                  </div>

                  <div className="grid grid-cols-4 gap-2 text-center">
                    <div>
                      <p className="text-[9px] text-slate-500 uppercase">Conflicts</p>
                      <p className={`text-sm font-bold ${route.clashes.length === 0 ? 'text-green-400' : 'text-red-400'}`}>{route.clashes.length}</p>
                    </div>
                    <div>
                      <p className="text-[9px] text-slate-500 uppercase">Prop/Util</p>
                      <p className="text-sm font-bold text-slate-300">{route.propertiesAffected}/{route.utilitiesAffected}</p>
                    </div>
                    <div>
                      <p className="text-[9px] text-slate-500 uppercase">Length</p>
                      <p className="text-sm font-bold text-slate-300">+{Math.round((route.length / route.baseLength - 1) * 100)}%</p>
                    </div>
                    <div>
                      <p className="text-[9px] text-slate-500 uppercase">Risk</p>
                      <p className={`text-sm font-bold ${route.riskScore < 30 ? 'text-green-400' : route.riskScore < 60 ? 'text-yellow-400' : 'text-red-400'}`}>{route.riskScore}</p>
                    </div>
                  </div>
                  
                  {isSelected && route.isRecommended && (
                    <div className="mt-3 pt-2 border-t border-slate-700/50 text-[10px] text-cyan-300/80">
                      <p>{route.propertiesAffected} property conflicts</p>
                      <p>{route.clashes.length - route.propertiesAffected - route.utilitiesAffected} private rights affected</p>
                      <p>{route.utilitiesAffected} utility interactions</p>
                    </div>
                  )}
                </div>
              )
            })}
          </div>

          <div className="pt-2 flex gap-2">
            <button
              onClick={() => {
                const s = useStore.getState()
                s.setBuilderResult(null)
                s.set({ optimizationStatus: 'idle', candidateRoutes: [] })
              }}
              className="flex-1 px-3 py-3 text-xs font-semibold rounded-xl bg-slate-800 text-slate-300 hover:bg-slate-700 transition-all"
            >
              Discard
            </button>
            <button
              onClick={applySelectedRoute}
              className="flex-[2] px-3 py-3 text-xs font-bold rounded-xl bg-cyan-600 text-white hover:bg-cyan-500 transition-all shadow-[0_0_15px_rgba(6,182,212,0.3)]"
            >
              APPLY ROUTE
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
