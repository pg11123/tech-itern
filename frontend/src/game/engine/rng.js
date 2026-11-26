// Seeded RNG (mulberry32) so battles can be replayed and tested.
// The whole generator state is one uint32, so it can be stored in plain battle state:
// createRng(rng.state()) continues the exact same sequence.

function step(state) {
  const next = (state + 0x6d2b79f5) >>> 0;
  let t = next;
  t = Math.imul(t ^ (t >>> 15), t | 1);
  t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
  return { state: next, value: ((t ^ (t >>> 14)) >>> 0) / 4294967296 };
}

export function createRng(seed) {
  let state = seed >>> 0;

  // Float in [0, 1).
  const next = () => {
    const result = step(state);
    state = result.state;
    return result.value;
  };

  return {
    next,
    state: () => state,
    // Float in [min, max).
    range: (min, max) => min + next() * (max - min),
    // Integer in [min, max], both inclusive.
    int: (min, max) => min + Math.floor(next() * (max - min + 1)),
    chance: (probability) => next() < probability,
    pick: (list) => list[Math.floor(next() * list.length)],
  };
}
