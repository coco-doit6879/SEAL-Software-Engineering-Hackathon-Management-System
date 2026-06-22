import { z } from 'zod';

export const createCalibrationSampleSchema = z.object({
  roundId: z.string().min(1, 'Round ID is required'),
  title: z.string().min(1, 'Title is required').max(200),
  description: z.string().optional(),
  repoUrl: z.string().url('Repository URL must be a valid URL'),
  demoUrl: z.string().url('Demo URL must be a valid URL'),
  documentUrl: z.string().url('Document URL must be a valid URL').optional(),
});

export const submitCalibrationScoreSchema = z.object({
  scores: z
    .array(
      z.object({
        criterionId: z.string().min(1, 'Criterion ID is required'),
        scoreValue: z.number().min(0, 'Score must be >= 0'),
        comments: z.string().optional(),
      })
    )
    .min(1, 'At least one score is required'),
});

export const sampleIdParamSchema = z.object({
  sampleId: z.string().min(1, 'Sample ID is required'),
});

export const roundIdParamSchema = z.object({
  roundId: z.string().min(1, 'Round ID is required'),
});

export type CreateCalibrationSampleInput = z.infer<typeof createCalibrationSampleSchema>;
export type SubmitCalibrationScoreInput = z.infer<typeof submitCalibrationScoreSchema>;
