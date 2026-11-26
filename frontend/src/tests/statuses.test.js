import { describe, expect, it } from 'vitest';
import {
  absorbDamage,
  applyStatus,
  dotDamage,
  findFlag,
  hasFlag,
  removeNegative,
  statMultiplier,
  tickStatuses,
} from '../game/engine/statuses';

const unit = (maxHp = 100) => ({ stats: { maxHp, def: 10 }, statuses: [] });

describe('status effects', () => {
  it('takes the default duration from statuses.json', () => {
    const target = unit();
    applyStatus(target, 'bleed');
    expect(target.statuses).toEqual([{ id: 'bleed', turns: 3 }]);
  });

  it('refreshes instead of stacking', () => {
    const target = unit();
    applyStatus(target, 'bleed');
    tickStatuses(target);
    applyStatus(target, 'bleed');
    expect(target.statuses).toEqual([{ id: 'bleed', turns: 3 }]);
  });

  it('gives one extra tick when applied during the unit’s own turn', () => {
    const target = unit();
    applyStatus(target, 'taunt', { ownTurn: true });
    expect(target.statuses[0].turns).toBe(3);
  });

  it('expires after its duration in turns', () => {
    const target = unit();
    applyStatus(target, 'weak', { turns: 2 });
    expect(tickStatuses(target)).toEqual([]);
    expect(tickStatuses(target)).toEqual(['weak']);
    expect(target.statuses).toEqual([]);
  });

  it('multiplies stat modifiers of different statuses', () => {
    const target = unit();
    applyStatus(target, 'buffDef');
    applyStatus(target, 'defend');
    expect(statMultiplier(target, 'def')).toBeCloseTo(1.875);
    expect(statMultiplier(target, 'atk')).toBe(1);
  });

  it('finds behaviour flags', () => {
    const target = unit();
    applyStatus(target, 'stun');
    expect(hasFlag(target, 'skipsTurn')).toBe(true);
    expect(findFlag(target, 'skipsTurn').id).toBe('stun');
    expect(hasFlag(target, 'taunt')).toBe(false);
  });

  it('bleeds 5% of max HP, at least 1', () => {
    const big = unit(100);
    applyStatus(big, 'bleed');
    expect(dotDamage(big)).toBe(5);
    const tiny = unit(7);
    applyStatus(tiny, 'bleed');
    expect(dotDamage(tiny)).toBe(1);
    expect(dotDamage(unit())).toBe(0);
  });

  it('shields absorb damage and break when used up', () => {
    const target = unit();
    applyStatus(target, 'shield', { value: 30 });
    expect(absorbDamage(target, 20)).toEqual({ absorbed: 20, broken: [] });
    expect(target.statuses[0].value).toBe(10);
    expect(absorbDamage(target, 25)).toEqual({ absorbed: 10, broken: ['shield'] });
    expect(target.statuses).toEqual([]);
  });

  it('cleanse removes only negative statuses', () => {
    const target = unit();
    for (const id of ['stun', 'bleed', 'weak', 'buffAtk', 'shield']) applyStatus(target, id, { value: 5 });
    expect(removeNegative(target).sort()).toEqual(['bleed', 'stun', 'weak']);
    expect(target.statuses.map((status) => status.id).sort()).toEqual(['buffAtk', 'shield']);
  });
});
