import { BOARD_HEIGHT, BOARD_WIDTH } from '../../../shared/constants.js';

export function createEmptyBoard() {
  return Array.from({ length: BOARD_HEIGHT }, () => Array(BOARD_WIDTH).fill(0));
}

export function isInsideBoard(x, y) {
  return x >= 0 && x < BOARD_WIDTH && y < BOARD_HEIGHT;
}

export function collides(board, piece, offsetX = 0, offsetY = 0, matrix = piece.matrix) {
  for (let y = 0; y < matrix.length; y += 1) {
    for (let x = 0; x < matrix[y].length; x += 1) {
      if (!matrix[y][x]) continue;

      const boardX = piece.x + x + offsetX;
      const boardY = piece.y + y + offsetY;

      if (boardX < 0 || boardX >= BOARD_WIDTH || boardY >= BOARD_HEIGHT) {
        return true;
      }

      if (boardY >= 0 && board[boardY][boardX]) {
        return true;
      }
    }
  }

  return false;
}

export function mergePiece(board, piece) {
  for (let y = 0; y < piece.matrix.length; y += 1) {
    for (let x = 0; x < piece.matrix[y].length; x += 1) {
      const value = piece.matrix[y][x];
      if (!value) continue;

      const boardX = piece.x + x;
      const boardY = piece.y + y;

      if (boardY >= 0 && boardY < BOARD_HEIGHT && boardX >= 0 && boardX < BOARD_WIDTH) {
        board[boardY][boardX] = value;
      }
    }
  }
}

export function clearLines(board) {
  let cleared = 0;

  for (let y = board.length - 1; y >= 0; y -= 1) {
    if (board[y].every(Boolean)) {
      board.splice(y, 1);
      board.unshift(Array(BOARD_WIDTH).fill(0));
      cleared += 1;
      y += 1;
    }
  }

  return cleared;
}

export function cloneBoard(board) {
  return board.map((row) => row.slice());
}
