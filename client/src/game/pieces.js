export const PIECE_TYPES = ['I', 'O', 'T', 'S', 'Z', 'J', 'L'];

export const PIECES = {
  I: [
    [0, 0, 0, 0],
    ['I', 'I', 'I', 'I'],
    [0, 0, 0, 0],
    [0, 0, 0, 0]
  ],
  O: [
    ['O', 'O'],
    ['O', 'O']
  ],
  T: [
    [0, 'T', 0],
    ['T', 'T', 'T'],
    [0, 0, 0]
  ],
  S: [
    [0, 'S', 'S'],
    ['S', 'S', 0],
    [0, 0, 0]
  ],
  Z: [
    ['Z', 'Z', 0],
    [0, 'Z', 'Z'],
    [0, 0, 0]
  ],
  J: [
    ['J', 0, 0],
    ['J', 'J', 'J'],
    [0, 0, 0]
  ],
  L: [
    [0, 0, 'L'],
    ['L', 'L', 'L'],
    [0, 0, 0]
  ]
};

export function cloneMatrix(matrix) {
  return matrix.map((row) => row.slice());
}

export function createPiece(type) {
  return {
    type,
    matrix: cloneMatrix(PIECES[type]),
    x: type === 'O' ? 4 : 3,
    y: 0
  };
}