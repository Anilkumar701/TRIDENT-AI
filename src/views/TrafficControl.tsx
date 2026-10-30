import { Activity, Camera, CarFront, TriangleAlert } from 'lucide-react'
import { LiveCctvNode } from '../components/cctv/LiveCctvNode'
import { OpsMap } from '../components/map/OpsMap'
import { MetricCard } from '../components/ui/MetricCard'
import { Panel } from '../components/ui/Panel'
import { useTrident } from '../context/useTrident'

export function TrafficControl() {
  const { metrics, reports, setMapLayer } = useTrident()
  const critical = reports.filter((r) => r.severity === 'Critical').length

  return (
    <div className="space-y-4">
      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        <MetricCard
          label="System Status"
          value="ACTIVE"
          hint="Core inference cluster healthy"
          tone="emerald"
          icon={Activity}
        />
        <MetricCard
          label="Video Inference Nodes"
          value={String(metrics.videoNodes)}
          hint="Active CCTV feeds online"
          tone="zinc"
          icon={Camera}
        />
        <MetricCard
          label="Tracked Vehicles"
          value={metrics.trackedVehicles.toLocaleString('en-IN')}
          hint="Multi-node association"
          tone="amber"
          icon={CarFront}
        />
        <MetricCard
          label="Active Hazard Reports"
          value={String(metrics.hazardReports)}
          hint={`${critical} critical in queue`}
          tone="rose"
          icon={TriangleAlert}
        />
      </div>

      <div className="grid gap-4 xl:grid-cols-5">
        <Panel
          className="xl:col-span-3"
          title="City operations viewport"
          subtitle="Simulated NCR vector grid · density / accident / hazard layers"
          action={
            <div className="flex gap-1">
              {(
                [
                  ['congestion', 'Density'],
                  ['accidents', 'Accidents'],
                  ['potholes', 'Hazards'],
                ] as const
              ).map(([id, label]) => (
                <button
                  key={id}
                  type="button"
                  onClick={() => setMapLayer(id)}
                  className="rounded border border-zinc-700 px-2 py-1 font-mono text-[10px] text-zinc-400 hover:border-emerald-500/40 hover:text-emerald-300"
                >
                  {label}
                </button>
              ))}
            </div>
          }
        >
          <OpsMap />
        </Panel>
        <Panel
          className="xl:col-span-2"
          title="Live CCTV analytics node"
          subtitle="Bounding boxes · classification · density score"
        >
          <LiveCctvNode />
        </Panel>
      </div>
    </div>
  )
}
