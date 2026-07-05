export const INPUT_STORAGE_KEY = 'kannyan-tetris-input-settings';

export const DEFAULT_KEYBINDS = {
  moveLeft: 'ArrowLeft',
  moveRight: 'ArrowRight',
  softDrop: 'ArrowDown',
  hardDrop: 'Space',
  rotate: 'ArrowUp',
  hold: 'KeyC',
  restart: 'KeyR'
};

export const DEFAULT_HANDLING = {
  arr: 40,
  das: 140,
  dcd: 0,
  sdf: 1
};

export function clampHandling(input = {}) {
  return {
    arr: clampNumber(input.arr, 0, 100, DEFAULT_HANDLING.arr),
    das: clampNumber(input.das, 0, 300, DEFAULT_HANDLING.das),
    dcd: clampNumber(input.dcd, 0, 200, DEFAULT_HANDLING.dcd),
    sdf: clampNumber(input.sdf, 1, 41, DEFAULT_HANDLING.sdf)
  };
}

export function sanitizeKeybinds(input = {}) {
  const result = {};

  for (const [action, fallback] of Object.entries(DEFAULT_KEYBINDS)) {
    const value = input[action];
    result[action] = typeof value === 'string' && value.trim() ? value : fallback;
  }

  return result;
}

export function loadInputPreferences() {
  try {
    const raw = window.localStorage.getItem(INPUT_STORAGE_KEY);

    if (!raw) {
      return {
        keybinds: { ...DEFAULT_KEYBINDS },
        handling: { ...DEFAULT_HANDLING }
      };
    }

    const parsed = JSON.parse(raw);

    return {
      keybinds: sanitizeKeybinds(parsed?.keybinds),
      handling: clampHandling(parsed?.handling)
    };
  } catch {
    return {
      keybinds: { ...DEFAULT_KEYBINDS },
      handling: { ...DEFAULT_HANDLING }
    };
  }
}

export function saveInputPreferences(preferences) {
  try {
    window.localStorage.setItem(INPUT_STORAGE_KEY, JSON.stringify(preferences));
  } catch {
    // Ignore storage failures in restricted environments.
  }
}

export function formatKeyCode(code) {
  const labels = {
    ArrowLeft: 'LEFT',
    ArrowRight: 'RIGHT',
    ArrowDown: 'DOWN',
    ArrowUp: 'UP',
    Space: 'SPACE',
    ShiftLeft: 'L SHIFT',
    ShiftRight: 'R SHIFT',
    Escape: 'ESC'
  };

  if (labels[code]) {
    return labels[code];
  }

  if (code.startsWith('Key')) {
    return code.slice(3).toUpperCase();
  }

  if (code.startsWith('Digit')) {
    return code.slice(5);
  }

  return code.toUpperCase();
}

export function formatSdfValue(value) {
  return Number(value) >= 41 ? 'INF X' : `${value} X`;
}

function clampNumber(value, min, max, fallback) {
  const number = Number(value);

  if (!Number.isFinite(number)) {
    return fallback;
  }

  return Math.max(min, Math.min(max, Math.round(number)));
}
