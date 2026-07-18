const db = require('../config/database');

const getNotifications = async (req, res, next) => {
  try {
    const userId = req.user.id;

    // Fetch the 50 most recent notifications for this user, joining actor (author) info
    const [notifications] = await db.query(
      `SELECT n.*, u.name as actor_name, u.avatar_url as actor_avatar
       FROM notifications n
       LEFT JOIN users u ON n.actor_id = u.id
       WHERE n.user_id = ?
       ORDER BY n.created_at DESC
       LIMIT 50`,
      [userId]
    );

    res.json({
      success: true,
      notifications
    });
  } catch (error) {
    next(error);
  }
};

const markAllRead = async (req, res, next) => {
  try {
    const userId = req.user.id;

    await db.query(
      'UPDATE notifications SET is_read = TRUE WHERE user_id = ?',
      [userId]
    );

    res.json({
      success: true,
      message: 'All notifications marked as read'
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getNotifications,
  markAllRead
};
