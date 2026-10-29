import { useMemo } from 'react';
import { RAGE } from '../../config/balance';
import { ACTION, ACTION_MENU, UI_MODE } from '../../config/constants';
import { getItem, getSkill } from '../../data';
import { getLegalActions } from '../../game/engine/battle';
import { useName, useT } from '../../i18n/useT';
import { useBattleUiStore } from '../../store/useBattleUiStore';
import Button from '../ui/Button';
import { describeItem, describeSkill } from './skillText';

const PANEL = 'pointer-events-auto flex w-[19em] flex-col gap-[0.4em] rounded-[0.7em] border border-white/15 bg-black/70 p-[0.6em]';

// Why a skill cannot be used right now (null when it can).
function blockedReason(unit, skill, t) {
  const cooldown = unit.cooldowns[skill.id];
  if (cooldown) return t('skill.cooldown', { turns: cooldown });
  if (skill.isUltimate) return unit.rage >= RAGE.MAX ? null : t('skill.noRage');
  return unit.focus >= skill.focusCost ? null : t('skill.noFocus');
}

function ListButton({ title, cost, detail, disabled, onClick }) {
  return (
    <button
      type="button"
      disabled={disabled}
      onClick={onClick}
      className="flex flex-col rounded-[0.5em] border border-white/15 bg-black/50 px-[0.7em] py-[0.4em] text-left transition enabled:hover:border-amber-400 disabled:opacity-45"
    >
      <span className="flex items-baseline justify-between gap-[0.6em]">
        <span className="font-bold">{title}</span>
        <span className="shrink-0 text-[0.75em] text-sky-300">{cost}</span>
      </span>
      <span className="text-[0.72em] leading-snug text-stone-300">{detail}</span>
    </button>
  );
}

export default function ActionMenu() {
  const t = useT();
  const name = useName();
  const { mode, heroId, menu, battle, view, controller } = useBattleUiStore();
  const legal = useMemo(() => (battle && heroId ? getLegalActions(battle, heroId) : []), [battle, heroId]);

  if (!heroId || !controller || (mode !== UI_MODE.COMMAND && mode !== UI_MODE.TARGET)) return null;
  const hero = view.units[heroId];

  if (mode === UI_MODE.TARGET) {
    return (
      <div className={PANEL}>
        <p className="text-center font-bold">{t('hud.pickTarget')}</p>
        <Button onClick={() => controller.cancel()}>{t('common.cancel')}</Button>
      </div>
    );
  }

  const can = (match) => legal.some(match);

  if (menu === ACTION_MENU.SKILLS) {
    return (
      <div className={PANEL}>
        {hero.skills.map((skillId) => {
          const skill = getSkill(skillId);
          const reason = blockedReason(hero, skill, t);
          return (
            <ListButton
              key={skillId}
              title={name('skill', skill)}
              cost={skill.isUltimate ? t('skill.rageCost') : t('skill.focusCost', { cost: skill.focusCost })}
              detail={reason ?? describeSkill(skill, t, name)}
              disabled={!can((action) => action.skillId === skillId)}
              onClick={() => controller.choose({ type: ACTION.SKILL, skillId })}
            />
          );
        })}
        <Button onClick={() => controller.cancel()}>{t('common.back')}</Button>
      </div>
    );
  }

  if (menu === ACTION_MENU.ITEMS) {
    const items = Object.entries(view.items).filter(([, count]) => count > 0);
    return (
      <div className={PANEL}>
        {items.length === 0 && <p className="text-center text-stone-400">{t('item.none')}</p>}
        {items.map(([itemId, count]) => {
          const item = getItem(itemId);
          return (
            <ListButton
              key={itemId}
              title={name('item', item)}
              cost={t('item.count', { count })}
              detail={describeItem(item, t)}
              disabled={!can((action) => action.itemId === itemId)}
              onClick={() => controller.choose({ type: ACTION.ITEM, itemId })}
            />
          );
        })}
        <Button onClick={() => controller.cancel()}>{t('common.back')}</Button>
      </div>
    );
  }

  const hasItems = Object.values(view.items).some((count) => count > 0);
  return (
    <div className={PANEL}>
      <p className="truncate text-center text-[0.85em] font-bold text-amber-300">{hero.name}</p>
      <div className="grid grid-cols-2 gap-[0.4em]">
        <Button variant="primary" disabled={!can((a) => a.type === ACTION.ATTACK)} onClick={() => controller.choose({ type: ACTION.ATTACK })}>
          {t('action.attack')}
        </Button>
        <Button onClick={() => controller.openMenu(ACTION_MENU.SKILLS)}>{t('action.skills')}</Button>
        <Button disabled={!hasItems} onClick={() => controller.openMenu(ACTION_MENU.ITEMS)}>
          {t('action.items')}
        </Button>
        <Button title={t('action.defendHint')} onClick={() => controller.choose({ type: ACTION.DEFEND })}>
          {t('action.defend')}
        </Button>
      </div>
    </div>
  );
}
