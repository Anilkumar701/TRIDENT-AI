import { Menu, Radio, Satellite } from 'lucide-react'
import { useEffect, useState } from 'react'
import { useTrident } from '../../context/useTrident'

const TITLES: Record<string, string> = {
  control: 'Traffic Control Center',
  hazards: 'Citizen Road Hazard Reporting Hub',
  geospatial: 'Geospatial Mapping & Hotspot Analyzer',
  routing: 'Dynamic Route Optimization Simulator',
  telemetry: 'Autonomous Vehicle Telemetry Simulator',
}

export function TopBar() {
  const { view, setSidebarOpen, metrics } = useTrident()
  const [clock, setClock] = useState(() => new Date())

  useEffect(() => {
    const id = window.setInterval(() => setClock(new Date()), 1000)
    return () => window.clearInterval(id)
  }, [])

  return (
    <header className="sticky top-0 z-20 flex items-center justify-between gap-4 border-b border-zinc-800 bg-zinc-950/85 px-4 py-3 backdrop-blur-md">
      <div className="flex items-center gap-3">
        <button
          type="button"
          className="rounded-md border border-zinc-800 p-2 text-zinc-300 lg:hidden"
          onClick={() => setSidebarOpen(true)}
          aria-label="Open navigation"
        >
          <Menu className="h-4 w-4" />
        </button>
        <div>
          <p className="font-mono text-[10px] tracking-[0.2em] text-emerald-400">
            MISSION CONTROL
          </p>
          <h1 className="text-sm font-semibold text-zinc-100 sm:text-base">
            {TITLES[view]}
          </h1>
        </div>
      </div>
      <div className="flex items-center gap-3">
        <div className="hidden items-center gap-2 rounded-full border border-zinc-800 bg-zinc-900 px-3 py-1.5 sm:flex">
          <Satellite className="h-3.5 w-3.5 text-emerald-400" />
          <span className="font-mono text-[11px] text-zinc-400">
            NODES {metrics.videoNodes.toString().padStart(2, '0')}
          </span>
        </div>
        <div className="flex items-center gap-2 rounded-full border border-emerald-500/30 bg-emerald-500/10 px-3 py-1.5">
          <Radio className="h-3.5 w-3.5 animate-pulse text-emerald-400" />
          <span className="font-mono text-[11px] text-emerald-300">LIVE</span>
        </div>
        <time className="hidden font-mono text-[11px] text-zinc-400 md:block">
          {clock.toLocaleTimeString('en-IN', { hour12: false })} IST
        </time>
      </div>
    </header>
  )
}
