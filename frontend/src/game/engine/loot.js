// Loot tables: [{ item, chance, min, max }]. Pure: the RNG is passed in.

// Rolls every entry once; returns [{ item, qty }] for the entries that dropped.
export function rollLoot(table, rng) {
  const drops = [];
  for (const { item, chance, min, max } of table) {
    if (rng.chance(chance)) drops.push({ item, qty: rng.int(min, max) });
  }
  return drops;
}

// Adds drops into a stacked list (same item -> one entry), returning a new list.
export function mergeLoot(stacks, drops) {
  const merged = stacks.map((stack) => ({ ...stack }));
  for (const { item, qty } of drops) {
    const stack = merged.find((entry) => entry.item === item);
    if (stack) stack.qty += qty;
    else merged.push({ item, qty });
  }
  return merged;
}
