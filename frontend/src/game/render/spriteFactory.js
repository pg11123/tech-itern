// The only place unit visuals are created, so final art can replace the placeholders here
// without touching the scene. Returns { view, width, height } with the feet at (0, 0),
// facing the other side of the battlefield.
//
// Final art: when owner-supplied textures exist for `unit.sprite` (see ASSETS.md), build a
// Sprite / AnimatedSprite for it here and keep the same return shape.
import { SIDE } from '../../config/constants';
import { createBirdPlaceholder } from './placeholders/birdPlaceholder';
import { createPigPlaceholder } from './placeholders/pigPlaceholder';

export function createUnitSprite(unit, side) {
  return side === SIDE.HERO ? createBirdPlaceholder(unit.variant) : createPigPlaceholder(unit.variant);
}
