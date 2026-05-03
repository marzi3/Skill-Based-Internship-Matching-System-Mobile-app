const express = require('express');
const router = express.Router();
const { searchInternships } = require('../controllers/searchController');

// Search routes
router.get('/', searchInternships);

module.exports = router;
