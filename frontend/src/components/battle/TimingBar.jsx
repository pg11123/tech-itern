import { useEffect, useRef, useState } from 'react';
import { TIMING_BAR } from '../../config/balance';
import { TIMING } from '../../config/constants';
import { cursorPosition, timingAt, timingExpired } from '../../game/timing';
import { useT } from '../../i18n/useT';
import { useBattleUiStore } from '../../store/useBattleUiStore';

const RESULT_MS = 450;
const RESULT_COLOR = { [TIMING.GREAT]: 'text-lime-300', [TIMING.GOOD]: 'text-amber-300', [TIMING.MISS]: 'text-red-400' };

// Zones as a gradient: Miss (red) at the ends, Good (amber), Great (green) in the middle.
const greatFrom = 50 - (TIMING_BAR.GREAT_ZONE * 100) / 2;
const goodFrom = 50 - (TIMING_BAR.GOOD_ZONE * 100) / 2;
const TRACK = `linear-gradient(90deg, #b91c1c 0 ${goodFrom}%, #d97706 ${goodFrom}% ${greatFrom}%, #16a34a ${greatFrom}% ${100 - greatFrom}%, #d97706 ${100 - greatFrom}% ${100 - goodFrom}%, #b91c1c ${100 - goodFrom}% 100%)`;

// Attack timing mini-game: tap / click / Space stops the cursor.
export default function TimingBar() {
  const t = useT();
  const controller = useBattleUiStore((state) => state.controller);
  const cursorRef = useRef(null);
  const stopRef = useRef(() => {});
  const [result, setResult] = useState(null);

  useEffect(() => {
    let frame;
    let elapsed = 0;
    let last = performance.now();
    let position = 0;
    let done = false;
    let timer;

    const finish = (timing) => {
      if (done) return;
      done = true;
      cancelAnimationFrame(frame);
      setResult(timing);
      timer = setTimeout(() => controller.finishTiming(timing), RESULT_MS);
    };
    const loop = (now) => {
      if (!useBattleUiStore.getState().paused) elapsed += now - last;
      last = now;
      position = cursorPosition(elapsed);
      if (cursorRef.current) cursorRef.current.style.left = `${position * 100}%`;
      if (timingExpired(elapsed)) finish(TIMING.MISS);
      else frame = requestAnimationFrame(loop);
    };
    const onKey = (event) => {
      if (event.code === 'Space' || event.code === 'Enter') {
        event.preventDefault();
        stopRef.current();
      }
    };

    stopRef.current = () => {
      if (!useBattleUiStore.getState().paused) finish(timingAt(position));
    };
    frame = requestAnimationFrame(loop);
    window.addEventListener('keydown', onKey);
    return () => {
      cancelAnimationFrame(frame);
      clearTimeout(timer);
      window.removeEventListener('keydown', onKey);
    };
  }, [controller]);

  return (
    <div
      role="button"
      tabIndex={0}
      aria-label={t('timing.prompt')}
      onPointerDown={() => stopRef.current()}
      className="pointer-events-auto absolute inset-0 z-10 flex cursor-pointer flex-col items-center justify-end gap-[0.6em] pb-[22%]"
    >
      <p className={`text-[1.8em] font-black uppercase [text-shadow:0_2px_4px_#000] ${result ? RESULT_COLOR[result] : 'text-white'}`}>
        {result ? t(`timing.${result}`) : t('timing.prompt')}
      </p>
      <div className="relative h-[1.6em] w-[26em] max-w-[80%] rounded-full ring-[0.2em] ring-black/80" style={{ background: TRACK }}>
        <div ref={cursorRef} className="absolute -top-[0.4em] h-[2.4em] w-[0.45em] -translate-x-1/2 rounded-full bg-white shadow-[0_0_0.6em_#fff]" style={{ left: '0%' }} />
      </div>
    </div>
  );
}
