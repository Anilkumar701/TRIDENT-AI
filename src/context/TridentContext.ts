import { createContext } from 'react'
import type {
  DriveState,
  HazardCategory,
  HazardReport,
  HazardSeverity,
  MapLayer,
  ViewId,
} from '../types'

export interface Metrics {
  systemActive: boolean
  videoNodes: number
  trackedVehicles: number
  hazardReports: number
}

export interface Telemetry {
  speedKmh: number
  distanceM: number
  closingVelMs: number
  ttcSec: number
  state: DriveState
  obstacle: 'none' | 'pothole' | 'pedestrian'
}

export interface TridentContextValue {
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

export const TridentContext = createContext<TridentContextValue | null>(null)
