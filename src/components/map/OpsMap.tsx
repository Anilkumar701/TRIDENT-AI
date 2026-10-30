import { useMemo } from 'react'
import { MAP_NODES } from '../../data/mock'
import { useTrident } from '../../context/useTrident'

interface OpsMapProps {
  tall?: boolean
}

export function OpsMap({ tall = false }: OpsMapProps) {
  const { mapLayer, reports } = useTrident()

  const pins = useMemo(() => {
    return MAP_NODES.map((n) => {
      const heat =
        mapLayer === 'congestion'
          ? n.density
          : mapLayer === 'accidents'
            ? n.accidents * 12
            : n.hazards * 18
      return { ...n, heat }
    })
  }, [mapLayer])

  return (
    <div
      className={`relative overflow-hidden rounded-lg border border-zinc-800 bg-zinc-950 ${
        tall ? 'h-[520px]' : 'h-[340px] sm:h-[400px]'
      }`}
    >
      <svg viewBox="0 0 100 100" className="h-full w-full" role="img" aria-label="Operations map">
        <defs>
          <radialGradient id="cityGlow" cx="50%" cy="45%" r="60%">
            <stop offset="0%" stopColor="#14532d" stopOpacity="0.35" />
            <stop offset="100%" stopColor="#09090b" stopOpacity="1" />
          </radialGradient>
        </defs>
        <rect width="100" height="100" fill="url(#cityGlow)" />
        {Array.from({ length: 11 }).map((_, i) => (
          <line
            key={`h-${i}`}
            x1="4"
            x2="96"
            y1={8 + i * 8.4}
            y2={8 + i * 8.4}
            stroke="#27272a"
            strokeWidth="0.25"
          />
        ))}
        {Array.from({ length: 11 }).map((_, i) => (
          <line
            key={`v-${i}`}
            y1="6"
            y2="94"
            x1={8 + i * 8.4}
            x2={8 + i * 8.4}
            stroke="#27272a"
            strokeWidth="0.25"
          />
        ))}
        <path
          d="M12 38 H88 M24 18 V86 M42 12 V90 M54 16 V88 M68 20 V84 M18 66 H84 M32 50 H92"
          fill="none"
          stroke="#3f3f46"
          strokeWidth="1.1"
        />
        <path
          d="M12 38 H88 M42 12 V90"
          fill="none"
          stroke="#10b981"
          strokeWidth="0.35"
          strokeDasharray="1.2 1.4"
          opacity="0.7"
        />
        {pins.map((n) => {
          const r = 2.2 + n.heat / 40
          const fill =
            mapLayer === 'accidents'
              ? '#fb7185'
              : mapLayer === 'potholes'
                ? '#fbbf24'
                : '#34d399'
          return (
            <g key={n.id}>
              <circle cx={n.x} cy={n.y} r={r} fill={fill} opacity="0.18" />
              <circle cx={n.x} cy={n.y} r="1.35" fill={fill} />
              <text
                x={n.x + 2.2}
                y={n.y - 1.6}
                fill="#d4d4d8"
                fontSize="2.4"
                fontFamily="IBM Plex Sans"
              >
                {n.label}
              </text>
            </g>
          )
        })}
        {reports.slice(0, 6).map((r, i) => {
          const x = 18 + ((r.lng - 77.18) / 0.08) * 60
          const y = 22 + ((28.66 - r.lat) / 0.12) * 60
          return (
            <g key={r.id}>
              <polygon
                points={`${x},${y - 2.2} ${x + 1.5},${y + 1.1} ${x - 1.5},${y + 1.1}`}
                fill={r.severity === 'Critical' ? '#fb7185' : '#f59e0b'}
              />
              {i < 3 ? (
                <circle cx={x} cy={y} r="3.4" fill="none" stroke="#fb7185" strokeWidth="0.25" opacity="0.6">
                  <animate
                    attributeName="r"
                    values="2.2;5.2;2.2"
                    dur="2.4s"
                    repeatCount="indefinite"
                  />
                </circle>
              ) : null}
            </g>
          )
        })}
      </svg>
      <div className="pointer-events-none absolute inset-0 grid-ops opacity-40" />
      <div className="absolute bottom-3 left-3 flex flex-wrap gap-2">
        <Legend color="bg-emerald-400" label="Density node" />
        <Legend color="bg-rose-400" label="Accident hotspot" />
        <Legend color="bg-amber-400" label="Road hazard" />
      </div>
      <p className="absolute top-3 right-3 rounded border border-zinc-700 bg-zinc-950/80 px-2 py-1 font-mono text-[10px] text-zinc-400">
        LAYER · {mapLayer.toUpperCase()} · NCR GRID
      </p>
    </div>
  )
}

function Legend({ color, label }: { color: string; label: string }) {
  return (
    <span className="inline-flex items-center gap-1.5 rounded border border-zinc-800 bg-zinc-950/80 px-2 py-1 text-[10px] text-zinc-400">
      <span className={`h-1.5 w-1.5 rounded-full ${color}`} />
      {label}
    </span>
  )
}
