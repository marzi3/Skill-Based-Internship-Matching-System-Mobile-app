const NotificationSettings = require('../models/NotificationSettings');
const asyncHandler = require('express-async-handler');

// @desc    Get user notification preferences
// @route   GET /api/settings/notifications
// @access  Private
const getSettings = asyncHandler(async (req, res) => {
    let settings = await NotificationSettings.findOne({ userId: req.user._id });

    // Create default if not exists
    if (!settings) {
        settings = await NotificationSettings.create({
            userId: req.user._id,
            emailEnabled: true,
            preferences: {
                onMatch: true,
                onStatusChange: true,
                onMessage: true
            }
        });
    }

    res.status(200).json({
        success: true,
        data: settings
    });
});

// @desc    Update user notification preferences
// @route   PUT /api/settings/notifications
// @access  Private
const updateSettings = asyncHandler(async (req, res) => {
    const { emailEnabled, preferences } = req.body;

    let settings = await NotificationSettings.findOne({ userId: req.user._id });

    if (!settings) {
        settings = new NotificationSettings({ userId: req.user._id });
    }

    if (emailEnabled !== undefined) {
        settings.emailEnabled = emailEnabled;
    }

    if (preferences) {
        settings.preferences = {
            onMatch: preferences.onMatch !== undefined ? preferences.onMatch : settings.preferences.onMatch,
            onStatusChange: preferences.onStatusChange !== undefined ? preferences.onStatusChange : settings.preferences.onStatusChange,
            onMessage: preferences.onMessage !== undefined ? preferences.onMessage : settings.preferences.onMessage
        };
    }

    const updatedSettings = await settings.save();

    res.status(200).json({
        success: true,
        data: updatedSettings
    });
});

module.exports = {
    getSettings,
    updateSettings
};
