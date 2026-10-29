import { describe, expect, it } from 'vitest';
import { SKILL_TYPE } from '../config/constants';
import { computeDamage, computeHeal, mitigation, rollDamage } from '../game/engine/damage';
import { createRng } from '../game/engine/rng';
import { fixedRng } from './helpers';

const unit = (stats = {}, statuses = []) => ({
  stats: { atk: 0, mag: 0, def: 0, res: 0, critChance: 0, critMult: 1.5, ...stats },
  statuses,
});
const hit = (attacker, defender, options = {}) =>
  computeDamage({ attacker, defender, type: SKILL_TYPE.PHYSICAL, mult: 1, rng: fixedRng(), ...options });

describe('mitigation', () => {
  it('is 100 / (100 + defense) and ignores negative defense', () => {
    expect(mitigation(0)).toBe(1);
    expect(mitigation(100)).toBe(0.5);
    expect(mitigation(-50)).toBe(1);
  });
});

describe('computeDamage', () => {
  it('physical: atk * mult * 100 / (100 + def)', () => {
    expect(hit(unit({ atk: 20 }), unit({ def: 50 }), { mult: 1.5 })).toEqual({ amount: 20, crit: false });
  });

  it('magic uses mag against res', () => {
    const result = hit(unit({ atk: 100, mag: 30 }), unit({ def: 1000, res: 0 }), { type: SKILL_TYPE.MAGIC });
    expect(result.amount).toBe(30);
  });

  it('rounds to the nearest integer', () => {
    expect(hit(unit({ atk: 10 }), unit(), { mult: 1.04 }).amount).toBe(10);
    expect(hit(unit({ atk: 10 }), unit(), { mult: 1.06 }).amount).toBe(11);
  });

  it('never deals less than 1', () => {
    expect(hit(unit({ atk: 1 }), unit({ def: 1e6 })).amount).toBe(1);
    expect(hit(unit({ atk: 0 }), unit()).amount).toBe(1);
  });

  it('applies variance from the RNG', () => {
    const rng = fixedRng({ variance: 0.92 });
    expect(hit(unit({ atk: 100 }), unit(), { rng }).amount).toBe(92);
  });

  it('crits multiply by critMult; critBonus raises the chance', () => {
    const attacker = unit({ atk: 20, critChance: 1, critMult: 2 });
    expect(hit(attacker, unit())).toEqual({ amount: 40, crit: true });
    expect(hit(unit({ atk: 20 }), unit(), { critBonus: 1 }).crit).toBe(true);
    expect(hit(unit({ atk: 20, critChance: 0 }), unit()).crit).toBe(false);
  });

  it('multiplies by the timing bonus', () => {
    expect(hit(unit({ atk: 20 }), unit(), { bonusMult: 1.25 }).amount).toBe(25);
    expect(hit(unit({ atk: 20 }), unit(), { bonusMult: 0.8 }).amount).toBe(16);
  });

  it('uses status-modified stats (buffAtk, weak, defend)', () => {
    expect(hit(unit({ atk: 20 }, [{ id: 'buffAtk', turns: 2 }]), unit()).amount).toBe(25);
    expect(hit(unit({ atk: 20 }, [{ id: 'weak', turns: 2 }]), unit()).amount).toBe(15);
    expect(hit(unit({ atk: 30 }), unit({ def: 50 }, [{ id: 'defend', turns: 1 }])).amount).toBe(17);
  });

  it('stays inside the variance bounds with a seeded RNG and no crits', () => {
    const rng = createRng(77);
    for (let i = 0; i < 5000; i += 1) {
      const { amount } = rollDamage({ attack: 100, defense: 0, mult: 1, critChance: 0, critMult: 2, rng });
      expect(amount).toBeGreaterThanOrEqual(92);
      expect(amount).toBeLessThanOrEqual(108);
    }
  });

  it('crits at the expected rate and stay inside crit bounds', () => {
    const rng = createRng(78);
    let crits = 0;
    for (let i = 0; i < 5000; i += 1) {
      const { amount, crit } = rollDamage({ attack: 100, defense: 0, mult: 1, critChance: 0.3, critMult: 2, rng });
      if (crit) {
        crits += 1;
        expect(amount).toBeGreaterThanOrEqual(184);
        expect(amount).toBeLessThanOrEqual(216);
      } else {
        expect(amount).toBeLessThanOrEqual(108);
      }
    }
    expect(crits / 5000).toBeGreaterThan(0.27);
    expect(crits / 5000).toBeLessThan(0.33);
  });

  it('gives the same numbers for the same seed', () => {
    const roll = (seed) => {
      const rng = createRng(seed);
      return Array.from({ length: 20 }, () => rollDamage({ attack: 50, defense: 20, mult: 1.3, critChance: 0.2, critMult: 1.5, rng }));
    };
    expect(roll(5)).toEqual(roll(5));
  });
});

describe('computeHeal', () => {
  it('is mag * mult with no variance, boosted by buffAtk', () => {
    expect(computeHeal(unit({ mag: 20 }), 1.6)).toBe(32);
    expect(computeHeal(unit({ mag: 20 }, [{ id: 'buffAtk', turns: 2 }]), 1.6)).toBe(40);
  });
});
