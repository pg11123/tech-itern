// Headless random battles (PLAN Phase 2 acceptance): random parties, levels, waves and stage
// scaling; heroes pick random legal actions. Every step is checked for broken numbers and for
// changes to the input state. Seeded, so any failure can be replayed from its seed.
import { FOCUS, LEVEL_CAP, MAX_PARTY_SIZE, MAX_WAVE_ENEMIES, RAGE, ZONE_STAGE_COUNT } from '../../config/balance';
import { BATTLE_PHASE, EVENT, TIMING } from '../../config/constants';
import { ENEMIES, HEROES, ITEMS } from '../../data';
import { applyAction, createBattle, getLegalActions, getReadyHeroIds, isBattleOver, runEnemyPhase } from '../engine/battle';
import { createRng } from '../engine/rng';

export const MAX_SIMULATED_ROUNDS = 200;
const MAX_WAVES = 4;
const MAX_ITEMS_EACH = 2;
const STAGE_COUNT = Object.values(ZONE_STAGE_COUNT).reduce((sum, count) => sum + count, 0);
const TIMINGS = Object.values(TIMING);
const UINT32_MAX = 0xffffffff;

function shuffled(list, rng) {
  const copy = [...list];
  for (let i = copy.length - 1; i > 0; i -= 1) {
    const j = rng.int(0, i);
    [copy[i], copy[j]] = [copy[j], copy[i]];
  }
  return copy;
}

export function randomBattleConfig(rng) {
  return {
    party: shuffled(HEROES, rng)
      .slice(0, rng.int(1, MAX_PARTY_SIZE))
      .map((hero) => ({ hero: hero.id, level: rng.int(1, LEVEL_CAP) })),
    waves: Array.from({ length: rng.int(1, MAX_WAVES) }, () => ({
      enemies: Array.from({ length: rng.int(1, MAX_WAVE_ENEMIES) }, () => rng.pick(ENEMIES).id),
    })),
    stageIndex: rng.int(0, STAGE_COUNT - 1),
    roundLimit: rng.int(3, 12),
    rewards: { xp: rng.int(0, 100), coins: rng.int(0, 100), firstClearGems: rng.int(0, 5) },
    items: Object.fromEntries(ITEMS.map((item) => [item.id, rng.int(0, MAX_ITEMS_EACH)])),
  };
}

const isWhole = (value) => Number.isInteger(value) && value >= 0;

// Throws with a description when the state or events contain impossible numbers.
export function checkInvariants(state, events) {
  const fail = (message) => {
    throw new Error(`Invariant broken (seed ${state.seed}, round ${state.round}): ${message}`);
  };
  if (!isWhole(state.rng) || state.rng > UINT32_MAX) fail(`rng state ${state.rng}`);
  for (const unit of [...state.heroes, ...state.enemies]) {
    for (const [key, value] of Object.entries(unit.stats)) {
      if (!Number.isFinite(value) || value < 0) fail(`${unit.id} stat ${key} = ${value}`);
    }
    if (!isWhole(unit.hp) || unit.hp > unit.stats.maxHp) fail(`${unit.id} hp ${unit.hp}/${unit.stats.maxHp}`);
    if (unit.hp === 0 && unit.statuses.length) fail(`${unit.id} is down but has statuses`);
    for (const status of unit.statuses) if (!(status.turns > 0)) fail(`${unit.id} ${status.id} turns ${status.turns}`);
    for (const [id, turns] of Object.entries(unit.cooldowns)) if (!(turns >= 1)) fail(`${unit.id} cooldown ${id} ${turns}`);
    if (unit.side === 'hero') {
      if (!isWhole(unit.focus) || unit.focus > FOCUS.MAX) fail(`${unit.id} focus ${unit.focus}`);
      if (!isWhole(unit.rage) || unit.rage > RAGE.MAX) fail(`${unit.id} rage ${unit.rage}`);
    }
  }
  for (const [id, count] of Object.entries(state.items)) if (!isWhole(count)) fail(`item ${id} count ${count}`);
  for (const event of events) {
    if (event.type === EVENT.DAMAGE || event.type === EVENT.HEAL) {
      if (!isWhole(event.amount) || !isWhole(event.hp)) fail(`${event.type} event ${JSON.stringify(event)}`);
    }
  }
  if (isBattleOver(state) && !state.result) fail('battle over without a result');
}

// One random battle; returns { outcome: 'victory' | 'defeat' | 'stalemate', rounds, stars }.
export function simulateBattle(seed) {
  const rng = createRng(seed);
  let state = createBattle(randomBattleConfig(rng), rng.int(0, UINT32_MAX));
  checkInvariants(state, []);

  while (!isBattleOver(state)) {
    if (state.round > MAX_SIMULATED_ROUNDS) return { outcome: 'stalemate', rounds: state.round, stars: 0 };
    const before = JSON.stringify(state);
    let step;
    if (state.phase === BATTLE_PHASE.PLAYER_TURN) {
      const ready = getReadyHeroIds(state);
      if (ready.length === 0) throw new Error(`Player phase with nobody to act (seed ${state.seed})`);
      const legal = getLegalActions(state, rng.pick(ready));
      step = applyAction(state, { ...rng.pick(legal), timing: rng.pick(TIMINGS) });
    } else {
      step = runEnemyPhase(state);
    }
    if (JSON.stringify(state) !== before) throw new Error(`Engine changed its input state (seed ${state.seed})`);
    checkInvariants(step.state, step.events);
    state = step.state;
  }
  return { outcome: state.result.outcome, rounds: state.round, stars: state.result.stars };
}

export function simulateBattles(count, seed = 1) {
  const rng = createRng(seed);
  const summary = { battles: count, victory: 0, defeat: 0, stalemate: 0, rounds: 0 };
  for (let i = 0; i < count; i += 1) {
    const result = simulateBattle(rng.int(0, UINT32_MAX));
    summary[result.outcome] += 1;
    summary.rounds += result.rounds;
  }
  return summary;
}
