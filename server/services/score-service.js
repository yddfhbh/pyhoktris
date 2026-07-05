import { insertScore, getTopScores } from '../db/scores-repo.js';

export function saveScore(input) {
  return insertScore(input);
}

export function listTopScores(mode) {
  return getTopScores(mode);
}