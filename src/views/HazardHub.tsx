import { Camera, MapPin, ShieldAlert } from 'lucide-react'
import { useMemo, useState, type FormEvent } from 'react'
import { HAZARD_IMAGES } from '../data/mock'
import { Panel } from '../components/ui/Panel'
import { useTrident } from '../context/useTrident'
import type { HazardCategory, HazardSeverity } from '../types'

const CATEGORIES: HazardCategory[] = [
  'Pothole',
  'Damaged Road',
  'Cattle',
  'Obstruction',
  'Waterlogging',
]

const SEVERITIES: HazardSeverity[] = ['Low', 'Medium', 'Critical']

export function HazardHub() {
  const { reports, submitReport } = useTrident()
  const [category, setCategory] = useState<HazardCategory>('Pothole')
  const [severity, setSeverity] = useState<HazardSeverity>('Medium')
  const [lat, setLat] = useState(28.6139)
  const [lng, setLng] = useState(77.209)
  const [notes, setNotes] = useState('')
  const [imageSrc, setImageSrc] = useState(HAZARD_IMAGES.Pothole)
  const [flash, setFlash] = useState(false)

  const captureCamera = () => {
    setFlash(true)
    setImageSrc(HAZARD_IMAGES[category])
    window.setTimeout(() => setFlash(false), 180)
  }

  const captureGps = () => {
    setLat(28.6 + Math.random() * 0.08)
    setLng(77.18 + Math.random() * 0.08)
  }

  const onSubmit = (e: FormEvent) => {
    e.preventDefault()
    submitReport({ category, severity, lat, lng, notes, imageSrc })
    setNotes('')
  }

  const statusTone: Record<string, string> = {
    'Pending Review': 'border-amber-500/40 bg-amber-500/10 text-amber-300',
    Verified: 'border-emerald-500/40 bg-emerald-500/10 text-emerald-300',
    Dispatched: 'border-cyan-500/40 bg-cyan-500/10 text-cyan-300',
  }

  const recent = useMemo(() => reports, [reports])

  return (
    <div className="mx-auto grid max-w-6xl gap-4 lg:grid-cols-[minmax(0,380px)_1fr]">
      <div className="mx-auto w-full max-w-[390px]">
        <Panel title="Field report console" subtitle="Mobile-first citizen intake">
          <form onSubmit={onSubmit} className="space-y-3">
            <label className="block text-[11px] font-medium tracking-wide text-zinc-400 uppercase">
              Hazard category
              <select
                value={category}
                onChange={(e) => {
                  const next = e.target.value as HazardCategory
                  setCategory(next)
                  setImageSrc(HAZARD_IMAGES[next])
                }}
                className="mt-1 w-full rounded-lg border border-zinc-700 bg-zinc-950 px-3 py-2 text-sm text-zinc-100"
              >
                {CATEGORIES.map((c) => (
                  <option key={c}>{c}</option>
                ))}
              </select>
            </label>

            <fieldset>
              <legend className="text-[11px] font-medium tracking-wide text-zinc-400 uppercase">
                Severity
              </legend>
              <div className="mt-1 grid grid-cols-3 gap-2">
                {SEVERITIES.map((s) => (
                  <button
                    key={s}
                    type="button"
                    onClick={() => setSeverity(s)}
                    className={`rounded-lg border px-2 py-2 text-xs font-medium ${
                      severity === s
                        ? s === 'Critical'
                          ? 'border-rose-500/50 bg-rose-500/15 text-rose-300'
                          : s === 'Medium'
                            ? 'border-amber-500/50 bg-amber-500/15 text-amber-300'
                            : 'border-emerald-500/50 bg-emerald-500/15 text-emerald-300'
                        : 'border-zinc-800 text-zinc-500'
                    }`}
                  >
                    {s}
                  </button>
                ))}
              </div>
            </fieldset>

            <div className="rounded-lg border border-zinc-800 bg-zinc-950 p-3">
              <div className="mb-2 flex items-center justify-between">
                <span className="inline-flex items-center gap-1 text-[11px] text-zinc-400">
                  <MapPin className="h-3.5 w-3.5" /> GPS lock
                </span>
                <button
                  type="button"
                  onClick={captureGps}
                  className="font-mono text-[10px] text-emerald-400"
                >
                  SIMULATE FIX
                </button>
              </div>
              <p className="font-mono text-sm text-zinc-100">{lat.toFixed(5)} N</p>
              <p className="font-mono text-sm text-zinc-100">{lng.toFixed(5)} E</p>
            </div>

            <div className="overflow-hidden rounded-lg border border-zinc-800 bg-zinc-950">
              <div className="flex items-center justify-between px-3 py-2">
                <span className="text-[11px] tracking-wide text-zinc-400 uppercase">
                  Simulate live camera upload
                </span>
                <Camera className="h-3.5 w-3.5 text-zinc-500" />
              </div>
              <div className="relative aspect-[4/3] bg-zinc-900">
                <img src={imageSrc} alt="Captured hazard" className="h-full w-full object-cover" />
                {flash ? <div className="absolute inset-0 bg-white/80" /> : null}
                <button
                  type="button"
                  onClick={captureCamera}
                  className="absolute bottom-3 left-1/2 h-12 w-12 -translate-x-1/2 rounded-full border-4 border-zinc-200 bg-zinc-100 shadow-lg"
                  aria-label="Capture mock camera frame"
                />
              </div>
            </div>

            <textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Operator notes"
              className="h-20 w-full rounded-lg border border-zinc-700 bg-zinc-950 px-3 py-2 text-sm text-zinc-100"
            />
            <button
              type="submit"
              className="w-full rounded-lg bg-emerald-500 py-2.5 text-sm font-semibold text-zinc-950 hover:bg-emerald-400"
            >
              Submit hazard report
            </button>
          </form>
        </Panel>
      </div>

      <Panel
        title="Recent submissions"
        subtitle="Auto timestamps · status tags · de-duplication check"
      >
        <div className="overflow-x-auto">
          <table className="w-full min-w-[640px] text-left text-sm">
            <thead className="font-mono text-[10px] tracking-wider text-zinc-500">
              <tr>
                <th className="pb-2">ID</th>
                <th className="pb-2">Category</th>
                <th className="pb-2">Severity</th>
                <th className="pb-2">Location</th>
                <th className="pb-2">Status</th>
                <th className="pb-2">Dedup</th>
                <th className="pb-2">Time</th>
              </tr>
            </thead>
            <tbody>
              {recent.map((r) => (
                <tr key={r.id} className="border-t border-zinc-800/80">
                  <td className="py-2.5 font-mono text-xs text-emerald-300">{r.id}</td>
                  <td className="py-2.5">{r.category}</td>
                  <td className="py-2.5">
                    <span
                      className={
                        r.severity === 'Critical'
                          ? 'text-rose-400'
                          : r.severity === 'Medium'
                            ? 'text-amber-400'
                            : 'text-emerald-400'
                      }
                    >
                      {r.severity}
                    </span>
                  </td>
                  <td className="py-2.5 font-mono text-[11px] text-zinc-400">
                    {r.lat.toFixed(4)}, {r.lng.toFixed(4)}
                  </td>
                  <td className="py-2.5">
                    <span className={`rounded-full border px-2 py-0.5 text-[11px] ${statusTone[r.status]}`}>
                      {r.status}
                    </span>
                  </td>
                  <td className="py-2.5">
                    {r.duplicateRisk ? (
                      <span className="inline-flex items-center gap-1 text-[11px] text-amber-300">
                        <ShieldAlert className="h-3.5 w-3.5" /> Possible duplicate
                      </span>
                    ) : (
                      <span className="text-[11px] text-emerald-400">Unique</span>
                    )}
                  </td>
                  <td className="py-2.5 font-mono text-[11px] text-zinc-500">
                    {new Date(r.timestamp).toLocaleTimeString('en-IN', { hour12: false })}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Panel>
    </div>
  )
}
