// One-line descriptions of skills and items built from their data, in the UI language.
import { SKILL_TYPE } from '../../config/constants';
import { getStatus } from '../../data';

const percent = (share) => Math.round(share * 100);

// e.g. "Physical · one enemy · 130% power · Stun 35%"
export function describeSkill(skill, t, name) {
  const parts = [t(`skillType.${skill.type}`), t(`target.${skill.target}`)];
  if (skill.type === SKILL_TYPE.PHYSICAL || skill.type === SKILL_TYPE.MAGIC || skill.type === SKILL_TYPE.HEAL) {
    parts.push(t('skill.power', { pct: percent(skill.mult) }));
  }
  if ((skill.hits ?? 1) > 1) parts.push(t('skill.hits', { hits: skill.hits }));
  for (const effect of skill.effects) {
    const status = name('status', getStatus(effect.status));
    parts.push(effect.chance === undefined ? status : `${status} ${percent(effect.chance)}%`);
  }
  if (skill.cleanse) parts.push(t('skill.cleanse'));
  if (skill.selfDamagePct) parts.push(t('skill.selfDamage', { pct: percent(skill.selfDamagePct) }));
  return parts.join(' · ');
}

export function describeItem(item, t) {
  const { effect } = item;
  const parts = [];
  if (effect.healPctMaxHp) parts.push(t('item.heal', { pct: percent(effect.healPctMaxHp) }));
  if (effect.revivePctMaxHp) parts.push(t('item.revive', { pct: percent(effect.revivePctMaxHp) }));
  if (effect.focus) parts.push(t('item.focus', { amount: effect.focus }));
  if (effect.rage) parts.push(t('item.rage', { amount: effect.rage }));
  return parts.join(' · ');
}
