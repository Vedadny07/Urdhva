import React, { useMemo, useRef } from 'react'
import * as THREE from 'three'
import { Html } from '@react-three/drei'
import { useFrame } from '@react-three/fiber'
import useStore from '../store'

// ─── Label collision helpers ──────────────────────────────────────────────
// Simple padded axis-aligned bounding box overlap test, used both for
// label-vs-label and label-vs-UI-panel collision checks.
function rectsOverlap(a, b, padding = 4) {
  return !(
    a.right + padding < b.left ||
    a.left - padding > b.right ||
    a.bottom + padding < b.top ||
    a.top - padding > b.bottom
  )
}

function getOpenPanelRects() {
  const nodes = document.querySelectorAll('[data-floating-panel="true"]')
  const rects = []
  nodes.forEach((el) => {
    const r = el.getBoundingClientRect()
    // A collapsed/zero-size or off-screen panel shouldn't block labels.
    if (r.width > 0 && r.height > 0) rects.push(r)
  })
  return rects
}

function RoadSegment({ road, undergroundMode, registerLabelEl }) {
  const { from, to, width = 10, isHighway = false, name, id } = road

  const { position, rotation, length } = useMemo(() => {
    const dx = to[0] - from[0]
    const dz = to[1] - from[1]
    const len = Math.sqrt(dx * dx + dz * dz)
    const angle = Math.atan2(dz, dx)
    const mx = (from[0] + to[0]) / 2
    const mz = (from[1] + to[1]) / 2

    return {
      position: [mx, 0.035, mz],
      rotation: [0, -angle, 0],
      length: len,
    }
  }, [from, to])

  if (length < 0.1) return null

  const stripeColor = isHighway ? '#fbbf24' : '#e2e8f0'

  return (
    <group position={position} rotation={rotation}>
      {/* 1. Main Road Surface (Rotated flat on ground) — green, per the
          cadastral color legend (Underground=gray, Building=amber,
          Road=green, Tree/Parkland=dark green). */}
      <mesh receiveShadow rotation={[-Math.PI / 2, 0, 0]}>
        <planeGeometry args={[length, width]} />
        <meshStandardMaterial
          color="#4a7c3f"
          roughness={0.9}
          metalness={0.05}
          transparent={undergroundMode}
          opacity={undergroundMode ? 0.15 : 0.98}
          depthWrite={!undergroundMode}
        />
      </mesh>

      {/* 2. Curb Edges (Left & Right) */}
      <mesh position={[0, width / 2 - 0.25, 0.005]} rotation={[-Math.PI / 2, 0, 0]}>
        <planeGeometry args={[length, 0.5]} />
        <meshStandardMaterial
          color="#356030"
          transparent={undergroundMode}
          opacity={undergroundMode ? 0.15 : 0.8}
        />
      </mesh>
      <mesh position={[0, -width / 2 + 0.25, 0.005]} rotation={[-Math.PI / 2, 0, 0]}>
        <planeGeometry args={[length, 0.5]} />
        <meshStandardMaterial
          color="#356030"
          transparent={undergroundMode}
          opacity={undergroundMode ? 0.15 : 0.8}
        />
      </mesh>

      {/* 3. Center Lane Divider Line */}
      <mesh position={[0, 0, 0.01]} rotation={[-Math.PI / 2, 0, 0]}>
        <planeGeometry args={[length, 0.35]} />
        <meshBasicMaterial
          color={stripeColor}
          transparent
          opacity={undergroundMode ? 0.2 : 0.85}
        />
      </mesh>

      {/* 4. Secondary White Lane Lines for 4-lane Highways */}
      {isHighway && (
        <>
          <mesh position={[0, width / 4, 0.01]} rotation={[-Math.PI / 2, 0, 0]}>
            <planeGeometry args={[length, 0.2]} />
            <meshBasicMaterial color="#94a3b8" transparent opacity={undergroundMode ? 0.15 : 0.5} />
          </mesh>
          <mesh position={[0, -width / 4, 0.01]} rotation={[-Math.PI / 2, 0, 0]}>
            <planeGeometry args={[length, 0.2]} />
            <meshBasicMaterial color="#94a3b8" transparent opacity={undergroundMode ? 0.15 : 0.5} />
          </mesh>
        </>
      )}

      {/* 5. 3D Floating Street Sign Marker at Road Midpoint.
          `name` is only ever set on the single longest segment of a named
          road (see PolylineRoad/RoadNetwork below), so a road chopped into
          many OSM way-segments only ever gets ONE label to begin with.
          Screen-space overlap with other labels / open UI panels is then
          handled per-frame by RoadNetwork's collision pass via `registerLabelEl`. */}
      {!undergroundMode && name && (
        <Html
          position={[0, 1.2, 0]}
          center
          distanceFactor={140}
          style={{ pointerEvents: 'none', userSelect: 'none' }}
        >
          <div
            ref={(el) => registerLabelEl && registerLabelEl(id, el)}
            className="px-2.5 py-1 rounded bg-slate-900/92 border border-slate-700/80 shadow text-[13px] font-mono text-slate-100 font-bold whitespace-nowrap flex items-center gap-1.5"
            style={{ transition: 'opacity 120ms linear' }}
          >
            <span className="text-emerald-400">🛣️</span>
            <span>{name}</span>
          </div>
        </Html>
      )}
    </group>
  )
}

// Multi-point polyline road (e.g. from OpenStreetMap ways)
function PolylineRoad({ road, undergroundMode, canLabel, registerLabelEl }) {
  const { points = [], width = 8, name, type } = road
  if (!points || points.length < 2) return null

  // Generate segments between consecutive waypoints. Only the single
  // longest/eligible road instance for a given name (decided in
  // RoadNetwork, once per name across ALL road entries — not just within
  // this one) ever gets a label, and even then only on its own midpoint
  // segment.
  const segments = useMemo(() => {
    const segs = []
    for (let i = 0; i < points.length - 1; i++) {
      segs.push({
        id: `${road.id}-seg-${i}`,
        from: points[i],
        to: points[i + 1],
        width,
        isHighway: type === 'primary' || type === 'trunk',
        name: (canLabel && i === Math.floor(points.length / 2)) ? name : null,
      })
    }
    return segs
  }, [points, width, road.id, type, name, canLabel])

  return (
    <group>
      {segments.map((seg) => (
        <RoadSegment key={seg.id} road={seg} undergroundMode={undergroundMode} registerLabelEl={registerLabelEl} />
      ))}
    </group>
  )
}

// ─── MAIN ROAD NETWORK COMPONENT ─────────────────────────────────────────────
export default function RoadNetwork() {
  const undergroundMode = useStore((s) => s.undergroundMode)
  const storeRoads = useStore((s) => s.roads) || []

  // Registry of currently-mounted label DOM elements, keyed by segment id.
  // Populated/cleared by each label's ref callback; read once per frame by
  // the collision pass below. A plain ref (not state) since it's mutated on
  // every mount/unmount and read on every frame — neither should trigger a
  // React re-render.
  const labelElsRef = useRef(new Map())
  const registerLabelEl = (id, el) => {
    if (el) labelElsRef.current.set(id, el)
    else labelElsRef.current.delete(id)
  }

  // Decide, per road NAME (not per individual OSM way/segment), which single
  // road entry is allowed to render a label at all — the longest one. This
  // is what fixes duplicate adjacent labels like two back-to-back
  // "Ganeshkhind Road" signs: when OSM splits one street into several way
  // segments that all share a name, only its longest segment qualifies.
  const labelEligibleIds = useMemo(() => {
    const totalLengthById = new Map()
    const bestIdByName = new Map() // normalized name -> { id, length }

    for (const road of storeRoads) {
      if (!road.name) continue
      const points = road.points || []
      let total = 0
      for (let i = 0; i < points.length - 1; i++) {
        const dx = points[i + 1][0] - points[i][0]
        const dz = points[i + 1][1] - points[i][1]
        total += Math.sqrt(dx * dx + dz * dz)
      }
      totalLengthById.set(road.id, total)

      const key = road.name.trim().toLowerCase()
      const current = bestIdByName.get(key)
      if (!current || total > current.length) {
        bestIdByName.set(key, { id: road.id, length: total })
      }
    }

    return new Set(Array.from(bestIdByName.values()).map((v) => v.id))
  }, [storeRoads])

  // Per-frame screen-space collision pass: read each currently-rendered
  // label's real on-screen box (via getBoundingClientRect, which already
  // accounts for drei's Html projection/occlusion), suppress any label that
  // overlaps a label already accepted this frame or an open floating UI
  // panel, and show the rest. Visibility is toggled via direct style
  // mutation rather than React state to avoid re-render churn every frame.
  useFrame(() => {
    const labelEls = labelElsRef.current
    if (labelEls.size === 0) return

    const panelRects = getOpenPanelRects()
    const acceptedRects = []

    // Stable order = Map insertion order = render/mount order, so the same
    // label consistently wins ties frame to frame instead of flickering.
    labelEls.forEach((el) => {
      if (!el) return
      const rect = el.getBoundingClientRect()
      if (rect.width === 0 && rect.height === 0) return // detached/not laid out yet

      const blockedByPanel = panelRects.some((p) => rectsOverlap(rect, p, 2))
      const blockedByLabel = !blockedByPanel && acceptedRects.some((r) => rectsOverlap(rect, r, 4))
      const shouldShow = !blockedByPanel && !blockedByLabel

      el.style.visibility = shouldShow ? 'visible' : 'hidden'
      if (shouldShow) acceptedRects.push(rect)
    })
  })

  // If no roads are loaded (default empty map state), render nothing!
  if (!storeRoads || storeRoads.length === 0) {
    return null
  }

  return (
    <group name="road-network">
      {/* Dynamic / OpenStreetMap Survey Roads */}
      {storeRoads.map((road) => (
        <PolylineRoad
          key={road.id}
          road={road}
          undergroundMode={undergroundMode}
          canLabel={labelEligibleIds.has(road.id)}
          registerLabelEl={registerLabelEl}
        />
      ))}
    </group>
  )
}
