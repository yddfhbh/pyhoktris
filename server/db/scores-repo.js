import { getDb } from './db.js';

export function insertScore({
  name = 'guest',
  mode = 'sprint',
  score = 0,
  lines = 0,
  timeMs = 0
} = {}) {
  const db = getDb();
  const statement = db.prepare(`
    INSERT INTO scores (name, mode, score, lines, time_ms)
    VALUES (@name, @mode, @score, @lines, @timeMs)
  `);

  const result = statement.run({
    name: String(name).slice(0, 24),
    mode: String(mode).slice(0, 24),
    score: Math.max(0, Math.floor(Number(score) || 0)),
    lines: Math.max(0, Math.floor(Number(lines) || 0)),
    timeMs: Math.max(0, Math.floor(Number(timeMs) || 0))
  });

  return db.prepare('SELECT * FROM scores WHERE id = ?').get(result.lastInsertRowid);
}

export function getTopScores(mode = 'sprint', limit = 20) {
  const db = getDb();
  return db.prepare(`
    SELECT id, name, mode, score, lines, time_ms AS timeMs, created_at AS createdAt
    FROM scores
    WHERE mode = ?
    ORDER BY score DESC, time_ms ASC, id ASC
    LIMIT ?
  `).all(String(mode), Math.max(1, Math.min(100, Math.floor(Number(limit) || 20))));
}
