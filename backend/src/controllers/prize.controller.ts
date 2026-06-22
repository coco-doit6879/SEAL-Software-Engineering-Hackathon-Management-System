import { Request, Response } from 'express';
import { asyncHandler } from '../middlewares/asyncHandler';
import { prizeService } from '../services/prize.service';

export const prizeController = {
  awardPrize: asyncHandler(async (req: Request, res: Response) => {
    const prize = await prizeService.awardPrize(req.body);
    res.status(201).json({
      success: true,
      message: 'Prize awarded successfully.',
      data: prize,
    });
  }),

  getPrizesByTeam: asyncHandler(async (req: Request, res: Response) => {
    const prizes = await prizeService.getPrizesByTeam(req.params.teamId);
    res.status(200).json({
      success: true,
      data: prizes,
    });
  }),
};
