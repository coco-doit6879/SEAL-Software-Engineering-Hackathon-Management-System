import prisma from '../config/prisma';
import { ApiError } from '../utils/ApiError';
import { auditService } from './audit.service';
import { CreateSubmissionInput } from '../validators/submission.validator';
import { scoreService } from './score.service';
import { emailService } from './email.service';

export const submissionService = {
  /**
   * Create a submission. Only team leaders can submit.
   */
  async createSubmission(data: CreateSubmissionInput, userId: string) {
    // Verify round exists and is open for submissions
    const round = await prisma.round.findUnique({ where: { id: data.roundId } });
    if (!round) {
      throw ApiError.notFound('Round not found.');
    }
    if (round.status !== 'SUBMISSION_OPEN') {
      throw ApiError.badRequest('This round is not currently accepting submissions.');
    }

    // Verify team exists and is approved
    const team = await prisma.team.findUnique({
      where: { id: data.teamId },
      include: {
        members: {
          include: {
            user: { select: { id: true, fullName: true, email: true } },
          },
        },
        track: true,
      },
    });
    if (!team) {
      throw ApiError.notFound('Team not found.');
    }
    if (team.status !== 'APPROVED') {
      throw ApiError.badRequest('Team must be approved before submitting.');
    }

    // Check progression rules if sequenceNumber > 1
    if (round.sequenceNumber > 1) {
      const previousRound = await prisma.round.findFirst({
        where: {
          eventId: round.eventId,
          sequenceNumber: round.sequenceNumber - 1,
        },
      });

      if (!previousRound) {
        throw ApiError.notFound('Previous round in the sequence was not found.');
      }

      if (previousRound.status !== 'COMPLETED') {
        throw ApiError.badRequest(
          `The previous round "${previousRound.name}" must be marked as COMPLETED before you can submit to this round.`
        );
      }

      const leaderboard = await scoreService.getLeaderboard(previousRound.id);
      const trackLeaderboard = leaderboard.filter(
        (entry) => entry.team.trackName === team.track.name
      );

      const teamRankIndex = trackLeaderboard.findIndex(
        (entry) => entry.team.id === team.id
      );

      if (teamRankIndex === -1 || teamRankIndex >= previousRound.topNToProgress) {
        throw ApiError.forbidden(
          `Your team did not progress to this round. Only the top ${previousRound.topNToProgress} teams in track "${team.track.name}" can submit.`
        );
      }
    }

    // Verify user is the team leader
    const leaderMember = team.members.find(
      (m) => m.userId === userId && m.isLeader
    );
    if (!leaderMember) {
      throw ApiError.forbidden('Only the team leader can submit.');
    }

    // Check if already submitted for this round
    const existingSubmission = await prisma.submission.findUnique({
      where: { roundId_teamId: { roundId: data.roundId, teamId: data.teamId } },
    });
    if (existingSubmission) {
      throw ApiError.conflict('Team has already submitted for this round.');
    }

    // Check submission deadline
    if (new Date() > round.submissionDeadline) {
      throw ApiError.badRequest('Submission deadline has passed.');
    }

    const submission = await prisma.submission.create({
      data: {
        roundId: data.roundId,
        teamId: data.teamId,
        repoUrl: data.repoUrl,
        demoUrl: data.demoUrl,
        documentUrl: data.documentUrl,
      },
      include: {
        team: true,
        round: true,
      },
    });

    // Send email confirmation notification to team leader
    if (leaderMember && leaderMember.user.email) {
      emailService.sendSubmissionConfirmationEmail(
        leaderMember.user.email,
        leaderMember.user.fullName,
        team.name,
        round.name,
        submission.repoUrl,
        submission.demoUrl
      ).catch((err) => console.error('Failed to send submission confirmation email:', err));
    }

    return submission;
  },

  /**
   * Get all submissions for a round.
   */
  async getSubmissionsForRound(roundId: string) {
    const submissions = await prisma.submission.findMany({
      where: { roundId },
      include: {
        team: {
          include: {
            members: {
              include: {
                user: { select: { id: true, fullName: true, email: true } },
              },
            },
          },
        },
        scores: {
          include: {
            judge: { select: { id: true, fullName: true } },
            criterion: true,
          },
        },
      },
    });
    return submissions;
  },

  /**
   * Get a single submission by ID.
   */
  async getSubmissionById(id: string) {
    const submission = await prisma.submission.findUnique({
      where: { id },
      include: {
        team: {
          include: {
            members: {
              include: {
                user: { select: { id: true, fullName: true, email: true } },
              },
            },
          },
        },
        round: { include: { criteria: true } },
        scores: {
          include: {
            judge: { select: { id: true, fullName: true } },
            criterion: true,
          },
        },
      },
    });
    if (!submission) {
      throw ApiError.notFound('Submission not found.');
    }
    return submission;
  },

  /**
   * Disqualify a submission with reason. Creates an audit log.
   */
  async disqualifySubmission(id: string, reason: string, actorId: string) {
    const submission = await prisma.submission.findUnique({
      where: { id },
      include: { team: true },
    });
    if (!submission) {
      throw ApiError.notFound('Submission not found.');
    }

    const updated = await prisma.submission.update({
      where: { id },
      data: {
        isDisqualified: true,
        disqualificationReason: reason,
      },
    });

    // Audit log
    await auditService.createLog({
      actorId,
      actionType: 'SUBMISSION_DISQUALIFY',
      details: JSON.stringify({
        submissionId: id,
        teamName: submission.team.name,
        roundId: submission.roundId,
      }),
      reason,
    });

    return updated;
  },
};
