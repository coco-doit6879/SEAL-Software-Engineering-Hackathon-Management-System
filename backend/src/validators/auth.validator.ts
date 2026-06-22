import { z } from 'zod';

export const registerSchema = z.object({
  email: z.string().email('Invalid email format'),
  password: z
    .string()
    .min(6, 'Password must be at least 6 characters')
    .max(100, 'Password must be at most 100 characters'),
  fullName: z.string().min(1, 'Full name is required').max(200),
  role: z
    .enum(['COORDINATOR', 'INTERNAL_JUDGE', 'GUEST_JUDGE', 'MENTOR', 'STUDENT'])
    .optional()
    .default('STUDENT'),
  // Student profile fields (optional, only used when role is STUDENT)
  isFptStudent: z.boolean().optional(),
  studentCode: z.string().optional(),
  university: z.string().optional(),
});

export const loginSchema = z.object({
  email: z.string().email('Invalid email format'),
  password: z.string().min(1, 'Password is required'),
});

export type RegisterInput = z.infer<typeof registerSchema>;
export type LoginInput = z.infer<typeof loginSchema>;
