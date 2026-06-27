import { Router } from 'express';
import { teamController } from '../controllers/team.controller';
import { authenticate } from '../middlewares/authenticate';
import { authorize } from '../middlewares/authorize';
import { validate } from '../middlewares/validate';
import {
  createTeamSchema,
  addMemberSchema,
  updateTeamStatusSchema,
  teamIdParamSchema,
  trackIdParamSchema,
  removeMemberParamSchema,
} from '../validators/team.validator';

const router = Router();

router.use(authenticate);

/**
 * @openapi
 * /teams:
 *   post:
 *     summary: Create a new team (STUDENT only, becomes team leader)
 *     tags: [Teams]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - name
 *               - trackId
 *             properties:
 *               name:
 *                 type: string
 *                 example: Alpha Coders
 *               trackId:
 *                 type: string
 *                 example: "some-track-uuid"
 *     responses:
 *       201:
 *         description: Team created successfully
 */
router.post(
  '/',
  authorize('STUDENT'),
  validate({ body: createTeamSchema }),
  teamController.createTeam
);

/**
 * @openapi
 * /teams/my-team:
 *   get:
 *     summary: Get current user's team membership details (STUDENT only)
 *     tags: [Teams]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: List of team memberships for student
 */
router.get('/my-team', authorize('STUDENT'), teamController.getMyTeam);

/**
 * @openapi
 * /teams/track/{trackId}:
 *   get:
 *     summary: Get all teams in a specific track
 *     tags: [Teams]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: trackId
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: List of teams retrieved successfully
 */
router.get(
  '/track/:trackId',
  validate({ params: trackIdParamSchema }),
  teamController.getTeamsByTrack
);

/**
 * @openapi
 * /teams/{id}:
 *   get:
 *     summary: Get detailed information of a team by ID
 *     tags: [Teams]
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
 *         description: Team details retrieved successfully
 */
router.get(
  '/:id',
  validate({ params: teamIdParamSchema }),
  teamController.getTeamById
);

/**
 * @openapi
 * /teams/{id}/status:
 *   patch:
 *     summary: Update team status (approve/disqualify) (COORDINATOR only)
 *     tags: [Teams]
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
 *                 enum: [PENDING, APPROVED, DISQUALIFIED]
 *                 example: APPROVED
 *               reasonBlocked:
 *                 type: string
 *                 description: Required if status is DISQUALIFIED
 *                 example: Copying source code from another team.
 *     responses:
 *       200:
 *         description: Team status updated successfully
 */
router.patch(
  '/:id/status',
  authorize('COORDINATOR'),
  validate({ params: teamIdParamSchema, body: updateTeamStatusSchema }),
  teamController.updateTeamStatus
);

/**
 * @openapi
 * /teams/{id}/members:
 *   post:
 *     summary: Add a new student member to a team (STUDENT/Leader only)
 *     tags: [Teams]
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
 *                 description: User ID of student to add
 *                 example: "student-uuid"
 *     responses:
 *       201:
 *         description: Member added successfully
 */
router.post(
  '/:id/members',
  authorize('STUDENT'),
  validate({ params: teamIdParamSchema, body: addMemberSchema }),
  teamController.addMember
);

/**
 * @openapi
 * /teams/{id}/members/{userId}:
 *   delete:
 *     summary: Remove a student member from a team (STUDENT/Leader or the member themselves only)
 *     tags: [Teams]
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
 *         description: Member removed successfully
 */
router.delete(
  '/:id/members/:userId',
  authorize('STUDENT'),
  validate({ params: removeMemberParamSchema }),
  teamController.removeMember
);

export default router;
