import { Router } from 'express';
import { roundController } from '../controllers/round.controller';
import { authenticate } from '../middlewares/authenticate';
import { authorize } from '../middlewares/authorize';
import { validate } from '../middlewares/validate';
import {
  createRoundSchema,
  updateRoundSchema,
  updateRoundStatusSchema,
  addCriterionSchema,
  assignJudgeSchema,
  roundIdParamSchema,
  eventIdParamSchema,
  criterionIdParamSchema,
  judgeParamSchema,
} from '../validators/round.validator';

const router = Router();

router.use(authenticate);

/**
 * @openapi
 * /rounds:
 *   post:
 *     summary: Create a new round (COORDINATOR only)
 *     tags: [Rounds]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - eventId
 *               - name
 *               - sequenceNumber
 *               - submissionDeadline
 *               - topNToProgress
 *             properties:
 *               eventId:
 *                 type: string
 *                 example: "event-uuid"
 *               name:
 *                 type: string
 *                 example: Preliminary Round
 *               sequenceNumber:
 *                 type: integer
 *                 example: 1
 *               submissionDeadline:
 *                 type: string
 *                 format: date-time
 *                 example: "2026-07-01T23:59:59.000Z"
 *               topNToProgress:
 *                 type: integer
 *                 example: 10
 *     responses:
 *       201:
 *         description: Round created successfully
 */
router.post(
  '/',
  authorize('COORDINATOR'),
  validate({ body: createRoundSchema }),
  roundController.createRound
);

/**
 * @openapi
 * /rounds/event/{eventId}:
 *   get:
 *     summary: Get all rounds for an event
 *     tags: [Rounds]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: eventId
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Rounds retrieved successfully
 */
router.get(
  '/event/:eventId',
  validate({ params: eventIdParamSchema }),
  roundController.getRoundsByEvent
);

/**
 * @openapi
 * /rounds/{id}:
 *   get:
 *     summary: Get detailed information of a round by ID
 *     tags: [Rounds]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Round details retrieved successfully
 *   put:
 *     summary: Update round details (COORDINATOR only)
 *     tags: [Rounds]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               name:
 *                 type: string
 *                 example: Preliminary Round - Updated
 *               submissionDeadline:
 *                 type: string
 *                 format: date-time
 *                 example: "2026-07-05T23:59:59.000Z"
 *               topNToProgress:
 *                 type: integer
 *                 example: 8
 *     responses:
 *       200:
 *         description: Round updated successfully
 *   delete:
 *     summary: Delete a round by ID (COORDINATOR only)
 *     tags: [Rounds]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Round deleted successfully
 */
router.get(
  '/:id',
  validate({ params: roundIdParamSchema }),
  roundController.getRoundById
);

router.put(
  '/:id',
  authorize('COORDINATOR'),
  validate({ params: roundIdParamSchema, body: updateRoundSchema }),
  roundController.updateRound
);

router.delete(
  '/:id',
  authorize('COORDINATOR'),
  validate({ params: roundIdParamSchema }),
  roundController.deleteRound
);

/**
 * @openapi
 * /rounds/{id}/status:
 *   patch:
 *     summary: Update round status (COORDINATOR only)
 *     tags: [Rounds]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
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
 *               - status
 *             properties:
 *               status:
 *                 type: string
 *                 enum: [UPCOMING, SUBMISSION_OPEN, SUBMISSION_CLOSED, CALIBRATION, EVALUATION, COMPLETED]
 *                 example: SUBMISSION_OPEN
 *     responses:
 *       200:
 *         description: Round status updated successfully
 */
router.patch(
  '/:id/status',
  authorize('COORDINATOR'),
  validate({ params: roundIdParamSchema, body: updateRoundStatusSchema }),
  roundController.updateRoundStatus
);

/**
 * @openapi
 * /rounds/{id}/criteria:
 *   post:
 *     summary: Add scoring criterion to a round (COORDINATOR only)
 *     tags: [Rounds]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
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
 *               - name
 *               - maxPoints
 *               - weight
 *             properties:
 *               name:
 *                 type: string
 *                 example: "UI/UX & Frontend Design"
 *               description:
 *                 type: string
 *                 example: "Aesthetics, responsiveness, and user experience"
 *               maxPoints:
 *                 type: number
 *                 example: 10
 *               weight:
 *                 type: number
 *                 example: 0.3
 *               isTechnical:
 *                 type: boolean
 *                 example: true
 *     responses:
 *       201:
 *         description: Criterion added successfully
 */
router.post(
  '/:id/criteria',
  authorize('COORDINATOR'),
  validate({ params: roundIdParamSchema, body: addCriterionSchema }),
  roundController.addCriterion
);

/**
 * @openapi
 * /rounds/{id}/criteria/{criterionId}:
 *   delete:
 *     summary: Remove scoring criterion from a round (COORDINATOR only)
 *     tags: [Rounds]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *       - in: path
 *         name: criterionId
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Criterion removed successfully
 */
router.delete(
  '/:id/criteria/:criterionId',
  authorize('COORDINATOR'),
  validate({ params: criterionIdParamSchema }),
  roundController.removeCriterion
);

/**
 * @openapi
 * /rounds/{id}/judges:
 *   post:
 *     summary: Assign a judge to a round (COORDINATOR only)
 *     tags: [Rounds]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
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
 *               - userId
 *             properties:
 *               userId:
 *                 type: string
 *                 description: User ID of judge
 *                 example: "judge-user-uuid"
 *     responses:
 *       201:
 *         description: Judge assigned successfully
 */
router.post(
  '/:id/judges',
  authorize('COORDINATOR'),
  validate({ params: roundIdParamSchema, body: assignJudgeSchema }),
  roundController.assignJudge
);

/**
 * @openapi
 * /rounds/{id}/judges/{userId}:
 *   delete:
 *     summary: Remove a judge from a round (COORDINATOR only)
 *     tags: [Rounds]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *       - in: path
 *         name: userId
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Judge removed successfully
 */
router.delete(
  '/:id/judges/:userId',
  authorize('COORDINATOR'),
  validate({ params: judgeParamSchema }),
  roundController.removeJudge
);

export default router;
