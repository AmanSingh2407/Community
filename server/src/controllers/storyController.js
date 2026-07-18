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
    const expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000); // 24 Hours Expiry

    await db.query(
      'INSERT INTO stories (id, author_id, media_url, media_type, stickers, expires_at) VALUES (?, ?, ?, ?, ?, ?)',
      [storyId, authorId, mediaUrl, mediaType, stickers, expiresAt]
    );

    // Award +20 points for posting a story (using gamification utility)
    const result = await updateUserPointsAndRank(authorId, 20, 'create_story');

    res.status(201).json({
      success: true,
      message: 'Story posted successfully',
      points_earned: 20,
      new_points: result ? result.points : 20,
      new_rank: result ? result.rank_tier : 'Bronze'
    });
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
