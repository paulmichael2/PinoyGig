import mongoose from 'mongoose';

const gigSchema = new mongoose.Schema({
    title: {
        type: String,
        required: [true, 'Title is required'],
        trim: true,
        minlength: [5, 'Title must be at least 5 characters'],
        maxlength: [100, 'Title cannot exceed 100 characters'],
    },
    description: {
        type: String,
        required: [true, 'Description is required'],
        trim: true,
        minlength: [20, 'Description must be at least 20 characters'],
        maxlength: [2000, 'Description cannot exceed 2000 characters'],
    },
    category: {
        type: String,
        required: [true, 'Category is required'],
        enum: ['Graphics & Design', 'Digital Marketing', 'Writing & Translation', 'Video & Animation', 'Programming & Tech', 'Business']
    },
    budget: {
        type: Number,
        required: [true, 'Budget is required'],
        min: [1, 'Budget must be at least $1'],
    },
    owner: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true,
    },
    hiredFreelancer: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        default: null
    },
    hiredBid: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Bid',
        default: null,
    },
    status: {
        type: String,
        enum: ['open', 'assigned', 'completed'],
        default: 'open',
    },
    contractAmount: {
        type: Number,
        default: 0,
        min: 0,
    },
    platformFeeAmount: {
        type: Number,
        default: 0,
        min: 0,
    },
    freelancerPayoutAmount: {
        type: Number,
        default: 0,
        min: 0,
    },
    completedAt: {
        type: Date,
        default: null,
    },
    paidOutAt: {
        type: Date,
        default: null,
    },
    completionRequestedAt: {
        type: Date,
        default: null,
    },
    completionRequestedBy: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        default: null,
    },
    hasClientReviewed: {
        type: Boolean,
        default: false
    },
    hasFreelancerReviewed: {
        type: Boolean,
        default: false
    }
}, {
    timestamps: true,
});

gigSchema.index({ title: 'text', description: 'text' });

const Gig = mongoose.model('Gig', gigSchema);

export default Gig;