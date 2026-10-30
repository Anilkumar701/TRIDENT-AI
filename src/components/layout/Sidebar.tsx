import {
  Activity,
  AlertTriangle,
  CarFront,
  LayoutDashboard,
  Map,
  Route,
  Shield,
} from 'lucide-react'
import { useTrident } from '../../context/useTrident'
import type { ViewId } from '../../types'

const NAV: Array<{ id: ViewId; label: string; caption: string; icon: typeof LayoutDashboard }> = [
  {
    id: 'control',
    label: 'Traffic Control',
    caption: 'Live ops grid',
    icon: LayoutDashboard,
  },
  {
    id: 'hazards',
    label: 'Hazard Reporting',
    caption: 'Citizen intake',
    icon: AlertTriangle,
  },
  {
    id: 'geospatial',
    label: 'Hotspot Analyzer',
    caption: 'Geospatial intel',
    icon: Map,
  },
  {
    id: 'routing',
    label: 'Route Optimizer',
    caption: 'Safe pathing',
    icon: Route,
  },
  {
    id: 'telemetry',
    label: 'AV Telemetry',
    caption: 'FSM simulator',
    icon: CarFront,
  },
]

export function Sidebar() {
  const { view, setView, sidebarOpen, setSidebarOpen } = useTrident()

  return (
    <>
      {sidebarOpen ? (
        <button
          type="button"
          className="fixed inset-0 z-30 bg-black/60 lg:hidden"
          aria-label="Close navigation"
          onClick={() => setSidebarOpen(false)}
        />
      ) : null}
      <aside
        className={`fixed inset-y-0 left-0 z-40 flex w-64 flex-col border-r border-zinc-800 bg-zinc-950/95 backdrop-blur-md transition-transform lg:translate-x-0 ${
          sidebarOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        <div className="flex items-center gap-3 border-b border-zinc-800 px-5 py-5">
          <div className="flex h-10 w-10 items-center justify-center rounded-lg border border-emerald-500/40 bg-emerald-500/10">
            <Shield className="h-5 w-5 text-emerald-400" />
          </div>
          <div>
            <p className="text-sm font-semibold tracking-wide text-zinc-100">TRIDENT-AI</p>
            <p className="font-mono text-[10px] tracking-[0.18em] text-emerald-400/90">
              SIH OPS SUITE
            </p>
          </div>
        </div>

        <nav className="flex-1 space-y-1 overflow-y-auto px-3 py-4">
          {NAV.map((item) => {
            const active = view === item.id
            const Icon = item.icon
            return (
              <button
                key={item.id}
                type="button"
                onClick={() => {
                  setView(item.id)
                  setSidebarOpen(false)
                }}
                className={`flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-left transition ${
                  active
                    ? 'border border-emerald-500/30 bg-emerald-500/10 text-emerald-200'
                    : 'border border-transparent text-zinc-400 hover:bg-zinc-900 hover:text-zinc-200'
                }`}
              >
                <Icon className="h-4 w-4 shrink-0" />
                <span>
                  <span className="block text-[13px] font-medium">{item.label}</span>
                  <span className="block font-mono text-[10px] text-zinc-500">
                    {item.caption}
                  </span>
                </span>
              </button>
            )
          })}
        </nav>

        <div className="border-t border-zinc-800 px-4 py-4">
          <div className="flex items-center gap-2 rounded-lg border border-zinc-800 bg-zinc-900/80 px-3 py-2">
            <Activity className="h-3.5 w-3.5 text-emerald-400" />
            <div>
              <p className="text-[11px] font-medium text-zinc-300">National Grid Link</p>
              <p className="font-mono text-[10px] text-emerald-400">SECURE · UPTIME 99.97%</p>
            </div>
          </div>
        </div>
      </aside>
    </>
  )
}
