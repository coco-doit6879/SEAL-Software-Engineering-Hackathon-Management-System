import { z } from 'zod';

export const awardPrizeSchema = z.object({
  teamId: z.string().min(1, 'Team ID is required'),
  name: z.string().min(1, 'Prize name is required').max(200),
  description: z.string().optional(),
  rewardCash: z.number().min(0).optional(),
});

export const teamIdParamSchema = z.object({
  teamId: z.string().min(1, 'Team ID is required'),
});

export type AwardPrizeInput = z.infer<typeof awardPrizeSchema>;
