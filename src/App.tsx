import { GameCanvas } from './scene/GameCanvas'
import { HUD } from './ui/HUD'

export default function App() {
  return (
    <div className="relative h-screen w-screen overflow-hidden bg-[#1a2214]">
      <GameCanvas />
      <HUD />
    </div>
  )
}
