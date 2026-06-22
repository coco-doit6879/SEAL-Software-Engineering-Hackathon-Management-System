import { z } from 'zod';

export const createSubmissionSchema = z.object({
  roundId: z.string().min(1, 'Round ID is required'),
  teamId: z.string().min(1, 'Team ID is required'),
  repoUrl: z.string().url('Repository URL must be a valid URL'),
  demoUrl: z.string().url('Demo URL must be a valid URL'),
  documentUrl: z.string().url('Document URL must be a valid URL').optional(),
});

export const submissionIdParamSchema = z.object({
  id: z.string().min(1, 'Submission ID is required'),
});

export const roundIdParamSchema = z.object({
  roundId: z.string().min(1, 'Round ID is required'),
});

export const disqualifySubmissionSchema = z.object({
  reason: z.string().min(1, 'Disqualification reason is required'),
});

export type CreateSubmissionInput = z.infer<typeof createSubmissionSchema>;
