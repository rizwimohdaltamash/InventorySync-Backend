import express from 'express';
import {
  getStockMovements,
  createStockMovement,
  getProductStockHistory,
  stockIn,
  stockOut,
  stockDamage
} from '../controllers/stockController.js';
import { protect } from '../middleware/auth.js';

const router = express.Router();

router.use(protect);

// General stock movement routes
router.route('/')
  .get(getStockMovements)
  .post(createStockMovement);

// Specific movement type routes
router.post('/in', stockIn);
router.post('/out', stockOut);
router.post('/damage', stockDamage);

// Product history
router.get('/product/:productId', getProductStockHistory);

export default router;
