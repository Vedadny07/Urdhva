import React, { useEffect, useMemo, useRef, useState, useCallback } from 'react'
import useStore from '../store'
import { useTranslation } from '../utils/i18n'
import { Printer, MapPin, Building2, Search, Loader2, Globe2, Landmark, Hash, X } from 'lucide-react'

const GEO_SEARCH_DEBOUNCE_MS = 400

function getLocationKind(type = '') {
  const value = String(type).toLowerCase()
  if (['city', 'town', 'municipality'].includes(value)) return 'City / Town'
  if (['village'].includes(value)) return 'Village'
  if (['suburb', 'neighbourhood', 'neighborhood', 'locality', 'quarter'].includes(value)) return 'Locality / Neighbourhood'
  if (['road', 'street', 'residential'].includes(value)) return 'Road / Street'
  if (['district', 'county', 'taluk', 'tehsil', 'subdistrict'].includes(value)) return 'District / Taluka'
  if (['state', 'region'].includes(value)) return 'State / Region'
  if (['landmark', 'attraction', 'poi'].includes(value)) return 'Landmark'
  if (['building', 'house'].includes(value)) return 'Building'
  if (value === 'parcel') return 'Parcel / ULPIN'
  return value ? value.replace(/_/g, ' ') : 'Location'
}

function isFourteenDigitUlpIn(value) {
  return /^\d{14}$/.test(String(value || '').trim())
}

const UTILITY_SEARCHES = [
  { key: 'gas', labels: ['gas', 'gas pipeline', 'gas pipelines'], label: 'Gas pipeline network', desc: 'Show available gas utility layer on the geographic map' },
  { key: 'water', labels: ['water', 'water pipeline', 'water pipelines'], label: 'Water pipeline network', desc: 'Show available water utility layer on the geographic map' },
  { key: 'sewer', labels: ['sewer', 'sewerage', 'sewage', 'sewer pipeline'], label: 'Sewer network', desc: 'Show available sewer utility layer on the geographic map' },
  { key: 'electricity', labels: ['electricity', 'power cable', 'power cables', 'electric cable'], label: 'Electricity cable network', desc: 'Show available electricity utility layer on the geographic map' },
  { key: 'telecom', labels: ['telecom', 'telecom cable', 'fibre', 'fiber'], label: 'Telecom cable network', desc: 'Show available telecom utility layer on the geographic map' },
]

export default function SearchBar() {
  const { t } = useTranslation()
  const [query, setQuery] = useState('')
  const [isOpen, setIsOpen] = useState(false)
  const [geoResults, setGeoResults] = useState([])
  const [geoLoading, setGeoLoading] = useState(false)
  const [geoError, setGeoError] = useState('')
  const [ulpinLoading, setUlpInLoading] = useState(false)
  const [ulpinError, setUlpInError] = useState('')
  const wrapperRef = useRef(null)
  const geoAbortRef = useRef(null)

  const buildings = useStore(s => s.buildings)
  const selectBuilding = useStore(s => s.selectBuilding)
  const selectUnit = useStore(s => s.selectUnit)
  const searchHistory = useStore(s => s.searchHistory)
  const addSearchHistory = useStore(s => s.addSearchHistory)
  const closeBuilder = useStore(s => s.closeBuilder)
  const openPropertyReceipt = useStore(s => s.openPropertyReceipt)
  const setGeoLocation = useStore(s => s.setGeoLocation)
  const setMaharashtraUlpinResult = useStore(s => s.setMaharashtraUlpinResult)
  const setGeographicMode = useStore(s => s.setGeographicMode)
  const requestGeoUtility = useStore(s => s.requestGeoUtility)

  const localResults = useMemo(() => {
    const trimmed = query.trim()
    if (!trimmed || isFourteenDigitUlpIn(trimmed)) return []
    const q = trimmed.toLowerCase()
    const matches = []

    buildings.forEach(b => {
      const bId = String(b.id || '')
      const bName = String(b.name || '')
      if (bId.toLowerCase().includes(q) || bName.toLowerCase().includes(q)) {
        matches.push({
          type: 'building',
          id: bId,
          name: bName,
          desc: `${(b.units || []).length} ${t('search.units')} · ${b.actualFloors ?? b.approvedFloors ?? '—'} ${t('search.floors')}`,
          buildingId: b.id,
        })
      }

      ;(b.units || []).forEach(u => {
        const ulpin = String(u.ulpin || '')
        const ownerStr = String(u.owner || '')
        const ownerNameStr = String(u.ownership?.ownerName || '')
        const coOwners = u.ownership?.coOwners || []
        const coMatch = coOwners.some(co => co.name && String(co.name).toLowerCase().includes(q))
        const regMatch = u.ownership?.registrationNo && String(u.ownership.registrationNo).toLowerCase().includes(q)
        const familyMatch = (u.families || []).some(f =>
          (f.name && String(f.name).toLowerCase().includes(q)) ||
          (f.ulpin && String(f.ulpin).toLowerCase().includes(q))
        )
        const uMatch = ulpin.toLowerCase().includes(q) || ownerStr.toLowerCase().includes(q) || ownerNameStr.toLowerCase().includes(q) || coMatch || regMatch || familyMatch
        if (uMatch) {
          matches.push({
            type: 'unit',
            id: ulpin,
            name: `${ownerNameStr || ownerStr || 'Unit'} (${u.type || 'Unit'})`,
            desc: `${t('search.floor')} ${u.floorNumber ?? '—'} · ${bName}`,
            buildingId: b.id,
            unitId: u.ulpin,
            ownership: u.ownership,
            unitType: u.type,
            floorNumber: u.floorNumber,
            buildingName: bName,
          })
        }
      })
    })

    const utilityMatches = UTILITY_SEARCHES
      .filter(item => item.labels.some(label => label.includes(q) || q.includes(label)))
      .slice(0, 2)
      .map(item => ({
        type: 'utility',
        id: `utility-${item.key}`,
        name: item.label,
        desc: item.desc,
        utilityCategory: item.key,
      }))

    return [...utilityMatches, ...matches].slice(0, 8)
  }, [query, buildings, t])

  const runGeoSearch = useCallback(async (searchText) => {
    const trimmed = String(searchText || '').trim()
    if (trimmed.length < 2 || isFourteenDigitUlpIn(trimmed)) {
      setGeoResults([])
      setGeoLoading(false)
      setGeoError('')
      return []
    }

    if (geoAbortRef.current) geoAbortRef.current.abort()
    const controller = new AbortController()
    geoAbortRef.current = controller
    setGeoLoading(true)
    setGeoError('')
    try {
      const response = await fetch(`/api/geo/search?q=${encodeURIComponent(trimmed)}&limit=8`, {
        signal: controller.signal,
        headers: { Accept: 'application/json' },
      })
      if (!response.ok) throw new Error(`Location search returned HTTP ${response.status}`)
      const data = await response.json()
      if (controller.signal.aborted) return []
      const results = Array.isArray(data?.results) ? data.results : []
      setGeoResults(results)
      if (data?.error) setGeoError('Location source temporarily unavailable')
      return results
    } catch (error) {
      if (error?.name === 'AbortError') return []
      console.error('URDHVA location search error:', error)
      setGeoResults([])
      setGeoError('Location source temporarily unavailable')
      return []
    } finally {
      if (!controller.signal.aborted) setGeoLoading(false)
    }
  }, [])

  useEffect(() => {
    const trimmed = query.trim()
    if (trimmed.length < 2 || isFourteenDigitUlpIn(trimmed)) {
      if (geoAbortRef.current) geoAbortRef.current.abort()
      setGeoResults([])
      setGeoLoading(false)
      setGeoError('')
      return undefined
    }
    const timer = setTimeout(() => runGeoSearch(trimmed), GEO_SEARCH_DEBOUNCE_MS)
    return () => clearTimeout(timer)
  }, [query, localResults.length, runGeoSearch])

  useEffect(() => {
    function handleClickOutside(event) {
      if (wrapperRef.current && !wrapperRef.current.contains(event.target)) setIsOpen(false)
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => {
      document.removeEventListener('mousedown', handleClickOutside)
      if (geoAbortRef.current) geoAbortRef.current.abort()
    }
  }, [])

  const selectGeoLocation = (item) => {
    const lat = Number(item.lat)
    const lon = Number(item.lon)
    if (!Number.isFinite(lat) || !Number.isFinite(lon)) return
    closeBuilder()
    setMaharashtraUlpinResult(null)
    setGeographicMode(true)
    addSearchHistory({
      type: 'geo',
      id: item.place_id ? String(item.place_id) : `${lat.toFixed(5)},${lon.toFixed(5)}`,
      name: item.display_name || item.label || query,
      lat,
      lon,
      zoom: Number(item.zoom) || 13.5,
      source: item.source || 'OpenStreetMap Nominatim',
      locationType: item.type,
      display_name: item.display_name || item.label || query,
    })
    setGeoLocation({
      lat,
      lon,
      zoom: Number(item.zoom) || 13.5,
      label: item.display_name || item.label || query,
      type: item.type,
      source: item.source || 'OpenStreetMap Nominatim',
      boundingbox: item.boundingbox || null,
    })
    setQuery('')
    setGeoResults([])
    setIsOpen(false)
  }

  const lookupMaharashtraUlpin = useCallback(async (value) => {
    const ulpin = String(value || '').trim()
    if (!isFourteenDigitUlpIn(ulpin)) return null
    setUlpInLoading(true)
    setUlpInError('')
    try {
      const response = await fetch(`/api/maharashtra/ulpin?ulpin=${encodeURIComponent(ulpin)}`, { headers: { Accept: 'application/json' } })
      const payload = await response.json().catch(() => ({}))
      if (!response.ok) throw new Error(payload?.detail || `ULPIN lookup returned HTTP ${response.status}`)
      setMaharashtraUlpinResult(payload)
      setGeographicMode(true)
      if (payload?.status === 'resolved' && Number.isFinite(Number(payload.lat)) && Number.isFinite(Number(payload.lon))) {
        setGeoLocation({
          lat: Number(payload.lat),
          lon: Number(payload.lon),
          zoom: Math.min(18, Math.max(15, Number(payload.zoom) || 16.5)),
          label: payload.display_name || `ULPIN ${ulpin}`,
          type: 'parcel',
          source: payload.source || 'Maharashtra land-record source',
          boundingbox: payload.boundingbox || null,
        })
      }
      addSearchHistory({
        type: 'geo',
        id: ulpin,
        name: `ULPIN ${ulpin}`,
        lat: Number(payload.lat) || null,
        lon: Number(payload.lon) || null,
        zoom: Number(payload.zoom) || 16.5,
        source: payload.source || 'Maharashtra land-record source',
        locationType: 'parcel',
        display_name: payload.display_name || `Maharashtra ULPIN ${ulpin}`,
      })
      setQuery('')
      setGeoResults([])
      setIsOpen(false)
      return payload
    } catch (error) {
      console.error('URDHVA Maharashtra ULPIN lookup error:', error)
      const notice = { status: 'error', ulpin, state: 'Maharashtra', message: error?.message || 'ULPIN lookup failed' }
      setMaharashtraUlpinResult(notice)
      setUlpInError(notice.message)
      setGeographicMode(true)
      return null
    } finally {
      setUlpInLoading(false)
    }
  }, [addSearchHistory, setGeoLocation, setGeographicMode, setMaharashtraUlpinResult])

  const handleSelect = (item) => {
    if (item.type === 'geo') {
      selectGeoLocation(item.location)
      return
    }
    if (item.type === 'maharashtra-ulpin') {
      lookupMaharashtraUlpin(item.ulpin)
      return
    }
    if (item.type === 'utility') {
      closeBuilder()
      setMaharashtraUlpinResult(null)
      setGeographicMode(true)
      requestGeoUtility(item.utilityCategory)
      addSearchHistory({
        type: 'utility',
        id: item.id,
        name: item.name,
        utilityCategory: item.utilityCategory,
      })
      setQuery('')
      setGeoResults([])
      setIsOpen(false)
      return
    }
    setIsOpen(false)
    setQuery('')
    closeBuilder()
    addSearchHistory(item)

    if (item.type === 'building') {
      selectBuilding(item.buildingId)
    } else if (item.type === 'unit') {
      selectBuilding(item.buildingId)
      setTimeout(() => selectUnit(item.unitId), 50)
    }
  }

  const handleKeyDown = async (event) => {
    if (event.key !== 'Enter') return
    event.preventDefault()
    const trimmed = query.trim()
    if (isFourteenDigitUlpIn(trimmed)) {
      await lookupMaharashtraUlpin(trimmed)
      return
    }
    if (localResults.length > 0) {
      handleSelect(localResults[0])
      return
    }
    const firstGeo = geoResults[0] || (await runGeoSearch(query))[0]
    if (firstGeo) selectGeoLocation(firstGeo)
  }

  const ulpinQuery = isFourteenDigitUlpIn(query.trim())
  const specialUlpInResult = ulpinQuery ? [{
    type: 'maharashtra-ulpin',
    id: query.trim(),
    ulpin: query.trim(),
    name: `Maharashtra ULPIN ${query.trim()}`,
    desc: 'Official parcel/jurisdiction lookup',
  }] : []

  const displayedResults = [
    ...specialUlpInResult,
    ...localResults,
    ...geoResults.slice(0, Math.max(0, 8 - localResults.length - specialUlpInResult.length)).map(item => ({
      type: 'geo',
      id: item.place_id ? String(item.place_id) : `${item.lat},${item.lon}`,
      name: item.display_name || item.label || query,
      desc: getLocationKind(item.type),
      location: item,
    })),
  ]

  return (
    <div ref={wrapperRef} className="relative w-80 md:w-96">
      <div className="relative flex items-center">
        <Search className="absolute left-3 w-4 h-4 text-slate-400" />
        <input
          type="text"
          value={query}
          onChange={(event) => { setQuery(event.target.value); setIsOpen(true) }}
          onFocus={() => setIsOpen(true)}
          onKeyDown={handleKeyDown}
          placeholder="Search location, property, ULPIN, building, road…"
          autoComplete="off"
          name="urdhva-location-property-search"
          className="w-full bg-white border border-slate-300 text-slate-800 text-xs rounded-xl pl-9 pr-9 py-2 focus:outline-none focus:border-cyan-500 focus:ring-2 focus:ring-cyan-500/20 transition-all placeholder-slate-400 shadow-sm"
          aria-label="Search location, property, ULPIN, building or road"
        />
        {query && (
          <button
            type="button"
            aria-label="Clear search"
            onMouseDown={(event) => event.preventDefault()}
            onClick={() => {
              if (geoAbortRef.current) geoAbortRef.current.abort()
              setQuery('')
              setGeoResults([])
              setGeoLoading(false)
              setGeoError('')
              setIsOpen(false)
            }}
            className="absolute right-2 p-1 rounded-md text-slate-400 hover:text-slate-700 hover:bg-slate-100"
          >
            <X size={14} />
          </button>
        )}
      </div>

      {isOpen && (query.trim().length > 0 || searchHistory.length > 0) && (
        <div className="absolute top-full left-0 w-full mt-2 bg-white border border-slate-200 rounded-xl shadow-2xl max-h-[460px] overflow-y-auto z-50">
          {query.trim().length === 0 ? (
            <div className="p-2">
              <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wider px-2 pb-1">{t('search.recentSearches')}</p>
              {searchHistory.length === 0 ? (
                <p className="text-xs text-slate-400 px-2 py-2">{t('search.noRecentSearches')}</p>
              ) : searchHistory.map((item, i) => (
                <button key={`${item.id}-${i}`} onClick={() => handleSelect(item)} className="w-full text-left px-3 py-2 hover:bg-slate-50 rounded-lg flex items-center gap-3 cursor-pointer">
                  {item.type === 'geo' ? <MapPin className="w-4 h-4 text-cyan-600" /> : item.type === 'utility' ? <span className="text-cyan-600">◉</span> : <span className="text-slate-400">🕒</span>}
                  <div className="min-w-0">
                    <p className="text-xs font-semibold text-slate-800 truncate">{item.name || item.id}</p>
                    <p className="text-[10px] text-slate-500">{item.type === 'geo' ? `${getLocationKind(item.locationType)} · Open map` : item.id}</p>
                  </div>
                </button>
              ))}
            </div>
          ) : (
            <div className="p-2 divide-y divide-slate-100">
              {ulpinQuery && (
                <button type="button" onClick={() => lookupMaharashtraUlpin(query.trim())} className="w-full text-left px-3 py-2.5 hover:bg-emerald-50 rounded-lg flex items-start gap-3 cursor-pointer">
                  {ulpinLoading ? <Loader2 className="w-4 h-4 animate-spin text-emerald-700 mt-0.5" /> : <Hash className="w-4 h-4 text-emerald-700 mt-0.5" />}
                  <div className="flex-1 min-w-0">
                    <p className="text-xs font-bold text-slate-800">Maharashtra ULPIN {query.trim()}</p>
                    <p className="text-[10px] text-emerald-700 font-semibold mt-0.5">Official parcel / jurisdiction lookup</p>
                    <p className="text-[9px] text-slate-500 mt-0.5">Resolve exact parcel location when an authorized Maharashtra source is connected.</p>
                    {ulpinError && <p className="text-[9px] text-amber-700 mt-1">{ulpinError}</p>}
                  </div>
                </button>
              )}
              {!ulpinQuery && geoLoading && localResults.length === 0 && (
                <div className="px-3 py-2 text-[10px] text-slate-500 flex items-center gap-2">
                  <Loader2 className="w-3.5 h-3.5 animate-spin text-cyan-600" /> Searching Indian locations…
                </div>
              )}
              {!ulpinQuery && displayedResults.length === 0 && !geoLoading ? (
                <div className="px-3 py-4 text-center">
                  <p className="text-sm font-bold text-slate-800">{geoError || t('search.notFound')}</p>
                  <p className="text-[10px] text-slate-500 mt-1">Try a city, district, taluka, village, locality, road, landmark or a 14-digit Maharashtra ULPIN.</p>
                </div>
              ) : displayedResults.map((item, i) => {
                if (item.type === 'maharashtra-ulpin') {
                  return (
                    <button key={`ulpin-${item.id}-${i}`} onClick={() => handleSelect(item)} className="w-full text-left px-3 py-2.5 hover:bg-emerald-50 rounded-lg flex items-start gap-3 cursor-pointer">
                      <Hash className="w-5 h-5 text-emerald-700 shrink-0" />
                      <div className="flex-1 min-w-0">
                        <p className="text-xs font-bold text-slate-800 font-mono truncate">{item.name}</p>
                        <p className="text-[10px] text-emerald-700 font-semibold">{item.desc}</p>
                      </div>
                      <span className="text-[9px] font-bold text-emerald-700 border border-emerald-200 bg-white px-1.5 py-0.5 rounded">Lookup</span>
                    </button>
                  )
                }
                if (item.type === 'utility') {
                  const utilityColors = { gas: '#f97316', water: '#06b6d4', sewer: '#8b5cf6', electricity: '#eab308', telecom: '#2563eb' }
                  const utilityColor = utilityColors[item.utilityCategory] || '#0ea5e9'
                  return (
                    <button key={`${item.type}-${item.id}-${i}`} onClick={() => handleSelect(item)} className="w-full text-left px-3 py-2.5 hover:bg-slate-50 rounded-lg flex items-center gap-3 cursor-pointer">
                      <span className="w-5 h-5 rounded-full shrink-0 border-2 border-white shadow" style={{ background: utilityColor }} />
                      <div className="flex-1 min-w-0">
                        <p className="text-xs font-bold text-slate-800 truncate">{item.name}</p>
                        <p className="text-[10px] text-slate-500 mt-0.5">{item.desc}</p>
                      </div>
                      <span className="text-[9px] font-bold text-cyan-700 border border-cyan-200 bg-cyan-50 px-1.5 py-0.5 rounded">Map layer</span>
                    </button>
                  )
                }
                if (item.type === 'building') {
                  return (
                    <button key={`${item.type}-${item.id}-${i}`} onClick={() => handleSelect(item)} className="w-full text-left px-3 py-2.5 hover:bg-slate-50 rounded-lg flex items-center gap-3 cursor-pointer">
                      <Building2 className="w-5 h-5 text-cyan-600 shrink-0" />
                      <div className="flex-1 min-w-0">
                        <p className="text-xs font-bold text-cyan-600 font-mono truncate">{item.id}</p>
                        <p className="text-xs text-slate-800 font-medium truncate">{item.name}</p>
                        <p className="text-[10px] text-slate-500">{item.desc}</p>
                      </div>
                    </button>
                  )
                }
                if (item.type === 'geo') {
                  const loc = item.location
                  return (
                    <button key={`${item.type}-${item.id}-${i}`} onClick={() => selectGeoLocation(loc)} className="w-full text-left px-3 py-2.5 hover:bg-cyan-50/60 rounded-lg flex items-start gap-3 cursor-pointer">
                      {['landmark', 'attraction', 'poi'].includes(String(loc?.type || '').toLowerCase()) ? <Landmark className="w-4 h-4 text-cyan-700 mt-0.5 shrink-0" /> : <Globe2 className="w-4 h-4 text-cyan-700 mt-0.5 shrink-0" />}
                      <div className="flex-1 min-w-0">
                        <p className="text-xs font-bold text-slate-800 truncate">{item.name}</p>
                        <p className="text-[10px] text-cyan-700 font-semibold mt-0.5">{getLocationKind(loc?.type)}</p>
                        <p className="text-[9px] text-slate-500 font-mono mt-0.5">{Number(loc?.lat).toFixed(5)}, {Number(loc?.lon).toFixed(5)} · OpenStreetMap</p>
                      </div>
                      <span className="text-[9px] font-bold text-cyan-700 border border-cyan-200 bg-white px-1.5 py-0.5 rounded">Open 3D</span>
                    </button>
                  )
                }

                const os = item.ownership
                return (
                  <div key={`${item.type}-${item.id}-${i}`} className="w-full text-left p-2.5 hover:bg-cyan-50/40 rounded-xl flex items-start gap-2.5 cursor-pointer" onClick={() => handleSelect(item)}>
                    <span className="text-lg mt-0.5">🚪</span>
                    <div className="flex-1 min-w-0 space-y-1">
                      <div className="flex items-center justify-between gap-1">
                        <span className="text-xs font-bold text-cyan-700 font-mono truncate">{item.id}</span>
                        <div className="flex items-center gap-1.5 shrink-0">
                          {os?.verificationStatus && (
                            <span className={`text-[9px] font-bold font-mono px-1.5 py-0.2 rounded border ${os.verificationStatus === 'Verified' ? 'bg-emerald-50 text-emerald-700 border-emerald-300' : os.verificationStatus === 'Pending' ? 'bg-amber-50 text-amber-700 border-amber-300' : 'bg-red-50 text-red-700 border-red-300'}`}>● {os.verificationStatus}</span>
                          )}
                          <button type="button" title="Print Property Receipt" onClick={(e) => { e.stopPropagation(); const b = buildings.find(bd => bd.id === item.buildingId); const u = b?.units.find(un => un.ulpin === item.unitId); if (b && u) openPropertyReceipt(u, b) }} className="p-1 rounded-md hover:bg-slate-200 text-slate-500 hover:text-slate-800 cursor-pointer">
                            <Printer className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </div>
                      <div className="text-xs font-semibold text-slate-900 truncate">{item.name}</div>
                      {os && (
                        <div className="bg-slate-50 p-2 rounded-lg border border-slate-200 text-[10px] space-y-1">
                          <div className="flex items-center justify-between text-slate-700 font-medium"><span>📜 {os.ownershipType} ({os.sharePercent}% Share)</span><span className="font-mono text-slate-500">{os.registrationNo}</span></div>
                          <div className="flex items-center justify-between text-slate-500 text-[9px]"><span>📅 Mutated: {os.mutationDate}</span>{os.contact && <span>📞 {os.contact}</span>}</div>
                          {os.coOwners && os.coOwners.length > 0 && <div className="pt-1 border-t border-slate-200 text-[9px] text-purple-700 font-medium truncate">👥 Co-owners: {os.coOwners.map(c => `${c.name} (${c.sharePercent}%)`).join(', ')}</div>}
                        </div>
                      )}
                      <p className="text-[10px] text-slate-500">{item.desc}</p>
                    </div>
                  </div>
                )
              })}
            </div>
          )}
        </div>
      )}
    </div>
  )
}
