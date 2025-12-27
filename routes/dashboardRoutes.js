import express from 'express';
import {
  getDashboardStats,
  getStockTrends,
  getTopSKUs
} from '../controllers/dashboardController.js';
import { protect } from '../middleware/auth.js';

const router = express.Router();

router.use(protect);

router.get('/stats', getDashboardStats);
router.get('/trends', getStockTrends);
router.get('/top-skus', getTopSKUs);

export default router;
