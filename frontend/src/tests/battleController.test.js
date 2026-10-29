import { describe, expect, it } from 'vitest';
import { create } from 'zustand';
import { ACTION, ACTION_MENU, BATTLE_OUTCOME, SANDBOX_STAGE_ID, TIMING, TIMING_MODE, UI_MODE } from '../config/constants';
import { getSkill } from '../data';
import { createBattleController } from '../game/battleController';
import { buildView } from '../game/battleView';
import { createStageBattle, getLegalActions } from '../game/engine/battle';
import { INITIAL_BATTLE_UI } from '../store/useBattleUiStore';

// Scene stand-in: plays events instantly and records what the controller asked for.
function fakeScene() {
  const calls = { synced: [], paused: [], speed: [], played: 0 };
  return {
    calls,
    playEvents: async (events, onEvent) => {
      calls.played += events.length;
      events.forEach(onEvent);
    },
    sync: (view) => calls.synced.push(view),
    setSelected: () => {},
    setPaused: (paused) => calls.paused.push(paused),
    setSpeed: (speed) => calls.speed.push(speed),
    wait: async () => {},
  };
}

function setup({ timingMode = TIMING_MODE.MANUAL, seed = 7 } = {}) {
  const store = create(() => ({ ...INITIAL_BATTLE_UI }));
  const scene = fakeScene();
  const desyncs = [];
  const controller = createBattleController({
    battle: createStageBattle(SANDBOX_STAGE_ID, seed),
    scene,
    store,
    settings: () => ({ timingMode, battleSpeed: 2 }),
    onDesync: (problems) => desyncs.push(problems),
  });
  return { store, scene, controller, desyncs };
}

// A sensible player: ultimates when ready, Matilda heals the weakest ally under 55%,
// otherwise the most expensive damaging skill (or an attack) on the weakest enemy.
function pickIntent(state, heroId) {
  const legal = getLegalActions(state, heroId);
  const hero = state.heroes.find((unit) => unit.id === heroId);
  const ult = legal.find((action) => action.skillId && getSkill(action.skillId).isUltimate);
  if (ult) return { intent: { type: ACTION.SKILL, skillId: ult.skillId }, targetId: ult.targetId };
  const hurt = [...state.heroes].filter((unit) => unit.hp > 0).sort((a, b) => a.hp / a.stats.maxHp - b.hp / b.stats.maxHp)[0];
  if (hero.heroClass === 'mender' && hurt.hp / hurt.stats.maxHp < 0.55) {
    return { intent: { type: ACTION.SKILL, skillId: 'healing_light' }, targetId: hurt.id };
  }
  const weakest = [...state.enemies].filter((unit) => unit.hp > 0).sort((a, b) => a.hp - b.hp)[0];
  const damaging = legal
    .filter((action) => action.type === ACTION.SKILL && ['physical', 'magic'].includes(getSkill(action.skillId).type))
    .filter((action) => !action.targetId || action.targetId === weakest.id)
    .sort((a, b) => getSkill(b.skillId).focusCost - getSkill(a.skillId).focusCost)[0];
  if (damaging) return { intent: { type: ACTION.SKILL, skillId: damaging.skillId }, targetId: damaging.targetId };
  return { intent: { type: ACTION.ATTACK }, targetId: weakest.id };
}

async function playToTheEnd({ store, controller }) {
  await controller.start();
  for (let turn = 0; turn < 300 && store.getState().mode !== UI_MODE.OVER; turn += 1) {
    const { mode, heroId } = store.getState();
    expect(mode).toBe(UI_MODE.COMMAND);
    const { intent, targetId } = pickIntent(controller.getState(), heroId);
    await controller.choose(intent);
    if (store.getState().mode === UI_MODE.TARGET) await controller.chooseTarget(targetId);
    if (store.getState().mode === UI_MODE.TIMING) await controller.finishTiming(TIMING.GREAT);
  }
}

describe('battle controller', () => {
  it('plays the 3-wave sandbox from start to finish with no desync', async () => {
    const harness = setup();
    await playToTheEnd(harness);
    const { store, scene, controller, desyncs } = harness;
    const { result, view, mode } = store.getState();
    expect(mode).toBe(UI_MODE.OVER);
    expect(result.outcome).toBe(BATTLE_OUTCOME.VICTORY);
    expect(controller.getState().waveIndex).toBe(2);
    expect(desyncs).toEqual([]);
    expect(view).toEqual(buildView(controller.getState()));
    expect(scene.calls.synced.at(-1)).toEqual(view);
    expect(scene.calls.speed).toEqual([2]);
  });

  it('starts in command mode with the first hero selected', async () => {
    const { store, controller } = setup();
    await controller.start();
    expect(store.getState()).toMatchObject({ mode: UI_MODE.COMMAND, heroId: 'h0', menu: ACTION_MENU.MAIN });
  });

  it('asks for a target, then the timing bar, and can be cancelled', async () => {
    const { store, controller } = setup();
    await controller.start();
    controller.choose({ type: ACTION.ATTACK });
    expect(store.getState().mode).toBe(UI_MODE.TARGET);
    expect(store.getState().targets).toEqual(['w0e0', 'w0e1']);
    controller.cancel();
    expect(store.getState().mode).toBe(UI_MODE.COMMAND);
    controller.choose({ type: ACTION.ATTACK });
    controller.chooseTarget('w0e0');
    expect(store.getState().mode).toBe(UI_MODE.TIMING);
    await controller.finishTiming(TIMING.GOOD);
    expect(store.getState().mode).toBe(UI_MODE.COMMAND);
    expect(store.getState().heroId).toBe('h1');
  });

  it('skips the timing bar in Auto mode and needs no target for Defend', async () => {
    const { store, controller } = setup({ timingMode: TIMING_MODE.AUTO });
    await controller.start();
    controller.choose({ type: ACTION.ATTACK });
    await controller.chooseTarget('w0e1');
    expect(store.getState().heroId).toBe('h1');
    await controller.choose({ type: ACTION.DEFEND });
    expect(store.getState().heroId).toBe('h2');
  });

  it('switches heroes and menus, ignores input while not in command mode', async () => {
    const { store, controller } = setup();
    controller.choose({ type: ACTION.DEFEND }); // still loading: ignored
    await controller.start();
    controller.selectHero('h2');
    expect(store.getState().heroId).toBe('h2');
    controller.selectHero('w0e0');
    expect(store.getState().heroId).toBe('h2');
    controller.openMenu(ACTION_MENU.SKILLS);
    expect(store.getState().menu).toBe(ACTION_MENU.SKILLS);
    controller.cancel();
    expect(store.getState().menu).toBe(ACTION_MENU.MAIN);
  });

  it('pauses through the scene', async () => {
    const { store, scene, controller } = setup();
    await controller.start();
    controller.setPaused(true);
    expect(store.getState().paused).toBe(true);
    controller.setPaused(false);
    expect(scene.calls.paused).toEqual([true, false]);
  });
});
