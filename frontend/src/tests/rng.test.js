import { describe, expect, it } from 'vitest';
import { createRng } from '../game/engine/rng';

const take = (rng, n) => Array.from({ length: n }, () => rng.next());

describe('createRng (mulberry32)', () => {
  it('matches the reference mulberry32 output', () => {
    expect(createRng(1).next()).toBe(0.6270739405881613);
  });

  it('repeats the same sequence for the same seed', () => {
    expect(take(createRng(42), 50)).toEqual(take(createRng(42), 50));
  });

  it('gives different sequences for different seeds', () => {
    expect(take(createRng(1), 10)).not.toEqual(take(createRng(2), 10));
  });

  it('returns floats in [0, 1)', () => {
    const values = take(createRng(7), 10000);
    expect(Math.min(...values)).toBeGreaterThanOrEqual(0);
    expect(Math.max(...values)).toBeLessThan(1);
  });

  it('int() stays inside the inclusive bounds and reaches both ends', () => {
    const rng = createRng(3);
    const seen = new Set(Array.from({ length: 2000 }, () => rng.int(1, 6)));
    expect([...seen].sort()).toEqual([1, 2, 3, 4, 5, 6]);
  });

  it('range() stays inside [min, max)', () => {
    const rng = createRng(11);
    for (let i = 0; i < 2000; i += 1) {
      const value = rng.range(0.92, 1.08);
      expect(value).toBeGreaterThanOrEqual(0.92);
      expect(value).toBeLessThan(1.08);
    }
  });

  it('chance() respects 0 and 1 and pick() returns list items', () => {
    const rng = createRng(5);
    expect(rng.chance(0)).toBe(false);
    expect(rng.chance(1)).toBe(true);
    expect(['a', 'b', 'c']).toContain(rng.pick(['a', 'b', 'c']));
  });

  it('resumes the exact sequence from a saved state', () => {
    const rng = createRng(99);
    take(rng, 5);
    const resumed = createRng(rng.state());
    expect(take(resumed, 20)).toEqual(take(rng, 20));
  });
});
