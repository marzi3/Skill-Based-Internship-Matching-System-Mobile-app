const socketIo = require('socket.io');
const jwt = require('jsonwebtoken');
const logger = require('../utils/logger');
const User = require('../models/User');

let io;

// Map user IDs to their active socket IDs
// Key: userId (string), Value: Set of socketId strings (allows multiple tabs)
const userSockets = new Map();

const initializeSocket = (server) => {
    io = socketIo(server, {
        cors: {
            origin: [
                'http://localhost:3000',
                'http://localhost:3001',
                process.env.FRONTEND_URL
            ].filter(Boolean),
            credentials: true,
            methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE']
        }
    });

    // Middleware for authentication
    io.use(async (socket, next) => {
        try {
            const token = socket.handshake.auth.token || socket.handshake.headers['authorization']?.split(' ')[1];

            if (!token) {
                return next(new Error('Authentication error: No token provided'));
            }

            const decoded = jwt.verify(token, process.env.JWT_SECRET);
            const user = await User.findById(decoded.id).select('-password');

            if (!user) {
                return next(new Error('Authentication error: User not found'));
            }

            socket.user = user;
            next();
        } catch (error) {
            logger.error(`Socket auth error: ${error.message}`);
            return next(new Error('Authentication error: Invalid token'));
        }
    });

    io.on('connection', (socket) => {
        const userId = socket.user._id.toString();
        logger.info(`User connected to socket: ${userId} (Socket ID: ${socket.id})`);

        // Register user's socket
        if (!userSockets.has(userId)) {
            userSockets.set(userId, new Set());
        }
        userSockets.get(userId).add(socket.id);

        socket.on('disconnect', () => {
            logger.info(`User disconnected from socket: ${userId} (Socket ID: ${socket.id})`);
            const userSocketSet = userSockets.get(userId);
            if (userSocketSet) {
                userSocketSet.delete(socket.id);
                // Clean up memory if no active tabs
                if (userSocketSet.size === 0) {
                    userSockets.delete(userId);
                }
            }
        });
    });

    return io;
};

// Function to emit an event to a specific user
const emitToUser = (userId, eventName, payload) => {
    if (!io) {
        logger.warn('Socket.io not initialized. Cannot emit event.');
        return;
    }

    const targetSockets = userSockets.get(userId.toString());
    if (targetSockets && targetSockets.size > 0) {
        targetSockets.forEach(socketId => {
            io.to(socketId).emit(eventName, payload);
        });
        logger.info(`Event [${eventName}] emitted to user: ${userId}`);
    } else {
        logger.info(`User ${userId} is offline. Event [${eventName}] not sent via socket.`);
    }
};

const getIo = () => {
    if (!io) {
        throw new Error('Socket.io has not been initialized');
    }
    return io;
};

module.exports = {
    initializeSocket,
    emitToUser,
    getIo
};
