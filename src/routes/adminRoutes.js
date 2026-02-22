import express from 'express';
import { getPendingUsers, verifyUser, getChangeRequests, approveChangeRequest, rejectChangeRequest } from '../controllers/adminController.js';
import { verifyToken, authorizeRoles } from '../middleware/authMiddleware.js';

const router = express.Router();

// Semua rute perlu auth admin
router.use(verifyToken, authorizeRoles('admin'));

router.get('/pending-users', getPendingUsers);
router.post('/verify-user', verifyUser);

// Manajemen Perubahan
router.get('/change-requests', getChangeRequests);
router.post('/change-requests/:id/approve', approveChangeRequest);
router.post('/change-requests/:id/reject', rejectChangeRequest);

export default router;
