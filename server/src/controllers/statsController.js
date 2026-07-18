const db = require('../config/database');
const crypto = require('crypto');

// Get Campaign Stats
const getStats = async (req, res, next) => {
  try {
    // 1. Supporters count (database users)
    const [userCountResult] = await db.query('SELECT COUNT(*) as count FROM users');
    const supportersCount = userCountResult[0].count;

    // 2. Vlogs count
    const [vlogCountResult] = await db.query("SELECT COUNT(*) as count FROM posts WHERE type = 'vlog' AND status = 'published'");
    const vlogsCount = vlogCountResult[0].count;

    // 3. Blogs count
    const [blogCountResult] = await db.query("SELECT COUNT(*) as count FROM posts WHERE type = 'blog' AND status = 'published'");
    const blogsCount = blogCountResult[0].count;

    // 4. Cities count
    const [cityCountResult] = await db.query("SELECT COUNT(DISTINCT city) as count FROM users WHERE city IS NOT NULL");
    const citiesCount = cityCountResult[0].count || 0;

    // 5. Today's growth
    const [growthResult] = await db.query('SELECT COUNT(*) as count FROM users WHERE created_at >= NOW() - INTERVAL 1 DAY');
    const growthCount = growthResult[0].count;

    // 6. Active community members
    const [memberCountResult] = await db.query("SELECT COUNT(*) as count FROM community_members WHERE status = 'joined'");
    const membersCount = memberCountResult[0].count;

    res.json({
      success: true,
      stats: {
        supporters: supportersCount,
        vlogs: vlogsCount,
        blogs: blogsCount,
        cities: citiesCount,
        today_growth: growthCount,
        members: membersCount
      }
    });
  } catch (error) {
    next(error);
  }
};

// Pledge Support
const supportNow = async (req, res, next) => {
  try {
    const userId = req.user.id;

    // Check if user already pledged support
    const [existing] = await db.query(
      "SELECT id FROM points_transactions WHERE user_id = ? AND action_type = 'pledge_support'",
      [userId]
    );

    if (existing.length > 0) {
      return res.status(400).json({ success: false, error: 'You have already pledged support!' });
    }

    // Insert support transaction
    const transactionId = crypto.randomUUID();
    await db.query(
      'INSERT INTO points_transactions (id, user_id, action_type, points) VALUES (?, ?, ?, ?)',
      [transactionId, userId, 'pledge_support', 50]
    );

    // Update user points
    await db.query('UPDATE users SET points = points + 50 WHERE id = ?', [userId]);

    // Check if user rank tier should be upgraded
    const [userData] = await db.query('SELECT points, rank_tier FROM users WHERE id = ?', [userId]);
    const currentPoints = userData[0].points;
    let rankTier = userData[0].rank_tier;

    if (currentPoints >= 5000) rankTier = 'Platinum';
    else if (currentPoints >= 2500) rankTier = 'Gold';
    else if (currentPoints >= 1000) rankTier = 'Silver';

    if (rankTier !== userData[0].rank_tier) {
      await db.query('UPDATE users SET rank_tier = ? WHERE id = ?', [rankTier, userId]);
    }

    res.json({
      success: true,
      message: 'Thank you for your support pledge!',
      points_earned: 50,
      new_points: currentPoints,
      new_rank: rankTier
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getStats,
  supportNow
};
