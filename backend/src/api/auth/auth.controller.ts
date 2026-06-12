import type { Request, Response } from 'express';
import { authService } from './auth.service';

export const authController = {
  async register(req: Request, res: Response): Promise<void> {
    const { token, user } = await authService.register(req.body);
    res.status(201).json({ token, user });
  },

  async login(req: Request, res: Response): Promise<void> {
    const { token, user } = await authService.login(req.body);
    res.json({ token, user });
  },

  async me(req: Request, res: Response): Promise<void> {
    res.json({ user: req.user });
  },
};
