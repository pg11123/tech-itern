import { createBeachBackground } from './beachBackground';

// Stage `bg` key -> background builder. Zones 2-4 add theirs in later phases.
const BACKGROUNDS = {
  beach_day: createBeachBackground,
};

// Unknown keys fall back to the beach so a typo in stages.json never blanks the scene.
export function createBackground(key) {
  const build = BACKGROUNDS[key] ?? createBeachBackground;
  return build();
}
