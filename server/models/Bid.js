import mongoose from 'mongoose';

const bidSchema = new mongoose.Schema(
    {
        gigId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'Gig',
            required: true,
        },
        freelancer: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'User',
            required: true,
        },
        message: {
            type: String,
            required: [true, 'Message is required'],
            trim: true,
            minlength: [10, 'Message must be at least 10 characters'],
            maxlength: [1000, 'Message cannot exceed 1000 characters'],
        },
        price: {
            type: Number,
            required: [true, 'Price is required'],
            min: [1, 'Price must be at least $1'],
        },
        status: {
            type: String,
            enum: ['pending', 'hired', 'rejected'],
            default: 'pending',
        },
    },
    {
        timestamps: true,
    }
);

bidSchema.index({ gigId: 1, freelancer: 1 }, { unique: true });

const Bid = mongoose.model('Bid', bidSchema);

export default Bid;