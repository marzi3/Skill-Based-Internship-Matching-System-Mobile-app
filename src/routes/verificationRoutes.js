const express = require('express');
const router = express.Router();
const upload = require('../config/multer');
const { protect, authorize } = require('../middleware/auth');
const {
    submitStudentVerification,
    submitEmployerVerification,
    getPendingVerifications,
    approveVerification,
    rejectVerification
} = require('../controllers/verificationController');

// Student Verification (Protected + Upload)
router.post('/student', protect, upload.single('studentIdImage'), submitStudentVerification);

// Employer Verification (Protected + Upload)
router.post('/employer', protect, upload.single('businessDocument'), submitEmployerVerification);

// Admin Routes (Get Pending, Approve, Reject)
router.get('/pending', protect, authorize('admin'), getPendingVerifications);
router.put('/:id/approve', protect, authorize('admin'), approveVerification);
router.put('/:id/reject', protect, authorize('admin'), rejectVerification);

module.exports = router;
