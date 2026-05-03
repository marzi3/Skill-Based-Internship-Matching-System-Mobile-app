const User = require('../models/User');
const { send: sendNotification, notifyAdmins } = require('../services/notificationService');
const logger = require('../utils/logger');
const path = require('path');

const getStoredUploadPath = (file) => {
    if (!file || !file.path) {
        return '';
    }

    if (/^https?:\/\//i.test(file.path)) {
        return file.path.replace(/\\/g, '/');
    }

    const backendRoot = path.join(__dirname, '..', '..');
    const relativePath = path.relative(backendRoot, file.path);
    return relativePath.replace(/\\/g, '/');
};

// @desc    Upload Student Verification (ID Card)
// @route   POST /api/verification/student
// @access  Private (Student)
const submitStudentVerification = async (req, res) => {
    try {
        if (!req.file) {
            return res.status(400).json({ message: 'Please upload an image of your Student ID' });
        }

        const { studentId } = req.body;
        if (!studentId) {
            return res.status(400).json({ message: 'Student ID number is required' });
        }

        const user = await User.findById(req.user.id);

        if (user.role !== 'student') {
            return res.status(403).json({ message: 'Only students can submit student verification' });
        }

        user.studentId = studentId;
        // Normalize path for cross-platform URL compatibility (replace backslashes with forward slashes)
        user.studentIdImage = getStoredUploadPath(req.file);
        user.verificationStatus = 'pending';
        user.isVerified = false; // reset in case they re-submit

        await user.save();

        // Notify Admins
        try {
            await notifyAdmins({
                type: 'VERIFICATION_PENDING',
                message: `User ${user.name} has submitted student verification documents for review.`,
                link: '/admin/verifications',
                subject: `[Verification] New Student: ${user.name}`
            });
        } catch (err) { logger.error('Admin notification for student verification failed', err); }

        res.status(200).json({
            message: 'Verification submitted successfully',
            verificationStatus: user.verificationStatus
        });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// @desc    Upload Employer Verification (Business Doc)
// @route   POST /api/verification/employer
// @access  Private (Employer)
const submitEmployerVerification = async (req, res) => {
    try {
        if (!req.file) {
            return res.status(400).json({ message: 'Please upload your Business Registration Document (PDF/Image)' });
        }

        const { companyName, businessRegistrationNumber, website } = req.body;

        // Simple validation
        if (!companyName || !businessRegistrationNumber) {
            return res.status(400).json({ message: 'Company Name and Registration Number are required' });
        }

        const user = await User.findById(req.user.id);

        if (user.role !== 'employer') {
            return res.status(403).json({ message: 'Only employers can submit business verification' });
        }

        user.companyName = companyName;
        user.businessRegistrationNumber = businessRegistrationNumber;
        user.website = website;
        user.businessDocument = getStoredUploadPath(req.file);
        user.verificationStatus = 'pending';
        user.isVerified = false;

        await user.save();

        // Notify Admins
        try {
            await notifyAdmins({
                type: 'VERIFICATION_PENDING',
                message: `Employer ${user.name} has submitted business verification documents for review.`,
                link: '/admin/verifications',
                subject: `[Verification] New Employer: ${user.companyName}`
            });
        } catch (err) { logger.error('Admin notification for employer verification failed', err); }

        res.status(200).json({
            message: 'Business verification submitted successfully',
            verificationStatus: user.verificationStatus
        });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// @desc    Get all pending verifications
// @route   GET /api/verification/pending
// @access  Private (Admin)
const getPendingVerifications = async (req, res) => {
    try {
        const users = await User.find({ verificationStatus: 'pending' })
            .select('-password -__v') // Exclude sensitive
            .sort({ createdAt: -1 });

        res.status(200).json(users);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// @desc    Approve verification
// @route   PUT /api/verification/:id/approve
// @access  Private (Admin)
const approveVerification = async (req, res) => {
    try {
        const user = await User.findById(req.params.id);

        if (!user) {
            return res.status(404).json({ message: 'User not found' });
        }

        if (user.verificationStatus === 'approved') {
            return res.status(400).json({ message: 'User is already verified' });
        }

        user.verificationStatus = 'approved';
        user.isVerified = true;
        await user.save();

        // Propagation: Update Student profile status if it exists
        const Student = require('../models/Student');
        const student = await Student.findOne({ userId: user._id });
        if (student) {
            student.status = 'verified';
            await student.save({ validateBeforeSave: false });
        }

        // Notify User
        try {
            await sendNotification({
                userId: user._id,
                type: 'VERIFICATION_STATUS',
                message: 'Your account has been successfully verified! You now have full access to matching and applications.',
                link: '/student-dashboard', // or employer dashboard
                subject: 'Account Verified - InternMatch 🏅'
            });
        } catch (err) {
            logger.error('Verification approval notification failed', err);
        }

        res.status(200).json({ message: `User ${user.name} verified successfully` });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// @desc    Reject verification
// @route   PUT /api/verification/:id/reject
// @access  Private (Admin)
const rejectVerification = async (req, res) => {
    try {
        const user = await User.findById(req.params.id);

        if (!user) {
            return res.status(404).json({ message: 'User not found' });
        }

        const { reason } = req.body;
        
        user.verificationStatus = 'rejected';
        user.isVerified = false;
        user.verificationFeedback = reason || 'Your documentation did not meet our verification standards.';
        await user.save();
 
        // Notify User
        try {
            await sendNotification({
                userId: user._id,
                type: 'VERIFICATION_STATUS',
                message: `Your verification was not approved. Reason: ${user.verificationFeedback}. Please update your documents.`,
                link: '/verify',
                subject: 'Action Required: Verification Update'
            });
        } catch (err) {
            logger.error('Verification rejection notification failed', err);
        }
 
        res.status(200).json({ message: `User ${user.name} verification rejected`, reason: user.verificationFeedback });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

module.exports = {
    submitStudentVerification,
    submitEmployerVerification,
    getPendingVerifications,
    approveVerification,
    rejectVerification
};
