import { describe, expect, it } from 'vitest';
import { ENEMY_DAMAGE_MULT } from '../config/balance';
import { ACTION, BATTLE_PHASE, DAMAGE_KIND, EVENT } from '../config/constants';
import { getSkill } from '../data';
import { computeDamage } from '../game/engine/damage';
import { createRng } from '../game/engine/rng';
import { applyAction, getLegalActions, getReadyHeroIds, runEnemyPhase } from '../game/engine/battle';
import { edit, makeBattle, ofType, unitOf } from './helpers';

const attack = (actorId, targetId, extra = {}) => ({ type: ACTION.ATTACK, actorId, targetId, ...extra });
const skill = (actorId, skillId, targetId) => ({ type: ACTION.SKILL, actorId, skillId, ...(targetId && { targetId }) });
const item = (actorId, itemId, targetId) => ({ type: ACTION.ITEM, actorId, itemId, targetId });
const defend = (actorId) => ({ type: ACTION.DEFEND, actorId });
const statusIds = (unit) => unit.statuses.map((status) => status.id);
const tough = (draft, id) => {
  const unit = unitOf(draft, id);
  unit.stats.maxHp = 99999;
  unit.hp = 99999;
};

// Every ready hero defends, then the enemies act. Returns the new state and all events.
function defendRound(state) {
  let current = state;
  const events = [];
  for (const id of getReadyHeroIds(current)) {
    const step = applyAction(current, defend(id));
    events.push(...step.events);
    current = step.state;
  }
  const step = runEnemyPhase(current);
  return { state: step.state, events: [...events, ...step.events] };
}

describe('Focus and Rage', () => {
  it('skills cost Focus; Defend gives +1 Focus (max 5) and the defend status', () => {
    const state = makeBattle();
    expect(applyAction(state, skill('h0', 'shield_bash', 'w0e0')).state.heroes[0].focus).toBe(0);
    const defended = applyAction(state, defend('h0')).state.heroes[0];
    expect(defended.focus).toBe(2);
    expect(statusIds(defended)).toEqual(['defend']);
    const capped = edit(state, (draft) => {
      draft.heroes[0].focus = 5;
    });
    expect(applyAction(capped, defend('h0')).state.heroes[0].focus).toBe(5);
  });

  it('Defend lowers the damage taken during the enemy phase', () => {
    const defended = applyAction(makeBattle(), defend('h0')).state;
    const undefended = edit(defended, (draft) => {
      draft.heroes[0].statuses = [];
    });
    const taken = (state) => ofType(runEnemyPhase(state).events, EVENT.DAMAGE)[0].amount;
    expect(taken(defended)).toBeLessThan(taken(undefended));
  });

  it('dealing damage gives +10 Rage; being hit gives +1 Focus and +15 Rage', () => {
    const { state: enemyTurn } = applyAction(makeBattle(), attack('h0', 'w0e0'));
    expect(enemyTurn.heroes[0].rage).toBe(10);
    const red = runEnemyPhase(enemyTurn).state.heroes[0];
    expect(red.rage).toBe(25);
    expect(red.focus).toBe(3); // 1 + 1 (hit) + 1 (new round)
  });

  it('the ultimate needs a full Rage meter and empties it', () => {
    const state = makeBattle({ party: [{ hero: 'red', level: 15 }], waves: [{ enemies: ['grunt', 'brute'] }] });
    const ready = (rage) =>
      getLegalActions(edit(state, (draft) => { draft.heroes[0].rage = rage; }), 'h0').some((a) => a.skillId === 'rage_slam');
    expect(ready(99)).toBe(false);
    expect(ready(100)).toBe(true);

    const full = edit(state, (draft) => {
      draft.heroes[0].rage = 100;
      draft.enemies.forEach((enemy) => tough(draft, enemy.id));
    });
    const { state: next, events } = applyAction(full, skill('h0', 'rage_slam'));
    expect(next.heroes[0].rage).toBe(0);
    expect(ofType(events, EVENT.DAMAGE)).toHaveLength(2);
    expect(next.enemies.every((enemy) => statusIds(enemy).includes('weak'))).toBe(true);
  });

  it('enemy hits deal ENEMY_DAMAGE_MULT times the formula damage', () => {
    const { state: enemyTurn } = applyAction(makeBattle(), defend('h0'));
    const [grunt, red] = [enemyTurn.enemies[0], enemyTurn.heroes[0]];
    const expected = computeDamage({
      attacker: grunt,
      defender: red,
      type: 'physical',
      mult: getSkill('club_smash').mult,
      rng: createRng(enemyTurn.rng),
      bonusMult: ENEMY_DAMAGE_MULT,
    });
    const hit = ofType(runEnemyPhase(enemyTurn).events, EVENT.DAMAGE)[0];
    expect(ENEMY_DAMAGE_MULT).toBe(3);
    expect(hit.amount).toBe(expected.amount);
  });

  it('the timing bar scales basic attacks: Great > Good > Miss', () => {
    const state = makeBattle();
    const dealt = (timing) => ofType(applyAction(state, attack('h0', 'w0e0', { timing })).events, EVENT.DAMAGE)[0].amount;
    expect(dealt('great')).toBeGreaterThan(dealt('good'));
    expect(dealt('good')).toBeGreaterThan(dealt('miss'));
    expect(dealt(undefined)).toBe(dealt('good'));
  });
});

describe('targeting and AI', () => {
  it('a taunting enemy is the only single target the heroes may pick', () => {
    const state = edit(makeBattle({ waves: [{ enemies: ['grunt', 'grunt'] }] }), (draft) => {
      draft.enemies[1].statuses.push({ id: 'taunt', turns: 2 });
    });
    const targets = getLegalActions(state, 'h0').filter((a) => a.targetId).map((a) => a.targetId);
    expect(new Set(targets)).toEqual(new Set(['w0e1']));
  });

  const duo = (change) =>
    edit(makeBattle({ party: [{ hero: 'red' }, { hero: 'matilda' }], waves: [{ enemies: ['grunt'] }] }), change);
  const firstTarget = (state) => ofType(defendRound(state).events, EVENT.ACTION).find((e) => e.actorId === 'w0e0').targetId;

  it('aggressive enemies hit the hero with the lowest HP', () => {
    expect(firstTarget(duo((draft) => { draft.heroes[1].hp = 30; }))).toBe('h1');
    expect(firstTarget(duo((draft) => { draft.heroes[0].hp = 30; }))).toBe('h0');
  });

  it('taunt overrides the AI choice', () => {
    const state = duo((draft) => {
      draft.heroes[1].hp = 30;
      draft.heroes[0].statuses.push({ id: 'taunt', turns: 2 });
    });
    expect(firstTarget(state)).toBe('h0');
  });

  it('focusHealer enemies go for the Mender first', () => {
    const state = edit(
      makeBattle({ party: [{ hero: 'red' }, { hero: 'matilda' }], waves: [{ enemies: ['slinger'] }] }),
      (draft) => {
        draft.heroes[0].hp = 10;
        draft.enemies[0].cooldowns = { pebble_spray: 2, sling_shot: 2 };
      },
    );
    expect(firstTarget(state)).toBe('h1');
  });

  it('enemy healers heal a hurt ally, otherwise buff', () => {
    const base = makeBattle({ waves: [{ enemies: ['shaman', 'grunt'] }] });
    const hurt = edit(base, (draft) => {
      draft.enemies[1].hp = 10;
    });
    const healEvents = ofType(defendRound(hurt).events, EVENT.HEAL);
    expect(healEvents[0]).toMatchObject({ sourceId: 'w0e0', targetId: 'w0e1' });
    const shamanAction = ofType(defendRound(base).events, EVENT.ACTION).find((e) => e.actorId === 'w0e0');
    expect(shamanAction.skillId).toBe('war_drum');
  });
});

describe('statuses in battle', () => {
  it('a stunned enemy skips its turn and the stun wears off', () => {
    const state = edit(makeBattle(), (draft) => {
      draft.enemies[0].statuses.push({ id: 'stun', turns: 1 });
    });
    const { state: next, events } = defendRound(state);
    expect(ofType(events, EVENT.SKIP)).toEqual([{ type: EVENT.SKIP, unitId: 'w0e0', reason: 'stun' }]);
    expect(ofType(events, EVENT.ACTION).some((e) => e.actorId === 'w0e0')).toBe(false);
    expect(next.enemies[0].statuses).toEqual([]);
  });

  it('a stunned hero loses the next player turn', () => {
    const state = makeBattle({ party: [{ hero: 'red' }, { hero: 'chuck' }] });
    const enemyTurn = edit(applyAction(applyAction(state, defend('h0')).state, defend('h1')).state, (draft) => {
      draft.heroes[1].statuses.push({ id: 'stun', turns: 1 });
    });
    const { state: next, events } = runEnemyPhase(enemyTurn);
    expect(ofType(events, EVENT.SKIP)).toEqual([{ type: EVENT.SKIP, unitId: 'h1', reason: 'stun' }]);
    expect(getReadyHeroIds(next)).toEqual(['h0']);
    expect(statusIds(next.heroes[1])).not.toContain('stun');
  });

  it('bleed hurts 5% of max HP at the end of each of 3 turns, then ends', () => {
    let state = edit(makeBattle(), (draft) => {
      draft.enemies[0].statuses.push({ id: 'bleed', turns: 3 });
    });
    const bleeds = [];
    for (let round = 0; round < 4; round += 1) {
      const step = defendRound(state);
      bleeds.push(...ofType(step.events, EVENT.DAMAGE).filter((e) => e.kind === DAMAGE_KIND.BLEED));
      state = step.state;
    }
    const tick = Math.round(state.enemies[0].stats.maxHp * 0.05);
    expect(bleeds.map((e) => e.amount)).toEqual([tick, tick, tick]);
    expect(state.enemies[0].statuses).toEqual([]);
  });

  it('shields absorb damage before HP', () => {
    const state = edit(applyAction(makeBattle(), defend('h0')).state, (draft) => {
      draft.heroes[0].statuses.push({ id: 'shield', turns: 2, value: 1000 });
    });
    const { state: next, events } = runEnemyPhase(state);
    const hit = ofType(events, EVENT.DAMAGE)[0];
    expect(hit.amount).toBe(0);
    expect(hit.absorbed).toBeGreaterThan(0);
    expect(next.heroes[0].hp).toBe(state.heroes[0].hp);
  });

  it('a self-cast taunt covers two enemy phases; its 2-turn cooldown blocks rounds 2 and 3', () => {
    let state = applyAction(makeBattle({ party: [{ hero: 'red', level: 5 }] }), skill('h0', 'taunt')).state;
    expect(statusIds(state.heroes[0])).toEqual(['taunt', 'buffDef']);
    const tauntReady = (s) => getLegalActions(s, 'h0').some((a) => a.skillId === 'taunt');

    state = runEnemyPhase(state).state; // round 2
    expect(statusIds(state.heroes[0])).toContain('taunt');
    expect(tauntReady(state)).toBe(false);
    state = applyAction(state, defend('h0')).state;
    expect(statusIds(state.heroes[0])).toContain('taunt');

    state = runEnemyPhase(state).state; // round 3
    expect(tauntReady(state)).toBe(false);
    const step = applyAction(state, defend('h0'));
    expect(ofType(step.events, EVENT.STATUS_END).map((e) => e.status)).toEqual(expect.arrayContaining(['taunt', 'buffDef']));

    state = runEnemyPhase(step.state).state; // round 4
    expect(tauntReady(state)).toBe(true);
  });

  it('a downed hero loses statuses and Rage and counts as a hero down', () => {
    const state = edit(makeBattle({ party: [{ hero: 'red' }, { hero: 'chuck' }], waves: [{ enemies: ['brute'] }] }), (draft) => {
      Object.assign(draft.heroes[1], { hp: 1, rage: 50, statuses: [{ id: 'weak', turns: 2 }] });
    });
    const { state: next } = defendRound(state);
    expect(next.heroes[1]).toMatchObject({ hp: 0, rage: 0, statuses: [] });
    expect(next.heroDowned).toBe(true);
    expect(getReadyHeroIds(next)).toEqual(['h0']);
  });
});

describe('class skills', () => {
  it('Bomb’s self-damage never takes him below 1 HP', () => {
    const bomb = (hp) =>
      applyAction(edit(makeBattle({ party: [{ hero: 'bomb' }] }), (d) => { d.heroes[0].hp = hp; }), skill('h0', 'blast'));
    const full = bomb(110);
    expect(full.state.heroes[0].hp).toBe(104); // 5% of 110, rounded
    expect(ofType(full.events, EVENT.DAMAGE).find((e) => e.kind === DAMAGE_KIND.SELF).amount).toBe(6);
    expect(bomb(3).state.heroes[0].hp).toBe(1);
    expect(ofType(bomb(1).events, EVENT.DAMAGE).some((e) => e.kind === DAMAGE_KIND.SELF)).toBe(false);
  });

  it('heals mag * mult, capped at max HP', () => {
    const state = makeBattle({ party: [{ hero: 'red' }, { hero: 'matilda' }] });
    const hurt = edit(state, (draft) => {
      draft.heroes[0].hp = 50;
    });
    expect(ofType(applyAction(hurt, skill('h1', 'healing_light', 'h0')).events, EVENT.HEAL)[0]).toMatchObject({ amount: 21, hp: 71 });
    expect(ofType(applyAction(state, skill('h1', 'healing_light', 'h0')).events, EVENT.HEAL)[0].amount).toBe(0);
  });

  it('cleanse removes negative statuses and keeps buffs', () => {
    const state = edit(makeBattle({ party: [{ hero: 'red' }, { hero: 'matilda', level: 10 }] }), (draft) => {
      draft.heroes[1].focus = 2;
      draft.heroes[0].statuses = [{ id: 'weak', turns: 2 }, { id: 'bleed', turns: 3 }, { id: 'buffAtk', turns: 2 }];
    });
    const { state: next } = applyAction(state, skill('h1', 'purify'));
    expect(statusIds(next.heroes[0])).toEqual(['buffAtk']);
  });

  it('multi-hit skills strike the same target several times', () => {
    const state = edit(makeBattle({ party: [{ hero: 'blues' }] }), (draft) => tough(draft, 'w0e0'));
    const hits = ofType(applyAction(state, skill('h0', 'triple_peck', 'w0e0')).events, EVENT.DAMAGE);
    expect(hits.map((e) => e.targetId)).toEqual(['w0e0', 'w0e0', 'w0e0']);
  });

  it('random x3 skills land exactly three hits on living enemies', () => {
    const state = edit(makeBattle({ party: [{ hero: 'chuck', level: 5 }], waves: [{ enemies: ['grunt', 'grunt', 'grunt'] }] }), (draft) => {
      draft.heroes[0].focus = 2;
      draft.enemies.forEach((enemy) => tough(draft, enemy.id));
    });
    const hits = ofType(applyAction(state, skill('h0', 'chain_lightning')).events, EVENT.DAMAGE);
    expect(hits).toHaveLength(3);
    for (const hit of hits) expect(['w0e0', 'w0e1', 'w0e2']).toContain(hit.targetId);
  });
});

describe('items', () => {
  const withItems = (items, change = () => {}) =>
    edit(makeBattle({ party: [{ hero: 'red' }, { hero: 'chuck' }], items }), change);

  it('Potion heals 40% of max HP and is used up', () => {
    const state = withItems({ potion: 1 }, (draft) => { draft.heroes[0].hp = 20; });
    const { state: next } = applyAction(state, item('h0', 'potion', 'h0'));
    expect(next.heroes[0].hp).toBe(68);
    expect(next.items.potion).toBe(0);
    expect(getLegalActions(next, 'h1').some((a) => a.type === ACTION.ITEM)).toBe(false);
  });

  it('Focus Tonic and Fire Pepper fill Focus and Rage', () => {
    const state = withItems({ focus_tonic: 1, fire_pepper: 1 });
    expect(applyAction(state, item('h0', 'focus_tonic', 'h1')).state.heroes[1].focus).toBe(3);
    expect(applyAction(state, item('h0', 'fire_pepper', 'h1')).state.heroes[1].rage).toBe(50);
  });

  it('Revive Feather brings a downed hero back at 30% HP for the next round', () => {
    const state = withItems({ revive_feather: 1 }, (draft) => {
      draft.heroes[1].hp = 0;
    });
    const revives = getLegalActions(state, 'h0').filter((a) => a.itemId === 'revive_feather');
    expect(revives.map((a) => a.targetId)).toEqual(['h1']);
    const { state: next, events } = applyAction(state, revives[0]);
    expect(ofType(events, EVENT.REVIVE)).toEqual([{ type: EVENT.REVIVE, unitId: 'h1', hp: 24 }]);
    expect(next.phase).toBe(BATTLE_PHASE.ENEMY_TURN);
  });
});

describe('boss script', () => {
  const bossBattle = (change) =>
    edit(makeBattle({ party: [{ hero: 'red', level: 30 }], waves: [{ enemies: ['chieftain'] }] }), (draft) => {
      tough(draft, 'h0');
      change?.(draft);
    });
  const bossMove = (events) => ofType(events, EVENT.ACTION).find((e) => e.actorId === 'w0e0').skillId;

  it('follows its rotation in phase 1', () => {
    let state = bossBattle();
    const moves = [];
    for (let i = 0; i < 4; i += 1) {
      const step = defendRound(state);
      moves.push(bossMove(step.events));
      state = step.state;
    }
    expect(moves).toEqual(['royal_strike', 'attack', 'war_cry', 'royal_strike']);
  });

  it('changes phase at 50% HP and starts the phase 2 rotation', () => {
    const state = bossBattle((draft) => {
      draft.enemies[0].hp = Math.floor(draft.enemies[0].stats.maxHp / 2) + 1; // just above 50%
    });
    const { state: next, events } = applyAction(state, attack('h0', 'w0e0'));
    expect(ofType(events, EVENT.BOSS_PHASE)).toEqual([{ type: EVENT.BOSS_PHASE, unitId: 'w0e0', phase: 1 }]);
    expect(bossMove(runEnemyPhase(next).events)).toBe('royal_quake');
  });
});
