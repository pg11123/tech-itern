// Loads the JSON data files, validates them once at startup and exposes lookups by id.
import { MAX_PARTY_SIZE, MAX_WAVE_ENEMIES } from '../config/balance';
import { SCRIPT_BASIC_ATTACK } from '../config/constants';
import enemiesJson from './enemies.json';
import heroesJson from './heroes.json';
import itemsJson from './items.json';
import { assertCollection } from './schema';
import { ENEMY, HERO, ITEM, SKILL, STAGE, STATUS } from './shapes';
import skillsJson from './skills.json';
import stagesJson from './stages.json';
import statusesJson from './statuses.json';

export const HEROES = assertCollection(heroesJson, HERO, 'heroes.json');
export const ENEMIES = assertCollection(enemiesJson, ENEMY, 'enemies.json');
export const STAGES = assertCollection(stagesJson, STAGE, 'stages.json');
export const SKILLS = assertCollection(skillsJson, SKILL, 'skills.json');
export const STATUSES = assertCollection(statusesJson, STATUS, 'statuses.json');
export const ITEMS = assertCollection(itemsJson, ITEM, 'items.json');

const indexById = (records) => new Map(records.map((record) => [record.id, record]));
const heroesById = indexById(HEROES);
const enemiesById = indexById(ENEMIES);
const stagesById = indexById(STAGES);
const skillsById = indexById(SKILLS);
const statusesById = indexById(STATUSES);
const itemsById = indexById(ITEMS);

export const getHero = (id) => heroesById.get(id);
export const getEnemy = (id) => enemiesById.get(id);
export const getStage = (id) => stagesById.get(id);
export const getSkill = (id) => skillsById.get(id);
export const getStatus = (id) => statusesById.get(id);
export const getItem = (id) => itemsById.get(id);

// References between files and battlefield capacity.
function checkReferences() {
  const errors = [];
  const needSkill = (id, where) => {
    if (!skillsById.has(id)) errors.push(`${where}: unknown skill "${id}"`);
  };

  for (const stage of STAGES) {
    const where = `stages.json "${stage.id}"`;
    if (stage.waves.length === 0) errors.push(`${where}: needs at least one wave`);
    stage.waves.forEach((wave, i) => {
      const count = wave.enemies.length;
      if (count === 0 || count > MAX_WAVE_ENEMIES) {
        errors.push(`${where} wave ${i + 1}: needs 1-${MAX_WAVE_ENEMIES} enemies`);
      }
      for (const id of wave.enemies) {
        if (!enemiesById.has(id)) errors.push(`${where} wave ${i + 1}: unknown enemy "${id}"`);
      }
    });
    const party = stage.fixedParty ?? [];
    if (party.length > MAX_PARTY_SIZE) errors.push(`${where}: fixedParty over ${MAX_PARTY_SIZE} heroes`);
    for (const { hero } of party) {
      if (!heroesById.has(hero)) errors.push(`${where}: unknown hero "${hero}"`);
    }
  }

  for (const hero of HEROES) {
    needSkill(hero.attack, `heroes.json "${hero.id}" attack`);
    for (const id of hero.skills) needSkill(id, `heroes.json "${hero.id}"`);
  }

  for (const enemy of ENEMIES) {
    const where = `enemies.json "${enemy.id}"`;
    needSkill(enemy.attack, `${where} attack`);
    for (const id of enemy.skills) needSkill(id, where);
    for (const phase of enemy.script?.phases ?? []) {
      for (const id of phase.rotation) if (id !== SCRIPT_BASIC_ATTACK) needSkill(id, `${where} script`);
    }
  }

  for (const skill of SKILLS) {
    for (const effect of skill.effects) {
      if (!statusesById.has(effect.status)) errors.push(`skills.json "${skill.id}": unknown status "${effect.status}"`);
    }
  }

  if (errors.length) throw new Error(`Invalid game data:\n${errors.join('\n')}`);
}

checkReferences();
