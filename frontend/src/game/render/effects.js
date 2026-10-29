// Short-lived battle effects: floating numbers/texts and particle bursts. Everything is created
// in `layer`, animated through the scene's tween group and destroyed when its tween ends.
import { Graphics, GraphicsContext, Text } from 'pixi.js';

const FONT = 'Trebuchet MS, Arial Black, Arial, sans-serif';

const TEXT_STYLES = {
  damage: { fontSize: 30, fill: 0xffffff },
  crit: { fontSize: 44, fill: 0xffd23f },
  heal: { fontSize: 30, fill: 0x7dff8a },
  bleed: { fontSize: 24, fill: 0xff7b7b },
  self: { fontSize: 26, fill: 0xffa94d },
  info: { fontSize: 22, fill: 0xd6ecff },
  title: { fontSize: 46, fill: 0xffe08a },
};

const PARTICLES = {
  coin: { count: 9, spread: 70, rise: 90, fall: 60, duration: 0.8 },
  sparkle: { count: 8, spread: 40, rise: 70, fall: -20, duration: 0.8 },
  hit: { count: 6, spread: 45, rise: 25, fall: 10, duration: 0.35 },
  star: { count: 5, spread: 35, rise: 20, fall: 0, duration: 0.7 },
};

function particleContexts() {
  return {
    coin: new GraphicsContext().circle(0, 0, 6).fill(0xffcf3a).stroke({ width: 2, color: 0x9a6b00 }),
    sparkle: new GraphicsContext().star(0, 0, 4, 7, 2.5).fill(0xcaffd2),
    hit: new GraphicsContext().star(0, 0, 4, 9, 2).fill(0xffffff),
    star: new GraphicsContext().star(0, 0, 5, 8, 3.5).fill(0xffe14d).stroke({ width: 1.5, color: 0x8a6400 }),
  };
}

export function createEffects({ layer, tweens, rng = Math.random }) {
  const contexts = particleContexts();

  // Text that rises and fades above (x, y).
  async function floatText(x, y, text, kind = 'damage') {
    const style = TEXT_STYLES[kind] ?? TEXT_STYLES.damage;
    const label = new Text({
      text,
      anchor: 0.5,
      style: { fontFamily: FONT, fontWeight: '900', stroke: { color: 0x1b1b1b, width: 6 }, ...style },
    });
    label.position.set(x, y);
    layer.addChild(label);
    if (kind === 'crit' || kind === 'title') await tweens.fromTo(label.scale, { x: 0.4, y: 0.4 }, { x: 1, y: 1, duration: 0.18, ease: 'back.out(3)' });
    await tweens.to(label, { y: y - 55, alpha: 0, duration: 0.85, ease: 'power1.in' });
    label.destroy();
  }

  // Particles flying out from (x, y): coins on enemy death, sparkles on heals...
  function burst(x, y, kind) {
    const spec = PARTICLES[kind];
    const done = [];
    for (let i = 0; i < spec.count; i += 1) {
      const particle = new Graphics(contexts[kind]);
      particle.position.set(x, y);
      layer.addChild(particle);
      const dx = (rng() - 0.5) * 2 * spec.spread;
      const peak = y - spec.rise * (0.6 + rng() * 0.6);
      done.push(
        tweens
          .to(particle, { x: x + dx, y: peak, rotation: rng() * 6, duration: spec.duration * 0.45, ease: 'power2.out' })
          .then(() => tweens.to(particle, { y: peak + spec.rise + spec.fall, alpha: 0, duration: spec.duration * 0.55, ease: 'power2.in' }))
          .then(() => particle.destroy()),
      );
    }
    return Promise.all(done);
  }

  function destroy() {
    for (const context of Object.values(contexts)) context.destroy();
  }

  return { floatText, burst, destroy };
}
