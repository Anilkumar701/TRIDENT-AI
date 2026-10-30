import {
  Bar,
  BarChart,
  CartesianGrid,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts'
import { ACCIDENT_DENSITY, REPEATED_HAZARDS, WEEKLY_CONGESTION } from '../data/mock'
import { OpsMap } from '../components/map/OpsMap'
import { Panel } from '../components/ui/Panel'
import { useTrident } from '../context/useTrident'
import type { MapLayer } from '../types'

const LAYERS: Array<{ id: MapLayer; label: string }> = [
  { id: 'potholes', label: 'View Potholes' },
  { id: 'congestion', label: 'View Congestion' },
  { id: 'accidents', label: 'View Accident Prone Areas' },
]

export function GeoAnalyzer() {
  const { mapLayer, setMapLayer } = useTrident()

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap gap-2">
        {LAYERS.map((l) => (
          <button
            key={l.id}
            type="button"
            onClick={() => setMapLayer(l.id)}
            className={`rounded-full border px-4 py-1.5 text-xs font-medium ${
              mapLayer === l.id
                ? 'border-emerald-500/40 bg-emerald-500/15 text-emerald-300'
                : 'border-zinc-800 text-zinc-400 hover:border-zinc-600'
            }`}
          >
            {l.label}
          </button>
        ))}
      </div>

      <div className="grid gap-4 xl:grid-cols-2">
        <Panel title="Weekly congestion hotspots" subtitle="ITO · Connaught Place · AIIMS">
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={WEEKLY_CONGESTION}>
                <CartesianGrid stroke="#27272a" strokeDasharray="3 3" />
                <XAxis dataKey="day" stroke="#71717a" fontSize={11} />
                <YAxis stroke="#71717a" fontSize={11} />
                <Tooltip
                  contentStyle={{ background: '#09090b', border: '1px solid #27272a' }}
                />
                <Line type="monotone" dataKey="ito" stroke="#fb7185" strokeWidth={2} dot={false} />
                <Line type="monotone" dataKey="cp" stroke="#34d399" strokeWidth={2} dot={false} />
                <Line type="monotone" dataKey="aiims" stroke="#fbbf24" strokeWidth={2} dot={false} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </Panel>
        <Panel title="Highest accident density intersections" subtitle="Weekly incident index">
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={ACCIDENT_DENSITY}>
                <CartesianGrid stroke="#27272a" strokeDasharray="3 3" />
                <XAxis dataKey="name" stroke="#71717a" fontSize={11} />
                <YAxis stroke="#71717a" fontSize={11} />
                <Tooltip
                  contentStyle={{ background: '#09090b', border: '1px solid #27272a' }}
                />
                <Bar dataKey="value" fill="#fb7185" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </Panel>
      </div>

      <div className="grid gap-4 xl:grid-cols-5">
        <Panel className="xl:col-span-3" title="Repeated hazard locations" subtitle="Stacked recurrence">
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={REPEATED_HAZARDS}>
                <CartesianGrid stroke="#27272a" strokeDasharray="3 3" />
                <XAxis dataKey="name" stroke="#71717a" fontSize={11} />
                <YAxis stroke="#71717a" fontSize={11} />
                <Tooltip
                  contentStyle={{ background: '#09090b', border: '1px solid #27272a' }}
                />
                <Bar dataKey="pothole" stackId="a" fill="#fbbf24" />
                <Bar dataKey="water" stackId="a" fill="#22d3ee" />
                <Bar dataKey="other" stackId="a" fill="#a1a1aa" />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </Panel>
        <Panel className="xl:col-span-2" title="Layered geospatial overlay" subtitle="Filter-bound viewport">
          <OpsMap />
        </Panel>
      </div>
    </div>
  )
}
