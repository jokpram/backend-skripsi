import express from 'express';
import { getPendingUsers, verifyUser } from '../controllers/adminController.js';
import { verifyToken, authorizeRoles } from '../middleware/authMiddleware.js';

const router = express.Router();

// Get all pending users
router.get('/pending-users', verifyToken, authorizeRoles('admin'), getPendingUsers);

// Verify (approve/reject) a user
router.post('/verify-user', verifyToken, authorizeRoles('admin'), verifyUser);

export default router;
