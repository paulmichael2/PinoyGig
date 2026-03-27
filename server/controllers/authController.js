import jwt from 'jsonwebtoken';
import { User } from '../models/index.js';
import { CONTRACT_TAX_RATE, WALLET_CURRENCY, isWalletAdminUser } from '../utils/wallet.js';

const serializeUser = (user) => ({
    _id: user._id,
    name: user.name,
    email: user.email,
    averageRating: user.averageRating || 0,
    totalReviews: user.totalReviews || 0,
    walletBalance: user.walletBalance || 0,
    totalEarnings: user.totalEarnings || 0,
    totalSpent: user.totalSpent || 0,
    platformRevenue: user.platformRevenue || 0,
    role: user.role || 'user',
    isWalletAdmin: Boolean(user.isWalletAdmin),
    isVerified: isWalletAdminUser(user),
});

const generateToken = (id) => {
    return jwt.sign({ id }, process.env.JWT_SECRET, {
        expiresIn: '7d',
    });
};

const getCookieOptions = () => {
    const isProduction = process.env.NODE_ENV === 'production';

    return {
        httpOnly: true,
        secure: isProduction,
        sameSite: isProduction ? 'none' : 'strict',
        maxAge: 7 * 24 * 60 * 60 * 1000,
    };
};

const setTokenCookie = (res, token) => {
    res.cookie('token', token, getCookieOptions());
};


export const register = async(req, res) => {
    try {
        const { name, email, password } = req.body;

        const existingUser = await User.findOne({ email });
        if (existingUser) {
            return res.status(400).json({
                success: false,
                message: 'User already exists with this email',
            });
        }

        const user = await User.create({ name, email, password });

        const token = generateToken(user._id);
        setTokenCookie(res, token);

        res.status(201).json({
            success: true,
            token,
            user: serializeUser(user),
        });
    } catch (error) {
        console.error('Register error:', error);
        res.status(500).json({
            success: false,
            message: error.message || 'Server error',
        });
    }
};


export const login = async(req, res) => {
    try {
        const { email, password } = req.body;

        // Validate input
        if (!email || !password) {
            return res.status(400).json({
                success: false,
                message: 'Please provide email and password',
            });
        }

        const user = await User.findOne({ email }).select('+password');
        if (!user) {
            return res.status(401).json({
                success: false,
                message: 'Invalid credentials',
            });
        }

        const isMatch = await user.matchPassword(password);
        if (!isMatch) {
            return res.status(401).json({
                success: false,
                message: 'Invalid credentials',
            });
        }

        const token = generateToken(user._id);
        setTokenCookie(res, token);

        res.json({
            success: true,
            token,
            user: serializeUser(user),
        });
    } catch (error) {
        console.error('Login error:', error);
        res.status(500).json({
            success: false,
            message: error.message || 'Server error',
        });
    }
};


export const logout = async(req, res) => {
    res.cookie('token', '', {
        ...getCookieOptions(),
        expires: new Date(0),
        maxAge: 0,
    });

    res.json({
        success: true,
        message: 'Logged out successfully',
    });
};


export const getMe = async(req, res) => {
    res.json({
        success: true,
        user: serializeUser(req.user),
    });
};


export const getPublicProfile = async(req, res) => {
    try {
        const user = await User.findById(req.params.id).select('name averageRating totalReviews createdAt');

        if (!user) {
            return res.status(404).json({
                success: false,
                message: 'User not found',
            });
        }

        res.json({
            success: true,
            user: {
                ...user.toObject(),
                role: user.role || 'user',
                isWalletAdmin: Boolean(user.isWalletAdmin),
                isVerified: isWalletAdminUser(user),
            },
        });
    } catch (error) {
        console.error('Get public profile error:', error);
        res.status(500).json({
            success: false,
            message: error.message || 'Server error',
        });
    }
};


export const updateProfile = async(req, res) => {
    try {
        const { name } = req.body;
        const userId = req.user._id;

        // Validate name
        if (!name || name.trim().length === 0) {
            return res.status(400).json({
                success: false,
                message: 'Name is required',
            });
        }

        // Update user
        const user = await User.findByIdAndUpdate(
            userId, { name: name.trim() }, { new: true, runValidators: true }
        );

        if (!user) {
            return res.status(404).json({
                success: false,
                message: 'User not found',
            });
        }

        res.json({
            success: true,
            message: 'Profile updated successfully',
            user: {
                ...serializeUser(user),
                createdAt: user.createdAt,
            },
        });
    } catch (error) {
        console.error('Update profile error:', error);
        res.status(500).json({
            success: false,
            message: error.message || 'Server error',
        });
    }
};

export const getWallet = async(req, res) => {
    try {
        const transactions = [...(req.user.walletTransactions || [])]
            .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));

        res.json({
            success: true,
            wallet: {
                availableBalance: req.user.walletBalance || 0,
                totalEarnings: req.user.totalEarnings || 0,
                totalSpent: req.user.totalSpent || 0,
                platformRevenue: req.user.platformRevenue || 0,
                taxRate: CONTRACT_TAX_RATE,
                currency: WALLET_CURRENCY,
                isVerifiedAdmin: isWalletAdminUser(req.user),
                transactions,
            },
        });
    } catch (error) {
        console.error('Get wallet error:', error);
        res.status(500).json({
            success: false,
            message: error.message || 'Server error',
        });
    }
};