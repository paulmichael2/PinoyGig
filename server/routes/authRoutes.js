import express from 'express';
import { register, login, logout, getMe, updateProfile, getPublicProfile, getWallet } from '../controllers/authController.js';
import { protect } from '../middleware/auth.js';

const router = express.Router();

router.post('/register', register);
router.post('/login', login);
router.post('/logout', logout);
router.get('/public/:id', getPublicProfile);
router.get('/me', protect, getMe);
router.get('/wallet', protect, getWallet);
router.patch('/update-profile', protect, updateProfile);

export default router;