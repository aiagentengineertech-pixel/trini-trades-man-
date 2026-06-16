import { Router } from 'express';

import {
  dashboardMetrics,
  listFeatureGates,
  listUsers,
  toggleFeatureGate,
  updateSubscription,
} from '../controllers/adminController';
import { requireSuperAdmin } from '../middleware/requireSuperAdmin';

const router = Router();

// Every route below is hidden behind the strict super-admin gate.
router.use(requireSuperAdmin);

router.get('/dashboard-metrics', dashboardMetrics);
router.get('/users', listUsers);
router.patch('/users/:id/subscription', updateSubscription);
router.get('/features', listFeatureGates);
router.patch('/features/toggle-gate', toggleFeatureGate);

export default router;
