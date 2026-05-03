const express = require('express');
const router = express.Router();
const {
  getInternships,
  getInternship,
  createInternship,
  updateInternship,
  deleteInternship,
  getMyInternships,
  getSkillDemands,
  updateInternshipStatus,
  getInternshipApplicants,
  getInternshipStats
} = require('../controllers/internshipController');
const { protect, authorize, verifyStatus } = require('../middleware/auth');
const { validateInternship } = require('../middleware/validators');
const mongoose = require('mongoose');

// Middleware to validate :id is a valid ObjectId (prevents catching named routes)
const validateObjectId = (req, res, next) => {
  if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
    return next('route'); // Skip to next matching route
  }
  next();
};

// Public routes
router.get('/', getInternships);
router.get('/:id', validateObjectId, getInternship); // Public: anyone can view

// Protected routes (Employer only)
router.use(protect);
router.use(authorize('employer', 'admin'));

router.get('/my-postings', getMyInternships);
router.get('/skill-demands', getSkillDemands);
router.post('/create', verifyStatus, validateInternship, createInternship);
router.get('/:id/applicants', getInternshipApplicants);
router.get('/:id/stats', getInternshipStats);
router.patch('/:id/status', updateInternshipStatus);
router.put('/:id', validateInternship, updateInternship);
router.delete('/:id', deleteInternship);

module.exports = router;

