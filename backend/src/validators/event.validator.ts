import { z } from 'zod';

export const createEventSchema = z.object({
  name: z.string().min(1, 'Event name is required').max(200),
  description: z.string().optional(),
  term: z.enum(['Spring', 'Summer', 'Fall'], {
    message: 'Term is required (Spring, Summer, or Fall)',
  }),
  year: z.number().int().min(2020).max(2100),
  status: z.enum(['DRAFT', 'ACTIVE', 'COMPLETED']).optional().default('DRAFT'),
});

export const updateEventSchema = z.object({
  name: z.string().min(1).max(200).optional(),
  description: z.string().optional(),
  term: z.enum(['Spring', 'Summer', 'Fall']).optional(),
  year: z.number().int().min(2020).max(2100).optional(),
  status: z.enum(['DRAFT', 'ACTIVE', 'COMPLETED']).optional(),
});

export const eventIdParamSchema = z.object({
  id: z.string().min(1, 'Event ID is required'),
});

export type CreateEventInput = z.infer<typeof createEventSchema>;
export type UpdateEventInput = z.infer<typeof updateEventSchema>;
