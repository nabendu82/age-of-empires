import type { ReactNode } from 'react'
import { Apple, Coins, Crown, Swords, TreePine, Users, Volume2, VolumeOff } from 'lucide-react'
import {
  AI_WAVE2_DELAY,
  AI_WAVE3_DELAY,
  AI_WAVE_DELAY,
} from '../game/constants'
import { useGameStore } from '../game/store'

function Chip({
  icon,
  value,
  label,
  color,
}: {
  icon: ReactNode
  value: number | string
  label: string
  color: string
}) {
  return (
    <div className="flex items-center gap-2 rounded-sm border border-amber-800/50 bg-black/35 px-3 py-1.5">
      <span className={color}>{icon}</span>
      <div className="leading-tight">
        <div className="text-[10px] uppercase tracking-wider text-amber-200/70">{label}</div>
        <div className="font-semibold tabular-nums text-amber-50">{value}</div>
      </div>
    </div>
  )
}

function clock(seconds: number): string {
  const left = Math.max(0, Math.ceil(seconds))
  const m = Math.floor(left / 60)
  const sec = left % 60
  return `${m}:${sec.toString().padStart(2, '0')}`
}

function formatRaid(gameTime: number, waveIndex: number, waveStartTime: number): string {
  if (waveIndex <= 0) return clock(AI_WAVE_DELAY - gameTime)
  if (waveIndex === 1) {
    const left = waveStartTime + AI_WAVE2_DELAY - gameTime
    return left > 0 ? `W2 ${clock(left)}` : 'Incoming'
  }
  if (waveIndex === 2) {
    const left = waveStartTime + AI_WAVE3_DELAY - gameTime
    return left > 0 ? `W3 ${clock(left)}` : 'Incoming'
  }
  return 'Raiding'
}

export function TopBar() {
  const wood = useGameStore((s) => s.wood)
  const food = useGameStore((s) => s.food)
  const gold = useGameStore((s) => s.gold)
  const pop = useGameStore((s) => s.pop)
  const popCap = useGameStore((s) => s.popCap)
  const gameTime = useGameStore((s) => s.gameTime)
  const waveIndex = useGameStore((s) => s.waveIndex)
  const waveStartTime = useGameStore((s) => s.waveStartTime)
  const playerAge = useGameStore((s) => s.playerAge)
  const aging = useGameStore((s) => s.aging)
  const muted = useGameStore((s) => s.muted)

  return (
    <div className="pointer-events-auto flex items-center justify-center gap-3 rounded-b-md border-x border-b border-amber-700/60 bg-gradient-to-b from-[#3a2a18] to-[#24180e] px-4 py-2 shadow-xl">
      <Chip icon={<TreePine size={18} />} value={wood} label="Wood" color="text-emerald-400" />
      <Chip icon={<Apple size={18} />} value={food} label="Food" color="text-red-400" />
      <Chip icon={<Coins size={18} />} value={gold} label="Gold" color="text-yellow-400" />
      <Chip
        icon={<Users size={18} />}
        value={`${pop} / ${popCap}`}
        label="Pop"
        color="text-sky-300"
      />
      <Chip
        icon={<Crown size={18} />}
        value={aging ? 'Aging…' : playerAge >= 1 ? 'Feudal' : 'Dark'}
        label="Age"
        color="text-amber-300"
      />
      <Chip
        icon={<Swords size={18} />}
        value={formatRaid(gameTime, waveIndex, waveStartTime)}
        label={waveIndex <= 0 ? 'Enemy raid' : `Wave ${Math.min(waveIndex + 1, 3)}`}
        color="text-red-300"
      />
      <button
        type="button"
        className="rounded-sm border border-amber-800/50 bg-black/35 p-2 text-amber-100 hover:bg-black/50"
        onClick={() => useGameStore.getState().toggleMute()}
        aria-label={muted ? 'Unmute' : 'Mute'}
      >
        {muted ? <VolumeOff size={16} /> : <Volume2 size={16} />}
      </button>
    </div>
  )
}
