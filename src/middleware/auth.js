const logger = require('../utils/logger');
const jwt = require('jsonwebtoken');
const User = require('../models/User');

const protect = async (req, res, next) => {
    let token;

    if (req.cookies && req.cookies.jwt) {
        token = req.cookies.jwt;
    } else if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
        token = req.headers.authorization.split(' ')[1];
    }

    if (!token) {
        return res.status(401).json({ message: 'Not authorized, no token' });
    }

    try {
        if (!process.env.JWT_SECRET) {
            throw new Error('JWT_SECRET is not defined in environment variables');
        }
        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        req.user = await User.findById(decoded.id).select('-password');

        if (!req.user) {
            return res.status(401).json({ message: 'Not authorized, user not found' });
        }

        next();
    } catch (error) {
        logger.error(error);
        res.status(401).json({ message: 'Not authorized, token failed' });
    }
};

const authorize = (...roles) => {
    return (req, res, next) => {
        if (!roles.includes(req.user.role)) {
            return res.status(403).json({
                message: `User role ${req.user.role} is not authorized to access this route`
            });
        }
        next();
    }
};

const verifyStatus = (req, res, next) => {
    // Admins bypass verification checks
    if (req.user && req.user.role === 'admin') {
        return next();
    }

    // Check if user is verified
    if (req.user && (req.user.isVerified === true || req.user.verificationStatus === 'approved')) {
        return next();
    }

    return res.status(403).json({
        success: false,
        message: 'Your account must be verified by an administrator to perform this action.'
    });
};

module.exports = { protect, authorize, verifyStatus };
