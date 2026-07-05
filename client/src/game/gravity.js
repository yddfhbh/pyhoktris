import { DEFAULT_GRAVITY_MS } from '../../../shared/constants.js';

export function getGravityMs({ level = 1 } = {}) {
  const speed = DEFAULT_GRAVITY_MS - (level - 1) * 55;
  return Math.max(90, speed);
}
