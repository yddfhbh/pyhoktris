import { Router } from 'express';

export const usersRouter = Router();

usersRouter.get('/me', (_req, res) => {
  res.json({
    id: 'guest',
    nickname: 'Guest',
    authenticated: false
  });
});
