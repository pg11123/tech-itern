import { SIDE, UI_MODE } from '../../config/constants';
import { getEnemy } from '../../data';
import { unitAnchorPercent } from '../../game/render/layout';
import { useName, useT } from '../../i18n/useT';
import { useBattleUiStore } from '../../store/useBattleUiStore';

// Pulsing rings over every legal target while a target is being picked (mouse or touch).
export default function TargetReticles() {
  const t = useT();
  const name = useName();
  const mode = useBattleUiStore((state) => state.mode);
  const targets = useBattleUiStore((state) => state.targets);
  const view = useBattleUiStore((state) => state.view);
  const controller = useBattleUiStore((state) => state.controller);
  if (mode !== UI_MODE.TARGET) return null;

  return targets.map((id) => {
    const unit = view.units[id];
    const count = unit.side === SIDE.HERO ? view.heroIds.length : view.waveSize;
    const { left, top } = unitAnchorPercent(unit.side, count, unit.slot);
    const label = unit.side === SIDE.ENEMY ? name('enemy', getEnemy(unit.defId)) : unit.name;
    return (
      <button
        key={id}
        type="button"
        aria-label={t('hud.target', { name: label })}
        onClick={() => controller.chooseTarget(id)}
        className="pointer-events-auto absolute h-[6.5em] w-[6.5em] -translate-x-1/2 -translate-y-1/2 rounded-full"
        style={{ left: `${left}%`, top: `${top}%` }}
      >
        {/* Only the ring pulses; the hit area stays put. */}
        <span className="animate-reticle block h-full w-full rounded-full border-[0.3em] border-amber-300 bg-amber-300/10 shadow-[0_0_1em_rgba(252,211,77,0.7)]" />
      </button>
    );
  });
}
