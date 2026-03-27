import express from 'express';
import { createBid, getGigBids, getMyBids, hireFreelancer } from '../controllers/bidController.js';
import { protect } from '../middleware/auth.js';

const router = express.Router();

router.use(protect); 

router.post('/', createBid);
router.get('/my-bids', getMyBids);
router.get('/gig/:gigId', getGigBids);
router.patch('/:id/hire', hireFreelancer);

export default router;