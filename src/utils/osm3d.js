/**
 * Source-backed helpers for the nationwide OSM 3D layer.
 *
 * The geographic map uses OSM/Overpass only when the source provides enough
 * information to describe the building vertically. We never invent a height
 * or floor count from footprint size here.
 */

const OSM_DEFAULT_FLOOR_HEIGHT_M = 3.2

function finitePositive(value) {
  const n = Number(value)
  return Number.isFinite(n) && n > 0 ? n : null
}

function floorCountForFeature(feature) {
  const props = feature?.properties || {}
  const sourceLevels = finitePositive(props.levels ?? props.levels_aboveground ?? props['building:levels'])
  if (sourceLevels) return { count: Math.min(36, Math.max(1, Math.round(sourceLevels))), status: 'source' }

  const estimatedFloors = finitePositive(props.estimated_floors)
  if (estimatedFloors) return { count: Math.min(36, Math.max(1, Math.round(estimatedFloors))), status: 'estimated' }

  return { count: 0, status: 'unavailable' }
}

function totalHeightForFeature(feature, floorInfo) {
  const props = feature?.properties || {}
  const sourceHeight = finitePositive(props.height_m ?? props.height)
  if (sourceHeight) return { height: sourceHeight, status: 'source' }

  const renderHeight = finitePositive(props.render_height_m)
  if (renderHeight && floorInfo.count > 0) return { height: renderHeight, status: floorInfo.status === 'source' ? 'estimated_from_floors' : 'estimated' }

  if (floorInfo.count > 0) return { height: floorInfo.count * OSM_DEFAULT_FLOOR_HEIGHT_M, status: 'estimated' }
  return { height: 0, status: 'unavailable' }
}

/**
 * Turn OSM building polygons into one feature per visible floor.
 * This mirrors the friend's Pune "footprint -> floors" approach while keeping
 * the same source geometry and data provenance for nationwide rendering.
 */
export function expandOsmFeaturesToFloorFeatures(featureCollection) {
  const features = Array.isArray(featureCollection?.features) ? featureCollection.features : []
  const floorFeatures = []
  let sourceFloorBuildings = 0
  let estimatedFloorBuildings = 0

  for (const feature of features) {
    const props = feature?.properties || {}
    const isPart = props.building_part != null && props.building_part !== ''
    if (isPart) continue

    const floorInfo = floorCountForFeature(feature)
    if (floorInfo.count < 2) continue

    const heightInfo = totalHeightForFeature(feature, floorInfo)
    if (heightInfo.height <= 0) continue

    const base = finitePositive(props.min_height_m ?? props.min_height) || 0
    const availableVertical = Math.max(0.1, heightInfo.height - base)
    const floorHeight = availableVertical / floorInfo.count
    if (!Number.isFinite(floorHeight) || floorHeight <= 0) continue

    if (floorInfo.status === 'source') sourceFloorBuildings += 1
    else estimatedFloorBuildings += 1

    for (let floor = 1; floor <= floorInfo.count; floor += 1) {
      const gap = Math.min(0.08, floorHeight * 0.035)
      const slabBase = base + (floor - 1) * floorHeight + (floor === 1 ? 0 : gap)
      const slabTop = base + floor * floorHeight - gap
      if (slabTop <= slabBase) continue

      floorFeatures.push({
        type: 'Feature',
        geometry: feature.geometry,
        properties: {
          source_id: props.source_id || props.id || '',
          floor,
          total_floors: floorInfo.count,
          floor_data_status: floorInfo.status,
          slab_base_m: Number(slabBase.toFixed(3)),
          slab_top_m: Number(slabTop.toFixed(3)),
          floor_height_m: Number(floorHeight.toFixed(3)),
          total_height_m: Number(heightInfo.height.toFixed(3)),
          source: props.source || 'OpenStreetMap via Overpass API',
        },
      })
    }
  }

  return {
    type: 'FeatureCollection',
    features: floorFeatures,
  }
}

export function summarizeOsmFloorFeatures(featureCollection) {
  const features = Array.isArray(featureCollection?.features) ? featureCollection.features : []
  const buildingIds = new Set()
  const estimatedBuildingIds = new Set()
  const sourceBuildingIds = new Set()

  for (const feature of features) {
    const props = feature?.properties || {}
    const id = String(props.source_id || '')
    if (!id) continue
    buildingIds.add(id)
    if (props.floor_data_status === 'source') sourceBuildingIds.add(id)
    if (props.floor_data_status === 'estimated') estimatedBuildingIds.add(id)
  }

  return {
    buildings: buildingIds.size,
    floorFeatures: features.length,
    sourceFloorBuildings: sourceBuildingIds.size,
    estimatedFloorBuildings: estimatedBuildingIds.size,
  }
}
