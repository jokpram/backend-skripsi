import express from 'express';
import { createTambak, getTambaks, createBatch, getBatches, updateHarvest } from '../controllers/tambakController.js';
import { verifyToken, authorizeRoles } from '../middleware/authMiddleware.js';

const router = express.Router();

router.post('/', verifyToken, authorizeRoles('petambak'), createTambak);
router.get('/', verifyToken, getTambaks); // Filtered by user role in controller
router.post('/batch', verifyToken, authorizeRoles('petambak'), createBatch);
router.get('/batch', verifyToken, getBatches); // Public/All 
router.put('/batch/:id/harvest', verifyToken, authorizeRoles('petambak'), updateHarvest);

export default router;
