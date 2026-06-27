import prisma from '../config/prisma';
import { parsePagination, paginatedResponse } from '../utils/helpers';

interface CreateLogInput {
  actorId: string;
  actionType: string;
  details: string;
  reason: string;
}

export const auditService = {
  /**
   * Create an audit log entry.
   */
  async createLog(data: CreateLogInput) {
    const log = await prisma.auditLog.create({
      data: {
        actorId: data.actorId,
        actionType: data.actionType,
        details: data.details,
        reason: data.reason,
      },
    });
    return log;
  },

  /**
   * Get audit logs with pagination and optional filters.
   */
  async getLogs(query: {
    page?: string;
    limit?: string;
    actionType?: string;
    actorId?: string;
  }) {
    const { page, limit, skip } = parsePagination(query);

    const where: Record<string, any> = {};
    if (query.actionType) where.actionType = query.actionType;
    if (query.actorId) where.actorId = query.actorId;

    const [logs, total] = await Promise.all([
      prisma.auditLog.findMany({
        where,
        include: {
          actor: {
            select: { id: true, fullName: true, email: true, role: true },
          },
        },
        skip,
        take: limit,
        orderBy: { timestamp: 'desc' },
      }),
      prisma.auditLog.count({ where }),
    ]);

    return paginatedResponse(logs, total, page, limit);
  },
};
