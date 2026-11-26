// Battle flow (PLAN 1.5.1): rounds, turn ends, wave changes, victory and defeat.
// Mutates the draft state it gets, like resolve.js.
import { FOCUS } from '../../config/balance';
import { BATTLE_OUTCOME, BATTLE_PHASE, DAMAGE_KIND, EVENT } from '../../config/constants';
import { rateBattle } from './rating';
import { inflict } from './resolve';
import { dotDamage, findFlag, tickStatuses } from './statuses';
import { createEnemyUnit, isAlive, living } from './units';
import { splitXp } from './xp';

export function setPhase(draft, phase, events) {
  draft.phase = phase;
  events.push({ type: EVENT.PHASE, phase });
}

export function spawnWave(draft, waveIndex, events) {
  draft.waveIndex = waveIndex;
  draft.enemies = draft.waves[waveIndex].enemies.map((id, slot) =>
    createEnemyUnit(id, slot, waveIndex, draft.stageIndex),
  );
  events.push({
    type: EVENT.WAVE_START,
    wave: waveIndex + 1,
    total: draft.waves.length,
    enemyIds: draft.enemies.map((enemy) => enemy.id),
  });
}

// End of a unit's turn, acted or skipped: damage over time, then status and cooldown countdowns.
export function endTurn(draft, unit, rng, events) {
  const dot = dotDamage(unit);
  if (dot > 0 && isAlive(unit)) inflict(draft, unit, dot, { kind: DAMAGE_KIND.BLEED, shielded: false }, rng, events);
  if (!isAlive(unit)) return;
  for (const status of tickStatuses(unit)) events.push({ type: EVENT.STATUS_END, targetId: unit.id, status });
  for (const [skillId, turns] of Object.entries(unit.cooldowns)) {
    if (turns <= 1) delete unit.cooldowns[skillId];
    else unit.cooldowns[skillId] = turns - 1;
  }
}

function finishVictory(draft, events) {
  const survivors = living(draft.heroes).map((hero) => hero.defId);
  const xp = draft.earned.xp + (draft.stageRewards.xp ?? 0);
  draft.result = {
    outcome: BATTLE_OUTCOME.VICTORY,
    stars: rateBattle({
      victory: true,
      heroDowned: draft.heroDowned,
      rounds: draft.round,
      roundLimit: draft.roundLimit,
    }),
    rounds: draft.round,
    xp,
    xpPerHero: splitXp(xp, survivors),
    coins: draft.earned.coins + (draft.stageRewards.coins ?? 0),
    loot: draft.earned.loot,
    firstClearGems: draft.stageRewards.firstClearGems ?? 0,
  };
  draft.phase = BATTLE_PHASE.VICTORY;
  events.push({ type: EVENT.VICTORY, result: structuredClone(draft.result) });
}

function finishDefeat(draft, events) {
  draft.result = { outcome: BATTLE_OUTCOME.DEFEAT, stars: 0, rounds: draft.round };
  draft.phase = BATTLE_PHASE.DEFEAT;
  events.push({ type: EVENT.DEFEAT });
}

// The player phase ends once every living hero has acted (or skipped).
function checkPlayerPhaseDone(draft, events) {
  if (draft.phase !== BATTLE_PHASE.PLAYER_TURN) return;
  if (living(draft.heroes).length === 0) finishDefeat(draft, events);
  else if (living(draft.heroes).every((hero) => hero.acted)) setPhase(draft, BATTLE_PHASE.ENEMY_TURN, events);
}

// Starts a round: +1 Focus (not on round 1), heroes ready again, stunned heroes skip at once.
export function startRound(draft, rng, events, { first = false } = {}) {
  if (!first) draft.round += 1;
  events.push({ type: EVENT.ROUND_START, round: draft.round });
  for (const hero of living(draft.heroes)) {
    hero.acted = false;
    if (!first) hero.focus = Math.min(FOCUS.MAX, hero.focus + FOCUS.PER_ROUND);
  }
  setPhase(draft, BATTLE_PHASE.PLAYER_TURN, events);
  for (const hero of living(draft.heroes)) {
    const skip = findFlag(hero, 'skipsTurn');
    if (!skip) continue;
    events.push({ type: EVENT.SKIP, unitId: hero.id, reason: skip.id });
    hero.acted = true;
    endTurn(draft, hero, rng, events);
  }
  checkPlayerPhaseDone(draft, events);
}

// CHECK_WAVE / CHECK_END after any turn. Returns true when the battle moved on to a new wave
// or ended, so an enemy phase in progress must stop.
export function settle(draft, rng, events) {
  if (living(draft.enemies).length === 0) {
    events.push({ type: EVENT.WAVE_CLEARED, wave: draft.waveIndex + 1 });
    if (draft.waveIndex + 1 < draft.waves.length) {
      spawnWave(draft, draft.waveIndex + 1, events);
      startRound(draft, rng, events);
    } else {
      finishVictory(draft, events);
    }
    return true;
  }
  if (living(draft.heroes).length === 0) {
    finishDefeat(draft, events);
    return true;
  }
  checkPlayerPhaseDone(draft, events);
  return false;
}
