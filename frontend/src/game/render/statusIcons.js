// Status badges drawn above units: a coloured disc with a white shape (see palette.STATUS_LOOK).
// Each badge owns its geometry, so destroying a unit's display tree frees everything.
import { Container, Graphics } from 'pixi.js';
import { statusLook } from './palette';

const RADIUS = 10;
const GAP = 3;
const WHITE = 0xffffff;

function drawShape(g, shape) {
  const r = RADIUS * 0.55;
  switch (shape) {
    case 'star':
      return g.star(0, 0, 5, r, r * 0.45).fill(WHITE);
    case 'drop':
      return g.circle(0, r * 0.25, r * 0.65).poly([-r * 0.6, 0, 0, -r, r * 0.6, 0]).fill(WHITE);
    case 'shield':
      return g.roundRect(-r * 0.75, -r * 0.8, r * 1.5, r * 1.6, r * 0.5).stroke({ width: 2.5, color: WHITE });
    case 'bang':
      return g.rect(-r * 0.2, -r, r * 0.4, r * 1.25).circle(0, r * 0.75, r * 0.25).fill(WHITE);
    case 'up':
      return g.poly([0, -r, r, r * 0.7, -r, r * 0.7]).fill(WHITE);
    case 'down':
      return g.poly([0, r, r, -r * 0.7, -r, -r * 0.7]).fill(WHITE);
    case 'square':
      return g.rect(-r * 0.7, -r * 0.7, r * 1.4, r * 1.4).fill(WHITE);
    default:
      return g.circle(0, 0, r * 0.4).fill(WHITE);
  }
}

function createBadge(id) {
  const look = statusLook(id);
  const badge = new Graphics().circle(0, 0, RADIUS).fill(look.color).stroke({ width: 2, color: 0x111111 });
  drawShape(badge, look.shape);
  return badge;
}

// A row of badges centred on x = 0.
export function createStatusRow() {
  const view = new Container();
  let shown = '';

  function setStatuses(ids) {
    const key = ids.join(',');
    if (key === shown) return;
    shown = key;
    for (const child of view.removeChildren()) child.destroy();
    const width = ids.length * (RADIUS * 2 + GAP) - GAP;
    ids.forEach((id, i) => {
      const badge = createBadge(id);
      badge.x = -width / 2 + RADIUS + i * (RADIUS * 2 + GAP);
      view.addChild(badge);
    });
  }

  return { view, setStatuses };
}
