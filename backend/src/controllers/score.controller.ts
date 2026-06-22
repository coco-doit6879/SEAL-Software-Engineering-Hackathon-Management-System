import { Request, Response } from 'express';
import { asyncHandler } from '../middlewares/asyncHandler';
import { scoreService } from '../services/score.service';

export const scoreController = {
  submitScores: asyncHandler(async (req: Request, res: Response) => {
    const scores = await scoreService.submitScores(
      req.params.submissionId,
      req.user!.id,
      req.body
    );
    res.status(201).json({
      success: true,
      message: 'Scores submitted successfully.',
      data: scores,
    });
  }),

  getScoresForSubmission: asyncHandler(async (req: Request, res: Response) => {
    const scores = await scoreService.getScoresForSubmission(req.params.submissionId);
    res.status(200).json({
      success: true,
      data: scores,
    });
  }),

  getLeaderboard: asyncHandler(async (req: Request, res: Response) => {
    const leaderboard = await scoreService.getLeaderboard(req.params.roundId);
    res.status(200).json({
      success: true,
      data: leaderboard,
    });
  }),

  getRblAnalytics: asyncHandler(async (req: Request, res: Response) => {
    const analytics = await scoreService.getRblAnalytics(req.params.roundId);
    res.status(200).json({
      success: true,
      data: analytics,
    });
  }),
};
