import { Router } from 'express';
import authRoutes from './auth.routes';
import userRoutes from './user.routes';
import eventRoutes from './event.routes';
import trackRoutes from './track.routes';
import roundRoutes from './round.routes';
import teamRoutes from './team.routes';
import submissionRoutes from './submission.routes';
import scoreRoutes from './score.routes';
import calibrationRoutes from './calibration.routes';
import prizeRoutes from './prize.routes';
import auditRoutes from './audit.routes';

const router = Router();

router.use('/auth', authRoutes);
router.use('/users', userRoutes);
router.use('/events', eventRoutes);
router.use('/tracks', trackRoutes);
router.use('/rounds', roundRoutes);
router.use('/teams', teamRoutes);
router.use('/submissions', submissionRoutes);
router.use('/scores', scoreRoutes);
router.use('/calibration', calibrationRoutes);
router.use('/prizes', prizeRoutes);
router.use('/audit-logs', auditRoutes);

export default router;
