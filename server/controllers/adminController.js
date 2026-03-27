import { Bid, ChatMessage, Gig, Review, User } from '../models/index.js';
import { findWalletAdmin, isWalletAdminUser, WALLET_CURRENCY } from '../utils/wallet.js';

const buildUserSummary = (user, onlineUsers) => ({
    _id: user._id,
    name: user.name,
    email: user.email,
    role: user.role || 'user',
    isWalletAdmin: Boolean(user.isWalletAdmin),
    isOnline: onlineUsers.has(user._id.toString()),
    createdAt: user.createdAt,
    averageRating: user.averageRating || 0,
    totalReviews: user.totalReviews || 0,
    walletBalance: user.walletBalance || 0,
});

const buildGigSummary = (gig) => ({
    _id: gig._id,
    title: gig.title,
    category: gig.category,
    budget: gig.budget,
    status: gig.status,
    createdAt: gig.createdAt,
    owner: gig.owner,
    hiredFreelancer: gig.hiredFreelancer,
    platformFeeAmount: gig.platformFeeAmount || 0,
    contractAmount: gig.contractAmount || 0,
});

const refreshRatings = async (userIds) => {
    const uniqueIds = [...new Set(userIds.filter(Boolean).map((id) => id.toString()))];
    await Promise.all(uniqueIds.map((id) => Review.getAverageRating(id)));
};

export const getDashboard = async (req, res) => {
    try {
        const onlineUsers = req.onlineUsers || new Map();

        const [
            totalUsers,
            totalGigs,
            openGigs,
            assignedGigs,
            completedGigs,
            totalBids,
            recentUsers,
            recentGigs,
            walletAdmin,
        ] = await Promise.all([
            User.countDocuments(),
            Gig.countDocuments(),
            Gig.countDocuments({ status: 'open' }),
            Gig.countDocuments({ status: 'assigned' }),
            Gig.countDocuments({ status: 'completed' }),
            Bid.countDocuments(),
            User.find().sort({ createdAt: -1 }).limit(8),
            Gig.find()
                .populate('owner', 'name email')
                .sort({ createdAt: -1 })
                .limit(8),
            findWalletAdmin(User),
        ]);

        res.json({
            success: true,
            stats: {
                totalUsers,
                onlineUsers: onlineUsers.size,
                totalGigs,
                openGigs,
                assignedGigs,
                completedGigs,
                totalBids,
                taxBalance: walletAdmin?.walletBalance || 0,
                taxRevenue: walletAdmin?.platformRevenue || 0,
                taxCurrency: WALLET_CURRENCY,
                verifiedWalletAdmin: walletAdmin ? {
                    _id: walletAdmin._id,
                    name: walletAdmin.name,
                    email: walletAdmin.email,
                    isVerified: isWalletAdminUser(walletAdmin),
                } : null,
            },
            recentUsers: recentUsers.map((user) => buildUserSummary(user, onlineUsers)),
            recentGigs: recentGigs.map(buildGigSummary),
        });
    } catch (error) {
        console.error('Get admin dashboard error:', error);
        res.status(500).json({
            success: false,
            message: error.message || 'Server error',
        });
    }
};

export const getUsers = async (req, res) => {
    try {
        const users = await User.find().sort({ createdAt: -1 });
        const onlineUsers = req.onlineUsers || new Map();

        res.json({
            success: true,
            users: users.map((user) => buildUserSummary(user, onlineUsers)),
        });
    } catch (error) {
        console.error('Get admin users error:', error);
        res.status(500).json({
            success: false,
            message: error.message || 'Server error',
        });
    }
};

export const getGigs = async (req, res) => {
    try {
        const gigs = await Gig.find()
            .populate('owner', 'name email')
            .populate('hiredFreelancer', 'name email')
            .sort({ createdAt: -1 });

        res.json({
            success: true,
            gigs: gigs.map(buildGigSummary),
        });
    } catch (error) {
        console.error('Get admin gigs error:', error);
        res.status(500).json({
            success: false,
            message: error.message || 'Server error',
        });
    }
};

export const deleteUser = async (req, res) => {
    try {
        const targetUser = await User.findById(req.params.id);

        if (!targetUser) {
            return res.status(404).json({
                success: false,
                message: 'User not found',
            });
        }

        if (targetUser._id.toString() === req.user._id.toString()) {
            return res.status(400).json({
                success: false,
                message: 'You cannot delete your own admin account',
            });
        }

        if (targetUser.role === 'admin' || targetUser.isWalletAdmin) {
            return res.status(400).json({
                success: false,
                message: 'Admin accounts cannot be deleted from the dashboard',
            });
        }

        const ownedGigs = await Gig.find({ owner: targetUser._id }).select('_id');
        const ownedGigIds = ownedGigs.map((gig) => gig._id);

        const relatedReviews = await Review.find({
            $or: [
                { reviewer: targetUser._id },
                { targetUser: targetUser._id },
                { gig: { $in: ownedGigIds } },
            ],
        }).select('targetUser');

        const ratingTargetsToRefresh = relatedReviews
            .map((review) => review.targetUser)
            .filter((id) => id && id.toString() !== targetUser._id.toString());

        await Promise.all([
            Bid.deleteMany({ $or: [{ freelancer: targetUser._id }, { gigId: { $in: ownedGigIds } }] }),
            ChatMessage.deleteMany({ $or: [{ sender: targetUser._id }, { gig: { $in: ownedGigIds } }] }),
            Review.deleteMany({
                $or: [
                    { reviewer: targetUser._id },
                    { targetUser: targetUser._id },
                    { gig: { $in: ownedGigIds } },
                ],
            }),
            Gig.deleteMany({ owner: targetUser._id }),
            User.findByIdAndDelete(targetUser._id),
        ]);

        await refreshRatings(ratingTargetsToRefresh);

        res.json({
            success: true,
            message: 'Account and related records deleted successfully',
        });
    } catch (error) {
        console.error('Delete admin user error:', error);
        res.status(500).json({
            success: false,
            message: error.message || 'Server error',
        });
    }
};

export const deleteGig = async (req, res) => {
    try {
        const gig = await Gig.findById(req.params.id);

        if (!gig) {
            return res.status(404).json({
                success: false,
                message: 'Gig not found',
            });
        }

        const relatedReviews = await Review.find({ gig: gig._id }).select('targetUser');
        const ratingTargetsToRefresh = relatedReviews.map((review) => review.targetUser);

        await Promise.all([
            Bid.deleteMany({ gigId: gig._id }),
            ChatMessage.deleteMany({ gig: gig._id }),
            Review.deleteMany({ gig: gig._id }),
            Gig.findByIdAndDelete(gig._id),
        ]);

        await refreshRatings(ratingTargetsToRefresh);

        res.json({
            success: true,
            message: 'Gig deleted successfully',
        });
    } catch (error) {
        console.error('Delete admin gig error:', error);
        res.status(500).json({
            success: false,
            message: error.message || 'Server error',
        });
    }
};