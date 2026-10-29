import { Application, Container } from 'pixi.js';
import { useEffect, useRef, useState } from 'react';
import { computeLetterbox } from '../../game/render/layout';
import { useT } from '../../i18n/useT';

const MAX_RESOLUTION = 2;
const LETTERBOX_COLOR = 0x000000;

// Mounts a Pixi Application in a 16:9 frame letterboxed inside the parent.
// The scene draws in 1280x720 design pixels inside `world`, which is scaled to the frame.
// createScene({ app, world }) must return { destroy }; memoize it, a new function rebuilds the app.
// Children render over the canvas inside the same frame (HUD layer).
export default function PixiCanvas({ createScene, children }) {
  const t = useT();
  const viewportRef = useRef(null);
  const frameRef = useRef(null);
  const hostRef = useRef(null);
  const [status, setStatus] = useState({ state: 'loading' });

  useEffect(() => {
    const viewport = viewportRef.current;
    const frame = frameRef.current;
    const app = new Application();
    let world = null;
    let scene = null;
    let observer = null;
    let disposed = false;

    const fit = () => {
      const box = computeLetterbox(viewport.clientWidth, viewport.clientHeight);
      frame.style.width = `${box.width}px`;
      frame.style.height = `${box.height}px`;
      if (world) {
        app.renderer.resize(box.width, box.height);
        world.scale.set(box.scale);
      }
      return box;
    };

    const initial = fit();
    app
      .init({
        width: initial.width,
        height: initial.height,
        background: LETTERBOX_COLOR,
        antialias: true,
        autoDensity: true,
        resolution: Math.min(window.devicePixelRatio || 1, MAX_RESOLUTION),
      })
      .then(() => {
        // Unmounted while Pixi was starting (React StrictMode or fast navigation).
        if (disposed) {
          app.destroy({ removeView: true }, { children: true });
          return;
        }
        world = new Container();
        app.stage.addChild(world);
        app.canvas.style.display = 'block';
        hostRef.current.appendChild(app.canvas);
        fit();
        scene = createScene({ app, world });
        observer = new ResizeObserver(fit);
        observer.observe(viewport);
        setStatus({ state: 'ready' });
      })
      .catch((error) => {
        if (!disposed) setStatus({ state: 'error', message: error?.message ?? String(error) });
      });

    return () => {
      disposed = true;
      observer?.disconnect();
      if (world) {
        scene?.destroy();
        app.destroy({ removeView: true }, { children: true });
      }
    };
  }, [createScene]);

  return (
    <div ref={viewportRef} className="flex h-full w-full items-center justify-center overflow-hidden bg-black">
      <div ref={frameRef} className="@container relative overflow-hidden">
        <div ref={hostRef} className="absolute inset-0" />
        {status.state === 'ready' && children}
        {status.state !== 'ready' && (
          <p className="absolute inset-0 flex items-center justify-center p-6 text-center text-sm text-stone-300">
            {status.state === 'error'
              ? t('battle.rendererError', { message: status.message })
              : t('battle.loading')}
          </p>
        )}
      </div>
    </div>
  );
}
