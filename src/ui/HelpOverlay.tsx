import { CircleHelp, Play, X } from 'lucide-react'
import { useGameStore } from '../game/store'

function Section({ title, items }: { title: string; items: string[] }) {
  return (
    <div>
      <h3 className="text-xs font-semibold uppercase tracking-wider text-amber-200/90">{title}</h3>
      <ul className="mt-1.5 space-y-1 text-xs leading-relaxed text-amber-50/90">
        {items.map((item) => (
          <li key={item} className="pl-3" style={{ textIndent: '-0.65rem' }}>
            <span className="mr-1.5 text-amber-400/80">•</span>
            {item}
          </li>
        ))}
      </ul>
    </div>
  )
}

export function HelpOverlay() {
  const helpOpen = useGameStore((s) => s.helpOpen)
  const gameTime = useGameStore((s) => s.gameTime)
  if (!helpOpen) return null

  const started = gameTime > 0.05
  const playLabel = started ? 'Resume' : 'Play'

  return (
    <div className="pointer-events-auto absolute inset-0 z-30 flex items-center justify-center bg-black/65 p-4">
      <div className="relative max-h-[min(40rem,90vh)] w-full max-w-3xl overflow-y-auto rounded-md border border-amber-700 bg-gradient-to-b from-[#3a2a18] to-[#1a120a] px-7 py-6 shadow-2xl">
        <button
          type="button"
          className="absolute right-3 top-3 rounded-sm p-1 text-amber-200/80 hover:bg-black/30 hover:text-amber-50"
          aria-label="Close help"
          onClick={() => useGameStore.getState().closeHelp()}
        >
          <X size={18} />
        </button>

        <div className="pr-8 text-2xl font-bold text-amber-100">Age of Empires · RTS Prototype</div>
        <p className="mt-1 text-sm text-amber-200/75">
          Destroy the enemy Town Center to win. The match stays paused until you press {playLabel}.
        </p>

        <div className="mt-5 grid gap-5 sm:grid-cols-2">
          <Section
            title="Controls"
            items={[
              'Left-click to select a unit or building',
              'Drag a box to select many units; Shift-click to add or remove',
              'Right-click to move, gather, attack, or set a rally point',
              'F or Attack-move: soldiers fight enemies they pass',
              'Box or Line formation on the command bar for group moves',
              '. (period) selects the next idle villager',
              'Ctrl+1–9 saves a control group; 1–9 recalls it',
              'WASD or arrow keys pan; mouse wheel zooms; middle-drag pans',
              'Escape cancels placement, attack-move, or selection',
            ]}
          />
          <Section
            title="Economy"
            items={[
              'Villagers gather wood, food, and gold, then drop it at the Town Center',
              'Age up to Feudal at the Town Center to unlock farms, towers, scouts, archers, and mangonels',
              'Build Farms for renewable food after berries run out',
              'Lumber Camp, Mill, and Mining Camp are closer drop-offs',
              'A second Town Center lets you boom from two bases',
            ]}
          />
          <Section
            title="Buildings & army"
            items={[
              'House raises population; Barracks trains swordsmen, then archers and mangonels in Feudal',
              'Scout cavalry is a fast Feudal unit from the Town Center',
              'Palisades are cheap wood walls that block pathing',
              'Watch Towers auto-shoot nearby enemies (Feudal)',
              'Fog of war hides the unexplored map; the minimap matches',
              'Right-click the map with a Town Center or Barracks selected to set rally',
            ]}
          />
          <Section
            title="Enemy"
            items={[
              'The first raid marches on your Town Center around 3:30',
              'Waves 2 and 3 follow with mixed swordsmen and archers',
              'Enemy villagers gather on their side of the map',
              'They rebuild a Barracks if you destroy it, and defend their Town Center',
            ]}
          />
        </div>

        <div className="mt-6 flex justify-center">
          <button
            type="button"
            className="inline-flex items-center gap-2 rounded-sm border border-amber-500 bg-[#2a1d10] px-8 py-2.5 text-sm font-semibold text-amber-50 hover:bg-[#3b2a16]"
            onClick={() => useGameStore.getState().closeHelp()}
          >
            <Play size={16} fill="currentColor" />
            {playLabel}
          </button>
        </div>
      </div>
    </div>
  )
}

export function HelpButton() {
  const helpOpen = useGameStore((s) => s.helpOpen)
  const winner = useGameStore((s) => s.winner)
  if (helpOpen || winner) return null

  return (
    <button
      type="button"
      className="pointer-events-auto absolute bottom-28 right-4 z-20 inline-flex items-center gap-2 rounded-sm border border-amber-700/70 bg-[#2c1e10]/95 px-3 py-2 text-xs text-amber-50 shadow-xl hover:bg-[#3b2a16]"
      onClick={() => useGameStore.getState().openHelp()}
    >
      <CircleHelp size={16} />
      Help / Controls
    </button>
  )
}
