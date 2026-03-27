import express from 'express';
import {
    getGigs,
    getGigById,
    createGig,
    updateGig,
    deleteGig,
    getMyGigs,
    getGigsByOwner,
    markGigComplete,
    requestGigCompletion
} from '../controllers/gigController.js';
import { protect } from '../middleware/auth.js';

const router = express.Router();

router.get('/', getGigs);
router.get('/owner/:userId', getGigsByOwner);

router.post('/', protect, createGig);
router.get('/my-gigs', protect, getMyGigs);

router.get('/:id', getGigById);
router.put('/:id', protect, updateGig);
router.delete('/:id', protect, deleteGig);
router.patch('/:id/complete', protect, markGigComplete);
router.patch('/:id/request-complete', protect, requestGigCompletion);

export default router;