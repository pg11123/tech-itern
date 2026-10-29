// Battle engine API (PLAN 1.5.1). Pure: each call returns a new state plus the events the
// renderer plays in order; the state passed in is never changed.
//
//   createBattle(config, seed) -> state
//   getLegalActions(state, heroId) -> [action]
//   applyAction(state, action) -> { state, events }   (player phase)
//   runEnemyPhase(state) -> { state, events }          (enemy phase)
import { MAX_PARTY_SIZE, MAX_WAVE_ENEMIES } from '../../config/balance';
import { BATTLE_PHASE, EVENT, ITEM_TYPE } from '../../config/constants';
import { getEnemy, getItem, getStage } from '../../data';
import { chooseEnemyAction } from './ai';
import { BattleError } from './errors';
import { endTurn, settle, spawnWave, startRound } from './flow';
import { performAction } from './resolve';
import { createRng } from './rng';
import { findFlag } from './statuses';
import { createHeroUnit, findUnit, isAlive, living } from './units';

export { applyAction, canUseSkill, getLegalActions, getReadyHeroIds } from './actions';

function validateConfig({ party, waves, roundLimit, items = {} }) {
  if (!Array.isArray(party) || party.length === 0 || party.length > MAX_PARTY_SIZE) {
    throw new BattleError(`A party needs 1-${MAX_PARTY_SIZE} heroes`);
  }
  if (new Set(party.map((member) => member.hero)).size !== party.length) {
    throw new BattleError('A hero can join the party only once');
  }
  if (!Array.isArray(waves) || waves.length === 0) throw new BattleError('A battle needs at least one wave');
  for (const wave of waves) {
    if (!wave.enemies?.length || wave.enemies.length > MAX_WAVE_ENEMIES) {
      throw new BattleError(`A wave needs 1-${MAX_WAVE_ENEMIES} enemies`);
    }
    const unknown = wave.enemies.find((id) => !getEnemy(id));
    if (unknown) throw new BattleError(`Unknown enemy "${unknown}"`);
  }
  if (!(roundLimit > 0)) throw new BattleError('roundLimit must be positive');
  for (const [id, count] of Object.entries(items)) {
    if (getItem(id)?.type !== ITEM_TYPE.CONSUMABLE) throw new BattleError(`"${id}" is not a consumable`);
    if (!Number.isInteger(count) || count < 0) throw new BattleError(`Bad count for item "${id}"`);
  }
}

// config: {
//   party: [{ hero, level, bonus? }],   waves: [{ enemies: [enemyId] }],   roundLimit,
//   stageId?, stageIndex? (enemy scaling), rewards? { xp, coins, firstClearGems }, items? { itemId: count }
// }
export function createBattle(config, seed) {
  validateConfig(config);
  const state = {
    seed: seed >>> 0,
    rng: seed >>> 0,
    stageId: config.stageId ?? null,
    stageIndex: config.stageIndex ?? 0,
    roundLimit: config.roundLimit,
    phase: BATTLE_PHASE.PLAYER_TURN,
    round: 1,
    waveIndex: 0,
    waves: config.waves.map((wave) => ({ enemies: [...wave.enemies] })),
    heroes: config.party.map((member, slot) => createHeroUnit(member, slot)),
    enemies: [],
    items: { ...config.items },
    stageRewards: { ...config.rewards },
    earned: { xp: 0, coins: 0, loot: [] },
    heroDowned: false,
    result: null,
  };
  const rng = createRng(state.rng);
  spawnWave(state, 0, []);
  startRound(state, rng, [], { first: true });
  state.rng = rng.state();
  return state;
}

// A battle for a stage from stages.json. `party` defaults to the stage's fixedParty and `items`
// to the stage's own kit; enemy scaling uses the stage's `stageIndex` when it has one.
export function createStageBattle(stageId, seed, { party, stageIndex, items } = {}) {
  const stage = getStage(stageId);
  if (!stage) throw new BattleError(`Unknown stage "${stageId}"`);
  return createBattle(
    {
      stageId,
      stageIndex: stageIndex ?? stage.stageIndex ?? 0,
      roundLimit: stage.roundLimit,
      waves: stage.waves,
      rewards: stage.rewards,
      party: party ?? stage.fixedParty ?? [],
      items: items ?? stage.items,
    },
    seed,
  );
}

export const isBattleOver = (state) =>
  state.phase === BATTLE_PHASE.VICTORY || state.phase === BATTLE_PHASE.DEFEAT;

// Every living enemy acts once, fastest first (ties: slot order), then the next round starts.
export function runEnemyPhase(state) {
  if (state.phase !== BATTLE_PHASE.ENEMY_TURN) throw new BattleError(`No enemy phase during ${state.phase}`);
  const draft = structuredClone(state);
  const rng = createRng(draft.rng);
  const events = [];
  const order = living(draft.enemies)
    .sort((a, b) => b.stats.spd - a.stats.spd || a.slot - b.slot)
    .map((enemy) => enemy.id);

  for (const id of order) {
    const enemy = findUnit(draft, id);
    if (!isAlive(enemy)) continue;
    const skip = findFlag(enemy, 'skipsTurn');
    if (skip) events.push({ type: EVENT.SKIP, unitId: enemy.id, reason: skip.id });
    else performAction(draft, enemy, chooseEnemyAction(draft, enemy, rng), rng, events);
    endTurn(draft, enemy, rng, events);
    if (settle(draft, rng, events)) break;
  }

  if (draft.phase === BATTLE_PHASE.ENEMY_TURN) startRound(draft, rng, events);
  draft.rng = rng.state();
  return { state: draft, events };
}
