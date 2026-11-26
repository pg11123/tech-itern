// Pixi battle scene: draws a battle from engine state and plays engine events as animation.
// Rendering never mutates battle state; it reads the HUD view the controller hands it.
//
// Layers (back to front): background, units, HP bars / status badges, dim, spotlight, effects.
// `camera` zooms (ultimate cutscene) and `shaker` jitters (crits, boss hits).
import { Container, Graphics } from 'pixi.js';
import { SIDE } from '../../config/constants';
import { getStage } from '../../data';
import { createBackground } from './backgrounds';
import { createEffects } from './effects';
import { DESIGN_HEIGHT, DESIGN_WIDTH, getSlotPositions } from './layout';
import { playEvents } from './playback';
import { createTweenGroup, setAnimationPaused, setAnimationSpeed } from './tweens';
import { createUnitView } from './unitView';

const PHASE_STEP = 1.9; // de-syncs the idle bob between neighbours
const ULTIMATE_ZOOM = 1.15;
const DIM_ALPHA = 0.6;

const variantOf = (unit) => ({ variant: unit.heroClass ?? unit.tier });
const statusIds = (unit) => unit.statuses.map((status) => status.id);

export function createBattleScene({ app, world, battle, t, name }) {
  const tweens = createTweenGroup();
  const camera = new Container();
  const shaker = new Container();
  const background = createBackground(getStage(battle.stageId)?.bg);
  const unitLayer = new Container();
  unitLayer.sortableChildren = true;
  const overlayLayer = new Container();
  const dim = new Graphics().rect(-200, -200, DESIGN_WIDTH + 400, DESIGN_HEIGHT + 400).fill(0x000000);
  dim.alpha = 0;
  const spotlight = new Container();
  const fxLayer = new Container();
  shaker.addChild(background.view, unitLayer, overlayLayer, dim, spotlight, fxLayer);
  camera.addChild(shaker);
  world.addChild(camera);

  const effects = createEffects({ layer: fxLayer, tweens });
  const views = new Map();
  let disposed = false;
  let shaking = false;

  // `unit` is an engine unit or a HUD view unit (both carry side, slot, hp, maxHp, statuses).
  function addUnit(unit, count) {
    const slot = getSlotPositions(unit.side, count)[unit.slot];
    const phase = unit.slot * PHASE_STEP + (unit.side === SIDE.ENEMY ? 0.8 : 0);
    const unitView = createUnitView({ unit: variantOf(unit), side: unit.side, ...slot, phase });
    const maxHp = unit.maxHp ?? unit.stats.maxHp;
    unitView.setHp(unit.hp / maxHp);
    unitView.setStatuses(statusIds(unit));
    if (unit.hp <= 0) unitView.setAlive(false);
    unitLayer.addChild(unitView.view);
    overlayLayer.addChild(unitView.overlay);
    views.set(unit.id, unitView);
    return unitView;
  }

  function removeUnit(id) {
    const unitView = views.get(id);
    unitView.view.destroy({ children: true, context: true });
    unitView.overlay.destroy({ children: true, context: true });
    views.delete(id);
  }

  for (const hero of battle.heroes) addUnit(hero, battle.heroes.length);
  for (const enemy of battle.enemies) addUnit(enemy, battle.waves[battle.waveIndex].enemies.length);

  function shake(strength) {
    if (shaking) return;
    shaking = true;
    tweens
      .to(shaker, { x: strength, y: strength * 0.4, duration: 0.04, yoyo: true, repeat: 5, ease: 'none' })
      .then(() => {
        shaker.position.set(0, 0);
        shaking = false;
      });
  }

  // Rage ultimate: zoom on the hero, dim everything else, show the skill name.
  async function ultimate(actor, title) {
    spotlight.addChild(actor.view);
    camera.pivot.set(actor.home.x, actor.home.y - 60);
    camera.position.set(actor.home.x, actor.home.y - 60);
    await Promise.all([
      tweens.to(dim, { alpha: DIM_ALPHA, duration: 0.25 }),
      tweens.to(camera.scale, { x: ULTIMATE_ZOOM, y: ULTIMATE_ZOOM, duration: 0.3, ease: 'power2.out' }),
    ]);
    effects.floatText(actor.home.x, actor.headY - 50, title, 'title');
    await tweens.wait(0.6);
    await Promise.all([
      tweens.to(dim, { alpha: 0, duration: 0.25 }),
      tweens.to(camera.scale, { x: 1, y: 1, duration: 0.25, ease: 'power2.in' }),
    ]);
    camera.pivot.set(0, 0);
    camera.position.set(0, 0);
    unitLayer.addChild(actor.view);
  }

  async function spawnWave(event, view) {
    for (const [id, unitView] of views) if (unitView.side === SIDE.ENEMY) removeUnit(id);
    const entering = event.enemyIds.map((id) => addUnit(view.units[id], view.waveSize));
    await Promise.all(entering.map((unitView) => unitView.enter(tweens)));
  }

  const ctx = {
    views,
    effects,
    tweens,
    t,
    name,
    shake,
    ultimate,
    spawnWave,
    isDisposed: () => disposed,
  };

  let seconds = 0;
  const tick = (ticker) => {
    seconds += ticker.deltaMS / 1000;
    background.update(seconds);
    for (const unitView of views.values()) unitView.update(seconds);
  };
  app.ticker.add(tick);

  return {
    playEvents: (events, onEvent) => playEvents(ctx, events, onEvent),

    // Snap every unit to the HUD view (exact HP, statuses, life; drops units no longer on the field).
    sync(view) {
      for (const id of [...views.keys()]) if (!view.units[id]) removeUnit(id);
      for (const unit of Object.values(view.units)) {
        const unitView = views.get(unit.id) ?? addUnit(unit, unit.side === SIDE.HERO ? view.heroIds.length : view.waveSize);
        unitView.setHp(unit.hp / unit.maxHp);
        unitView.setStatuses(statusIds(unit));
        if (unit.alive === unitView.isDowned()) unitView.setAlive(unit.alive);
      }
    },

    setSelected(id) {
      for (const [unitId, unitView] of views) unitView.setSelected(unitId === id);
    },

    setPaused(paused) {
      setAnimationPaused(paused);
      if (paused) app.ticker.stop();
      else app.ticker.start();
    },

    setSpeed: setAnimationSpeed,
    wait: (duration) => tweens.wait(duration),

    destroy() {
      disposed = true;
      tweens.killAll();
      setAnimationPaused(false);
      setAnimationSpeed(1);
      app.ticker.remove(tick);
      camera.destroy({ children: true, context: true });
      background.destroy();
      effects.destroy();
    },
  };
}
