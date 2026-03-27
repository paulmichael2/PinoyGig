import { Bid, ChatMessage, Gig } from '../models/index.js';
import mongoose from 'mongoose';
import { CONTRACT_TAX_RATE, roundCurrency } from '../utils/wallet.js';

const buildHireChatMessage = ({ hirerName, gigTitle, contractAmount }) => (
    `You were hired by ${hirerName} for "${gigTitle}". Contract amount: PHP ${Number(contractAmount).toFixed(2)}.`
);


export const createBid = async(req, res) => {
    try {
        const { gigId, message, price } = req.body;

        const gig = await Gig.findById(gigId);
        if (!gig) {
            return res.status(404).json({ success: false, message: 'Gig not found' });
        }

        if (gig.status !== 'open') {
            return res.status(400).json({ success: false, message: 'This gig is no longer accepting bids' });
        }

        if (gig.owner.toString() === req.user._id.toString()) {
            return res.status(403).json({ success: false, message: 'You cannot bid on your own gig' });
        }

        const bid = await Bid.create({
            gigId,
            freelancer: req.user._id,
            message,
            price
        });

        const populatedBid = await Bid.findById(bid._id)
            .populate('freelancer', 'name email averageRating totalReviews');

        res.status(201).json({
            success: true,
            bid: populatedBid
        });

    } catch (error) {
        if (error.code === 11000) {
            return res.status(400).json({ success: false, message: 'You have already placed a bid on this gig' });
        }
        console.error('Create bid error:', error);
        res.status(500).json({ success: false, message: error.message });
    }
};


export const getGigBids = async(req, res) => {
    try {
        const { gigId } = req.params;

        const gig = await Gig.findById(gigId);
        if (!gig) return res.status(404).json({ success: false, message: 'Gig not found' });

        if (gig.owner.toString() !== req.user._id.toString()) {
            return res.status(403).json({ success: false, message: 'Not authorized to view bids for this gig' });
        }

        const bids = await Bid.find({ gigId })
            .populate('freelancer', 'name email averageRating totalReviews')
            .sort({ createdAt: -1 });

        res.json({ success: true, count: bids.length, bids });
    } catch (error) {
        console.error('Get gig bids error:', error);
        res.status(500).json({ success: false, message: error.message });
    }
};

export const getMyBids = async(req, res) => {
    try {
        const bids = await Bid.find({ freelancer: req.user._id })
            .populate('gigId', 'title status budget hasFreelancerReviewed')
            .sort({ createdAt: -1 });

        res.json({ success: true, count: bids.length, bids });
    } catch (error) {
        console.error('Get my bids error:', error);
        res.status(500).json({ success: false, message: error.message });
    }
};


export const hireFreelancer = async(req, res) => {
    const session = await mongoose.startSession();
    session.startTransaction();

    try {
        const { id } = req.params;

        const bid = await Bid.findById(id).populate('freelancer').session(session);
        if (!bid) {
            await session.abortTransaction();
            session.endSession();
            return res.status(404).json({ success: false, message: 'Bid not found' });
        }


        const gig = await Gig.findOne({ _id: bid.gigId, status: 'open' }).session(session);

        if (!gig) {
            await session.abortTransaction();
            session.endSession();
            return res.status(400).json({ success: false, message: 'Gig is no longer available or already assigned' });
        }

        if (gig.owner.toString() !== req.user._id.toString()) {
            await session.abortTransaction();
            session.endSession();
            return res.status(403).json({ success: false, message: 'Not authorized' });
        }


        bid.status = 'hired';
        await bid.save({ session });

        const contractAmount = roundCurrency(Number(bid.price) || gig.budget);
        const platformFeeAmount = roundCurrency(contractAmount * CONTRACT_TAX_RATE);
        const freelancerPayoutAmount = roundCurrency(contractAmount - platformFeeAmount);

        gig.status = 'assigned';
        gig.hiredFreelancer = bid.freelancer._id;
        gig.hiredBid = bid._id;
        gig.contractAmount = contractAmount;
        gig.platformFeeAmount = platformFeeAmount;
        gig.freelancerPayoutAmount = freelancerPayoutAmount;
        await gig.save({ session });

        await Bid.updateMany({ gigId: gig._id, _id: { $ne: bid._id } }, { status: 'rejected' }).session(session);

        const [hireChatMessage] = await ChatMessage.create([
            {
                gig: gig._id,
                sender: req.user._id,
                content: buildHireChatMessage({
                    hirerName: req.user.name || 'Client',
                    gigTitle: gig.title,
                    contractAmount,
                }),
                readBy: [req.user._id],
            }
        ], { session });

        await session.commitTransaction();
        session.endSession();

        const populatedHireChatMessage = await ChatMessage.findById(hireChatMessage._id).populate('sender', 'name');

        if (req.io) {
            req.io.to(bid.freelancer._id.toString()).emit('notification', {
                type: 'hired',
                message: `Congratulations! You have been hired for "${gig.title}"`,
                gigId: gig._id,
                timestamp: new Date()
            });

            req.io.to(bid.freelancer._id.toString()).emit('chat_inbox_update', {
                gigId: gig._id,
                message: populatedHireChatMessage,
            });

            req.io.to(gig.owner.toString()).emit('chat_inbox_update', {
                gigId: gig._id,
                message: populatedHireChatMessage,
            });

            req.io.to(`gig:${gig._id.toString()}`).emit('gig_chat_message', {
                gigId: gig._id,
                message: populatedHireChatMessage,
            });
        }

        res.json({
            success: true,
            message: 'Freelancer hired successfully',
            hiredBid: bid,
            gigId: gig._id
        });

    } catch (error) {
        await session.abortTransaction();
        session.endSession();
        console.error('Hire error:', error);
        res.status(500).json({ success: false, message: error.message });
    }
};