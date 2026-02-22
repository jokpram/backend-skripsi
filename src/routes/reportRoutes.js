import express from 'express';
import { generateAdminReport } from '../controllers/reportController.js';
import { verifyToken, isAdmin } from '../middleware/authMiddleware.js';

const router = express.Router();

// Hanya admin yang dapat membuat laporan
router.get('/admin', verifyToken, isAdmin, generateAdminReport);

export default router;
