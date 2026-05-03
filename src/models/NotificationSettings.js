const mongoose = require('mongoose');

const notificationSettingsSchema = new mongoose.Schema({
    userId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true,
        unique: true
    },
    emailEnabled: {
        type: Boolean,
        default: true
    },
    preferences: {
        onMatch: {
            type: Boolean,
            default: true
        },
        onStatusChange: {
            type: Boolean,
            default: true
        },
        onMessage: {
            type: Boolean,
            default: true
        }
    }
}, {
    timestamps: true
});

const NotificationSettings = mongoose.model('NotificationSettings', notificationSettingsSchema);
module.exports = NotificationSettings;
