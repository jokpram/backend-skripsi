import express from 'express';
import { createOrder, getPaymentToken, midtransNotification, scanPickup, scanReceive, getOrderQR } from '../controllers/orderController.js';
import { verifyToken, authorizeRoles } from '../middleware/authMiddleware.js';

const router = express.Router();

router.post('/', verifyToken, authorizeRoles('konsumen'), createOrder);
router.post('/payment/token', verifyToken, authorizeRoles('konsumen'), getPaymentToken);
router.post('/payment/notification', midtransNotification); // Webhook, no auth (or separate verify)

router.post('/scan/pickup', verifyToken, authorizeRoles('logistik'), scanPickup);
router.post('/scan/receive', verifyToken, authorizeRoles('konsumen'), scanReceive);

router.get('/:orderId/qr', verifyToken, getOrderQR);

export default router;
