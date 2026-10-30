export type ViewId =
  | 'control'
  | 'hazards'
  | 'geospatial'
  | 'routing'
  | 'telemetry'

export type HazardCategory =
  | 'Pothole'
  | 'Damaged Road'
  | 'Cattle'
  | 'Obstruction'
  | 'Waterlogging'

export type HazardSeverity = 'Low' | 'Medium' | 'Critical'
export type ReportStatus = 'Pending Review' | 'Verified' | 'Dispatched'
export type DriveState =
  | 'CRUISE'
  | 'FOLLOW'
  | 'AVOID'
  | 'YIELD'
  | 'EMERGENCY BRAKE'
export type MapLayer = 'potholes' | 'congestion' | 'accidents'

export interface HazardReport {
  id: string
  category: HazardCategory
  severity: HazardSeverity
  lat: number
  lng: number
  status: ReportStatus
  timestamp: string
  duplicateRisk: boolean
  imageSrc: string
  notes: string
}

export interface MapNode {
  id: string
  label: string
  x: number
  y: number
  density: number
  accidents: number
  hazards: number
}

export interface RouteEdge {
  from: string
  to: string
  distanceKm: number
  travelMin: number
  hazard?: {
    type: HazardCategory
    penalty: number
    delayMin: number
  }
}

export interface ClassCounts {
  cars: number
  bikes: number
  trucks: number
  pedestrians: number
}

export interface TelemetrySnapshot {
  speedKmh: number
  distanceM: number
  closingVelMs: number
  ttcSec: number
  state: DriveState
}
