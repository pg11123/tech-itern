// Evaluates hero `unlock` rules (heroes.json) against player progress. Pure.
//
// progress = {
//   stageStars: { z2_s1: 3, ... },   // best stars per cleared stage (0 = not cleared)
//   heroLevels: { red: 12, ... },    // owned heroes; player level = the highest
//   quests: ['q_final', ...],        // completed quest ids
// }
import { ZONE_STAGE_COUNT } from '../../config/balance';
import { UNLOCK_TYPE, ZONE_ORDER } from '../../config/constants';

const STAGE_ID = /^z(\d+)_s(\d+)$/;

export function zoneOfStage(stageId) {
  const match = STAGE_ID.exec(stageId);
  return match ? (ZONE_ORDER[Number(match[1]) - 1] ?? null) : null;
}

export function zoneStageIds(zone) {
  const zoneNumber = ZONE_ORDER.indexOf(zone) + 1;
  return Array.from({ length: ZONE_STAGE_COUNT[zone] ?? 0 }, (_, i) => `z${zoneNumber}_s${i + 1}`);
}

export const playerLevel = (progress) => Math.max(0, ...Object.values(progress.heroLevels ?? {}));

const starsOf = (progress, stageId) => progress.stageStars?.[stageId] ?? 0;

export function isUnlocked(rule, progress) {
  switch (rule.type) {
    case UNLOCK_TYPE.START:
      return true;
    case UNLOCK_TYPE.STAGE_CLEAR:
      return starsOf(progress, rule.stageId) >= 1;
    case UNLOCK_TYPE.STAGE_CLEAR_COUNT: {
      const cleared = Object.keys(progress.stageStars ?? {}).filter(
        (stageId) => zoneOfStage(stageId) === rule.zone && starsOf(progress, stageId) >= 1,
      );
      return cleared.length >= rule.count;
    }
    case UNLOCK_TYPE.ZONE_CLEAR: {
      const stages = zoneStageIds(rule.zone);
      return stages.length > 0 && stages.every((stageId) => starsOf(progress, stageId) >= (rule.minStars ?? 1));
    }
    case UNLOCK_TYPE.LEVEL:
      return playerLevel(progress) >= rule.level;
    case UNLOCK_TYPE.QUEST:
      return (progress.quests ?? []).includes(rule.id);
    case UNLOCK_TYPE.ALL:
      return rule.of.every((inner) => isUnlocked(inner, progress));
    case UNLOCK_TYPE.ANY:
      return rule.of.some((inner) => isUnlocked(inner, progress));
    default:
      throw new Error(`Unknown unlock rule type "${rule.type}"`);
  }
}

// Ids of the heroes whose unlock rule passes for this progress.
export const unlockedHeroIds = (heroes, progress) =>
  heroes.filter((hero) => isUnlocked(hero.unlock, progress)).map((hero) => hero.id);
