// The battle as the HUD shows it. During playback it advances one engine event at a time
// (applyEvent); after every engine step it is rebuilt from the engine state (buildView), so
// the screen can never drift from the engine. Pure.
import { EVENT, SIDE } from '../config/constants';

function unitView(unit) {
  return {
    id: unit.id,
    side: unit.side,
    defId: unit.defId,
    name: unit.name,
    heroClass: unit.heroClass ?? null,
    tier: unit.tier ?? null,
    slot: unit.slot,
    hp: unit.hp,
    maxHp: unit.stats.maxHp,
    alive: unit.hp > 0,
    focus: unit.focus ?? null,
    rage: unit.rage ?? null,
    acted: unit.acted ?? false,
    skills: unit.skills,
    cooldowns: { ...unit.cooldowns },
    statuses: unit.statuses.map(({ id, turns }) => ({ id, turns })),
  };
}

export function buildView(state) {
  const units = {};
  for (const unit of [...state.heroes, ...state.enemies]) units[unit.id] = unitView(unit);
  return {
    round: state.round,
    phase: state.phase,
    waveIndex: state.waveIndex,
    waveCount: state.waves.length,
    waveSize: state.waves[state.waveIndex].enemies.length,
    heroIds: state.heroes.map((hero) => hero.id),
    enemyIds: state.enemies.map((enemy) => enemy.id),
    items: { ...state.items },
    units,
  };
}

const patchUnit = (view, id, patch) =>
  view.units[id] ? { ...view, units: { ...view.units, [id]: { ...view.units[id], ...patch } } } : view;

// Advances the view by one event. `next` is the engine state after the step (used only for
// the units of a new wave, which enter at full health).
export function applyEvent(view, event, next) {
  switch (event.type) {
    case EVENT.DAMAGE:
    case EVENT.HEAL:
      return patchUnit(view, event.targetId, { hp: event.hp, alive: event.hp > 0 });
    case EVENT.DEATH: {
      const unit = view.units[event.unitId];
      return patchUnit(view, event.unitId, {
        hp: 0,
        alive: false,
        statuses: [],
        ...(unit?.side === SIDE.HERO && { rage: 0 }),
      });
    }
    case EVENT.REVIVE:
      return patchUnit(view, event.unitId, { hp: event.hp, alive: true });
    case EVENT.STATUS: {
      const unit = view.units[event.targetId];
      if (!unit) return view;
      const statuses = [...unit.statuses.filter((status) => status.id !== event.status), { id: event.status, turns: event.turns }];
      return patchUnit(view, event.targetId, { statuses });
    }
    case EVENT.STATUS_END: {
      const unit = view.units[event.targetId];
      if (!unit) return view;
      return patchUnit(view, event.targetId, { statuses: unit.statuses.filter((status) => status.id !== event.status) });
    }
    case EVENT.WAVE_START: {
      const units = Object.fromEntries(Object.entries(view.units).filter(([, unit]) => unit.side === SIDE.HERO));
      for (const id of event.enemyIds) {
        const fresh = unitView(next.enemies.find((enemy) => enemy.id === id));
        units[id] = { ...fresh, hp: fresh.maxHp, alive: true, statuses: [], cooldowns: {} };
      }
      return { ...view, units, waveIndex: event.wave - 1, waveSize: event.enemyIds.length, enemyIds: event.enemyIds };
    }
    case EVENT.ROUND_START:
      return { ...view, round: event.round };
    case EVENT.PHASE:
      return { ...view, phase: event.phase };
    default:
      return view;
  }
}

// Differences between an event-driven view and the engine state (HP, life, statuses, units on
// the field). Empty when they agree.
export function viewMismatches(view, state) {
  const problems = [];
  const ids = (list) => list.map((unit) => unit.id).join(',');
  if (view.enemyIds.join(',') !== ids(state.enemies)) problems.push(`enemies ${view.enemyIds} vs ${ids(state.enemies)}`);
  for (const unit of [...state.heroes, ...state.enemies]) {
    const shown = view.units[unit.id];
    if (!shown) {
      problems.push(`${unit.id} missing`);
      continue;
    }
    if (shown.hp !== unit.hp) problems.push(`${unit.id} hp ${shown.hp} vs ${unit.hp}`);
    if (shown.alive !== unit.hp > 0) problems.push(`${unit.id} alive ${shown.alive}`);
    const statusIds = (list) => list.map((status) => status.id).sort().join(',');
    if (statusIds(shown.statuses) !== statusIds(unit.statuses)) {
      problems.push(`${unit.id} statuses ${statusIds(shown.statuses)} vs ${statusIds(unit.statuses)}`);
    }
  }
  return problems;
}
