const express = require('express');
const router = express.Router();
const {
  getProfile,
  initializeProfile,
  savePersonalInfo,
  saveEducation,
  updateEducation,
  saveSchool,
  updateSchool,
  removeSchool,
  addSkill,
  removeSkill,
  saveProject,
  updateProject,
  removeProject,
  getSkills,
  getEducation,
  removeEducation,
  updatePortfolio,
  getProfileCompletion,
  uploadProfileImage,
  uploadCoverImage,
  addCertification,
  updateCertification,
  removeCertification,
  uploadCertificateFile,
  removeUploadedCertificate,
  uploadResume,
  deleteResume,
  resetProfile,
} = require('../controllers/studentController');
const { protect, authorize } = require('../middleware/auth');
const { validateStudentProfile } = require('../middleware/validators');
const upload = require('../config/multer');

// Protect all routes with authentication
router.use(protect);

// Profile routes
router.get('/profile', getProfile);
router.post('/profile/init', initializeProfile);
router.get('/profile/completion', getProfileCompletion);

// Personal information routes
router.post('/profile/personal', validateStudentProfile, savePersonalInfo);
router.post('/profile/image', upload.single('profileImage'), uploadProfileImage);
router.post('/profile/cover', upload.single('coverImage'), uploadCoverImage);

// Education routes
router.get('/profile/education', getEducation);
router.post('/profile/education', saveEducation);
router.put('/profile/education/:educationId', updateEducation);
router.delete('/profile/education/:educationId', removeEducation);

// School routes
router.post('/profile/school', saveSchool);
router.put('/profile/school/:schoolId', updateSchool);
router.delete('/profile/school/:schoolId', removeSchool);

// Skills routes
router.get('/profile/skills', getSkills);
router.post('/profile/skill', addSkill);
router.delete('/profile/skill/:skillId', removeSkill);

// Projects routes
router.post('/profile/project', upload.array('projectImages', 10), saveProject);
router.put('/profile/project/:projectId', upload.array('projectImages', 10), updateProject);
router.delete('/profile/project/:projectId', removeProject);

// Portfolio routes
router.post('/profile/portfolio', updatePortfolio);

// Certification routes
router.post('/profile/certification', addCertification);
router.put('/profile/certification/:certificationId', updateCertification);
router.delete('/profile/certification/:certificationId', removeCertification);
router.post('/profile/certificate-file', upload.single('certificateFile'), uploadCertificateFile);
router.delete('/profile/certificate-file/:fileId', removeUploadedCertificate);

// Resume routes
router.post('/profile/resume', upload.single('resume'), uploadResume);
router.delete('/profile/resume', deleteResume);

// Reset profile route
router.delete('/profile/reset', resetProfile);

// Additional controller imports
const {
  getSavedInternships,
  bookmarkInternship,
  unbookmarkInternship
} = require('../controllers/studentController');

// Bookmark routes
router.get('/bookmarks', getSavedInternships);
router.post('/bookmarks/:id', bookmarkInternship);
router.delete('/bookmarks/:id', unbookmarkInternship);

module.exports = router;
