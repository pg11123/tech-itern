// Stage stars (PLAN 1.5): 1 = win, 2 = win with no hero down, 3 = that and within the round limit.
export function rateBattle({ victory, heroDowned, rounds, roundLimit }) {
  if (!victory) return 0;
  if (heroDowned) return 1;
  return rounds <= roundLimit ? 3 : 2;
}
