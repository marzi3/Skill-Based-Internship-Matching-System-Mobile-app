const express = require('express');
const router = express.Router();
const { validateRegister, validateLogin } = require('../middleware/validators');
const { authLimiter } = require('../middleware/rateLimiter');
const passport = require('passport');
const {
  registerUser,
  loginUser,
  logoutUser,
  getMe,
  googleAuthCallback,
  linkedinAuthCallback,
  forgotPassword,
  resetPassword,
  verifyEmail,
  resendVerificationEmail,
  updateProfile,
  updatePassword,
  getStudents,
  getEmployerPublicProfile,
  getStudentPublicProfile
} = require('../controllers/authController');
const { protect, authorize } = require('../middleware/auth');
const upload = require('../config/multer');

// Standard Auth
router.post('/register', authLimiter, validateRegister, registerUser);
router.post('/login', authLimiter, validateLogin, loginUser);
router.post('/logout', logoutUser);
router.get('/me', protect, getMe);
router.put('/profile', protect, upload.fields([
  { name: 'profilePicture', maxCount: 1 },
  { name: 'coverImage', maxCount: 1 }
]), updateProfile);
router.put('/password', protect, updatePassword);
router.get('/students', protect, authorize('employer', 'admin'), getStudents);
router.get('/students/:id', getStudentPublicProfile);
router.get('/employers/:id', getEmployerPublicProfile);
router.get('/verifyemail/:token', verifyEmail);
router.post('/resend-verification', protect, authLimiter, resendVerificationEmail);
router.post('/forgotpassword', authLimiter, forgotPassword);
router.put('/resetpassword/:resettoken', authLimiter, resetPassword);

// Google OAuth
router.get('/google', (req, res, next) => {
  const { role } = req.query;
  const state = role || 'student';
  passport.authenticate('google', { scope: ['profile', 'email'], state })(req, res, next);
});
router.get('/google/callback',
  passport.authenticate('google', { failureRedirect: '/login' }),
  googleAuthCallback
);

// LinkedIn OAuth
router.get('/linkedin', (req, res, next) => {
  const { role } = req.query;
  const state = role || 'student';
  passport.authenticate('linkedin', { state })(req, res, next);
});
router.get('/linkedin/callback',
  passport.authenticate('linkedin', { failureRedirect: '/login' }),
  linkedinAuthCallback
);

module.exports = router;
