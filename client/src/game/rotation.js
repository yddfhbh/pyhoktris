import { collides } from './board.js';

export function rotateMatrixClockwise(matrix) {
  const height = matrix.length;
  const width = matrix[0]?.length ?? 0;
  const rotated = Array.from({ length: width }, () => Array(height).fill(0));

  for (let y = 0; y < height; y += 1) {
    for (let x = 0; x < width; x += 1) {
      rotated[x][height - 1 - y] = matrix[y][x];
    }
  }

  return rotated;
}

export function tryRotate(board, piece) {
  if (piece.type === 'O') return true;

  const rotated = rotateMatrixClockwise(piece.matrix);
  const kicks = [0, -1, 1, -2, 2];

  for (const kickX of kicks) {
    if (!collides(board, piece, kickX, 0, rotated)) {
      piece.x += kickX;
      piece.matrix = rotated;
      return true;
    }
  }

  return false;
}
