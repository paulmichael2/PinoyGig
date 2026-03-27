import mongoose from 'mongoose';
import { Bid, Gig, User } from '../models/index.js';
import {
    CONTRACT_TAX_RATE,
    WALLET_CURRENCY,
    buildWalletTransaction,
    findWalletAdmin,
    isWalletAdminUser,
    roundCurrency,
} from '../utils/wallet.js';


export const getGigs = async(req, res) => {
    try {
        const { search } = req.query;

        let query = { status: 'open' };

        if (search) {
            query.title = { $regex: search, $options: 'i' };
        }

        const gigs = await Gig.find(query)
            .populate('owner', 'name email averageRating totalReviews')
            .sort({ createdAt: -1 });

        res.json({
            success: true,
            count: gigs.length,
            gigs,
        });
    } catch (error) {
        console.error('Get gigs error:', error);
        res.status(500).json({
            success: false,
            message: error.message || 'Server error',
        });
    }
};


export const getGigById = async(req, res) => {
    try {
        const gig = await Gig.findById(req.params.id).populate('owner', 'name email averageRating totalReviews');

        if (!gig) {
            return res.status(404).json({
                success: false,
                message: 'Gig not found',
            });
        }

        res.json({
            success: true,
            gig,
        });
    } catch (error) {
        console.error('Get gig error:', error);
        res.status(500).json({
            success: false,
            message: error.message || 'Server error',
        });
    }
};


export const createGig = async(req, res) => {
    try {
        const { title, description, budget, category } = req.body;

        const gig = await Gig.create({
            title,
            description,
            budget,
            category,
            owner: req.user._id,
        });

        const populatedGig = await Gig.findById(gig._id).populate('owner', 'name email averageRating totalReviews'); // Populating reputation data

        res.status(201).json({
            success: true,
            gig: populatedGig,
        });
    } catch (error) {
        console.error('Create gig error:', error);
        res.status(500).json({
            success: false,
            message: error.message || 'Server error',
        });
    }
};


export const updateGig = async(req, res) => {
    try {
        const gig = await Gig.findById(req.params.id);

        if (!gig) {
            return res.status(404).json({
                success: false,
                message: 'Gig not found',
            });
        }

        if (gig.owner.toString() !== req.user._id.toString()) {
            return res.status(403).json({
                success: false,
                message: 'Not authorized to update this gig',
            });
        }

        if (gig.status !== 'open') {
            return res.status(400).json({
                success: false,
                message: 'Cannot update an assigned gig',
            });
        }

        const { title, description, budget, category } = req.body;

        gig.title = title || gig.title;
        gig.description = description || gig.description;
        gig.budget = budget || gig.budget;
        gig.category = category || gig.category;

        await gig.save();

        const updatedGig = await Gig.findById(gig._id).populate('owner', 'name email');

        res.json({
            success: true,
            gig: updatedGig,
        });
    } catch (error) {
        console.error('Update gig error:', error);
        res.status(500).json({
            success: false,
            message: error.message || 'Server error',
        });
    }
};


export const deleteGig = async(req, res) => {
    try {
        const gig = await Gig.findById(req.params.id);

        if (!gig) {
            return res.status(404).json({
                success: false,
                message: 'Gig not found',
            });
        }

        if (gig.owner.toString() !== req.user._id.toString()) {
            return res.status(403).json({
                success: false,
                message: 'Not authorized to delete this gig',
            });
        }

        await gig.deleteOne();

        res.json({
            success: true,
            message: 'Gig deleted successfully',
        });
    } catch (error) {
        console.error('Delete gig error:', error);
        res.status(500).json({
            success: false,
            message: error.message || 'Server error',
        });
    }
};


export const getMyGigs = async(req, res) => {
    try {
        const gigs = await Gig.find({ owner: req.user._id })
            .populate('owner', 'name email')
            .sort({ createdAt: -1 });

        res.json({
            success: true,
            count: gigs.length,
            gigs,
        });
    } catch (error) {
        console.error('Get my gigs error:', error);
        res.status(500).json({
            success: false,
            message: error.message || 'Server error',
        });
    }
};

export const getGigsByOwner = async(req, res) => {
    try {
        const gigs = await Gig.find({ owner: req.params.userId })
            .populate('owner', 'name averageRating totalReviews')
            .sort({ createdAt: -1 });

        res.json({
            success: true,
            count: gigs.length,
            gigs,
        });
    } catch (error) {
        console.error('Get gigs by owner error:', error);
        res.status(500).json({
            success: false,
            message: error.message || 'Server error',
        });
    }
};

export const markGigComplete = async(req, res) => {
    const session = await mongoose.startSession();
    session.startTransaction();

    try {
        const gig = await Gig.findById(req.params.id).session(session);

        if (!gig) {
            await session.abortTransaction();
            session.endSession();
            return res.status(404).json({ success: false, message: 'Gig not found' });
        }

        if (gig.owner.toString() !== req.user._id.toString()) {
            await session.abortTransaction();
            session.endSession();
            return res.status(403).json({ success: false, message: 'Not authorized' });
        }

        if (gig.status !== 'assigned') {
            await session.abortTransaction();
            session.endSession();
            return res.status(400).json({ success: false, message: 'Gig must be assigned before completion' });
        }

        if (!gig.hiredFreelancer) {
            await session.abortTransaction();
            session.endSession();
            return res.status(400).json({ success: false, message: 'Gig has no hired freelancer to pay out' });
        }

        const owner = await User.findById(gig.owner).session(session);
        if (!owner) {
            await session.abortTransaction();
            session.endSession();
            return res.status(404).json({ success: false, message: 'Gig owner not found' });
        }

        const freelancer = gig.hiredFreelancer.toString() === owner._id.toString() ?
            owner :
            await User.findById(gig.hiredFreelancer).session(session);

        if (!freelancer) {
            await session.abortTransaction();
            session.endSession();
            return res.status(404).json({ success: false, message: 'Freelancer not found' });
        }

        const admin = owner.isWalletAdmin ?
            owner :
            freelancer.isWalletAdmin ?
            freelancer :
            await findWalletAdmin(User, session);

        if (!admin || !isWalletAdminUser(admin)) {
            await session.abortTransaction();
            session.endSession();
            return res.status(500).json({ success: false, message: 'Verified admin wallet is not configured correctly' });
        }

        const hiredBid = gig.hiredBid ?
            await Bid.findById(gig.hiredBid).session(session) :
            null;

        const contractAmount = roundCurrency(gig.contractAmount || hiredBid?.price || gig.budget);
        const platformFeeAmount = roundCurrency(gig.platformFeeAmount || contractAmount * CONTRACT_TAX_RATE);
        const freelancerPayoutAmount = roundCurrency(gig.freelancerPayoutAmount || contractAmount - platformFeeAmount);

        if (freelancerPayoutAmount < 0) {
            await session.abortTransaction();
            session.endSession();
            return res.status(400).json({ success: false, message: 'Computed freelancer payout is invalid' });
        }

        const payoutDate = new Date();

        gig.status = 'completed';
        gig.contractAmount = contractAmount;
        gig.platformFeeAmount = platformFeeAmount;
        gig.freelancerPayoutAmount = freelancerPayoutAmount;
        gig.completedAt = payoutDate;
        gig.paidOutAt = payoutDate;
        gig.completionRequestedAt = null;
        gig.completionRequestedBy = null;

        owner.totalSpent = roundCurrency((owner.totalSpent || 0) + contractAmount);
        owner.walletTransactions.push(buildWalletTransaction({
            type: 'contract-expense',
            amount: contractAmount,
            description: `Contract payment released for "${gig.title}"`,
            gig: gig._id,
            counterparty: freelancer._id,
            balanceAfter: owner.walletBalance || 0,
            metadata: {
                contractAmount,
                platformFeeAmount,
                freelancerPayoutAmount,
            },
        }));

        freelancer.walletBalance = roundCurrency((freelancer.walletBalance || 0) + freelancerPayoutAmount);
        freelancer.totalEarnings = roundCurrency((freelancer.totalEarnings || 0) + freelancerPayoutAmount);
        freelancer.walletTransactions.push(buildWalletTransaction({
            type: 'contract-credit',
            amount: freelancerPayoutAmount,
            description: `Contract payout received for "${gig.title}"`,
            gig: gig._id,
            counterparty: owner._id,
            balanceAfter: freelancer.walletBalance,
            metadata: {
                contractAmount,
                platformFeeAmount,
                freelancerPayoutAmount,
            },
        }));

        admin.walletBalance = roundCurrency((admin.walletBalance || 0) + platformFeeAmount);
        admin.totalEarnings = roundCurrency((admin.totalEarnings || 0) + platformFeeAmount);
        admin.platformRevenue = roundCurrency((admin.platformRevenue || 0) + platformFeeAmount);
        admin.walletTransactions.push(buildWalletTransaction({
            type: 'platform-fee',
            amount: platformFeeAmount,
            description: `10% platform tax collected from "${gig.title}"`,
            gig: gig._id,
            counterparty: owner._id,
            balanceAfter: admin.walletBalance,
            metadata: {
                contractAmount,
                platformFeeAmount,
                freelancerPayoutAmount,
            },
        }));

        const docsToSave = [gig, owner, freelancer, admin].filter((doc, index, docs) => {
            const docId = doc._id.toString();
            return docs.findIndex((candidate) => candidate._id.toString() === docId) === index;
        });

        await Promise.all(docsToSave.map((doc) => doc.save({ session })));

        await session.commitTransaction();
        session.endSession();

        if (gig.hiredFreelancer && req.io) {
            req.io.to(gig.hiredFreelancer.toString()).emit('notification', {
                type: 'completed',
                message: `The client marked "${gig.title}" as complete. You received PHP ${freelancerPayoutAmount.toFixed(2)} after 10% platform tax.`,
                gigId: gig._id,
                timestamp: new Date()
            });
        }

        res.json({
            success: true,
            gig,
            payoutSummary: {
                currency: WALLET_CURRENCY,
                contractAmount,
                platformFeeAmount,
                freelancerPayoutAmount,
                taxRate: CONTRACT_TAX_RATE,
                adminId: admin._id,
            },
        });
    } catch (error) {
        await session.abortTransaction();
        session.endSession();
        console.error('Complete gig error:', error);
        res.status(500).json({ success: false, message: error.message });
    }
};

export const requestGigCompletion = async(req, res) => {
    try {
        const gig = await Gig.findById(req.params.id)
            .populate('owner', 'name')
            .populate('hiredFreelancer', 'name');

        if (!gig) {
            return res.status(404).json({ success: false, message: 'Gig not found' });
        }

        if (gig.status !== 'assigned') {
            return res.status(400).json({ success: false, message: 'Only assigned gigs can request completion' });
        }

        const hiredFreelancerId = gig.hiredFreelancer?._id?.toString?.() || gig.hiredFreelancer?.toString?.();

        if (!hiredFreelancerId || hiredFreelancerId !== req.user._id.toString()) {
            return res.status(403).json({ success: false, message: 'Only the hired freelancer can request completion' });
        }

        if (gig.completionRequestedAt) {
            return res.status(400).json({ success: false, message: 'Completion has already been requested for this gig' });
        }

        gig.completionRequestedAt = new Date();
        gig.completionRequestedBy = req.user._id;
        await gig.save();

        if (req.io && gig.owner) {
            req.io.to(gig.owner._id.toString()).emit('notification', {
                type: 'completion_request',
                message: `${req.user.name || 'Your freelancer'} requested completion for "${gig.title}".`,
                gigId: gig._id,
                timestamp: new Date(),
            });
        }

        res.json({
            success: true,
            message: 'Completion request sent successfully',
            gig,
        });
    } catch (error) {
        console.error('Request gig completion error:', error);
        res.status(500).json({ success: false, message: error.message || 'Server error' });
    }
};