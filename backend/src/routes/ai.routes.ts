import { Router } from 'express';
import { aiController } from '../controllers/ai.controller';
import { authenticate } from '../middlewares/authenticate';
import { authorize } from '../middlewares/authorize';
import { validate } from '../middlewares/validate';
import { chatRulesSchema, analyzeEventSchema } from '../validators/ai.validator';

const router = Router();

// Apply auth middleware for all AI routes
router.use(authenticate);

/**
 * @openapi
 * /ai/seed-rules:
 *   post:
 *     summary: Seed default hackathon rules and generate vectors (COORDINATOR only)
 *     tags: [AI]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Seeding completed successfully
 */
router.post(
  '/seed-rules',
  authorize('COORDINATOR'),
  aiController.seedRules
);

/**
 * @openapi
 * /ai/chat-rules:
 *   post:
 *     summary: Ask a question about the hackathon regulations (All authenticated users)
 *     tags: [AI]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - message
 *             properties:
 *               message:
 *                 type: string
 *                 example: "Tôi có được nộp bài trễ không?"
 *     responses:
 *       200:
 *         description: Answer returned successfully
 */
router.post(
  '/chat-rules',
  validate({ body: chatRulesSchema }),
  aiController.chatRules
);

/**
 * @openapi
 * /ai/analyze/event/{eventId}:
 *   get:
 *     summary: Analyze event statistics, leaderboard, judge bias and suggest seed teams (COORDINATOR and JUDGEs only)
 *     tags: [AI]
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
 *         description: Event analysis report returned successfully
 */
router.get(
  '/analyze/event/:eventId',
  authorize('COORDINATOR', 'INTERNAL_JUDGE', 'GUEST_JUDGE'),
  validate({ params: analyzeEventSchema }),
  aiController.analyzeEvent
);

export default router;
