// src/utils/ulpin.js
//
// Frontend counterpart to backend/ulpin.py, used ONLY for the client-only
// fallback paths in store.js — cases where a building is created locally
// because a backend call failed/is unavailable (e.g. `deployLidarBuilding`'s
// catch block). When the backend is reachable it always issues the real
// base ULPIN via POST /api/ulpin/generate (or as part of building creation),
// and this helper is not used.
//
// It mirrors the real 14-digit Bhu-Aadhaar/ULPIN structure:
//   State(2) + District(2) + Sub-district/Tehsil(2) + Village(4) + Parcel(4)
// so that even offline-created buildings get a plausible, uniquely
// sequenced, standards-shaped identifier instead of an ad hoc string.

export const STATE_CODE = '27'   // Maharashtra
export const DISTRICT_CODE = '25' // Pune

// Fallback locality for buildings created client-side with no known survey
// locality — kept distinct from every backend/demo-dataset locality so it's
// obviously "unplaced" if ever cross-referenced.
const FALLBACK_SUBDISTRICT = '09'
const FALLBACK_VILLAGE = '0099'

function formatDisplay(compact) {
  if (!compact || compact.length !== 14) return compact
  return `${compact.slice(0, 2)}-${compact.slice(2, 4)}-${compact.slice(4, 6)}-${compact.slice(6, 10)}-${compact.slice(10, 14)}`
}

/** Public: formats a compact 14-digit stored base ULPIN as the dashed,
 * human-readable display form. Returns the input unchanged if it doesn't
 * look like a compact base (e.g. an older building with no baseUlpin yet). */
export function formatUlpinDisplay(compact) {
  return formatDisplay(compact)
}

/** Public: given a building object, returns the best base-ULPIN display
 * string to build further unit ULPINs from — the building's own compliant
 * base if it has one, otherwise its internal id (legacy fallback so older
 * buildings without a baseUlpin keep working). */
export function baseDisplayForBuilding(building) {
  if (building && building.baseUlpin) return formatDisplay(building.baseUlpin)
  return building ? building.id : ''
}

/**
 * Generates the next sequential base ULPIN for the client-only fallback
 * village, using how many buildings already carry a base ULPIN in that
 * village as the next parcel number. Returns { stored, display }.
 */
export function generateLocalBaseUlpin(existingBuildings = []) {
  const prefix = `${STATE_CODE}${DISTRICT_CODE}${FALLBACK_SUBDISTRICT}${FALLBACK_VILLAGE}`
  const usedParcels = (existingBuildings || [])
    .map(b => b.baseUlpin)
    .filter(base => typeof base === 'string' && base.startsWith(prefix))
    .map(base => parseInt(base.slice(10, 14), 10))
    .filter(n => !isNaN(n))

  const nextParcel = (usedParcels.length ? Math.max(...usedParcels) : 0) + 1
  const stored = `${prefix}${String(nextParcel).padStart(4, '0')}`
  return { stored, display: formatDisplay(stored) }
}

/** Builds a URDHVA vertical-property display identifier from a parcel base and vertical suffix. */
export function buildUnitUlpin(baseDisplay, suffix) {
  return `${baseDisplay}-${suffix}`
}
