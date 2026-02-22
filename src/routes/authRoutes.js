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
router.post('/register/petambak', upload.fields([
    { name: 'foto_ktp', maxCount: 1 },
    { name: 'foto_tambak', maxCount: 1 }
]), registerPetambak);
router.post('/register/logistik', upload.fields([{ name: 'stnk_photo', maxCount: 1 }]), registerLogistik);
router.post('/register/konsumen', registerKonsumen);

router.post('/login/admin', loginAdmin);
router.post('/login/petambak', loginPetambak);
router.post('/login/logistik', loginLogistik);
router.post('/login/konsumen', loginKonsumen);

router.get('/profile', verifyToken, getProfile);
router.put('/profile', verifyToken, upload.single('image'), updateProfile);

export default router;
