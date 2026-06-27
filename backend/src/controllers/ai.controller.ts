import { Request, Response } from 'express';
import { asyncHandler } from '../middlewares/asyncHandler';
import { aiService } from '../services/ai.service';

export const aiController = {
  seedRules: asyncHandler(async (req: Request, res: Response) => {
    const result = await aiService.seedRules();
    res.status(200).json({
      success: true,
      ...result,
    });
  }),

  chatRules: asyncHandler(async (req: Request, res: Response) => {
    const result = await aiService.chatRules(req.body.message);
    res.status(200).json({
      success: true,
      data: result,
    });
  }),

  analyzeEvent: asyncHandler(async (req: Request, res: Response) => {
    const result = await aiService.analyzeEvent(req.params.eventId);
    res.status(200).json({
      success: true,
      data: result,
    });
  }),
};
