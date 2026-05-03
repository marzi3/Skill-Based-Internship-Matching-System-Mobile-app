const Report = require('../models/Report');
const User = require('../models/User'); // Required for blocking
const logger = require('../utils/logger');
const { notifyAdmins } = require('../services/notificationService');

/**
 * @desc    Create a new report
 * @route   POST /api/v1/reports
 * @access  Private
 */
exports.createReport = async (req, res) => {
    try {
        const { reportedId, reason, details, applicationId } = req.body;

        if (!reportedId || !reason) {
            return res.status(400).json({ success: false, message: 'Please provide reported user ID and a reason' });
        }

        const report = await Report.create({
            reporter: req.user.id,
            reported: reportedId,
            application: applicationId,
            reason,
            details
        });

        // Notify Admins
        try {
            await notifyAdmins({
                type: 'MODERATION_ALERT',
                message: `New moderation report received from ${req.user.name}. Reason: "${reason.substring(0, 50)}${reason.length > 50 ? '...' : ''}"`,
                link: '/admin/moderation',
                subject: `[Moderation] New User Report`
            });
        } catch (err) { logger.error('Admin notification for report failed', err); }

        res.status(201).json({
            success: true,
            message: 'Report submitted successfully. Our team will review it shortly.',
            data: report
        });
    } catch (error) {
        logger.error('Error creating report:', error);
        res.status(500).json({ success: false, message: 'Server Error', error: error.message });
    }
};

/**
 * @desc    Block a user
 * @route   PATCH /api/v1/reports/block/:id
 * @access  Private
 */
exports.blockUser = async (req, res) => {
    try {
        const userToBlock = req.params.id;
        if (userToBlock === req.user.id) {
            return res.status(400).json({ success: false, message: 'You cannot block yourself' });
        }

        await User.findByIdAndUpdate(req.user.id, {
            $addToSet: { blockedUsers: userToBlock }
        });

        res.json({ success: true, message: 'User blocked successfully' });
    } catch (error) {
        res.status(500).json({ success: false, message: 'Server Error' });
    }
};

/**
 * @desc    Unblock a user
 * @route   PATCH /api/v1/reports/unblock/:id
 * @access  Private
 */
exports.unblockUser = async (req, res) => {
    try {
        await User.findByIdAndUpdate(req.user.id, {
            $pull: { blockedUsers: req.params.id }
        });
        res.json({ success: true, message: 'User unblocked successfully' });
    } catch (error) {
        res.status(500).json({ success: false, message: 'Server Error' });
    }
};

/**
 * @desc    Get user's own reports (history)
 * @route   GET /api/v1/reports/my-reports
 * @access  Private
 */
exports.getMyReports = async (req, res) => {
    try {
        const reports = await Report.find({ reporter: req.user.id })
            .populate('reported', 'name companyName')
            .sort({ createdAt: -1 });

        res.json({ success: true, data: reports });
    } catch (error) {
        res.status(500).json({ success: false, message: 'Server Error' });
    }
};
