import {
  AGGRO_RANGE,
  AI_DEFEND_RANGE,
  AI_ENEMY_FEUDAL_TIME,
  AI_FIRST_WAVE_SIZE,
  AI_INTERVAL,
  AI_REINFORCE_DELAY,
  AI_SPAWN_DELAY,
  AI_WAVE2_DELAY,
  AI_WAVE2_SIZE,
  AI_WAVE3_DELAY,
  AI_WAVE3_SIZE,
  AI_WAVE_DELAY,
  ATTACK_COOLDOWN,
  ATTACK_MOVE_AGGRO,
  BUILD_TIME,
  CARRY_CAPACITY,
  COSTS,
  DEATH_DURATION,
  DROPOFF_RANGE,
  ENEMY_BASE,
  FARM_BUILD_TIME,
  FARM_FOOD,
  FARM_REGEN,
  GATHER_PER_SEC,
  GATHER_RANGE,
  MANGONEL_PROJECTILE_SPEED,
  PALISADE_BUILD_TIME,
  PROJECTILE_SPEED,
  TOWER_RANGE,
} from './constants'
import { playSound } from './audio'
import { tickFog } from './fog'
import { createBuilding, createProjectile } from './mapGen'
import { dist, moveTowards, nearest } from './pathfinding'
import {
  addResource,
  allocId,
  isPlacementValid,
  markHud,
  spawnUnit,
  spend,
  useGameStore,
} from './store'
import {
  idleOrder,
  isBuilding,
  isComplete,
  isDropoff,
  isMilitary,
  isUnit,
  type Entity,
  type Team,
} from './types'

function list(entities: Record<string, Entity>): Entity[] {
  return Object.values(entities)
}

function startDeath(e: Entity): void {
  if (e.dying) return
  e.dying = true
  e.deathTimer = DEATH_DURATION
  e.order = idleOrder()
  e.hp = 0
  markHud()
}

function applyDamage(e: Entity, amount: number): void {
  if (e.dying) return
  e.hp -= amount
  if (e.hp <= 0) startDeath(e)
}

function enemiesOf(team: Team, e: Entity): boolean {
  if (e.dying) return false
  if (team === 'player') return e.team === 'enemy' && (isUnit(e) || isBuilding(e))
  if (team === 'enemy') return e.team === 'player' && (isUnit(e) || isBuilding(e))
  return false
}

function dropoffFor(e: Entity, entities: Entity[]): Entity | null {
  const resource = e.carryResource
  return nearest(
    e,
    entities,
    (b) => b.team === e.team && isDropoff(b, resource),
  )
}

function autoAcquire(e: Entity, entities: Entity[]): void {
  if (e.order.type !== 'idle') return
  if (e.kind === 'villager') return
  const wave = useGameStore.getState().waveStarted
  const hunt = e.hp < e.maxHp || (e.team === 'player' && wave)
  const range = e.hp < e.maxHp ? 40 : hunt ? 26 : AGGRO_RANGE
  const foe = nearest(
    e,
    entities,
    (o) => enemiesOf(e.team, o) && dist(e.x, e.z, o.x, o.z) <= range,
  )
  if (foe) {
    e.order = { type: 'attack', x: foe.x, z: foe.z, targetId: foe.id }
  }
}

function fireAt(
  e: Entity,
  target: Entity,
  all: Record<string, Entity>,
  ranged: boolean,
): void {
  e.facing = Math.atan2(target.x - e.x, target.z - e.z)
  if (e.attackTimer > 0) return
  e.attackTimer = e.kind === 'mangonel' ? ATTACK_COOLDOWN * 1.6 : ATTACK_COOLDOWN
  if (ranged) {
    const id = allocId()
    const splash = e.splash || 0
    const speed = e.kind === 'mangonel' ? MANGONEL_PROJECTILE_SPEED : PROJECTILE_SPEED
    all[id] = createProjectile(id, e.team, e.x, e.z, target.id, e.attack, splash, speed)
    markHud()
    playSound(e.kind === 'mangonel' ? 'siege' : 'bow')
  } else {
    applyDamage(target, e.attack)
    playSound('sword')
  }
}

function tickCombat(e: Entity, entities: Entity[], all: Record<string, Entity>, dt: number): void {
  const target = e.order.targetId ? all[e.order.targetId] : null
  if (!target || target.dying) {
    const s = useGameStore.getState()
    if (e.team === 'enemy' && isMilitary(e) && s.waveStarted) {
      const prey = raidTarget(entities)
      if (prey) {
        e.order = { type: 'attack', x: prey.x, z: prey.z, targetId: prey.id }
        return
      }
    }
    e.order = idleOrder()
    return
  }

  e.order.x = target.x
  e.order.z = target.z
  const d = dist(e.x, e.z, target.x, target.z)
  const range = e.attackRange

  if (d > range) {
    moveTowards(e, target.x, target.z, dt, entities, range, target.id)
    return
  }

  e.attackTimer -= dt
  fireAt(e, target, all, e.kind === 'archer' || e.kind === 'mangonel')
}

function tickAttackMove(e: Entity, entities: Entity[], all: Record<string, Entity>, dt: number): void {
  const foe = nearest(
    e,
    entities,
    (o) => enemiesOf(e.team, o) && dist(e.x, e.z, o.x, o.z) <= ATTACK_MOVE_AGGRO,
  )
  if (foe) {
    const d = dist(e.x, e.z, foe.x, foe.z)
    if (d > e.attackRange) {
      moveTowards(e, foe.x, foe.z, dt, entities, e.attackRange, foe.id)
      return
    }
    e.attackTimer -= dt
    fireAt(e, foe, all, e.kind === 'archer' || e.kind === 'mangonel')
    return
  }
  if (moveTowards(e, e.order.x, e.order.z, dt, entities, 0.4)) {
    e.order = idleOrder()
  }
}

function tickGather(e: Entity, entities: Entity[], all: Record<string, Entity>, dt: number): void {
  const node = e.order.targetId ? all[e.order.targetId] : null
  if (!node || node.dying) {
    e.order = idleOrder()
    return
  }
  if (node.kind === 'farm' && !isComplete(node)) {
    e.order = idleOrder()
    return
  }

  if (node.amount <= 0 && node.kind === 'farm') return

  if (node.amount <= 0) {
    e.order = idleOrder()
    return
  }

  const reach = node.radius + GATHER_RANGE
  if (dist(e.x, e.z, node.x, node.z) > reach) {
    moveTowards(e, node.x, node.z, dt, entities, reach, node.id)
    return
  }

  e.gatherTimer += dt
  const gained = GATHER_PER_SEC * dt
  const take = Math.min(gained, node.amount, CARRY_CAPACITY - e.carryAmount)
  if (take > 0) {
    node.amount -= take
    e.carryAmount += take
    e.carryResource = node.resourceType
    playSound('chop')
  }

  if (node.amount <= 0 && node.kind !== 'farm') startDeath(node)

  if (e.carryAmount >= CARRY_CAPACITY - 0.01 || (node.amount <= 0 && node.kind !== 'farm')) {
    const drop = dropoffFor(e, entities)
    if (drop) {
      e.order = {
        type: 'return',
        x: drop.x,
        z: drop.z,
        targetId: node.amount > 0 || node.kind === 'farm' ? node.id : null,
      }
    } else {
      e.order = idleOrder()
    }
  }
}

function tickReturn(e: Entity, entities: Entity[], all: Record<string, Entity>, dt: number): void {
  const tc = dropoffFor(e, entities)
  if (!tc) {
    e.order = idleOrder()
    return
  }
  const reach = tc.radius + DROPOFF_RANGE
  const gap = dist(e.x, e.z, tc.x, tc.z)
  if (gap > reach) {
    const dx = e.x - tc.x
    const dz = e.z - tc.z
    const mag = Math.hypot(dx, dz) || 1
    const dropX = tc.x + (dx / mag) * (tc.radius + 1.1)
    const dropZ = tc.z + (dz / mag) * (tc.radius + 1.1)
    moveTowards(e, dropX, dropZ, dt, entities, 0.55, tc.id)
    return
  }
  if (e.carryResource && e.carryAmount > 0) {
    addResource(e.team, e.carryResource, Math.max(1, Math.round(e.carryAmount)))
    e.carryAmount = 0
    e.carryResource = null
  }
  const nodeId = e.order.targetId
  const node = nodeId ? all[nodeId] : null
  if (node && !node.dying && (node.amount > 0 || node.kind === 'farm')) {
    e.order = { type: 'gather', x: node.x, z: node.z, targetId: node.id }
  } else {
    e.order = idleOrder()
  }
}

function buildDuration(kind: Entity['kind']): number {
  if (kind === 'palisade') return PALISADE_BUILD_TIME
  if (kind === 'farm') return FARM_BUILD_TIME
  return BUILD_TIME
}

function tickBuild(e: Entity, entities: Entity[], all: Record<string, Entity>, dt: number): void {
  const site = e.order.targetId ? all[e.order.targetId] : null
  if (!site || site.dying) {
    e.order = idleOrder()
    return
  }
  const reach = site.radius + 1.1
  if (dist(e.x, e.z, site.x, site.z) > reach) {
    moveTowards(e, site.x, site.z, dt, entities, reach, site.id)
    return
  }
  if (isComplete(site)) {
    e.order = idleOrder()
    return
  }
  const duration = buildDuration(site.kind)
  site.buildProgress = Math.min(1, site.buildProgress + dt / duration)
  site.hp = Math.min(site.maxHp, site.hp + (site.maxHp * dt) / duration)
  if (isComplete(site)) markHud()
}

function tickTraining(b: Entity, dt: number): void {
  if (!isComplete(b) || b.dying || b.trainQueue.length === 0) return
  const job = b.trainQueue[0]
  job.remaining -= dt
  if (job.remaining > 0) return
  b.trainQueue.shift()
  spawnUnit(job.kind, b.team, b)
  playSound('spawn')
}

function tickFarm(e: Entity, dt: number): void {
  if (!isComplete(e) || e.dying) return
  e.amount = Math.min(FARM_FOOD, e.amount + FARM_REGEN * dt)
}

function tickTower(e: Entity, entities: Entity[], all: Record<string, Entity>, dt: number): void {
  if (!isComplete(e) || e.dying) return
  e.attackTimer -= dt
  const foe = nearest(
    e,
    entities,
    (o) => enemiesOf(e.team, o) && dist(e.x, e.z, o.x, o.z) <= (e.attackRange || TOWER_RANGE),
  )
  if (!foe) return
  fireAt(e, foe, all, true)
}

function splashHit(
  at: Entity,
  shooterTeam: Team,
  all: Record<string, Entity>,
  radius: number,
  amount: number,
): void {
  for (const o of Object.values(all)) {
    if (o.dying || o.kind === 'projectile') continue
    if (o.team === shooterTeam || o.team === 'neutral') continue
    if (!isUnit(o) && !isBuilding(o)) continue
    if (dist(at.x, at.z, o.x, o.z) <= radius + o.radius) applyDamage(o, amount)
  }
}

function tickProjectile(e: Entity, all: Record<string, Entity>, dt: number): void {
  const t = e.targetId ? all[e.targetId] : null
  if (!t || t.dying) {
    startDeath(e)
    return
  }
  const ty = e.splash > 0 ? 1.4 : 1.05
  const dx = t.x - e.x
  const dy = ty - e.y
  const dz = t.z - e.z
  const d = Math.hypot(dx, dy, dz) || 0.0001
  const step = (e.projectileSpeed || PROJECTILE_SPEED) * dt
  if (d < step + 0.4) {
    if (e.splash > 0) splashHit(t, e.team, all, e.splash, e.damage)
    else applyDamage(t, e.damage)
    startDeath(e)
    return
  }
  e.x += (dx / d) * step
  e.y += (dy / d) * step
  e.z += (dz / d) * step
}

function raidTarget(entities: Entity[]): Entity | null {
  const tc = entities.find(
    (e) => e.kind === 'townCenter' && e.team === 'player' && !e.dying,
  )
  if (tc) return tc
  return entities.find((e) => e.team === 'player' && (isUnit(e) || isBuilding(e)) && !e.dying) ?? null
}

function sendRaid(units: Entity[], target: Entity | null, limit: number): void {
  if (!target) return
  let sent = 0
  for (const u of units) {
    if (sent >= limit) break
    if (u.order.type === 'attack' && u.order.targetId === target.id) {
      sent += 1
      continue
    }
    u.order = { type: 'attack', x: target.x, z: target.z, targetId: target.id }
    sent += 1
  }
}

function assignEnemyGather(entities: Entity[]): void {
  const idle = entities.filter(
    (e) => e.kind === 'villager' && e.team === 'enemy' && !e.dying && e.order.type === 'idle',
  )
  for (const v of idle) {
    const node = nearest(
      v,
      entities,
      (o) =>
        !o.dying &&
        o.amount > 10 &&
        (o.kind === 'tree' || o.kind === 'berryBush' || o.kind === 'goldMine'),
    )
    if (node) {
      v.order = { type: 'gather', x: node.x, z: node.z, targetId: node.id }
    }
  }
}

function defendEnemyBase(entities: Entity[]): void {
  const tc = entities.find((e) => e.kind === 'townCenter' && e.team === 'enemy' && !e.dying)
  if (!tc) return
  const threat = nearest(
    tc,
    entities,
    (o) =>
      o.team === 'player' &&
      !o.dying &&
      (isUnit(o) || isBuilding(o)) &&
      dist(tc.x, tc.z, o.x, o.z) <= AI_DEFEND_RANGE,
  )
  if (!threat) return
  for (const u of entities) {
    if (u.team !== 'enemy' || !isMilitary(u) || u.dying) continue
    if (dist(u.x, u.z, tc.x, tc.z) > 26) continue
    u.order = { type: 'attack', x: threat.x, z: threat.z, targetId: threat.id }
  }
}

function rebuildEnemyBarracks(entities: Entity[]): void {
  const live = entities.find(
    (e) => e.kind === 'barracks' && e.team === 'enemy' && !e.dying,
  )
  if (live) return
  if (!spend(COSTS.barracks, 'enemy')) return
  const spots = [
    { x: ENEMY_BASE.x - 5.5, z: ENEMY_BASE.z + 1.2 },
    { x: ENEMY_BASE.x - 6.5, z: ENEMY_BASE.z - 2.2 },
    { x: ENEMY_BASE.x + 1.5, z: ENEMY_BASE.z - 5.5 },
  ]
  for (const spot of spots) {
    if (!isPlacementValid(spot.x, spot.z, 'barracks')) continue
    const s = useGameStore.getState()
    const id = allocId()
    s.entities[id] = createBuilding(id, 'barracks', 'enemy', spot.x, spot.z, true)
    s.worldEpoch += 1
    markHud()
    return
  }
}

function tickAi(dt: number): void {
  const s = useGameStore.getState()
  s.gameTime += dt
  s.aiTimer += dt
  if (s.aiTimer < AI_INTERVAL) return
  s.aiTimer = 0

  s.enemyWood += 12
  s.enemyFood += 20
  s.enemyGold += 10
  markHud()

  const entities = list(s.entities)
  assignEnemyGather(entities)
  defendEnemyBase(entities)
  rebuildEnemyBarracks(entities)

  if (s.gameTime < AI_SPAWN_DELAY) return

  const barracks = list(s.entities).find(
    (e) => e.kind === 'barracks' && e.team === 'enemy' && !e.dying && isComplete(e),
  )
  const military = list(s.entities).filter((e) => e.team === 'enemy' && isMilitary(e) && !e.dying)
  const prey = raidTarget(list(s.entities))

  let armyCap = AI_FIRST_WAVE_SIZE
  if (s.waveIndex >= 1) armyCap = AI_WAVE2_SIZE
  if (s.waveIndex >= 2) armyCap = AI_WAVE3_SIZE
  if (s.waveIndex >= 3 && s.gameTime >= s.waveStartTime + AI_REINFORCE_DELAY) armyCap = 8

  if (barracks && military.length < armyCap) {
    const kind =
      s.gameTime >= AI_ENEMY_FEUDAL_TIME && military.length % 3 === 2 ? 'archer' : 'swordsman'
    const cost = COSTS[kind]
    if (spend(cost, 'enemy')) {
      const spawned = spawnUnit(kind, 'enemy', barracks)
      if (s.waveIndex >= 3 && prey) {
        spawned.order = { type: 'attack', x: prey.x, z: prey.z, targetId: prey.id }
      }
    }
  }

  const liveMil = list(s.entities).filter((e) => e.team === 'enemy' && isMilitary(e) && !e.dying)
  const target = raidTarget(list(s.entities))

  if (s.waveIndex === 0 && s.gameTime >= AI_WAVE_DELAY && liveMil.length >= AI_FIRST_WAVE_SIZE) {
    s.waveStarted = true
    s.waveIndex = 1
    s.waveStartTime = s.gameTime
    markHud()
    sendRaid(liveMil, target, AI_FIRST_WAVE_SIZE)
    return
  }

  if (s.waveIndex === 1 && s.gameTime >= s.waveStartTime + AI_WAVE2_DELAY && liveMil.length >= 1) {
    s.waveIndex = 2
    markHud()
    sendRaid(liveMil, target, AI_WAVE2_SIZE)
    return
  }

  if (s.waveIndex === 2 && s.gameTime >= s.waveStartTime + AI_WAVE3_DELAY && liveMil.length >= 1) {
    s.waveIndex = 3
    markHud()
    sendRaid(liveMil, target, AI_WAVE3_SIZE)
  }
}

function checkWinner(): void {
  const s = useGameStore.getState()
  if (s.winner) return
  const ents = list(s.entities)
  const playerTc = ents.some(
    (e) => e.kind === 'townCenter' && e.team === 'player' && !e.dying,
  )
  const enemyTc = ents.some(
    (e) => e.kind === 'townCenter' && e.team === 'enemy' && !e.dying,
  )
  if (!playerTc) {
    s.winner = 'enemy'
    playSound('defeat')
    markHud()
  } else if (!enemyTc) {
    s.winner = 'player'
    playSound('fanfare')
    markHud()
  }
}

export function tick(dt: number): void {
  const s = useGameStore.getState()
  if (s.winner || s.helpOpen) return

  const all = s.entities
  const entities = list(all)
  const toRemove: string[] = []

  for (const e of entities) {
    if (e.dying) {
      e.deathTimer -= dt
      if (!isUnit(e)) e.scale = Math.max(0.01, e.deathTimer / DEATH_DURATION)
      if (e.deathTimer <= 0) toRemove.push(e.id)
      continue
    }

    if (e.kind === 'projectile') {
      tickProjectile(e, all, dt)
      continue
    }

    if (isBuilding(e)) {
      tickTraining(e, dt)
      if (e.kind === 'farm') tickFarm(e, dt)
      if (e.kind === 'watchTower') tickTower(e, entities, all, dt)
      continue
    }

    if (!isUnit(e)) continue

    switch (e.order.type) {
      case 'move':
        if (moveTowards(e, e.order.x, e.order.z, dt, entities, 0.35)) {
          e.order = idleOrder()
        }
        break
      case 'gather':
        tickGather(e, entities, all, dt)
        break
      case 'return':
        tickReturn(e, entities, all, dt)
        break
      case 'build':
        tickBuild(e, entities, all, dt)
        break
      case 'attack':
        tickCombat(e, entities, all, dt)
        break
      case 'attackMove':
        tickAttackMove(e, entities, all, dt)
        break
      default:
        if (e.team === 'enemy' && isMilitary(e) && e.hp >= e.maxHp) break
        autoAcquire(e, entities)
        break
    }
  }

  for (const id of toRemove) {
    s.selectedIds = s.selectedIds.filter((x) => x !== id)
    if (s.selectedId === id) s.selectedId = s.selectedIds[0] ?? null
    delete all[id]
    markHud()
  }

  tickAi(dt)
  if (s.aging) {
    s.ageTimer -= dt
    if (s.ageTimer <= 0) {
      s.aging = false
      s.playerAge = 1
      playSound('age')
      markHud()
    }
  }
  tickFog(list(s.entities))
  checkWinner()
}

if (import.meta.env.DEV) {
  ;(globalThis as unknown as { __aoeTick: typeof tick }).__aoeTick = tick
}
