import prisma from '../config/prisma';
import { ApiError } from '../utils/ApiError';
import {
  CreateRoundInput,
  UpdateRoundInput,
  AddCriterionInput,
} from '../validators/round.validator';

export const roundService = {
  async createRound(data: CreateRoundInput) {
    const event = await prisma.event.findUnique({ where: { id: data.eventId } });
    if (!event) {
      throw ApiError.notFound('Event not found.');
    }

    const round = await prisma.round.create({
      data: {
        eventId: data.eventId,
        name: data.name,
        sequenceNumber: data.sequenceNumber,
        submissionDeadline: new Date(data.submissionDeadline),
        topNToProgress: data.topNToProgress,
      },
    });
    return round;
  },

  async getRoundsByEvent(eventId: string) {
    const rounds = await prisma.round.findMany({
      where: { eventId },
      include: {
        criteria: true,
        judges: {
          include: {
            user: { select: { id: true, fullName: true, email: true, role: true } },
          },
        },
      },
      orderBy: { sequenceNumber: 'asc' },
    });
    return rounds;
  },

  async getRoundById(id: string) {
    const round = await prisma.round.findUnique({
      where: { id },
      include: {
        criteria: true,
        judges: {
          include: {
            user: { select: { id: true, fullName: true, email: true, role: true } },
          },
        },
        submissions: {
          include: {
            team: true,
          },
        },
        calibrationSamples: true,
      },
    });
    if (!round) {
      throw ApiError.notFound('Round not found.');
    }
    return round;
  },

  async updateRound(id: string, data: UpdateRoundInput) {
    const round = await prisma.round.findUnique({ where: { id } });
    if (!round) {
      throw ApiError.notFound('Round not found.');
    }

    const updateData: Record<string, any> = { ...data };
    if (data.submissionDeadline) {
      updateData.submissionDeadline = new Date(data.submissionDeadline);
    }

    const updated = await prisma.round.update({
      where: { id },
      data: updateData,
    });
    return updated;
  },

  async deleteRound(id: string) {
    const round = await prisma.round.findUnique({ where: { id } });
    if (!round) {
      throw ApiError.notFound('Round not found.');
    }

    await prisma.round.delete({ where: { id } });
    return { message: 'Round deleted successfully.' };
  },

  async updateRoundStatus(id: string, status: string) {
    const round = await prisma.round.findUnique({ where: { id } });
    if (!round) {
      throw ApiError.notFound('Round not found.');
    }

    const updated = await prisma.round.update({
      where: { id },
      data: { status: status as any },
    });
    return updated;
  },

  async addCriterion(roundId: string, data: AddCriterionInput) {
    const round = await prisma.round.findUnique({ where: { id: roundId } });
    if (!round) {
      throw ApiError.notFound('Round not found.');
    }

    const criterion = await prisma.roundCriterion.create({
      data: {
        roundId,
        name: data.name,
        description: data.description,
        maxPoints: data.maxPoints,
        weight: data.weight,
        isTechnical: data.isTechnical,
      },
    });
    return criterion;
  },

  async removeCriterion(roundId: string, criterionId: string) {
    const criterion = await prisma.roundCriterion.findFirst({
      where: { id: criterionId, roundId },
    });
    if (!criterion) {
      throw ApiError.notFound('Criterion not found in this round.');
    }

    await prisma.roundCriterion.delete({ where: { id: criterionId } });
    return { message: 'Criterion removed.' };
  },

  async assignJudge(roundId: string, userId: string) {
    const round = await prisma.round.findUnique({ where: { id: roundId } });
    if (!round) {
      throw ApiError.notFound('Round not found.');
    }

    const user = await prisma.user.findUnique({ where: { id: userId } });
    if (!user) {
      throw ApiError.notFound('User not found.');
    }
    if (user.role !== 'INTERNAL_JUDGE' && user.role !== 'GUEST_JUDGE') {
      throw ApiError.badRequest('User must be a judge (INTERNAL_JUDGE or GUEST_JUDGE).');
    }

    const existing = await prisma.roundJudge.findUnique({
      where: { roundId_userId: { roundId, userId } },
    });
    if (existing) {
      throw ApiError.conflict('Judge is already assigned to this round.');
    }

    const assignment = await prisma.roundJudge.create({
      data: { roundId, userId },
      include: {
        user: { select: { id: true, fullName: true, email: true, role: true } },
      },
    });
    return assignment;
  },

  async removeJudge(roundId: string, userId: string) {
    const assignment = await prisma.roundJudge.findUnique({
      where: { roundId_userId: { roundId, userId } },
    });
    if (!assignment) {
      throw ApiError.notFound('Judge assignment not found.');
    }

    await prisma.roundJudge.delete({
      where: { roundId_userId: { roundId, userId } },
    });
    return { message: 'Judge removed from round.' };
  },
};
