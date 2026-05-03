const express = require('express');
const router = express.Router();
const { getEmployerMatchStats, getStudentApplicationStats } = require('../controllers/analyticsController');
const { protect, authorize } = require('../middleware/auth');

router.get('/employer/matches', protect, authorize('employer', 'admin'), getEmployerMatchStats);
router.get('/student/applications', protect, authorize('student', 'admin'), getStudentApplicationStats);

module.exports = router;
