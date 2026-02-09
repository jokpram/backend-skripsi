import express from 'express';
import { generateAdminReport } from '../controllers/reportController.js';
import { verifyToken, isAdmin } from '../middleware/authMiddleware.js';

const router = express.Router();

// Only admin can generate report
router.get('/admin', verifyToken, isAdmin, generateAdminReport);

export default router;
