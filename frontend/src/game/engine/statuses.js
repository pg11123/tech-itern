// Status effects on a unit (statuses.json). These helpers mutate the unit they get, so the
// engine only calls them on its own draft copy of the battle state.
//
// Durations count the affected unit's own turns: a status ticks down at the end of each turn
// the unit takes (or skips). A status applied during the unit's own turn gets one extra tick,
// so that turn does not count. Re-applying refreshes the status instead of stacking it.
import { getStatus } from '../../data';

export const findStatus = (unit, id) => unit.statuses.find((status) => status.id === id);

// First active status with the given behaviour flag (skipsTurn, taunt, absorbs...), if any.
export const findFlag = (unit, flag) => unit.statuses.find((status) => Boolean(getStatus(status.id)[flag]));
export const hasFlag = (unit, flag) => Boolean(findFlag(unit, flag));

// Product of all active status multipliers for one stat ("atk", "def"...).
export function statMultiplier(unit, stat) {
  return unit.statuses.reduce((mult, status) => mult * (getStatus(status.id).mods?.[stat] ?? 1), 1);
}

export const effectiveStat = (unit, stat) => unit.stats[stat] * statMultiplier(unit, stat);

export function applyStatus(unit, id, { turns, value, ownTurn = false } = {}) {
  const duration = (turns ?? getStatus(id).duration) + (ownTurn ? 1 : 0);
  const instance = value === undefined ? { id, turns: duration } : { id, turns: duration, value };
  const index = unit.statuses.findIndex((status) => status.id === id);
  if (index >= 0) unit.statuses[index] = instance;
  else unit.statuses.push(instance);
  return instance;
}

export function removeStatus(unit, id) {
  unit.statuses = unit.statuses.filter((status) => status.id !== id);
}

// Removes negative statuses (cleanse); returns the removed ids.
export function removeNegative(unit) {
  const removed = unit.statuses.filter((status) => getStatus(status.id).negative).map((status) => status.id);
  unit.statuses = unit.statuses.filter((status) => !removed.includes(status.id));
  return removed;
}

// End-of-turn countdown; returns the ids that expired.
export function tickStatuses(unit) {
  for (const status of unit.statuses) status.turns -= 1;
  const expired = unit.statuses.filter((status) => status.turns <= 0).map((status) => status.id);
  unit.statuses = unit.statuses.filter((status) => status.turns > 0);
  return expired;
}

// Damage-over-time for this turn end (bleed): max HP share, at least 1.
export function dotDamage(unit) {
  const pct = unit.statuses.reduce((sum, status) => sum + (getStatus(status.id).dotPctMaxHp ?? 0), 0);
  return pct > 0 ? Math.max(1, Math.round(unit.stats.maxHp * pct)) : 0;
}

// Shields soak damage first. Returns how much was absorbed and the ids of shields that broke.
export function absorbDamage(unit, amount) {
  let absorbed = 0;
  for (const status of unit.statuses) {
    if (!getStatus(status.id).absorbs || absorbed >= amount) continue;
    const take = Math.min(status.value ?? 0, amount - absorbed);
    status.value = (status.value ?? 0) - take;
    absorbed += take;
  }
  const broken = unit.statuses
    .filter((status) => getStatus(status.id).absorbs && status.value <= 0)
    .map((status) => status.id);
  if (broken.length) unit.statuses = unit.statuses.filter((status) => !broken.includes(status.id));
  return { absorbed, broken };
}
