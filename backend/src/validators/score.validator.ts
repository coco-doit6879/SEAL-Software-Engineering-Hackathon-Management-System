import { z } from 'zod';

export const submitScoreSchema = z.object({
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

export const submissionIdParamSchema = z.object({
  submissionId: z.string().min(1, 'Submission ID is required'),
});

export const roundIdParamSchema = z.object({
  roundId: z.string().min(1, 'Round ID is required'),
});

export type SubmitScoreInput = z.infer<typeof submitScoreSchema>;
