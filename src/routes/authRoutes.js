import express from 'express';
import {
    registerAdmin,
    registerPetambak,
    registerLogistik,
    registerKonsumen,
    loginAdmin,
    loginPetambak,
    loginLogistik,
    loginKonsumen,
    getProfile,
    updateProfile
} from '../controllers/authController.js';
import { verifyToken } from '../middleware/authMiddleware.js';
import upload from '../middleware/uploadMiddleware.js';

const router = express.Router();

router.post('/register/admin', registerAdmin);
router.post('/register/petambak', registerPetambak);
router.post('/register/logistik', registerLogistik);
router.post('/register/konsumen', registerKonsumen);

router.post('/login/admin', loginAdmin);
router.post('/login/petambak', loginPetambak);
router.post('/login/logistik', loginLogistik);
router.post('/login/konsumen', loginKonsumen);

router.get('/profile', verifyToken, getProfile);
router.put('/profile', verifyToken, upload.single('image'), updateProfile);

export default router;
