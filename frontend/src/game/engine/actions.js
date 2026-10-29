// Player side of the engine: which actions a hero may take, and applying one. Pure.
import { RAGE, TIMING_MULT } from '../../config/balance';
import { ACTION, BATTLE_PHASE, SIDE } from '../../config/constants';
import { getItem, getSkill } from '../../data';
import { BattleError } from './errors';
import { endTurn, settle } from './flow';
import { performAction } from './resolve';
import { createRng } from './rng';
import { hasFlag } from './statuses';
import { findUnit, isAlive, targetChoices } from './units';

export function canUseSkill(unit, skill) {
  if ((unit.cooldowns[skill.id] ?? 0) > 0) return false;
  if (skill.isUltimate) return unit.rage >= RAGE.MAX;
  return unit.focus >= skill.focusCost;
}

const canAct = (unit) =>
  unit?.side === SIDE.HERO && isAlive(unit) && !unit.acted && !hasFlag(unit, 'skipsTurn');

// Heroes that still have to act in this player phase.
export const getReadyHeroIds = (state) =>
  state.phase === BATTLE_PHASE.PLAYER_TURN ? state.heroes.filter(canAct).map((hero) => hero.id) : [];

const withTarget = (action, targetId) => (targetId === null ? action : { ...action, targetId });

// Every concrete action the hero may take now, one entry per possible target.
export function getLegalActions(state, actorId) {
  const actor = findUnit(state, actorId);
  if (state.phase !== BATTLE_PHASE.PLAYER_TURN || !canAct(actor)) return [];

  const actions = [];
  for (const targetId of targetChoices(state, actor, getSkill(actor.attack).target)) {
    actions.push(withTarget({ type: ACTION.ATTACK, actorId }, targetId));
  }
  for (const skillId of actor.skills) {
    const skill = getSkill(skillId);
    if (!canUseSkill(actor, skill)) continue;
    for (const targetId of targetChoices(state, actor, skill.target)) {
      actions.push(withTarget({ type: ACTION.SKILL, actorId, skillId }, targetId));
    }
  }
  for (const [itemId, count] of Object.entries(state.items)) {
    if (count <= 0) continue;
    for (const targetId of targetChoices(state, actor, getItem(itemId).target)) {
      actions.push(withTarget({ type: ACTION.ITEM, actorId, itemId }, targetId));
    }
  }
  actions.push({ type: ACTION.DEFEND, actorId });
  return actions;
}

const ACTION_KEYS = ['type', 'actorId', 'skillId', 'itemId', 'targetId'];
const sameAction = (a, b) => ACTION_KEYS.every((key) => (a[key] ?? null) === (b[key] ?? null));

// Applies a hero action: { type, actorId, skillId?, itemId?, targetId?, timing? }.
// Returns { state, events } and never changes the state it was given.
export function applyAction(state, action) {
  if (state.phase !== BATTLE_PHASE.PLAYER_TURN) throw new BattleError(`Cannot act during ${state.phase}`);
  if (action.timing !== undefined && !Object.hasOwn(TIMING_MULT, action.timing)) {
    throw new BattleError(`Unknown timing "${action.timing}"`);
  }
  if (!getLegalActions(state, action.actorId).some((legal) => sameAction(legal, action))) {
    throw new BattleError(`Illegal action ${JSON.stringify(action)}`);
  }

  const draft = structuredClone(state);
  const rng = createRng(draft.rng);
  const events = [];
  const actor = findUnit(draft, action.actorId);
  performAction(draft, actor, action, rng, events);
  actor.acted = true;
  endTurn(draft, actor, rng, events);
  settle(draft, rng, events);
  draft.rng = rng.state();
  return { state: draft, events };
}
