import prisma from '../config/prisma';
import { ApiError } from '../utils/ApiError';
import { SubmitScoreInput } from '../validators/score.validator';
import { calculateICC, calculateKrippendorffAlpha } from '../utils/rblStats';

export const scoreService = {
  /**
   * Submit scores for a submission. Judge must be assigned to the round.
   */
  async submitScores(submissionId: string, judgeId: string, data: SubmitScoreInput) {
    // Verify submission exists and is not disqualified
    const submission = await prisma.submission.findUnique({
      where: { id: submissionId },
      include: { round: { include: { criteria: true } } },
    });
    if (!submission) {
      throw ApiError.notFound('Submission not found.');
    }
    if (submission.isDisqualified) {
      throw ApiError.badRequest('Cannot score a disqualified submission.');
    }

    // Verify judge is assigned to this round
    const judgeAssignment = await prisma.roundJudge.findUnique({
      where: {
        roundId_userId: { roundId: submission.roundId, userId: judgeId },
      },
    });
    if (!judgeAssignment) {
      throw ApiError.forbidden('You are not assigned as a judge for this round.');
    }

    // Verify round is strictly in EVALUATION status
    if (submission.round.status !== 'EVALUATION') {
      throw ApiError.badRequest(
        'Scores can only be submitted or updated when the round is in EVALUATION status.'
      );
    }

    // Validate that all criteria IDs exist in this round
    const roundCriteriaIds = submission.round.criteria.map((c) => c.id);
    for (const score of data.scores) {
      if (!roundCriteriaIds.includes(score.criterionId)) {
        throw ApiError.badRequest(
          `Criterion ${score.criterionId} does not belong to this round.`
        );
      }

      // Validate score doesn't exceed maxPoints
      const criterion = submission.round.criteria.find(
        (c) => c.id === score.criterionId
      );
      if (criterion && score.scoreValue > criterion.maxPoints) {
        throw ApiError.badRequest(
          `Score for "${criterion.name}" exceeds max points (${criterion.maxPoints}).`
        );
      }
    }

    // Upsert scores (allow re-scoring)
    const results = [];
    for (const score of data.scores) {
      const existing = await prisma.score.findUnique({
        where: {
          submissionId_judgeId_criterionId: {
            submissionId,
            judgeId,
            criterionId: score.criterionId,
          },
        },
      });

      if (existing) {
        const updated = await prisma.score.update({
          where: { id: existing.id },
          data: {
            scoreValue: score.scoreValue,
            comments: score.comments,
          },
        });
        results.push(updated);
      } else {
        const created = await prisma.score.create({
          data: {
            submissionId,
            judgeId,
            criterionId: score.criterionId,
            scoreValue: score.scoreValue,
            comments: score.comments,
          },
        });
        results.push(created);
      }
    }

    return results;
  },

  /**
   * Get all scores for a submission.
   */
  async getScoresForSubmission(submissionId: string) {
    const scores = await prisma.score.findMany({
      where: { submissionId },
      include: {
        judge: { select: { id: true, fullName: true, email: true, role: true } },
        criterion: true,
      },
    });
    return scores;
  },

  /**
   * Get leaderboard for a round. Calculates weighted total scores.
   */
  async getLeaderboard(roundId: string) {
    const round = await prisma.round.findUnique({
      where: { id: roundId },
      include: { criteria: true },
    });
    if (!round) {
      throw ApiError.notFound('Round not found.');
    }

    const submissions = await prisma.submission.findMany({
      where: { roundId, isDisqualified: false },
      include: {
        team: {
          include: {
            track: true,
            members: {
              include: {
                user: { select: { id: true, fullName: true } },
              },
            },
          },
        },
        scores: {
          include: { criterion: true },
        },
      },
    });

    // Calculate weighted scores for each submission
    const leaderboard = submissions.map((submission) => {
      // Group scores by judge
      const judgeScores: Record<string, Record<string, number>> = {};
      for (const score of submission.scores) {
        if (!judgeScores[score.judgeId]) {
          judgeScores[score.judgeId] = {};
        }
        judgeScores[score.judgeId][score.criterionId] = score.scoreValue;
      }

      // For each judge, calculate their weighted total
      const judgeTotals: number[] = [];
      for (const judgeId of Object.keys(judgeScores)) {
        let total = 0;
        for (const criterion of round.criteria) {
          const rawScore = judgeScores[judgeId][criterion.id] || 0;
          // Normalize to 0-1 range then multiply by weight
          const normalizedScore = rawScore / criterion.maxPoints;
          total += normalizedScore * criterion.weight;
        }
        judgeTotals.push(total * 100); // Convert to percentage
      }

      // Average across judges
      const averageScore =
        judgeTotals.length > 0
          ? judgeTotals.reduce((sum, t) => sum + t, 0) / judgeTotals.length
          : 0;

      return {
        submissionId: submission.id,
        team: {
          id: submission.team.id,
          name: submission.team.name,
          trackName: submission.team.track.name,
          members: submission.team.members.map((m) => ({
            id: m.user.id,
            fullName: m.user.fullName,
            isLeader: m.isLeader,
          })),
        },
        averageScore: Math.round(averageScore * 100) / 100,
        judgeCount: Object.keys(judgeScores).length,
        submittedAt: submission.submittedAt,
      };
    });

    // Sort by average score descending
    leaderboard.sort((a, b) => b.averageScore - a.averageScore);

    // Assign ranks
    return leaderboard.map((entry, index) => ({
      rank: index + 1,
      ...entry,
    }));
  },

  /**
   * Get Inter-Rater Reliability analytics for a round.
   * Calculates ICC and Krippendorff's Alpha.
   */
  async getRblAnalytics(roundId: string) {
    const round = await prisma.round.findUnique({
      where: { id: roundId },
      include: {
        criteria: true,
        judges: true,
      },
    });
    if (!round) {
      throw ApiError.notFound('Round not found.');
    }

    const submissions = await prisma.submission.findMany({
      where: { roundId, isDisqualified: false },
      include: {
        scores: true,
      },
    });

    const judgeIds = round.judges.map((j) => j.userId);

    // Per-criterion analysis
    const criterionAnalytics = round.criteria.map((criterion) => {
      // Build matrix: rows = submissions, cols = judges
      const matrix: number[][] = [];
      const matrixWithNulls: (number | null)[][] = [];

      for (const submission of submissions) {
        const row: number[] = [];
        const rowWithNulls: (number | null)[] = [];
        for (const judgeId of judgeIds) {
          const score = submission.scores.find(
            (s) => s.judgeId === judgeId && s.criterionId === criterion.id
          );
          row.push(score ? score.scoreValue : 0);
          rowWithNulls.push(score ? score.scoreValue : null);
        }
        matrix.push(row);
        matrixWithNulls.push(rowWithNulls);
      }

      const icc = matrix.length > 1 && judgeIds.length > 1 ? calculateICC(matrix) : 0;
      const alpha = calculateKrippendorffAlpha(matrixWithNulls);

      return {
        criterionId: criterion.id,
        criterionName: criterion.name,
        isTechnical: criterion.isTechnical,
        icc: Math.round(icc * 1000) / 1000,
        krippendorffAlpha: Math.round(alpha * 1000) / 1000,
      };
    });

    // Overall matrix (all criteria combined weighted)
    const overallMatrix: number[][] = [];
    for (const submission of submissions) {
      const row: number[] = [];
      for (const judgeId of judgeIds) {
        let weightedTotal = 0;
        for (const criterion of round.criteria) {
          const score = submission.scores.find(
            (s) => s.judgeId === judgeId && s.criterionId === criterion.id
          );
          const normalizedScore = score
            ? score.scoreValue / criterion.maxPoints
            : 0;
          weightedTotal += normalizedScore * criterion.weight;
        }
        row.push(weightedTotal * 100);
      }
      overallMatrix.push(row);
    }

    const overallIcc =
      overallMatrix.length > 1 && judgeIds.length > 1
        ? calculateICC(overallMatrix)
        : 0;

    return {
      roundId,
      roundName: round.name,
      totalSubmissions: submissions.length,
      totalJudges: judgeIds.length,
      overallIcc: Math.round(overallIcc * 1000) / 1000,
      criterionAnalytics,
    };
  },
};
