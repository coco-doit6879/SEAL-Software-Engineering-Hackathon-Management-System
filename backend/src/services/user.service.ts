import prisma from '../config/prisma';
import { ApiError } from '../utils/ApiError';
import { parsePagination, paginatedResponse } from '../utils/helpers';
import { ListUsersQuery, UpdateUserStatusInput } from '../validators/user.validator';

export const userService = {
  /**
   * Get all users with optional filtering by role, status, and search.
   */
  async getAllUsers(query: ListUsersQuery) {
    const { page, limit, skip } = parsePagination(query);

    const where: Record<string, any> = {};
    if (query.role) where.role = query.role;
    if (query.status) where.status = query.status;
    if (query.search) {
      where.OR = [
        { fullName: { contains: query.search, mode: 'insensitive' } },
        { email: { contains: query.search, mode: 'insensitive' } },
      ];
    }

    const [users, total] = await Promise.all([
      prisma.user.findMany({
        where,
        select: {
          id: true,
          email: true,
          fullName: true,
          role: true,
          status: true,
          createdAt: true,
          updatedAt: true,
          studentProfile: true,
        },
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
      }),
      prisma.user.count({ where }),
    ]);

    return paginatedResponse(users, total, page, limit);
  },

  /**
   * Get a single user by ID.
   */
  async getUserById(id: string) {
    const user = await prisma.user.findUnique({
      where: { id },
      select: {
        id: true,
        email: true,
        fullName: true,
        role: true,
        status: true,
        createdAt: true,
        updatedAt: true,
        studentProfile: true,
        mentorTracks: { include: { track: true } },
        judgeRounds: { include: { round: true } },
        teamMembers: { include: { team: true } },
      },
    });

    if (!user) {
      throw ApiError.notFound('User not found.');
    }

    return user;
  },

  /**
   * Update a user's status (approve/reject).
   */
  async updateUserStatus(id: string, data: UpdateUserStatusInput) {
    const user = await prisma.user.findUnique({ where: { id } });
    if (!user) {
      throw ApiError.notFound('User not found.');
    }

    const updated = await prisma.user.update({
      where: { id },
      data: { status: data.status },
      select: {
        id: true,
        email: true,
        fullName: true,
        role: true,
        status: true,
        createdAt: true,
        updatedAt: true,
      },
    });

    return updated;
  },

  /**
   * Get a user by email and role.
   */
  async getUserByEmailAndRole(email: string, role: string) {
    const user = await prisma.user.findFirst({
      where: {
        email: { equals: email, mode: 'insensitive' },
        role: role as any,
      },
      select: {
        id: true,
        email: true,
        fullName: true,
        role: true,
      },
    });
    if (!user) {
      throw ApiError.notFound('Không tìm thấy tài khoản sinh viên với email này.');
    }
    return user;
  },
};
