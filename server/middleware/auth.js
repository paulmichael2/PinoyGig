import jwt from 'jsonwebtoken';
import { User } from '../models/index.js';

const getTokenFromRequest = (req) => {
    const cookieToken = req.cookies.token;
    if (cookieToken) {
        return cookieToken;
    }

    const authorizationHeader = req.headers.authorization || '';
    if (authorizationHeader.startsWith('Bearer ')) {
        return authorizationHeader.slice(7).trim();
    }

    return null;
};

export const protect = async(req, res, next) => {
    try {
        const token = getTokenFromRequest(req);

        if (!token) {
            return res.status(401).json({
                success: false,
                message: 'Not authorized, please login',
            });
        }

        const decoded = jwt.verify(token, process.env.JWT_SECRET);

        const user = await User.findById(decoded.id);

        if (!user) {
            return res.status(401).json({
                success: false,
                message: 'User not found',
            });
        }

        req.user = user;
        next();
    } catch (error) {
        console.error('Auth middleware error:', error);
        return res.status(401).json({
            success: false,
            message: 'Not authorized, token invalid',
        });
    }
};

export const optionalAuth = async(req, res, next) => {
    try {
        const token = getTokenFromRequest(req);

        if (token) {
            const decoded = jwt.verify(token, process.env.JWT_SECRET);
            const user = await User.findById(decoded.id);
            if (user) {
                req.user = user;
            }
        }
        next();
    } catch (error) {
        next();
    }
};

export const adminOnly = (req, res, next) => {
    if (!req.user) {
        return res.status(401).json({
            success: false,
            message: 'Not authorized, please login',
        });
    }

    if (req.user.role !== 'admin') {
        return res.status(403).json({
            success: false,
            message: 'Admin access only',
        });
    }

    next();
};