import express from 'express';
import {
    deleteGig,
    deleteUser,
    getDashboard,
    getGigs,
    getUsers,
} from '../controllers/adminController.js';
import { adminOnly, protect } from '../middleware/auth.js';

const router = express.Router();

router.use(protect, adminOnly);

router.get('/dashboard', getDashboard);
router.get('/users', getUsers);
router.get('/gigs', getGigs);
router.delete('/users/:id', deleteUser);
router.delete('/gigs/:id', deleteGig);

export default router;