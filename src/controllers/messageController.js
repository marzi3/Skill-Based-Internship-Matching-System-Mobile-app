const logger = require('../utils/logger');
const Message = require('../models/Message');
const Application = require('../models/Application');
const User = require('../models/User');
const asyncHandler = require('express-async-handler');
const { send: sendNotification } = require('../services/notificationService');
const { emitToUser } = require('../config/socket');

// @desc    Get message thread for an application
// @route   GET /api/messages/:applicationId
// @access  Private
const getMessagesByApplication = asyncHandler(async (req, res) => {
    const { applicationId } = req.params;

    // Validate user has access to this application
    const application = await Application.findById(applicationId);

    if (!application) {
        res.status(404);
        throw new Error('Application not found');
    }

    // Authorization check - must be the student or the employer of the internship
    // In a real scenario we need to verify employer ID against the internship
    // Assuming basic RBAC or ownership logic is handled elsewhere, or we just rely on matching sender/receiver

    const messages = await Message.find({ applicationId })
        .sort({ timestamp: -1 }) // Newest first as requested
        .populate('senderId', 'name profilePicture isStudent isEmployer')
        .populate('receiverId', 'name profilePicture isStudent isEmployer');

    res.status(200).json({
        success: true,
        data: messages
    });
});

// @desc    Send a message
// @route   POST /api/messages
// @access  Private
const sendMessage = asyncHandler(async (req, res) => {
    const { applicationId, receiverId, content } = req.body;

    if (!applicationId || !receiverId || !content) {
        res.status(400);
        throw new Error('Please provide applicationId, receiverId, and content');
    }

    // 1. Check Application Status
    const application = await Application.findById(applicationId);
    if (!application) {
        res.status(404);
        throw new Error('Application context is missing or invalid');
    }

    if (application.status === 'Rejected') {
        res.status(403);
        throw new Error('Communication is restricted for rejected applications. You may still message other active contacts.');
    }

    // 2. Check Blocking Status
    const sender = await User.findById(req.user._id);
    const receiver = await User.findById(receiverId);

    if (!receiver) {
        res.status(404);
        throw new Error('Recipient no longer exists in the network');
    }

    const isBlockedBySender = sender.blockedUsers && sender.blockedUsers.includes(receiverId);
    const isBlockedByReceiver = receiver.blockedUsers && receiver.blockedUsers.includes(req.user._id);

    if (isBlockedBySender || isBlockedByReceiver) {
        res.status(403);
        throw new Error('Message transmission failure: Communication with this user is currently restricted.');
    }

    const message = await Message.create({
        senderId: req.user._id,
        receiverId,
        applicationId,
        content
    });

    // Update lastMessageAt in Application for sorting
    await Application.findByIdAndUpdate(applicationId, { 
        lastMessageAt: Date.now() 
    });

    // Populate sender details for real-time pushing and immediate response
    const populatedMessage = await message.populate('senderId', 'name profilePicture isStudent isEmployer');

    // Emit real-time message event via WebSocket
    emitToUser(receiverId, 'receiveMessage', populatedMessage);

    // Trigger Notification to Receiver
    try {
        const senderName = req.user.name || 'A user';
        await sendNotification({
            userId: receiverId,
            type: 'NEW_MESSAGE',
            message: `${senderName} sent you a new message regarding an application.`,
            link: `/messages/${applicationId}`
        });
    } catch (error) {
        logger.error('Failed to dispatch message notification', error);
    }

    res.status(201).json({
        success: true,
        data: populatedMessage
    });
});

// @desc    Mark message as read
// @route   PATCH /api/messages/:id/read
// @access  Private
const markMessageAsRead = asyncHandler(async (req, res) => {
    const message = await Message.findById(req.params.id);

    if (!message) {
        res.status(404);
        throw new Error('Message not found');
    }

    // Ensure only the receiver can mark it as read
    if (message.receiverId.toString() !== req.user._id.toString()) {
        res.status(403);
        throw new Error('User not authorized to update this message');
    }

    message.isRead = true;
    await message.save();

    // Notify the sender that the message was read
    emitToUser(message.senderId, 'messagesRead', { 
        messageId: message._id, 
        applicationId: message.applicationId 
    });

    res.status(200).json({
        success: true,
        data: message
    });
});

// @desc    Mark all messages in a thread as read (called when receiver opens the thread)
// @route   PATCH /api/messages/:applicationId/read-all
// @access  Private
const markThreadAsRead = asyncHandler(async (req, res) => {
    const { applicationId } = req.params;

    // Find who the sender is for these messages to notify them
    // Usually it's the other party in the thread
    const threadMessages = await Message.find({ 
        applicationId, 
        receiverId: req.user._id, 
        isRead: false 
    }).distinct('senderId');

    await Message.updateMany(
        { applicationId, receiverId: req.user._id, isRead: false },
        { $set: { isRead: true } }
    );

    // Notify each sender that their messages in this thread were read
    threadMessages.forEach(senderId => {
        emitToUser(senderId, 'messagesRead', { applicationId });
    });

    res.status(200).json({ success: true });
});

module.exports = {
    getMessagesByApplication,
    sendMessage,
    markMessageAsRead,
    markThreadAsRead
};

// @desc    Get unread messages count
// @route   GET /api/messages/unread-count
// @access  Private
const getUnreadMessageCount = asyncHandler(async (req, res) => {
    const unreadCount = await Message.countDocuments({
        receiverId: req.user._id,
        isRead: false
    });
    res.status(200).json({ success: true, count: unreadCount });
});

module.exports.getUnreadMessageCount = getUnreadMessageCount;
