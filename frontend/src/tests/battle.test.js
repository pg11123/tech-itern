import { describe, expect, it } from 'vitest';
import { ENEMY_HP_MULT } from '../config/balance';
import { ACTION, BATTLE_OUTCOME, BATTLE_PHASE, EVENT } from '../config/constants';
import { getStage } from '../data';
import {
  applyAction,
  createBattle,
  createStageBattle,
  getLegalActions,
  getReadyHeroIds,
  isBattleOver,
  runEnemyPhase,
} from '../game/engine/battle';
import { BattleError } from '../game/engine/errors';
import { deepFreeze, edit, makeBattle, ofType, unitOf } from './helpers';

const attack = (actorId, targetId, extra = {}) => ({ type: ACTION.ATTACK, actorId, targetId, ...extra });

// Plays a battle with a fixed policy (first legal action) for up to `steps` engine calls.
function playScripted(seed, steps = 60) {
  let state = makeBattle(
    {
      party: [{ hero: 'red', level: 8 }, { hero: 'chuck', level: 8 }],
      waves: [{ enemies: ['grunt', 'slinger'] }, { enemies: ['shaman', 'brute'] }],
    },
    seed,
  );
  const log = [];
  for (let i = 0; i < steps && !isBattleOver(state); i += 1) {
    const step =
      state.phase === BATTLE_PHASE.PLAYER_TURN
        ? applyAction(state, getLegalActions(state, getReadyHeroIds(state)[0])[0])
        : runEnemyPhase(state);
    log.push(...step.events);
    state = step.state;
  }
  return { state, log };
}

describe('createBattle', () => {
  it('starts in the player phase of round 1 with wave 1 on the field', () => {
    const state = makeBattle({ waves: [{ enemies: ['grunt', 'slinger'] }, { enemies: ['brute'] }] });
    expect(state.phase).toBe(BATTLE_PHASE.PLAYER_TURN);
    expect(state.round).toBe(1);
    expect(state.enemies.map((enemy) => enemy.id)).toEqual(['w0e0', 'w0e1']);
    expect(state.result).toBe(null);
  });

  it('builds heroes from base + growth * (level - 1), with skills unlocked by level', () => {
    const red = makeBattle({ party: [{ hero: 'red', level: 5 }] }).heroes[0];
    expect(red.stats.maxHp).toBe(176);
    expect(red.stats.atk).toBeCloseTo(22.8);
    expect(red.hp).toBe(176);
    expect(red.focus).toBe(1);
    expect(red.rage).toBe(0);
    expect(red.skills).toEqual(['shield_bash', 'taunt']);
    expect(makeBattle({ party: [{ hero: 'red', level: 15 }] }).heroes[0].skills).toHaveLength(4);
  });

  it('scales enemies by stage index and fills default crit stats', () => {
    const grunt = makeBattle({ stageIndex: 10 }).enemies[0];
    expect(grunt.stats.maxHp).toBe(Math.round(60 * 2.2 * ENEMY_HP_MULT));
    expect(grunt.stats.atk).toBeCloseTo(22);
    expect(grunt.stats.critChance).toBe(0.08);
    expect(grunt.stats.critMult).toBe(1.5);
  });

  it.each([
    ['an empty party', { party: [] }],
    ['five heroes', { party: ['red', 'chuck', 'matilda', 'bomb', 'blues'].map((hero) => ({ hero })) }],
    ['a duplicate hero', { party: [{ hero: 'red' }, { hero: 'red' }] }],
    ['an unknown enemy', { waves: [{ enemies: ['dragon'] }] }],
    ['a wave of five', { waves: [{ enemies: Array(5).fill('grunt') }] }],
    ['an unknown item', { items: { sword: 1 } }],
    ['no round limit', { roundLimit: 0 }],
  ])('rejects %s', (_, overrides) => {
    expect(() => makeBattle(overrides)).toThrow(BattleError);
  });

  it('creates stage battles from stages.json with the fixed party', () => {
    const state = createStageBattle('test', 3);
    expect(state.heroes.map((hero) => hero.defId)).toEqual(getStage('test').fixedParty.map((member) => member.hero));
    expect(state.roundLimit).toBe(getStage('test').roundLimit);
  });
});

describe('legal actions', () => {
  it('lists attacks per target, affordable skills and defend', () => {
    const state = makeBattle({ waves: [{ enemies: ['grunt', 'grunt'] }] });
    const actions = getLegalActions(state, 'h0');
    expect(actions).toEqual([
      attack('h0', 'w0e0'),
      attack('h0', 'w0e1'),
      { type: ACTION.SKILL, actorId: 'h0', skillId: 'shield_bash', targetId: 'w0e0' },
      { type: ACTION.SKILL, actorId: 'h0', skillId: 'shield_bash', targetId: 'w0e1' },
      { type: ACTION.DEFEND, actorId: 'h0' },
    ]);
  });

  it('drops skills the hero cannot pay for', () => {
    const state = edit(makeBattle(), (draft) => {
      draft.heroes[0].focus = 0;
    });
    expect(getLegalActions(state, 'h0').some((action) => action.type === ACTION.SKILL)).toBe(false);
  });

  it('is empty for enemies, unknown ids and heroes that already acted', () => {
    const state = makeBattle({ party: [{ hero: 'red' }, { hero: 'chuck' }] });
    expect(getLegalActions(state, 'w0e0')).toEqual([]);
    expect(getLegalActions(state, 'nobody')).toEqual([]);
    const after = applyAction(state, attack('h0', 'w0e0')).state;
    expect(getLegalActions(after, 'h0')).toEqual([]);
    expect(getReadyHeroIds(after)).toEqual(['h1']);
  });
});

describe('applyAction', () => {
  it('rejects illegal actions', () => {
    const state = makeBattle();
    expect(() => applyAction(state, attack('h0', 'h0'))).toThrow(BattleError);
    expect(() => applyAction(state, attack('h0', 'w0e0', { timing: 'perfect' }))).toThrow(BattleError);
    expect(() => applyAction(state, { type: ACTION.SKILL, actorId: 'h0', skillId: 'rage_slam' })).toThrow(BattleError);
    const enemyPhase = applyAction(state, attack('h0', 'w0e0')).state;
    expect(() => applyAction(enemyPhase, attack('h0', 'w0e0'))).toThrow(BattleError);
  });

  it('never changes the state it is given', () => {
    const state = deepFreeze(makeBattle());
    const { state: next } = applyAction(state, attack('h0', 'w0e0'));
    expect(next).not.toBe(state);
    expect(next.enemies[0].hp).toBeLessThan(state.enemies[0].hp);
    expect(() => runEnemyPhase(deepFreeze(next))).not.toThrow();
  });

  it('hands over to the enemy phase once every living hero has acted', () => {
    const state = makeBattle({ party: [{ hero: 'red' }, { hero: 'chuck' }] });
    const first = applyAction(state, attack('h0', 'w0e0'));
    expect(first.state.phase).toBe(BATTLE_PHASE.PLAYER_TURN);
    const second = applyAction(first.state, attack('h1', 'w0e0'));
    expect(second.state.phase).toBe(BATTLE_PHASE.ENEMY_TURN);
    expect(ofType(second.events, EVENT.PHASE)).toEqual([{ type: EVENT.PHASE, phase: BATTLE_PHASE.ENEMY_TURN }]);
  });
});

describe('enemy phase and rounds', () => {
  it('only runs in the enemy phase', () => {
    expect(() => runEnemyPhase(makeBattle())).toThrow(BattleError);
  });

  it('lets enemies act fastest first, then starts the next round with +1 Focus', () => {
    const state = edit(makeBattle({ waves: [{ enemies: ['grunt', 'slinger', 'brute'] }] }), (draft) => {
      draft.heroes[0].hp = 9999;
      draft.heroes[0].stats.maxHp = 9999;
    });
    const { state: enemyTurn } = applyAction(state, { type: ACTION.DEFEND, actorId: 'h0' });
    const { state: next, events } = runEnemyPhase(enemyTurn);
    const actors = ofType(events, EVENT.ACTION).map((event) => event.actorId);
    expect(actors).toEqual(['w0e1', 'w0e0', 'w0e2']); // slinger spd 9, grunt 6, brute 4
    expect(next.round).toBe(2);
    expect(next.phase).toBe(BATTLE_PHASE.PLAYER_TURN);
    expect(next.heroes[0].acted).toBe(false);
  });
});

describe('deaths, waves and the end of battle', () => {
  const oneHp = (state, ids) =>
    edit(state, (draft) => {
      for (const id of ids) unitOf(draft, id).hp = 1;
    });

  it('removes dead enemies from targeting and banks their XP and coins', () => {
    const state = oneHp(makeBattle({ waves: [{ enemies: ['grunt', 'slinger'] }] }), ['w0e0']);
    const { state: next, events } = applyAction(state, attack('h0', 'w0e0'));
    expect(ofType(events, EVENT.DEATH)).toEqual([{ type: EVENT.DEATH, unitId: 'w0e0' }]);
    expect(next.earned).toMatchObject({ xp: 20, coins: 8 });
    expect(next.enemies[0].statuses).toEqual([]);
    const afterEnemies = runEnemyPhase(next).state;
    expect(getLegalActions(afterEnemies, 'h0').map((action) => action.targetId)).not.toContain('w0e0');
  });

  it('brings in the next wave as a new round', () => {
    const start = makeBattle({ waves: [{ enemies: ['grunt'] }, { enemies: ['slinger', 'shaman'] }] });
    const state = oneHp(start, ['w0e0']);
    const { state: next, events } = applyAction(state, attack('h0', 'w0e0'));
    const types = events.map((event) => event.type);
    expect(types).toEqual(expect.arrayContaining([EVENT.DEATH, EVENT.WAVE_CLEARED, EVENT.WAVE_START, EVENT.ROUND_START]));
    expect(types.indexOf(EVENT.WAVE_CLEARED)).toBeLessThan(types.indexOf(EVENT.WAVE_START));
    expect(next.waveIndex).toBe(1);
    expect(next.enemies.map((enemy) => enemy.id)).toEqual(['w1e0', 'w1e1']);
    expect(next.round).toBe(2);
    expect(next.phase).toBe(BATTLE_PHASE.PLAYER_TURN);
    expect(next.heroes[0].acted).toBe(false);
    expect(next.heroes[0].focus).toBe(2); // 1 + 1 for the new round (Defend not used)
  });

  it('wins when the last wave is cleared and pays out rewards', () => {
    const state = oneHp(
      makeBattle({ party: [{ hero: 'red' }, { hero: 'chuck' }], rewards: { xp: 40, coins: 30, firstClearGems: 5 } }),
      ['w0e0'],
    );
    const { state: next, events } = applyAction(state, attack('h0', 'w0e0'));
    expect(next.phase).toBe(BATTLE_PHASE.VICTORY);
    expect(isBattleOver(next)).toBe(true);
    expect(next.result).toEqual({
      outcome: BATTLE_OUTCOME.VICTORY,
      stars: 3,
      rounds: 1,
      xp: 60,
      xpPerHero: { red: 30, chuck: 30 },
      coins: 38,
      loot: [],
      firstClearGems: 5,
    });
    expect(ofType(events, EVENT.VICTORY)[0].result).toEqual(next.result);
  });

  it('splits XP only among survivors and drops to 1 star after a hero went down', () => {
    const state = edit(oneHp(makeBattle({ party: [{ hero: 'red' }, { hero: 'chuck' }] }), ['w0e0']), (draft) => {
      draft.heroes[1].hp = 0;
      draft.heroDowned = true;
    });
    const { state: next } = applyAction(state, attack('h0', 'w0e0'));
    expect(next.result.xpPerHero).toEqual({ red: 20 });
    expect(next.result.stars).toBe(1);
  });

  it('loses when every hero is down', () => {
    const state = oneHp(makeBattle({ waves: [{ enemies: ['brute', 'brute'] }] }), ['h0']);
    const { state: enemyTurn } = applyAction(state, attack('h0', 'w0e0'));
    const { state: next, events } = runEnemyPhase(enemyTurn);
    expect(next.phase).toBe(BATTLE_PHASE.DEFEAT);
    expect(next.result).toEqual({ outcome: BATTLE_OUTCOME.DEFEAT, stars: 0, rounds: 1 });
    expect(ofType(events, EVENT.DEFEAT)).toHaveLength(1);
    expect(ofType(events, EVENT.ACTION)).toHaveLength(1); // the second Brute never acts
    expect(() => applyAction(next, attack('h0', 'w0e0'))).toThrow(BattleError);
  });
});

describe('deterministic replay', () => {
  it('gives identical events and state for the same seed and actions', () => {
    const a = playScripted(42);
    const b = playScripted(42);
    expect(a.log.length).toBeGreaterThan(10);
    expect(b.log).toEqual(a.log);
    expect(b.state).toEqual(a.state);
  });

  it('plays out differently with another seed', () => {
    expect(playScripted(43).log).not.toEqual(playScripted(42).log);
  });

  it('can resume from a serialized state', () => {
    const { state } = playScripted(7, 5);
    const copy = JSON.parse(JSON.stringify(state));
    const next = (s) => (s.phase === BATTLE_PHASE.ENEMY_TURN ? runEnemyPhase(s) : applyAction(s, getLegalActions(s, getReadyHeroIds(s)[0])[0]));
    expect(next(copy)).toEqual(next(state));
  });

  it('creates the same battle for the same seed', () => {
    const config = { party: [{ hero: 'blues', level: 3 }], waves: [{ enemies: ['grunt'] }], roundLimit: 5 };
    expect(createBattle(config, 9)).toEqual(createBattle(config, 9));
  });
});
