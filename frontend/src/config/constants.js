// Enums shared across the app. Use these instead of raw strings.

export const HERO_CLASS = Object.freeze({
  VANGUARD: 'vanguard',
  ARCANIST: 'arcanist',
  MENDER: 'mender',
  DEMOLISHER: 'demolisher',
  SKIRMISHER: 'skirmisher',
});

export const ENEMY_TIER = Object.freeze({
  MINION: 'minion',
  ELITE: 'elite',
  BOSS: 'boss',
});

export const AI_PROFILE = Object.freeze({
  AGGRESSIVE: 'aggressive',
  RANDOM: 'random',
  FOCUS_HEALER: 'focusHealer',
  BOSS_SCRIPT: 'bossScript',
});

export const RARITY = Object.freeze({
  COMMON: 'common',
  RARE: 'rare',
  EPIC: 'epic',
});

export const UNLOCK_TYPE = Object.freeze({
  START: 'start',
  STAGE_CLEAR: 'stageClear',
  STAGE_CLEAR_COUNT: 'stageClearCount',
  ZONE_CLEAR: 'zoneClear',
  LEVEL: 'level',
  QUEST: 'quest',
  ALL: 'all',
  ANY: 'any',
});

export const ZONE = Object.freeze({
  BEACH: 'beach',
  CAVE: 'cave',
  JUNGLE: 'jungle',
  RUINS: 'ruins',
});

// Campaign order: stage ids are z{index + 1}_s{n}.
export const ZONE_ORDER = Object.freeze([ZONE.BEACH, ZONE.CAVE, ZONE.JUNGLE, ZONE.RUINS]);

export const BATTLE_PHASE = Object.freeze({
  PLAYER_TURN: 'PLAYER_TURN',
  ENEMY_TURN: 'ENEMY_TURN',
  VICTORY: 'VICTORY',
  DEFEAT: 'DEFEAT',
});

export const ACTION = Object.freeze({
  ATTACK: 'attack',
  SKILL: 'skill',
  ITEM: 'item',
  DEFEND: 'defend',
});

export const SKILL_TYPE = Object.freeze({
  PHYSICAL: 'physical',
  MAGIC: 'magic',
  HEAL: 'heal',
  SUPPORT: 'support',
});

export const TARGET = Object.freeze({
  ENEMY_SINGLE: 'enemy_single',
  ENEMY_ALL: 'enemy_all',
  ENEMY_RANDOM_X3: 'enemy_random_x3',
  ALLY_SINGLE: 'ally_single',
  ALLY_ALL: 'ally_all',
  ALLY_DEAD: 'ally_dead',
  SELF: 'self',
});

export const TIMING = Object.freeze({
  MISS: 'miss',
  GOOD: 'good',
  GREAT: 'great',
});

export const ITEM_TYPE = Object.freeze({
  CONSUMABLE: 'consumable',
});

export const STATUS_STACKING = Object.freeze({
  REFRESH: 'refresh',
});

// Status applied by the Defend action (defined in statuses.json).
export const DEFEND_STATUS = 'defend';

// Number of hits of the enemy_random_x3 target type.
export const RANDOM_TARGET_HITS = 3;

// In a boss script rotation, this entry means "the unit's own basic attack".
export const SCRIPT_BASIC_ATTACK = 'attack';

export const DAMAGE_KIND = Object.freeze({
  PHYSICAL: 'physical',
  MAGIC: 'magic',
  BLEED: 'bleed',
  SELF: 'self',
});

export const BATTLE_OUTCOME = Object.freeze({
  VICTORY: 'victory',
  DEFEAT: 'defeat',
});

// Battle events, consumed in order by the renderer.
export const EVENT = Object.freeze({
  ROUND_START: 'roundStart',
  PHASE: 'phase',
  WAVE_START: 'waveStart',
  WAVE_CLEARED: 'waveCleared',
  ACTION: 'action',
  DAMAGE: 'damage',
  HEAL: 'heal',
  STATUS: 'status',
  STATUS_END: 'statusEnd',
  DEATH: 'death',
  REVIVE: 'revive',
  SKIP: 'skip',
  BOSS_PHASE: 'bossPhase',
  VICTORY: 'victory',
  DEFEAT: 'defeat',
});

export const SIDE = Object.freeze({
  HERO: 'hero',
  ENEMY: 'enemy',
});

export const LANGUAGE = Object.freeze({
  EN: 'en',
  PL: 'pl',
});

export const DEFAULT_LANGUAGE = LANGUAGE.EN;

export const SANDBOX_STAGE_ID = 'test';

export const ROUTES = Object.freeze({
  HOME: '/',
  LOGIN: '/login',
  REGISTER: '/register',
  BATTLE: '/battle/:stageId',
});

export const battlePath = (stageId) => `/battle/${stageId}`;

export const STORAGE_KEYS = Object.freeze({
  SETTINGS: 'abece.settings',
});

// Battle screen input modes.
export const UI_MODE = Object.freeze({
  LOADING: 'loading',
  BUSY: 'busy', // banners and event playback: no input
  COMMAND: 'command', // choosing an action for the selected hero
  TARGET: 'target', // choosing a target for the pending action
  TIMING: 'timing', // attack timing bar
  OVER: 'over', // results
});

export const ACTION_MENU = Object.freeze({
  MAIN: 'main',
  SKILLS: 'skills',
  ITEMS: 'items',
});

export const TIMING_MODE = Object.freeze({
  MANUAL: 'manual',
  AUTO: 'auto',
});

export const BATTLE_SPEEDS = Object.freeze([1, 2]);
