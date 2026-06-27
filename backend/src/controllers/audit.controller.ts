import { Request, Response } from 'express';
import { asyncHandler } from '../middlewares/asyncHandler';
import { auditService } from '../services/audit.service';

export const auditController = {
  getLogs: asyncHandler(async (req: Request, res: Response) => {
    const result = await auditService.getLogs(req.query as any);
    res.status(200).json({
      success: true,
      ...result,
    });
  }),
};
