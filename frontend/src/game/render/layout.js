// Battlefield geometry in design pixels (1280x720, scaled to fit the screen).
// Pure: no Pixi imports, so it can be unit-tested.
import { SIDE } from '../../config/constants';

export const DESIGN_WIDTH = 1280;
export const DESIGN_HEIGHT = 720;

// Design pixels from a unit's feet up to the middle of its body.
export const UNIT_BODY_LIFT = 46;

// Feet positions as fractions of the design size, front-most slot first.
// Heroes stand at x 22-38%, staggered in two rows; enemies mirror them (x 62-78%).
// Rows stay above y 82% so the hero cards at the bottom of the HUD never cover a unit.
const FORMATIONS = {
  1: [{ x: 0.32, y: 0.7 }],
  2: [
    { x: 0.36, y: 0.64 },
    { x: 0.27, y: 0.76 },
  ],
  3: [
    { x: 0.37, y: 0.62 },
    { x: 0.31, y: 0.76 },
    { x: 0.24, y: 0.63 },
  ],
  4: [
    { x: 0.38, y: 0.62 },
    { x: 0.33, y: 0.76 },
    { x: 0.27, y: 0.62 },
    { x: 0.22, y: 0.76 },
  ],
};

export const MAX_SLOTS = Object.keys(FORMATIONS).length;

export function getSlotPositions(side, count) {
  if (count <= 0) return [];
  const formation = FORMATIONS[Math.min(count, MAX_SLOTS)];
  return formation.map(({ x, y }) => ({
    x: (side === SIDE.ENEMY ? 1 - x : x) * DESIGN_WIDTH,
    y: y * DESIGN_HEIGHT,
  }));
}

// Where a unit's body is, as percentages of the frame (for HUD elements placed over units).
export function unitAnchorPercent(side, count, slot, lift = UNIT_BODY_LIFT) {
  const { x, y } = getSlotPositions(side, count)[slot];
  return { left: (x / DESIGN_WIDTH) * 100, top: ((y - lift) / DESIGN_HEIGHT) * 100 };
}

// Largest 16:9 (design aspect) box that fits the viewport; the rest is letterbox.
export function computeLetterbox(viewWidth, viewHeight, designWidth = DESIGN_WIDTH, designHeight = DESIGN_HEIGHT) {
  const fit = Math.min(viewWidth / designWidth, viewHeight / designHeight);
  const width = Math.max(1, Math.floor(designWidth * fit));
  const height = Math.max(1, Math.floor(designHeight * fit));
  return { width, height, scale: width / designWidth };
}
