// Battle units built from data, plus side / target queries. Units are plain objects.
import { CRIT_DEFAULTS, ENEMY_HP_MULT, ENEMY_SCALING_PER_STAGE, FOCUS, LEVEL_CAP } from '../../config/balance';
import { SIDE, TARGET } from '../../config/constants';
import { getEnemy, getHero, getSkill } from '../../data';
import { BattleError } from './errors';
import { hasFlag } from './statuses';

const STATS = ['atk', 'mag', 'def', 'res', 'spd'];

const clampLevel = (level) => Math.min(Math.max(Math.trunc(level) || 1, 1), LEVEL_CAP);

// stat(level) = base + growth * (level - 1), plus flat bonuses (gear, Phase 4).
export function heroStats(hero, level, bonus = {}) {
  const at = (key) => hero.base[key] + (hero.growth[key] ?? 0) * (level - 1) + (bonus[key] ?? 0);
  const stats = { maxHp: Math.round(at('hp')) };
  for (const key of STATS) stats[key] = at(key);
  stats.critChance = (hero.base.critChance ?? CRIT_DEFAULTS.critChance) + (bonus.critChance ?? 0);
  stats.critMult = (hero.base.critMult ?? CRIT_DEFAULTS.critMult) + (bonus.critMult ?? 0);
  return stats;
}

// Enemy stats scale with the campaign stage: statMult = 1 + 0.12 * stageIndex. Max HP also
// gets the global ENEMY_HP_MULT.
export function enemyStats(enemy, stageIndex) {
  const mult = 1 + ENEMY_SCALING_PER_STAGE * stageIndex;
  const stats = { maxHp: Math.round(enemy.stats.hp * mult * ENEMY_HP_MULT) };
  for (const key of STATS) stats[key] = enemy.stats[key] * mult;
  stats.critChance = enemy.stats.critChance ?? CRIT_DEFAULTS.critChance;
  stats.critMult = enemy.stats.critMult ?? CRIT_DEFAULTS.critMult;
  return stats;
}

export function createHeroUnit({ hero: heroId, level = 1, bonus }, slot) {
  const hero = getHero(heroId);
  if (!hero) throw new BattleError(`Unknown hero "${heroId}"`);
  const heroLevel = clampLevel(level);
  const stats = heroStats(hero, heroLevel, bonus);
  return {
    id: `h${slot}`,
    side: SIDE.HERO,
    defId: hero.id,
    name: hero.name,
    heroClass: hero.class,
    level: heroLevel,
    slot,
    stats,
    hp: stats.maxHp,
    focus: FOCUS.START,
    rage: 0,
    statuses: [],
    cooldowns: {},
    attack: hero.attack,
    skills: hero.skills.filter((id) => getSkill(id).unlockLevel <= heroLevel),
    acted: false,
  };
}

export function createEnemyUnit(enemyId, slot, waveIndex, stageIndex) {
  const enemy = getEnemy(enemyId);
  if (!enemy) throw new BattleError(`Unknown enemy "${enemyId}"`);
  const stats = enemyStats(enemy, stageIndex);
  return {
    id: `w${waveIndex}e${slot}`,
    side: SIDE.ENEMY,
    defId: enemy.id,
    name: enemy.name,
    tier: enemy.tier,
    ai: enemy.ai,
    slot,
    stats,
    hp: stats.maxHp,
    statuses: [],
    cooldowns: {},
    attack: enemy.attack,
    skills: [...enemy.skills],
    bossPhase: 0,
    rotation: 0,
  };
}

export const isAlive = (unit) => unit.hp > 0;
export const living = (units) => units.filter(isAlive);
export const allUnits = (state) => [...state.heroes, ...state.enemies];
export const findUnit = (state, id) => allUnits(state).find((unit) => unit.id === id);
export const alliesOf = (state, unit) => (unit.side === SIDE.HERO ? state.heroes : state.enemies);
export const opponentsOf = (state, unit) => (unit.side === SIDE.HERO ? state.enemies : state.heroes);

// Single-target attacks must pick a taunting opponent when there is one.
export function singleTargets(state, actor) {
  const candidates = living(opponentsOf(state, actor));
  const taunting = candidates.filter((unit) => hasFlag(unit, 'taunt'));
  return taunting.length ? taunting : candidates;
}

// Ids the actor may choose for a target type; [null] when the target is implied (all/self/random).
export function targetChoices(state, actor, target) {
  switch (target) {
    case TARGET.ENEMY_SINGLE:
      return singleTargets(state, actor).map((unit) => unit.id);
    case TARGET.ALLY_SINGLE:
      return living(alliesOf(state, actor)).map((unit) => unit.id);
    case TARGET.ALLY_DEAD:
      return alliesOf(state, actor).filter((unit) => !isAlive(unit)).map((unit) => unit.id);
    default:
      return [null];
  }
}
