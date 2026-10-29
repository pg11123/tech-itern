import { describe, expect, it } from 'vitest';
import { BATTLE_PHASE, EVENT, TIMING } from '../config/constants';
import { applyEvent, buildView, viewMismatches } from '../game/battleView';
import { applyAction, createBattle, getLegalActions, getReadyHeroIds, isBattleOver, runEnemyPhase } from '../game/engine/battle';
import { createRng } from '../game/engine/rng';
import { randomBattleConfig } from '../game/sim/simulate';
import { cursorPosition, timingAt, timingExpired } from '../game/timing';
import { makeBattle } from './helpers';

const BATTLES = 300;
const MAX_STEPS = 400;

describe('battle view', () => {
  it('builds the HUD view from the engine state', () => {
    const view = buildView(makeBattle({ waves: [{ enemies: ['grunt', 'slinger'] }, { enemies: ['brute'] }] }));
    expect(view).toMatchObject({ round: 1, waveIndex: 0, waveCount: 2, waveSize: 2, heroIds: ['h0'], enemyIds: ['w0e0', 'w0e1'] });
    expect(view.units.h0).toMatchObject({ hp: 120, maxHp: 120, alive: true, focus: 1, rage: 0, heroClass: 'vanguard' });
  });

  it(`never drifts from the engine: events replayed on the view match the state (${BATTLES} random battles)`, () => {
    const rng = createRng(31337);
    let steps = 0;
    for (let battle = 0; battle < BATTLES; battle += 1) {
      let state = createBattle(randomBattleConfig(rng), rng.int(0, 0xffffffff));
      for (let i = 0; i < MAX_STEPS && !isBattleOver(state); i += 1) {
        const step =
          state.phase === BATTLE_PHASE.PLAYER_TURN
            ? applyAction(state, { ...rng.pick(getLegalActions(state, rng.pick(getReadyHeroIds(state)))), timing: TIMING.GOOD })
            : runEnemyPhase(state);
        const replayed = step.events.reduce((view, event) => applyEvent(view, event, step.state), buildView(state));
        const problems = viewMismatches(replayed, step.state);
        if (problems.length) throw new Error(`Desync (seed ${state.seed}, step ${i}): ${problems.join('; ')}`);
        state = step.state;
        steps += 1;
      }
    }
    expect(steps).toBeGreaterThan(BATTLES * 10);
  }, 120000);

  it('reports mismatches', () => {
    const state = makeBattle();
    const wrong = applyEvent(buildView(state), { type: EVENT.DAMAGE, targetId: 'w0e0', hp: 1 }, state);
    expect(viewMismatches(wrong, state)).toEqual([`w0e0 hp 1 vs ${state.enemies[0].hp}`]);
  });
});

describe('timing bar', () => {
  it('bounces the cursor between the ends', () => {
    expect(cursorPosition(0, 1000)).toBe(0);
    expect(cursorPosition(500, 1000)).toBe(0.5);
    expect(cursorPosition(1000, 1000)).toBe(1);
    expect(cursorPosition(1500, 1000)).toBe(0.5);
    expect(cursorPosition(2000, 1000)).toBe(0);
  });

  it('is Great in the middle, Good around it and Miss near the ends', () => {
    expect(timingAt(0.5)).toBe(TIMING.GREAT);
    expect(timingAt(0.55)).toBe(TIMING.GREAT);
    expect(timingAt(0.7)).toBe(TIMING.GOOD);
    expect(timingAt(0.3)).toBe(TIMING.GOOD);
    expect(timingAt(0.05)).toBe(TIMING.MISS);
    expect(timingAt(1)).toBe(TIMING.MISS);
  });

  it('runs out after a few sweeps', () => {
    expect(timingExpired(0)).toBe(false);
    expect(timingExpired(1e6)).toBe(true);
  });
});
