const express = require('express');
const router = express.Router();

const authRoutes = require('./authRoutes');
const studentRoutes = require('./studentRoutes');
const internshipRoutes = require('./internshipRoutes');
const applicationRoutes = require('./applicationRoutes');
const matchingRoutes = require('./matchingRoutes');
const messageRoutes = require('./messageRoutes');
const notificationRoutes = require('./notificationRoutes');
const searchRoutes = require('./searchRoutes');
const adminRoutes = require('./adminRoutes');
const verificationRoutes = require('./verificationRoutes');
const settingsRoutes = require('./settingsRoutes');
const analyticsRoutes = require('./analyticsRoutes');

const reportRoutes = require('./reportRoutes');

// Route registration
router.use('/auth', authRoutes);
router.use('/verification', verificationRoutes);
router.use('/reports', reportRoutes); // Add this
router.use('/students', studentRoutes);
router.use('/internships', internshipRoutes);
router.use('/applications', applicationRoutes);
router.use('/matching', matchingRoutes);
router.use('/messages', messageRoutes);
router.use('/notifications', notificationRoutes);
router.use('/search', searchRoutes);
router.use('/admin', adminRoutes);
router.use('/settings', settingsRoutes);
router.use('/analytics', analyticsRoutes);


module.exports = router;
