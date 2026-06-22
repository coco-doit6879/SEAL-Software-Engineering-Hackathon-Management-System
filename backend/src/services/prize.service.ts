import prisma from '../config/prisma';
import { ApiError } from '../utils/ApiError';
import { AwardPrizeInput } from '../validators/prize.validator';

export const prizeService = {
  /**
   * Award a prize to a team.
   */
  async awardPrize(data: AwardPrizeInput) {
    const team = await prisma.team.findUnique({ where: { id: data.teamId } });
    if (!team) {
      throw ApiError.notFound('Team not found.');
    }

    const prize = await prisma.prize.create({
      data: {
        teamId: data.teamId,
        name: data.name,
        description: data.description,
        rewardCash: data.rewardCash,
      },
      include: {
        team: { select: { id: true, name: true } },
      },
    });
    return prize;
  },

  /**
   * Get all prizes for a team.
   */
  async getPrizesByTeam(teamId: string) {
    const prizes = await prisma.prize.findMany({
      where: { teamId },
      include: {
        team: { select: { id: true, name: true } },
      },
      orderBy: { awardedAt: 'desc' },
    });
    return prizes;
  },
};
