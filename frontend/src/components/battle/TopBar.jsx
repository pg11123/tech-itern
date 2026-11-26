import { BATTLE_SPEEDS, UI_MODE } from '../../config/constants';
import { useT } from '../../i18n/useT';
import { useBattleUiStore } from '../../store/useBattleUiStore';
import { useSettingsStore } from '../../store/useSettingsStore';
import FpsMeter from './FpsMeter';

const PILL = 'rounded-[0.5em] bg-black/55 px-[0.8em] py-[0.35em]';

// Pause, wave / round counter, speed toggle (and the sandbox badge + FPS readout).
export default function TopBar({ isSandbox }) {
  const t = useT();
  const view = useBattleUiStore((state) => state.view);
  const mode = useBattleUiStore((state) => state.mode);
  const controller = useBattleUiStore((state) => state.controller);
  const speed = useSettingsStore((state) => state.battleSpeed);
  const setSpeed = useSettingsStore((state) => state.setBattleSpeed);

  const nextSpeed = BATTLE_SPEEDS[(BATTLE_SPEEDS.indexOf(speed) + 1) % BATTLE_SPEEDS.length];
  const toggleSpeed = () => {
    setSpeed(nextSpeed);
    controller?.setSpeed(nextSpeed);
  };

  return (
    <div className="pointer-events-none absolute inset-x-0 top-0 flex items-start justify-between gap-[0.6em] p-[0.7em]">
      <button
        type="button"
        aria-label={t('battle.pause')}
        disabled={mode === UI_MODE.OVER}
        onClick={() => controller?.setPaused(true)}
        className={`pointer-events-auto ${PILL} flex h-[2.2em] w-[2.6em] items-center justify-center border border-white/20 hover:border-amber-400 disabled:opacity-40`}
      >
        <svg viewBox="0 0 10 10" className="h-[1em] w-[1em]" aria-hidden="true">
          <rect x="1.5" y="1" width="2.5" height="8" fill="currentColor" />
          <rect x="6" y="1" width="2.5" height="8" fill="currentColor" />
        </svg>
      </button>

      <div className={`${PILL} text-center text-[0.95em] font-bold uppercase tracking-wider`}>
        {t('battle.wave', { current: view.waveIndex + 1, total: view.waveCount })}
        <span className="mx-[0.5em] text-white/40">·</span>
        {t('battle.round', { round: view.round })}
      </div>

      <div className="flex flex-col items-end gap-[0.3em]">
        <button
          type="button"
          aria-label={t('battle.speed', { speed: nextSpeed })}
          onClick={toggleSpeed}
          className={`pointer-events-auto ${PILL} border border-white/20 font-bold hover:border-amber-400`}
        >
          {t('battle.speedShort', { speed })}
        </button>
        {isSandbox && (
          <span className="rounded-[0.4em] bg-amber-500/90 px-[0.5em] py-[0.15em] text-[0.7em] font-bold uppercase text-black">
            {t('battle.sandbox')}
          </span>
        )}
        {isSandbox && <FpsMeter />}
      </div>
    </div>
  );
}
