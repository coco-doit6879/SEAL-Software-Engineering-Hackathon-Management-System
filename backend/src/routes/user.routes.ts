import { Router } from 'express';
import { userController } from '../controllers/user.controller';
import { authenticate } from '../middlewares/authenticate';
import { authorize } from '../middlewares/authorize';
import { validate } from '../middlewares/validate';
import {
  updateUserStatusSchema,
  userIdParamSchema,
  listUsersQuerySchema,
} from '../validators/user.validator';

const router = Router();

// All user management routes require COORDINATOR role
router.use(authenticate, authorize('COORDINATOR'));

/**
 * @openapi
 * /users:
 *   get:
 *     summary: Get all users with filtering and search (COORDINATOR only)
 *     tags: [Users]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: role
 *         schema:
 *           type: string
 *           enum: [COORDINATOR, INTERNAL_JUDGE, GUEST_JUDGE, MENTOR, STUDENT]
 *         description: Filter by role
 *       - in: query
 *         name: status
 *         schema:
 *           type: string
 *           enum: [PENDING, APPROVED, REJECTED]
 *         description: Filter by status
 *       - in: query
 *         name: search
 *         schema:
 *           type: string
 *         description: Search by name or email
 *     responses:
 *       200:
 *         description: List of users retrieved successfully
 */
router.get(
  '/',
  validate({ query: listUsersQuerySchema }),
  userController.getAllUsers
);

/**
 * @openapi
 * /users/{id}:
 *   get:
 *     summary: Get user details by ID (COORDINATOR only)
 *     tags: [Users]
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
 *         description: User retrieved successfully
 */
router.get(
  '/:id',
  validate({ params: userIdParamSchema }),
  userController.getUserById
);

/**
 * @openapi
 * /users/{id}/status:
 *   patch:
 *     summary: Update user status (approve/reject) (COORDINATOR only)
 *     tags: [Users]
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
 *                 enum: [PENDING, APPROVED, REJECTED]
 *                 example: APPROVED
 *     responses:
 *       200:
 *         description: Status updated successfully
 */
router.patch(
  '/:id/status',
  validate({ params: userIdParamSchema, body: updateUserStatusSchema }),
  userController.updateUserStatus
);

export default router;
