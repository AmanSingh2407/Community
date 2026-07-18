const db = require('../config/database');
const crypto = require('crypto');
const { updateUserPointsAndRank } = require('../utils/gamification');


// Create a new story (supports photo upload, canvas screenshot, and short videos with music)
const createStory = async (req, res, next) => {
  try {
    const authorId = req.user.id;
    let mediaUrl = null;
    let mediaType = 'photo';

    if (req.files && req.files.media && req.files.media[0]) {
      mediaUrl = `/uploads/${req.files.media[0].filename}`;
      const mime = req.files.media[0].mimetype || '';
      if (mime.startsWith('video/') || /\.(mp4|webm|mov|avi|mkv)$/i.test(req.files.media[0].filename)) {
        mediaType = 'video';
      }
    }

    // Support base64 image decoding if uploaded via canvas screenshot
    if (req.body.media_url && req.body.media_url.startsWith('data:image')) {
      const fs = require('fs');
      const path = require('path');
      const base64Data = req.body.media_url.replace(/^data:image\/\w+;base64,/, "");
      const buffer = Buffer.from(base64Data, 'base64');
      const filename = `story-${Date.now()}-${Math.round(Math.random() * 1E9)}.jpg`;
      const filepath = path.join(__dirname, '../../uploads', filename);
      
      fs.writeFileSync(filepath, buffer);
      mediaUrl = `/uploads/${filename}`;
      mediaType = 'photo';
    } else if (req.body.media_url) {
      mediaUrl = req.body.media_url;
      if (/\.(mp4|webm|mov)$/i.test(mediaUrl)) {
        mediaType = 'video';
      }
    } else if (req.body.media_type === 'live') {
      mediaType = 'live';
      mediaUrl = 'live_stream';
    }

    if (!mediaUrl) {
      return res.status(400).json({ success: false, error: 'Story image or video file is required' });
    }

    // Capture stickers/music
    let stickers = req.body.stickers || null;
    if (typeof stickers === 'string') {
      try {
        stickers = JSON.stringify(JSON.parse(stickers));
      } catch (e) {
        stickers = null;
      }
    }

    const storyId = crypto.randomUUID();
    // Live streams expire in 2 hours automatically if not closed properly
    const expiresAt = mediaType === 'live' 
      ? new Date(Date.now() + 2 * 60 * 60 * 1000) 
      : new Date(Date.now() + 24 * 60 * 60 * 1000); 

    await db.query(
      'INSERT INTO stories (id, author_id, media_url, media_type, stickers, expires_at) VALUES (?, ?, ?, ?, ?, ?)',
      [storyId, authorId, mediaUrl, mediaType, stickers, expiresAt]
    );

    // Award points (20 for story, 50 for live broadcast)
    const pointsAwarded = mediaType === 'live' ? 50 : 20;
    const transactionId = crypto.randomUUID();
    await db.query(
      'INSERT INTO points_transactions (id, user_id, action_type, points) VALUES (?, ?, ?, ?)',
      [transactionId, authorId, mediaType === 'live' ? 'live_broadcast' : 'create_story', pointsAwarded]
    );
    await db.query('UPDATE users SET points = points + ? WHERE id = ?', [pointsAwarded, authorId]);

    // Check rank updates
    const [userData] = await db.query('SELECT points, rank_tier FROM users WHERE id = ?', [authorId]);
    const currentPoints = userData[0].points;
    const { getRankTier } = require('../utils/gamification');
    const rankTier = getRankTier(currentPoints);

    await db.query('UPDATE users SET rank_tier = ? WHERE id = ?', [rankTier, authorId]);

    res.status(201).json({
      success: true,
      message: mediaType === 'live' ? 'Live stream started' : 'Story posted successfully',
      points_earned: pointsAwarded,
      new_points: currentPoints,
      new_rank: rankTier
    });
  } catch (error) {
    next(error);
  }
};


// End an active live stream story
const endLiveStory = async (req, res, next) => {
  try {
    const authorId = req.user.id;
    await db.query(
      "DELETE FROM stories WHERE author_id = ? AND media_type = 'live'",
      [authorId]
    );
    res.json({ success: true, message: 'Live stream ended successfully' });
  } catch (error) {
    next(error);
  }
};


// Get all active stories grouped by user
const getStoriesFeed = async (req, res, next) => {
  try {
    const [stories] = await db.query(
      `SELECT s.*, u.name as author_name, u.avatar_url as author_avatar
       FROM stories s
       JOIN users u ON s.author_id = u.id
       WHERE s.expires_at > ?
       ORDER BY s.created_at ASC`,
      [new Date()]
    );


    // Group stories by user
    const grouped = {};
    stories.forEach(story => {
      if (!grouped[story.author_id]) {
        grouped[story.author_id] = {
          author_id: story.author_id,
          author_name: story.author_name,
          author_avatar: story.author_avatar,
          stories: []
        };
      }
      grouped[story.author_id].stories.push(story);
    });

    res.json({
      success: true,
      feeds: Object.values(grouped)
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  createStory,
  getStoriesFeed
};
