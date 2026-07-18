const db = require('../config/database');
const crypto = require('crypto');
const jwt = require('jsonwebtoken');

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

// Fetch community listings (filtered by city option) with dynamic user membership status join
const getCommunities = async (req, res, next) => {
  try {
    const { city } = req.query;
    
    // Optional JWT verification
    let userId = null;
    const authHeader = req.headers.authorization;
    if (authHeader && authHeader.startsWith('Bearer ')) {
      try {
        const token = authHeader.split(' ')[1];
        const decoded = jwt.verify(token, process.env.JWT_SECRET || 'secretkey');
        userId = decoded.id;
      } catch (err) {
        // Ignore token decode errors for guest view
      }
    }

    let query = '';
    const params = [];

    if (userId) {
      query = `
        SELECT c.*, cm.status as my_membership_status, cm.role as my_membership_role
        FROM communities c
        LEFT JOIN community_members cm ON c.id = cm.community_id AND cm.user_id = ?
      `;
      params.push(userId);
    } else {
      query = `
        SELECT c.*, NULL as my_membership_status, NULL as my_membership_role
        FROM communities c
      `;
    }

    if (city) {
      query += userId ? ' WHERE c.city = ?' : ' WHERE city = ?';
      params.push(city);
    }

    query += userId ? ' ORDER BY c.member_count DESC' : ' ORDER BY member_count DESC';

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
      return res.status(400).json({ success: false, error: `Already requested or joined (Status: ${existing[0].status})` });
    }

    // Fetch community existence and admin creator ID
    const [comms] = await db.query('SELECT name, created_by FROM communities WHERE id = ?', [communityId]);
    if (comms.length === 0) {
      return res.status(404).json({ success: false, error: 'Community not found' });
    }

    const memberId = crypto.randomUUID();
    await db.query(
      'INSERT INTO community_members (id, community_id, user_id, role, status) VALUES (?, ?, ?, ?, ?)',
      [memberId, communityId, userId, 'member', 'pending']
    );

    // Send notification to the community admin creator
    if (comms[0].created_by) {
      try {
        const notifId = crypto.randomUUID();
        await db.query(
          'INSERT INTO notifications (id, user_id, type, actor_id, target_id, target_type) VALUES (?, ?, ?, ?, ?, ?)',
          [notifId, comms[0].created_by, 'join_request', userId, communityId, 'community']
        );
      } catch (notifErr) {
        console.error('Failed to create join request notification:', notifErr);
      }
    }

    res.json({
      success: true,
      status: 'pending',
      message: 'Join request sent successfully, pending approval from community admin.'
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

// Fetch pending join requests for community creator
const getJoinRequests = async (req, res, next) => {
  try {
    const communityId = req.params.id;
    const userId = req.user.id;

    // Check if requester is creator
    const [comm] = await db.query('SELECT created_by FROM communities WHERE id = ?', [communityId]);
    if (!comm[0]) {
      return res.status(404).json({ success: false, error: 'Community not found' });
    }
    if (comm[0].created_by !== userId) {
      return res.status(403).json({ success: false, error: 'Unauthorized to view requests' });
    }

    const [requests] = await db.query(
      `SELECT cm.user_id, cm.joined_at, u.name, u.email, u.avatar_url
       FROM community_members cm
       JOIN users u ON cm.user_id = u.id
       WHERE cm.community_id = ? AND cm.status = 'pending'
       ORDER BY cm.joined_at ASC`,
      [communityId]
    );

    res.json({ success: true, requests });
  } catch (error) {
    next(error);
  }
};

// Approve join request
const approveJoinRequest = async (req, res, next) => {
  try {
    const communityId = req.params.id;
    const targetUserId = req.params.userId;
    const userId = req.user.id;

    const [comm] = await db.query('SELECT created_by FROM communities WHERE id = ?', [communityId]);
    if (!comm[0]) {
      return res.status(404).json({ success: false, error: 'Community not found' });
    }
    if (comm[0].created_by !== userId) {
      return res.status(403).json({ success: false, error: 'Unauthorized to manage requests' });
    }

    const [result] = await db.query(
      "UPDATE community_members SET status = 'joined' WHERE community_id = ? AND user_id = ? AND status = 'pending'",
      [communityId, targetUserId]
    );

    if (result.affectedRows === 0) {
      return res.status(400).json({ success: false, error: 'No pending request found' });
    }

    // Increment member_count
    await db.query('UPDATE communities SET member_count = member_count + 1 WHERE id = ?', [communityId]);

    // Award +30 points to the approved user
    const pointsAwarded = 30;
    const transactionId = crypto.randomUUID();
    await db.query(
      'INSERT INTO points_transactions (id, user_id, action_type, points) VALUES (?, ?, ?, ?)',
      [transactionId, targetUserId, 'join_community', pointsAwarded]
    );
    await db.query('UPDATE users SET points = points + ? WHERE id = ?', [pointsAwarded, targetUserId]);

    // Update rank
    const [userData] = await db.query('SELECT points FROM users WHERE id = ?', [targetUserId]);
    const currentPoints = userData[0].points;
    let rankTier = 'Bronze';
    if (currentPoints >= 5000) rankTier = 'Platinum';
    else if (currentPoints >= 2500) rankTier = 'Gold';
    else if (currentPoints >= 1000) rankTier = 'Silver';
    await db.query('UPDATE users SET rank_tier = ? WHERE id = ?', [rankTier, targetUserId]);

    // Send notification to the approved user
    try {
      const notifId = crypto.randomUUID();
      await db.query(
        'INSERT INTO notifications (id, user_id, type, actor_id, target_id, target_type) VALUES (?, ?, ?, ?, ?, ?)',
        [notifId, targetUserId, 'request_approved', userId, communityId, 'community']
      );
    } catch (notifErr) {
      console.error('Failed to create request approval notification:', notifErr);
    }

    res.json({ success: true, message: 'Request approved successfully' });
  } catch (error) {
    next(error);
  }
};

// Decline join request
const declineJoinRequest = async (req, res, next) => {
  try {
    const communityId = req.params.id;
    const targetUserId = req.params.userId;
    const userId = req.user.id;

    const [comm] = await db.query('SELECT created_by FROM communities WHERE id = ?', [communityId]);
    if (!comm[0]) {
      return res.status(404).json({ success: false, error: 'Community not found' });
    }
    if (comm[0].created_by !== userId) {
      return res.status(403).json({ success: false, error: 'Unauthorized to manage requests' });
    }

    const [result] = await db.query(
      "DELETE FROM community_members WHERE community_id = ? AND user_id = ? AND status = 'pending'",
      [communityId, targetUserId]
    );

    if (result.affectedRows === 0) {
      return res.status(400).json({ success: false, error: 'No pending request found' });
    }

    res.json({ success: true, message: 'Request declined successfully' });
  } catch (error) {
    next(error);
  }
};

// Get community chat messages
const getCommunityMessages = async (req, res, next) => {
  try {
    const communityId = req.params.id;
    const userId = req.user.id;

    // Verify membership
    const [member] = await db.query(
      "SELECT id FROM community_members WHERE community_id = ? AND user_id = ? AND status = 'joined'",
      [communityId, userId]
    );
    if (member.length === 0) {
      return res.status(403).json({ success: false, error: 'Access denied: You must be an approved member to view chat.' });
    }

    // Clean up expired messages (> 24 hours) first
    await db.query('DELETE FROM community_messages WHERE created_at < NOW() - INTERVAL 1 DAY');

    const [messages] = await db.query(
      `SELECT cm.*, u.name as sender_name, u.avatar_url as sender_avatar
       FROM community_messages cm
       JOIN users u ON cm.user_id = u.id
       WHERE cm.community_id = ?
       ORDER BY cm.created_at ASC`,
      [communityId]
    );

    res.json({ success: true, messages });
  } catch (error) {
    next(error);
  }
};

// Post a message/file to community chat
const sendCommunityMessage = async (req, res, next) => {
  try {
    const communityId = req.params.id;
    const userId = req.user.id;
    const { message } = req.body;

    const [member] = await db.query(
      "SELECT id FROM community_members WHERE community_id = ? AND user_id = ? AND status = 'joined'",
      [communityId, userId]
    );
    if (member.length === 0) {
      return res.status(403).json({ success: false, error: 'Access denied: Only approved members can send messages.' });
    }

    let mediaUrl = null;
    let mediaType = 'text';

    if (req.files && req.files.chatMedia && req.files.chatMedia[0]) {
      const file = req.files.chatMedia[0];
      mediaUrl = `/uploads/${file.filename}`;
      mediaType = file.mimetype.startsWith('video/') ? 'video' : 'image';
    }

    if (!message && !mediaUrl) {
      return res.status(400).json({ success: false, error: 'Message content or media is required' });
    }

    const messageId = crypto.randomUUID();
    await db.query(
      'INSERT INTO community_messages (id, community_id, user_id, message, media_url, media_type) VALUES (?, ?, ?, ?, ?, ?)',
      [messageId, communityId, userId, message || null, mediaUrl, mediaType]
    );

    const [inserted] = await db.query(
      `SELECT cm.*, u.name as sender_name, u.avatar_url as sender_avatar
       FROM community_messages cm
       JOIN users u ON cm.user_id = u.id
       WHERE cm.id = ?`,
      [messageId]
    );

    res.status(201).json({ success: true, message: inserted[0] });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  createCommunity,
  getCommunities,
  joinCommunity,
  getCommunityMembers,
  getJoinRequests,
  approveJoinRequest,
  declineJoinRequest,
  getCommunityMessages,
  sendCommunityMessage
};
