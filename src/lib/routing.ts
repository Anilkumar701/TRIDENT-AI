import { MAP_NODES, ROUTE_EDGES } from '../data/mock'
import type { RouteEdge } from '../types'

export interface PathResult {
  nodes: string[]
  distanceKm: number
  travelMin: number
  penalty: number
  delayMin: number
  segments: Array<{
    from: string
    to: string
    distanceKm: number
    travelMin: number
    hazard?: RouteEdge['hazard']
  }>
}

function neighbors(id: string): RouteEdge[] {
  return ROUTE_EDGES.filter((e) => e.from === id || e.to === id).map((e) =>
    e.from === id
      ? e
      : {
          ...e,
          from: e.to,
          to: e.from,
        },
  )
}

function dijkstra(
  source: string,
  target: string,
  weight: (edge: RouteEdge) => number,
): PathResult | null {
  const dist = new Map<string, number>()
  const prev = new Map<string, { node: string; edge: RouteEdge }>()
  const q = new Set(MAP_NODES.map((n) => n.id))
  MAP_NODES.forEach((n) => dist.set(n.id, Number.POSITIVE_INFINITY))
  dist.set(source, 0)

  while (q.size) {
    let u: string | null = null
    let best = Number.POSITIVE_INFINITY
    for (const id of q) {
      const d = dist.get(id) ?? Number.POSITIVE_INFINITY
      if (d < best) {
        best = d
        u = id
      }
    }
    if (!u || best === Number.POSITIVE_INFINITY) break
    q.delete(u)
    if (u === target) break
    for (const edge of neighbors(u)) {
      if (!q.has(edge.to)) continue
      const alt = best + weight(edge)
      if (alt < (dist.get(edge.to) ?? Number.POSITIVE_INFINITY)) {
        dist.set(edge.to, alt)
        prev.set(edge.to, { node: u, edge })
      }
    }
  }

  if (!prev.has(target) && source !== target) return null

  const nodes: string[] = [target]
  const segments: PathResult['segments'] = []
  let cur = target
  while (cur !== source) {
    const step = prev.get(cur)
    if (!step) break
    segments.unshift({
      from: step.node,
      to: cur,
      distanceKm: step.edge.distanceKm,
      travelMin: step.edge.travelMin,
      hazard: step.edge.hazard,
    })
    cur = step.node
    nodes.unshift(cur)
  }

  const distanceKm = segments.reduce((s, x) => s + x.distanceKm, 0)
  const travelMin = segments.reduce((s, x) => s + x.travelMin, 0)
  const delayMin = segments.reduce((s, x) => s + (x.hazard?.delayMin ?? 0), 0)
  const penalty = segments.reduce((s, x) => s + (x.hazard?.penalty ?? 0), 0)

  return { nodes, distanceKm, travelMin, penalty, delayMin, segments }
}

export function computeRoutes(source: string, target: string) {
  const standard = dijkstra(source, target, (e) => e.distanceKm)
  const optimized = dijkstra(
    source,
    target,
    (e) => e.distanceKm + (e.hazard?.penalty ?? 0) * 4,
  )
  return { standard, optimized }
}

export function nodeLabel(id: string) {
  return MAP_NODES.find((n) => n.id === id)?.label ?? id
}
