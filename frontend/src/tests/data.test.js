import { describe, expect, it } from 'vitest';
import { ENEMY_TIER, HERO_CLASS, SANDBOX_STAGE_ID, UNLOCK_TYPE } from '../config/constants';
import { ENEMIES, getSkill, getStage, HEROES, STAGES, STATUSES } from '../data';
import { assertCollection, validate } from '../data/schema';
import { parseSeed, resolveParty } from '../game/sandbox';

describe('game data', () => {
  it('ships five heroes, one per class', () => {
    expect(HEROES).toHaveLength(5);
    expect(HEROES.map((hero) => hero.class).sort()).toEqual(Object.values(HERO_CLASS).sort());
  });

  it('starts with Red only', () => {
    const starters = HEROES.filter((hero) => hero.unlock.type === UNLOCK_TYPE.START);
    expect(starters.map((hero) => hero.id)).toEqual(['red']);
  });

  it('covers every enemy tier with the starter roster', () => {
    expect(new Set(ENEMIES.map((enemy) => enemy.tier))).toEqual(new Set(Object.values(ENEMY_TIER)));
  });

  it('has the sandbox stage', () => {
    expect(STAGES.map((stage) => stage.id)).toContain(SANDBOX_STAGE_ID);
  });

  it('gives every hero 3 skills + 1 Rage ultimate, unlocking at levels 1 / 5 / 10 / 15', () => {
    const heroSkills = HEROES.flatMap((hero) => hero.skills);
    expect(new Set(heroSkills).size).toBe(20);
    for (const hero of HEROES) {
      const skills = hero.skills.map(getSkill);
      expect(skills.map((skill) => skill.unlockLevel)).toEqual([1, 5, 10, 15]);
      expect(skills.map((skill) => Boolean(skill.isUltimate))).toEqual([false, false, false, true]);
      expect(skills.filter((skill) => !skill.isUltimate).every((skill) => skill.focusCost >= 1 && skill.focusCost <= 3)).toBe(true);
    }
  });

  it('defines every status from the plan', () => {
    const ids = STATUSES.map((status) => status.id);
    for (const id of ['stun', 'bleed', 'shield', 'taunt', 'buffAtk', 'buffDef', 'weak']) expect(ids).toContain(id);
  });

  it('gives the boss a two-phase script', () => {
    const boss = ENEMIES.find((enemy) => enemy.tier === ENEMY_TIER.BOSS);
    expect(boss.ai).toBe('bossScript');
    expect(boss.script.phases).toHaveLength(2);
    expect(boss.script.phases[1].atHpPct).toBe(0.5);
  });
});

describe('schema checker', () => {
  const shape = { id: 'string', hp: 'number', 'note?': 'string', tags: { arrayOf: 'string' } };

  it('accepts a valid record and a missing optional field', () => {
    expect(validate({ id: 'a', hp: 1, tags: [] }, { shape })).toEqual([]);
  });

  it('reports missing, mistyped and non-finite fields', () => {
    const errors = validate({ hp: Number.NaN, note: 3, tags: ['x', 2] }, { shape });
    expect(errors).toEqual(['$.id: missing', '$.hp: expected number', '$.note: expected string', '$.tags[1]: expected string']);
  });

  it('checks enums', () => {
    expect(validate('mage', { enum: ['vanguard'] })).toEqual(['$: expected one of vanguard']);
  });

  it('rejects duplicate ids', () => {
    expect(() => assertCollection([{ id: 'a' }, { id: 'a' }], { id: 'string' }, 'test.json')).toThrow(/duplicate id "a"/);
  });
});

describe('sandbox helpers', () => {
  const sandbox = getStage(SANDBOX_STAGE_ID);

  it('is a 3-wave stage with a full party', () => {
    expect(sandbox.waves).toHaveLength(3);
    expect(sandbox.fixedParty).toHaveLength(4);
  });

  it('uses the fixed party when ?party= is missing or useless', () => {
    expect(resolveParty(sandbox, null)).toEqual(sandbox.fixedParty);
    expect(resolveParty(sandbox, 'nobody,,')).toEqual(sandbox.fixedParty);
  });

  it('drops unknown and duplicate heroes, caps the party at four and keeps levels', () => {
    const party = resolveParty(sandbox, 'blues, red,nobody,red,chuck,matilda,bomb');
    expect(party.map((member) => member.hero)).toEqual(['blues', 'red', 'chuck', 'matilda']);
    expect(party.every((member) => member.level === sandbox.fixedParty[0].level)).toBe(true);
  });

  it('accepts only whole, non-negative seeds', () => {
    expect(parseSeed('42')).toBe(42);
    expect(parseSeed(null)).toBe(null);
    expect(parseSeed('')).toBe(null);
    expect(parseSeed('-1')).toBe(null);
    expect(parseSeed('1.5')).toBe(null);
    expect(parseSeed('abc')).toBe(null);
  });
});
