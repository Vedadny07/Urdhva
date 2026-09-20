import React, { useRef, useEffect, useState, useCallback, useMemo } from 'react'
import { Canvas, useFrame, useThree } from '@react-three/fiber'
import * as THREE from 'three'
import { useTranslation, LANGUAGES } from '../utils/i18n'

// ═════════════════════════════════════════════════════════════════════════════
//  CITY DATA — buildings, parcels, underground pipes
// ═════════════════════════════════════════════════════════════════════════════

// Each building: pos [x,z], rise [scrollStart, scrollEnd], tiers [{shape,w,d,h,color,...}]
// Shapes: 'box' needs w,d,h  |  'cyl' needs r,rT(top radius),h,seg
const BUILDINGS = [
  // ── Row 1 (z ≈ -30) ─────────────────────────────
  { id:'house',   pos:[-32,-30], rise:[0.12,0.34],
    tiers:[{s:'box',w:10,d:9,h:7,c:'#1a2838'}] },
  { id:'stepped', pos:[0,-28],   rise:[0.18,0.54],
    tiers:[
      {s:'box',w:14,d:11,h:7,c:'#142030'},
      {s:'box',w:10,d:8,h:10,c:'#183848'},
      {s:'box',w:6,d:5,h:8,c:'#1c5060'},
    ] },
  { id:'dome',    pos:[32,-28],  rise:[0.15,0.48],
    tiers:[{s:'cyl',r:5.5,rT:5,h:18,c:'#0d3a4a',seg:24}],
    dome:{r:5,c:'#0e4a5a'} },

  // ── Row 2 (z ≈ 0) ──────────────────────────────
  { id:'wide',    pos:[-30,2],   rise:[0.20,0.44],
    tiers:[
      {s:'box',w:16,d:12,h:5,c:'#152030'},
      {s:'box',w:12,d:8,h:4,c:'#1a3040'},
    ] },
  { id:'hero',    pos:[0,0],     rise:[0.28,0.68],
    tiers:[
      {s:'box',w:16,d:14,h:6,c:'#0d2535'},
      {s:'box',w:12,d:10,h:10,c:'#0f3a4a'},
      {s:'box',w:8,d:6,h:14,c:'#115060'},
      {s:'cyl',r:3.5,rT:2,h:8,c:'#137070',seg:20},
    ],
    antenna:{h:6,r:0.2,c:'#22d3ee'} },
  { id:'taper',   pos:[32,0],    rise:[0.22,0.58],
    tiers:[{s:'cyl',r:6.5,rT:3,h:32,c:'#0c3545',seg:28}],
    antenna:{h:4,r:0.15,c:'#14b8a6'} },

  // ── Row 3 (z ≈ 30) ─────────────────────────────
  { id:'low',     pos:[-30,30],  rise:[0.12,0.36],
    tiers:[{s:'box',w:13,d:15,h:6,c:'#1a2535'}] },
  { id:'pencil',  pos:[0,30],    rise:[0.24,0.60],
    tiers:[
      {s:'box',w:7,d:6,h:4,c:'#142030'},
      {s:'cyl',r:3,rT:2.2,h:28,c:'#0e3a4a',seg:16},
    ],
    antenna:{h:5,r:0.12,c:'#22d3ee'} },
  { id:'hybrid',  pos:[32,28],   rise:[0.20,0.52],
    tiers:[
      {s:'box',w:12,d:10,h:4,c:'#152030'},
      {s:'cyl',r:4.5,rT:3.8,h:20,c:'#0d4050',seg:20},
    ] },
]

// Generate parcels: slightly larger rectangles around each building
const PARCELS = BUILDINGS.map(b => {
  const ft = b.tiers[0]
  const bw = ft.s === 'box' ? ft.w : (ft.r || 5) * 2
  const bd = ft.s === 'box' ? ft.d : (ft.r || 5) * 2
  const hw = bw / 2 + 3, hd = bd / 2 + 3
  const [cx, cz] = b.pos
  return [
    new THREE.Vector3(cx - hw, 0.1, cz - hd),
    new THREE.Vector3(cx + hw, 0.1, cz - hd),
    new THREE.Vector3(cx + hw, 0.1, cz + hd),
    new THREE.Vector3(cx - hw, 0.1, cz + hd),
  ]
})

// Underground pipe routes — ALL HORIZONTAL
// pts are [x, z] waypoints; y = constant depth; each consecutive pair = one pipe segment
const PIPES = [
  { id:'water', color:'#06b6d4', r:0.5,  y:-5,   pts:[[-58,-15],[-32,-15],[-5,-15],[5,-15],[32,-15],[58,-15]] },
  { id:'sewer', color:'#f97316', r:0.55, y:-8,   pts:[[-15,-55],[-15,-30],[-15,0],[-15,30],[-15,55]] },
  { id:'power', color:'#eab308', r:0.3,  y:-3,   pts:[[-58,15],[-30,15],[0,15],[32,15],[58,15]] },
  { id:'gas',   color:'#ef4444', r:0.35, y:-4.5, pts:[[15,-55],[15,-30],[15,0],[15,30],[15,55]] },
  { id:'metro', color:'#3b82f6', r:3.8,  y:-16,  pts:[[-75,-75],[-32,-32],[0,0],[32,32],[75,75]] },
]

// Pre-compute pipe segment geometry data (position, rotation, length)
const PIPE_SEGS = PIPES.map(route =>
  route.pts.slice(0, -1).map((a, i) => {
    const b = route.pts[i + 1]
    const dx = b[0] - a[0], dz = b[1] - a[1]
    const len = Math.sqrt(dx * dx + dz * dz)
    return {
      pos: [(a[0]+b[0])/2, route.y, (a[1]+b[1])/2],
      rot: [Math.PI / 2, Math.atan2(dx, dz), 0],
      len,
    }
  })
)

// Camera keyframes: [scrollProgress, posX, posY, posZ, targetX, targetY, targetZ]
const CAM_KF = [
  [0.00,   0, 90,   1,   0,  0,  0],
  [0.12,   8, 78,   8,   0,  0,  0],
  [0.35,  24, 54,  24,   0,  8,  0],
  [0.55,  34, 42,  34,   0, 16,  0],
  [0.70,  40, 34,  40,   0, 12,  0],
  [0.82,  42, 24,  42,   0, -6,  0],
  [1.00,  44, 30,  44,   0,  4,  0],
]

// ═════════════════════════════════════════════════════════════════════════════
//  MATH HELPERS
// ═════════════════════════════════════════════════════════════════════════════

const clamp01 = v => Math.max(0, Math.min(1, v))
const lerp    = (a, b, t) => a + (b - a) * t
const invlerp = (a, b, v) => b === a ? 0 : clamp01((v - a) / (b - a))
const easeOut = t => 1 - Math.pow(1 - clamp01(t), 3)
const easeIO  = t => { const c = clamp01(t); return c < 0.5 ? 2*c*c : -1+(4-2*c)*c }
const rp      = (p, s, e) => clamp01((p - s) / Math.max(e - s, 1e-4))

function camLerp(p) {
  let i = 0
  for (let k = 0; k < CAM_KF.length - 2; k++) if (p >= CAM_KF[k][0]) i = k
  const t = easeIO(invlerp(CAM_KF[i][0], CAM_KF[i+1][0], p))
  return {
    p: [lerp(CAM_KF[i][1],CAM_KF[i+1][1],t), lerp(CAM_KF[i][2],CAM_KF[i+1][2],t), lerp(CAM_KF[i][3],CAM_KF[i+1][3],t)],
    t: [lerp(CAM_KF[i][4],CAM_KF[i+1][4],t), lerp(CAM_KF[i][5],CAM_KF[i+1][5],t), lerp(CAM_KF[i][6],CAM_KF[i+1][6],t)],
  }
}

// ═════════════════════════════════════════════════════════════════════════════
//  CAMERA CONTROLLER — scroll-driven, no orbit controls
// ═════════════════════════════════════════════════════════════════════════════

function CamCtrl({ pRef }) {
  const { camera } = useThree()
  const cp = useRef(new THREE.Vector3(0, 90, 1))
  const ct = useRef(new THREE.Vector3(0, 0, 0))
  const wp = useRef(new THREE.Vector3())
  const wt = useRef(new THREE.Vector3())

  useFrame((_, dt) => {
    const { p: pos, t: tgt } = camLerp(pRef.current)
    wp.current.set(...pos); wt.current.set(...tgt)
    const s = clamp01(dt * 3.2)
    cp.current.lerp(wp.current, s)
    ct.current.lerp(wt.current, s)
    camera.position.copy(cp.current)
    camera.lookAt(ct.current)
  })
  return null
}

// ═════════════════════════════════════════════════════════════════════════════
//  2D PARCEL OUTLINES — visible from the start, fades as buildings rise
// ═════════════════════════════════════════════════════════════════════════════

function Parcels({ pRef }) {
  const groupRef = useRef()

  // Build all geometries once
  const { segGeos, fillGeos } = useMemo(() => {
    const sgs = [], fgs = []
    PARCELS.forEach(pts => {
      // lineSegments needs edge pairs
      const verts = []
      for (let i = 0; i < pts.length; i++) {
        verts.push(pts[i].clone())
        verts.push(pts[(i + 1) % pts.length].clone())
      }
      sgs.push(new THREE.BufferGeometry().setFromPoints(verts))

      // fill shape
      const shp = new THREE.Shape()
      pts.forEach((v, i) => { i === 0 ? shp.moveTo(v.x, -v.z) : shp.lineTo(v.x, -v.z) })
      fgs.push(new THREE.ShapeGeometry(shp))
    })
    return { segGeos: sgs, fillGeos: fgs }
  }, [])

  // Store material refs for line and fill separately
  const lineMatRefs = useRef([])
  const fillMatRefs = useRef([])

  useFrame(() => {
    const op = lerp(1, 0.2, easeOut(rp(pRef.current, 0.10, 0.50)))
    lineMatRefs.current.forEach(m => { if (m) m.opacity = op })
    fillMatRefs.current.forEach(m => { if (m) m.opacity = op * 0.14 })
  })

  return (
    <group ref={groupRef}>
      {PARCELS.map((pts, i) => (
        <group key={i}>
          <lineSegments geometry={segGeos[i]}>
            <lineBasicMaterial ref={el => lineMatRefs.current[i] = el} color="#22d3ee" transparent opacity={1} />
          </lineSegments>
          <mesh geometry={fillGeos[i]} position={[0, 0.06, 0]} rotation={[-Math.PI / 2, 0, 0]}>
            <meshBasicMaterial ref={el => fillMatRefs.current[i] = el} color="#22d3ee" transparent opacity={0.14} side={THREE.DoubleSide} />
          </mesh>
          {/* Survey corner pins */}
          {pts.map((v, j) => (
            <mesh key={j} position={[v.x, 0.15, v.z]}>
              <cylinderGeometry args={[0.15, 0.2, 0.12, 6]} />
              <meshStandardMaterial color="#22d3ee" emissive="#22d3ee" emissiveIntensity={0.9} />
            </mesh>
          ))}
        </group>
      ))}
    </group>
  )
}

// ═════════════════════════════════════════════════════════════════════════════
//  BUILDINGS — each tier extrudes floor-by-floor with scroll progress
// ═════════════════════════════════════════════════════════════════════════════

function CityBuildings({ pRef }) {
  // 2D ref array: tierRefs[buildingIdx][tierIdx]
  const tierRefs = useRef(BUILDINGS.map(b => b.tiers.map(() => null)))
  const antRefs  = useRef(BUILDINGS.map(() => null))
  const domeRefs = useRef(BUILDINGS.map(() => null))

  useFrame(() => {
    const p = pRef.current
    BUILDINGS.forEach((b, bi) => {
      const bp = easeOut(rp(p, b.rise[0], b.rise[1])) // overall building progress

      let baseH = 0
      b.tiers.forEach((tier, ti) => {
        const mesh = tierRefs.current[bi]?.[ti]
        if (!mesh) { baseH += tier.h; return }

        // Stagger each tier: bottom starts first
        const tStart = ti * 0.55 / b.tiers.length
        const tEnd   = Math.min((ti + 1) / b.tiers.length * 1.15, 1)
        const tp     = easeOut(rp(bp, tStart, tEnd))

        const sy = Math.max(tp, 0.0005)
        mesh.scale.y = sy
        mesh.position.y = baseH + sy * tier.h / 2
        mesh.visible = tp > 0.005

        baseH += tier.h
      })

      // Antenna
      const ant = antRefs.current[bi]
      if (ant && b.antenna) {
        ant.visible = bp > 0.92
        ant.position.y = baseH + b.antenna.h / 2
        ant.scale.y = easeOut(rp(bp, 0.92, 1))
      }

      // Dome
      const dome = domeRefs.current[bi]
      if (dome && b.dome) {
        dome.visible = bp > 0.85
        dome.position.y = baseH
        const ds = bp > 0.85 ? easeOut(rp(bp, 0.85, 1)) : 0.001
        dome.scale.set(ds, ds, ds)
      }
    })
  })

  return (
    <group>
      {BUILDINGS.map((b, bi) => (
        <group key={b.id} position={[b.pos[0], 0, b.pos[1]]}>
          {b.tiers.map((t, ti) => (
            <mesh key={ti} ref={el => { if (tierRefs.current[bi]) tierRefs.current[bi][ti] = el }} visible={false} castShadow receiveShadow>
              {t.s === 'box'
                ? <boxGeometry args={[t.w, t.h, t.d]} />
                : <cylinderGeometry args={[t.rT ?? t.r, t.r, t.h, t.seg ?? 20]} />}
              <meshStandardMaterial color={t.c} metalness={t.s === 'cyl' ? 0.5 : 0.35} roughness={t.s === 'cyl' ? 0.3 : 0.45} emissive={t.c} emissiveIntensity={0.04} />
            </mesh>
          ))}
          {b.antenna && (
            <mesh ref={el => antRefs.current[bi] = el} visible={false}>
              <cylinderGeometry args={[b.antenna.r, b.antenna.r * 0.4, b.antenna.h, 6]} />
              <meshStandardMaterial color={b.antenna.c} emissive={b.antenna.c} emissiveIntensity={0.6} metalness={0.7} roughness={0.2} />
            </mesh>
          )}
          {b.dome && (
            <mesh ref={el => domeRefs.current[bi] = el} visible={false}>
              <sphereGeometry args={[b.dome.r, 20, 12, 0, Math.PI * 2, 0, Math.PI / 2]} />
              <meshStandardMaterial color={b.dome.c} metalness={0.5} roughness={0.28} emissive={b.dome.c} emissiveIntensity={0.04} />
            </mesh>
          )}
        </group>
      ))}
    </group>
  )
}

// ═════════════════════════════════════════════════════════════════════════════
//  UNDERGROUND PIPE NETWORK — all pipes are HORIZONTAL, properly oriented
// ═════════════════════════════════════════════════════════════════════════════

function Underground({ pRef }) {
  const routeRefs = useRef(PIPES.map(() => null))

  useFrame(() => {
    const p = pRef.current
    PIPES.forEach((route, ri) => {
      const delay = ri * 0.025
      const reveal = easeOut(rp(p, 0.68 + delay, 0.84 + delay))
      const g = routeRefs.current[ri]
      if (!g) return
      g.visible = reveal > 0.008
      g.traverse(child => {
        if (child.material && child.material.transparent) {
          child.material.opacity = reveal * (route.id === 'metro' ? 0.6 : 0.88)
        }
      })
    })
  })

  return (
    <>
      {PIPES.map((route, ri) => {
        const segs = PIPE_SEGS[ri]
        const isMet = route.id === 'metro'
        return (
          <group key={route.id} ref={el => routeRefs.current[ri] = el} visible={false}>
            {/* Pipe segments — horizontal cylinders */}
            {segs.map((seg, si) => (
              <mesh key={`s${si}`} position={seg.pos} rotation={seg.rot} castShadow>
                <cylinderGeometry args={[route.r, route.r, seg.len, isMet ? 28 : 14, 1, isMet]} />
                <meshStandardMaterial
                  color={route.color} metalness={isMet ? 0.4 : 0.65} roughness={isMet ? 0.45 : 0.2}
                  emissive={route.color} emissiveIntensity={0.3}
                  transparent opacity={0}
                  side={isMet ? THREE.DoubleSide : THREE.FrontSide}
                />
              </mesh>
            ))}
            {/* Junction nodes */}
            {route.pts.map(([x, z], pi) => (
              <mesh key={`j${pi}`} position={[x, route.y, z]}>
                <sphereGeometry args={[route.r * (isMet ? 1.05 : 1.4), isMet ? 20 : 10, isMet ? 20 : 10]} />
                <meshStandardMaterial
                  color={route.color} metalness={0.55} roughness={0.3}
                  emissive={route.color} emissiveIntensity={0.25}
                  transparent opacity={0}
                />
              </mesh>
            ))}
            {/* Metro ring caps at endpoints */}
            {isMet && [0, route.pts.length - 1].map(idx => {
              const pt = route.pts[idx]
              const next = route.pts[idx === 0 ? 1 : route.pts.length - 2]
              const dx = next[0] - pt[0], dz = next[1] - pt[1]
              const ang = Math.atan2(dx, dz)
              return (
                <mesh key={`cap${idx}`} position={[pt[0], route.y, pt[1]]} rotation={[Math.PI / 2, ang, 0]}>
                  <ringGeometry args={[route.r * 0.8, route.r + 0.8, 28]} />
                  <meshStandardMaterial
                    color={route.color} emissive={route.color} emissiveIntensity={0.4}
                    side={THREE.DoubleSide} transparent opacity={0} metalness={0.4} roughness={0.3}
                  />
                </mesh>
              )
            })}
            {/* Metro rail tracks (two thin cylinders inside tunnel) */}
            {isMet && segs.map((seg, si) => (
              <React.Fragment key={`rail${si}`}>
                <mesh position={[seg.pos[0], route.y - route.r * 0.8, seg.pos[2]]} rotation={seg.rot}>
                  <cylinderGeometry args={[0.08, 0.08, seg.len, 4]} />
                  <meshStandardMaterial color="#94a3b8" metalness={0.85} roughness={0.15} transparent opacity={0} />
                </mesh>
              </React.Fragment>
            ))}
          </group>
        )
      })}
    </>
  )
}

// ═════════════════════════════════════════════════════════════════════════════
//  GROUND — fades transparent when underground reveals
// ═════════════════════════════════════════════════════════════════════════════

function Ground({ pRef }) {
  const matRef = useRef()
  useFrame(() => {
    if (matRef.current) {
      matRef.current.opacity = lerp(0.75, 0.12, easeOut(rp(pRef.current, 0.68, 0.82)))
    }
  })
  return (
    <group>
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -0.08, 0]} receiveShadow>
        <planeGeometry args={[500, 500]} />
        <meshStandardMaterial ref={matRef} color="#040a14" roughness={0.95} transparent opacity={0.75} />
      </mesh>
      <gridHelper args={[400, 80, '#0a1528', '#070f20']} position={[0, 0, 0]} />
    </group>
  )
}

// ═════════════════════════════════════════════════════════════════════════════
//  LIGHTING — underground accent lights animate in
// ═════════════════════════════════════════════════════════════════════════════

function Lights({ pRef }) {
  const ugLights = useRef([null, null, null])
  useFrame(() => {
    const ug = easeOut(rp(pRef.current, 0.68, 0.85))
    ugLights.current.forEach((l, i) => { if (l) l.intensity = ug * [2.8, 1.8, 1.4][i] })
  })
  return (
    <>
      <ambientLight intensity={0.4} />
      <directionalLight position={[45, 65, 30]} intensity={0.9} castShadow
        shadow-mapSize-width={1024} shadow-mapSize-height={1024}
        shadow-camera-far={250} shadow-camera-left={-100} shadow-camera-right={100}
        shadow-camera-top={100} shadow-camera-bottom={-100}
      />
      <directionalLight position={[-30, 35, -25]} intensity={0.3} />
      <hemisphereLight args={['#1a3050', '#080e18', 0.55]} />
      <pointLight ref={el => ugLights.current[0] = el} position={[0, -7, 0]}    intensity={0} distance={150} color="#06b6d4" />
      <pointLight ref={el => ugLights.current[1] = el} position={[25, -12, 25]} intensity={0} distance={100} color="#3b82f6" />
      <pointLight ref={el => ugLights.current[2] = el} position={[-25,-10,-25]} intensity={0} distance={100} color="#f97316" />
    </>
  )
}

// ═════════════════════════════════════════════════════════════════════════════
//  SCENE ROOT
// ═════════════════════════════════════════════════════════════════════════════

function IntroScene({ progressRef }) {
  return (
    <>
      <fog attach="fog" args={['#080e18', 120, 400]} />
      <CamCtrl pRef={progressRef} />
      <Lights pRef={progressRef} />
      <Ground pRef={progressRef} />
      <Parcels pRef={progressRef} />
      <CityBuildings pRef={progressRef} />
      <Underground pRef={progressRef} />
    </>
  )
}

// ═════════════════════════════════════════════════════════════════════════════
//  TEXT OVERLAY — 3 stages, centered, impactful
// ═════════════════════════════════════════════════════════════════════════════

const textBase = { fontFamily: "'Inter', system-ui, sans-serif", textAlign: 'center', margin: 0, pointerEvents: 'none', userSelect: 'none' }

function TextOverlay({ progress, onEnter }) {
  const { t } = useTranslation()
  // Stage 1: "Today, land is recorded in 2D."
  const t1 = (() => {
    if (progress > 0.22) return 0
    const fadeIn  = easeOut(rp(progress, 0, 0.04))
    const fadeOut = 1 - easeOut(rp(progress, 0.14, 0.22))
    return Math.min(fadeIn, fadeOut)
  })()

  // Stage 2: "But the world around us is 3D."
  const t2 = (() => {
    if (progress < 0.25 || progress > 0.72) return 0
    const fadeIn  = easeOut(rp(progress, 0.28, 0.36))
    const fadeOut = 1 - easeOut(rp(progress, 0.62, 0.72))
    return Math.min(fadeIn, fadeOut)
  })()

  // Stage 3: "URDHVA — Beyond the Surface"
  const t3 = (() => {
    if (progress < 0.82) return 0
    return easeOut(rp(progress, 0.84, 0.92))
  })()

  return (
    <div style={{ position: 'fixed', inset: 0, zIndex: 20, pointerEvents: 'none', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>

      {/* Dark vignette behind text */}
      <div style={{
        position: 'absolute', inset: 0,
        background: `radial-gradient(ellipse at center, rgba(8,14,24,${Math.max(t1, t2, t3) * 0.55}) 0%, transparent 70%)`,
      }} />

      {/* Stage 1 */}
      {t1 > 0.01 && (
        <div style={{ position: 'absolute', opacity: t1, transform: `translateY(${lerp(12, 0, t1)}px)` }}>
          <h1 style={{ ...textBase, fontSize: 'clamp(28px, 4.5vw, 60px)', fontWeight: 800, color: '#fff', letterSpacing: '0.01em', lineHeight: 1.2 }}>
            {t('intro.stage1Title')}
          </h1>
          <p style={{ ...textBase, fontSize: 'clamp(11px, 1.2vw, 16px)', color: '#94a3b8', letterSpacing: '3px', textTransform: 'uppercase', marginTop: '16px', fontWeight: 400 }}>
            {t('intro.stage1Sub')}
          </p>
        </div>
      )}

      {/* Stage 2 */}
      {t2 > 0.01 && (
        <div style={{ position: 'absolute', opacity: t2, transform: `translateY(${lerp(12, 0, t2)}px)` }}>
          <h1 style={{ ...textBase, fontSize: 'clamp(28px, 4.5vw, 60px)', fontWeight: 800, color: '#fff', letterSpacing: '0.01em', lineHeight: 1.2 }}>
            {t('intro.stage2Title')}
          </h1>
          <p style={{ ...textBase, fontSize: 'clamp(11px, 1.2vw, 16px)', color: '#94a3b8', letterSpacing: '3px', textTransform: 'uppercase', marginTop: '16px', fontWeight: 400 }}>
            {t('intro.stage2Sub')}
          </p>
        </div>
      )}

      {/* Stage 3 — THE HERO TEXT */}
      {t3 > 0.01 && (
        <div style={{ position: 'absolute', opacity: t3, transform: `translateY(${lerp(20, 0, t3)}px)` }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '18px', marginBottom: '14px' }}>
            <div style={{ width: '50px', height: '50px', borderRadius: '13px', background: 'linear-gradient(135deg,#22d3ee,#0891b2)', display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: '0 0 40px rgba(34,211,238,0.3)' }}>
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <path d="M12 2L2 7l10 5 10-5-10-5z"/><path d="M2 17l10 5 10-5"/><path d="M2 12l10 5 10-5"/>
              </svg>
            </div>
            <h1 style={{ ...textBase, fontSize: 'clamp(52px, 9vw, 110px)', fontWeight: 900, color: '#fff', letterSpacing: '0.1em', textShadow: '0 0 80px rgba(34,211,238,0.2)' }}>
              {t('intro.stage3Title')}
            </h1>
          </div>
          <p style={{ ...textBase, fontSize: 'clamp(14px, 1.8vw, 24px)', color: '#22d3ee', letterSpacing: '0.35em', textTransform: 'uppercase', fontWeight: 500 }}>
            {t('intro.stage3Sub')}
          </p>
          <p style={{ ...textBase, fontSize: '11px', color: '#94a3b8', letterSpacing: '2px', marginTop: '24px' }}>
            {t('intro.stage3Cadastre')}
          </p>

          {/* Enter button */}
          {t3 > 0.8 && (
            <div style={{
              marginTop: '44px', opacity: easeOut(rp(t3, 0.8, 1)),
              transform: `translateY(${lerp(10, 0, easeOut(rp(t3, 0.8, 1)))}px)`,
              pointerEvents: 'auto',
            }}>
              <button
                id="intro-enter-btn"
                type="button"
                onClick={(e) => {
                  e.stopPropagation()
                  if (onEnter) onEnter()
                }}
                style={{
                  ...textBase,
                  pointerEvents: 'auto',
                  userSelect: 'auto',
                  fontSize: '12px', letterSpacing: '3px', textTransform: 'uppercase', fontWeight: 600,
                  color: '#22d3ee', background: 'rgba(34,211,238,0.06)',
                  border: '1px solid rgba(34,211,238,0.25)', borderRadius: '12px',
                  padding: '14px 40px', cursor: 'pointer',
                  transition: 'all 0.25s ease',
                  boxShadow: '0 0 30px rgba(34,211,238,0.08)',
                }}
                onMouseEnter={e => { e.currentTarget.style.borderColor = 'rgba(34,211,238,0.6)'; e.currentTarget.style.background = 'rgba(34,211,238,0.12)'; e.currentTarget.style.boxShadow = '0 0 50px rgba(34,211,238,0.15)' }}
                onMouseLeave={e => { e.currentTarget.style.borderColor = 'rgba(34,211,238,0.25)'; e.currentTarget.style.background = 'rgba(34,211,238,0.06)'; e.currentTarget.style.boxShadow = '0 0 30px rgba(34,211,238,0.08)' }}
              >
                {t('intro.enter')}
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  )
}

// ═════════════════════════════════════════════════════════════════════════════
//  SCROLL STAGE DOTS (right side)
// ═════════════════════════════════════════════════════════════════════════════

function StageDots({ progress }) {
  const { t } = useTranslation()
  const dots = [
    { at: 0.00, l: t('intro.stages.2d') },
    { at: 0.20, l: t('intro.stages.rising') },
    { at: 0.45, l: t('intro.stages.vertical') },
    { at: 0.70, l: t('intro.stages.3d') },
    { at: 0.82, l: t('intro.stages.underground') },
    { at: 0.90, l: t('intro.stages.urdhva') },
  ]
  let active = 0
  for (let i = 0; i < dots.length; i++) if (progress >= dots[i].at) active = i
  const showFinale = progress >= 0.88
  return (
    <div style={{ position: 'fixed', right: '24px', top: '50%', transform: 'translateY(-50%)', display: 'flex', flexDirection: 'column', gap: '9px', zIndex: 22, pointerEvents: 'none', opacity: showFinale ? 0 : 1, transition: 'opacity 0.5s' }}>
      {dots.map((d, i) => (
        <div key={i} style={{ display: 'flex', alignItems: 'center', gap: '7px', justifyContent: 'flex-end' }}>
          <span style={{ fontFamily: 'Inter, sans-serif', fontSize: '8px', letterSpacing: '1.5px', color: i === active ? '#22d3ee' : '#64748b', transition: 'color 0.35s' }}>{d.l}</span>
          <div style={{ width: i === active ? '18px' : '4px', height: '2px', borderRadius: '2px', background: i === active ? '#22d3ee' : '#334155', transition: 'all 0.3s' }} />
        </div>
      ))}
    </div>
  )
}

// ═════════════════════════════════════════════════════════════════════════════
//  SCROLL PROGRESS BAR (left side)
// ═════════════════════════════════════════════════════════════════════════════

function ScrollBar({ progress }) {
  const { t } = useTranslation()
  const showFinale = progress >= 0.88
  return (
    <div style={{ position: 'fixed', left: '28px', bottom: '48px', display: 'flex', alignItems: 'center', gap: '10px', zIndex: 22, pointerEvents: 'none', opacity: showFinale ? 0 : 1, transition: 'opacity 0.5s' }}>
      <div style={{ width: '1px', height: '64px', background: 'rgba(34,211,238,0.2)', position: 'relative' }}>
        <div style={{ position: 'absolute', bottom: 0, left: 0, width: '1px', height: `${progress * 100}%`, background: '#22d3ee' }} />
      </div>
      <p style={{ fontFamily: 'Inter, sans-serif', fontSize: '8px', letterSpacing: '2px', color: '#64748b', textTransform: 'uppercase', writingMode: 'vertical-rl', transform: 'rotate(180deg)' }}>
        {t('intro.scrollToExplore')}
      </p>
    </div>
  )
}

// ═════════════════════════════════════════════════════════════════════════════
//  TOP BAR
// ═════════════════════════════════════════════════════════════════════════════

function TopBar({ onSkip }) {
  const { t } = useTranslation()
  const [h, setH] = useState(false)
  return (
    <div style={{ position: 'fixed', top: 0, left: 0, right: 0, height: '50px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '0 28px', zIndex: 45, borderBottom: '1px solid rgba(226,232,240,0.1)', background: 'rgba(8,14,24,0.4)', backdropFilter: 'blur(8px)' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: '9px' }}>
        <div style={{ width: '24px', height: '24px', borderRadius: '6px', background: 'linear-gradient(135deg,#22d3ee,#0891b2)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M12 2L2 7l10 5 10-5-10-5z"/><path d="M2 17l10 5 10-5"/><path d="M2 12l10 5 10-5"/></svg>
        </div>
        <span style={{ fontFamily: 'Inter, sans-serif', fontSize: '12px', fontWeight: 700, color: '#fff', letterSpacing: '0.08em' }}>{t('common.appName')}</span>
        <span style={{ fontFamily: 'Inter, sans-serif', fontSize: '9px', color: '#94a3b8', letterSpacing: '1.5px', textTransform: 'uppercase', marginLeft: '4px' }}>{t('common.platformTitle')}</span>
      </div>
      <button onClick={onSkip} onMouseEnter={() => setH(true)} onMouseLeave={() => setH(false)}
        style={{ fontFamily: 'Inter, sans-serif', fontSize: '10px', letterSpacing: '1.5px', textTransform: 'uppercase', color: h ? '#ffffff' : '#94a3b8', background: 'none', border: `1px solid ${h ? 'rgba(255,255,255,0.4)' : 'rgba(148,163,184,0.3)'}`, padding: '5px 14px', borderRadius: '6px', cursor: 'pointer', transition: 'all 0.2s' }}>
        {t('intro.skip')}
      </button>
    </div>
  )
}

// ═════════════════════════════════════════════════════════════════════════════
//  MAIN INTRO SCREEN
// ═════════════════════════════════════════════════════════════════════════════

export default function IntroScreen({ onComplete }) {
  const scrollEl = useRef(null)
  const progressRef = useRef(0)
  const [progress, setProgress] = useState(0)
  const rafId = useRef(null)
  const done = useRef(false)

  const onScroll = useCallback(() => {
    const el = scrollEl.current
    if (!el) return
    const max = el.scrollHeight - el.clientHeight
    progressRef.current = max > 0 ? el.scrollTop / max : 0
    if (rafId.current) return
    rafId.current = requestAnimationFrame(() => {
      setProgress(progressRef.current)
      rafId.current = null
    })
  }, [])

  useEffect(() => {
    const el = scrollEl.current
    if (!el) return
    el.addEventListener('scroll', onScroll, { passive: true })
    return () => { el.removeEventListener('scroll', onScroll); if (rafId.current) cancelAnimationFrame(rafId.current) }
  }, [onScroll])

  // Keyboard shortcut (Enter / Space / Escape)
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'Enter' || e.key === ' ' || e.key === 'Escape') {
        if (!done.current) {
          done.current = true
          onComplete(null)
        }
      }
    }
    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [onComplete])

  const handleEnter = useCallback(() => {
    if (!done.current) { done.current = true; onComplete(null) }
  }, [onComplete])

  return (
    <div style={{ position: 'fixed', inset: 0, background: '#080e18', overflow: 'hidden' }}>
      {/* 3D Canvas */}
      <div style={{ position: 'fixed', inset: 0, zIndex: 1 }}>
        <Canvas
          shadows
          camera={{ position: [0, 90, 1], fov: 40, near: 0.1, far: 900 }}
          gl={{ antialias: true, toneMapping: THREE.ACESFilmicToneMapping, toneMappingExposure: 1.1 }}
          style={{ background: '#080e18' }}
        >
          <IntroScene progressRef={progressRef} />
        </Canvas>
      </div>

      {/* Scroll capture */}
      <div ref={scrollEl} style={{ position: 'fixed', inset: 0, overflowY: 'scroll', zIndex: 10 }}>
        <div style={{ height: '1000vh', width: '100%', pointerEvents: 'none' }} />
      </div>

      {/* Text overlays */}
      <TextOverlay progress={progress} onEnter={handleEnter} />
      <StageDots progress={progress} />
      <ScrollBar progress={progress} />

      {/* Top bar */}
      <TopBar onSkip={() => { if (!done.current) { done.current = true; onComplete(null) } }} />

      {/* Footer */}
      <div style={{ position: 'fixed', bottom: '14px', left: '50%', transform: 'translateX(-50%)', zIndex: 22, pointerEvents: 'none', opacity: progress < 0.1 ? 0.5 : 0, transition: 'opacity 0.5s' }}>
        <p style={{ fontFamily: 'Inter, sans-serif', fontSize: '9px', color: '#0f1e30', letterSpacing: '1px', textAlign: 'center' }}>Smart India Hackathon 2026 · Team Spatial Forge</p>
      </div>
    </div>
  )
}
