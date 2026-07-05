import express from 'express';
import http from 'node:http';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

import { config } from './config.js';
import { healthRouter } from './routes/health.js';
import { scoresRouter } from './routes/scores.js';
import { usersRouter } from './routes/users.js';
import { attachTetrisWs } from './ws/tetris-ws.js';
import { initDb } from './db/db.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const projectRoot = path.resolve(__dirname, '..');

const app = express();
app.use(express.json());

if (config.nodeEnv !== 'production') {
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
}

app.use('/health', healthRouter);
app.use('/api/health', healthRouter);
app.use('/api/scores', scoresRouter);
app.use('/api/users', usersRouter);

const clientDist = path.join(projectRoot, 'client', 'dist');

if (config.nodeEnv === 'production') {
  app.use(express.static(clientDist));

  app.get('*', (_req, res) => {
    res.sendFile(path.join(clientDist, 'index.html'));
  });
} else {
  app.get('/', (_req, res) => {
    res.json({
      ok: true,
      service: 'kannyan-tetris',
      ws: '/ws/tetris',
      client: config.clientDevOrigin
    });
  });
}

initDb();

const server = http.createServer(app);
attachTetrisWs(server);

server.listen(config.port, config.host, () => {
  console.log(`[server] listening on http://${config.host}:${config.port}`);
});