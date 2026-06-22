import { Request, Response } from 'express';
import { asyncHandler } from '../middlewares/asyncHandler';
import { roundService } from '../services/round.service';

export const roundController = {
  createRound: asyncHandler(async (req: Request, res: Response) => {
    const round = await roundService.createRound(req.body);
    res.status(201).json({
      success: true,
      message: 'Round created successfully.',
      data: round,
    });
  }),

  getRoundsByEvent: asyncHandler(async (req: Request, res: Response) => {
    const rounds = await roundService.getRoundsByEvent(req.params.eventId);
    res.status(200).json({
      success: true,
      data: rounds,
    });
  }),

  getRoundById: asyncHandler(async (req: Request, res: Response) => {
    const round = await roundService.getRoundById(req.params.id);
    res.status(200).json({
      success: true,
      data: round,
    });
  }),

  updateRound: asyncHandler(async (req: Request, res: Response) => {
    const round = await roundService.updateRound(req.params.id, req.body);
    res.status(200).json({
      success: true,
      message: 'Round updated successfully.',
      data: round,
    });
  }),

  deleteRound: asyncHandler(async (req: Request, res: Response) => {
    const result = await roundService.deleteRound(req.params.id);
    res.status(200).json({
      success: true,
      ...result,
    });
  }),

  updateRoundStatus: asyncHandler(async (req: Request, res: Response) => {
    const round = await roundService.updateRoundStatus(req.params.id, req.body.status);
    res.status(200).json({
      success: true,
      message: `Round status updated to ${req.body.status}.`,
      data: round,
    });
  }),

  addCriterion: asyncHandler(async (req: Request, res: Response) => {
    const criterion = await roundService.addCriterion(req.params.id, req.body);
    res.status(201).json({
      success: true,
      message: 'Criterion added.',
      data: criterion,
    });
  }),

  removeCriterion: asyncHandler(async (req: Request, res: Response) => {
    const result = await roundService.removeCriterion(req.params.id, req.params.criterionId);
    res.status(200).json({
      success: true,
      ...result,
    });
  }),

  assignJudge: asyncHandler(async (req: Request, res: Response) => {
    const result = await roundService.assignJudge(req.params.id, req.body.userId);
    res.status(201).json({
      success: true,
      message: 'Judge assigned to round.',
      data: result,
    });
  }),

  removeJudge: asyncHandler(async (req: Request, res: Response) => {
    const result = await roundService.removeJudge(req.params.id, req.params.userId);
    res.status(200).json({
      success: true,
      ...result,
    });
  }),
};
