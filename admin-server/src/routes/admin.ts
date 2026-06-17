import { Router } from 'express';

import {
  analytics,
  auditLog,
  broadcast,
  dashboardMetrics,
  listFeatureGates,
  listUsers,
  resetPassword,
  toggleFeatureGate,
  updateSubscription,
  updateUser,
  userDetail,
} from '../controllers/adminController';
import { requireSuperAdmin } from '../middleware/requireSuperAdmin';

const router = Router();

// Every route below is hidden behind the strict super-admin gate.
router.use(requireSuperAdmin);

router.get('/dashboard-metrics', dashboardMetrics);
router.get('/analytics', analytics);

router.get('/users', listUsers);
router.get('/users/:id', userDetail);
router.patch('/users/:id', updateUser);
router.patch('/users/:id/subscription', updateSubscription);
router.post('/users/:id/reset-password', resetPassword);

router.post('/broadcast', broadcast);

router.get('/features', listFeatureGates);
router.patch('/features/toggle-gate', toggleFeatureGate);

router.get('/audit', auditLog);

export default router;
