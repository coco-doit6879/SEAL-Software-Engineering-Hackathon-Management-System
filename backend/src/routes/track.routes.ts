import { Router } from 'express';
import { trackController } from '../controllers/track.controller';
import { authenticate } from '../middlewares/authenticate';
import { authorize } from '../middlewares/authorize';
import { validate } from '../middlewares/validate';
import {
  createTrackSchema,
  updateTrackSchema,
  trackIdParamSchema,
  eventIdParamSchema,
  assignMentorSchema,
  removeMentorParamSchema,
} from '../validators/track.validator';

const router = Router();

router.use(authenticate);

/**
 * @openapi
 * /tracks:
 *   post:
 *     summary: Create a new competition track (COORDINATOR only)
 *     tags: [Tracks]
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
 *             properties:
 *               eventId:
 *                 type: string
 *                 example: "event-uuid"
 *               name:
 *                 type: string
 *                 example: "Web Application"
 *               description:
 *                 type: string
 *                 example: "Build a responsive web application using React/Next.js."
 *     responses:
 *       201:
 *         description: Track created successfully
 */
router.post(
  '/',
  authorize('COORDINATOR'),
  validate({ body: createTrackSchema }),
  trackController.createTrack
);

/**
 * @openapi
 * /tracks/event/{eventId}:
 *   get:
 *     summary: Get all tracks for an event
 *     tags: [Tracks]
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
 *         description: Tracks retrieved successfully
 */
router.get(
  '/event/:eventId',
  validate({ params: eventIdParamSchema }),
  trackController.getTracksByEvent
);

/**
 * @openapi
 * /tracks/{id}:
 *   put:
 *     summary: Update track details (COORDINATOR only)
 *     tags: [Tracks]
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
 *                 example: "Web Application - Updated"
 *               description:
 *                 type: string
 *                 example: "Updated track description"
 *     responses:
 *       200:
 *         description: Track updated successfully
 *   delete:
 *     summary: Delete a track by ID (COORDINATOR only)
 *     tags: [Tracks]
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
 *         description: Track deleted successfully
 */
router.put(
  '/:id',
  authorize('COORDINATOR'),
  validate({ params: trackIdParamSchema, body: updateTrackSchema }),
  trackController.updateTrack
);

router.delete(
  '/:id',
  authorize('COORDINATOR'),
  validate({ params: trackIdParamSchema }),
  trackController.deleteTrack
);

/**
 * @openapi
 * /tracks/{id}/mentors:
 *   post:
 *     summary: Assign a mentor to a track (COORDINATOR only)
 *     tags: [Tracks]
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
 *                 description: User ID of mentor
 *                 example: "mentor-user-uuid"
 *     responses:
 *       201:
 *         description: Mentor assigned successfully
 */
router.post(
  '/:id/mentors',
  authorize('COORDINATOR'),
  validate({ params: trackIdParamSchema, body: assignMentorSchema }),
  trackController.assignMentor
);

/**
 * @openapi
 * /tracks/{id}/mentors/{userId}:
 *   delete:
 *     summary: Remove a mentor from a track (COORDINATOR only)
 *     tags: [Tracks]
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
 *         description: Mentor removed successfully
 */
router.delete(
  '/:id/mentors/:userId',
  authorize('COORDINATOR'),
  validate({ params: removeMentorParamSchema }),
  trackController.removeMentor
);

export default router;
