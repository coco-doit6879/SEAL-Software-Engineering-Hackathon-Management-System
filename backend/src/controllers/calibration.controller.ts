import { Request, Response } from 'express';
import { asyncHandler } from '../middlewares/asyncHandler';
import { calibrationService } from '../services/calibration.service';

export const calibrationController = {
  createSample: asyncHandler(async (req: Request, res: Response) => {
    const sample = await calibrationService.createCalibrationSample(req.body);
    res.status(201).json({
      success: true,
      message: 'Calibration sample created.',
      data: sample,
    });
  }),

  getSamplesByRound: asyncHandler(async (req: Request, res: Response) => {
    const samples = await calibrationService.getSamplesByRound(req.params.roundId);
    res.status(200).json({
      success: true,
      data: samples,
    });
  }),

  submitCalibrationScores: asyncHandler(async (req: Request, res: Response) => {
    const scores = await calibrationService.submitCalibrationScores(
      req.params.sampleId,
      req.user!.id,
      req.body
    );
    res.status(201).json({
      success: true,
      message: 'Calibration scores submitted.',
      data: scores,
    });
  }),

  getCalibrationResults: asyncHandler(async (req: Request, res: Response) => {
    const results = await calibrationService.getCalibrationResults(req.params.roundId);
    res.status(200).json({
      success: true,
      data: results,
    });
  }),

  getCalibrationAnalytics: asyncHandler(async (req: Request, res: Response) => {
    const analytics = await calibrationService.getCalibrationAnalytics(req.params.roundId);
    res.status(200).json({
      success: true,
      data: analytics,
    });
  }),
};
