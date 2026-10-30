import { useEffect, useRef, useState } from 'react'
import type { ClassCounts } from '../../types'

interface Actor {
  x: number
  y: number
  w: number
  h: number
  vx: number
  kind: keyof ClassCounts
  id: number
}

const KIND_COLOR: Record<keyof ClassCounts, string> = {
  cars: '#34d399',
  bikes: '#22d3ee',
  trucks: '#fbbf24',
  pedestrians: '#fb7185',
}

export function LiveCctvNode() {
  const canvasRef = useRef<HTMLCanvasElement | null>(null)
  const actorsRef = useRef<Actor[]>([])
  const [counts, setCounts] = useState<ClassCounts>({
    cars: 0,
    bikes: 0,
    trucks: 0,
    pedestrians: 0,
  })
  const [boxes, setBoxes] = useState(0)

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext('2d')
    if (!ctx) return

    const spawn = () => {
      const roll = Math.random()
      const kind: keyof ClassCounts =
        roll > 0.82 ? 'trucks' : roll > 0.62 ? 'bikes' : roll > 0.12 ? 'cars' : 'pedestrians'
      const lane = 70 + Math.floor(Math.random() * 4) * 52
      const size =
        kind === 'trucks'
          ? { w: 54, h: 28 }
          : kind === 'cars'
            ? { w: 36, h: 20 }
            : kind === 'bikes'
              ? { w: 18, h: 12 }
              : { w: 10, h: 16 }
      actorsRef.current.push({
        id: Math.random(),
        x: -60,
        y: lane + (kind === 'pedestrians' ? -28 : 0),
        ...size,
        vx: kind === 'pedestrians' ? 0.6 : kind === 'bikes' ? 2.4 : kind === 'trucks' ? 1.2 : 1.8,
        kind,
      })
    }

    let frame = 0
    let raf = 0
    const loop = () => {
      const { width, height } = canvas
      ctx.fillStyle = '#0c0c0f'
      ctx.fillRect(0, 0, width, height)
      ctx.fillStyle = '#18181b'
      ctx.fillRect(0, 60, width, height - 60)
      ctx.strokeStyle = '#3f3f46'
      ctx.setLineDash([8, 10])
      ctx.lineWidth = 2
      for (let i = 0; i < 4; i++) {
        const y = 96 + i * 52
        ctx.beginPath()
        ctx.moveTo(0, y)
        ctx.lineTo(width, y)
        ctx.stroke()
      }
      ctx.setLineDash([])

      if (frame % 38 === 0 && actorsRef.current.length < 22) spawn()

      const next: Actor[] = []
      const tally: ClassCounts = { cars: 0, bikes: 0, trucks: 0, pedestrians: 0 }
      for (const a of actorsRef.current) {
        a.x += a.vx
        if (a.x > width + 40) continue
        next.push(a)
        tally[a.kind] += 1
        ctx.fillStyle = KIND_COLOR[a.kind]
        ctx.globalAlpha = 0.9
        ctx.fillRect(a.x, a.y, a.w, a.h)
        ctx.globalAlpha = 1
        ctx.strokeStyle = KIND_COLOR[a.kind]
        ctx.lineWidth = 1.5
        ctx.strokeRect(a.x - 4, a.y - 4, a.w + 8, a.h + 8)
        ctx.font = '10px IBM Plex Mono'
        ctx.fillText(a.kind.toUpperCase(), a.x - 4, a.y - 8)
      }
      actorsRef.current = next

      ctx.fillStyle = 'rgba(16,185,129,0.08)'
      for (let y = 0; y < height; y += 4) ctx.fillRect(0, y, width, 1)
      ctx.fillStyle = '#34d399'
      ctx.fillRect(0, (frame * 3) % height, width, 2)

      if (frame % 8 === 0) {
        setCounts({ ...tally })
        setBoxes(next.length)
      }
      frame += 1
      raf = requestAnimationFrame(loop)
    }
    raf = requestAnimationFrame(loop)
    return () => cancelAnimationFrame(raf)
  }, [])

  const total = counts.cars + counts.bikes + counts.trucks + counts.pedestrians
  const density = Math.min(100, Math.round((total / 18) * 100))
  const congested = total > 15

  return (
    <div>
      <div className="relative overflow-hidden rounded-lg border border-zinc-800 bg-black">
        <canvas ref={canvasRef} width={720} height={320} className="h-auto w-full" />
        <div className="pointer-events-none absolute inset-0 scanlines" />
        <div className="absolute top-2 left-2 rounded border border-emerald-500/40 bg-zinc-950/80 px-2 py-1 font-mono text-[10px] text-emerald-300">
          NODE · CCTV-07 · INFERENCE ON
        </div>
        {congested ? (
          <div className="absolute top-2 right-2 animate-pulse rounded border border-rose-500/50 bg-rose-500/20 px-3 py-1 font-mono text-[11px] font-semibold tracking-wide text-rose-300">
            CONGESTION ALERT
          </div>
        ) : null}
      </div>
      <div className="mt-3 grid grid-cols-2 gap-2 sm:grid-cols-5">
        <Stat label="Boxes" value={String(boxes)} />
        <Stat label="Cars" value={String(counts.cars)} />
        <Stat label="Bikes" value={String(counts.bikes)} />
        <Stat label="Trucks" value={String(counts.trucks)} />
        <Stat label="Peds" value={String(counts.pedestrians)} />
      </div>
      <div className="mt-3">
        <div className="mb-1 flex justify-between font-mono text-[10px] text-zinc-500">
          <span>TRAFFIC DENSITY SCORE</span>
          <span className={congested ? 'text-rose-400' : 'text-emerald-400'}>{density}%</span>
        </div>
        <div className="h-1.5 overflow-hidden rounded-full bg-zinc-800">
          <div
            className={`h-full ${congested ? 'bg-rose-400' : 'bg-emerald-400'}`}
            style={{ width: `${density}%` }}
          />
        </div>
      </div>
    </div>
  )
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-md border border-zinc-800 bg-zinc-950 px-2 py-1.5">
      <p className="font-mono text-[9px] tracking-wider text-zinc-500">{label}</p>
      <p className="font-mono text-sm text-zinc-100">{value}</p>
    </div>
  )
}
