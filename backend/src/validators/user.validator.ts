import { z } from 'zod';

export const updateUserStatusSchema = z.object({
  status: z.enum(['APPROVED', 'REJECTED'], {
    message: 'Status is required (APPROVED or REJECTED)',
  }),
});

export const userIdParamSchema = z.object({
  id: z.string().min(1, 'User ID is required'),
});

export const listUsersQuerySchema = z.object({
  role: z
    .enum(['COORDINATOR', 'INTERNAL_JUDGE', 'GUEST_JUDGE', 'MENTOR', 'STUDENT'])
    .optional(),
  status: z.enum(['PENDING', 'APPROVED', 'REJECTED']).optional(),
  page: z.string().optional(),
  limit: z.string().optional(),
  search: z.string().optional(),
});

export type UpdateUserStatusInput = z.infer<typeof updateUserStatusSchema>;
export type ListUsersQuery = z.infer<typeof listUsersQuerySchema>;
