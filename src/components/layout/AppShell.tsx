import { useTrident } from '../../context/useTrident'
import { AvTelemetry } from '../../views/AvTelemetry'
import { GeoAnalyzer } from '../../views/GeoAnalyzer'
import { HazardHub } from '../../views/HazardHub'
import { RouteOptimizer } from '../../views/RouteOptimizer'
import { TrafficControl } from '../../views/TrafficControl'
import { Sidebar } from './Sidebar'
import { TopBar } from './TopBar'

export function AppShell() {
  const { view } = useTrident()

  return (
    <div className="min-h-svh bg-zinc-950 text-zinc-200">
      <Sidebar />
      <div className="lg:pl-64">
        <TopBar />
        <main className="px-4 py-5 sm:px-6">
          {view === 'control' ? <TrafficControl /> : null}
          {view === 'hazards' ? <HazardHub /> : null}
          {view === 'geospatial' ? <GeoAnalyzer /> : null}
          {view === 'routing' ? <RouteOptimizer /> : null}
          {view === 'telemetry' ? <AvTelemetry /> : null}
        </main>
      </div>
    </div>
  )
}
