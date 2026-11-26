import { describe, expect, it } from 'vitest';
import { LEVEL_CAP } from '../config/balance';
import { rateBattle } from '../game/engine/rating';
import { addXp, splitXp, xpNeeded } from '../game/engine/xp';

describe('xpNeeded', () => {
  it('is round(50 * L^1.5)', () => {
    expect(xpNeeded(1)).toBe(50);
    expect(xpNeeded(2)).toBe(141);
    expect(xpNeeded(10)).toBe(1581);
  });
});

describe('addXp', () => {
  it('keeps progress below the next level', () => {
    expect(addXp({ level: 1, xp: 0 }, 30)).toEqual({ level: 1, xp: 30, levelsGained: 0 });
  });

  it('levels up several times and keeps the remainder', () => {
    expect(addXp({ level: 1, xp: 10 }, 200)).toEqual({ level: 3, xp: 19, levelsGained: 2 });
  });

  it('stops at the level cap', () => {
    expect(addXp({ level: LEVEL_CAP - 1, xp: 0 }, 1e9)).toEqual({ level: LEVEL_CAP, xp: 0, levelsGained: 1 });
  });
});

describe('splitXp', () => {
  it('splits evenly, rounding down', () => {
    expect(splitXp(100, ['red', 'chuck', 'bomb'])).toEqual({ red: 33, chuck: 33, bomb: 33 });
    expect(splitXp(100, [])).toEqual({});
  });
});

describe('rateBattle', () => {
  const base = { victory: true, heroDowned: false, rounds: 5, roundLimit: 6 };

  it('gives 3 stars for a clean win inside the round limit', () => {
    expect(rateBattle(base)).toBe(3);
  });

  it('gives 2 stars when over the round limit, 1 when a hero went down, 0 on defeat', () => {
    expect(rateBattle({ ...base, rounds: 7 })).toBe(2);
    expect(rateBattle({ ...base, heroDowned: true })).toBe(1);
    expect(rateBattle({ ...base, victory: false })).toBe(0);
  });
});
