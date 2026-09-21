const DEFAULT_DEPTHS_M = {
  water: 1.3,
  sewer: 2.8,
  gas: 2.1,
  electricity: 1.7,
  telecom: 0.9,
}

const LABELS = {
  water: 'Water demo corridor',
  sewer: 'Sewer demo corridor',
  gas: 'Gas demo corridor',
  electricity: 'Electricity demo corridor',
  telecom: 'Telecom demo corridor',
}

function normalizeGeometry(feature) {
  const geometry = feature?.geometry
  if (!geometry) return null
  if (geometry.type === 'LineString') return geometry.coordinates || []
  if (geometry.type === 'MultiLineString') return (geometry.coordinates || []).flat()
  return null
}

function roadFeaturesFromMap(map) {
  if (!map) return []
  const out = []
  try {
    const sourceFeatures = map.querySourceFeatures('overture-transportation', { sourceLayer: 'segment' }) || []
    for (const feature of sourceFeatures) {
      const props = feature?.properties || {}
      if (props.subtype && props.subtype !== 'road') continue
      const coords = normalizeGeometry(feature)
      if (coords?.length >= 2) out.push({ feature, coords })
    }
  } catch (_) {}
  if (!out.length) {
    try {
      const rendered = map.queryRenderedFeatures(undefined, { layers: ['overture-roads'] }) || []
      for (const feature of rendered) {
        const coords = normalizeGeometry(feature)
        if (coords?.length >= 2) out.push({ feature, coords })
      }
    } catch (_) {}
  }
  return out
}

function dedupeRoads(items) {
  const seen = new Set()
  return items.filter(item => {
    const props = item.feature?.properties || {}
    const id = String(props.id ?? item.feature?.id ?? `${item.coords[0]?.[0]}:${item.coords[0]?.[1]}:${item.coords.length}`)
    if (seen.has(id)) return false
    seen.add(id)
    return true
  })
}

function endpointKey(point, tolerance = 0.00004) {
  if (!Array.isArray(point) || point.length < 2) return null
  const lon = Number(point[0]); const lat = Number(point[1])
  if (!Number.isFinite(lon) || !Number.isFinite(lat)) return null
  return `${Math.round(lon / tolerance)}:${Math.round(lat / tolerance)}`
}

// Join adjacent visible road segments into continuous network chains. We only
// connect endpoints within a few metres; we never bridge arbitrary gaps.
function mergeConnectedRoads(items, maxItems = 220) {
  const lines = items
    .map(item => item?.coords || [])
    .filter(coords => coords.length >= 2)
    .map(coords => coords.filter((p, i) => i === 0 || p[0] !== coords[i - 1][0] || p[1] !== coords[i - 1][1]))
    .filter(coords => coords.length >= 2)
    .slice(0, maxItems)
  if (!lines.length) return []

  const endpointMap = new Map()
  const add = (key, index, side) => {
    if (!key) return
    const arr = endpointMap.get(key) || []
    arr.push({ index, side })
    endpointMap.set(key, arr)
  }
  lines.forEach((coords, index) => {
    add(endpointKey(coords[0]), index, 'start')
    add(endpointKey(coords[coords.length - 1]), index, 'end')
  })

  const used = new Set()
  const chains = []
  for (let seed = 0; seed < lines.length; seed += 1) {
    if (used.has(seed)) continue
    let chain = [...lines[seed]]
    used.add(seed)
    let keepGrowing = true
    while (keepGrowing) {
      keepGrowing = false
      const key = endpointKey(chain[chain.length - 1])
      const candidates = (endpointMap.get(key) || []).filter(item => !used.has(item.index))
      if (!candidates.length) break
      const next = candidates[0]
      let coords = lines[next.index]
      if (next.side === 'end') coords = [...coords].reverse()
      chain = chain.concat(coords.slice(1))
      used.add(next.index)
      keepGrowing = true
    }
    keepGrowing = true
    while (keepGrowing) {
      keepGrowing = false
      const key = endpointKey(chain[0])
      const candidates = (endpointMap.get(key) || []).filter(item => !used.has(item.index))
      if (!candidates.length) break
      const next = candidates[0]
      let coords = lines[next.index]
      if (next.side === 'start') coords = [...coords].reverse()
      chain = coords.slice(0, -1).concat(chain)
      used.add(next.index)
      keepGrowing = true
    }
    chains.push(chain)
  }
  return chains
}

/**
 * Prototype-only fallback: uses source-mapped Overture road geometry as a
 * visually aligned corridor when no authoritative underground utility line
 * is available in the current area. It is explicitly marked DEMO and must not
 * be interpreted as a survey or official utility record.
 */
export function buildDemoUtilityFeaturesFromRoads(map, category, limit = 120) {
  if (!DEFAULT_DEPTHS_M[category]) return []
  const roads = dedupeRoads(roadFeaturesFromMap(map))
  const chains = mergeConnectedRoads(roads, Math.max(60, Math.min(limit, 220)))
  return chains.map((coords, index) => ({
    type: 'Feature',
    geometry: { type: 'LineString', coordinates: coords },
    properties: {
      source: 'URDHVA prototype • connected from source-mapped Overture road geometry',
      source_id: `demo-${category}-network-${index + 1}`,
      network_id: `demo-${category}-network`,
      network_segment: index + 1,
      network_connected: true,
      category,
      name: `${LABELS[category]} • connected corridor ${index + 1}`,
      operator: null,
      substance: category === 'gas' ? 'natural_gas (demo)' : category,
      location: 'underground (demo visualization)',
      depth_m: DEFAULT_DEPTHS_M[category],
      diameter_m: null,
      layer: null,
      tunnel: null,
      ref: null,
      data_status: 'demo-visualization',
      depth_status: 'Prototype demo depth — not source measured',
      demo: true,
      demo_depth_m: DEFAULT_DEPTHS_M[category],
      demo_basis: 'Road-aligned connected visualization using real source-mapped road geometry',
    },
  }))
}

export function isDemoUtilityFeature(feature) {
  return feature?.properties?.data_status === 'demo-visualization' || feature?.properties?.demo === true
}
