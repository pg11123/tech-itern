// Balance numbers live here (or in src/data/*.json), never inside game logic.

export const MAX_PARTY_SIZE = 4;
export const MAX_WAVE_ENEMIES = 4;

// Heroes: stat(level) = base + growth * (level - 1); xpNeeded(L) = round(XP_BASE * L ^ XP_EXPONENT).
export const LEVEL_CAP = 30;
export const XP_BASE = 50;
export const XP_EXPONENT = 1.5;

export const FOCUS = Object.freeze({
  START: 1,
  MAX: 5,
  PER_ROUND: 1,
  ON_DEFEND: 1,
  ON_HIT: 1,
});

export const RAGE = Object.freeze({
  MAX: 100,
  ON_DEAL: 10,
  ON_HIT: 15,
});

// dmg = attack * mult * DEF_SCALE / (DEF_SCALE + defense) * variance * (crit ? critMult : 1)
export const DAMAGE = Object.freeze({
  DEF_SCALE: 100,
  VARIANCE_MIN: 0.92,
  VARIANCE_MAX: 1.08,
  MIN: 1,
});

// Used when a unit's data omits them.
export const CRIT_DEFAULTS = Object.freeze({
  critChance: 0.08,
  critMult: 1.5,
});

// Basic-attack timing bar: Miss / Good / Great.
export const TIMING_MULT = Object.freeze({
  miss: 0.8,
  good: 1,
  great: 1.25,
});

// Enemy stats scale with the 0-based campaign stage index: 1 + 0.12 * stageIndex.
export const ENEMY_SCALING_PER_STAGE = 0.12;

// Global enemy tuning on top of enemies.json: damage dealt by enemy hits (3 = +200%) and
// enemy max HP (1.5 = +50%). Enemy heals and bleed are not multiplied.
export const ENEMY_DAMAGE_MULT = 3;
export const ENEMY_HP_MULT = 1.5;

// Enemy AI only heals an ally whose HP is below this share of max HP.
export const AI_HEAL_BELOW = 0.7;

// Self-damage (Bomb) never takes a hero below this HP.
export const SELF_DAMAGE_MIN_HP = 1;

// Stage counts per zone (MVP), used by zone-clear unlock rules.
export const ZONE_STAGE_COUNT = Object.freeze({
  beach: 5,
  cave: 10,
  jungle: 10,
  ruins: 10,
});

// Attack timing bar: the cursor sweeps across in SWEEP_MS. Zones are widths centred on the bar
// (share of its length). No tap after MAX_SWEEPS sweeps counts as a miss.
export const TIMING_BAR = Object.freeze({
  SWEEP_MS: 900,
  GREAT_ZONE: 0.14,
  GOOD_ZONE: 0.5,
  MAX_SWEEPS: 4,
});
