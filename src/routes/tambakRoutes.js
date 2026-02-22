import express from 'express';
import { createTambak, getTambaks, createBatch, getBatches, updateHarvest } from '../controllers/tambakController.js';
import { verifyToken, authorizeRoles } from '../middleware/authMiddleware.js';

const router = express.Router();

router.post('/', verifyToken, authorizeRoles('petambak'), createTambak);
router.get('/', verifyToken, getTambaks); // Difilter berdasarkan peran pengguna di controller
router.post('/batch', verifyToken, authorizeRoles('petambak'), createBatch);
router.get('/batch', verifyToken, getBatches); // Publik/Semua 
router.put('/batch/:id/harvest', verifyToken, authorizeRoles('petambak'), updateHarvest);

export default router;
