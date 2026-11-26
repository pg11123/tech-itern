// Experience and levels (PLAN 1.3). Pure.
import { LEVEL_CAP, XP_BASE, XP_EXPONENT } from '../../config/balance';

// XP needed to go from `level` to `level + 1`.
export const xpNeeded = (level) => Math.round(XP_BASE * level ** XP_EXPONENT);

// Adds XP to a hero's { level, xp } progress and levels up as often as it allows.
export function addXp({ level, xp }, gained) {
  let current = level;
  let progress = xp + gained;
  while (current < LEVEL_CAP && progress >= xpNeeded(current)) {
    progress -= xpNeeded(current);
    current += 1;
  }
  if (current >= LEVEL_CAP) progress = 0;
  return { level: current, xp: progress, levelsGained: current - level };
}

// Splits XP evenly (rounded down) between the given heroes: { heroId: share }.
export function splitXp(total, heroIds) {
  if (heroIds.length === 0) return {};
  const share = Math.floor(total / heroIds.length);
  return Object.fromEntries(heroIds.map((id) => [id, share]));
}
