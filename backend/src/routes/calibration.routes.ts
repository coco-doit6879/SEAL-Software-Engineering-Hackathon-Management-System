import { Router } from 'express';
import { calibrationController } from '../controllers/calibration.controller';
import { authenticate } from '../middlewares/authenticate';
import { authorize } from '../middlewares/authorize';
import { validate } from '../middlewares/validate';
import {
  createCalibrationSampleSchema,
  submitCalibrationScoreSchema,
  sampleIdParamSchema,
  roundIdParamSchema,
} from '../validators/calibration.validator';

const router = Router();

router.use(authenticate);

/**
 * @openapi
 * /calibration/samples:
 *   post:
 *     summary: Create a calibration project sample for judges to practice grading (COORDINATOR only)
 *     tags: [Calibration]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - roundId
 *               - title
 *               - repoUrl
 *               - demoUrl
 *             properties:
 *               roundId:
 *                 type: string
 *                 example: "round-uuid"
 *               title:
 *                 type: string
 *                 example: Demo Calibration Project
 *               description:
 *                 type: string
 *                 example: Sample codebase with minor UI issues to align judging standards.
 *               repoUrl:
 *                 type: string
 *                 example: "https://github.com/calibration/sample"
 *               demoUrl:
 *                 type: string
 *                 example: "https://sample.vercel.app"
 *               documentUrl:
 *                 type: string
 *                 example: "https://drive.google.com/sampledoc"
 *     responses:
 *       201:
 *         description: Sample created successfully
 */
router.post(
  '/samples',
  authorize('COORDINATOR'),
  validate({ body: createCalibrationSampleSchema }),
  calibrationController.createSample
);

/**
 * @openapi
 * /calibration/samples/round/{roundId}:
 *   get:
 *     summary: Get all calibration samples for a round (COORDINATOR and JUDGEs only)
 *     tags: [Calibration]
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
 *         description: Calibration samples retrieved successfully
 */
router.get(
  '/samples/round/:roundId',
  authorize('COORDINATOR', 'INTERNAL_JUDGE', 'GUEST_JUDGE'),
  validate({ params: roundIdParamSchema }),
  calibrationController.getSamplesByRound
);

/**
 * @openapi
 * /calibration/samples/{sampleId}/scores:
 *   post:
 *     summary: Submit calibration scores for a sample (JUDGE only)
 *     tags: [Calibration]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: sampleId
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
 *                       example: 7.5
 *                     comments:
 *                       type: string
 *                       example: Decent effort, logic is okay.
 *     responses:
 *       200:
 *         description: Scores submitted successfully
 */
router.post(
  '/samples/:sampleId/scores',
  authorize('INTERNAL_JUDGE', 'GUEST_JUDGE'),
  validate({ params: sampleIdParamSchema, body: submitCalibrationScoreSchema }),
  calibrationController.submitCalibrationScores
);

/**
 * @openapi
 * /calibration/results/{roundId}:
 *   get:
 *     summary: Get calibration results and alignment metrics for all judges in a round (COORDINATOR only)
 *     tags: [Calibration]
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
 *         description: Calibration results retrieved successfully
 */
router.get(
  '/results/:roundId',
  authorize('COORDINATOR'),
  validate({ params: roundIdParamSchema }),
  calibrationController.getCalibrationResults
);

export default router;
