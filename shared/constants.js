export const BOARD_WIDTH = 10;
export const BOARD_HEIGHT = 22;
export const HIDDEN_ROWS = 2;
export const VISIBLE_BOARD_HEIGHT = BOARD_HEIGHT - HIDDEN_ROWS;
export const CELL_SIZE = 28;

export const DEFAULT_GRAVITY_MS = 850;
export const LOCK_DELAY_MS = 500;
export const STATE_SEND_INTERVAL_MS = 50;

export const ROOM_ID_LENGTH = 5;
export const MAX_ROOM_PLAYERS = 2;

export const GAME_MODES = ['solo', 'sprint', 'marathon', 'versus'];

export const COLORS = {
  empty: '#0b1020',
  garbage: '#64748b',
  I: '#38bdf8',
  O: '#facc15',
  T: '#a855f7',
  S: '#22c55e',
  Z: '#ef4444',
  J: '#2563eb',
  L: '#f97316'
};
