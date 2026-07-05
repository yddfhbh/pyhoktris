export function parseJsonMessage(raw) {
  try {
    const text = typeof raw === 'string' ? raw : raw?.toString?.('utf8');
    if (!text) return null;

    const parsed = JSON.parse(text);

    if (!parsed || typeof parsed !== 'object') {
      return null;
    }

    return parsed;
  } catch {
    return null;
  }
}

export function isValidRoomId(value) {
  return typeof value === 'string' && /^[A-Z2-9]{5}$/.test(value.trim().toUpperCase());
}
