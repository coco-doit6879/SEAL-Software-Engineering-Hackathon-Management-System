import { Request, Response } from 'express';
import { asyncHandler } from '../middlewares/asyncHandler';
import { authService } from '../services/auth.service';

export const authController = {
  register: asyncHandler(async (req: Request, res: Response) => {
    const result = await authService.register(req.body);
    res.status(201).json({
      success: true,
      message: 'Registration successful.',
      data: result,
    });
  }),

  login: asyncHandler(async (req: Request, res: Response) => {
    const result = await authService.login(req.body);
    res.status(200).json({
      success: true,
      message: 'Login successful.',
      data: result,
    });
  }),

  getMe: asyncHandler(async (req: Request, res: Response) => {
    const user = await authService.getMe(req.user!.id);
    res.status(200).json({
      success: true,
      data: { user },
    });
  }),
};
