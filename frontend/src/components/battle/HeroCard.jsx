import { FOCUS, RAGE } from '../../config/balance';
import { UI_MODE } from '../../config/constants';
import { cssColor, HERO_COLOR } from '../../game/render/palette';
import { useT } from '../../i18n/useT';
import { useBattleUiStore } from '../../store/useBattleUiStore';
import Bar from '../ui/Bar';
import StatusChips from './StatusChips';

const HP_COLOR = '#4ade80';
const HP_LOW_COLOR = '#f87171';
const RAGE_COLOR = '#fb923c';
const LOW_HP = 0.3;

function FocusPips({ value, label }) {
  return (
    <div role="meter" aria-label={label} aria-valuemin={0} aria-valuemax={FOCUS.MAX} aria-valuenow={value} className="flex gap-[0.2em]">
      {Array.from({ length: FOCUS.MAX }, (_, i) => (
        <span
          key={i}
          className={`h-[0.55em] flex-1 rounded-full ring-1 ring-black/70 ${i < value ? 'bg-sky-400' : 'bg-black/60'}`}
        />
      ))}
    </div>
  );
}

// Portrait card for one hero: tap to select. Shows HP, Focus pips, Rage and statuses.
export default function HeroCard({ unit }) {
  const t = useT();
  const selected = useBattleUiStore((state) => state.heroId === unit.id);
  const mode = useBattleUiStore((state) => state.mode);
  const controller = useBattleUiStore((state) => state.controller);
  const choosing = mode === UI_MODE.COMMAND || mode === UI_MODE.TARGET;
  const canSelect = choosing && unit.alive && !unit.acted;
  const rageFull = unit.rage >= RAGE.MAX;
  const hpColor = unit.hp / unit.maxHp <= LOW_HP ? HP_LOW_COLOR : HP_COLOR;

  let look = 'border-white/15';
  if (selected && choosing) look = 'border-amber-400 shadow-[0_0_0.8em_rgba(251,191,36,0.55)]';
  else if (!unit.alive) look = 'border-white/10 opacity-50 grayscale';
  else if (unit.acted) look = 'border-white/10 opacity-60';

  return (
    <button
      type="button"
      disabled={!canSelect}
      aria-pressed={selected}
      aria-label={t('hud.selectHero', { name: unit.name })}
      onClick={() => controller?.selectHero(unit.id)}
      className={`pointer-events-auto flex w-[10.5em] flex-col gap-[0.3em] rounded-[0.6em] border-[0.15em] bg-black/65 p-[0.45em] text-left transition enabled:hover:border-amber-300 ${look}`}
    >
      <span className="flex items-center gap-[0.4em]">
        <span
          className="h-[1.4em] w-[1.4em] shrink-0 rounded-full ring-2 ring-black/60"
          style={{ background: cssColor(HERO_COLOR[unit.heroClass]) }}
        />
        <span className="truncate text-[0.9em] font-bold">{unit.name}</span>
        {!unit.alive && <span className="ml-auto text-[0.65em] uppercase text-red-300">{t('hud.down')}</span>}
      </span>
      <Bar value={unit.hp} max={unit.maxHp} color={hpColor} label={t('hud.hp')} text={`${unit.hp}/${unit.maxHp}`} height="0.95em" />
      <FocusPips value={unit.focus} label={t('hud.focus')} />
      <Bar value={unit.rage} max={RAGE.MAX} color={RAGE_COLOR} label={t('hud.rage')} height="0.45em" glow={rageFull} />
      <StatusChips statuses={unit.statuses} />
    </button>
  );
}
