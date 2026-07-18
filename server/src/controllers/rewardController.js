const db = require('../config/database');
const { updateUserPointsAndRank } = require('../utils/gamification');

// Get Leaderboard rankings
const getLeaderboard = async (req, res, next) => {
  try {
    const { city, limit = 15 } = req.query;

    let query = `
      SELECT id, name, avatar_url, city, points, rank_tier 
      FROM users 
    `;
    const params = [];

    if (city) {
      query += ' WHERE city = ?';
      params.push(city);
    }

    query += ' ORDER BY points DESC LIMIT ?';
    params.push(parseInt(limit));

    const [leaderboard] = await db.query(query, params);

    res.json({
      success: true,
      leaderboard
    });
  } catch (error) {
    next(error);
  }
};

// Get list of all available badges
const getBadges = async (req, res, next) => {
  try {
    const [allBadges] = await db.query('SELECT * FROM badges');
    
    res.json({
      success: true,
      badges: allBadges
    });
  } catch (error) {
    next(error);
  }
};

// Get badges earned by specific user
const getUserBadges = async (req, res, next) => {
  try {
    const userId = req.params.userId;

    const [earned] = await db.query(
      `SELECT ub.earned_at, b.name, b.icon_url, b.criteria 
       FROM user_badges ub
       JOIN badges b ON ub.badge_id = b.id
       WHERE ub.user_id = ?
       ORDER BY ub.earned_at DESC`,
      [userId]
    );

    res.json({
      success: true,
      badges: earned
    });
  } catch (error) {
    next(error);
  }
};

// Award custom points transaction
const addPoints = async (req, res, next) => {
  try {
    const userId = req.user.id;
    const { action_type, points } = req.body;

    if (!points || !action_type) {
      return res.status(400).json({ success: false, error: 'action_type and points are required' });
    }

    const result = await updateUserPointsAndRank(userId, points, action_type);

    res.json({
      success: true,
      new_points: result ? result.points : points,
      new_rank: result ? result.rank_tier : 'Bronze'
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getLeaderboard,
  getBadges,
  getUserBadges,
  addPoints
};
