import express from 'express';
import { verifyToken, authorizeRoles } from '../middleware/authMiddleware.js';
import { requestPriceUpdate } from '../controllers/logistikController.js';

const router = express.Router();

// Semua rute di bawah ini memerlukan otentikasi
router.use(verifyToken);

// Logistik routes
router.post('/request-price-update', authorizeRoles('logistik'), requestPriceUpdate);

export default router;
