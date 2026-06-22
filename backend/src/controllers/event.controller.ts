import { Request, Response } from 'express';
import { asyncHandler } from '../middlewares/asyncHandler';
import { eventService } from '../services/event.service';

export const eventController = {
  createEvent: asyncHandler(async (req: Request, res: Response) => {
    const event = await eventService.createEvent(req.body);
    res.status(201).json({
      success: true,
      message: 'Event created successfully.',
      data: event,
    });
  }),

  getEvents: asyncHandler(async (_req: Request, res: Response) => {
    const events = await eventService.getEvents();
    res.status(200).json({
      success: true,
      data: events,
    });
  }),

  getEventById: asyncHandler(async (req: Request, res: Response) => {
    const event = await eventService.getEventById(req.params.id);
    res.status(200).json({
      success: true,
      data: event,
    });
  }),

  updateEvent: asyncHandler(async (req: Request, res: Response) => {
    const event = await eventService.updateEvent(req.params.id, req.body);
    res.status(200).json({
      success: true,
      message: 'Event updated successfully.',
      data: event,
    });
  }),

  deleteEvent: asyncHandler(async (req: Request, res: Response) => {
    const result = await eventService.deleteEvent(req.params.id);
    res.status(200).json({
      success: true,
      ...result,
    });
  }),
};
