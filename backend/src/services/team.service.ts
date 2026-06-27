import prisma from '../config/prisma';
import { ApiError } from '../utils/ApiError';
import { auditService } from './audit.service';
import { CreateTeamInput, UpdateTeamStatusInput } from '../validators/team.validator';

export const teamService = {
  /**
   * Create a new team. The creating student becomes the leader.
   */
  async createTeam(data: CreateTeamInput, userId: string) {
    // Verify track exists
    const track = await prisma.track.findUnique({ where: { id: data.trackId } });
    if (!track) {
      throw ApiError.notFound('Track not found.');
    }

    // Check if student is already in a team on this track
    const existingMembership = await prisma.teamMember.findFirst({
      where: {
        userId,
        team: { trackId: data.trackId },
      },
    });
    if (existingMembership) {
      throw ApiError.conflict('You are already a member of a team in this track.');
    }

    // Create team with the student as leader
    const team = await prisma.team.create({
      data: {
        trackId: data.trackId,
        name: data.name,
        members: {
          create: {
            userId,
            isLeader: true,
          },
        },
      },
      include: {
        members: {
          include: {
            user: { select: { id: true, fullName: true, email: true } },
          },
        },
      },
    });
    return team;
  },

  async getTeamsByTrack(trackId: string) {
    const teams = await prisma.team.findMany({
      where: { trackId },
      include: {
        members: {
          include: {
            user: { select: { id: true, fullName: true, email: true } },
          },
        },
      },
    });
    return teams;
  },

  async getTeamById(id: string) {
    const team = await prisma.team.findUnique({
      where: { id },
      include: {
        track: true,
        members: {
          include: {
            user: { select: { id: true, fullName: true, email: true, role: true } },
          },
        },
        submissions: true,
        prizes: true,
      },
    });
    if (!team) {
      throw ApiError.notFound('Team not found.');
    }
    return team;
  },

  /**
   * Update team status (approve/disqualify). Creates an audit log.
   */
  async updateTeamStatus(id: string, data: UpdateTeamStatusInput, actorId: string) {
    const team = await prisma.team.findUnique({ where: { id } });
    if (!team) {
      throw ApiError.notFound('Team not found.');
    }

    const updated = await prisma.team.update({
      where: { id },
      data: {
        status: data.status,
        reasonBlocked: data.status === 'DISQUALIFIED' ? data.reasonBlocked : null,
      },
    });

    // Create audit log
    await auditService.createLog({
      actorId,
      actionType: data.status === 'DISQUALIFIED' ? 'TEAM_DISQUALIFY' : 'TEAM_APPROVE',
      details: JSON.stringify({ teamId: id, teamName: team.name, newStatus: data.status }),
      reason: data.reasonBlocked || `Team ${data.status.toLowerCase()}`,
    });

    return updated;
  },

  /**
   * Add a student member to a team.
   */
  async addMember(teamId: string, userId: string, requesterId: string) {
    const team = await prisma.team.findUnique({
      where: { id: teamId },
      include: { members: true },
    });
    if (!team) {
      throw ApiError.notFound('Team not found.');
    }

    // Check if requester is team leader
    const requesterMember = team.members.find((m) => m.userId === requesterId);
    if (!requesterMember || !requesterMember.isLeader) {
      throw ApiError.forbidden('Only the team leader can add members.');
    }

    // Check if user exists and is a student
    const user = await prisma.user.findUnique({ where: { id: userId } });
    if (!user) {
      throw ApiError.notFound('User not found.');
    }
    if (user.role !== 'STUDENT') {
      throw ApiError.badRequest('Only students can be team members.');
    }

    // Check if already a member
    const existing = await prisma.teamMember.findUnique({
      where: { teamId_userId: { teamId, userId } },
    });
    if (existing) {
      throw ApiError.conflict('User is already a member of this team.');
    }

    // Check if user is in another team on same track
    const otherMembership = await prisma.teamMember.findFirst({
      where: {
        userId,
        team: { trackId: team.trackId },
      },
    });
    if (otherMembership) {
      throw ApiError.conflict('User is already in another team in this track.');
    }

    const member = await prisma.teamMember.create({
      data: { teamId, userId },
      include: {
        user: { select: { id: true, fullName: true, email: true } },
      },
    });
    return member;
  },

  /**
   * Remove a member from a team.
   */
  async removeMember(teamId: string, userId: string, requesterId: string) {
    const team = await prisma.team.findUnique({
      where: { id: teamId },
      include: { members: true },
    });
    if (!team) {
      throw ApiError.notFound('Team not found.');
    }

    // Check if requester is team leader or the user themselves
    const requesterMember = team.members.find((m) => m.userId === requesterId);
    if (!requesterMember) {
      throw ApiError.forbidden('You are not a member of this team.');
    }
    if (!requesterMember.isLeader && requesterId !== userId) {
      throw ApiError.forbidden('Only the team leader can remove other members.');
    }

    // Cannot remove the leader
    const targetMember = team.members.find((m) => m.userId === userId);
    if (!targetMember) {
      throw ApiError.notFound('User is not a member of this team.');
    }
    if (targetMember.isLeader) {
      throw ApiError.badRequest('Cannot remove the team leader. Transfer leadership first.');
    }

    await prisma.teamMember.delete({
      where: { teamId_userId: { teamId, userId } },
    });
    return { message: 'Member removed from team.' };
  },

  /**
   * Get the current user's team membership.
   */
  async getMyTeam(userId: string) {
    const memberships = await prisma.teamMember.findMany({
      where: { userId },
      include: {
        team: {
          include: {
            track: { include: { event: true } },
            members: {
              include: {
                user: { select: { id: true, fullName: true, email: true } },
              },
            },
            submissions: true,
            prizes: true,
          },
        },
      },
    });

    return memberships.map((m) => ({
      ...m.team,
      isLeader: m.isLeader,
    }));
  },
};
