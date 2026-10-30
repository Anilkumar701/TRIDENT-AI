import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from 'react'
import { HAZARD_IMAGES, INITIAL_REPORTS } from '../data/mock'
import type {
  DriveState,
  HazardCategory,
  HazardReport,
  HazardSeverity,
  MapLayer,
  ViewId,
} from '../types'

interface Metrics {
  systemActive: boolean
  videoNodes: number
  trackedVehicles: number
  hazardReports: number
}

interface Telemetry {
  speedKmh: number
  distanceM: number
  closingVelMs: number
  ttcSec: number
  state: DriveState
  obstacle: 'none' | 'pothole' | 'pedestrian'
}

interface TridentContextValue {
  view: ViewId
  setView: (v: ViewId) => void
  sidebarOpen: boolean
  setSidebarOpen: (v: boolean) => void
  metrics: Metrics
  reports: HazardReport[]
  submitReport: (input: {
    category: HazardCategory
    severity: HazardSeverity
    lat: number
    lng: number
    notes: string
    imageSrc: string
  }) => void
  mapLayer: MapLayer
  setMapLayer: (l: MapLayer) => void
  telemetry: Telemetry
  injectPothole: () => void
  triggerPedestrian: () => void
  accelerateEgo: () => void
  resetTelemetry: () => void
}

const TridentContext = createContext<TridentContextValue | null>(null)

const INITIAL_TELEMETRY: Telemetry = {
  speedKmh: 42,
  distanceM: 48,
  closingVelMs: 2.1,
  ttcSec: 22.8,
  state: 'CRUISE',
  obstacle: 'none',
}

function deriveState(t: Telemetry): DriveState {
  if (t.ttcSec < 1.6 && t.obstacle !== 'none') return 'EMERGENCY BRAKE'
  if (t.obstacle === 'pedestrian') return 'YIELD'
  if (t.obstacle === 'pothole') return 'AVOID'
  if (t.distanceM < 22) return 'FOLLOW'
  return 'CRUISE'
}

function withTtc(t: Telemetry): Telemetry {
  const speedMs = t.speedKmh / 3.6
  const closing = Math.max(0.05, speedMs - 6)
  const ttc = t.distanceM / closing
  const next = { ...t, closingVelMs: closing, ttcSec: ttc }
  return { ...next, state: deriveState(next) }
}

export function TridentProvider({ children }: { children: ReactNode }) {
  const [view, setView] = useState<ViewId>('control')
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const [reports, setReports] = useState<HazardReport[]>(INITIAL_REPORTS)
  const [mapLayer, setMapLayer] = useState<MapLayer>('congestion')
  const [metrics, setMetrics] = useState<Metrics>({
    systemActive: true,
    videoNodes: 14,
    trackedVehicles: 186,
    hazardReports: INITIAL_REPORTS.length,
  })
  const [telemetry, setTelemetry] = useState<Telemetry>(INITIAL_TELEMETRY)

  useEffect(() => {
    const id = window.setInterval(() => {
      setMetrics((m) => ({
        ...m,
        videoNodes: 12 + Math.round(Math.random() * 4),
        trackedVehicles: Math.max(
          120,
          m.trackedVehicles + Math.round((Math.random() - 0.42) * 8),
        ),
        hazardReports: reports.length,
      }))
    }, 1800)
    return () => window.clearInterval(id)
  }, [reports.length])

  useEffect(() => {
    const id = window.setInterval(() => {
      setTelemetry((t) => {
        let speed = t.speedKmh
        let dist = t.distanceM
        if (t.state === 'EMERGENCY BRAKE') {
          speed = Math.max(0, speed - 7.5)
          dist = Math.max(1.2, dist - speed / 18)
        } else if (t.state === 'YIELD') {
          speed = Math.max(8, speed - 2.4)
          dist = Math.max(6, dist - 0.4)
        } else if (t.state === 'AVOID') {
          speed = Math.max(18, speed - 1.1)
          dist = Math.max(8, dist + 0.35)
        } else if (t.state === 'FOLLOW') {
          speed = Math.max(22, speed * 0.98)
          dist = Math.max(10, dist + (Math.random() - 0.4) * 1.2)
        } else {
          speed = Math.min(78, speed + (Math.random() - 0.35) * 1.4)
          dist = Math.max(12, dist + (Math.random() - 0.45) * 1.6)
        }
        return withTtc({ ...t, speedKmh: speed, distanceM: dist })
      })
    }, 280)
    return () => window.clearInterval(id)
  }, [])

  const submitReport = useCallback(
    (input: {
      category: HazardCategory
      severity: HazardSeverity
      lat: number
      lng: number
      notes: string
      imageSrc: string
    }) => {
      const duplicateRisk = reports.some(
        (r) =>
          r.category === input.category &&
          Math.abs(r.lat - input.lat) < 0.012 &&
          Math.abs(r.lng - input.lng) < 0.012,
      )
      const next: HazardReport = {
        id: `TR-${2400 + reports.length + 1}`,
        category: input.category,
        severity: input.severity,
        lat: input.lat,
        lng: input.lng,
        status: 'Pending Review',
        timestamp: new Date().toISOString(),
        duplicateRisk,
        imageSrc: input.imageSrc || HAZARD_IMAGES[input.category],
        notes: input.notes,
      }
      setReports((prev) => [next, ...prev])
    },
    [reports],
  )

  const injectPothole = useCallback(() => {
    setTelemetry((t) =>
      withTtc({
        ...t,
        obstacle: 'pothole',
        distanceM: Math.min(t.distanceM, 18),
        speedKmh: Math.max(t.speedKmh, 36),
      }),
    )
  }, [])

  const triggerPedestrian = useCallback(() => {
    setTelemetry((t) =>
      withTtc({
        ...t,
        obstacle: 'pedestrian',
        distanceM: Math.min(t.distanceM, 14),
      }),
    )
  }, [])

  const accelerateEgo = useCallback(() => {
    setTelemetry((t) =>
      withTtc({
        ...t,
        speedKmh: Math.min(96, t.speedKmh + 18),
        distanceM: t.obstacle === 'none' ? Math.max(8, t.distanceM - 10) : t.distanceM,
      }),
    )
  }, [])

  const resetTelemetry = useCallback(() => {
    setTelemetry(INITIAL_TELEMETRY)
  }, [])

  const value = useMemo<TridentContextValue>(
    () => ({
      view,
      setView,
      sidebarOpen,
      setSidebarOpen,
      metrics,
      reports,
      submitReport,
      mapLayer,
      setMapLayer,
      telemetry,
      injectPothole,
      triggerPedestrian,
      accelerateEgo,
      resetTelemetry,
    }),
    [
      view,
      sidebarOpen,
      metrics,
      reports,
      submitReport,
      mapLayer,
      telemetry,
      injectPothole,
      triggerPedestrian,
      accelerateEgo,
      resetTelemetry,
    ],
  )

  return (
    <TridentContext.Provider value={value}>{children}</TridentContext.Provider>
  )
}

export function useTrident() {
  const ctx = useContext(TridentContext)
  if (!ctx) throw new Error('useTrident must be used within TridentProvider')
  return ctx
}
