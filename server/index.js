import express from 'express';
import http from 'node:http';

import { config } from './config.js';
import { healthRouter } from './routes/health.js';
import { scoresRouter } from './routes/scores.js';
import { usersRouter } from './routes/users.js';
import { attachTetrisWs } from './ws/tetris-ws.js';
import { initDb } from './db/db.js';

const app = express();

app.use(express.json());

app.use((req, res, next) => {
  res.setHeader('Access-Control-Allow-Origin', config.clientDevOrigin);
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  res.setHeader('Access-Control-Allow-Methods', 'GET,POST,OPTIONS');

  if (req.method === 'OPTIONS') {
    res.sendStatus(204);
    return;
  }

  next();
});

app.use('/health', healthRouter);
app.use('/api/health', healthRouter);
app.use('/api/scores', scoresRouter);
app.use('/api/users', usersRouter);

app.get('/', (_req, res) => {
  res.json({
    ok: true,
    service: 'kannyan-tetris',
    ws: '/ws/tetris'
  });
});

initDb();

const server = http.createServer(app);
attachTetrisWs(server);

server.listen(config.port, config.host, () => {
  console.log(`[server] listening on http://${config.host}:${config.port}`);
});
