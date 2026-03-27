import mongoose from 'mongoose';

const reviewSchema = new mongoose.Schema({
    reviewer: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    targetUser: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    gig: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Gig',
        required: true
    },
    rating: {
        type: Number,
        required: [true, 'Please add a rating between 1 and 5'],
        min: 1,
        max: 5
    },
    comment: {
        type: String,
        required: [true, 'Please add a review comment'],
        maxlength: 500
    }
}, {
    timestamps: true
});

reviewSchema.index({ gig: 1, reviewer: 1 }, { unique: true });

reviewSchema.statics.getAverageRating = async function(userId) {
    const obj = await this.aggregate([{
            $match: { targetUser: userId }
        },
        {
            $group: {
                _id: '$targetUser',
                averageRating: { $avg: '$rating' },
                totalReviews: { $sum: 1 }
            }
        }
    ]);

    try {
        await mongoose.model('User').findByIdAndUpdate(userId, {
            averageRating: obj[0] ? obj[0].averageRating.toFixed(1) : 0,
            totalReviews: obj[0] ? obj[0].totalReviews : 0
        });
    } catch (err) {
        console.error(err);
    }
};

reviewSchema.post('save', function() {
    this.constructor.getAverageRating(this.targetUser);
});

reviewSchema.pre('remove', function() {
    this.constructor.getAverageRating(this.targetUser);
});

const Review = mongoose.model('Review', reviewSchema);

export default Review;