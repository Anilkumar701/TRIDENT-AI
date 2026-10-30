import type {
  HazardReport,
  MapNode,
  RouteEdge,
} from '../types'

export const HAZARD_IMAGES: Record<string, string> = {
  Pothole: '/hazards/pothole.svg',
  'Damaged Road': '/hazards/crack.svg',
  Cattle: '/hazards/cattle.svg',
  Obstruction: '/hazards/obstruction.svg',
  Waterlogging: '/hazards/water.svg',
}

export const INITIAL_REPORTS: HazardReport[] = [
  {
    id: 'TR-2401',
    category: 'Pothole',
    severity: 'Critical',
    lat: 28.6129,
    lng: 77.2295,
    status: 'Dispatched',
    timestamp: '2026-10-30T09:14:22Z',
    duplicateRisk: true,
    imageSrc: HAZARD_IMAGES.Pothole,
    notes: 'Cluster on outer ring, lane 2 collapse',
  },
  {
    id: 'TR-2402',
    category: 'Waterlogging',
    severity: 'Medium',
    lat: 28.6304,
    lng: 77.2177,
    status: 'Verified',
    timestamp: '2026-10-30T10:02:11Z',
    duplicateRisk: false,
    imageSrc: HAZARD_IMAGES.Waterlogging,
    notes: 'ITO underpass after overnight rain',
  },
  {
    id: 'TR-2403',
    category: 'Cattle',
    severity: 'Low',
    lat: 28.6517,
    lng: 77.1909,
    status: 'Pending Review',
    timestamp: '2026-10-30T11:41:08Z',
    duplicateRisk: false,
    imageSrc: HAZARD_IMAGES.Cattle,
    notes: 'Herd drifting across Karol Bagh service road',
  },
  {
    id: 'TR-2404',
    category: 'Obstruction',
    severity: 'Critical',
    lat: 28.5828,
    lng: 77.2344,
    status: 'Verified',
    timestamp: '2026-10-30T12:18:44Z',
    duplicateRisk: false,
    imageSrc: HAZARD_IMAGES.Obstruction,
    notes: 'Fallen scaffolding near AIIMS signal',
  },
  {
    id: 'TR-2405',
    category: 'Damaged Road',
    severity: 'Medium',
    lat: 28.5494,
    lng: 77.2501,
    status: 'Pending Review',
    timestamp: '2026-10-30T13:05:19Z',
    duplicateRisk: true,
    imageSrc: HAZARD_IMAGES['Damaged Road'],
    notes: 'Longitudinal crack spanning two lanes',
  },
]

export const MAP_NODES: MapNode[] = [
  { id: 'CP', label: 'Connaught Place', x: 42, y: 28, density: 86, accidents: 4, hazards: 2 },
  { id: 'ITO', label: 'ITO Crossing', x: 62, y: 34, density: 92, accidents: 7, hazards: 3 },
  { id: 'IG', label: 'India Gate', x: 54, y: 48, density: 61, accidents: 2, hazards: 1 },
  { id: 'AIIMS', label: 'AIIMS Junction', x: 48, y: 66, density: 78, accidents: 5, hazards: 4 },
  { id: 'KB', label: 'Karol Bagh', x: 24, y: 36, density: 71, accidents: 3, hazards: 2 },
  { id: 'NP', label: 'Nehru Place', x: 68, y: 72, density: 69, accidents: 3, hazards: 2 },
  { id: 'AKS', label: 'Akshardham', x: 82, y: 42, density: 54, accidents: 1, hazards: 1 },
  { id: 'SJ', label: 'Safdarjung', x: 38, y: 78, density: 66, accidents: 2, hazards: 3 },
  { id: 'RK', label: 'Rajouri Kalan', x: 16, y: 58, density: 48, accidents: 1, hazards: 1 },
  { id: 'LP', label: 'Lajpat Nagar', x: 58, y: 84, density: 73, accidents: 4, hazards: 2 },
]

export const ROUTE_EDGES: RouteEdge[] = [
  { from: 'CP', to: 'ITO', distanceKm: 3.4, travelMin: 9, hazard: { type: 'Pothole', penalty: 0.42, delayMin: 4 } },
  { from: 'CP', to: 'KB', distanceKm: 2.8, travelMin: 8 },
  { from: 'CP', to: 'IG', distanceKm: 3.1, travelMin: 7 },
  { from: 'ITO', to: 'IG', distanceKm: 2.2, travelMin: 6 },
  { from: 'ITO', to: 'AKS', distanceKm: 4.1, travelMin: 11, hazard: { type: 'Waterlogging', penalty: 0.55, delayMin: 6 } },
  { from: 'IG', to: 'AIIMS', distanceKm: 3.6, travelMin: 10 },
  { from: 'IG', to: 'NP', distanceKm: 5.2, travelMin: 14 },
  { from: 'KB', to: 'RK', distanceKm: 3.0, travelMin: 8 },
  { from: 'KB', to: 'AIIMS', distanceKm: 6.4, travelMin: 16, hazard: { type: 'Damaged Road', penalty: 0.31, delayMin: 3 } },
  { from: 'RK', to: 'SJ', distanceKm: 4.2, travelMin: 11 },
  { from: 'AIIMS', to: 'SJ', distanceKm: 1.8, travelMin: 5 },
  { from: 'AIIMS', to: 'NP', distanceKm: 3.9, travelMin: 11, hazard: { type: 'Obstruction', penalty: 0.48, delayMin: 5 } },
  { from: 'SJ', to: 'LP', distanceKm: 3.3, travelMin: 9 },
  { from: 'NP', to: 'LP', distanceKm: 2.4, travelMin: 7 },
  { from: 'AKS', to: 'NP', distanceKm: 6.1, travelMin: 15 },
  { from: 'CP', to: 'RK', distanceKm: 5.5, travelMin: 14 },
]

export const WEEKLY_CONGESTION = [
  { day: 'Mon', ito: 88, cp: 72, aiims: 64 },
  { day: 'Tue', ito: 91, cp: 70, aiims: 68 },
  { day: 'Wed', ito: 79, cp: 74, aiims: 71 },
  { day: 'Thu', ito: 95, cp: 81, aiims: 69 },
  { day: 'Fri', ito: 98, cp: 86, aiims: 77 },
  { day: 'Sat', ito: 62, cp: 58, aiims: 49 },
  { day: 'Sun', ito: 44, cp: 41, aiims: 38 },
]

export const ACCIDENT_DENSITY = [
  { name: 'ITO', value: 18 },
  { name: 'AIIMS', value: 14 },
  { name: 'CP', value: 11 },
  { name: 'Lajpat', value: 9 },
  { name: 'Nehru Pl.', value: 7 },
  { name: 'Karol Bagh', value: 6 },
]

export const REPEATED_HAZARDS = [
  { name: 'Ring Rd L2', pothole: 12, water: 4, other: 2 },
  { name: 'ITO Underpass', pothole: 3, water: 11, other: 1 },
  { name: 'AIIMS Signal', pothole: 5, water: 2, other: 7 },
  { name: 'CP Inner', pothole: 8, water: 1, other: 3 },
  { name: 'Safdarjung', pothole: 9, water: 5, other: 2 },
]
