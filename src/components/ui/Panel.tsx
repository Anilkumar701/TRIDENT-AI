import type { ReactNode } from 'react'

interface PanelProps {
  title: string
  subtitle?: string
  action?: ReactNode
  className?: string
  children: ReactNode
}

export function Panel({ title, subtitle, action, className = '', children }: PanelProps) {
  return (
    <section
      className={`rounded-xl border border-zinc-800/90 bg-zinc-900/70 shadow-[0_0_0_1px_rgba(16,185,129,0.04)] ${className}`}
    >
      <header className="flex items-start justify-between gap-3 border-b border-zinc-800/80 px-4 py-3">
        <div>
          <h2 className="text-[13px] font-semibold tracking-wide text-zinc-100 uppercase">
            {title}
          </h2>
          {subtitle ? (
            <p className="mt-0.5 font-mono text-[11px] text-zinc-500">{subtitle}</p>
          ) : null}
        </div>
        {action}
      </header>
      <div className="p-4">{children}</div>
    </section>
  )
}
