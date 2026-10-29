import { useEffect } from 'react';
import { UI_MODE } from '../../config/constants';
import { useBattleUiStore } from '../../store/useBattleUiStore';
import ActionMenu from './ActionMenu';
import HeroCard from './HeroCard';
import PauseMenu from './PauseMenu';
import Results from './Results';
import TargetReticles from './TargetReticles';
import TimingBar from './TimingBar';
import TopBar from './TopBar';
import TurnBanner from './TurnBanner';

// HUD font size follows the frame width (cqw), so the whole HUD scales with the battle frame.
const HUD_FONT = 'max(9px, 1.15cqw)';

// React layer over the battle canvas: everything the player reads or taps.
export default function BattleHud({ isSandbox, onRestart, onQuit }) {
  const view = useBattleUiStore((state) => state.view);
  const mode = useBattleUiStore((state) => state.mode);
  const paused = useBattleUiStore((state) => state.paused);
  const controller = useBattleUiStore((state) => state.controller);

  useEffect(() => {
    const onKey = (event) => {
      if (event.key === 'Escape' && controller && mode !== UI_MODE.OVER) controller.setPaused(!paused);
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [controller, mode, paused]);

  if (!view || !controller) return null;

  return (
    <div className="pointer-events-none absolute inset-0 select-none text-stone-100" style={{ fontSize: HUD_FONT }}>
      <TopBar isSandbox={isSandbox} />
      <TargetReticles />
      <TurnBanner />
      <div className="absolute inset-x-0 bottom-0 flex items-end justify-between gap-[1em] p-[0.7em]">
        <div className="flex items-end gap-[0.5em]">
          {view.heroIds.map((id) => (
            <HeroCard key={id} unit={view.units[id]} />
          ))}
        </div>
        <ActionMenu />
      </div>
      {mode === UI_MODE.TIMING && <TimingBar />}
      {paused && <PauseMenu onRestart={onRestart} onQuit={onQuit} showSeed={isSandbox} />}
      {mode === UI_MODE.OVER && <Results onRestart={onRestart} onQuit={onQuit} />}
    </div>
  );
}
