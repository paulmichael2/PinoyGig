import { Review, Gig } from '../models/index.js';


export const getUserReviews = async (req, res) => {
    try {
        const reviews = await Review.find({ targetUser: req.params.userId })
            .populate('reviewer', 'name')
            .populate('gig', 'title')
            .sort({ createdAt: -1 });

        res.json({
            success: true,
            reviews,
        });
    } catch (error) {
        console.error('Get user reviews error:', error);
        res.status(500).json({ success: false, message: error.message || 'Server error' });
    }
};


export const createReview = async (req, res) => {
    try {
        const { gigId, rating, comment } = req.body;

        const gig = await Gig.findById(gigId).populate('owner').populate('hiredFreelancer');
        if (!gig) return res.status(404).json({ success: false, message: 'Gig not found' });

        if (gig.status !== 'completed') {
            return res.status(400).json({ success: false, message: 'Gig must be completed before reviewing' });
        }

        let targetUserId;
        let isClientReviewing = false;

        const currentUserId = req.user._id.toString();
        const ownerId = gig.owner._id.toString();
        const freelancerId = gig.hiredFreelancer ? gig.hiredFreelancer._id.toString() : null;

        if (!freelancerId) {
            return res.status(400).json({ success: false, message: 'No freelancer was hired for this gig' });
        }

        if (currentUserId === ownerId) {
            targetUserId = freelancerId;
            isClientReviewing = true;
            if (gig.hasClientReviewed) {
                return res.status(400).json({ success: false, message: 'You have already reviewed this freelancer' });
            }
        } else if (currentUserId === freelancerId) {
            targetUserId = ownerId;
            if (gig.hasFreelancerReviewed) {
                return res.status(400).json({ success: false, message: 'You have already reviewed this client' });
            }
        } else {
            return res.status(403).json({ success: false, message: 'Not authorized to review this gig' });
        }

        await Review.create({
            reviewer: req.user._id,
            targetUser: targetUserId,
            gig: gigId,
            rating,
            comment
        });

        if (isClientReviewing) {
            gig.hasClientReviewed = true;
        } else {
            gig.hasFreelancerReviewed = true;
        }
        await gig.save();

        res.status(201).json({ success: true, message: 'Review submitted successfully' });

    } catch (error) {
        console.error('Review error:', error);
        res.status(500).json({ success: false, message: error.message });
    }
};