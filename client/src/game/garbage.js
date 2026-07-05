import { BOARD_WIDTH } from '../../../shared/constants.js';

export function getAttackLines(clearedLines) {
  if (clearedLines === 1) return 0;
  if (clearedLines === 2) return 1;
  if (clearedLines === 3) return 2;
  if (clearedLines >= 4) return 4;
  return 0;
}

export function addGarbageLines(board, count) {
  const amount = Math.max(0, Math.min(8, Number(count) || 0));

  for (let i = 0; i < amount; i += 1) {
    board.shift();

    const hole = Math.floor(Math.random() * BOARD_WIDTH);
    const row = Array.from({ length: BOARD_WIDTH }, (_, x) => (x === hole ? 0 : 'garbage'));

    board.push(row);
  }
}
