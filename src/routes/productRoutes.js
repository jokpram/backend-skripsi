import express from 'express';
import { createProduct, getProducts, getBatchTrace, requestProductUpdate, getMyProducts } from '../controllers/productController.js';
import { verifyToken, authorizeRoles } from '../middleware/authMiddleware.js';

const router = express.Router();

// Rute Petambak
router.post('/', verifyToken, authorizeRoles('petambak'), createProduct);
router.get('/my', verifyToken, authorizeRoles('petambak'), getMyProducts);
router.post('/:id/request-update', verifyToken, authorizeRoles('petambak'), requestProductUpdate);

// Publik
router.get('/', getProducts);
router.get('/trace/:batchId', getBatchTrace); // Ketertelusuran publik

export default router;
