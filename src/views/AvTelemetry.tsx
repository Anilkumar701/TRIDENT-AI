import { Gauge, OctagonAlert, TimerReset } from 'lucide-react'
import { useEffect, useRef } from 'react'
import { Panel } from '../components/ui/Panel'
import { useTrident } from '../context/useTrident'
import type { DriveState } from '../types'

const STATE_STYLE: Record<DriveState, string> = {
  CRUISE: 'border-emerald-500/40 bg-emerald-500/15 text-emerald-300',
  FOLLOW: 'border-cyan-500/40 bg-cyan-500/15 text-cyan-300',
  AVOID: 'border-amber-500/40 bg-amber-500/15 text-amber-300',
  YIELD: 'border-amber-400/40 bg-amber-400/10 text-amber-200',
  'EMERGENCY BRAKE': 'border-rose-500/50 bg-rose-500/20 text-rose-300 animate-pulse',
}

export function AvTelemetry() {
  const {
    telemetry,
    injectPothole,
    triggerPedestrian,
    accelerateEgo,
    resetTelemetry,
  } = useTrident()

  return (
    <div className="space-y-4">
      <div
        className={`flex flex-wrap items-center justify-between gap-3 rounded-xl border px-4 py-3 ${STATE_STYLE[telemetry.state]}`}
      >
        <div>
          <p className="font-mono text-[10px] tracking-[0.2em]">FINITE STATE MACHINE</p>
          <p className="text-xl font-semibold tracking-[0.12em]">{telemetry.state}</p>
        </div>
        <p className="font-mono text-xs opacity-80">
          Obstacle: {telemetry.obstacle === 'none' ? 'CLEAR' : telemetry.obstacle.toUpperCase()}
        </p>
      </div>

      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        <Ticker label="Ego speed" value={`${telemetry.speedKmh.toFixed(1)} km/h`} />
        <Ticker label="Rel. distance" value={`${telemetry.distanceM.toFixed(1)} m`} />
        <Ticker label="Closing velocity" value={`${telemetry.closingVelMs.toFixed(2)} m/s`} />
        <Ticker
          label="Time-to-collision"
          value={`${telemetry.ttcSec.toFixed(2)} s`}
          alert={telemetry.ttcSec < 2}
        />
      </div>

      <div className="grid gap-4 xl:grid-cols-5">
        <Panel
          className="xl:col-span-3"
          title="2D autonomy workspace"
          subtitle="Ego vehicle · lane tracking · injected obstacles"
        >
          <TelemetryCanvas />
        </Panel>
        <Panel title="Simulation injectors" subtitle="Force the planner through FSM edges">
          <div className="space-y-2">
            <button
              type="button"
              onClick={injectPothole}
              className="flex w-full items-center justify-between rounded-lg border border-amber-500/30 bg-amber-500/10 px-3 py-2.5 text-sm text-amber-200"
            >
              Inject pothole obstacle
              <OctagonAlert className="h-4 w-4" />
            </button>
            <button
              type="button"
              onClick={triggerPedestrian}
              className="flex w-full items-center justify-between rounded-lg border border-cyan-500/30 bg-cyan-500/10 px-3 py-2.5 text-sm text-cyan-200"
            >
              Trigger pedestrian crossing
              <Gauge className="h-4 w-4" />
            </button>
            <button
              type="button"
              onClick={accelerateEgo}
              className="flex w-full items-center justify-between rounded-lg border border-rose-500/30 bg-rose-500/10 px-3 py-2.5 text-sm text-rose-200"
            >
              Accelerate ego vehicle
              <Gauge className="h-4 w-4" />
            </button>
            <button
              type="button"
              onClick={resetTelemetry}
              className="flex w-full items-center justify-between rounded-lg border border-zinc-700 px-3 py-2.5 text-sm text-zinc-300"
            >
              Reset scene
              <TimerReset className="h-4 w-4" />
            </button>
            <p className="pt-2 font-mono text-[11px] leading-relaxed text-zinc-500">
              Emergency brake arms when TTC drops below 1.6s with an obstacle in-lane. Deceleration is
              drawn as a rose wash on the canvas and a collapsing speed ticker.
            </p>
          </div>
        </Panel>
      </div>
    </div>
  )
}

function Ticker({
  label,
  value,
  alert,
}: {
  label: string
  value: string
  alert?: boolean
}) {
  return (
    <div
      className={`rounded-xl border px-4 py-3 ${
        alert ? 'border-rose-500/40 bg-rose-500/10' : 'border-zinc-800 bg-zinc-900/70'
      }`}
    >
      <p className="font-mono text-[10px] tracking-[0.16em] text-zinc-500 uppercase">{label}</p>
      <p className={`mt-1 font-mono text-2xl ${alert ? 'text-rose-300' : 'text-zinc-100'}`}>
        {value}
      </p>
    </div>
  )
}

function TelemetryCanvas() {
  const { telemetry } = useTrident()
  const canvasRef = useRef<HTMLCanvasElement | null>(null)
  const telRef = useRef(telemetry)

  useEffect(() => {
    telRef.current = telemetry
  }, [telemetry])

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext('2d')
    if (!ctx) return
    let offset = 0
    let raf = 0
    const loop = () => {
      const t = telRef.current
      const { width, height } = canvas
      ctx.fillStyle = '#09090b'
      ctx.fillRect(0, 0, width, height)

      if (t.state === 'EMERGENCY BRAKE') {
        ctx.fillStyle = 'rgba(244,63,94,0.12)'
        ctx.fillRect(0, 0, width, height)
      }

      const roadX = width * 0.28
      const roadW = width * 0.44
      ctx.fillStyle = '#18181b'
      ctx.fillRect(roadX, 0, roadW, height)
      ctx.strokeStyle = '#52525b'
      ctx.lineWidth = 4
      ctx.beginPath()
      ctx.moveTo(roadX, 0)
      ctx.lineTo(roadX, height)
      ctx.moveTo(roadX + roadW, 0)
      ctx.lineTo(roadX + roadW, height)
      ctx.stroke()

      ctx.strokeStyle = '#fafafa'
      ctx.setLineDash([16, 18])
      ctx.lineWidth = 3
      ctx.beginPath()
      ctx.moveTo(width / 2, -40 + (offset % 34))
      ctx.lineTo(width / 2, height)
      ctx.stroke()
      ctx.setLineDash([])

      const egoY = height * 0.72
      const egoX = width / 2 - 18
      ctx.fillStyle = t.state === 'EMERGENCY BRAKE' ? '#fb7185' : '#34d399'
      roundRect(ctx, egoX, egoY, 36, 58, 6)
      ctx.fill()
      ctx.fillStyle = '#09090b'
      ctx.fillRect(egoX + 6, egoY + 8, 24, 14)

      const scale = 7
      const obsY = egoY - t.distanceM * scale
      if (t.obstacle === 'pothole') {
        ctx.fillStyle = '#f59e0b'
        ctx.beginPath()
        ctx.ellipse(width / 2, obsY, 28, 12, 0, 0, Math.PI * 2)
        ctx.fill()
        ctx.fillStyle = '#09090b'
        ctx.beginPath()
        ctx.ellipse(width / 2, obsY, 16, 6, 0, 0, Math.PI * 2)
        ctx.fill()
      }
      if (t.obstacle === 'pedestrian') {
        ctx.fillStyle = '#fb7185'
        ctx.beginPath()
        ctx.arc(width / 2 + 22, obsY, 8, 0, Math.PI * 2)
        ctx.fill()
        ctx.fillRect(width / 2 + 18, obsY + 8, 8, 18)
      }

      ctx.fillStyle = '#a1a1aa'
      ctx.font = '12px IBM Plex Mono'
      ctx.fillText(`TTC ${t.ttcSec.toFixed(2)}s`, 16, 28)
      ctx.fillText(`${t.speedKmh.toFixed(0)} km/h`, 16, 46)
      if (t.state === 'EMERGENCY BRAKE') {
        ctx.fillStyle = '#fb7185'
        ctx.font = 'bold 16px IBM Plex Sans'
        ctx.fillText('EMERGENCY DECELERATION', 16, height - 20)
      }

      offset += Math.max(1.2, t.speedKmh / 12)
      raf = requestAnimationFrame(loop)
    }
    raf = requestAnimationFrame(loop)
    return () => cancelAnimationFrame(raf)
  }, [])

  return (
    <canvas
      ref={canvasRef}
      width={720}
      height={380}
      className="h-auto w-full rounded-lg border border-zinc-800 bg-black"
    />
  )
}

function roundRect(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  w: number,
  h: number,
  r: number,
) {
  ctx.beginPath()
  ctx.moveTo(x + r, y)
  ctx.arcTo(x + w, y, x + w, y + h, r)
  ctx.arcTo(x + w, y + h, x, y + h, r)
  ctx.arcTo(x, y + h, x, y, r)
  ctx.arcTo(x, y, x + w, y, r)
  ctx.closePath()
}
