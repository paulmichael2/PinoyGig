import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';

const walletTransactionSchema = new mongoose.Schema({
    type: {
        type: String,
        enum: ['contract-credit', 'platform-fee', 'contract-expense'],
        required: true,
    },
    amount: {
        type: Number,
        required: true,
        min: 0,
    },
    currency: {
        type: String,
        default: 'PHP',
    },
    description: {
        type: String,
        required: true,
        trim: true,
    },
    gig: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Gig',
        default: null,
    },
    counterparty: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        default: null,
    },
    balanceAfter: {
        type: Number,
        required: true,
        min: 0,
    },
    metadata: {
        contractAmount: { type: Number, default: 0 },
        platformFeeAmount: { type: Number, default: 0 },
        freelancerPayoutAmount: { type: Number, default: 0 },
    },
    createdAt: {
        type: Date,
        default: Date.now,
    },
}, { _id: true, id: false });

const userSchema = new mongoose.Schema({
    name: {
        type: String,
        required: [true, 'Please add a name']
    },
    email: {
        type: String,
        required: [true, 'Please add an email'],
        unique: true,
        match: [
            /^\w+([\.-]?\w+)*@\w+([\.-]?\w+)*(\.\w{2,3})+$/,
            'Please add a valid email'
        ]
    },
    password: {
        type: String,
        required: [true, 'Please add a password'],
        minlength: 6,
        select: false
    },
    role: {
        type: String,
        enum: ['user', 'admin'],
        default: 'user',
    },
    isWalletAdmin: {
        type: Boolean,
        default: false,
    },
    // New Reputation Fields
    averageRating: {
        type: Number,
        default: 0,
        min: 0,
        max: 5
    },
    totalReviews: {
        type: Number,
        default: 0
    },
    walletBalance: {
        type: Number,
        default: 0,
        min: 0,
    },
    totalEarnings: {
        type: Number,
        default: 0,
        min: 0,
    },
    totalSpent: {
        type: Number,
        default: 0,
        min: 0,
    },
    platformRevenue: {
        type: Number,
        default: 0,
        min: 0,
    },
    walletTransactions: {
        type: [walletTransactionSchema],
        default: [],
    }
}, {
    timestamps: true
});

userSchema.pre('save', async function() {
    if (!this.isModified('password')) {
        return;
    }
    const salt = await bcrypt.genSalt(10);
    this.password = await bcrypt.hash(this.password, salt);
});

userSchema.methods.matchPassword = async function(enteredPassword) {
    return await bcrypt.compare(enteredPassword, this.password);
};

const User = mongoose.model('User', userSchema);

export default User;