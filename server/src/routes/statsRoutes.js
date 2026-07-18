const express = require('express');
const router = express.Router();
const { getStats, supportNow } = require('../controllers/statsController');
const { verifyToken } = require('../middleware/authMiddleware');

// Get Stats (public)
router.get('/', getStats);

// Pledge Support (authenticated)
router.post('/support', verifyToken, supportNow);

module.exports = router;
