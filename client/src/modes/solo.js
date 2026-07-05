import { TetrisGame } from '../game/game.js';

export function createSoloGame(options = {}) {
  return new TetrisGame(options);
}