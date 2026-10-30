import type { LucideIcon } from 'lucide-react'

interface MetricCardProps {
  label: string
  value: string
  hint?: string
  tone: 'emerald' | 'amber' | 'rose' | 'zinc'
  icon: LucideIcon
}

const tones = {
  emerald: 'border-emerald-500/30 bg-emerald-500/8 text-emerald-300',
  amber: 'border-amber-500/30 bg-amber-500/8 text-amber-300',
  rose: 'border-rose-500/30 bg-rose-500/8 text-rose-300',
  zinc: 'border-zinc-700 bg-zinc-900/80 text-zinc-200',
}

export function MetricCard({ label, value, hint, tone, icon: Icon }: MetricCardProps) {
  return (
    <article className={`rounded-xl border px-4 py-3.5 ${tones[tone]}`}>
      <div className="flex items-center justify-between">
        <p className="text-[11px] font-medium tracking-[0.14em] text-zinc-400 uppercase">
          {label}
        </p>
        <Icon className="h-4 w-4 opacity-80" />
      </div>
      <p className="mt-2 font-mono text-2xl font-semibold tracking-tight">{value}</p>
      {hint ? <p className="mt-1 text-[11px] text-zinc-500">{hint}</p> : null}
    </article>
  )
}
