const mongoose = require('mongoose');
const logger = require('../utils/logger');
const Student = require('../models/Student');
const Internship = require('../models/Internship');
const User = require('../models/User');
const Match = require('../models/Match');
const Notification = require('../models/Notification');
const MatchingEngine = require('../services/matchingEngine');
const notificationService = require('../services/notificationService');



//new added -1


/**
 * Get best matches for authenticated student
 * @route GET /api/matching/best-matches
 * @access Private (Student)
 */
exports.getBestMatches = async (req, res) => {
    try {
        // Get the student profile for the authenticated user
        const student = await Student.findOne({ userId: req.user.id })
            .populate('userId', 'name email')
            .lean();

        if (!student) {
            logger.info(`[Matching Controller] getBestMatches: No student profile for user ${req.user.id}. Returning empty matches.`);
            return res.status(200).json({
                success: true,
                data: [],
                message: 'Please complete your student profile to see personalized matches.'
            });
        }

        // Get active internships
        const internships = await Internship.find({
            status: { $in: ['Hiring', 'Active'] },
            expiryDate: { $gte: new Date() },
            isDeleted: { $ne: true }
        }).populate('employer', 'companyName profilePicture').lean();

        if (!internships.length) {
            return res.status(200).json({
                success: true,
                data: [],
                message: 'No active internships available'
            });
        }

        // Use matching engine to get matches
        let matches = MatchingEngine.matchInternshipsForStudent(student, internships);

        // Filter out disqualified matches and get top matches
        matches = matches
            .filter(m => m.tier !== 'DISQUALIFIED')
            .slice(0, 10); // Limit to top 10 matches

        const formattedMatches = matches.map(match => {
            const fullInternship = internships.find(int => {
                const searchId = match.internshipId?.toString();
                return (int._id && int._id.toString() === searchId) ||
                    (int.id && int.id.toString() === searchId);
            });

            const tier = match.tier;
            let summary = '';
            if (tier === 'EXCELLENT') summary = "This is a world-class match! Your expertise in modern stacks perfectly aligns with the required protocol. You are a top-tier candidate for this synchronization.";
            else if (tier === 'GOOD') summary = "Strong compatibility detected. You possess the core competencies required, though some specialized skill gaps were identified. Optimizing your profile could elevate this match to Excellent.";
            else if (tier === 'FAIR' || tier === 'WEAK') summary = "Partial alignment achieved. While you meet some baseline requirements, significant skill gaps remain. Consider acquiring the missing skills listed below to improve your standing.";
            else if (tier === 'DISQUALIFIED') summary = "Match Protocol Terminated. Critical mandatory requirements are not met. Please review the missing mandatory specifications below.";
            else summary = "Profile meets baseline internship requirements. Enhance your profile with specific skills to unlock detailed compatibility metrics.";

            return {
                internship: fullInternship || {
                    _id: match.internshipId,
                    positionTitle: match.internshipTitle,
                    company: match.internshipCompany
                },
                score: match.normalizedScore || (match.tier === 'EXCELLENT' ? 90 :
                    match.tier === 'GOOD' ? 75 :
                        match.tier === 'FAIR' ? 60 : 45),
                rawScore: match.rawScore,
                tier: match.tier,
                summary,
                reasons: match.explanation?.map(e => e.detail) || [],
                explanationData: match.explanation || []
            };
        });

        // Cache the formatted matches to the DB using bulkWrite
        if (formattedMatches.length > 0) {
            // Fetch existing matches to preserve status (e.g. if already 'Applied')
            const existingMatches = await Match.find({ student: student._id }).lean();
            const existingStatusMap = new Map();
            existingMatches.forEach(m => existingStatusMap.set(m.internship.toString(), m.status));

            const bulkOps = formattedMatches.map(matchObj => {
                const internshipId = matchObj.internship._id.toString();
                const existingStatus = existingStatusMap.get(internshipId);
                const statusToSet = (existingStatus && existingStatus !== 'Pending') ? existingStatus : 'Pending';

                return {
                    updateOne: {
                        filter: { student: student._id, internship: matchObj.internship._id },
                        update: {
                            $set: {
                                student: student._id,
                                internship: matchObj.internship._id,
                                employer: matchObj.internship.employer,
                                rawScore: matchObj.rawScore,
                                normalizedScore: matchObj.score,
                                tier: matchObj.tier,
                                explanations: matchObj.explanationData,
                                status: statusToSet
                            }
                        },
                        upsert: true
                    }
                };
            });

            // Execute the bulk write asynchronously
            Match.bulkWrite(bulkOps).catch(err => {
                logger.error('[Matching Controller] Failed to cache matches in DB:', err);
            });

            // Send notification for new 60%+ matches (fire-and-forget, de-duplicated via Notification collection)
            (async () => {
                try {
                    const highScoreMatches = formattedMatches.filter(m => m.score >= 60);
                    if (highScoreMatches.length > 0 && student.userId) {
                        // Bulk-check which internships already have a NEW_MATCH notification sent to this user
                        const internshipLinks = highScoreMatches.map(m => `/internships/${m.internship._id?.toString()}`);
                        const alreadySent = await Notification.find({
                            userId: student.userId,
                            type: 'NEW_MATCH',
                            link: { $in: internshipLinks }
                        }).distinct('link');

                        const alreadySentSet = new Set(alreadySent);

                        for (const match of highScoreMatches) {
                            const internshipId = match.internship._id?.toString();
                            const link = `/internships/${internshipId}`;
                            if (!alreadySentSet.has(link)) {
                                try {
                                    await notificationService.send({
                                        userId: student.userId,
                                        type: 'NEW_MATCH',
                                        message: `You have a ${Math.round(match.score)}% match with "${match.internship.positionTitle}"! Check it out now.`,
                                        link,
                                        sendEmail: true
                                    });
                                } catch (innerErr) {
                                    // Ignore duplicate key errors from unique index
                                    if (innerErr.code !== 11000) {
                                        logger.error(`[Matching Controller] Failed to send notification for ${internshipId}:`, innerErr);
                                    }
                                }
                            }
                        }
                    }
                } catch (err) {
                    logger.error('[Matching Controller] Failed to send match notifications:', err);
                }
            })();
            
            // Add status to formattedMatches for frontend
            formattedMatches.forEach(m => {
                const existingStatus = existingStatusMap.get(m.internship._id.toString());
                m.status = (existingStatus && existingStatus !== 'Pending') ? existingStatus : 'Pending';
            });
        }

        return res.status(200).json({
            success: true,
            data: formattedMatches.map(({ rawScore, ...rest }) => rest), // Only strip raw score now, keeping explanationData
            totalMatches: formattedMatches.length
        });

    } catch (error) {
        logger.error('Error getting best matches:', error);
        return res.status(500).json({
            success: false,
            message: 'Server error while fetching matches',
            error: error.message
        });
    }
};






/**
 * Executes a batch matching of a single student against all active internships.
 */
exports.matchInternshipsForStudent = async (req, res) => {
    try {
        const { studentId, limit, tier } = req.body;

        if (!studentId) {
            return res.status(400).json({ success: false, message: 'Student ID is required' });
        }

        // 1. Load the student profile - handle both StudentID and UserID for robust API calls
        const student = await Student.findOne({
            $or: [
                { _id: mongoose.isValidObjectId(studentId) ? studentId : null },
                { userId: mongoose.isValidObjectId(studentId) ? studentId : null }
            ].filter(q => q[Object.keys(q)[0]] !== null)
        }).lean();

        if (!student) {
            return res.status(404).json({ success: false, message: 'Student profile not found' });
        }

        // 2. Load internships (we could filter active only depending on schema, e.g., status: 'OPEN')


        //new added -2


        const internships = await Internship.find({
            status: { $in: ['active', 'Hiring'] },
            isDeleted: { $ne: true }
        }).lean();

        // 3. Inference Engine invocation
        let matches = MatchingEngine.matchInternshipsForStudent(student, internships);

        // 4. Post-processing filters and enrich with full internship data
        matches = matches.filter(m => m.tier !== 'DISQUALIFIED');

        if (tier) {
            matches = matches.filter(m => m.tier === tier.toUpperCase());
        }

        if (limit) {
            matches = matches.slice(0, Number(limit));
        }



        //new added -3



        // 5. Format response for frontend compatibility - enrich with full internship data
        const formattedMatches = matches.map(match => {
            // Find the full internship object
            const fullInternship = internships.find(int => {
                const searchId = match.internshipId?.toString();
                return (int._id && int._id.toString() === searchId) ||
                    (int.id && int.id.toString() === searchId);
            });

            return {
                internship: fullInternship || {
                    _id: match.internshipId,
                    positionTitle: match.internshipTitle,
                    company: match.internshipCompany
                },
                score: match.normalizedScore || (match.tier === 'EXCELLENT' ? 90 :
                    match.tier === 'GOOD' ? 75 :
                        match.tier === 'FAIR' ? 60 : 45),
                tier: match.tier,
                reasons: match.explanation?.map(e => e.detail) || []
            };
        });

        return res.status(200).json({
            success: true,
            studentId: student._id,
            matches: formattedMatches
        });

    } catch (error) {
        logger.error('Error matching internships', error);
        return res.status(500).json({
            success: false,
            message: 'Failed to process match',
            error: error.message
        });
    }
};

/**
 * Executes a batch matching of all students against a single internship (Candidate search).
 */
exports.matchStudentsForInternship = async (req, res) => {
    try {
        const { internshipId, limit } = req.body;

        if (!internshipId) {
            return res.status(400).json({ success: false, message: 'Internship ID is required' });
        }

        const internship = await Internship.findById(internshipId).lean();
        if (!internship) {
            return res.status(404).json({ success: false, message: 'Internship listing not found' });
        }

        // We only want students who have at least partially completed profiles or are looking.
        const students = await Student.find({}).populate('userId', 'profilePicture').lean();

        let candidates = MatchingEngine.matchStudentsForInternship(internship, students);

        // Filter out explicit disqualifications
        candidates = candidates.filter(c => c.tier !== 'DISQUALIFIED');

        // 5. Format response for frontend compatibility - enrich with full student data
        const formattedCandidates = candidates.map(candidate => {
            const fullStudent = students.find(stu => {
                const searchId = candidate.studentId?.toString();
                return (stu._id && stu._id.toString() === searchId) ||
                    (stu.id && stu.id.toString() === searchId);
            });

            // Extract matched skills from the explanation log (B1 rule)
            const matchedSkills = [];
            if (candidate.explanation) {
                candidate.explanation.forEach(exp => {
                    // Check if it's a B1 exact skill match or B3 partial match
                    if (exp.rule === 'B1_ExactSkillMatch' || exp.rule === 'B3_PartialSkillCoverage') {
                        // Extract skill name from detail string (e.g., "Student has essential skill: React")
                        const match = exp.detail.match(/skill:\s*([^.]+)/i) || exp.detail.match(/matched:\s*([^.]+)/i);
                        if (match && match[1]) {
                            matchedSkills.push(match[1].trim());
                        }
                    }
                });
            }

            return {
                studentId: candidate.studentId,
                studentName: fullStudent?.personalInfo?.fullName || fullStudent?.name || candidate.studentName || 'Unknown Student',
                fieldOfStudy: fullStudent?.education?.[0]?.field || 'Student',
                gpa: fullStudent?.personalInfo?.gpa || 'N/A',
                profilePicture: fullStudent?.userId?.profilePicture || fullStudent?.profileImage?.filePath || '',
                finalScore: candidate.normalizedScore || (candidate.tier === 'EXCELLENT' ? 90 :
                    candidate.tier === 'GOOD' ? 75 :
                        candidate.tier === 'FAIR' ? 60 : 45),
                tier: candidate.tier,
                matchedSkills: [...new Set(matchedSkills)], // Remove duplicates
                reasons: candidate.explanation?.map(e => e.detail) || []
            };
        });

        return res.status(200).json({
            success: true,
            internshipId: internship._id,
            candidates: formattedCandidates
        });

    } catch (error) {
        logger.error('Error generating candidate matches', error);
        return res.status(500).json({
            success: false,
            message: 'Failed to generate candidates',
            error: error.message
        });
    }
};

/**
 * Explains exactly why a match achieved its score.
 */
exports.explainMatch = async (req, res) => {
    try {
        const { studentId, internshipId } = req.params;

        if (!mongoose.isValidObjectId(studentId) || !mongoose.isValidObjectId(internshipId)) {
            return res.status(400).json({ success: false, message: 'Invalid ID format' });
        }

        const internship = await Internship.findById(internshipId).lean();
        if (!internship) {
            return res.status(404).json({ success: false, message: 'Internship listing not found' });
        }

        // Search for student by either its own _id or the linked userId
        const student = await Student.findOne({
            $or: [
                { _id: studentId },
                { userId: studentId }
            ]
        }).lean();

        if (!student) {
            // Log for debugging but don't hard 404 - return a "no profile" analysis
            logger.info(`[Matching Controller] explainMatch: No student profile for user ID ${studentId}. Returning 0 analysis.`);
            return res.status(200).json({
                success: true,
                analysis: {
                    normalizedScore: 0,
                    tier: 'INCOMPLETE PROFILE',
                    explanation: [{
                        category: 'Profile',
                        score: 0,
                        detail: 'Student profile not yet initialized. Please complete your profile to enable match analysis.'
                    }]
                }
            });
        }

        const analysis = MatchingEngine.explainMatch(student, internship);

        return res.status(200).json({
            success: true,
            analysis
        });

    } catch (error) {
        logger.error('Error generating match explanation', error);
        return res.status(500).json({
            success: false,
            message: 'Failed to explain match',
            error: error.message
        });
    }
};
