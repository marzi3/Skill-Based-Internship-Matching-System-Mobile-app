const Notification = require('../models/Notification');
const asyncHandler = require('express-async-handler');

// @desc    Get all notifications for logged-in user
// @route   GET /api/notifications
// @access  Private
const getNotifications = asyncHandler(async (req, res) => {
    const notifications = await Notification.find({ userId: req.user._id })
        .sort({ createdAt: -1 });

    res.status(200).json({
        success: true,
        count: notifications.length,
        data: notifications
    });
});

// @desc    Mark notification as read
// @route   PATCH /api/notifications/:id/read
// @access  Private
const markAsRead = asyncHandler(async (req, res) => {
    const notification = await Notification.findOneAndUpdate(
        { _id: req.params.id, userId: req.user._id },
        { isRead: true },
        { new: true, runValidators: true }
    );

    if (!notification) {
        res.status(404);
        throw new Error('Notification not found or unauthorized');
    }

    res.status(200).json({
        success: true,
        data: notification
    });
});

// @desc    Delete a notification
// @route   DELETE /api/notifications/:id
// @access  Private
const deleteNotification = asyncHandler(async (req, res) => {
    const notification = await Notification.findOne({ _id: req.params.id, userId: req.user._id });

    if (!notification) {
        res.status(404);
        throw new Error('Notification not found or unauthorized');
    }

    await notification.deleteOne();

    res.status(200).json({
        success: true,
        data: {}
    });
});

// @desc    Mark all notifications as read for logged-in user
// @route   PATCH /api/notifications/mark-all-read
// @access  Private
const markAllRead = asyncHandler(async (req, res) => {
    await Notification.updateMany(
        { userId: req.user._id, isRead: false },
        { isRead: true }
    );

    res.status(200).json({
        success: true,
        data: {}
    });
});

// @desc    Delete all notifications for logged-in user
// @route   DELETE /api/notifications/delete-all
// @access  Private
const deleteAllNotifications = asyncHandler(async (req, res) => {
    await Notification.deleteMany({ userId: req.user._id });

    res.status(200).json({
        success: true,
        data: {}
    });
});

// @desc    Get unread notification count
// @route   GET /api/notifications/unread-count
// @access  Private
const getUnreadNotificationCount = asyncHandler(async (req, res) => {
    const unreadCount = await Notification.countDocuments({
        userId: req.user._id,
        isRead: false
    });
    res.status(200).json({ success: true, count: unreadCount });
});

module.exports = {
    getNotifications,
    markAsRead,
    deleteNotification,
    markAllRead,
    deleteAllNotifications,
    getUnreadNotificationCount
};
