import { useEffect, useState } from 'react';
import { useT } from '../../i18n/useT';

const SAMPLE_MS = 500;

// Debug readout of the page frame rate (requestAnimationFrame), shown in the sandbox.
export default function FpsMeter() {
  const t = useT();
  const [fps, setFps] = useState(null);

  useEffect(() => {
    let frames = 0;
    let start = performance.now();
    let rafId = requestAnimationFrame(function loop(now) {
      frames += 1;
      if (now - start >= SAMPLE_MS) {
        setFps(Math.round((frames * 1000) / (now - start)));
        frames = 0;
        start = now;
      }
      rafId = requestAnimationFrame(loop);
    });
    return () => cancelAnimationFrame(rafId);
  }, []);

  return (
    <span className="rounded-[0.4em] bg-black/50 px-[0.5em] py-[0.15em] font-mono text-[0.7em] text-lime-300">
      {t('battle.fps', { fps: fps ?? '--' })}
    </span>
  );
}
