import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import prisma from '../config/prisma';
import { env } from '../config/env';
import { ApiError } from '../utils/ApiError';
import { RegisterInput, LoginInput } from '../validators/auth.validator';
import { Role, UserStatus } from '@prisma/client';

const SALT_ROUNDS = 10;

function signToken(userId: string): string {
  return jwt.sign({ id: userId }, env.JWT_SECRET, {
    expiresIn: env.JWT_EXPIRES_IN as any,
  });
}

export const authService = {
  /**
   * Register a new user account.
   * Students get a linked StudentProfile.
   * Non-student roles start as PENDING and need coordinator approval.
   */
  async register(data: RegisterInput) {
    // Check existing email
    const existing = await prisma.user.findUnique({
      where: { email: data.email },
    });
    if (existing) {
      throw ApiError.conflict('Email is already in use.');
    }

    const passwordHash = await bcrypt.hash(data.password, SALT_ROUNDS);
    const role = data.role || Role.STUDENT;

    // Students are auto-approved for quick hackathon setup; other roles need approval
    const status = role === Role.STUDENT ? UserStatus.APPROVED : UserStatus.PENDING;

    const user = await prisma.user.create({
      data: {
        email: data.email,
        passwordHash,
        fullName: data.fullName,
        role,
        status,
        ...(role === Role.STUDENT && {
          studentProfile: {
            create: {
              isFptStudent: data.isFptStudent ?? true,
              studentCode: data.studentCode || 'UNASSIGNED',
              university: data.university || 'FPT University HCMC',
            },
          },
        }),
      },
      include: {
        studentProfile: true,
      },
    });

    const token = signToken(user.id);

    // Strip password hash
    const { passwordHash: _, ...userWithoutPassword } = user;
    return { user: userWithoutPassword, token };
  },

  /**
   * Authenticate a user and return a JWT.
   */
  async login(data: LoginInput) {
    const user = await prisma.user.findUnique({
      where: { email: data.email },
      include: { studentProfile: true },
    });

    if (!user) {
      throw ApiError.unauthorized('Incorrect email or password.');
    }

    const isMatch = await bcrypt.compare(data.password, user.passwordHash);
    if (!isMatch) {
      throw ApiError.unauthorized('Incorrect email or password.');
    }

    const token = signToken(user.id);
    const { passwordHash: _, ...userWithoutPassword } = user;
    return { user: userWithoutPassword, token };
  },

  /**
   * Get current user's profile.
   */
  async getMe(userId: string) {
    const user = await prisma.user.findUnique({
      where: { id: userId },
      include: { studentProfile: true },
    });

    if (!user) {
      throw ApiError.notFound('User no longer exists.');
    }

    const { passwordHash: _, ...userWithoutPassword } = user;
    return userWithoutPassword;
  },

  /**
   * Update current user's profile.
   */
  async updateProfile(userId: string, data: { fullName?: string; password?: string; university?: string; studentCode?: string }) {
    const user = await prisma.user.findUnique({
      where: { id: userId },
      include: { studentProfile: true },
    });
    if (!user) {
      throw ApiError.notFound('User no longer exists.');
    }

    const updateData: any = {};
    if (data.fullName) {
      updateData.fullName = data.fullName;
    }
    if (data.password) {
      updateData.passwordHash = await bcrypt.hash(data.password, SALT_ROUNDS);
    }

    // Update user
    await prisma.user.update({
      where: { id: userId },
      data: updateData,
    });

    // Update studentProfile if role is STUDENT
    if (user.role === Role.STUDENT && (data.university || data.studentCode)) {
      await prisma.studentProfile.update({
        where: { userId },
        data: {
          ...(data.university && { university: data.university }),
          ...(data.studentCode && { studentCode: data.studentCode }),
        },
      });
    }

    // Retrieve fresh user details
    const freshUser = await prisma.user.findUnique({
      where: { id: userId },
      include: { studentProfile: true },
    });

    const { passwordHash: _, ...userWithoutPassword } = freshUser!;
    return userWithoutPassword;
  },
};
