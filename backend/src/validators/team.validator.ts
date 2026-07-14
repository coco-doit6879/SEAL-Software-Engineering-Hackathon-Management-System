import { z } from 'zod';

export const createTeamSchema = z.object({
  trackId: z.string().min(1, 'Track ID is required'),
  name: z.string().min(1, 'Team name is required').max(100),
});

export const addMemberSchema = z.object({
  userId: z.string().min(1, 'User ID is required'),
});

export const updateTeamStatusSchema = z.object({
  status: z.enum(['APPROVED', 'DISQUALIFIED'], {
    message: 'Status must be APPROVED or DISQUALIFIED',
  }),
  reasonBlocked: z.string().optional(),
});

export const teamIdParamSchema = z.object({
  id: z.string().min(1, 'Team ID is required'),
});

export const trackIdParamSchema = z.object({
  trackId: z.string().min(1, 'Track ID is required'),
});

export const removeMemberParamSchema = z.object({
  id: z.string().min(1, 'Team ID is required'),
  userId: z.string().min(1, 'User ID is required'),
});

export type CreateTeamInput = z.infer<typeof createTeamSchema>;
export type UpdateTeamStatusInput = z.infer<typeof updateTeamStatusSchema>;

export const respondInvitationSchema = z.object({
  action: z.enum(['ACCEPT', 'REJECT'], {
    message: 'Action must be ACCEPT or REJECT',
  }),
});
