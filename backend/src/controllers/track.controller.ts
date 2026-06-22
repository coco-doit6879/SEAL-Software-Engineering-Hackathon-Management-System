import { Request, Response } from 'express';
import { asyncHandler } from '../middlewares/asyncHandler';
import { trackService } from '../services/track.service';

export const trackController = {
  createTrack: asyncHandler(async (req: Request, res: Response) => {
    const track = await trackService.createTrack(req.body);
    res.status(201).json({
      success: true,
      message: 'Track created successfully.',
      data: track,
    });
  }),

  getTracksByEvent: asyncHandler(async (req: Request, res: Response) => {
    const tracks = await trackService.getTracksByEvent(req.params.eventId);
    res.status(200).json({
      success: true,
      data: tracks,
    });
  }),

  updateTrack: asyncHandler(async (req: Request, res: Response) => {
    const track = await trackService.updateTrack(req.params.id, req.body);
    res.status(200).json({
      success: true,
      message: 'Track updated successfully.',
      data: track,
    });
  }),

  deleteTrack: asyncHandler(async (req: Request, res: Response) => {
    const result = await trackService.deleteTrack(req.params.id);
    res.status(200).json({
      success: true,
      ...result,
    });
  }),

  assignMentor: asyncHandler(async (req: Request, res: Response) => {
    const result = await trackService.assignMentor(req.params.id, req.body.userId);
    res.status(201).json({
      success: true,
      message: 'Mentor assigned to track.',
      data: result,
    });
  }),

  removeMentor: asyncHandler(async (req: Request, res: Response) => {
    const result = await trackService.removeMentor(req.params.id, req.params.userId);
    res.status(200).json({
      success: true,
      ...result,
    });
  }),
};
