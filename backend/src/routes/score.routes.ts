import { Router } from 'express';
import { scoreController } from '../controllers/score.controller';
import { authenticate } from '../middlewares/authenticate';
import { authorize } from '../middlewares/authorize';
import { validate } from '../middlewares/validate';
import {
  submitScoreSchema,
  submissionIdParamSchema,
  roundIdParamSchema,
} from '../validators/score.validator';

const router = Router();

router.use(authenticate);

/**
 * @openapi
 * /scores/submission/{submissionId}:
 *   post:
 *     summary: Submit scores for a team submission (JUDGE only)
 *     tags: [Scores]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: submissionId
 *         required: true
 *         schema:
 *           type: string
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - scores
 *             properties:
 *               scores:
 *                 type: array
 *                 items:
 *                   type: object
 *                   required:
 *                     - criterionId
 *                     - scoreValue
 *                   properties:
 *                     criterionId:
 *                       type: string
 *                       example: "criterion-uuid"
 *                     scoreValue:
 *                       type: number
 *                       example: 8.5
 *                     comments:
 *                       type: string
 *                       example: Excellent UI structure.
 *     responses:
 *       200:
 *         description: Scores submitted successfully
 *   get:
 *     summary: Get all scores for a submission (COORDINATOR and JUDGEs only)
 *     tags: [Scores]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: submissionId
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Scores retrieved successfully
 */
router.post(
  '/submission/:submissionId',
  authorize('INTERNAL_JUDGE', 'GUEST_JUDGE'),
  validate({ params: submissionIdParamSchema, body: submitScoreSchema }),
  scoreController.submitScores
);

router.get(
  '/submission/:submissionId',
  authorize('COORDINATOR', 'INTERNAL_JUDGE', 'GUEST_JUDGE', 'MENTOR'),
  validate({ params: submissionIdParamSchema }),
  scoreController.getScoresForSubmission
);

/**
 * @openapi
 * /scores/leaderboard/{roundId}:
 *   get:
 *     summary: Get the leaderboard for a round (All authenticated users)
 *     tags: [Scores]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: roundId
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Leaderboard retrieved successfully
 */
router.get(
  '/leaderboard/:roundId',
  validate({ params: roundIdParamSchema }),
  scoreController.getLeaderboard
);

/**
 * @openapi
 * /scores/rbl-analytics/{roundId}:
 *   get:
 *     summary: Get Inter-Rater Reliability (RBL) stats - ICC & Krippendorff Alpha (COORDINATOR only)
 *     tags: [Scores]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: roundId
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: RBL statistics retrieved successfully
 */
router.get(
  '/rbl-analytics/:roundId',
  authorize('COORDINATOR'),
  validate({ params: roundIdParamSchema }),
  scoreController.getRblAnalytics
);

export default router;
