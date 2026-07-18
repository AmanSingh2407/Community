const db = require('../config/database');
const crypto = require('crypto');

// Create community chapter
const createCommunity = async (req, res, next) => {
  try {
    const { name, type, description, city } = req.body;
    const creatorId = req.user.id;

    if (!name) {
      return res.status(400).json({ success: false, error: 'Community name is required' });
    }

    const communityId = crypto.randomUUID();
    const qrToken = crypto.randomBytes(16).toString('hex');
    let coverImage = 'https://images.unsplash.com/photo-1522071820081-009f0129c71c?auto=format&fit=crop&w=500&q=80'; // fallback cover

    if (req.files && req.files.cover && req.files.cover[0]) {
      coverImage = `/uploads/${req.files.cover[0].filename}`;
    }

    // Insert community
    await db.query(
      'INSERT INTO communities (id, name, type, description, city, cover_image, created_by, qr_token, member_count) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)',
      [communityId, name, type || 'public', description || null, city || null, coverImage, creatorId, qrToken, 1]
    );

    // Auto-join creator as admin
    const memberId = crypto.randomUUID();
    await db.query(
      'INSERT INTO community_members (id, community_id, user_id, role, status) VALUES (?, ?, ?, ?, ?)',
      [memberId, communityId, creatorId, 'admin', 'joined']
    );

    // Award points (+100 points for creating a chapter)
    const pointsAwarded = 100;
    const transactionId = crypto.randomUUID();
    await db.query(
      'INSERT INTO points_transactions (id, user_id, action_type, points) VALUES (?, ?, ?, ?)',
      [transactionId, creatorId, 'create_community', pointsAwarded]
    );
    await db.query('UPDATE users SET points = points + ? WHERE id = ?', [pointsAwarded, creatorId]);

    // Check rank updates
    const [userData] = await db.query('SELECT points, rank_tier FROM users WHERE id = ?', [creatorId]);
    const currentPoints = userData[0].points;
    let rankTier = userData[0].rank_tier;

    if (currentPoints >= 5000) rankTier = 'Platinum';
    else if (currentPoints >= 2500) rankTier = 'Gold';
    else if (currentPoints >= 1000) rankTier = 'Silver';

    if (rankTier !== userData[0].rank_tier) {
      await db.query('UPDATE users SET rank_tier = ? WHERE id = ?', [rankTier, creatorId]);
    }

    res.status(201).json({
      success: true,
      message: 'Community chapter created successfully',
      community: {
        id: communityId,
        name,
        type,
        city,
        cover_image: coverImage,
        member_count: 1
      }
    });
  } catch (error) {
    next(error);
  }
};

// Fetch community listings (filtered by city option)
const getCommunities = async (req, res, next) => {
  try {
    const { city } = req.query;
    
    let query = 'SELECT * FROM communities';
    const params = [];

    if (city) {
      query += ' WHERE city = ?';
      params.push(city);
    }

    query += ' ORDER BY member_count DESC';

    const [communities] = await db.query(query, params);

    res.json({
      success: true,
      communities
    });
  } catch (error) {
    next(error);
  }
};

// Join community
const joinCommunity = async (req, res, next) => {
  try {
    const communityId = req.params.id;
    const userId = req.user.id;

    // Check if membership already exists
    const [existing] = await db.query(
      'SELECT id, status FROM community_members WHERE community_id = ? AND user_id = ?',
      [communityId, userId]
    );

    if (existing.length > 0) {
      return res.status(400).json({ success: false, error: `Already a member (Status: ${existing[0].status})` });
    }

    // Fetch community to check type
    const [comms] = await db.query('SELECT type FROM communities WHERE id = ?', [communityId]);
    if (comms.length === 0) {
      return res.status(404).json({ success: false, error: 'Community not found' });
    }

    const isPublic = comms[0].type === 'public';
    const status = isPublic ? 'joined' : 'pending';

    const memberId = crypto.randomUUID();
    await db.query(
      'INSERT INTO community_members (id, community_id, user_id, role, status) VALUES (?, ?, ?, ?, ?)',
      [memberId, communityId, userId, 'member', status]
    );

    if (isPublic) {
      await db.query('UPDATE communities SET member_count = member_count + 1 WHERE id = ?', [communityId]);
      
      // Award points (+30 points for joining a chapter)
      const pointsAwarded = 30;
      const transactionId = crypto.randomUUID();
      await db.query(
        'INSERT INTO points_transactions (id, user_id, action_type, points) VALUES (?, ?, ?, ?)',
        [transactionId, userId, 'join_community', pointsAwarded]
      );
      await db.query('UPDATE users SET points = points + ? WHERE id = ?', [pointsAwarded, userId]);
    }

    // Check rank updates
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
      status,
      message: isPublic ? 'Joined community successfully' : 'Join request sent, pending approval',
      new_points: currentPoints,
      new_rank: rankTier
    });
  } catch (error) {
    next(error);
  }
};

// List community member list
const getCommunityMembers = async (req, res, next) => {
  try {
    const communityId = req.params.id;

    const [members] = await db.query(
      `SELECT cm.role, cm.status, cm.joined_at, u.name, u.avatar_url, u.city
       FROM community_members cm
       JOIN users u ON cm.user_id = u.id
       WHERE cm.community_id = ? AND cm.status = 'joined'
       ORDER BY cm.role DESC, cm.joined_at ASC`,
      [communityId]
    );

    res.json({
      success: true,
      members
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  createCommunity,
  getCommunities,
  joinCommunity,
  getCommunityMembers
};
