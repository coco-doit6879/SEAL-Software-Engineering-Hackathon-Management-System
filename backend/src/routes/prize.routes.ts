import { Router } from 'express';
import { prizeController } from '../controllers/prize.controller';
import { authenticate } from '../middlewares/authenticate';
import { authorize } from '../middlewares/authorize';
import { validate } from '../middlewares/validate';
import { awardPrizeSchema, teamIdParamSchema } from '../validators/prize.validator';

const router = Router();

router.use(authenticate);

/**
 * @openapi
 * /prizes:
 *   post:
 *     summary: Award a prize to a team (COORDINATOR only)
 *     tags: [Prizes]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - teamId
 *               - name
 *             properties:
 *               teamId:
 *                 type: string
 *                 example: "team-uuid"
 *               name:
 *                 type: string
 *                 example: "Champion"
 *               description:
 *                 type: string
 *                 example: "First place overall in the hackathon."
 *               rewardCash:
 *                 type: number
 *                 example: 10000000
 *     responses:
 *       201:
 *         description: Prize awarded successfully
 */
router.post(
  '/',
  authorize('COORDINATOR'),
  validate({ body: awardPrizeSchema }),
  prizeController.awardPrize
);

/**
 * @openapi
 * /prizes/team/{teamId}:
 *   get:
 *     summary: Get all prizes awarded to a specific team
 *     tags: [Prizes]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: teamId
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: List of prizes retrieved successfully
 */
router.get(
  '/team/:teamId',
  validate({ params: teamIdParamSchema }),
  prizeController.getPrizesByTeam
);

export default router;
