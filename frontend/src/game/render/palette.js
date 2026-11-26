// Colours and status icon looks shared by the Pixi scene and the React HUD (no Pixi imports).
import { HERO_CLASS } from '../../config/constants';

export const HERO_COLOR = {
  [HERO_CLASS.VANGUARD]: 0xd6322a,
  [HERO_CLASS.ARCANIST]: 0xf5c623,
  [HERO_CLASS.MENDER]: 0xf3f0e6,
  [HERO_CLASS.DEMOLISHER]: 0x2b2c35,
  [HERO_CLASS.SKIRMISHER]: 0x45a1df,
};

// Status badges: colour + shape (Pixi) + glyph (HUD). Shapes differ, so colour is not the only cue.
export const STATUS_LOOK = {
  stun: { color: 0xf2c230, shape: 'star', glyph: '★' },
  bleed: { color: 0xc0392b, shape: 'drop', glyph: '♦' },
  shield: { color: 0x3b82f6, shape: 'shield', glyph: '⬢' },
  taunt: { color: 0xf97316, shape: 'bang', glyph: '!' },
  buffAtk: { color: 0xe11d48, shape: 'up', glyph: '▲' },
  buffDef: { color: 0x0ea5e9, shape: 'up', glyph: '▲' },
  weak: { color: 0x8b5cf6, shape: 'down', glyph: '▼' },
  defend: { color: 0x64748b, shape: 'square', glyph: '■' },
};

export const UNKNOWN_STATUS_LOOK = { color: 0x9ca3af, shape: 'dot', glyph: '•' };

export const statusLook = (id) => STATUS_LOOK[id] ?? UNKNOWN_STATUS_LOOK;

export const cssColor = (hex) => `#${hex.toString(16).padStart(6, '0')}`;
