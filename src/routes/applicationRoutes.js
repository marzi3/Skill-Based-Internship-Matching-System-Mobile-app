const express = require('express');
const router = express.Router();
const { protect, authorize } = require('../middleware/auth');
const {
    applyToInternship,
    getEmployerApplications,
    updateApplicationStatus,
    getStudentStats,
    getStudentApplications,
    getApplicationDetails,
    withdrawApplication,
    checkApplicationStatus
} = require('../controllers/applicationController');

// All application routes are protected
router.use(protect);

// Student routes
router.get('/student', authorize('student'), getStudentApplications);
router.get('/student/stats', authorize('student'), getStudentStats);
router.get('/check/:internshipId', authorize('student'), checkApplicationStatus);
router.post('/apply/:id', authorize('student'), applyToInternship);
router.delete('/:id/withdraw', authorize('student'), withdrawApplication);

// Employer routes
router.get('/employer', authorize('employer', 'admin'), getEmployerApplications);
router.patch('/:id/status', authorize('employer', 'admin'), updateApplicationStatus);
router.patch('/:id/pin', authorize('employer', 'admin'), require('../controllers/applicationController').togglePinApplication);

// Shared routes (placed at bottom to prevent shadowing)
router.get('/:id', getApplicationDetails);

module.exports = router;
