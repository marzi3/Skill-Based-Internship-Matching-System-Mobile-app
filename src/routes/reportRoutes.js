const express = require('express');
const router = express.Router();
const { createReport, getMyReports, blockUser, unblockUser } = require('../controllers/reportController');
const { protect } = require('../middleware/auth');

router.use(protect);

router.post('/', createReport);
router.get('/my-reports', getMyReports);
router.patch('/block/:id', blockUser);
router.patch('/unblock/:id', unblockUser);

module.exports = router;
