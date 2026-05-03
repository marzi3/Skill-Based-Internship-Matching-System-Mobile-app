const { createClient } = require('redis');
const logger = require('../utils/logger');

// Initialize Redis Client
const redisClient = createClient({
    url: process.env.REDIS_URL || 'redis://localhost:6379',
    legacyMode: false, // We'll use the modern async API
});

redisClient.on('error', (err) => {
    // Only log warn, don't crash the server if Redis is down (graceful degradation)
    logger.error('Redis Client Error', err);
});

redisClient.on('connect', () => {
    logger.info('Connected to Redis');
});

// Since not all users will have Redis installed locally automatically while cloning this github, 
// we won't strictly enforce connection crashing. We attempt a connection.
// Commented out to clear logs in dev environment where Redis might not be present
/*
(async () => {
    try {
        await redisClient.connect();
    } catch (err) {
        logger.error('Failed to connect to Redis on startup over port 6379:', err.message);
    }
})();
*/

module.exports = redisClient;
