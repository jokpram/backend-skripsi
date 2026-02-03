import express from 'express';
import { getMyWallet, requestWithdraw, getWithdrawRequests, processWithdraw } from '../controllers/walletController.js';
import { verifyToken, isAdmin } from '../middleware/authMiddleware.js';

const router = express.Router();

router.get('/my', verifyToken, getMyWallet);
router.post('/withdraw', verifyToken, requestWithdraw);
router.get('/withdraw', verifyToken, getWithdrawRequests);
router.post('/withdraw/:id/process', verifyToken, isAdmin, processWithdraw);

export default router;
