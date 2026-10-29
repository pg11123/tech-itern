// One unit on the battlefield. `view` holds the shadow and the bobbing body; `overlay` (drawn
// above all units) holds the HP bar and status badges, so a nearer unit never hides them.
// All motion goes through the scene's tween group; nothing here touches battle state.
import { Container, Graphics } from 'pixi.js';
import { SIDE } from '../../config/constants';
import { createHpBar } from './hpBar';
import { createStatusRow } from './statusIcons';
import { createUnitSprite } from './spriteFactory';

const BOB_HEIGHT = 4;
const BOB_SPEED = 2.4; // radians per second
const SQUASH = 0.025;
const HP_BAR_GAP = 14;
const MIN_HP_BAR_WIDTH = 64;
const STATUS_GAP = 16;
const HIT_TINT = 0xff6b6b;
const DOWNED_ALPHA = 0.35;

export function createUnitView({ unit, side, x, y, phase }) {
  const view = new Container();
  view.position.set(x, y);
  view.zIndex = y; // lower on screen = closer = drawn on top

  const sprite = createUnitSprite(unit, side);
  const shadow = new Graphics()
    .ellipse(0, 0, sprite.width * 0.5, sprite.width * 0.13)
    .fill({ color: 0x000000, alpha: 0.22 });
  const ring = new Graphics()
    .ellipse(0, 0, sprite.width * 0.58, sprite.width * 0.17)
    .stroke({ width: 4, color: 0xffd23f });
  ring.visible = false;
  const body = new Container();
  body.addChild(sprite.view);
  view.addChild(ring, shadow, body);

  const overlay = new Container();
  overlay.position.set(x, y);
  const hpBar = createHpBar({ width: Math.max(MIN_HP_BAR_WIDTH, sprite.width * 0.9), side });
  hpBar.view.y = HP_BAR_GAP;
  const statusRow = createStatusRow();
  statusRow.view.y = -sprite.height - STATUS_GAP;
  overlay.addChild(hpBar.view, statusRow.view);

  const home = { x, y };
  const hp = { ratio: 1 };
  let bobbing = true;
  let downed = false;

  function update(seconds) {
    ring.alpha = 0.6 + 0.4 * Math.sin(seconds * 6);
    if (!bobbing || downed) return;
    const wave = Math.sin(seconds * BOB_SPEED + phase);
    const lift = (wave + 1) / 2;
    body.y = -lift * BOB_HEIGHT;
    body.scale.set(1 - SQUASH * wave, 1 + SQUASH * wave);
    shadow.scale.set(1 - lift * 0.08);
  }

  function setHp(ratio, tweens) {
    if (!tweens) {
      hp.ratio = ratio;
      hpBar.setRatio(ratio);
      return Promise.resolve();
    }
    return tweens.to(hp, { ratio, duration: 0.35, ease: 'power2.out', onUpdate: () => hpBar.setRatio(hp.ratio) });
  }

  // Moves body and bars toward a point (a fraction of the way) and back again later.
  function moveTo(target, share, tweens, duration = 0.22) {
    bobbing = false;
    const point = { x: home.x + (target.x - home.x) * share, y: home.y + (target.y - home.y) * share };
    return tweens.to([view, overlay], { x: point.x, y: point.y, duration, ease: 'power2.in' });
  }

  async function returnHome(tweens) {
    await tweens.to([view, overlay], { x: home.x, y: home.y, duration: 0.25, ease: 'power2.out' });
    bobbing = true;
  }

  async function hop(tweens) {
    await tweens.to(body, { y: -24, duration: 0.14, ease: 'power2.out' });
    await tweens.to(body, { y: 0, duration: 0.14, ease: 'power2.in' });
  }

  async function flash(tweens) {
    sprite.view.tint = HIT_TINT;
    const away = side === SIDE.HERO ? -10 : 10;
    await tweens.to(body, { x: away, duration: 0.06, yoyo: true, repeat: 1 });
    sprite.view.tint = 0xffffff;
  }

  // Heroes stay on the field knocked over (they can be revived); enemies fade away.
  async function setAlive(alive, tweens) {
    downed = !alive;
    if (alive) {
      view.visible = overlay.visible = true;
      view.alpha = overlay.alpha = 1;
      body.rotation = 0;
      return;
    }
    if (side === SIDE.HERO) {
      body.y = 0;
      if (tweens) await tweens.to(body, { rotation: -0.5, duration: 0.3 });
      else body.rotation = -0.5;
      view.alpha = DOWNED_ALPHA;
      return;
    }
    if (tweens) await tweens.to([view, overlay], { alpha: 0, y: home.y + 12, duration: 0.45 });
    view.visible = overlay.visible = false;
  }

  // New wave: slide in from off-screen right.
  async function enter(tweens) {
    view.x = overlay.x = home.x + 520;
    view.alpha = overlay.alpha = 0;
    await tweens.to([view, overlay], { x: home.x, alpha: 1, duration: 0.55, ease: 'power2.out' });
  }

  return {
    id: unit.id,
    side,
    view,
    overlay,
    home,
    headY: home.y - sprite.height,
    update,
    setHp,
    setStatuses: statusRow.setStatuses,
    setSelected: (selected) => {
      ring.visible = selected;
    },
    moveTo,
    returnHome,
    hop,
    flash,
    setAlive,
    enter,
    isDowned: () => downed,
  };
}
