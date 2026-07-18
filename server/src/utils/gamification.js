const db = require('../config/database');
const crypto = require('crypto');

/**
 * Calculates rank tier based on points
 * points < 500: Supporter
 * points >= 500: Bronze
 * points >= 1000: Silver
 * points >= 1500: Gold
 * points >= 2000: Diamond
 */
const getRankTier = (points) => {
  if (points >= 2000) return 'Diamond';
  if (points >= 1500) return 'Gold';
  if (points >= 1000) return 'Silver';
  if (points >= 500) return 'Bronze';
  return 'Supporter';
};

/**
 * Updates a user's points, logs the transaction, and recalculates their rank tier.
 */
const updateUserPointsAndRank = async (userId, pointsDelta, actionType) => {
  if (pointsDelta !== 0) {
    const transactionId = crypto.randomUUID();
    await db.query(
      'INSERT INTO points_transactions (id, user_id, action_type, points) VALUES (?, ?, ?, ?)',
      [transactionId, userId, actionType, pointsDelta]
    );
    await db.query('UPDATE users SET points = points + ? WHERE id = ?', [pointsDelta, userId]);
  }

  // Fetch current points and rank
  const [rows] = await db.query('SELECT points, rank_tier FROM users WHERE id = ?', [userId]);
  if (rows.length === 0) return null;

  const currentPoints = rows[0].points;
  const expectedRank = getRankTier(currentPoints);

  if (expectedRank !== rows[0].rank_tier) {
    await db.query('UPDATE users SET rank_tier = ? WHERE id = ?', [expectedRank, userId]);
  }

  return {
    points: currentPoints,
    rank_tier: expectedRank
  };
};

module.exports = {
  getRankTier,
  updateUserPointsAndRank
};
