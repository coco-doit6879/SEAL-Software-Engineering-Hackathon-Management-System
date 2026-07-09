import { Request, Response } from 'express';
import { asyncHandler } from '../middlewares/asyncHandler';
import { userService } from '../services/user.service';
import { ApiError } from '../utils/ApiError';

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

  searchStudentByEmail: asyncHandler(async (req: Request, res: Response) => {
    const email = req.query.email as string;
    if (!email) {
      throw ApiError.badRequest('Vui lòng cung cấp email tìm kiếm.');
    }
    const user = await userService.getUserByEmailAndRole(email, 'STUDENT');
    res.status(200).json({
      success: true,
      data: user,
    });
  }),
};
