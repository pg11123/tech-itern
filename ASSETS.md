# Assets

Every image, sound and font used by the game, with its source and license. Update this file whenever an asset is added or replaced.

Personal, non-commercial fan project; keep the repository private (see `PLAN_ABE_CE_.md` 0.2).

## In use

| Asset | Files | Source | License |
|-|-|-|-|
| Hero placeholders (5 classes) | `frontend/src/game/render/placeholders/birdPlaceholder.js` | Drawn in code with Pixi Graphics (this project) | Project code |
| Enemy placeholders (minion / elite / boss) | `frontend/src/game/render/placeholders/pigPlaceholder.js` | Drawn in code with Pixi Graphics (this project) | Project code |
| Beach background | `frontend/src/game/render/backgrounds/beachBackground.js` | Drawn in code with Pixi Graphics (this project) | Project code |

No image, audio or font files are used yet.

## Not used (Vite starter template leftovers)

| Files | Source | License |
|-|-|-|
| `frontend/src/assets/hero.png`, `react.svg`, `vite.svg`, `frontend/public/favicon.svg`, `icons.svg` | create-vite template | MIT |

## Adding final art

Put owner-supplied files in `frontend/src/assets/` (`sprites/`, `backgrounds/`, `ui/`, `audio/`), add a row above, and wire sprites up in `frontend/src/game/render/spriteFactory.js`.
