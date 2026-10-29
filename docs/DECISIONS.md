# Decisions

Choices made where `PLAN_ABE_CE_.md` was ambiguous or did not match the repo. Newest phase last.

## Phase 1

### Repo adaptations

- `.gitignore`: section headers were plain lines (they acted as ignore patterns) and `__pycache__/` was missing. Headers are now `#` comments; added `__pycache__/` and `backend/data/*.db`. The tracked `backend/app/__pycache__/*.pyc` was removed from git.
- README: backend path and command fixed to `backend/app/main.py` / `uvicorn app.main:app --reload`.
- `MainMenu.jsx`: kept the existing look. Title now comes from `config/gameInfo.js`, strings go through i18n, unused `onLogin`/`onRegister` props removed (they failed lint). Added a "Battle sandbox" button and an EN/PL toggle.
- `index.html`: `lang="en"` (English is the default UI language; the app updates `lang` at runtime) and the game title.
- `sql.txt` (MySQL, Polish table names) is untouched until Phase 5.

### Dependencies

- New dependencies are pinned to exact versions (`pixi.js` 8.22.0, `zustand` 5.0.15, `howler` 2.2.4, `gsap` 3.15.0, `vitest` 5.0.5). Existing `^` ranges were left as they were.
- `howler` and `gsap` are installed but not used yet (audio: Phase 6, event tweens: Phase 3).

### Data

- Each data file is a JSON array of records. `src/data/index.js` loads them, validates them with a tiny schema checker (`src/data/schema.js`) and cross-checks references (stage enemies/heroes, max 4 per side). Invalid data throws at startup.
- Hero `skills` and enemy `skills`/`loot` are empty arrays until `skills.json` (Phase 2) and `items.json` (Phase 4) exist, so no id points at nothing.
- Only Red's stats come from the plan. Stats for the other heroes and all enemies are first-pass placeholders, to be tuned in Phase 2.
- The Blues are one hero (one party slot), drawn as three small birds.
- Stages may have an optional `fixedParty: [{ hero, level }]`. Only the sandbox stage `test` uses it for now.
- Data names (`"Red"`, `"Grunt"`) are not translated. If Polish names are wanted later, `name` can become `{ en, pl }`.

### Rendering

- The canvas itself is sized to the largest 16:9 box that fits the viewport (black CSS letterbox around it). The scene draws in 1280x720 design pixels inside a `world` container scaled to that box. Device pixel ratio is capped at 2.
- `PixiCanvas` is StrictMode-safe: if the component unmounts while `app.init()` is pending, the app is destroyed when init resolves and never attached.
- Teardown: the scene destroys its display tree with `{ children: true, context: true }`. Without `context: true`, Pixi 8 keeps the GraphicsContext each Graphics created. `FillGradient`s are destroyed explicitly because they own textures.
- HP bars live in an overlay layer above all units, so a nearer unit never hides a bar.
- Enemy placeholders differ by tier (minion / elite / boss). Grunt, Slinger and Shaman look the same until real art arrives.
- The idle bob uses the Pixi ticker rather than gsap, so there are no tweens to kill on unmount.
- The battle route is lazy-loaded (`React.lazy`) so Pixi is not in the menu bundle. This also removes Vite's >500 kB chunk warning.
- `/battle/:stageId` is the route. The sandbox `/battle/test` also accepts `?party=` and `?wave=` for previewing; other stages ignore them.

### Code layout

- Folders are created when their first module lands (git does not track empty folders). `audio/`, `services/` and the other stores arrive in their phases.
- `i18n/translate.js` (pure) sits next to `useT.js` so translation is unit-testable without React.
- `game/lineup.js` turns stage + party into what the renderer draws. It is not engine code, and Phase 2's battle state will feed it.
- `game/engine/rng.js` keeps the full generator state in one uint32 (`rng.state()`), so a pure battle state can store it and resume the exact sequence.

## Phase 2

### Turn and duration rules

- Status durations count the affected unit's own turns. A status ticks down at the end of each turn the unit takes or skips. When it was applied during that unit's own turn, it gets one extra tick, so that turn does not count. Result: a 2-turn buff or debuff always covers 2 of the unit's turns, whoever applied it and whenever. A self-cast Taunt covers 2 enemy phases.
- Stun is used up by the skipped turn. Stunned heroes skip as the player phase starts.
- Bleed hits at the end of the bleeding unit's turn (3 times for 3 turns) and ignores shields.
- Defend is a `defend` status (+50% def and res) that lasts until the end of the hero's next turn, plus +1 Focus.
- Cooldowns are stored as `cooldown + 1` because the turn that used the skill also ticks them. "Cooldown 2" means unusable for the next 2 turns.
- Clearing a wave starts the next wave as a new round: round +1, +1 Focus, every hero acts again.

### Stats and resources

- `buffAtk` / `weak` change both atk and mag; `buffDef` / `defend` change def and res. With atk only, Rally would not help Chuck and Weak would not slow a Shaman. These numbers live in `statuses.json`.
- Focus and Rage gains are per action, not per hit. A hero hit by an action gains +1 Focus and +15 Rage once, even from multi-hit skills. Dealing damage gives +10 Rage once per action. An ultimate empties Rage after it resolves, so it gains nothing from itself.
- Bomb's self-damage cannot take him below 1 HP (`SELF_DAMAGE_MIN_HP` in `balance.js`). It is still a risk, but it never ends a battle by itself.
- Enemies have no Focus or Rage; their skills use cooldowns only.

### Skills, AI and items

- The basic attack is a skill too (`attack`, or `attack_magic` for Chuck, Matilda and the Shaman). Each hero and enemy names its own in an `attack` field.
- `hits` (multi-hit, the Blues) and `critBonus` are optional skill fields. `enemy_random_x3` picks a new living target for each of its 3 hits.
- Non-boss AI uses the first skill in its list that is off cooldown and worth using (heals: an ally below 70% HP; buffs: someone lacks the status), otherwise its basic attack. `focusHealer` means "target Menders first".
- Boss scripts are rotations per phase. `"attack"` means the boss's own basic attack, and a skill on cooldown falls back to it. The phase changes when HP drops to `atHpPct`, which restarts the rotation.
- Consumables are defined in `items.json` now because the Item action needs them; equipment comes in Phase 4. A battle gets `items: { id: count }` from pre-battle. Revive Feather brings a hero back at 30% HP, and that hero acts from the next round.

### Results

- Stars are tiered: 3 needs no hero down **and** a finish within the round limit.
- XP is split evenly among surviving heroes, rounded down. Victory is checked before defeat, so clearing the last wave wins even if the hero's own bleed then downs them.

### Code

- Engine calls are pure: each `structuredClone`s the state and works on the copy. The RNG state is a number inside the battle state, so a saved state resumes exactly.
- `createBattle` returns only the state, as in the plan's API. The renderer can build the intro from it.
- `BattleError` messages are developer-facing English. The UI only sends legal actions, so players never see them.
- The 1000-battle simulation runs as a vitest file (`npm run simulate`). The engine uses Vite-style imports (JSON, no file extensions) that plain Node cannot load. The simulation also checks that no engine call changes its input state.
- Stats for heroes other than Red, all enemy stats and all skill numbers are a first pass, to be tuned with the simulation and play-testing.

## Phase 3

### How a battle runs on screen

- `game/battleController.js` (plain JS, no React or Pixi) drives the flow: player input → engine → event playback → next turn, including turn banners and the results. UI state lives in `store/useBattleUiStore.js`; the HUD only reads it and calls the controller.
- No desync: while events play, the HUD view advances one event at a time (`game/battleView.js`). After every engine step the view is rebuilt from the engine state and the Pixi scene snaps to it. A mismatch is logged as an error, and `battleView.test.js` replays 300 random battles to check the events always reproduce the state.
- After every action, the first hero who can still act is selected automatically. Any ready hero can be picked from the cards instead.
- Single-target actions ask for a target. Skills that hit all, self or random targets fire right away.
- Results are an overlay on the battle screen. The plan's `/results` route is not needed yet; Phase 4 can add it if the map flow wants one.

### Input and HUD

- Targets are React buttons placed over units as percentages of the 16:9 frame, not Pixi hit areas, so mouse, touch and keyboard focus all work the same way. The button stays still and only its ring pulses (a moving hit area is harder to tap).
- The HUD's root font size is set in container units (`cqw`) and everything inside uses `em`, so the whole HUD scales with the battle frame.
- Timing bar zones are in `balance.js` (Great 14%, Good 50% of the bar, 900 ms per sweep); no tap within 4 sweeps counts as Miss. "Auto" (pause menu, saved in settings) always gives Good. Battle speed does not speed up the bar.
- Data names are translated in `i18n/names.js` (a Polish table by id). The JSON keeps the English names.

### Animation

- All animation timing goes through gsap, one tween group per scene, so everything is killed on unmount. Pause stops gsap's global timeline and the Pixi ticker. The 1x/2x toggle sets gsap's global time scale.
- Downed heroes stay on the field (tilted, faded) so Revive Feather has something to aim at. Dead enemies fade out with a coin burst.
- Floating numbers and particles use `Math.random` for small offsets. That is cosmetic and never touches battle state.

### Battlefield and sandbox

- Unit rows moved up (feet at 62% and 76% of the height) and the shore with them, so the hero cards never cover a unit.
- The sandbox is now a 3-wave stage at difficulty `stageIndex` 2. It was tuned with a scripted "sensible player": about 7 rounds before the pig buff below, about 10 after it, so the round limit for 3 stars is 11. Stages may set `stageIndex` and an `items` kit (the sandbox has one).
- `?wave=` is gone (battles always start at wave 1); `?seed=` replays a battle exactly.
- `lineup.js` is removed: the scene is built straight from the engine's battle state.
- Audio is still Phase 6.

### Pig buff (owner request)

- All enemies deal 3× damage (+200%) and have 1.5× max HP (+50%). These are two global multipliers in `balance.js` (`ENEMY_DAMAGE_MULT`, `ENEMY_HP_MULT`), applied on top of `enemies.json` and stage scaling. The damage multiplier applies to enemy hits only; enemy heals and bleed ticks are unchanged.
- Effect on the sandbox (scripted sensible player, 200 seeds): still always winnable, about 10 rounds instead of 7, and a hero is knocked out in about 1 battle in 8.
