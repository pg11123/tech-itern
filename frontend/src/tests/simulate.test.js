import { describe, expect, it } from 'vitest';
import { simulateBattles } from '../game/sim/simulate';

const BATTLES = 1000;

describe('headless simulation', () => {
  it(`plays ${BATTLES} random battles without exceptions or broken numbers`, () => {
    const summary = simulateBattles(BATTLES, 2026);
    console.log('simulation summary', summary);
    expect(summary.victory + summary.defeat + summary.stalemate).toBe(BATTLES);
  }, 120000);
});
