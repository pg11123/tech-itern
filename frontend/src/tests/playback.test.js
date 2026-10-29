import { describe, expect, it } from 'vitest';
import { BATTLE_PHASE, EVENT } from '../config/constants';
import { toBeats } from '../game/render/playback';

const action = (actorId) => ({ type: EVENT.ACTION, actorId, action: 'attack', skillId: 'attack', targetId: 'w0e0' });
const damage = (targetId) => ({ type: EVENT.DAMAGE, targetId, amount: 5, hp: 10 });

describe('toBeats', () => {
  it('groups an action with the hits, statuses and deaths it caused', () => {
    const events = [
      action('h0'),
      damage('w0e0'),
      { type: EVENT.STATUS, targetId: 'w0e0', status: 'stun', turns: 1 },
      { type: EVENT.DEATH, unitId: 'w0e0' },
      { type: EVENT.PHASE, phase: BATTLE_PHASE.ENEMY_TURN },
    ];
    const beats = toBeats(events);
    expect(beats).toHaveLength(2);
    expect(beats[0].action).toBe(events[0]);
    expect(beats[0].effects).toEqual(events.slice(1, 4));
    expect(beats[1]).toEqual({ action: null, effects: [events[4]] });
  });

  it('starts a new beat for each action and keeps standalone events on their own', () => {
    const skip = { type: EVENT.SKIP, unitId: 'w0e1', reason: 'stun' };
    const bleed = { ...damage('w0e1'), kind: 'bleed' };
    const beats = toBeats([action('w0e0'), damage('h0'), skip, bleed, action('w0e2'), damage('h1')]);
    expect(beats.map((beat) => [beat.action?.actorId ?? null, beat.effects.length])).toEqual([
      ['w0e0', 1],
      [null, 1],
      [null, 1],
      ['w0e2', 1],
    ]);
  });

  it('keeps every event exactly once, in order', () => {
    const events = [
      { type: EVENT.ROUND_START, round: 2 },
      action('h0'),
      damage('w0e0'),
      { type: EVENT.WAVE_CLEARED, wave: 1 },
      { type: EVENT.WAVE_START, wave: 2, total: 3, enemyIds: ['w1e0'] },
    ];
    const flattened = toBeats(events).flatMap((beat) => (beat.action ? [beat.action, ...beat.effects] : beat.effects));
    expect(flattened).toEqual(events);
  });
});
