// Damage and healing formulas (PLAN 1.5). Pure: the RNG is passed in.
import { DAMAGE } from '../../config/balance';
import { SKILL_TYPE } from '../../config/constants';
import { effectiveStat } from './statuses';

const ATTACK_STAT = { [SKILL_TYPE.PHYSICAL]: 'atk', [SKILL_TYPE.MAGIC]: 'mag' };
const DEFENSE_STAT = { [SKILL_TYPE.PHYSICAL]: 'def', [SKILL_TYPE.MAGIC]: 'res' };

// Share of damage that gets through `defense`: 100 / (100 + def).
export const mitigation = (defense) => DAMAGE.DEF_SCALE / (DAMAGE.DEF_SCALE + Math.max(0, defense));

// Rolls one hit from raw numbers. Variance is always rolled before crit, so replays match.
export function rollDamage({ attack, defense, mult, critChance, critMult, rng, bonusMult = 1 }) {
  const variance = rng.range(DAMAGE.VARIANCE_MIN, DAMAGE.VARIANCE_MAX);
  const crit = rng.chance(critChance);
  const value = attack * mult * bonusMult * mitigation(defense) * variance * (crit ? critMult : 1);
  return { amount: Math.max(DAMAGE.MIN, Math.round(value)), crit };
}

// One hit of a physical or magic skill, using both units' current (status-modified) stats.
export function computeDamage({ attacker, defender, type, mult, rng, bonusMult = 1, critBonus = 0 }) {
  return rollDamage({
    attack: effectiveStat(attacker, ATTACK_STAT[type]),
    defense: effectiveStat(defender, DEFENSE_STAT[type]),
    mult,
    critChance: attacker.stats.critChance + critBonus,
    critMult: attacker.stats.critMult,
    rng,
    bonusMult,
  });
}

// Healing: mag * mult, no variance. The caller caps it at the target's missing HP.
export const computeHeal = (caster, mult) => Math.max(0, Math.round(effectiveStat(caster, 'mag') * mult));
