import { describe, expect, it } from 'vitest';
import { SIDE } from '../config/constants';
import { computeLetterbox, DESIGN_HEIGHT, DESIGN_WIDTH, getSlotPositions } from '../game/render/layout';

describe('getSlotPositions', () => {
  it.each([1, 2, 3, 4])('places %i heroes at x 22-38%% of the width', (count) => {
    const slots = getSlotPositions(SIDE.HERO, count);
    expect(slots).toHaveLength(count);
    for (const { x } of slots) {
      expect(x / DESIGN_WIDTH).toBeGreaterThanOrEqual(0.22);
      expect(x / DESIGN_WIDTH).toBeLessThanOrEqual(0.38);
    }
  });

  it.each([1, 2, 3, 4])('mirrors %i enemies to x 62-78%% of the width', (count) => {
    const heroes = getSlotPositions(SIDE.HERO, count);
    const enemies = getSlotPositions(SIDE.ENEMY, count);
    enemies.forEach(({ x, y }, i) => {
      expect(x).toBeCloseTo(DESIGN_WIDTH - heroes[i].x);
      expect(y).toBe(heroes[i].y);
      expect(x / DESIGN_WIDTH).toBeGreaterThanOrEqual(0.62);
      expect(x / DESIGN_WIDTH).toBeLessThanOrEqual(0.78);
    });
  });

  it('staggers four units over two rows and keeps them on the ground', () => {
    const slots = getSlotPositions(SIDE.HERO, 4);
    expect(new Set(slots.map((slot) => slot.y)).size).toBe(2);
    for (const { y } of slots) {
      expect(y / DESIGN_HEIGHT).toBeGreaterThan(0.6);
      expect(y / DESIGN_HEIGHT).toBeLessThan(0.9);
    }
  });

  it('returns no slots for an empty side', () => {
    expect(getSlotPositions(SIDE.ENEMY, 0)).toEqual([]);
  });
});

describe('computeLetterbox', () => {
  it('fits the width on a tall screen', () => {
    expect(computeLetterbox(800, 1000)).toEqual({ width: 800, height: 450, scale: 0.625 });
  });

  it('fits the height on a wide screen', () => {
    expect(computeLetterbox(2000, 720)).toEqual({ width: 1280, height: 720, scale: 1 });
  });

  it.each([
    [1366, 768],
    [390, 844],
    [1920, 1080],
    [3440, 1440],
  ])('keeps 16:9 inside a %ix%i viewport', (w, h) => {
    const box = computeLetterbox(w, h);
    expect(box.width).toBeLessThanOrEqual(w);
    expect(box.height).toBeLessThanOrEqual(h);
    expect(Math.abs(box.width / box.height - 16 / 9)).toBeLessThan(0.01);
    expect(box.scale).toBeCloseTo(box.width / DESIGN_WIDTH);
  });

  it('never returns a zero size (hidden container)', () => {
    const box = computeLetterbox(0, 0);
    expect(box.width).toBeGreaterThan(0);
    expect(box.height).toBeGreaterThan(0);
  });
});
