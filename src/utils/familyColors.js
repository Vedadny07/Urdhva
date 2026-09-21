// Shared vibrant palette and helpers for multi-family apartment parcels
export const FAMILY_COLORS = [
  '#0284c7', // Sky Blue
  '#10b981', // Emerald Green
  '#8b5cf6', // Violet
  '#f59e0b', // Amber / Warm Orange
  '#ec4899', // Pink / Rose
  '#06b6d4', // Cyan
  '#f97316', // Orange
  '#6366f1', // Indigo
  '#14b8a6', // Teal
  '#d946ef', // Fuchsia
  '#84cc16', // Lime
  '#3b82f6', // Cobalt Blue
]

export function getFamilyColor(family, index = 0) {
  if (family && family.color) return family.color
  return FAMILY_COLORS[index % FAMILY_COLORS.length]
}

export function hashColor(name) {
  if (!name) return FAMILY_COLORS[0]
  let hash = 0
  for (let i = 0; i < name.length; i++) {
    hash = name.charCodeAt(i) + ((hash << 5) - hash)
  }
  return FAMILY_COLORS[Math.abs(hash) % FAMILY_COLORS.length]
}
