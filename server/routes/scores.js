import { Router } from 'express';
import { getTopScores, insertScore } from '../db/scores-repo.js';

export const scoresRouter = Router();

scoresRouter.get('/', (req, res) => {
  const mode = String(req.query.mode ?? 'sprint');
  const scores = getTopScores(mode);
  res.json(scores);
});

scoresRouter.post('/', (req, res) => {
  const name = String(req.body?.name ?? 'guest').slice(0, 24);
  const mode = String(req.body?.mode ?? 'sprint').slice(0, 24);
  const score = Number(req.body?.score ?? 0);
  const lines = Number(req.body?.lines ?? 0);
  const timeMs = Number(req.body?.timeMs ?? 0);

  if (!Number.isFinite(score) || score < 0) {
    res.status(400).json({ error: 'invalid_score' });
    return;
  }

  const saved = insertScore({
    name,
    mode,
    score,
    lines,
    timeMs
  });

  res.json(saved);
});