// Resolves one action (attack / skill / item / defend) on a draft battle state and pushes the
// events. Mutates the draft it gets; the public API in battle.js clones before calling in.
// Turn bookkeeping (end of turn, wave and end checks) is done by the caller.
import { ENEMY_DAMAGE_MULT, FOCUS, RAGE, SELF_DAMAGE_MIN_HP, TIMING_MULT } from '../../config/balance';
import {
  ACTION,
  DAMAGE_KIND,
  DEFEND_STATUS,
  EVENT,
  RANDOM_TARGET_HITS,
  SIDE,
  SKILL_TYPE,
  TARGET,
  TIMING,
} from '../../config/constants';
import { getEnemy, getItem, getSkill, getStatus } from '../../data';
import { computeDamage, computeHeal } from './damage';
import { mergeLoot, rollLoot } from './loot';
import { absorbDamage, applyStatus, effectiveStat, removeNegative } from './statuses';
import { alliesOf, findUnit, isAlive, living, opponentsOf } from './units';

const isHero = (unit) => unit.side === SIDE.HERO;
const clamp = (value, min, max) => Math.min(Math.max(value, min), max);

function gainFocus(unit, amount) {
  if (isHero(unit)) unit.focus = clamp(unit.focus + amount, 0, FOCUS.MAX);
}

function gainRage(unit, amount) {
  if (isHero(unit)) unit.rage = clamp(unit.rage + amount, 0, RAGE.MAX);
}

function kill(draft, unit, rng, events) {
  unit.statuses = [];
  events.push({ type: EVENT.DEATH, unitId: unit.id });
  if (isHero(unit)) {
    unit.rage = 0;
    draft.heroDowned = true;
    return;
  }
  const enemy = getEnemy(unit.defId);
  draft.earned.xp += enemy.xp;
  draft.earned.coins += enemy.coins;
  draft.earned.loot = mergeLoot(draft.earned.loot, rollLoot(enemy.loot, rng));
}

// Boss script: moves to the next phase when HP falls to its threshold (e.g. 50%).
function updateBossPhase(unit, events) {
  const phases = isHero(unit) ? null : getEnemy(unit.defId).script?.phases;
  if (!phases) return;
  let next = phases[unit.bossPhase + 1];
  while (next && unit.hp / unit.stats.maxHp <= next.atHpPct) {
    unit.bossPhase += 1;
    unit.rotation = 0;
    events.push({ type: EVENT.BOSS_PHASE, unitId: unit.id, phase: unit.bossPhase });
    next = phases[unit.bossPhase + 1];
  }
}

// Lowers HP (shields soak first when `shielded`), emits the events and handles death.
export function inflict(draft, target, amount, { sourceId = null, kind, crit = false, shielded = true }, rng, events) {
  const { absorbed, broken } = shielded ? absorbDamage(target, amount) : { absorbed: 0, broken: [] };
  const taken = amount - absorbed;
  target.hp = Math.max(0, target.hp - taken);
  events.push({ type: EVENT.DAMAGE, sourceId, targetId: target.id, amount: taken, absorbed, crit, kind, hp: target.hp });
  for (const status of broken) events.push({ type: EVENT.STATUS_END, targetId: target.id, status });
  if (target.hp === 0) kill(draft, target, rng, events);
  else updateBossPhase(target, events);
}

function heal(target, amount, sourceId, events) {
  const healed = Math.min(amount, target.stats.maxHp - target.hp);
  target.hp += healed;
  events.push({ type: EVENT.HEAL, sourceId, targetId: target.id, amount: healed, hp: target.hp });
}

function addStatus(target, effect, actor, events) {
  const value = effect.power ? Math.round(effectiveStat(actor, effect.power.stat) * effect.power.mult) : undefined;
  applyStatus(target, effect.status, { turns: effect.duration, value, ownTurn: target.id === actor.id });
  const turns = effect.duration ?? getStatus(effect.status).duration;
  events.push({ type: EVENT.STATUS, targetId: target.id, status: effect.status, turns, ...(value !== undefined && { value }) });
}

// Damage part of a physical/magic skill. Returns the opponents that were hit.
function strikeTargets(draft, actor, skill, targetId, bonusMult, rng, events) {
  const hit = new Map();
  const sideMult = isHero(actor) ? 1 : ENEMY_DAMAGE_MULT;
  const strike = (target) => {
    const { amount, crit } = computeDamage({
      attacker: actor,
      defender: target,
      type: skill.type,
      mult: skill.mult,
      rng,
      bonusMult: bonusMult * sideMult,
      critBonus: skill.critBonus ?? 0,
    });
    inflict(draft, target, amount, { sourceId: actor.id, kind: skill.type, crit }, rng, events);
    hit.set(target.id, target);
  };
  const hits = skill.hits ?? 1;

  if (skill.target === TARGET.ENEMY_RANDOM_X3) {
    for (let i = 0; i < RANDOM_TARGET_HITS; i += 1) {
      const pool = living(opponentsOf(draft, actor));
      if (pool.length === 0) break;
      strike(rng.pick(pool));
    }
  } else if (skill.target === TARGET.ENEMY_ALL) {
    for (let i = 0; i < hits; i += 1) living(opponentsOf(draft, actor)).forEach(strike);
  } else {
    const target = findUnit(draft, targetId);
    for (let i = 0; i < hits && isAlive(target); i += 1) strike(target);
  }
  return [...hit.values()];
}

function friendlyTargets(draft, actor, target, targetId) {
  if (target === TARGET.SELF) return [actor];
  if (target === TARGET.ALLY_ALL) return living(alliesOf(draft, actor));
  return [findUnit(draft, targetId)];
}

export function resolveSkill(draft, actor, skill, { targetId = null, bonusMult = 1 }, rng, events) {
  const damaging = skill.type === SKILL_TYPE.PHYSICAL || skill.type === SKILL_TYPE.MAGIC;
  const targets = damaging
    ? strikeTargets(draft, actor, skill, targetId, bonusMult, rng, events)
    : friendlyTargets(draft, actor, skill.target, targetId);

  for (const target of targets) {
    if (!isAlive(target)) continue;
    if (skill.type === SKILL_TYPE.HEAL) heal(target, computeHeal(actor, skill.mult), actor.id, events);
    if (skill.cleanse) {
      for (const status of removeNegative(target)) events.push({ type: EVENT.STATUS_END, targetId: target.id, status });
    }
    for (const effect of skill.effects) {
      if (effect.chance === undefined || rng.chance(effect.chance)) addStatus(target, effect, actor, events);
    }
  }

  // Focus and Rage: +1 Focus / +15 Rage per hero hit, +10 Rage for dealing damage (once per action).
  if (damaging && targets.length) {
    gainRage(actor, RAGE.ON_DEAL);
    for (const target of targets.filter(isAlive)) {
      gainFocus(target, FOCUS.ON_HIT);
      gainRage(target, RAGE.ON_HIT);
    }
  }

  // Self-damage (Bomb) hurts, but never takes the hero below SELF_DAMAGE_MIN_HP.
  if (skill.selfDamagePct && isAlive(actor)) {
    const amount = Math.min(Math.round(actor.stats.maxHp * skill.selfDamagePct), actor.hp - SELF_DAMAGE_MIN_HP);
    if (amount > 0) inflict(draft, actor, amount, { sourceId: actor.id, kind: DAMAGE_KIND.SELF, shielded: false }, rng, events);
  }

  if (skill.isUltimate) actor.rage = 0;
}

function applyItem(draft, actor, { itemId, targetId }, events) {
  const { effect } = getItem(itemId);
  const target = findUnit(draft, targetId);
  draft.items[itemId] -= 1;
  if (effect.revivePctMaxHp) {
    target.hp = Math.max(1, Math.round(target.stats.maxHp * effect.revivePctMaxHp));
    target.acted = true; // back next round
    events.push({ type: EVENT.REVIVE, unitId: target.id, hp: target.hp });
  }
  if (effect.healPctMaxHp) heal(target, Math.round(target.stats.maxHp * effect.healPctMaxHp), actor.id, events);
  if (effect.focus) gainFocus(target, effect.focus);
  if (effect.rage) gainRage(target, effect.rage);
}

// Pays the action's cost and resolves it. Cooldowns get +1 because the turn that used the
// skill also ticks them down at its end.
export function performAction(draft, actor, action, rng, events) {
  const base = { type: EVENT.ACTION, actorId: actor.id, action: action.type, targetId: action.targetId ?? null };

  switch (action.type) {
    case ACTION.ATTACK: {
      const skill = getSkill(actor.attack);
      events.push({ ...base, skillId: skill.id });
      const bonusMult = isHero(actor) ? TIMING_MULT[action.timing ?? TIMING.GOOD] : 1;
      resolveSkill(draft, actor, skill, { targetId: action.targetId, bonusMult }, rng, events);
      return;
    }
    case ACTION.SKILL: {
      const skill = getSkill(action.skillId);
      events.push({ ...base, skillId: skill.id });
      if (isHero(actor)) actor.focus -= skill.focusCost;
      if (skill.cooldown > 0) actor.cooldowns[skill.id] = skill.cooldown + 1;
      resolveSkill(draft, actor, skill, { targetId: action.targetId }, rng, events);
      return;
    }
    case ACTION.ITEM:
      events.push({ ...base, itemId: action.itemId });
      applyItem(draft, actor, action, events);
      return;
    case ACTION.DEFEND: {
      events.push(base);
      applyStatus(actor, DEFEND_STATUS, { ownTurn: true });
      events.push({ type: EVENT.STATUS, targetId: actor.id, status: DEFEND_STATUS, turns: getStatus(DEFEND_STATUS).duration });
      gainFocus(actor, FOCUS.ON_DEFEND);
      return;
    }
    default:
      throw new Error(`Unknown action type "${action.type}"`);
  }
}
