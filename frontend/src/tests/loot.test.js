import { describe, expect, it } from 'vitest';
import { mergeLoot, rollLoot } from '../game/engine/loot';
import { createRng } from '../game/engine/rng';

const table = [
  { item: 'mat_wood', chance: 1, min: 1, max: 3 },
  { item: 'mat_stone', chance: 0, min: 1, max: 1 },
  { item: 'potion', chance: 0.5, min: 1, max: 1 },
];

describe('rollLoot', () => {
  it('always drops chance 1, never drops chance 0, and keeps quantities in range', () => {
    const rng = createRng(9);
    for (let i = 0; i < 500; i += 1) {
      const drops = rollLoot(table, rng);
      const wood = drops.find((drop) => drop.item === 'mat_wood');
      expect(wood.qty).toBeGreaterThanOrEqual(1);
      expect(wood.qty).toBeLessThanOrEqual(3);
      expect(drops.some((drop) => drop.item === 'mat_stone')).toBe(false);
    }
  });

  it('is deterministic for a seed', () => {
    const roll = () => {
      const rng = createRng(4);
      return Array.from({ length: 10 }, () => rollLoot(table, rng));
    };
    expect(roll()).toEqual(roll());
  });

  it('drops nothing from an empty table', () => {
    expect(rollLoot([], createRng(1))).toEqual([]);
  });
});

describe('mergeLoot', () => {
  it('stacks the same item without changing the input', () => {
    const stacks = [{ item: 'mat_wood', qty: 2 }];
    const merged = mergeLoot(stacks, [{ item: 'mat_wood', qty: 3 }, { item: 'potion', qty: 1 }]);
    expect(merged).toEqual([{ item: 'mat_wood', qty: 5 }, { item: 'potion', qty: 1 }]);
    expect(stacks).toEqual([{ item: 'mat_wood', qty: 2 }]);
  });
});
