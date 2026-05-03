const logger = require('../utils/logger');
const Application = require('../models/Application');
const Internship = require('../models/Internship');
const User = require('../models/User');
const Student = require('../models/Student');
const Match = require('../models/Match');
const matchingEngine = require('../services/matchingEngine');
const { send: sendNotification } = require('../services/notificationService');

// @desc    Apply to an internship
// @route   POST /api/applications/apply/:id
// @access  Private (Student)
exports.applyToInternship = async (req, res) => {
    try {
        const { id } = req.params;
        const { coverLetter } = req.body;

        // Validate cover letter
        if (!coverLetter || typeof coverLetter !== 'string' || coverLetter.trim().length < 20) {
            return res.status(400).json({
                success: false,
                message: 'Cover letter is required and must be at least 20 characters long.'
            });
        }

        // 1. Check if already applied (ignore withdrawn applications)
        const existingApplication = await Application.findOne({ 
            student: req.user.id, 
            internship: id,
            status: { $ne: 'Withdrawn' }
        });
        if (existingApplication) {
            return res.status(400).json({ 
                success: false, 
                message: 'You have an active application for this protocol. Withdraw it first if you wish to re-submit.',
                data: existingApplication
            });
        }

        // Delete any previous withdrawn application so the new one starts clean
        await Application.deleteOne({ student: req.user.id, internship: id, status: 'Withdrawn' });

        const internship = await Internship.findById(id);

        if (!internship) {
            return res.status(404).json({ success: false, message: 'Internship not found' });
        }

        if (internship.status === 'Closed' || internship.isDeleted) {
            return res.status(400).json({ success: false, message: 'Internship is no longer accepting applications' });
        }

        // Check if already applied
        const existing = await Application.findOne({
            student: req.user.id,
            internship: req.params.id
        });

        if (existing) {
            return res.status(400).json({ success: false, message: 'Already applied to this internship' });
        }

        // Get student record first (ID mapping fix)
        const student = await Student.findOne({ userId: req.user.id });
        if (!student) {
            return res.status(404).json({ success: false, message: 'Student profile not found. Please complete your profile.' });
        }

        // Check if student is verified (email + admin approval)
        // and auto-heal legacy Student.status when user approval already exists.
        const userDetails = await User.findById(req.user.id);
        const hasEmailVerified = userDetails?.isVerified === true;
        const hasAdminApproval = userDetails?.verificationStatus === 'approved';

        if (hasAdminApproval && student.status !== 'verified') {
            student.status = 'verified';
            await student.save({ validateBeforeSave: false });
        }

        if (!hasEmailVerified || !hasAdminApproval) {
            const missingChecks = [];
            if (!hasEmailVerified) missingChecks.push('Email verification is required.');
            if (!hasAdminApproval) missingChecks.push('Admin profile verification is required.');

            return res.status(403).json({
                success: false,
                message: `Your account must be fully verified before you can apply for internships. ${missingChecks.join(' ')}`
            });
        }

        // 4. Degree Matching Validation
        const studentDegreeFields = student.education.map(edu => (edu.field || '').toLowerCase().trim());
        const requiredFields = (internship.requiredDegreeField || []).map(f => f.toLowerCase().trim());
        
        const hasMatchingDegree = requiredFields.length === 0 || requiredFields.some(reqField => 
            reqField === 'any' || reqField === '*' || studentDegreeFields.includes(reqField)
        );

        if (!hasMatchingDegree) {
            return res.status(403).json({
                success: false,
                message: `Application blocked: Your degree field does not match the requirements for this internship (${internship.requiredDegreeField.join(', ')}).`
            });
        }

        // Perform final match calculation for snapshot
        const analysis = matchingEngine.explainMatch(student, internship);

        const application = await Application.create({
            student: req.user.id,
            internship: req.params.id,
            employer: internship.employer,
            resume: req.body.resume,
            coverLetter: req.body.coverLetter,
            answers: req.body.answers,
            matchScore: analysis.normalizedScore,
            matchAnalysis: {
                tier: analysis.tier,
                score: analysis.normalizedScore,
                explanation: analysis.explanation
            },
            status: 'Applied',
            statusHistory: [{
                status: 'Applied',
                comment: 'Application submitted'
            }]
        });

        // Sync with Match model using the correct Student ID (legacy profile sync)
        await Match.findOneAndUpdate(
            { student: student._id, internship: req.params.id },
            { 
                status: 'Applied',
                rawScore: analysis.rawScore,
                normalizedScore: analysis.normalizedScore,
                tier: analysis.tier,
                explanations: analysis.explanation
            },
            { upsert: true }
        );

        // Add student to internship applicants list
        internship.applicants.push(req.user.id);
        await internship.save();

        // Notify Employer
        try {
            await sendNotification({
                userId: internship.employer,
                type: 'APPLICATION_RECEIVED',
                message: `You have received a new application for ${internship.positionTitle}.`,
                link: `/employer/applications/${application._id}`
            });
        } catch (err) { logger.error('Notification failed', err); }

        res.status(201).json({
            success: true,
            message: 'Application successfully submitted',
            data: application
        });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

// @desc    Get all applications for an employer
// @route   GET /api/applications/employer
// @access  Private (Employer)
exports.getEmployerApplications = async (req, res) => {
    try {
        const applications = await Application.find({ employer: req.user.id })
            .populate('student', 'name email profilePicture')
            .populate('internship', 'positionTitle domain')
            .sort({ lastMessageAt: -1 });

        // Synchronization Protocol: Fetch latest Match Intelligence for each application
        const studentIds = applications.map(app => app.student?._id || app.student).filter(Boolean);
        const uniqueStudents = await Student.find({ userId: { $in: studentIds } });
        const studentToProfileMap = new Map(uniqueStudents.map(s => [s.userId.toString(), s]));
        
        const internshipIds = applications.map(app => app.internship?._id || app.internship).filter(Boolean);
        const matches = await Match.find({ 
            student: { $in: uniqueStudents.map(s => s._id) },
            internship: { $in: internshipIds }
        }).lean();

        const matchMap = new Map();
        matches.forEach(m => matchMap.set(`${m.student.toString()}_${m.internship.toString()}`, m));

        const syncedApplications = applications.map(app => {
            const appObj = app.toObject();
            const studentId = (app.student?._id || app.student).toString();
            const studentProfile = studentToProfileMap.get(studentId);
            const internshipId = (app.internship?._id || app.internship).toString();
            
            if (studentProfile) {
                const match = matchMap.get(`${studentProfile._id.toString()}_${internshipId}`);
                if (match) {
                    appObj.matchScore = match.normalizedScore;
                    appObj.matchAnalysis = {
                        tier: match.tier,
                        score: match.normalizedScore,
                        explanation: match.explanations
                    };
                }
            }
            return appObj;
        });

        res.status(200).json({
            success: true,
            count: syncedApplications.length,
            data: syncedApplications
        });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

// @desc    Get single application details
// @route   GET /api/applications/:id
// @access  Private (Student/Employer/Admin)
exports.getApplicationDetails = async (req, res) => {
    try {
        const application = await Application.findById(req.params.id)
            .populate('student', 'name email profilePicture')
            .populate('internship', 'positionTitle company location duration workEnvironment description stipend domain')
            .populate('employer', 'companyName profilePicture email phone website location verificationStatus');

        if (!application) {
            return res.status(404).json({ success: false, message: 'Application not found' });
        }

        // Fetch the corresponding Match record for the latest Match Intelligence
        const student = await Student.findOne({ userId: application.student?._id || application.student });
        if (student) {
            const latestMatch = await Match.findOne({ 
                student: student._id, 
                internship: application.internship?._id || application.internship 
            }).lean();
            
            if (latestMatch) {
                application.matchAnalysis = {
                    tier: latestMatch.tier,
                    score: latestMatch.normalizedScore,
                    explanation: latestMatch.explanations
                };
                application.matchScore = latestMatch.normalizedScore;
            }
        }

        // Auth check: Is current user the student or the employer?
        const isStudent = application.student._id.toString() === req.user.id;
        const isEmployer = application.employer._id.toString() === req.user.id;
        
        if (!isStudent && !isEmployer && req.user.role !== 'admin') {
            return res.status(401).json({ success: false, message: 'Not authorized to view this application' });
        }

        res.status(200).json({
            success: true,
            data: application
        });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

// @desc    Update application status
// @route   PATCH /api/applications/:id/status
// @access  Private (Employer)
exports.updateApplicationStatus = async (req, res) => {
    try {
        const { status, comment } = req.body;
        const application = await Application.findById(req.params.id);

        if (!application) {
            return res.status(404).json({ success: false, message: 'Application not found' });
        }

        // Auth check
        if (application.employer.toString() !== req.user.id && req.user.role !== 'admin') {
            return res.status(401).json({ success: false, message: 'Unauthorized' });
        }

        // 1. Define the valid sequence
        const statusOrder = ['Applied', 'Reviewing', 'Shortlisted', 'Interviewing', 'Offered', 'Accepted'];
        const currentStatus = application.status;

        // Allow interview detail edits while staying in Interviewing state.
        const isInterviewDetailsEdit =
            status === 'Interviewing' &&
            currentStatus === 'Interviewing' &&
            !!req.body.interviewDetails;
        
        // Normalize for case-insensitivity if needed, but here we use TitleCase as per enum
        const currentIndex = statusOrder.indexOf(currentStatus);
        const targetIndex = statusOrder.indexOf(status);

        // 2. Validate Transition
        if (status === 'Rejected') {
            if (currentStatus === 'Accepted' || currentStatus === 'Rejected') {
                return res.status(400).json({ success: false, message: 'Protocol is already in a terminal state.' });
            }
        } else if (targetIndex === -1) {
            // Probably 'Withdrawn' or something else not in the main flow
            return res.status(400).json({ success: false, message: 'Invalid target status.' });
        } else if (!isInterviewDetailsEdit && targetIndex !== currentIndex + 1) {
            const nextValid = statusOrder[currentIndex + 1] || 'None';
            return res.status(400).json({ 
                success: false, 
                message: `Protocol synchronization failed: Invalid status transition from ${currentStatus} to ${status}. Next valid status in the sequence is: ${nextValid}.` 
            });
        }

        application.status = status;
        if (status === 'Interviewing' && req.body.interviewDetails) {
            const { date } = req.body.interviewDetails;
            const interviewDate = new Date(date);
            const today = new Date();
            today.setHours(0, 0, 0, 0);

            if (interviewDate < today) {
                return res.status(400).json({ success: false, message: 'Interview date cannot be in the past.' });
            }
            application.interviewDetails = req.body.interviewDetails;
        }

        application.statusHistory.push({
            status,
            comment: comment || (isInterviewDetailsEdit ? 'Interview details were updated by employer.' : `Candidate moved to ${status} phase.`),
            updatedAt: Date.now()
        });
        
        await application.save();

        // Notify Student
        try {
            await application.populate('internship', 'positionTitle');
            const type = status === 'Interviewing' ? 'INTERVIEW_SCHEDULED' : 'APPLICATION_STATUS';
            const metadata = status === 'Interviewing' && application.interviewDetails ? {
                date: new Date(application.interviewDetails.date).toLocaleDateString(),
                time: application.interviewDetails.time,
                location: application.interviewDetails.location
            } : null;

            await sendNotification({
                userId: application.student,
                type,
                message: isInterviewDetailsEdit
                    ? `Interview details for ${application.internship.positionTitle} were updated.`
                    : `Your application status for ${application.internship.positionTitle} has been updated to: ${status}.`,
                link: `/applications/${application._id}`,
                metadata
            });
        } catch (err) { logger.error('Notification failed', err); }

        res.status(200).json({
            success: true,
            data: application
        });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

// @desc    Withdraw application
// @route   DELETE /api/applications/:id/withdraw
// @access  Private (Student)
exports.withdrawApplication = async (req, res) => {
    try {
        const application = await Application.findById(req.params.id);

        if (!application) {
            return res.status(404).json({ success: false, message: 'Application not found' });
        }

        if (application.student.toString() !== req.user.id) {
            return res.status(401).json({ success: false, message: 'Unauthorized' });
        }

        application.status = 'Withdrawn';
        application.statusHistory.push({
            status: 'Withdrawn',
            comment: 'Application withdrawn by candidate',
            updatedAt: Date.now()
        });

        await application.save();

        res.status(200).json({
            success: true,
            message: 'Application successfully withdrawn'
        });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};
// @desc    Get student dashboard stats
// @route   GET /api/applications/student/stats
// @access  Private (Student)
exports.getStudentStats = async (req, res) => {
    try {
        const allApplications = await Application.find({ student: req.user.id }).populate('internship');
        const validApplications = allApplications.filter(app => app.internship);
        const applicationsCount = validApplications.length;
        
        const Student = require('../models/Student');
        const student = await Student.findOne({ userId: req.user.id });
        
        // Skill matches = count of skills in profile
        let skillMatches = student?.skills?.length || 0;
        
        // Dynamic verification points calculation
        let verificationPoints = 0;
        if (student) {
            verificationPoints = (student.skills?.length || 0) * 10;
            if (student.resume?.filePath) verificationPoints += 50;
            if (student.portfolio?.github || student.portfolio?.linkedin || student.portfolio?.website) verificationPoints += 25;
            if (student.education?.length > 0) verificationPoints += 25;
            if (student.profileCompletion?.overall > 80) verificationPoints += 50;
        }

        res.status(200).json({
            success: true,
            data: {
                applicationsCount,
                skillMatches,
                verificationPoints
            }
        });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

// @desc    Get all applications for a student
// @route   GET /api/applications/student
// @access  Private (Student)
exports.getStudentApplications = async (req, res) => {
    try {
        let applications = await Application.find({ 
            student: req.user.id,
            status: { $ne: 'Rejected' } 
        })
            .populate('employer', 'companyName profilePicture')
            .populate('internship', 'positionTitle company location')
            .sort({ lastMessageAt: -1 });

        // Filter out applications for non-existent internships
        applications = applications.filter(app => app.internship);

        // Synchronization Protocol: Ensure student dashboard shows latest Match Intelligence
        const student = await Student.findOne({ userId: req.user.id });
        let syncedApplications = applications;
        
        if (student) {
            const matches = await Match.find({ student: student._id }).lean();
            const matchMap = new Map(matches.map(m => [m.internship.toString(), m]));
            
            syncedApplications = applications.map(app => {
                const appObj = app.toObject();
                const internshipId = (app.internship?._id || app.internship).toString();
                const match = matchMap.get(internshipId);
                
                if (match) {
                    appObj.matchScore = match.normalizedScore;
                    appObj.matchAnalysis = {
                        tier: match.tier,
                        score: match.normalizedScore,
                        explanation: match.explanations
                    };
                }
                return appObj;
            });
        }

        res.status(200).json({
            success: true,
            count: syncedApplications.length,
            data: syncedApplications
        });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

// @desc    Check application status and return ID if exists
// @route   GET /api/applications/check/:internshipId
// @access  Private (Student)
exports.checkApplicationStatus = async (req, res) => {
    try {
        const application = await Application.findOne({ 
            student: req.user.id, 
            internship: req.params.internshipId
        });

        res.status(200).json({
            success: true,
            applied: !!application && application.status !== 'Withdrawn',
            applicationId: application?._id || null,
            applicationStatus: application?.status || null
        });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

// @desc    Toggle application pin status
// @route   PATCH /api/applications/:id/pin
// @access  Private (Employer)
exports.togglePinApplication = async (req, res) => {
    try {
        const application = await Application.findById(req.params.id);

        if (!application) {
            return res.status(404).json({ success: false, message: 'Application not found' });
        }

        // Auth check
        if (application.employer.toString() !== req.user.id && req.user.role !== 'admin') {
            return res.status(401).json({ success: false, message: 'Unauthorized' });
        }

        application.isPinnedByEmployer = !application.isPinnedByEmployer;
        await application.save();

        res.status(200).json({
            success: true,
            isPinned: application.isPinnedByEmployer,
            message: application.isPinnedByEmployer ? 'Application pinned' : 'Application unpinned'
        });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};
