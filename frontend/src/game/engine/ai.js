// Enemy AI (PLAN 1.4). Returns an action in the same shape the player sends.
// Profiles: aggressive (lowest HP), random, focusHealer (Menders first), bossScript (rotation
// per boss phase). Taunt always wins for single-target picks (see units.singleTargets).
import { AI_HEAL_BELOW } from '../../config/balance';
import { ACTION, AI_PROFILE, HERO_CLASS, SCRIPT_BASIC_ATTACK, SKILL_TYPE, TARGET } from '../../config/constants';
import { getEnemy, getSkill } from '../../data';
import { findStatus } from './statuses';
import { alliesOf, living, singleTargets } from './units';

const hpShare = (unit) => unit.hp / unit.stats.maxHp;
const lowestHp = (units) => [...units].sort((a, b) => a.hp - b.hp || a.slot - b.slot)[0];
const lowestHpShare = (units) => [...units].sort((a, b) => hpShare(a) - hpShare(b) || a.slot - b.slot)[0];

function pickOpponent(state, unit, rng) {
  const candidates = singleTargets(state, unit);
  if (unit.ai === AI_PROFILE.RANDOM) return rng.pick(candidates);
  if (unit.ai === AI_PROFILE.FOCUS_HEALER) {
    const healers = candidates.filter((hero) => hero.heroClass === HERO_CLASS.MENDER);
    return lowestHp(healers.length ? healers : candidates);
  }
  return lowestHp(candidates);
}

function targetFor(state, unit, skill, rng) {
  if (skill.target === TARGET.ENEMY_SINGLE) return pickOpponent(state, unit, rng).id;
  if (skill.target === TARGET.ALLY_SINGLE) return lowestHpShare(living(alliesOf(state, unit))).id;
  return null;
}

// Heals need a hurt ally; buffs need an ally (or self) that lacks one of the statuses.
function worthUsing(state, unit, skill) {
  if (unit.cooldowns[skill.id]) return false;
  const allies = skill.target === TARGET.SELF ? [unit] : living(alliesOf(state, unit));
  if (skill.type === SKILL_TYPE.HEAL) return allies.some((ally) => hpShare(ally) < AI_HEAL_BELOW);
  if (skill.type === SKILL_TYPE.SUPPORT) {
    return allies.some((ally) => skill.effects.some((effect) => !findStatus(ally, effect.status)));
  }
  return true;
}

function toAction(state, unit, skillId, rng) {
  const isBasic = skillId === unit.attack;
  const targetId = targetFor(state, unit, getSkill(skillId), rng);
  const action = isBasic
    ? { type: ACTION.ATTACK, actorId: unit.id }
    : { type: ACTION.SKILL, actorId: unit.id, skillId };
  return targetId === null ? action : { ...action, targetId };
}

// Boss: next entry of the current phase's rotation. Advances the rotation on the unit,
// so only call this on a draft state.
function scriptedAction(state, unit, rng) {
  const { rotation } = getEnemy(unit.defId).script.phases[unit.bossPhase];
  const entry = rotation[unit.rotation % rotation.length];
  unit.rotation += 1;
  const useBasic = entry === SCRIPT_BASIC_ATTACK || unit.cooldowns[entry];
  return toAction(state, unit, useBasic ? unit.attack : entry, rng);
}

export function chooseEnemyAction(state, unit, rng) {
  if (unit.ai === AI_PROFILE.BOSS_SCRIPT && getEnemy(unit.defId).script) return scriptedAction(state, unit, rng);
  const skillId = unit.skills.find((id) => worthUsing(state, unit, getSkill(id)));
  return toAction(state, unit, skillId ?? unit.attack, rng);
}
