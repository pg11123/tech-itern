// Schemas for the JSON data files (see schema.js for the spec format).
import {
  AI_PROFILE,
  ENEMY_TIER,
  HERO_CLASS,
  ITEM_TYPE,
  RARITY,
  SKILL_TYPE,
  STATUS_STACKING,
  TARGET,
  UNLOCK_TYPE,
  ZONE,
} from '../config/constants';

const STATS = {
  hp: 'number',
  atk: 'number',
  mag: 'number',
  def: 'number',
  res: 'number',
  spd: 'number',
  'critChance?': 'number',
  'critMult?': 'number',
};

// Unlock rules nest through `of` (all/any), so the spec refers to itself.
const UNLOCK = { shape: { type: { enum: Object.values(UNLOCK_TYPE) } } };
UNLOCK.shape['of?'] = { arrayOf: UNLOCK };

export const HERO = {
  id: 'string',
  name: 'string',
  class: { enum: Object.values(HERO_CLASS) },
  rarity: { enum: Object.values(RARITY) },
  unlock: UNLOCK,
  base: { shape: STATS },
  growth: 'object',
  attack: 'string',
  skills: { arrayOf: 'string' },
  sprite: 'string',
};

export const ENEMY = {
  id: 'string',
  name: 'string',
  tier: { enum: Object.values(ENEMY_TIER) },
  stats: { shape: STATS },
  attack: 'string',
  skills: { arrayOf: 'string' },
  'script?': {
    shape: { phases: { arrayOf: { shape: { 'atHpPct?': 'number', rotation: { arrayOf: 'string' } } } } },
  },
  ai: { enum: Object.values(AI_PROFILE) },
  sprite: 'string',
  loot: { arrayOf: { shape: { item: 'string', chance: 'number', min: 'number', max: 'number' } } },
  xp: 'number',
  coins: 'number',
};

export const STAGE = {
  id: 'string',
  zone: { enum: Object.values(ZONE) },
  name: 'string',
  recommendedLevel: 'number',
  roundLimit: 'number',
  'stageIndex?': 'number',
  'fixedParty?': { arrayOf: { shape: { hero: 'string', level: 'number' } } },
  'items?': 'object', // consumables handed out for this stage (sandbox, tutorials)
  waves: { arrayOf: { shape: { enemies: { arrayOf: 'string' } } } },
  rewards: 'object',
  bg: 'string',
  music: 'string',
};

const EFFECT = {
  shape: {
    status: 'string',
    'chance?': 'number',
    'duration?': 'number',
    'power?': { shape: { stat: 'string', mult: 'number' } },
  },
};

export const SKILL = {
  id: 'string',
  name: 'string',
  type: { enum: Object.values(SKILL_TYPE) },
  target: { enum: Object.values(TARGET) },
  mult: 'number',
  focusCost: 'number',
  cooldown: 'number',
  effects: { arrayOf: EFFECT },
  anim: 'string',
  vfx: 'string',
  sfx: 'string',
  unlockLevel: 'number',
  'hits?': 'number',
  'critBonus?': 'number',
  'selfDamagePct?': 'number',
  'isUltimate?': 'boolean',
  'cleanse?': 'boolean',
};

export const STATUS = {
  id: 'string',
  name: 'string',
  negative: 'boolean',
  duration: 'number',
  stacking: { enum: Object.values(STATUS_STACKING) },
  'mods?': 'object',
  'skipsTurn?': 'boolean',
  'taunt?': 'boolean',
  'absorbs?': 'boolean',
  'dotPctMaxHp?': 'number',
};

export const ITEM = {
  id: 'string',
  name: 'string',
  type: { enum: Object.values(ITEM_TYPE) },
  target: { enum: [TARGET.ALLY_SINGLE, TARGET.ALLY_DEAD] },
  effect: {
    shape: { 'healPctMaxHp?': 'number', 'focus?': 'number', 'rage?': 'number', 'revivePctMaxHp?': 'number' },
  },
};
