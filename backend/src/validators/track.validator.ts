import { z } from 'zod';

export const createTrackSchema = z.object({
  eventId: z.string().min(1, 'Event ID is required'),
  name: z.string().min(1, 'Track name is required').max(200),
  description: z.string().optional(),
});

export const updateTrackSchema = z.object({
  name: z.string().min(1).max(200).optional(),
  description: z.string().optional(),
});

export const trackIdParamSchema = z.object({
  id: z.string().min(1, 'Track ID is required'),
});

export const eventIdParamSchema = z.object({
  eventId: z.string().min(1, 'Event ID is required'),
});

export const assignMentorSchema = z.object({
  userId: z.string().min(1, 'User ID is required'),
});

export const removeMentorParamSchema = z.object({
  id: z.string().min(1, 'Track ID is required'),
  userId: z.string().min(1, 'User ID is required'),
});

export type CreateTrackInput = z.infer<typeof createTrackSchema>;
export type UpdateTrackInput = z.infer<typeof updateTrackSchema>;
