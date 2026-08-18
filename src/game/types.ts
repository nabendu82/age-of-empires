export type Team = 'player' | 'enemy' | 'neutral'

export type ResourceKind = 'wood' | 'food' | 'gold'

export type Age = 0 | 1

export type Formation = 'box' | 'line'

export type UnitKind = 'villager' | 'swordsman' | 'archer' | 'scout' | 'mangonel'

export type BuildingKind =
  | 'townCenter'
  | 'barracks'
  | 'house'
  | 'farm'
  | 'lumberCamp'
  | 'mill'
  | 'miningCamp'
  | 'palisade'
  | 'watchTower'

export type EntityKind =
  | UnitKind
  | BuildingKind
  | 'tree'
  | 'berryBush'
  | 'goldMine'
  | 'projectile'

export type OrderType =
  | 'idle'
  | 'move'
  | 'gather'
  | 'return'
  | 'build'
  | 'attack'
  | 'attackMove'

export interface Order {
  type: OrderType
  x: number
  z: number
  targetId: string | null
}

export interface TrainJob {
  kind: UnitKind
  remaining: number
}

export interface Entity {
  id: string
  kind: EntityKind
  team: Team
  x: number
  z: number
  y: number
  hp: number
  maxHp: number
  radius: number
  facing: number
  speed: number
  attack: number
  attackRange: number
  attackTimer: number
  order: Order
  carryResource: ResourceKind | null
  carryAmount: number
  gatherTimer: number
  buildProgress: number
  trainQueue: TrainJob[]
  amount: number
  resourceType: ResourceKind | null
  dying: boolean
  deathTimer: number
  scale: number
  targetId: string | null
  damage: number
  projectileSpeed: number
  splash: number
  rallyX: number
  rallyZ: number
  hasRally: boolean
}

export type PlacementKind =
  | 'barracks'
  | 'house'
  | 'farm'
  | 'lumberCamp'
  | 'mill'
  | 'miningCamp'
  | 'townCenter'
  | 'palisade'
  | 'watchTower'
  | null

export type CommandMode = 'none' | 'attackMove'

export interface HudSlice {
  wood: number
  food: number
  gold: number
  pop: number
  popCap: number
  selectedId: string | null
  selectedIds: string[]
  placementKind: PlacementKind
  commandMode: CommandMode
  winner: Team | null
  entityIds: string[]
  worldEpoch: number
  gameTime: number
  waveStarted: boolean
  waveIndex: number
  waveStartTime: number
  helpOpen: boolean
  playerAge: Age
  ageTimer: number
  aging: boolean
  formation: Formation
  muted: boolean
}

export function idleOrder(): Order {
  return { type: 'idle', x: 0, z: 0, targetId: null }
}

export function isUnit(e: Entity): boolean {
  return (
    e.kind === 'villager' ||
    e.kind === 'swordsman' ||
    e.kind === 'archer' ||
    e.kind === 'scout' ||
    e.kind === 'mangonel'
  )
}

export function isBuilding(e: Entity): boolean {
  return (
    e.kind === 'townCenter' ||
    e.kind === 'barracks' ||
    e.kind === 'house' ||
    e.kind === 'farm' ||
    e.kind === 'lumberCamp' ||
    e.kind === 'mill' ||
    e.kind === 'miningCamp' ||
    e.kind === 'palisade' ||
    e.kind === 'watchTower'
  )
}

export function isResource(e: Entity): boolean {
  return e.kind === 'tree' || e.kind === 'berryBush' || e.kind === 'goldMine'
}

export function isGatherable(e: Entity): boolean {
  if (e.dying || e.amount <= 0 || !e.resourceType) return false
  if (e.kind === 'farm') return isComplete(e)
  return isResource(e)
}

export function isDropoff(e: Entity, resource: ResourceKind | null = null): boolean {
  if (e.dying || !isComplete(e)) return false
  if (e.kind === 'townCenter') return true
  if (resource === 'wood' && e.kind === 'lumberCamp') return true
  if (resource === 'food' && e.kind === 'mill') return true
  if (resource === 'gold' && e.kind === 'miningCamp') return true
  if (!resource) {
    return e.kind === 'lumberCamp' || e.kind === 'mill' || e.kind === 'miningCamp'
  }
  return false
}

export function isMilitary(e: Entity): boolean {
  return (
    e.kind === 'swordsman' ||
    e.kind === 'archer' ||
    e.kind === 'scout' ||
    e.kind === 'mangonel'
  )
}

export function isComplete(e: Entity): boolean {
  return e.buildProgress >= 1
}

export function canTrain(e: Entity): boolean {
  return e.kind === 'townCenter' || e.kind === 'barracks'
}

export function needsFeudal(kind: string): boolean {
  return (
    kind === 'farm' ||
    kind === 'watchTower' ||
    kind === 'archer' ||
    kind === 'scout' ||
    kind === 'mangonel'
  )
}
