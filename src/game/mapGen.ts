import {
  BUILDING_STATS,
  ENEMY_BASE,
  FARM_FOOD,
  PLAYER_BASE,
  RESOURCE_STATS,
  TOWER_ATTACK,
  TOWER_RANGE,
  UNIT_STATS,
} from './constants'
import {
  idleOrder,
  type BuildingKind,
  type Entity,
  type Team,
  type UnitKind,
} from './types'

function mulberry32(seed: number): () => number {
  let a = seed
  return () => {
    a |= 0
    a = (a + 0x6d2b79f5) | 0
    let t = Math.imul(a ^ (a >>> 15), 1 | a)
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296
  }
}

export interface WorldSeed {
  entities: Record<string, Entity>
  nextId: number
}

function blank(id: string, kind: Entity['kind'], team: Team, x: number, z: number): Entity {
  return {
    id,
    kind,
    team,
    x,
    z,
    y: 0,
    hp: 1,
    maxHp: 1,
    radius: 0.4,
    facing: 0,
    speed: 0,
    attack: 0,
    attackRange: 0,
    attackTimer: 0,
    order: idleOrder(),
    carryResource: null,
    carryAmount: 0,
    gatherTimer: 0,
    buildProgress: 1,
    trainQueue: [],
    amount: 0,
    resourceType: null,
    dying: false,
    deathTimer: 0,
    scale: 1,
    targetId: null,
    damage: 0,
    projectileSpeed: 0,
    splash: 0,
    rallyX: x,
    rallyZ: z,
    hasRally: false,
  }
}

export function createUnit(
  id: string,
  kind: UnitKind,
  team: Team,
  x: number,
  z: number,
): Entity {
  const stats = UNIT_STATS[kind]
  const e = blank(id, kind, team, x, z)
  e.hp = stats.hp
  e.maxHp = stats.hp
  e.speed = stats.speed
  e.attack = stats.attack
  e.attackRange = stats.range
  e.radius = stats.radius
  e.splash = stats.splash ?? 0
  return e
}

export function createBuilding(
  id: string,
  kind: BuildingKind,
  team: Team,
  x: number,
  z: number,
  complete = true,
): Entity {
  const stats = BUILDING_STATS[kind]
  const e = blank(id, kind, team, x, z)
  e.hp = complete ? stats.hp : Math.max(40, stats.hp * 0.15)
  e.maxHp = stats.hp
  e.radius = stats.radius
  e.buildProgress = complete ? 1 : 0
  if (kind === 'farm') {
    e.resourceType = 'food'
    e.amount = FARM_FOOD
  }
  if (kind === 'watchTower') {
    e.attack = TOWER_ATTACK
    e.attackRange = TOWER_RANGE
  }
  return e
}

export function createResource(
  id: string,
  kind: 'tree' | 'berryBush' | 'goldMine',
  x: number,
  z: number,
  scale = 1,
): Entity {
  const stats = RESOURCE_STATS[kind]
  const e = blank(id, kind, 'neutral', x, z)
  e.amount = stats.amount
  e.resourceType = stats.resource
  e.radius = stats.radius
  e.scale = scale
  e.hp = 1
  e.maxHp = 1
  return e
}

export function createProjectile(
  id: string,
  team: Team,
  x: number,
  z: number,
  targetId: string,
  damage: number,
  splash = 0,
  speed = 16,
): Entity {
  const e = blank(id, 'projectile', team, x, z)
  e.y = splash > 0 ? 1.6 : 1.2
  e.targetId = targetId
  e.damage = damage
  e.projectileSpeed = speed
  e.splash = splash
  e.radius = splash > 0 ? 0.28 : 0.12
  return e
}

function tooClose(
  x: number,
  z: number,
  spots: { x: number; z: number; r: number }[],
  r: number,
): boolean {
  for (const s of spots) {
    if (Math.hypot(x - s.x, z - s.z) < s.r + r) return true
  }
  return false
}

export function generateWorld(): WorldSeed {
  const rand = mulberry32(42)
  const entities: Record<string, Entity> = {}
  let n = 1
  const id = () => `e${n++}`
  const occupied: { x: number; z: number; r: number }[] = []

  const add = (e: Entity) => {
    entities[e.id] = e
    occupied.push({ x: e.x, z: e.z, r: e.radius + 0.8 })
  }

  add(createBuilding(id(), 'townCenter', 'player', PLAYER_BASE.x, PLAYER_BASE.z, true))
  add(createUnit(id(), 'villager', 'player', PLAYER_BASE.x + 3.2, PLAYER_BASE.z + 1.4))

  add(createBuilding(id(), 'townCenter', 'enemy', ENEMY_BASE.x, ENEMY_BASE.z, true))
  add(createBuilding(id(), 'barracks', 'enemy', ENEMY_BASE.x - 5.5, ENEMY_BASE.z + 1.2, true))
  add(createUnit(id(), 'villager', 'enemy', ENEMY_BASE.x - 3.2, ENEMY_BASE.z - 1.4))
  add(createUnit(id(), 'villager', 'enemy', ENEMY_BASE.x - 2.0, ENEMY_BASE.z - 3.1))
  add(createUnit(id(), 'villager', 'enemy', ENEMY_BASE.x - 4.2, ENEMY_BASE.z - 2.2))

  const starter: { kind: 'tree' | 'berryBush' | 'goldMine'; x: number; z: number }[] = [
    { kind: 'tree', x: -12, z: -16 },
    { kind: 'tree', x: -11, z: -20 },
    { kind: 'tree', x: -14.5, z: -13.5 },
    { kind: 'tree', x: -9, z: -14 },
    { kind: 'berryBush', x: -16, z: -12 },
    { kind: 'berryBush', x: -20.5, z: -13 },
    { kind: 'goldMine', x: -24, z: -14.5 },
    { kind: 'tree', x: 12, z: 16 },
    { kind: 'tree', x: 11, z: 21 },
    { kind: 'berryBush', x: 16, z: 12 },
    { kind: 'goldMine', x: 13, z: 9.5 },
  ]

  for (const s of starter) {
    add(createResource(id(), s.kind, s.x, s.z, 0.9 + rand() * 0.3))
  }

  const scatter = (
    kind: 'tree' | 'berryBush' | 'goldMine',
    count: number,
  ) => {
    let placed = 0
    let attempts = 0
    while (placed < count && attempts < 400) {
      attempts += 1
      const x = (rand() - 0.5) * 52
      const z = (rand() - 0.5) * 52
      if (Math.hypot(x - PLAYER_BASE.x, z - PLAYER_BASE.z) < 9) continue
      if (Math.hypot(x - ENEMY_BASE.x, z - ENEMY_BASE.z) < 9) continue
      const r = RESOURCE_STATS[kind].radius
      if (tooClose(x, z, occupied, r + 1.2)) continue
      add(createResource(id(), kind, x, z, 0.8 + rand() * 0.45))
      placed += 1
    }
  }

  scatter('tree', 22)
  scatter('berryBush', 10)
  scatter('goldMine', 5)

  return { entities, nextId: n }
}
