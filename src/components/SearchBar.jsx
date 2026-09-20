import React, { useState, useEffect, useRef } from 'react'
import useStore from '../store'
import { useTranslation } from '../utils/i18n'
import { Printer } from 'lucide-react'

export default function SearchBar() {
  const { t } = useTranslation()
  const [query, setQuery] = useState('')
  const [isOpen, setIsOpen] = useState(false)
  const [results, setResults] = useState([])
  const wrapperRef = useRef(null)

  const buildings = useStore(s => s.buildings)
  const selectBuilding = useStore(s => s.selectBuilding)
  const selectUnit = useStore(s => s.selectUnit)
  const searchHistory = useStore(s => s.searchHistory)
  const addSearchHistory = useStore(s => s.addSearchHistory)
  const closeBuilder = useStore(s => s.closeBuilder)
  const userRole = useStore(s => s.userRole)
  const openPropertyReceipt = useStore(s => s.openPropertyReceipt)

  // Handle click outside to close dropdown
  useEffect(() => {
    function handleClickOutside(event) {
      if (wrapperRef.current && !wrapperRef.current.contains(event.target)) {
        setIsOpen(false)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  // Search logic
  useEffect(() => {
    if (query.trim().length === 0) {
      setResults([])
      return
    }

    const q = query.toLowerCase()
    const matches = []

    // 1. Search buildings
    buildings.forEach(b => {
      const bMatch = b.id.toLowerCase().includes(q) || b.name.toLowerCase().includes(q)
      if (bMatch) {
        matches.push({
          type: 'building',
          id: b.id,
          name: b.name,
          desc: `${b.units.length} ${t('search.units')} · ${b.actualFloors} ${t('search.floors')}`,
          buildingId: b.id
        })
      }

      // 2. Search units within building
      b.units.forEach(u => {
        const ownerStr = (u.owner || '').toLowerCase()
        const ownerNameStr = (u.ownership?.ownerName || '').toLowerCase()
        const coOwners = u.ownership?.coOwners || []
        const coMatch = coOwners.some(co => co.name && co.name.toLowerCase().includes(q))
        const regMatch = u.ownership?.registrationNo && u.ownership.registrationNo.toLowerCase().includes(q)
        const familyMatch = u.families?.some(f => (f.name && f.name.toLowerCase().includes(q)) || (f.ulpin && f.ulpin.toLowerCase().includes(q)))

        const uMatch =
          u.ulpin.toLowerCase().includes(q) ||
          ownerStr.includes(q) ||
          ownerNameStr.includes(q) ||
          coMatch ||
          regMatch ||
          familyMatch

        if (uMatch) {
          const displayOwner = (userRole === 'corporator' || userRole === 'datasurvey')
            ? (u.ownership?.ownerName || u.owner || 'Unit')
            : (u.ownership?.ownerName || u.owner || 'Unit')

          matches.push({
            type: 'unit',
            id: u.ulpin,
            name: `${displayOwner} (${u.type})`,
            desc: `${t('search.floor')} ${u.floorNumber} · ${b.name}`,
            buildingId: b.id,
            unitId: u.ulpin,
            ownership: u.ownership,
            unitType: u.type,
            floorNumber: u.floorNumber,
            buildingName: b.name
          })
        }
      })
    })

    // Limit to 6 results for UI
    setResults(matches.slice(0, 6))
  }, [query, buildings, t, userRole])

  const handleSelect = (item) => {
    setIsOpen(false)
    setQuery('')
    closeBuilder()
    addSearchHistory(item)

    if (item.type === 'building') {
      selectBuilding(item.buildingId)
    } else if (item.type === 'unit') {
      selectBuilding(item.buildingId)
      // Small timeout to allow building explode animation to start before locking onto unit
      setTimeout(() => {
        selectUnit(item.unitId)
      }, 50)
    }
  }

  const handleKeyDown = (e) => {
    if (e.key === 'Enter') {
      if (results.length > 0) {
        handleSelect(results[0])
      } else if (query.trim().length > 0) {
        // Show not found state (handled by UI)
        setResults([{ type: 'not_found', name: t('search.notFound'), desc: t('search.notFoundDesc') }])
      }
    }
  }

  return (
    <div ref={wrapperRef} className="relative w-80 md:w-96">
      <div className="relative flex items-center">
        <svg className="absolute left-3 w-4 h-4 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
        </svg>
        <input
          type="text"
          value={query}
          onChange={(e) => {
            setQuery(e.target.value)
            setIsOpen(true)
          }}
          onFocus={() => setIsOpen(true)}
          onKeyDown={handleKeyDown}
          placeholder={t('search.placeholder')}
          className="w-full bg-white border border-slate-300 text-slate-800 text-xs rounded-xl pl-9 pr-3 py-2 
            focus:outline-none focus:border-cyan-500 focus:ring-2 focus:ring-cyan-500/20 transition-all placeholder-slate-400 shadow-sm"
        />
      </div>

      {/* Dropdown */}
      {isOpen && (query.trim().length > 0 || searchHistory.length > 0) && (
        <div className="absolute top-full left-0 w-full mt-2 bg-white border border-slate-200 rounded-xl shadow-2xl max-h-[440px] overflow-y-auto z-50 animate-in fade-in">
          
          {query.trim().length === 0 ? (
            // Search History View
            <div className="p-2">
              <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wider px-2 pb-1">{t('search.recentSearches')}</p>
              {searchHistory.length === 0 ? (
                <p className="text-xs text-slate-400 px-2 py-2">{t('search.noRecentSearches')}</p>
              ) : (
                searchHistory.map((item, i) => (
                  <button
                    key={i}
                    onClick={() => handleSelect(item)}
                    className="w-full text-left px-3 py-2 hover:bg-slate-50 rounded-lg transition-colors flex items-center gap-3 cursor-pointer"
                  >
                    <span className="text-slate-400">🕒</span>
                    <div>
                      <p className="text-xs font-semibold text-slate-800">{item.id}</p>
                      <p className="text-[10px] text-slate-500">{item.name}</p>
                    </div>
                  </button>
                ))
              )}
            </div>
          ) : (
            // Results View
            <div className="p-2 divide-y divide-slate-100">
              {results.length === 0 ? (
                <div className="px-3 py-4 text-center">
                  <p className="text-sm font-bold text-slate-800">{t('search.notFound')}</p>
                  <p className="text-[10px] text-slate-500 mt-1">{t('search.notFoundDesc')}</p>
                </div>
              ) : (
                results.map((item, i) => {
                  if (item.type === 'not_found') {
                    return (
                      <div key={i} className="px-3 py-4 text-center">
                        <p className="text-sm font-bold text-slate-800">{item.name}</p>
                        <p className="text-[10px] text-slate-500 mt-1">{item.desc}</p>
                      </div>
                    )
                  }

                  if (item.type === 'building') {
                    return (
                      <button
                        key={i}
                        onClick={() => handleSelect(item)}
                        className="w-full text-left px-3 py-2.5 hover:bg-slate-50 rounded-lg transition-colors flex items-center gap-3 cursor-pointer"
                      >
                        <span className="text-xl">🏢</span>
                        <div className="flex-1 min-w-0">
                          <p className="text-xs font-bold text-cyan-600 font-mono truncate">{item.id}</p>
                          <p className="text-xs text-slate-800 font-medium truncate">{item.name}</p>
                          <p className="text-[10px] text-slate-500">{item.desc}</p>
                        </div>
                      </button>
                    )
                  }

                  // Unit item with rich ownership details
                  const os = item.ownership
                  return (
                    <div
                      key={i}
                      className="w-full text-left p-2.5 hover:bg-cyan-50/40 rounded-xl transition-all flex items-start gap-2.5 cursor-pointer"
                      onClick={() => handleSelect(item)}
                    >
                      <span className="text-lg mt-0.5">🚪</span>
                      <div className="flex-1 min-w-0 space-y-1">
                        <div className="flex items-center justify-between gap-1">
                          <span className="text-xs font-bold text-cyan-700 font-mono truncate">{item.id}</span>
                          <div className="flex items-center gap-1.5 shrink-0">
                            {os?.verificationStatus && (
                              <span className={`text-[9px] font-bold font-mono px-1.5 py-0.2 rounded border ${
                                os.verificationStatus === 'Verified'
                                  ? 'bg-emerald-50 text-emerald-700 border-emerald-300'
                                  : os.verificationStatus === 'Pending'
                                  ? 'bg-amber-50 text-amber-700 border-amber-300'
                                  : 'bg-red-50 text-red-700 border-red-300'
                              }`}>
                                ● {os.verificationStatus}
                              </span>
                            )}
                            <button
                              type="button"
                              title="Print Property Receipt"
                              onClick={(e) => {
                                e.stopPropagation()
                                const b = buildings.find(bd => bd.id === item.buildingId)
                                const u = b?.units.find(un => un.ulpin === item.unitId)
                                if (b && u) openPropertyReceipt(u, b)
                              }}
                              className="p-1 rounded-md hover:bg-slate-200 text-slate-500 hover:text-slate-800 transition-colors cursor-pointer"
                            >
                              <Printer className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        </div>

                        <div className="text-xs font-semibold text-slate-900 truncate">
                          {item.name}
                        </div>

                        {os && (
                          <div className="bg-slate-50 p-2 rounded-lg border border-slate-200 text-[10px] space-y-1">
                            <div className="flex items-center justify-between text-slate-700 font-medium">
                              <span>📜 {os.ownershipType} ({os.sharePercent}% Share)</span>
                              <span className="font-mono text-slate-500">{os.registrationNo}</span>
                            </div>
                            <div className="flex items-center justify-between text-slate-500 text-[9px]">
                              <span>📅 Mutated: {os.mutationDate}</span>
                              {os.contact && <span>📞 {os.contact}</span>}
                            </div>
                            {os.coOwners && os.coOwners.length > 0 && (
                              <div className="pt-1 border-t border-slate-200 text-[9px] text-purple-700 font-medium truncate">
                                👥 Co-owners: {os.coOwners.map(c => `${c.name} (${c.sharePercent}%)`).join(', ')}
                              </div>
                            )}
                          </div>
                        )}

                        <p className="text-[10px] text-slate-500">{item.desc}</p>
                      </div>
                    </div>
                  )
                })
              )}
            </div>
          )}
        </div>
      )}
    </div>
  )
}
