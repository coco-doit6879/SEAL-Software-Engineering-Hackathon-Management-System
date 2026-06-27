import { Router } from 'express';
import { auditController } from '../controllers/audit.controller';
import { authenticate } from '../middlewares/authenticate';
import { authorize } from '../middlewares/authorize';

const router = Router();

// All audit log routes require COORDINATOR role
router.use(authenticate, authorize('COORDINATOR'));

/**
 * @openapi
 * /audit-logs:
 *   get:
 *     summary: Retrieve system audit logs (COORDINATOR only)
 *     tags: [Audit Logs]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: List of audit logs retrieved successfully
 */
router.get('/', auditController.getLogs);

export default router;
