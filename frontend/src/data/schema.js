// Tiny schema checker for the JSON data files.
// A spec is one of:
//   'string' | 'number' | 'boolean' | 'object' | 'array'
//   { enum: [...] }  { arrayOf: spec }  { shape: { key: spec } }
// In a shape, a key ending in '?' is optional. Extra keys are allowed.

function typeOf(value) {
  if (Array.isArray(value)) return 'array';
  if (value === null) return 'null';
  return typeof value;
}

function check(value, spec, path, errors) {
  if (typeof spec === 'string') {
    const ok = typeOf(value) === spec && (spec !== 'number' || Number.isFinite(value));
    if (!ok) errors.push(`${path}: expected ${spec}`);
    return;
  }
  if (spec.enum) {
    if (!spec.enum.includes(value)) errors.push(`${path}: expected one of ${spec.enum.join(', ')}`);
    return;
  }
  if (spec.arrayOf) {
    if (!Array.isArray(value)) {
      errors.push(`${path}: expected array`);
      return;
    }
    value.forEach((item, i) => check(item, spec.arrayOf, `${path}[${i}]`, errors));
    return;
  }
  if (typeOf(value) !== 'object') {
    errors.push(`${path}: expected object`);
    return;
  }
  for (const [rawKey, fieldSpec] of Object.entries(spec.shape)) {
    const optional = rawKey.endsWith('?');
    const key = optional ? rawKey.slice(0, -1) : rawKey;
    if (value[key] === undefined) {
      if (!optional) errors.push(`${path}.${key}: missing`);
      continue;
    }
    check(value[key], fieldSpec, `${path}.${key}`, errors);
  }
}

// Returns a list of problems (empty when valid).
export function validate(value, spec, path = '$') {
  const errors = [];
  check(value, spec, path, errors);
  return errors;
}

// Validates a data file (array of records with unique ids); throws listing every problem.
export function assertCollection(records, shape, label) {
  const errors = validate(records, { arrayOf: { shape } }, label);
  if (Array.isArray(records)) {
    const seen = new Set();
    for (const record of records) {
      if (seen.has(record?.id)) errors.push(`${label}: duplicate id "${record.id}"`);
      seen.add(record?.id);
    }
  }
  if (errors.length) throw new Error(`Invalid game data:\n${errors.join('\n')}`);
  return records;
}
