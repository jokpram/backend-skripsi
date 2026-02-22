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

// Rute Konsumen
router.post('/', verifyToken, authorizeRoles('konsumen'), createOrder);
router.get('/my', verifyToken, authorizeRoles('konsumen'), getMyOrders);
router.post('/payment/token', verifyToken, authorizeRoles('konsumen'), getPaymentToken);
router.post('/scan/receive', verifyToken, authorizeRoles('konsumen'), scanReceive);

// Rute Petambak
router.get('/petambak', verifyToken, authorizeRoles('petambak'), getPetambakOrders);

// Rute Logistik
router.get('/deliveries/available', verifyToken, authorizeRoles('logistik'), getAvailableDeliveries);
router.get('/deliveries/my', verifyToken, authorizeRoles('logistik'), getMyDeliveries);
router.post('/scan/pickup', verifyToken, authorizeRoles('logistik'), scanPickup);

// Rute Bersama
router.get('/:orderId/qr', verifyToken, getOrderQR);

// Webhook (tanpa autentikasi)
router.post('/payment/notification', midtransNotification);

export default router;
