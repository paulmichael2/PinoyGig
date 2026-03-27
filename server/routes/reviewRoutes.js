import express from 'express';
import { createReview, getUserReviews } from '../controllers/reviewController.js';
import { protect } from '../middleware/auth.js';

const router = express.Router();

router.get('/user/:userId', getUserReviews);
router.post('/', protect, createReview);

export default router;