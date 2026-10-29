// Placeholder beach backdrop drawn with Graphics: sky, sun, clouds, sea, shore, sand, palms.
// Layers are drawn back to front; `update` adds light ambient motion.
import { Container, FillGradient, Graphics } from 'pixi.js';
import { createRng } from '../../engine/rng';
import { DESIGN_HEIGHT as H, DESIGN_WIDTH as W } from '../layout';

const HORIZON_Y = 300;
const SHORE_Y = 405;
const WET_SAND_HEIGHT = 40; // must reach below the dry sand's top edge (SHORE_Y + 26 at most)
const BLEED = 40; // drawn past the edges so a camera shake never shows a gap
const SCENERY_SEED = 1337;

const CLOUDS = [
  { x: 120, y: 70, scale: 1.1, speed: 6 },
  { x: 520, y: 120, scale: 0.8, speed: 9 },
  { x: 820, y: 55, scale: 1.3, speed: 5 },
  { x: 1180, y: 150, scale: 0.7, speed: 11 },
];

const PALMS = [
  { x: 70, baseY: SHORE_Y + 70, height: 330, lean: 60 },
  { x: 1215, baseY: SHORE_Y + 80, height: 300, lean: -55 },
];

const FROND_ANGLES = [-172, -140, -108, -76, -44, -12, 18];

function createCloud({ x, y, scale }) {
  const cloud = new Graphics();
  for (const [cx, cy, r] of [[0, 0, 28], [32, -14, 34], [66, 0, 26], [34, 8, 30], [-26, 6, 18]]) {
    cloud.circle(cx, cy, r);
  }
  cloud.fill({ color: 0xffffff, alpha: 0.92 });
  cloud.position.set(x, y);
  cloud.scale.set(scale);
  return cloud;
}

function createPalm({ x, baseY, height, lean }) {
  const view = new Container();
  view.position.set(x, baseY);

  // Tapered trunk along a quadratic curve from the ground to the crown.
  const point = (t) => ({
    x: 2 * (1 - t) * t * lean * 0.15 + t * t * lean,
    y: -(2 * (1 - t) * t * height * 0.55 + t * t * height),
  });
  const trunk = new Graphics();
  const segments = 9;
  for (let i = 0; i < segments; i += 1) {
    const t0 = i / segments;
    const t1 = (i + 1) / segments;
    const [p0, p1] = [point(t0), point(t1)];
    const [w0, w1] = [16 - 8 * t0, 16 - 8 * t1];
    trunk
      .poly([p0.x - w0, p0.y, p0.x + w0, p0.y, p1.x + w1, p1.y + 2, p1.x - w1, p1.y + 2])
      .fill(i % 2 ? 0x9a6a3a : 0x8a5c30)
      .stroke({ width: 2, color: 0x5a3a1c });
  }

  const crown = point(1);
  const fronds = new Container();
  fronds.position.set(crown.x, crown.y);
  const leaves = new Graphics();
  FROND_ANGLES.forEach((degrees, i) => {
    const a = (degrees * Math.PI) / 180;
    const length = 120 - Math.abs(degrees + 76) * 0.25;
    const [dx, dy] = [Math.cos(a), Math.sin(a)];
    const [nx, ny] = [-dy, dx];
    const tip = { x: dx * length, y: dy * length + length * 0.35 };
    const mid = { x: dx * length * 0.5, y: dy * length * 0.5 - length * 0.08 };
    leaves
      .moveTo(0, 0)
      .quadraticCurveTo(mid.x + nx * 26, mid.y + ny * 26, tip.x, tip.y)
      .quadraticCurveTo(mid.x - nx * 14, mid.y - ny * 14, 0, 0)
      .fill(i % 2 ? 0x3fa349 : 0x2f8a3a)
      .stroke({ width: 2, color: 0x1f5524 });
  });
  for (const [cx, cy] of [[-9, 6], [7, 9], [-1, 16]]) leaves.circle(cx, cy, 9);
  leaves.fill(0x6b4423).stroke({ width: 2, color: 0x3a2412 });
  fronds.addChild(leaves);

  view.addChild(trunk, fronds);
  return { view, fronds };
}

export function createBeachBackground() {
  const gradients = [];
  const verticalGradient = (stops) => {
    const gradient = new FillGradient({
      type: 'linear',
      start: { x: 0, y: 0 },
      end: { x: 0, y: 1 },
      colorStops: stops.map(([offset, color]) => ({ offset, color })),
      textureSpace: 'local',
    });
    gradients.push(gradient);
    return gradient;
  };
  const rng = createRng(SCENERY_SEED);
  const fullWidth = W + BLEED * 2;

  const sky = new Graphics()
    .rect(-BLEED, -BLEED, fullWidth, HORIZON_Y + BLEED)
    .fill(verticalGradient([[0, '#4fb1ea'], [1, '#c6edf8']]));

  const sun = new Graphics()
    .circle(1030, 105, 96)
    .fill({ color: 0xfff6c4, alpha: 0.25 })
    .circle(1030, 105, 58)
    .fill(0xfff1a6);

  const clouds = CLOUDS.map((cloud) => ({ ...cloud, view: createCloud(cloud) }));

  const island = new Graphics()
    .ellipse(300, HORIZON_Y + 6, 170, 30)
    .fill(0x5e9f86)
    .ellipse(380, HORIZON_Y + 6, 90, 20)
    .fill(0x74b398);

  const sea = new Graphics()
    .rect(-BLEED, HORIZON_Y, fullWidth, SHORE_Y - HORIZON_Y + 30)
    .fill(verticalGradient([[0, '#1a86b8'], [1, '#45c3d6']]));

  const glints = new Graphics();
  for (let i = 0; i < 16; i += 1) {
    const y = rng.range(HORIZON_Y + 14, SHORE_Y - 16);
    const depth = (y - HORIZON_Y) / (SHORE_Y - HORIZON_Y);
    glints.roundRect(rng.range(-20, W), y, rng.range(18, 42) * (0.6 + depth), 3, 1.5);
  }
  glints.fill({ color: 0xffffff, alpha: 0.35 });

  // Only a strip: the dry sand covers the rest, and overdraw is the main GPU cost here.
  const wetSand = new Graphics().rect(-BLEED, SHORE_Y, fullWidth, WET_SAND_HEIGHT).fill(0xd2ab6c);

  const foam = new Graphics();
  foam.moveTo(-BLEED, SHORE_Y);
  for (let x = -BLEED; x <= W + BLEED; x += 20) foam.lineTo(x, SHORE_Y + Math.sin(x / 37) * 4);
  foam.stroke({ width: 7, color: 0xffffff, alpha: 0.85, cap: 'round', join: 'round' });

  const sand = new Graphics()
    .moveTo(-BLEED, SHORE_Y + 26)
    .quadraticCurveTo(W / 2, SHORE_Y + 4, W + BLEED, SHORE_Y + 22)
    .lineTo(W + BLEED, H + BLEED)
    .lineTo(-BLEED, H + BLEED)
    .closePath()
    .fill(verticalGradient([[0, '#f3dba3'], [1, '#dfb46c']]));

  const speckles = new Graphics();
  for (let i = 0; i < 90; i += 1) {
    speckles.ellipse(rng.range(0, W), rng.range(SHORE_Y + 40, H), rng.range(1.5, 3.5), rng.range(1, 2));
  }
  speckles.fill({ color: 0xb98a4b, alpha: 0.45 });

  const palms = PALMS.map(createPalm);

  const view = new Container();
  view.addChild(sky, sun, ...clouds.map((cloud) => cloud.view), island, sea, glints, wetSand, foam, sand, speckles);
  view.addChild(...palms.map((palm) => palm.view));

  const wrapSpan = W + 400;
  function update(seconds) {
    for (const cloud of clouds) {
      const travelled = (cloud.x + 200 - seconds * cloud.speed) % wrapSpan;
      cloud.view.x = (travelled < 0 ? travelled + wrapSpan : travelled) - 200;
    }
    glints.x = Math.sin(seconds * 0.6) * 12;
    foam.y = Math.sin(seconds * 0.9) * 5;
    palms.forEach((palm, i) => {
      palm.fronds.rotation = Math.sin(seconds * 0.8 + i * 1.3) * 0.035;
    });
  }

  // Display objects are destroyed with the scene; gradients own textures and must be freed here.
  function destroy() {
    for (const gradient of gradients) gradient.destroy();
    gradients.length = 0;
  }

  return { view, update, destroy };
}
