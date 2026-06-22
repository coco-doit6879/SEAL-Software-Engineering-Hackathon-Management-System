import { Request, Response } from 'express';
import { asyncHandler } from '../middlewares/asyncHandler';
import { userService } from '../services/user.service';

export const userController = {
  getAllUsers: asyncHandler(async (req: Request, res: Response) => {
    const result = await userService.getAllUsers(req.query as any);
    res.status(200).json({
      success: true,
      ...result,
    });
  }),

  getUserById: asyncHandler(async (req: Request, res: Response) => {
    const user = await userService.getUserById(req.params.id);
    res.status(200).json({
      success: true,
      data: user,
    });
  }),

  updateUserStatus: asyncHandler(async (req: Request, res: Response) => {
    const user = await userService.updateUserStatus(req.params.id, req.body);
    res.status(200).json({
      success: true,
      message: `User status updated to ${req.body.status}.`,
      data: user,
    });
  }),
};
