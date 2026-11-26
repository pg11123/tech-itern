// Sandbox helpers: `/battle/test?party=red,chuck,blues` picks the heroes. Pure.
import { MAX_PARTY_SIZE } from '../config/balance';
import { getHero } from '../data';

// Party from the ?party= list (known heroes, no duplicates, max 4) or the stage's fixed party.
// Heroes keep their fixed-party level; others use the first fixed-party level.
export function resolveParty(stage, partyParam) {
  const base = stage.fixedParty ?? [];
  const ids = [...new Set((partyParam ?? '').split(',').map((id) => id.trim()))]
    .filter((id) => getHero(id))
    .slice(0, MAX_PARTY_SIZE);
  if (ids.length === 0) return base;
  const defaultLevel = base[0]?.level ?? 1;
  return ids.map((hero) => ({ hero, level: base.find((member) => member.hero === hero)?.level ?? defaultLevel }));
}

// Seed from ?seed= when it is a whole number, otherwise null (pick a random one).
export function parseSeed(seedParam) {
  if (seedParam === null || seedParam === undefined || seedParam.trim() === '') return null;
  const seed = Number(seedParam);
  return Number.isInteger(seed) && seed >= 0 ? seed >>> 0 : null;
}
