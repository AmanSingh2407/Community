const express = require('express');
const { getLeaderboard, getBadges, getUserBadges, addPoints } = require('../controllers/rewardController');
const { verifyToken } = require('../middleware/authMiddleware');

const router = express.Router();

router.get('/leaderboard', verifyToken, getLeaderboard);
router.get('/badges', verifyToken, getBadges);
router.get('/user/:userId', verifyToken, getUserBadges);
router.post('/add-points', verifyToken, addPoints);

module.exports = router;
