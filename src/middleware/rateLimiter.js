const rateLimit = require('express-rate-limit');

// Global rate limiter for all API requests
const globalLimiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 10000, // Increased for development
    standardHeaders: true, 
    legacyHeaders: false, 
    skip: (req) => process.env.NODE_ENV !== 'production' || req.method === 'OPTIONS', // Skip in development or for CORS preflight
    message: {
        success: false,
        message: 'Too many requests from this IP, please try again after 15 minutes'
    }
});

// Stricter rate limiter for authentication routes (login/register/forgot-password)
const authLimiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 1000, // Increased for development
    standardHeaders: true,
    legacyHeaders: false,
    skip: (req) => process.env.NODE_ENV !== 'production' || req.method === 'OPTIONS', // Skip in development or for CORS preflight
    message: {
        success: false,
        message: 'Too many authentication attempts from this IP, please try again after 15 minutes'
    }
});

module.exports = {
    globalLimiter,
    authLimiter
};
