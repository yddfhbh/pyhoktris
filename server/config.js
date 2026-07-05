import dotenv from 'dotenv';
import path from 'node:path';

dotenv.config();

export const config = {
  nodeEnv: process.env.NODE_ENV ?? 'development',
  host: process.env.HOST ?? '127.0.0.1',
  port: Number(process.env.PORT ?? 3100),
  dbPath: process.env.DB_PATH
    ? path.resolve(process.env.DB_PATH)
    : path.resolve('data/tetris.sqlite'),
  clientDevOrigin: process.env.CLIENT_DEV_ORIGIN ?? 'http://localhost:5173'
};