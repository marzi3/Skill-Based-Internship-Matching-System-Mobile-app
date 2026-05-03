const express = require('express');
const router = express.Router();
const { getNotifications, markAsRead, deleteNotification, markAllRead, deleteAllNotifications, getUnreadNotificationCount } = require('../controllers/notificationController');
const { protect } = require('../middleware/auth');

router.use(protect);

router.route('/')
  .get(getNotifications);

router.route('/unread-count')
  .get(getUnreadNotificationCount);

router.route('/mark-all-read')
  .patch(markAllRead);

router.route('/delete-all')
  .delete(deleteAllNotifications);

router.route('/:id/read')
  .patch(markAsRead);

router.route('/:id')
  .delete(deleteNotification);

module.exports = router;
