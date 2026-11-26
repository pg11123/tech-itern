// Plays engine events on the battle scene, one beat at a time: an action with everything it
// caused (hits, heals, statuses, deaths), or a single standalone event (skip, wave, round...).
// `onEvent(event)` updates the HUD view and returns it; animations read HP and statuses from
// that view and never touch battle state.
import { ACTION, DAMAGE_KIND, ENEMY_TIER, EVENT, SIDE, SKILL_TYPE } from '../../config/constants';
import { getSkill, getStatus } from '../../data';

const MELEE_ANIMS = new Set(['lunge', 'dash', 'leap']);
const BEAT_EFFECTS = new Set([
  EVENT.DAMAGE,
  EVENT.HEAL,
  EVENT.STATUS,
  EVENT.STATUS_END,
  EVENT.DEATH,
  EVENT.REVIVE,
  EVENT.BOSS_PHASE,
]);
const EFFECT_STAGGER = 0.08;
const BEAT_GAP = 0.12;

// Groups events into beats. Pure (tested).
export function toBeats(events) {
  const beats = [];
  let current = null;
  for (const event of events) {
    if (event.type === EVENT.ACTION) {
      current = { action: event, effects: [] };
      beats.push(current);
    } else if (current && BEAT_EFFECTS.has(event.type)) {
      current.effects.push(event);
    } else {
      current = null;
      beats.push({ action: null, effects: [event] });
    }
  }
  return beats;
}

const isBoss = (view, id) => view.units[id]?.tier === ENEMY_TIER.BOSS;
const statusIdsOf = (view, id) => (view.units[id]?.statuses ?? []).map((status) => status.id);
const jitter = () => (Math.random() - 0.5) * 24;

function damageText(ctx, event) {
  if (event.amount === 0) return [ctx.t('float.blocked'), 'info'];
  if (event.kind === DAMAGE_KIND.BLEED) return [String(event.amount), 'bleed'];
  if (event.kind === DAMAGE_KIND.SELF) return [String(event.amount), 'self'];
  return event.crit ? [`${event.amount}!`, 'crit'] : [String(event.amount), 'damage'];
}

async function playEffect(ctx, event, onEvent) {
  const view = onEvent(event);
  const id = event.targetId ?? event.unitId;
  const unit = ctx.views.get(id);
  const shown = view.units[id];
  const { effects, tweens } = ctx;

  switch (event.type) {
    case EVENT.DAMAGE: {
      if (!unit) break;
      const [text, kind] = damageText(ctx, event);
      effects.floatText(unit.home.x + jitter(), unit.headY - 6, text, kind);
      unit.setHp(shown.hp / shown.maxHp, tweens);
      if (event.crit || isBoss(view, event.targetId) || isBoss(view, event.sourceId)) ctx.shake(event.crit ? 11 : 6);
      if (event.kind !== DAMAGE_KIND.SELF && event.kind !== DAMAGE_KIND.BLEED) {
        effects.burst(unit.home.x, unit.home.y - 40, 'hit');
        await unit.flash(tweens);
      }
      break;
    }
    case EVENT.HEAL:
      if (!unit) break;
      effects.floatText(unit.home.x + jitter(), unit.headY - 6, `+${event.amount}`, 'heal');
      effects.burst(unit.home.x, unit.home.y - 30, 'sparkle');
      unit.setHp(shown.hp / shown.maxHp, tweens);
      break;
    case EVENT.STATUS:
      unit?.setStatuses(statusIdsOf(view, id));
      if (unit) effects.floatText(unit.home.x, unit.headY - 34, ctx.name('status', getStatus(event.status)), 'info');
      break;
    case EVENT.STATUS_END:
      unit?.setStatuses(statusIdsOf(view, id));
      break;
    case EVENT.DEATH:
      if (!unit) break;
      unit.setStatuses([]);
      if (shown.side === SIDE.ENEMY) effects.burst(unit.home.x, unit.home.y - 40, 'coin');
      await unit.setAlive(false, tweens);
      break;
    case EVENT.REVIVE:
      if (!unit) break;
      await unit.setAlive(true, tweens);
      unit.setHp(shown.hp / shown.maxHp, tweens);
      effects.burst(unit.home.x, unit.home.y - 30, 'sparkle');
      effects.floatText(unit.home.x, unit.headY - 10, ctx.t('float.revived'), 'info');
      break;
    case EVENT.BOSS_PHASE:
      if (!unit) break;
      ctx.shake(14);
      effects.floatText(unit.home.x, unit.headY - 20, ctx.t('float.enraged'), 'title');
      await unit.flash(tweens);
      break;
    case EVENT.SKIP:
      if (!unit) break;
      effects.burst(unit.home.x, unit.headY - 4, 'star');
      await effects.floatText(unit.home.x, unit.headY - 10, ctx.t('float.stunned'), 'info');
      break;
    case EVENT.WAVE_CLEARED:
      await tweens.wait(0.35);
      break;
    case EVENT.WAVE_START:
      await ctx.spawnWave(event, view);
      break;
    case EVENT.VICTORY:
      await Promise.all([...ctx.views.values()].filter((v) => v.side === SIDE.HERO && !v.isDowned()).map((v) => v.hop(tweens)));
      break;
    case EVENT.DEFEAT:
      await tweens.wait(0.4);
      break;
    default:
      break;
  }
  await tweens.wait(EFFECT_STAGGER);
}

async function playAction(ctx, { action, effects }, onEvent) {
  onEvent(action);
  const actor = ctx.views.get(action.actorId);
  const skill = action.skillId ? getSkill(action.skillId) : null;
  const target = action.targetId ? ctx.views.get(action.targetId) : null;

  if (skill?.isUltimate) await ctx.ultimate(actor, ctx.name('skill', skill));
  else if (skill && action.action === ACTION.SKILL) {
    ctx.effects.floatText(actor.home.x, actor.headY - 40, ctx.name('skill', skill), 'info');
  }

  const damaging = skill && (skill.type === SKILL_TYPE.PHYSICAL || skill.type === SKILL_TYPE.MAGIC);
  const melee = damaging && MELEE_ANIMS.has(skill.anim) && target && target !== actor;
  if (melee) await actor.moveTo(target.home, 0.6, ctx.tweens);
  else await actor.hop(ctx.tweens);

  for (const event of effects) await playEffect(ctx, event, onEvent);
  if (melee) await actor.returnHome(ctx.tweens);
  await ctx.tweens.wait(BEAT_GAP);
}

export async function playEvents(ctx, events, onEvent) {
  for (const beat of toBeats(events)) {
    if (ctx.isDisposed()) return;
    if (beat.action && ctx.views.has(beat.action.actorId)) await playAction(ctx, beat, onEvent);
    else for (const event of beat.effects) await playEffect(ctx, event, onEvent);
  }
}
