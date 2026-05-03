const mongoose = require('mongoose');

const notificationSchema = new mongoose.Schema({
    userId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true,
        index: true
    },
    type: {
        type: String,
        enum: [
            'APPLICATION_RECEIVED', 
            'APPLICATION_STATUS', 
            'NEW_MATCH', 
            'INTERVIEW_SCHEDULED', 
            'ACCOUNT_STATUS', 
            'NEW_MESSAGE',
            'WELCOME',
            'PASSWORD_RESET',
            'VERIFICATION_STATUS',
            'USER_REPORTED'
        ],
        required: true
    },
    message: {
        type: String,
        required: true
    },
    isRead: {
        type: Boolean,
        default: false
    },
    link: {
        type: String
    },
    createdAt: {
        type: Date,
        default: Date.now,
        expires: 60 * 60 * 24 * 30 // Auto-delete after 30 days
    },
    metadata: {
        date: String,
        time: String,
        location: String
    }
});

// Unique index to prevent duplicate NEW_MATCH notifications for the same user and item (e.g. internship)
notificationSchema.index({ userId: 1, type: 1, link: 1 }, { unique: true, partialFilterExpression: { type: 'NEW_MATCH' } });

const Notification = mongoose.model('Notification', notificationSchema);
module.exports = Notification;
