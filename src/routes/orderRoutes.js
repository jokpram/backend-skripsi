import express from 'express';
import {
    createOrder,
    getPaymentToken,
    midtransNotification,
    scanPickup,
    scanReceive,
    getOrderQR,
    getMyOrders,
    getMyDeliveries,
    getAvailableDeliveries,
    getPetambakOrders
} from '../controllers/orderController.js';
import { verifyToken, authorizeRoles } from '../middleware/authMiddleware.js';

const router = express.Router();

// Konsumen routes
router.post('/', verifyToken, authorizeRoles('konsumen'), createOrder);
router.get('/my', verifyToken, authorizeRoles('konsumen'), getMyOrders);
router.post('/payment/token', verifyToken, authorizeRoles('konsumen'), getPaymentToken);
router.post('/scan/receive', verifyToken, authorizeRoles('konsumen'), scanReceive);

// Petambak routes
router.get('/petambak', verifyToken, authorizeRoles('petambak'), getPetambakOrders);

// Logistik routes
router.get('/deliveries/available', verifyToken, authorizeRoles('logistik'), getAvailableDeliveries);
router.get('/deliveries/my', verifyToken, authorizeRoles('logistik'), getMyDeliveries);
router.post('/scan/pickup', verifyToken, authorizeRoles('logistik'), scanPickup);

// Shared routes
router.get('/:orderId/qr', verifyToken, getOrderQR);

// Webhook (no auth)
router.post('/payment/notification', midtransNotification);

export default router;
