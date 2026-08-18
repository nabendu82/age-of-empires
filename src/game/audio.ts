let ctx: AudioContext | null = null
let muted = false
let lastChop = 0

function ac(): AudioContext | null {
  if (muted || typeof window === 'undefined') return null
  if (!ctx) {
    const Ctor = window.AudioContext || (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext
    if (!Ctor) return null
    ctx = new Ctor()
  }
  if (ctx.state === 'suspended') void ctx.resume()
  return ctx
}

function tone(
  freq: number,
  dur: number,
  type: OscillatorType = 'square',
  gain = 0.045,
  slide = 0,
): void {
  const audio = ac()
  if (!audio) return
  const osc = audio.createOscillator()
  const g = audio.createGain()
  osc.type = type
  osc.frequency.setValueAtTime(freq, audio.currentTime)
  if (slide) osc.frequency.linearRampToValueAtTime(freq + slide, audio.currentTime + dur)
  g.gain.setValueAtTime(gain, audio.currentTime)
  g.gain.exponentialRampToValueAtTime(0.0001, audio.currentTime + dur)
  osc.connect(g)
  g.connect(audio.destination)
  osc.start()
  osc.stop(audio.currentTime + dur)
}

export function setMuted(value: boolean): void {
  muted = value
}

export function playSound(
  name: 'sword' | 'bow' | 'chop' | 'spawn' | 'fanfare' | 'defeat' | 'age' | 'siege',
): void {
  const now = performance.now()
  switch (name) {
    case 'sword':
      tone(180, 0.08, 'square', 0.05)
      tone(90, 0.12, 'sawtooth', 0.03)
      break
    case 'bow':
      tone(520, 0.07, 'triangle', 0.04, -180)
      break
    case 'chop':
      if (now - lastChop < 280) return
      lastChop = now
      tone(140, 0.06, 'square', 0.04)
      break
    case 'spawn':
      tone(330, 0.1, 'triangle', 0.04, 80)
      break
    case 'age':
      tone(262, 0.16, 'triangle', 0.05)
      tone(330, 0.2, 'triangle', 0.04)
      tone(392, 0.28, 'triangle', 0.05)
      break
    case 'fanfare':
      tone(392, 0.18, 'triangle', 0.05)
      tone(523, 0.22, 'triangle', 0.05)
      tone(659, 0.35, 'triangle', 0.06)
      break
    case 'defeat':
      tone(220, 0.25, 'sawtooth', 0.05, -80)
      tone(130, 0.4, 'square', 0.04)
      break
    case 'siege':
      tone(70, 0.18, 'sawtooth', 0.06)
      tone(50, 0.22, 'square', 0.04)
      break
    default:
      break
  }
}
