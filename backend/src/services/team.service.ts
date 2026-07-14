import prisma from '../config/prisma';
import { ApiError } from '../utils/ApiError';
import { auditService } from './audit.service';
import { emailService } from './email.service';
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

    // Check if student is already in a team in this event
    const existingMembership = await prisma.teamMember.findFirst({
      where: {
        userId,
        team: {
          track: {
            eventId: track.eventId,
          },
        },
      },
    });
    if (existingMembership) {
      throw ApiError.conflict('You are already a member of a team in this event.');
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
        invitations: {
          where: { status: 'PENDING' },
          include: {
            user: { select: { id: true, fullName: true, email: true } },
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
    const team = await prisma.team.findUnique({ 
      where: { id },
      include: {
        members: {
          include: {
            user: { select: { fullName: true, email: true } }
          }
        }
      }
    });
    
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

    // Send email notification to team leader
    const leaderMember = team.members.find((m) => m.isLeader);
    if (leaderMember && leaderMember.user.email) {
      emailService.sendTeamStatusEmail(
        leaderMember.user.email,
        leaderMember.user.fullName,
        team.name,
        data.status,
        data.reasonBlocked || undefined
      ).catch((err) => console.error('Failed to send status update email:', err));
    }

    return updated;
  },

  /**
   * Invite a student member to a team.
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
      throw ApiError.forbidden('Only the team leader can invite members.');
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

    // Get track event info
    const track = await prisma.track.findUnique({
      where: { id: team.trackId },
      include: { event: true },
    });
    if (!track) {
      throw ApiError.notFound('Track not found.');
    }

    // Check if user is in another team in this event
    const otherMembership = await prisma.teamMember.findFirst({
      where: {
        userId,
        team: {
          track: {
            eventId: track.eventId,
          },
        },
      },
    });
    if (otherMembership) {
      throw ApiError.conflict('User is already in another team in this event.');
    }

    // Check if there is already a pending invitation to this team
    const existingInvitation = await prisma.teamInvitation.findUnique({
      where: {
        teamId_userId: { teamId, userId },
      },
    });
    if (existingInvitation && existingInvitation.status === 'PENDING') {
      throw ApiError.conflict('An invitation is already pending for this user.');
    }

    // Create or update invitation to PENDING
    const invitation = await prisma.teamInvitation.upsert({
      where: {
        teamId_userId: { teamId, userId },
      },
      update: {
        status: 'PENDING',
      },
      create: {
        teamId,
        userId,
        status: 'PENDING',
      },
      include: {
        user: { select: { id: true, fullName: true, email: true } },
      },
    });

    // Send invitation email
    const leaderUser = await prisma.user.findUnique({ where: { id: requesterId } });
    if (user.email) {
      emailService.sendTeamInvitationEmail(
        user.email,
        user.fullName,
        team.name,
        leaderUser?.fullName || 'Leader',
        track.event.name
      ).catch((err) => console.error('Failed to send team invitation email:', err));
    }

    return invitation;
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
            invitations: {
              where: { status: 'PENDING' },
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

  async getMyPendingInvitations(userId: string) {
    return prisma.teamInvitation.findMany({
      where: {
        userId,
        status: 'PENDING',
      },
      include: {
        team: {
          include: {
            track: {
              include: {
                event: true,
              },
            },
            members: {
              include: {
                user: { select: { fullName: true } }
              }
            }
          },
        },
      },
    });
  },

  async respondToInvitation(invitationId: string, userId: string, action: 'ACCEPT' | 'REJECT') {
    const invitation = await prisma.teamInvitation.findUnique({
      where: { id: invitationId },
      include: {
        team: {
          include: {
            track: true,
          },
        },
      },
    });
    if (!invitation) {
      throw ApiError.notFound('Invitation not found.');
    }
    if (invitation.userId !== userId) {
      throw ApiError.forbidden('This invitation is not for you.');
    }
    if (invitation.status !== 'PENDING') {
      throw ApiError.badRequest('This invitation has already been processed.');
    }

    if (action === 'ACCEPT') {
      // Check if user is already in a team in this event
      const otherMembership = await prisma.teamMember.findFirst({
        where: {
          userId,
          team: {
            track: {
              eventId: invitation.team.track.eventId,
            },
          },
        },
      });
      if (otherMembership) {
        throw ApiError.conflict('You are already in a team in this event.');
      }

      // Add to team members
      await prisma.teamMember.create({
        data: {
          teamId: invitation.teamId,
          userId,
          isLeader: false,
        },
      });

      // Update current invitation to ACCEPTED
      const updated = await prisma.teamInvitation.update({
        where: { id: invitationId },
        data: { status: 'ACCEPTED' },
      });

      // Reject all other pending invitations for this user in this event
      await prisma.teamInvitation.updateMany({
        where: {
          userId,
          status: 'PENDING',
          team: {
            track: {
              eventId: invitation.team.track.eventId,
            },
          },
        },
        data: {
          status: 'REJECTED',
        },
      });

      return updated;
    } else {
      const updated = await prisma.teamInvitation.update({
        where: { id: invitationId },
        data: { status: 'REJECTED' },
      });
      return updated;
    }
  },

  async cancelInvitation(invitationId: string, requesterId: string) {
    const invitation = await prisma.teamInvitation.findUnique({
      where: { id: invitationId },
      include: {
        team: {
          include: {
            members: true,
          },
        },
      },
    });
    if (!invitation) {
      throw ApiError.notFound('Invitation not found.');
    }

    const requesterMember = invitation.team.members.find((m) => m.userId === requesterId);
    if (!requesterMember || !requesterMember.isLeader) {
      throw ApiError.forbidden('Only the team leader can cancel invitations.');
    }
    if (invitation.status !== 'PENDING') {
      throw ApiError.badRequest('Only pending invitations can be cancelled.');
    }

    await prisma.teamInvitation.delete({
      where: { id: invitationId },
    });
    return { message: 'Invitation cancelled.' };
  },
};
