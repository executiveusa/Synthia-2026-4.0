// Minimal input validation against a plain JSON-Schema-like shape.
// No dependencies: the SDK stays the only runtime dependency.

export class ValidationError extends Error {
  constructor(message) {
    super(message);
    this.name = 'ValidationError';
  }
}

function checkType(value, type, path) {
  const ok = {
    string: () => typeof value === 'string',
    number: () => typeof value === 'number' && Number.isFinite(value),
    integer: () => Number.isInteger(value),
    boolean: () => typeof value === 'boolean',
    array: () => Array.isArray(value),
    object: () => value !== null && typeof value === 'object' && !Array.isArray(value),
  }[type];
  if (!ok) throw new ValidationError(`unknown schema type "${type}" at ${path}`);
  if (!ok()) throw new ValidationError(`${path} must be ${type}, got ${JSON.stringify(value)}`);
}

export function validate(schema, input) {
  if (!schema || schema.type !== 'object') throw new ValidationError('schema must be a JSON object schema');
  const value = input ?? {};
  checkType(value, 'object', 'input');
  for (const key of schema.required ?? []) {
    if (value[key] === undefined) throw new ValidationError(`missing required field "${key}"`);
  }
  const props = schema.properties ?? {};
  for (const [key, spec] of Object.entries(props)) {
    if (value[key] === undefined) continue;
    checkType(value[key], spec.type, key);
    if (spec.enum && !spec.enum.includes(value[key])) {
      throw new ValidationError(`${key} must be one of ${spec.enum.join(', ')}`);
    }
    if (spec.type === 'string' && spec.minLength && value[key].length < spec.minLength) {
      throw new ValidationError(`${key} must be at least ${spec.minLength} character(s)`);
    }
    if ((spec.type === 'integer' || spec.type === 'number') && spec.minimum !== undefined && value[key] < spec.minimum) {
      throw new ValidationError(`${key} must be >= ${spec.minimum}`);
    }
  }
  return value;
}
