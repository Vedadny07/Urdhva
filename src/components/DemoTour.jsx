import React, { useEffect, useState, useRef } from 'react'
import useStore from '../store'
import { useTranslation } from '../utils/i18n'

// ═══════════════════════════════════════════════════════
// DEMO TOUR — Automated Judge Demonstration Mode
// Shows the strongest URDHVA workflows in sequence
// ═══════════════════════════════════════════════════════

const DEMO_ACTIONS = [
  null,
  // 1. Highlight Royal Heights
  (store) => {
    const target = store.buildings.find(b => b.id === 'UP-DEMO-001') || store.buildings[0]
    if (target) store.selectBuilding(target.id)
  },
  // 2. Explode building
  (store) => {
    const target = store.buildings.find(b => b.id === 'UP-DEMO-001') || store.buildings[0]
    if (target) store.explodeBuilding(target.id)
  },
  // 3. X-Ray
  (store) => {
    store.deselectAll()
    if (!store.xrayMode) store.toggleXrayMode()
  },
  // 4. Underground
  (store) => {
    if (store.xrayMode) store.toggleXrayMode()
    if (!store.undergroundMode) store.toggleUndergroundMode()
  },
  // 5. Violations
  (store) => {
    if (store.undergroundMode) store.toggleUndergroundMode()
    const violationBuilding = store.buildings.find(b =>
      b.units?.some(u => u.status === 'unauthorized')
    )
    if (violationBuilding) store.selectBuilding(violationBuilding.id)
  },
  // 6. Clash
  (store) => {
    store.deselectAll()
  },
  // 7. Multi-role
  null,
  // 8. Workflow
  null,
  // 9. Finale
  (store) => {
    store.deselectAll()
    if (store.xrayMode) store.toggleXrayMode()
    if (store.undergroundMode) store.toggleUndergroundMode()
  },
]

const DEMO_DURATIONS = [4000, 4500, 5000, 5000, 5000, 4500, 4500, 4500, 4500, 5000]
const DEMO_ICONS = ['🌐', '🏙️', '🏢', '🔬', '🚇', '🚨', '⚡', '🏛️', '📤', '✨']

export default function DemoTour() {
  const { t } = useTranslation()
  const demoTourActive = useStore((s) => s.demoTourActive)
  const stopDemoTour = useStore((s) => s.stopDemoTour)
  const [currentStep, setCurrentStep] = useState(0)
  const [isTransitioning, setIsTransitioning] = useState(false)
  const [progress, setProgress] = useState(0)
  const timerRef = useRef(null)
  const progressRef = useRef(null)

  const totalSteps = 10

  useEffect(() => {
    if (!demoTourActive) {
      setCurrentStep(0)
      setProgress(0)
      return
    }

    if (currentStep >= totalSteps) {
      stopDemoTour()
      return
    }

    // Run action for this step
    const action = DEMO_ACTIONS[currentStep]
    if (action) {
      const store = useStore.getState()
      action(store)
    }

    const duration = DEMO_DURATIONS[currentStep] || 4500

    // Progress bar animation
    setProgress(0)
    const progressInterval = 50
    const stepCount = duration / progressInterval
    let progressCount = 0
    progressRef.current = setInterval(() => {
      progressCount++
      setProgress((progressCount / stepCount) * 100)
    }, progressInterval)

    // Auto-advance to next step
    timerRef.current = setTimeout(() => {
      setIsTransitioning(true)
      setTimeout(() => {
        setCurrentStep(prev => prev + 1)
        setIsTransitioning(false)
      }, 400)
    }, duration)

    return () => {
      clearTimeout(timerRef.current)
      clearInterval(progressRef.current)
    }
  }, [demoTourActive, currentStep, stopDemoTour])

  if (!demoTourActive) return null
  if (currentStep >= totalSteps) return null

  const stepTitle = t(`demo.steps.${currentStep}.title`)
  const stepSubtitle = t(`demo.steps.${currentStep}.subtitle`)
  const stepDescription = t(`demo.steps.${currentStep}.description`)
  const icon = DEMO_ICONS[currentStep] || '🌐'

  return (
    <div className="fixed inset-0 z-[9998] pointer-events-none">
      {/* Semi-transparent overlay at top */}
      <div className="absolute top-0 left-0 right-0 h-32 bg-gradient-to-b from-slate-900/40 to-transparent" />

      {/* Demo step card — bottom center */}
      <div
        className={`absolute bottom-8 left-1/2 -translate-x-1/2 pointer-events-auto transition-all duration-400 ${
          isTransitioning ? 'opacity-0 translate-y-4' : 'opacity-100 translate-y-0'
        }`}
      >
        <div data-floating-panel="true" className="relative w-[600px] bg-white/98 backdrop-blur-xl border border-cyan-400/60 rounded-2xl p-6 shadow-2xl">
          {/* Progress bar */}
          <div className="absolute top-0 left-0 right-0 h-1.5 rounded-t-2xl overflow-hidden bg-slate-100">
            <div
              className="h-full bg-gradient-to-r from-cyan-500 to-teal-500 transition-all duration-50 ease-linear"
              style={{ width: `${progress}%` }}
            />
          </div>

          {/* Step counter */}
          <div className="absolute top-3 right-4 text-[10px] text-slate-500 font-mono font-bold">
            {t('demo.demoStep', { current: currentStep + 1, total: totalSteps })}
          </div>

          {/* Content */}
          <div className="flex items-start gap-4">
            <div className="text-4xl flex-shrink-0 mt-1">{icon}</div>
            <div className="flex-1">
              <div className="flex items-center gap-2 mb-1">
                <span className="w-2 h-2 rounded-full bg-cyan-500 animate-pulse" />
                <span className="text-[10px] font-bold text-cyan-700 uppercase tracking-widest">
                  {t('demo.liveDemo')}
                </span>
              </div>
              <h3 className="text-xl font-bold text-slate-900 mb-0.5">{stepTitle}</h3>
              <p className="text-sm text-cyan-700 font-semibold mb-2">{stepSubtitle}</p>
              <p className="text-xs text-slate-600 leading-relaxed font-medium">{stepDescription}</p>
            </div>
          </div>

          {/* Controls */}
          <div className="flex items-center justify-between mt-4 pt-3 border-t border-slate-200">
            <button
              onClick={stopDemoTour}
              className="px-3 py-1.5 text-xs font-semibold text-slate-500 hover:text-slate-900 transition-colors rounded-lg hover:bg-slate-100 cursor-pointer"
            >
              {t('demo.exitDemo')}
            </button>

            <div className="flex items-center gap-1.5">
              {Array.from({ length: totalSteps }).map((_, i) => (
                <div
                  key={i}
                  className={`w-1.5 h-1.5 rounded-full transition-all ${
                    i === currentStep
                      ? 'bg-cyan-600 w-4'
                      : i < currentStep
                      ? 'bg-cyan-400'
                      : 'bg-slate-300'
                  }`}
                />
              ))}
            </div>

            <button
              onClick={() => {
                setIsTransitioning(true)
                clearTimeout(timerRef.current)
                clearInterval(progressRef.current)
                setTimeout(() => {
                  setCurrentStep(prev => prev + 1)
                  setIsTransitioning(false)
                }, 300)
              }}
              className="px-3 py-1.5 text-xs font-bold text-cyan-800 bg-cyan-50 border border-cyan-300 rounded-lg hover:bg-cyan-100 transition-all cursor-pointer"
            >
              {t('demo.next')}
            </button>
          </div>
        </div>
      </div>

      {/* "WHY URDHVA?" micro explanation badge — top-left */}
      <div className="absolute top-16 left-6 pointer-events-none">
        <div data-floating-panel="true" className={`px-3 py-2 rounded-xl bg-white/97 border border-slate-200 shadow-md backdrop-blur-2xl transition-all duration-500 ${
          isTransitioning ? 'opacity-0' : 'opacity-100'
        }`}>
          <div className="text-[9px] font-bold text-amber-700 uppercase tracking-widest mb-0.5">{t('demo.whyUrdhva')}</div>
          <div className="text-[11px] text-slate-700 font-medium max-w-[280px]">
            {stepDescription}
          </div>
        </div>
      </div>
    </div>
  )
}
