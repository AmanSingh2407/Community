const db = require('../config/database');
const crypto = require('crypto');

// Fetch dashboard key metrics
const getDashboardStats = async (req, res, next) => {
  try {
    const [userCountResult] = await db.query('SELECT COUNT(*) as count FROM users');
    const supportersCount = userCountResult[0].count;

    const [pendingReportsResult] = await db.query("SELECT COUNT(*) as count FROM reports WHERE status = 'pending'");
    const pendingCount = pendingReportsResult[0].count;

    const [todayUsersResult] = await db.query('SELECT COUNT(*) as count FROM users WHERE created_at >= NOW() - INTERVAL 1 DAY');
    const todayUsers = todayUsersResult[0].count;

    res.json({
      success: true,
      stats: {
        totalSupporters: supportersCount,
        activeReports: pendingCount,
        newUsersToday: todayUsers,
        pendingModeration: pendingCount
      }
    });
  } catch (error) {
    next(error);
  }
};

// Fetch pending moderation queue
const getReports = async (req, res, next) => {
  try {
    const [reports] = await db.query(
      `SELECT r.*, u.name as reporter_name
       FROM reports r
       JOIN users u ON r.reported_by = u.id
       WHERE r.status = 'pending'
       ORDER BY r.created_at DESC`
    );

    res.json({
      success: true,
      reports
    });
  } catch (error) {
    next(error);
  }
};

// Resolve moderation reports (approve content or delete it)
const resolveReport = async (req, res, next) => {
  try {
    const reportId = req.params.id;
    const adminId = req.user.id;
    const { action } = req.body; // 'approved' (content kept) or 'removed' (content deleted)

    if (!action || !['approved', 'removed'].includes(action)) {
      return res.status(400).json({ success: false, error: "Invalid action type (must be approved or removed)" });
    }

    const [reports] = await db.query('SELECT * FROM reports WHERE id = ?', [reportId]);
    if (reports.length === 0) {
      return res.status(404).json({ success: false, error: 'Report not found' });
    }
    const report = reports[0];

    // Resolve report state
    await db.query(
      'UPDATE reports SET status = ?, reviewed_by = ? WHERE id = ?',
      [action, adminId, reportId]
    );

    if (action === 'removed') {
      if (report.content_type === 'post') {
        await db.query("UPDATE posts SET status = 'removed' WHERE id = ?", [report.content_id]);
      } else if (report.content_type === 'comment') {
        await db.query("DELETE FROM comments WHERE id = ?", [report.content_id]);
      }
    }

    // Log moderation action inside audit logs table
    const auditId = crypto.randomUUID();
    await db.query(
      'INSERT INTO audit_logs (id, admin_id, action, target_type, target_id) VALUES (?, ?, ?, ?, ?)',
      [auditId, adminId, `resolve_${action}`, report.content_type, report.content_id]
    );

    res.json({
      success: true,
      message: `Report resolved successfully. Content has been ${action === 'removed' ? 'removed' : 'approved'}.`
    });
  } catch (error) {
    next(error);
  }
};

const getUsers = async (req, res, next) => {
  try {
    const [users] = await db.query('SELECT id, name, email, role, city FROM users ORDER BY name ASC');
    res.json({
      success: true,
      users
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getDashboardStats,
  getReports,
  resolveReport,
  getUsers
};
