import prisma from '../config/prisma';
import { ApiError } from '../utils/ApiError';
import {
  CreateCalibrationSampleInput,
  SubmitCalibrationScoreInput,
} from '../validators/calibration.validator';
import { calculateICC, calculateKrippendorffAlpha } from '../utils/rblStats';

export const calibrationService = {
  /**
   * Create a calibration sample for a round.
   */
  async createCalibrationSample(data: CreateCalibrationSampleInput) {
    const round = await prisma.round.findUnique({ where: { id: data.roundId } });
    if (!round) {
      throw ApiError.notFound('Round not found.');
    }

    const sample = await prisma.calibrationSample.create({
      data: {
        roundId: data.roundId,
        title: data.title,
        description: data.description,
        repoUrl: data.repoUrl,
        demoUrl: data.demoUrl,
        documentUrl: data.documentUrl,
      },
    });
    return sample;
  },

  /**
   * Get calibration samples for a round.
   */
  async getSamplesByRound(roundId: string) {
    const samples = await prisma.calibrationSample.findMany({
      where: { roundId },
      include: {
        scores: {
          include: {
            judge: { select: { id: true, fullName: true } },
            criterion: true,
          },
        },
      },
    });
    return samples;
  },

  /**
   * Submit calibration scores for a sample.
   */
  async submitCalibrationScores(
    sampleId: string,
    judgeId: string,
    data: SubmitCalibrationScoreInput
  ) {
    const sample = await prisma.calibrationSample.findUnique({
      where: { id: sampleId },
      include: {
        round: { include: { criteria: true } },
      },
    });
    if (!sample) {
      throw ApiError.notFound('Calibration sample not found.');
    }

    // Verify judge is assigned to this round
    const judgeAssignment = await prisma.roundJudge.findUnique({
      where: {
        roundId_userId: { roundId: sample.roundId, userId: judgeId },
      },
    });
    if (!judgeAssignment) {
      throw ApiError.forbidden('You are not assigned as a judge for this round.');
    }

    // Validate criteria
    const roundCriteriaIds = sample.round.criteria.map((c) => c.id);
    for (const score of data.scores) {
      if (!roundCriteriaIds.includes(score.criterionId)) {
        throw ApiError.badRequest(
          `Criterion ${score.criterionId} does not belong to this round.`
        );
      }
    }

    // Upsert calibration scores
    const results = [];
    for (const score of data.scores) {
      const existing = await prisma.calibrationScore.findUnique({
        where: {
          calibrationSampleId_judgeId_criterionId: {
            calibrationSampleId: sampleId,
            judgeId,
            criterionId: score.criterionId,
          },
        },
      });

      if (existing) {
        const updated = await prisma.calibrationScore.update({
          where: { id: existing.id },
          data: {
            scoreValue: score.scoreValue,
            comments: score.comments,
          },
        });
        results.push(updated);
      } else {
        const created = await prisma.calibrationScore.create({
          data: {
            calibrationSampleId: sampleId,
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
   * Get calibration results for a round — comparing judges' scores on samples.
   */
  async getCalibrationResults(roundId: string) {
    const samples = await prisma.calibrationSample.findMany({
      where: { roundId },
      include: {
        scores: {
          include: {
            judge: { select: { id: true, fullName: true } },
            criterion: { select: { id: true, name: true, maxPoints: true } },
          },
        },
      },
    });

    const round = await prisma.round.findUnique({
      where: { id: roundId },
      include: { criteria: true, judges: { include: { user: { select: { id: true, fullName: true } } } } },
    });

    if (!round) {
      throw ApiError.notFound('Round not found.');
    }

    return {
      roundId,
      roundName: round.name,
      judges: round.judges.map((j) => ({ id: j.user.id, fullName: j.user.fullName })),
      criteria: round.criteria.map((c) => ({ id: c.id, name: c.name, maxPoints: c.maxPoints })),
      samples: samples.map((sample) => ({
        id: sample.id,
        title: sample.title,
        scores: sample.scores.map((s) => ({
          judgeId: s.judge.id,
          judgeName: s.judge.fullName,
          criterionId: s.criterion.id,
          criterionName: s.criterion.name,
          scoreValue: s.scoreValue,
          comments: s.comments,
        })),
      })),
    };
  },

  /**
   * Get calibration analytics (ICC, Alpha) for a round.
   */
  async getCalibrationAnalytics(roundId: string) {
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

    const samples = await prisma.calibrationSample.findMany({
      where: { roundId },
      include: {
        scores: true,
      },
    });

    const judgeIds = round.judges.map((j) => j.userId);

    // Per-criterion analysis
    const criterionAnalytics = round.criteria.map((criterion) => {
      // Build matrix: rows = samples, cols = judges
      const matrix: number[][] = [];
      const matrixWithNulls: (number | null)[][] = [];

      for (const sample of samples) {
        const row: number[] = [];
        const rowWithNulls: (number | null)[] = [];
        for (const judgeId of judgeIds) {
          const score = sample.scores.find(
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
    for (const sample of samples) {
      const row: number[] = [];
      for (const judgeId of judgeIds) {
        let weightedTotal = 0;
        for (const criterion of round.criteria) {
          const score = sample.scores.find(
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
      totalSamples: samples.length,
      totalJudges: judgeIds.length,
      overallIcc: Math.round(overallIcc * 1000) / 1000,
      criterionAnalytics,
    };
  },
};
