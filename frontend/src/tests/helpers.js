// Shared helpers for engine tests.
import { createBattle } from '../game/engine/battle';

// A small battle: Red L1 vs one Grunt unless overridden.
export const makeBattle = (overrides = {}, seed = 1) =>
  createBattle(
    { party: [{ hero: 'red', level: 1 }], waves: [{ enemies: ['grunt'] }], roundLimit: 10, ...overrides },
    seed,
  );

// Deep copy changed by `change(draft)`: sets up exact situations without touching the original.
export function edit(state, change) {
  const draft = structuredClone(state);
  change(draft);
  return draft;
}

export const unitOf = (state, id) => [...state.heroes, ...state.enemies].find((unit) => unit.id === id);
export const ofType = (events, type) => events.filter((event) => event.type === type);

// RNG stub: fixed variance, chance(p) is true when `roll` < p.
export const fixedRng = ({ variance = 1, roll = 0.5 } = {}) => ({
  next: () => roll,
  range: () => variance,
  chance: (p) => roll < p,
  int: (min) => min,
  pick: (list) => list[0],
});

export function deepFreeze(value) {
  if (value && typeof value === 'object' && !Object.isFrozen(value)) {
    Object.freeze(value);
    Object.values(value).forEach(deepFreeze);
  }
  return value;
}
