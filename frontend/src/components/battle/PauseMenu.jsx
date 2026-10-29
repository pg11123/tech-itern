import { TIMING_MODE } from '../../config/constants';
import { useT } from '../../i18n/useT';
import { useBattleUiStore } from '../../store/useBattleUiStore';
import { useSettingsStore } from '../../store/useSettingsStore';
import Button from '../ui/Button';
import Modal from '../ui/Modal';

export default function PauseMenu({ onRestart, onQuit, showSeed }) {
  const t = useT();
  const controller = useBattleUiStore((state) => state.controller);
  const seed = useBattleUiStore((state) => state.seed);
  const timingMode = useSettingsStore((state) => state.timingMode);
  const setTimingMode = useSettingsStore((state) => state.setTimingMode);

  const option = (mode, label) => (
    <button
      type="button"
      aria-pressed={timingMode === mode}
      onClick={() => setTimingMode(mode)}
      className={`flex-1 rounded-[0.4em] border px-[0.6em] py-[0.4em] text-[0.85em] ${
        timingMode === mode ? 'border-amber-400 text-amber-300' : 'border-white/15 text-stone-400 hover:text-stone-200'
      }`}
    >
      {label}
    </button>
  );

  return (
    <Modal title={t('pause.title')}>
      <h2 className="mb-[0.8em] text-[1.8em] font-black uppercase tracking-widest text-amber-400">{t('pause.title')}</h2>
      <div className="flex flex-col gap-[0.6em]">
        <Button variant="primary" onClick={() => controller.setPaused(false)}>
          {t('pause.resume')}
        </Button>
        <div className="text-left">
          <p className="mb-[0.3em] text-[0.8em] uppercase tracking-wider text-stone-400">{t('pause.timing')}</p>
          <div className="flex gap-[0.4em]">
            {option(TIMING_MODE.MANUAL, t('pause.timingManual'))}
            {option(TIMING_MODE.AUTO, t('pause.timingAuto'))}
          </div>
        </div>
        <Button onClick={onRestart}>{t('pause.restart')}</Button>
        <Button variant="danger" onClick={onQuit}>
          {t('pause.quit')}
        </Button>
        {showSeed && seed !== null && <p className="text-[0.7em] text-stone-500">{t('pause.seed', { seed })}</p>}
      </div>
    </Modal>
  );
}
