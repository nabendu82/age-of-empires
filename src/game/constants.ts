import type { BuildingKind, ResourceKind, UnitKind } from './types'

export const MAP_SIZE = 60
export const MAP_HALF = MAP_SIZE / 2

export const COLORS = {
  player: '#3b82f6',
  enemy: '#ef4444',
  grass: '#5c9a4a',
  grassDark: '#3a6234',
  wood: '#8B5A2B',
  foliage: '#2d6a27',
  gold: '#eab308',
  berry: '#c026d3',
  projectile: '#fde047',
  sky: '#87b4d9',
} as const

export const PLAYER_BASE = { x: -18, z: -18 }
export const ENEMY_BASE = { x: 18, z: 18 }

export const DEATH_DURATION = 0.55
export const ATTACK_COOLDOWN = 1
export const AI_INTERVAL = 5
export const AI_SPAWN_DELAY = 180
export const AI_WAVE_DELAY = 210
export const AI_FIRST_WAVE_SIZE = 2
export const AI_WAVE2_DELAY = 90
export const AI_WAVE3_DELAY = 180
export const AI_WAVE2_SIZE = 3
export const AI_WAVE3_SIZE = 4
export const AI_REINFORCE_DELAY = 50
export const AI_DEFEND_RANGE = 18
export const AI_ENEMY_FEUDAL_TIME = 150
export const BUILD_TIME = 4.5
export const PALISADE_BUILD_TIME = 1.6
export const FARM_BUILD_TIME = 3.2
export const AGE_UP_TIME = 22
export const AGGRO_RANGE = 22
export const ATTACK_MOVE_AGGRO = 10
export const GATHER_RANGE = 1.7
export const DROPOFF_RANGE = 2.2
export const CARRY_CAPACITY = 10
export const GATHER_PER_SEC = 8
export const FARM_FOOD = 180
export const FARM_REGEN = 2.4
export const PROJECTILE_SPEED = 16
export const MANGONEL_PROJECTILE_SPEED = 11
export const HUD_SYNC_INTERVAL = 0.2
export const TOWER_RANGE = 9
export const TOWER_ATTACK = 7
export const FOG_RES = 48

export const UNIT_STATS: Record<
  UnitKind,
  { hp: number; speed: number; attack: number; range: number; radius: number; splash?: number }
> = {
  villager: { hp: 40, speed: 4.2, attack: 3, range: 1.55, radius: 0.38 },
  swordsman: { hp: 75, speed: 4.9, attack: 11, range: 1.8, radius: 0.4 },
  archer: { hp: 45, speed: 4.5, attack: 8, range: 8.2, radius: 0.38 },
  scout: { hp: 55, speed: 7.2, attack: 6, range: 1.5, radius: 0.48 },
  mangonel: { hp: 90, speed: 2.6, attack: 22, range: 9.5, radius: 0.7, splash: 2.4 },
}

export const BUILDING_STATS: Record<
  BuildingKind,
  { hp: number; radius: number; pop: number }
> = {
  townCenter: { hp: 600, radius: 2.5, pop: 5 },
  barracks: { hp: 360, radius: 2.1, pop: 0 },
  house: { hp: 180, radius: 1.45, pop: 5 },
  farm: { hp: 120, radius: 1.55, pop: 0 },
  lumberCamp: { hp: 220, radius: 1.7, pop: 0 },
  mill: { hp: 220, radius: 1.7, pop: 0 },
  miningCamp: { hp: 220, radius: 1.7, pop: 0 },
  palisade: { hp: 90, radius: 0.52, pop: 0 },
  watchTower: { hp: 280, radius: 1.25, pop: 0 },
}

export const RESOURCE_STATS: Record<
  'tree' | 'berryBush' | 'goldMine',
  { amount: number; radius: number; resource: ResourceKind }
> = {
  tree: { amount: 80, radius: 0.65, resource: 'wood' },
  berryBush: { amount: 70, radius: 0.7, resource: 'food' },
  goldMine: { amount: 220, radius: 0.85, resource: 'gold' },
}

export const COSTS: Record<string, { wood?: number; food?: number; gold?: number }> = {
  villager: { food: 50 },
  swordsman: { food: 60, gold: 20 },
  archer: { wood: 40, gold: 45 },
  scout: { food: 80 },
  mangonel: { wood: 120, gold: 70 },
  house: { wood: 50 },
  barracks: { wood: 100, gold: 50 },
  farm: { wood: 60 },
  lumberCamp: { wood: 100 },
  mill: { wood: 100 },
  miningCamp: { wood: 100 },
  townCenter: { wood: 220, gold: 80 },
  palisade: { wood: 8 },
  watchTower: { wood: 125, gold: 50 },
  feudal: { food: 80, gold: 40 },
}

export const TRAIN_TIME: Record<UnitKind, number> = {
  villager: 8,
  swordsman: 10,
  archer: 12,
  scout: 9,
  mangonel: 18,
}

export const DISPLAY_NAMES: Record<string, string> = {
  villager: 'Villager',
  swordsman: 'Swordsman',
  archer: 'Archer',
  scout: 'Scout Cavalry',
  mangonel: 'Mangonel',
  townCenter: 'Town Center',
  barracks: 'Barracks',
  house: 'House',
  farm: 'Farm',
  lumberCamp: 'Lumber Camp',
  mill: 'Mill',
  miningCamp: 'Mining Camp',
  palisade: 'Palisade',
  watchTower: 'Watch Tower',
  tree: 'Tree',
  berryBush: 'Berry Bush',
  goldMine: 'Gold Mine',
}

export const CAMERA = {
  minDistance: 12,
  maxDistance: 52,
  defaultDistance: 22,
  heightFactor: 0.78,
}

export function visionRange(kind: string, isBuilding: boolean): number {
  if (kind === 'scout') return 14
  if (kind === 'watchTower') return 12
  if (kind === 'townCenter') return 12
  if (kind === 'mangonel') return 7
  if (isBuilding) return 5
  return 8
}
