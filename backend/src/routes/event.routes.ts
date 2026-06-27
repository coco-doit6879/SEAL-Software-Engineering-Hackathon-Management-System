import { Router } from 'express';
import { eventController } from '../controllers/event.controller';
import { authenticate } from '../middlewares/authenticate';
import { authorize } from '../middlewares/authorize';
import { validate } from '../middlewares/validate';
import {
  createEventSchema,
  updateEventSchema,
  eventIdParamSchema,
} from '../validators/event.validator';

const router = Router();

// All event routes require authentication
router.use(authenticate);

/**
 * @openapi
 * /events:
 *   post:
 *     summary: Create a new hackathon event (COORDINATOR only)
 *     tags: [Events]
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
 *               - term
 *               - year
 *             properties:
 *               name:
 *                 type: string
 *                 example: SEAL Hackathon 2026
 *               description:
 *                 type: string
 *                 example: Annual academic software engineering hackathon at FPT University HCMC.
 *               term:
 *                 type: string
 *                 enum: [Spring, Summer, Fall]
 *                 example: Summer
 *               year:
 *                 type: integer
 *                 example: 2026
 *     responses:
 *       210:
 *         description: Event created successfully
 *   get:
 *     summary: Get all hackathon events
 *     tags: [Events]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: List of events retrieved successfully
 */
router.post(
  '/',
  authorize('COORDINATOR'),
  validate({ body: createEventSchema }),
  eventController.createEvent
);

router.get('/', eventController.getEvents);

/**
 * @openapi
 * /events/{id}:
 *   get:
 *     summary: Get details of an event by ID
 *     tags: [Events]
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
 *         description: Event details retrieved successfully
 *   put:
 *     summary: Update an event by ID (COORDINATOR only)
 *     tags: [Events]
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
 *                 example: SEAL Hackathon 2026 - Updated
 *               description:
 *                 type: string
 *                 example: Updated description
 *               term:
 *                 type: string
 *                 enum: [Spring, Summer, Fall]
 *                 example: Summer
 *               year:
 *                 type: integer
 *                 example: 2026
 *               status:
 *                 type: string
 *                 enum: [DRAFT, ACTIVE, COMPLETED]
 *                 example: ACTIVE
 *     responses:
 *       200:
 *         description: Event updated successfully
 *   delete:
 *     summary: Delete an event by ID (COORDINATOR only)
 *     tags: [Events]
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
 *         description: Event deleted successfully
 */
router.get(
  '/:id',
  validate({ params: eventIdParamSchema }),
  eventController.getEventById
);

router.put(
  '/:id',
  authorize('COORDINATOR'),
  validate({ params: eventIdParamSchema, body: updateEventSchema }),
  eventController.updateEvent
);

router.delete(
  '/:id',
  authorize('COORDINATOR'),
  validate({ params: eventIdParamSchema }),
  eventController.deleteEvent
);

export default router;
