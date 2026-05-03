const express = require('express');
const router = express.Router();


//new added -1


const { protect, authorize } = require('../middleware/auth');



const matchingController = require('../controllers/matchingController');

//new added -2




// Get best matches for authenticated student
router.get('/best-matches', protect, authorize('student'), matchingController.getBestMatches);



// Match internships for a specific student
router.post('/internships', protect, matchingController.matchInternshipsForStudent);

// Match students for a specific internship
router.post('/students', protect, authorize('employer', 'admin'), matchingController.matchStudentsForInternship);

// Get detailed explanation of a match score
router.get('/explain/:studentId/:internshipId', protect, matchingController.explainMatch);

module.exports = router;
