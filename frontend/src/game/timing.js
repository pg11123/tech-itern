// Attack timing bar (PLAN 1.5): a cursor sweeps back and forth; where it stops sets the timing.
// Pure, so the bar's rules are unit-tested.
import { TIMING_BAR } from '../config/balance';
import { TIMING } from '../config/constants';

// Cursor position 0..1 after `elapsedMs`, bouncing between the ends.
export function cursorPosition(elapsedMs, sweepMs = TIMING_BAR.SWEEP_MS) {
  const phase = (Math.max(0, elapsedMs) / sweepMs) % 2;
  return phase <= 1 ? phase : 2 - phase;
}

export function timingAt(position) {
  const distance = Math.abs(position - 0.5);
  if (distance <= TIMING_BAR.GREAT_ZONE / 2) return TIMING.GREAT;
  if (distance <= TIMING_BAR.GOOD_ZONE / 2) return TIMING.GOOD;
  return TIMING.MISS;
}

export const timingExpired = (elapsedMs) => elapsedMs >= TIMING_BAR.SWEEP_MS * TIMING_BAR.MAX_SWEEPS;
