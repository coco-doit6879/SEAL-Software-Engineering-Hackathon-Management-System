import { Request, Response } from 'express';
import { asyncHandler } from '../middlewares/asyncHandler';
import { submissionService } from '../services/submission.service';

export const submissionController = {
  createSubmission: asyncHandler(async (req: Request, res: Response) => {
    const submission = await submissionService.createSubmission(req.body, req.user!.id);
    res.status(201).json({
      success: true,
      message: 'Submission created successfully.',
      data: submission,
    });
  }),

  getSubmissionsForRound: asyncHandler(async (req: Request, res: Response) => {
    const submissions = await submissionService.getSubmissionsForRound(req.params.roundId);
    res.status(200).json({
      success: true,
      data: submissions,
    });
  }),

  getSubmissionById: asyncHandler(async (req: Request, res: Response) => {
    const submission = await submissionService.getSubmissionById(req.params.id);
    res.status(200).json({
      success: true,
      data: submission,
    });
  }),

  disqualifySubmission: asyncHandler(async (req: Request, res: Response) => {
    const submission = await submissionService.disqualifySubmission(
      req.params.id,
      req.body.reason,
      req.user!.id
    );
    res.status(200).json({
      success: true,
      message: 'Submission disqualified.',
      data: submission,
    });
  }),
};
