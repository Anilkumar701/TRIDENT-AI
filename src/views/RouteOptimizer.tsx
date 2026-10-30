import { useMemo, useState } from 'react'
import { MAP_NODES } from '../data/mock'
import { computeRoutes, nodeLabel } from '../lib/routing'
import { Panel } from '../components/ui/Panel'
import type { PathResult } from '../lib/routing'

export function RouteOptimizer() {
  const [source, setSource] = useState('CP')
  const [target, setTarget] = useState('LP')
  const { standard, optimized } = useMemo(
    () => computeRoutes(source, target),
    [source, target],
  )

  return (
    <div className="space-y-4">
      <Panel title="Navigation console" subtitle="Source intersection · target destination">
        <div className="grid gap-3 sm:grid-cols-2">
          <Select label="Source intersection location" value={source} onChange={setSource} />
          <Select label="Target destination" value={target} onChange={setTarget} />
        </div>
      </Panel>

      <div className="grid gap-4 lg:grid-cols-2">
        <RouteCard
          title="Standard distance route"
          tone="zinc"
          path={standard}
          caption="Minimizes geodesic distance only. Hazard penalties are ignored."
        />
        <RouteCard
          title="Trident-AI optimized safe route"
          tone="emerald"
          path={optimized}
          caption="Distance + AI cost modifiers for potholes, waterlogging, and obstruction."
        />
      </div>

      <Panel title="Weight penalty ledger" subtitle="How the planner appends cost to flagged segments">
        <div className="overflow-x-auto">
          <table className="w-full min-w-[720px] text-left text-sm">
            <thead className="font-mono text-[10px] tracking-wider text-zinc-500">
              <tr>
                <th className="pb-2">Segment</th>
                <th className="pb-2">Base km</th>
                <th className="pb-2">Base min</th>
                <th className="pb-2">Hazard</th>
                <th className="pb-2">Cost modifier</th>
                <th className="pb-2">Delay</th>
                <th className="pb-2">Used by</th>
              </tr>
            </thead>
            <tbody>
              {(optimized?.segments.length ? mergeSegments(standard, optimized) : []).map((row) => (
                <tr key={row.key} className="border-t border-zinc-800/80">
                  <td className="py-2.5 font-medium">
                    {nodeLabel(row.from)} → {nodeLabel(row.to)}
                  </td>
                  <td className="py-2.5 font-mono text-xs">{row.distanceKm.toFixed(1)}</td>
                  <td className="py-2.5 font-mono text-xs">{row.travelMin}</td>
                  <td className="py-2.5 text-amber-300">{row.hazard?.type ?? '—'}</td>
                  <td className="py-2.5 font-mono text-xs text-rose-300">
                    {row.hazard ? `+${row.hazard.penalty.toFixed(2)}` : '0.00'}
                  </td>
                  <td className="py-2.5 font-mono text-xs">
                    {row.hazard ? `+${row.hazard.delayMin} min` : '0'}
                  </td>
                  <td className="py-2.5 font-mono text-[11px] text-zinc-400">{row.usedBy}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Panel>
    </div>
  )
}

function Select({
  label,
  value,
  onChange,
}: {
  label: string
  value: string
  onChange: (v: string) => void
}) {
  return (
    <label className="block text-[11px] font-medium tracking-wide text-zinc-400 uppercase">
      {label}
      <select
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="mt-1 w-full rounded-lg border border-zinc-700 bg-zinc-950 px-3 py-2 text-sm text-zinc-100"
      >
        {MAP_NODES.map((n) => (
          <option key={n.id} value={n.id}>
            {n.label}
          </option>
        ))}
      </select>
    </label>
  )
}

function RouteCard({
  title,
  caption,
  path,
  tone,
}: {
  title: string
  caption: string
  path: PathResult | null
  tone: 'zinc' | 'emerald'
}) {
  const eta = path ? path.travelMin + (tone === 'zinc' ? path.delayMin : 0) : 0
  const displayEta = tone === 'zinc' ? eta : path ? path.travelMin : 0

  return (
    <Panel title={title} subtitle={caption}>
      {!path ? (
        <p className="text-sm text-rose-300">No connecting corridor in the mock graph.</p>
      ) : (
        <div>
          <div className="mb-4 grid grid-cols-3 gap-2">
            <Kpi label="Distance" value={`${path.distanceKm.toFixed(1)} km`} />
            <Kpi
              label="ETA"
              value={`${displayEta} min`}
              warn={tone === 'zinc' && path.delayMin > 0}
            />
            <Kpi
              label={tone === 'emerald' ? 'Penalty bypassed' : 'Penalty absorbed'}
              value={path.penalty.toFixed(2)}
            />
          </div>
          <RouteRibbon nodes={path.nodes} highlight={tone === 'emerald'} />
          <ol className="mt-4 space-y-2">
            {path.segments.map((s) => (
              <li
                key={`${s.from}-${s.to}`}
                className="flex items-start justify-between gap-3 rounded-lg border border-zinc-800 bg-zinc-950 px-3 py-2"
              >
                <span className="text-sm">
                  {nodeLabel(s.from)} → {nodeLabel(s.to)}
                  {s.hazard && tone === 'zinc' ? (
                    <span className="mt-0.5 block text-[11px] text-amber-400">
                      Weight +{s.hazard.penalty.toFixed(2)} · {s.hazard.type} · +{s.hazard.delayMin} min
                    </span>
                  ) : null}
                  {s.hazard && tone === 'emerald' ? (
                    <span className="mt-0.5 block text-[11px] text-emerald-400">
                      Corridor still flagged; planner accepted residual cost {s.hazard.penalty.toFixed(2)}
                    </span>
                  ) : null}
                </span>
                <span className="font-mono text-[11px] text-zinc-500">
                  {s.distanceKm.toFixed(1)} km
                </span>
              </li>
            ))}
          </ol>
          {tone === 'emerald' ? (
            <p className="mt-3 font-mono text-[11px] text-zinc-500">
              Travel time estimate {displayEta} min. Residual hazard delay on this corridor is{' '}
              {path.delayMin} min after the planner reranked flagged segments.
            </p>
          ) : (
            <p className="mt-3 font-mono text-[11px] text-zinc-500">
              Naive ETA inflates to {eta} min once pothole and waterlogging delays are applied post-hoc.
            </p>
          )}
        </div>
      )}
    </Panel>
  )
}

function Kpi({ label, value, warn }: { label: string; value: string; warn?: boolean }) {
  return (
    <div className="rounded-lg border border-zinc-800 bg-zinc-950 px-3 py-2">
      <p className="font-mono text-[10px] text-zinc-500">{label}</p>
      <p className={`font-mono text-lg ${warn ? 'text-amber-300' : 'text-zinc-100'}`}>{value}</p>
    </div>
  )
}

function RouteRibbon({ nodes, highlight }: { nodes: string[]; highlight: boolean }) {
  return (
    <div className="flex flex-wrap items-center gap-1">
      {nodes.map((id, i) => (
        <span key={`${id}-${i}`} className="flex items-center gap-1">
          <span
            className={`rounded-full px-2 py-0.5 font-mono text-[10px] ${
              highlight
                ? 'bg-emerald-500/15 text-emerald-300'
                : 'bg-zinc-800 text-zinc-300'
            }`}
          >
            {id}
          </span>
          {i < nodes.length - 1 ? <span className="text-zinc-600">→</span> : null}
        </span>
      ))}
    </div>
  )
}

function mergeSegments(standard: PathResult | null, optimized: PathResult | null) {
  const rows = new Map<
    string,
    {
      key: string
      from: string
      to: string
      distanceKm: number
      travelMin: number
      hazard?: PathResult['segments'][0]['hazard']
      usedBy: string
    }
  >()
  const ingest = (path: PathResult | null, tag: string) => {
    path?.segments.forEach((s) => {
      const key = `${s.from}-${s.to}`
      const prev = rows.get(key)
      rows.set(key, {
        key,
        from: s.from,
        to: s.to,
        distanceKm: s.distanceKm,
        travelMin: s.travelMin,
        hazard: s.hazard,
        usedBy: prev ? `${prev.usedBy} + ${tag}` : tag,
      })
    })
  }
  ingest(standard, 'STD')
  ingest(optimized, 'AI')
  return [...rows.values()]
}
