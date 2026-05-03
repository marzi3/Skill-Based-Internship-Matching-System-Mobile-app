const logger = require('../utils/logger');
const User = require('../models/User');
const Internship = require('../models/Internship');
const AuditLog = require('../models/AuditLog');
const Application = require('../models/Application');
const Report = require('../models/Report');
const { send: sendNotification } = require('../services/notificationService');

/**
 * Helper function to log admin actions
 */
const logAdminAction = async (adminId, action, targetEntity, targetId, details = '') => {
    try {
        await AuditLog.create({
            adminId,
            action,
            targetEntity,
            targetId,
            details,
        });
    } catch (error) {
        logger.error('Error logging admin action:', error);
    }
};

/**
 * @desc    Get dashboard summary stats
 * @route   GET /api/admin/dashboard
 * @access  Private/Admin
 */
exports.getDashboardStats = async (req, res) => {
    try {
        const totalStudents = await User.countDocuments({ role: 'student' });
        const totalEmployers = await User.countDocuments({ role: 'employer' });
        const activeInternships = await Internship.countDocuments({ status: 'Hiring', isDeleted: false });
        const totalApplications = await Application.countDocuments();
        const acceptedApplications = await Application.countDocuments({ status: 'Selected' });
        const rejectedApplications = await Application.countDocuments({ status: 'Rejected' });
        const resolvedApplications = acceptedApplications + rejectedApplications;

        let matchSuccessRate = 0;
        if (resolvedApplications > 0) {
            matchSuccessRate = ((acceptedApplications / resolvedApplications) * 100).toFixed(2);
        }

        // Recent activity (last 5 applications or other things)
        const recentApplications = await Application.find()
            .sort({ createdAt: -1 })
            .limit(5)
            .populate('student', 'name email')
            .populate('internship', 'positionTitle company');

        const recentInternships = await Internship.find()
            .sort({ createdAt: -1 })
            .limit(5)
            .populate('employer', 'companyName profilePicture');

        res.json({
            success: true,
            data: {
                totalStudents,
                totalEmployers,
                activeInternships,
                totalApplications,
                matchSuccessRate,
                recentActivity: {
                    applications: recentApplications,
                    internships: recentInternships
                }
            },
        });
    } catch (error) {
        res.status(500).json({ success: false, message: 'Server Error', error: error.message });
    }
};

/**
 * @desc    Get all employers with filtering
 * @route   GET /api/admin/employers
 * @access  Private/Admin
 */
exports.getEmployers = async (req, res) => {
    try {
        const { status, search, page = 1, limit = 10 } = req.query;

        let query = { role: 'employer' };

        if (status) {
            query.status = status;
        }

        if (search) {
            query.$or = [
                { name: { $regex: search, $options: 'i' } },
                { companyName: { $regex: search, $options: 'i' } },
                { email: { $regex: search, $options: 'i' } }
            ];
        }

        const skip = (parseInt(page) - 1) * parseInt(limit);

        const employers = await User.find(query)
            .select('-password')
            .sort({ createdAt: -1 })
            .skip(skip)
            .limit(parseInt(limit));

        const total = await User.countDocuments(query);

        res.json({
            success: true,
            data: employers,
            pagination: {
                total,
                page: parseInt(page),
                pages: Math.ceil(total / parseInt(limit))
            }
        });
    } catch (error) {
        res.status(500).json({ success: false, message: 'Server Error', error: error.message });
    }
};

/**
 * @desc    Approve or suspend an employer
 * @route   PATCH /api/admin/employers/:id/status
 * @access  Private/Admin
 */
exports.updateEmployerStatus = async (req, res) => {
    try {
        const { status } = req.body;

        if (!['pending', 'approved', 'suspended'].includes(status)) {
            return res.status(400).json({ success: false, message: 'Invalid status' });
        }

        const employer = await User.findById(req.params.id);

        if (!employer || employer.role !== 'employer') {
            return res.status(404).json({ success: false, message: 'Employer not found' });
        }

        employer.status = status;
        employer.verificationStatus = status;

        // Permanent Fix: Delete internships if suspended
        if (status === 'suspended') {
            await Internship.deleteMany({ employer: employer._id });
            await Application.deleteMany({ employer: employer._id });
            logger.info(`Admin ${req.user.id} suspended employer ${employer._id} - deleted all associated internships and applications.`);
        }

        await employer.save();

        // Log the action
        const action = status === 'approved' ? 'APPROVE_EMPLOYER' : 'SUSPEND_EMPLOYER';
        await logAdminAction(req.user.id, action, 'User', employer._id, `Changed status to ${status}${status === 'suspended' ? ' and deleted all postings' : ''}`);

        // Notify Employer
        try {
            await sendNotification({
                userId: employer._id,
                type: 'ACCOUNT_STATUS',
                message: `Your account status has been updated to: ${status}.`,
                link: '/employer/dashboard'
            });
        } catch (err) { logger.error('Notification failed', err); }

        res.json({
            success: true,
            message: `Employer status updated to ${status}`,
            data: employer
        });
    } catch (error) {
        res.status(500).json({ success: false, message: 'Server Error', error: error.message });
    }
};

/**
 * @desc    Get reports data for charts
 * @route   GET /api/admin/reports
 * @access  Private/Admin
 */
exports.getReports = async (req, res) => {
    try {
        const { startDate, endDate, department } = req.query;

        let dateFilter = {};
        if (startDate && endDate) {
            dateFilter.createdAt = {
                $gte: new Date(startDate),
                $lte: new Date(endDate)
            };
        }

        // 1. Applications per week (Last 7 days with zero padding)
        const last7Days = [];
        for (let i = 6; i >= 0; i--) {
            const d = new Date();
            d.setDate(d.getDate() - i);
            last7Days.push(d.toISOString().split('T')[0]);
        }

        const trendData = await Application.aggregate([
            {
                $match: {
                    createdAt: { $gte: new Date(new Date().setDate(new Date().getDate() - 7)) }
                }
            },
            {
                $group: {
                    _id: { $dateToString: { format: "%Y-%m-%d", date: "$createdAt" } },
                    count: { $sum: 1 }
                }
            },
            { $sort: { _id: 1 } }
        ]);

        // Map trend data to the 7-day window with zero padding
        const applicationsTrend = last7Days.map(date => {
            const found = trendData.find(t => t._id === date);
            return { _id: date, count: found ? found.count : 0 };
        });

        // 2. Placements by department
        // We get domain from Internship referenced in Application
        const placements = await Application.aggregate([
            { $match: { ...dateFilter, status: 'Selected' } },
            {
                $lookup: {
                    from: 'internships',
                    localField: 'internship',
                    foreignField: '_id',
                    as: 'internshipDoc'
                }
            },
            { $unwind: '$internshipDoc' },
            {
                $group: {
                    _id: '$internshipDoc.domain',
                    count: { $sum: 1 }
                }
            },
            { $sort: { count: -1 } }
        ]);

        // 3. Top skills in demand
        const skillsDemand = await Internship.aggregate([
            { $match: dateFilter },
            { $unwind: '$requiredSkills' },
            {
                $group: {
                    _id: '$requiredSkills', // Assuming requiredSkills is array of strings
                    count: { $sum: 1 }
                }
            },
            { $sort: { count: -1 } },
            { $limit: 10 }
        ]);

        // 4. Overall Match Quality Distribution (EXCELLENT, GOOD, etc.)
        const Match = require('../models/Match');
        const matchDistribution = await Match.aggregate([
            {
                $group: {
                    _id: '$tier',
                    count: { $sum: 1 }
                }
            },
            { $sort: { count: -1 } }
        ]);

        res.json({
            success: true,
            data: {
                applicationsTrend,
                placements,
                skillsDemand,
                matchDistribution
            }
        });
    } catch (error) {
        res.status(500).json({ success: false, message: 'Server Error', error: error.message });
    }
};

/**
 * @desc    Export reports data
 * @route   GET /api/admin/reports/export
 * @access  Private/Admin
 */
exports.exportReports = async (req, res) => {
    try {
        // Return all application and placement data formatted for easy CSV/PDF generation on client
        const applications = await Application.find()
            .populate('student', 'name email')
            .populate('internship', 'positionTitle company domain')
            .sort({ createdAt: -1 });

        const formattedData = applications.map(app => ({
            ApplicantName: app.student?.name || 'N/A',
            ApplicantEmail: app.student?.email || 'N/A',
            Position: app.internship?.positionTitle || 'N/A',
            Company: app.internship?.company || 'N/A',
            Domain: app.internship?.domain || 'N/A',
            Status: app.status,
            AppliedDate: app.createdAt.toISOString().split('T')[0]
        }));

        await logAdminAction(req.user.id, 'GENERATE_REPORT', 'Report', null, 'Exported all applications data');

        res.json({
            success: true,
            data: formattedData
        });
    } catch (error) {
        res.status(500).json({ success: false, message: 'Server Error', error: error.message });
    }
};

/**
 * @desc    Get audit logs with pagination
 * @route   GET /api/admin/audit-logs
 * @access  Private/Admin
 */
exports.getAuditLogs = async (req, res) => {
    try {
        const { action, page = 1, limit = 20 } = req.query;

        let query = {};
        if (action) {
            query.action = action;
        }

        const skip = (parseInt(page) - 1) * parseInt(limit);

        const logs = await AuditLog.find(query)
            .populate('adminId', 'name email')
            .sort({ timestamp: -1 })
            .skip(skip)
            .limit(parseInt(limit));

        const total = await AuditLog.countDocuments(query);

        res.json({
            success: true,
            data: logs,
            pagination: {
                total,
                page: parseInt(page),
                pages: Math.ceil(total / parseInt(limit))
            }
        });
    } catch (error) {
        res.status(500).json({ success: false, message: 'Server Error', error: error.message });
    }
};

/**
 * @desc    Delete (or deactivate) an inappropriate listing
 * @route   DELETE /api/admin/listings/:id
 * @access  Private/Admin
 */
exports.deleteListing = async (req, res) => {
    try {
        const internship = await Internship.findById(req.params.id);

        if (!internship) {
            return res.status(404).json({ success: false, message: 'Listing not found' });
        }

        internship.isDeleted = true;
        internship.status = 'Closed';
        await internship.save();

        await logAdminAction(req.user.id, 'DELETE_LISTING', 'Internship', internship._id, `Deleted listing: ${internship.positionTitle}`);

        res.json({
            success: true,
            message: 'Listing successfully removed',
            data: {}
        });
    } catch (error) {
        res.status(500).json({ success: false, message: 'Server Error', error: error.message });
    }
};

/**
 * @desc    Get all flagged items and user reports
 * @route   GET /api/admin/moderation
 * @access  Private/Admin
 */
exports.getModerationItems = async (req, res) => {
    try {
        const flaggedListings = await Internship.find({ flagged: true, isDeleted: false })
            .populate('employer', 'name email companyName profilePicture');

        const reports = await Report.find({ status: 'pending' })
            .populate('reporterId', 'name email')
            .populate({ path: 'reportedId', select: 'name email companyName positionTitle' });

        res.json({
            success: true,
            data: {
                flaggedListings,
                reports
            }
        });
    } catch (error) {
        res.status(500).json({ success: false, message: 'Server Error', error: error.message });
    }
};

/**
 * @desc    Update report status
 * @route   PATCH /api/admin/moderation/reports/:id
 * @access  Private/Admin
 */
exports.resolveReport = async (req, res) => {
    try {
        const { status } = req.body;
        const report = await Report.findById(req.params.id);
        if (!report) return res.status(404).json({ success: false, message: 'Report not found' });

        report.status = status;
        await report.save();

        await logAdminAction(req.user.id, 'OTHER', 'Report', report._id, `Marked report as ${status}`);

        res.json({ success: true, data: report });
    } catch (error) {
        res.status(500).json({ success: false, message: 'Server Error', error: error.message });
    }
};

/**
 * @desc    Get all students with filtering
 * @route   GET /api/admin/students
 * @access  Private/Admin
 */
exports.getStudents = async (req, res) => {
    try {
        const { status, search, page = 1, limit = 10 } = req.query;

        let query = { role: 'student' };

        if (status) {
            query.status = status;
        }

        if (search) {
            query.$or = [
                { name: { $regex: search, $options: 'i' } },
                { email: { $regex: search, $options: 'i' } }
            ];
        }

        const skip = (parseInt(page) - 1) * parseInt(limit);

        const students = await User.find(query)
            .select('-password')
            .sort({ createdAt: -1 })
            .skip(skip)
            .limit(parseInt(limit));

        const total = await User.countDocuments(query);

        res.json({
            success: true,
            data: students,
            pagination: {
                total,
                page: parseInt(page),
                pages: Math.ceil(total / parseInt(limit))
            }
        });
    } catch (error) {
        res.status(500).json({ success: false, message: 'Server Error', error: error.message });
    }
};

/**
 * @desc    Approve, Suspend, or Ban a student
 * @route   PATCH /api/admin/students/:id/status
 * @access  Private/Admin
 */
exports.updateStudentStatus = async (req, res) => {
    try {
        const { status } = req.body;

        if (!['pending', 'approved', 'suspended'].includes(status)) {
            return res.status(400).json({ success: false, message: 'Invalid status. Use pending, approved, or suspended.' });
        }

        const student = await User.findById(req.params.id);

        if (!student || student.role !== 'student') {
            return res.status(404).json({ success: false, message: 'Student not found' });
        }

        student.status = status;
        student.verificationStatus = status;
        await student.save();

        // Propagation: Update Student profile status if it exists
        const Student = require('../models/Student');
        const studentProfile = await Student.findOne({ userId: student._id });
        if (studentProfile) {
            // Map 'approved' to 'verified' for the Student model
            if (status === 'approved') {
                studentProfile.status = 'verified';
            } else if (status === 'suspended') {
                studentProfile.status = 'incomplete'; // Or another suitable status
            }
            await studentProfile.save({ validateBeforeSave: false });
        }

        const action = status === 'approved' ? 'ACTIVATE_STUDENT' : 'SUSPEND_STUDENT';
        await logAdminAction(req.user.id, action, 'User', student._id, `Changed student status to ${status}`);

        try {
            await sendNotification({
                userId: student._id,
                type: 'ACCOUNT_STATUS',
                message: `Your account status has been updated to: ${status}.`,
                link: '/profile'
            });
        } catch (err) { logger.error('Notification failed', err); }

        res.json({
            success: true,
            message: `Student status updated to ${status}`,
            data: student
        });
    } catch (error) {
        res.status(500).json({ success: false, message: 'Server Error', error: error.message });
    }
};

/**
 * @desc    Permanently delete a user account and associated data
 * @route   DELETE /api/admin/users/:id
 * @access  Private/Admin
 */
exports.deleteUser = async (req, res) => {
    try {
        const user = await User.findById(req.params.id);

        if (!user) {
            return res.status(404).json({ success: false, message: 'User not found' });
        }

        // Prevent admin from deleting themselves
        if (user._id.toString() === req.user.id) {
            return res.status(403).json({ success: false, message: 'Cannot delete your own admin account.' });
        }

        const userRole = user.role;
        const userName = user.name;

        // Log action before deletion
        await logAdminAction(req.user.id, 'DELETE_USER', 'User', user._id, `Permanently deleted ${userRole} account: ${userName}`);

        // Perform hard delete based on role
        if (userRole === 'employer') {
            // Delete all internships and applications owned by this employer
            await Internship.deleteMany({ employer: user._id });
            await Application.deleteMany({ employer: user._id });
        }

        // Finally delete the user document
        await User.findByIdAndDelete(user._id);

        res.json({
            success: true,
            message: `Successfully deleted ${userRole} account for ${userName}`,
            data: {}
        });
    } catch (error) {
        res.status(500).json({ success: false, message: 'Server Error', error: error.message });
    }
};
