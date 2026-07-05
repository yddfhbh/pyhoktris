import { TetrisGame } from '../game/game.js';

export function createVersusGame({ seed, onAttack, onGameOver } = {}) {
  return new TetrisGame({
    seed,
    onAttack,
    onGameOver
  });
}