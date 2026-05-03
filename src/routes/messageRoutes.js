const express = require('express');
const router = express.Router();
const { getMessagesByApplication, sendMessage, markMessageAsRead, markThreadAsRead, getUnreadMessageCount } = require('../controllers/messageController');
const { protect } = require('../middleware/auth');

router.use(protect);

router.route('/')
  .post(sendMessage);

router.route('/unread-count')
  .get(getUnreadMessageCount);

router.route('/:applicationId')
  .get(getMessagesByApplication);

router.route('/:applicationId/read-all')
  .patch(markThreadAsRead);

router.route('/:id/read')
  .patch(markMessageAsRead);

module.exports = router;
