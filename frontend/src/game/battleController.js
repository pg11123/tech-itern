// Runs one battle on screen (PLAN 1.5.1): player input -> engine -> event playback -> next turn.
// No React or Pixi here: the scene plays events, the store holds UI state. After every engine
// step the HUD view is rebuilt from the engine state and the scene snaps to it, so what the
// player sees always matches the engine.
import { ACTION, ACTION_MENU, BATTLE_PHASE, EVENT, TIMING, TIMING_MODE, UI_MODE } from '../config/constants';
import { applyEvent, buildView, viewMismatches } from './battleView';
import { applyAction, getLegalActions, getReadyHeroIds, isBattleOver, runEnemyPhase } from './engine/battle';

const BANNER_SECONDS = 1.1;
const RESULT_DELAY_SECONDS = 0.7;

const matchesIntent = (action, intent) =>
  action.type === intent.type &&
  (intent.skillId === undefined || action.skillId === intent.skillId) &&
  (intent.itemId === undefined || action.itemId === intent.itemId);

// scene: { playEvents(events, onEvent), sync(view), setSelected(id), setPaused(p), setSpeed(s), wait(s) }
// store: a zustand store ({ getState, setState }); settings(): { timingMode, battleSpeed }
export function createBattleController({ battle, scene, store, settings, onDesync = () => {} }) {
  let state = battle;
  let disposed = false;
  let bannerId = 0;
  let pendingAttack = null;

  const set = (patch) => {
    if (!disposed) store.setState(patch);
  };
  const ui = () => store.getState();

  function commit(next) {
    state = next;
    const view = buildView(next);
    set({ battle: next, view });
    scene.sync(view);
  }

  async function showBanner(key, params) {
    bannerId += 1;
    set({ banner: { key, params, id: bannerId } });
    await scene.wait(BANNER_SECONDS);
  }

  // Plays one engine step, keeping the HUD in step with each event, then commits the new state.
  async function play(step) {
    set({ mode: UI_MODE.BUSY, pending: null, targets: [] });
    scene.setSelected(null);
    let view = ui().view;
    await scene.playEvents(step.events, (event) => {
      view = applyEvent(view, event, step.state);
      set({ view });
      if (event.type === EVENT.WAVE_START) {
        bannerId += 1;
        set({ banner: { key: 'battle.wave', params: { current: event.wave, total: event.total }, id: bannerId } });
      }
      return view;
    });
    if (disposed) return;
    const problems = viewMismatches(view, step.state);
    if (problems.length) onDesync(problems);
    commit(step.state);
  }

  function selectFirstReady() {
    const heroId = getReadyHeroIds(state)[0] ?? null;
    set({ mode: UI_MODE.COMMAND, heroId, menu: ACTION_MENU.MAIN, pending: null, targets: [] });
    scene.setSelected(heroId);
  }

  async function finish() {
    await scene.wait(RESULT_DELAY_SECONDS);
    set({ mode: UI_MODE.OVER, result: state.result });
  }

  // After a step: finish, hand over to the enemies (as often as needed), or let the player act.
  async function advance(events) {
    let last = events;
    while (!disposed) {
      if (isBattleOver(state)) return finish();
      if (state.phase === BATTLE_PHASE.PLAYER_TURN) {
        if (last.some((event) => event.type === EVENT.ROUND_START)) await showBanner('turn.player');
        if (!disposed) selectFirstReady();
        return undefined;
      }
      set({ mode: UI_MODE.BUSY });
      await showBanner('turn.enemy');
      if (disposed) return undefined;
      const step = runEnemyPhase(state);
      await play(step);
      last = step.events;
    }
    return undefined;
  }

  async function submit(action) {
    const step = applyAction(state, action);
    await play(step);
    if (!disposed) await advance(step.events);
  }

  const legalFor = (intent) => getLegalActions(state, ui().heroId).filter((action) => matchesIntent(action, intent));

  return {
    async start() {
      set({ battle: state, view: buildView(state), mode: UI_MODE.BUSY, result: null, seed: state.seed });
      scene.setSpeed(settings().battleSpeed);
      await showBanner('battle.wave', { current: 1, total: state.waves.length });
      if (!disposed) await advance([{ type: EVENT.ROUND_START, round: state.round }]);
    },

    selectHero(heroId) {
      const { mode } = ui();
      if ((mode !== UI_MODE.COMMAND && mode !== UI_MODE.TARGET) || !getReadyHeroIds(state).includes(heroId)) return;
      set({ heroId, mode: UI_MODE.COMMAND, menu: ACTION_MENU.MAIN, pending: null, targets: [] });
      scene.setSelected(heroId);
    },

    openMenu(menu) {
      if (ui().mode === UI_MODE.COMMAND) set({ menu });
    },

    // intent: { type: 'attack' | 'defend' } | { type: 'skill', skillId } | { type: 'item', itemId }
    choose(intent) {
      if (ui().mode !== UI_MODE.COMMAND) return undefined;
      const legal = legalFor(intent);
      if (legal.length === 0) return undefined;
      if (legal.length === 1 && !legal[0].targetId) return submit(legal[0]);
      set({ mode: UI_MODE.TARGET, pending: intent, targets: legal.map((action) => action.targetId) });
      return undefined;
    },

    chooseTarget(targetId) {
      const { mode, pending } = ui();
      if (mode !== UI_MODE.TARGET) return undefined;
      const action = legalFor(pending).find((legal) => legal.targetId === targetId);
      if (!action) return undefined;
      if (action.type === ACTION.ATTACK) {
        if (settings().timingMode === TIMING_MODE.AUTO) return submit({ ...action, timing: TIMING.GOOD });
        pendingAttack = action;
        set({ mode: UI_MODE.TIMING, targets: [] });
        return undefined;
      }
      return submit(action);
    },

    finishTiming(timing) {
      if (ui().mode !== UI_MODE.TIMING || !pendingAttack) return undefined;
      const action = { ...pendingAttack, timing };
      pendingAttack = null;
      return submit(action);
    },

    cancel() {
      const { mode, menu } = ui();
      if (mode === UI_MODE.TARGET || mode === UI_MODE.TIMING) {
        pendingAttack = null;
        set({ mode: UI_MODE.COMMAND, pending: null, targets: [] });
      } else if (mode === UI_MODE.COMMAND && menu !== ACTION_MENU.MAIN) {
        set({ menu: ACTION_MENU.MAIN });
      }
    },

    setPaused(paused) {
      if (ui().mode === UI_MODE.OVER && paused) return;
      set({ paused });
      scene.setPaused(paused);
    },

    setSpeed(speed) {
      scene.setSpeed(speed);
    },

    getState: () => state,

    destroy() {
      disposed = true;
    },
  };
}
