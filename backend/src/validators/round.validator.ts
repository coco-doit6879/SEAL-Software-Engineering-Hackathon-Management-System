import { z } from 'zod';

export const createRoundSchema = z.object({
  eventId: z.string().min(1, 'Event ID is required'),
  name: z.string().min(1, 'Round name is required').max(200),
  sequenceNumber: z.number().int().min(1),
  submissionDeadline: z.string().refine(
    (val) => !isNaN(Date.parse(val)),
    'Invalid date format for submission deadline'
  ),
  topNToProgress: z.number().int().min(1, 'Must allow at least 1 team to progress'),
});

export const updateRoundSchema = z.object({
  name: z.string().min(1).max(200).optional(),
  sequenceNumber: z.number().int().min(1).optional(),
  submissionDeadline: z
    .string()
    .refine((val) => !isNaN(Date.parse(val)), 'Invalid date format')
    .optional(),
  topNToProgress: z.number().int().min(1).optional(),
});

export const updateRoundStatusSchema = z.object({
  status: z.enum([
    'UPCOMING',
    'SUBMISSION_OPEN',
    'SUBMISSION_CLOSED',
    'CALIBRATION',
    'EVALUATION',
    'COMPLETED',
  ]),
});

export const addCriterionSchema = z.object({
  name: z.string().min(1, 'Criterion name is required').max(200),
  description: z.string().optional(),
  maxPoints: z.number().positive('Max points must be positive'),
  weight: z.number().min(0).max(1, 'Weight must be between 0 and 1'),
  isTechnical: z.boolean().optional().default(true),
});

export const assignJudgeSchema = z.object({
  userId: z.string().min(1, 'User ID is required'),
});

export const roundIdParamSchema = z.object({
  id: z.string().min(1, 'Round ID is required'),
});

export const eventIdParamSchema = z.object({
  eventId: z.string().min(1, 'Event ID is required'),
});

export const criterionIdParamSchema = z.object({
  id: z.string().min(1, 'Round ID is required'),
  criterionId: z.string().min(1, 'Criterion ID is required'),
});

export const judgeParamSchema = z.object({
  id: z.string().min(1, 'Round ID is required'),
  userId: z.string().min(1, 'User ID is required'),
});

export type CreateRoundInput = z.infer<typeof createRoundSchema>;
export type UpdateRoundInput = z.infer<typeof updateRoundSchema>;
export type AddCriterionInput = z.infer<typeof addCriterionSchema>;
