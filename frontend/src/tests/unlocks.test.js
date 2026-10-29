import { describe, expect, it } from 'vitest';
import { getHero, HEROES } from '../data';
import { isUnlocked, playerLevel, unlockedHeroIds, zoneOfStage, zoneStageIds } from '../game/engine/unlocks';

const clearZone = (zoneNumber, count, stars = 1) =>
  Object.fromEntries(Array.from({ length: count }, (_, i) => [`z${zoneNumber}_s${i + 1}`, stars]));

describe('stage helpers', () => {
  it('maps stage ids to zones', () => {
    expect(zoneOfStage('z1_s3')).toBe('beach');
    expect(zoneOfStage('z4_s10')).toBe('ruins');
    expect(zoneOfStage('test')).toBe(null);
    expect(zoneOfStage('z9_s1')).toBe(null);
  });

  it('lists a zone’s stages', () => {
    expect(zoneStageIds('beach')).toEqual(['z1_s1', 'z1_s2', 'z1_s3', 'z1_s4', 'z1_s5']);
    expect(zoneStageIds('jungle')).toHaveLength(10);
  });

  it('player level is the highest hero level', () => {
    expect(playerLevel({ heroLevels: { red: 12, chuck: 7 } })).toBe(12);
    expect(playerLevel({})).toBe(0);
  });
});

describe('unlock rules', () => {
  it('start', () => {
    expect(isUnlocked({ type: 'start' }, {})).toBe(true);
  });

  it('stageClear needs at least one star on that stage', () => {
    const rule = { type: 'stageClear', stageId: 'z3_s10' };
    expect(isUnlocked(rule, { stageStars: { z3_s10: 1 } })).toBe(true);
    expect(isUnlocked(rule, { stageStars: { z3_s10: 0, z3_s9: 3 } })).toBe(false);
  });

  it('stageClearCount counts cleared stages of one zone', () => {
    const rule = { type: 'stageClearCount', zone: 'cave', count: 3 };
    expect(isUnlocked(rule, { stageStars: { z2_s1: 1, z2_s2: 2, z1_s1: 3 } })).toBe(false);
    expect(isUnlocked(rule, { stageStars: { z2_s1: 1, z2_s2: 2, z2_s5: 1 } })).toBe(true);
  });

  it('zoneClear needs every stage of the zone, with minStars when given', () => {
    expect(isUnlocked({ type: 'zoneClear', zone: 'jungle' }, { stageStars: clearZone(3, 9) })).toBe(false);
    expect(isUnlocked({ type: 'zoneClear', zone: 'jungle' }, { stageStars: clearZone(3, 10) })).toBe(true);
    const twoStars = { type: 'zoneClear', zone: 'jungle', minStars: 2 };
    expect(isUnlocked(twoStars, { stageStars: clearZone(3, 10, 1) })).toBe(false);
    expect(isUnlocked(twoStars, { stageStars: clearZone(3, 10, 2) })).toBe(true);
  });

  it('level and quest', () => {
    expect(isUnlocked({ type: 'level', level: 15 }, { heroLevels: { red: 15 } })).toBe(true);
    expect(isUnlocked({ type: 'level', level: 15 }, { heroLevels: { red: 14 } })).toBe(false);
    expect(isUnlocked({ type: 'quest', id: 'q_final' }, { quests: ['q_final'] })).toBe(true);
    expect(isUnlocked({ type: 'quest', id: 'q_final' }, {})).toBe(false);
  });

  it('all / any nest', () => {
    const rule = { type: 'all', of: [{ type: 'start' }, { type: 'any', of: [{ type: 'quest', id: 'a' }, { type: 'quest', id: 'b' }] }] };
    expect(isUnlocked(rule, { quests: ['b'] })).toBe(true);
    expect(isUnlocked(rule, { quests: [] })).toBe(false);
  });

  it('rejects unknown rule types', () => {
    expect(() => isUnlocked({ type: 'magic' }, {})).toThrow(/Unknown unlock rule/);
  });
});

describe('hero roster (PLAN 1.3.1)', () => {
  const unlocked = (progress) => unlockedHeroIds(HEROES, progress);

  it('starts with Red only', () => {
    expect(unlocked({})).toEqual(['red']);
  });

  it('Chuck joins after 3 Cave stages', () => {
    expect(unlocked({ stageStars: clearZone(2, 2) })).toEqual(['red']);
    expect(unlocked({ stageStars: clearZone(2, 3) })).toEqual(['red', 'chuck']);
  });

  it('Matilda joins on the last Jungle stage; Bomb also needs level 15', () => {
    const progress = { stageStars: { ...clearZone(2, 10), ...clearZone(3, 10) }, heroLevels: { red: 14 } };
    expect(unlocked(progress)).toEqual(['red', 'chuck', 'matilda']);
    expect(unlocked({ ...progress, heroLevels: { red: 15 } })).toEqual(['red', 'chuck', 'matilda', 'bomb']);
  });

  it('the Blues join on a 2-star Jungle clear or the final quest', () => {
    expect(isUnlocked(getHero('blues').unlock, { stageStars: clearZone(3, 10, 2) })).toBe(true);
    expect(isUnlocked(getHero('blues').unlock, { quests: ['q_final'] })).toBe(true);
    expect(isUnlocked(getHero('blues').unlock, { stageStars: clearZone(3, 10, 1) })).toBe(false);
  });
});
