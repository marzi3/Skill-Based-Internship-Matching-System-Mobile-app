const express = require('express');
const router = express.Router();
const {
  getDashboardStats,
  getEmployers,
  updateEmployerStatus,
  getReports,
  exportReports,
  getAuditLogs,
  deleteListing,
  getModerationItems,
  resolveReport,
  getStudents,
  updateStudentStatus,
  deleteUser
} = require('../controllers/adminController');
const { protect, authorize } = require('../middleware/auth');

// Apply middleware to all routes in this file
router.use(protect);
router.use(authorize('admin'));

router.get('/dashboard', getDashboardStats);
router.get('/employers', getEmployers);
router.patch('/employers/:id/status', updateEmployerStatus);
router.get('/reports', getReports);
router.get('/reports/export', exportReports);
router.get('/audit-logs', getAuditLogs);
router.delete('/listings/:id', deleteListing);

// User & Student Management
router.get('/students', getStudents);
router.patch('/students/:id/status', updateStudentStatus);
router.delete('/users/:id', deleteUser);

// Moderation
router.get('/moderation', getModerationItems);
router.patch('/moderation/reports/:id', resolveReport);

module.exports = router;
