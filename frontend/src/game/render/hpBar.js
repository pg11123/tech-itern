import { Container, Graphics } from 'pixi.js';
import { SIDE } from '../../config/constants';

const HEIGHT = 12;
const PADDING = 2;
const COLORS = { [SIDE.HERO]: 0x5fd35b, [SIDE.ENEMY]: 0xe5483c };

// HP bar centred on x = 0, top edge at y = 0.
export function createHpBar({ width, side }) {
  const view = new Container();
  const back = new Graphics()
    .roundRect(-width / 2, 0, width, HEIGHT, HEIGHT / 2)
    .fill({ color: 0x15151b, alpha: 0.85 })
    .stroke({ width: 2, color: 0x0b0b0f });
  const fill = new Graphics();
  view.addChild(back, fill);

  function setRatio(ratio) {
    const clamped = Math.min(Math.max(ratio, 0), 1);
    const inner = HEIGHT - PADDING * 2;
    fill.clear();
    if (clamped > 0) {
      fill
        .roundRect(-width / 2 + PADDING, PADDING, (width - PADDING * 2) * clamped, inner, inner / 2)
        .fill(COLORS[side]);
    }
  }

  setRatio(1);
  return { view, setRatio };
}
