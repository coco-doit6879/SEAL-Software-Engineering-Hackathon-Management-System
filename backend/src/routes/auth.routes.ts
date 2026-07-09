import { Router } from 'express';
import { authController } from '../controllers/auth.controller';
import { authenticate } from '../middlewares/authenticate';
import { validate } from '../middlewares/validate';
import { registerSchema, loginSchema } from '../validators/auth.validator';

const router = Router();

/**
 * @openapi
 * /auth/register:
 *   post:
 *     summary: Register a new user account (STUDENT is auto-approved, others start as PENDING)
 *     tags: [Authentication]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - email
 *               - password
 *               - fullName
 *             properties:
 *               email:
 *                 type: string
 *                 example: student_test@fpt.edu.vn
 *               password:
 *                 type: string
 *                 example: Password123!
 *               fullName:
 *                 type: string
 *                 example: Nguyễn Văn Test
 *               role:
 *                 type: string
 *                 enum: [COORDINATOR, INTERNAL_JUDGE, GUEST_JUDGE, MENTOR, STUDENT]
 *                 example: STUDENT
 *               isFptStudent:
 *                 type: boolean
 *                 example: true
 *               studentCode:
 *                 type: string
 *                 example: SE170001
 *               university:
 *                 type: string
 *                 example: FPT University HCMC
 *     responses:
 *       201:
 *         description: Registered successfully
 *       400:
 *         description: Validation error or Email already in use
 */
router.post(
  '/register',
  validate({ body: registerSchema }),
  authController.register
);

/**
 * @openapi
 * /auth/login:
 *   post:
 *     summary: Log in to get a JWT token
 *     tags: [Authentication]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - email
 *               - password
 *             properties:
 *               email:
 *                 type: string
 *                 example: student_test@fpt.edu.vn
 *               password:
 *                 type: string
 *                 example: Password123!
 *     responses:
 *       200:
 *         description: Login successful
 *       401:
 *         description: Unauthorized
 */
router.post(
  '/login',
  validate({ body: loginSchema }),
  authController.login
);

/**
 * @openapi
 * /auth/me:
 *   get:
 *     summary: Get profile details of the currently logged-in user
 *     tags: [Authentication]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Profile retrieved successfully
 *       401:
 *         description: Invalid or missing token
 */
router.get('/me', authenticate, authController.getMe);
router.put('/profile', authenticate, authController.updateProfile);

export default router;
