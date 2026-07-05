import { CLIENT } from '../../shared/protocol.js';
import { isValidRoomId } from '../../shared/validators.js';

export function isKnownClientMessage(type) {
  return Object.values(CLIENT).includes(type);
}

export function validateRoomPayload(payload) {
  return isValidRoomId(payload?.roomId);
}

export function sanitizeAttackLines(value) {
  const n = Number(value);
  if (!Number.isFinite(n)) return 0;
  return Math.max(0, Math.min(8, Math.floor(n)));
}