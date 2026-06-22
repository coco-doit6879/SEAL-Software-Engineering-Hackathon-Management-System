import { Router } from 'express';
import { submissionController } from '../controllers/submission.controller';
import { authenticate } from '../middlewares/authenticate';
import { authorize } from '../middlewares/authorize';
import { validate } from '../middlewares/validate';
import {
  createSubmissionSchema,
  submissionIdParamSchema,
  roundIdParamSchema,
  disqualifySubmissionSchema,
} from '../validators/submission.validator';

const router = Router();

router.use(authenticate);

/**
 * @openapi
 * /submissions:
 *   post:
 *     summary: Create a new project submission (STUDENT/Leader only)
 *     tags: [Submissions]
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
 *               - teamId
 *               - repoUrl
 *               - demoUrl
 *             properties:
 *               roundId:
 *                 type: string
 *                 example: "round-uuid"
 *               teamId:
 *                 type: string
 *                 example: "team-uuid"
 *               repoUrl:
 *                 type: string
 *                 example: "https://github.com/myteam/project"
 *               demoUrl:
 *                 type: string
 *                 example: "https://myproject.vercel.app"
 *               documentUrl:
 *                 type: string
 *                 example: "https://drive.google.com/mydoc"
 *     responses:
 *       201:
 *         description: Submission created successfully
 */
router.post(
  '/',
  authorize('STUDENT'),
  validate({ body: createSubmissionSchema }),
  submissionController.createSubmission
);

/**
 * @openapi
 * /submissions/round/{roundId}:
 *   get:
 *     summary: Get all submissions in a round (COORDINATOR and JUDGEs only)
 *     tags: [Submissions]
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
 *         description: List of submissions retrieved successfully
 */
router.get(
  '/round/:roundId',
  authorize('COORDINATOR', 'INTERNAL_JUDGE', 'GUEST_JUDGE'),
  validate({ params: roundIdParamSchema }),
  submissionController.getSubmissionsForRound
);

/**
 * @openapi
 * /submissions/{id}:
 *   get:
 *     summary: Get details of a submission by ID
 *     tags: [Submissions]
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
 *         description: Submission details retrieved successfully
 */
router.get(
  '/:id',
  validate({ params: submissionIdParamSchema }),
  submissionController.getSubmissionById
);

/**
 * @openapi
 * /submissions/{id}/disqualify:
 *   patch:
 *     summary: Disqualify a submission (COORDINATOR only)
 *     tags: [Submissions]
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
 *               - isDisqualified
 *               - disqualificationReason
 *             properties:
 *               isDisqualified:
 *                 type: boolean
 *                 example: true
 *               disqualificationReason:
 *                 type: string
 *                 example: Plagiarism detected in source code.
 *     responses:
 *       200:
 *         description: Submission disqualified successfully
 */
router.patch(
  '/:id/disqualify',
  authorize('COORDINATOR'),
  validate({ params: submissionIdParamSchema, body: disqualifySubmissionSchema }),
  submissionController.disqualifySubmission
);

export default router;
