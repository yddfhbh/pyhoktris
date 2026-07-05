import { TetrisGame } from '../game/game.js';

export function createSprintGame(options = {}) {
  const game = new TetrisGame(options);
  game.targetLines = 40;
  return game;
}

export function isSprintFinished(game) {
  return game.lines >= 40;
}