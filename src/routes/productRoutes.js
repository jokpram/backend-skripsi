import express from 'express';
import { createProduct, getProducts } from '../controllers/productController.js';
import { verifyToken, authorizeRoles } from '../middleware/authMiddleware.js';

const router = express.Router();

router.post('/', verifyToken, authorizeRoles('petambak'), createProduct);
router.get('/', getProducts); // Public

export default router;
