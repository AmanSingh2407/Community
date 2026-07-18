const db = require('../config/database');
const crypto = require('crypto');
const { updateUserPointsAndRank } = require('../utils/gamification');


// Create post (vlog, blog, photo)
const createPost = async (req, res, next) => {
  try {
    const { type, title, body, hashtags } = req.body;
    const authorId = req.user.id;

    if (!type || !title) {
      return res.status(400).json({ success: false, error: 'Type and Title are required' });
    }

    const postId = crypto.randomUUID();
    let mediaUrl = null;
    let coverImage = null;

    // Check files uploaded by multer
    if (req.files) {
      if (req.files.media && req.files.media[0]) {
        mediaUrl = `/uploads/${req.files.media[0].filename}`;
      }
      if (req.files.cover && req.files.cover[0]) {
        coverImage = `/uploads/${req.files.cover[0].filename}`;
      }
    }

    // Insert post
    await db.query(
      'INSERT INTO posts (id, author_id, type, title, body, media_url, cover_image, hashtags) VALUES (?, ?, ?, ?, ?, ?, ?, ?)',
      [postId, authorId, type, title, body || null, mediaUrl, coverImage, hashtags || null]
    );

    // Award Points: +5 points for creating a post (using the utility)
    const result = await updateUserPointsAndRank(authorId, 5, 'create_post');

    // Fetch the inserted post with author info to return
    const [posts] = await db.query(
      `SELECT p.*, u.name as author_name, u.avatar_url as author_avatar 
       FROM posts p 
       JOIN users u ON p.author_id = u.id 
       WHERE p.id = ?`,
      [postId]
    );

    res.status(201).json({
      success: true,
      message: 'Post created successfully',
      post: posts[0],
      points_earned: 5,
      new_points: result ? result.points : 5,
      new_rank: result ? result.rank_tier : 'Bronze'
    });
  } catch (error) {
    next(error);
  }
};

// Get posts with pagination, hashtag filter, and user author filter
const getPosts = async (req, res, next) => {
  try {
    const { type, hashtag, author_id, page = 1, limit = 10 } = req.query;
    const offset = (page - 1) * limit;

    let query = `
      SELECT p.*, u.name as author_name, u.avatar_url as author_avatar
      FROM posts p
      JOIN users u ON p.author_id = u.id
      WHERE p.status = 'published'
    `;
    const params = [];

    if (author_id) {
      query += ` AND p.author_id = ?`;
      params.push(author_id);
    }

    if (type) {
      query += ` AND p.type = ?`;
      params.push(type);
    }


    if (hashtag) {
      query += ` AND (p.hashtags LIKE ? OR p.body LIKE ?)`;
      params.push(`%${hashtag}%`, `%#${hashtag}%`);
    }

    query += ` ORDER BY p.created_at DESC LIMIT ? OFFSET ?`;
    params.push(parseInt(limit), parseInt(offset));

    const [posts] = await db.query(query, params);

    res.json({
      success: true,
      page: parseInt(page),
      limit: parseInt(limit),
      posts
    });
  } catch (error) {
    next(error);
  }
};

// Like / unlike post
const likePost = async (req, res, next) => {
  try {
    const postId = req.params.id;
    const userId = req.user.id;

    // Check if like exists
    const [likes] = await db.query(
      'SELECT id FROM likes WHERE post_id = ? AND user_id = ?',
      [postId, userId]
    );

    if (likes.length > 0) {
      // Unlike
      await db.query('DELETE FROM likes WHERE post_id = ? AND user_id = ?', [postId, userId]);
      await db.query('UPDATE posts SET likes_count = GREATEST(likes_count - 1, 0) WHERE id = ?', [postId]);
      
      return res.json({ success: true, liked: false });
    } else {
      // Like
      const likeId = crypto.randomUUID();
      await db.query(
        'INSERT INTO likes (id, post_id, user_id) VALUES (?, ?, ?)',
        [likeId, postId, userId]
      );
      await db.query('UPDATE posts SET likes_count = likes_count + 1 WHERE id = ?', [postId]);

      // Award minor points for community engagement (+5 points for liking)
      await updateUserPointsAndRank(userId, 5, 'like_post');

      // Check if likes_count reached 100 on the post
      const [postRows] = await db.query('SELECT author_id, likes_count FROM posts WHERE id = ?', [postId]);
      if (postRows.length > 0) {
        const postAuthorId = postRows[0].author_id;
        const currentLikes = postRows[0].likes_count;
        
        // If post gets exactly 100 likes, award 10 points to the author of the post!
        if (currentLikes === 100) {
          await updateUserPointsAndRank(postAuthorId, 10, 'post_100_likes_bonus');
        }
      }

      return res.json({ success: true, liked: true });
    }
  } catch (error) {
    next(error);
  }
};

// Add comment to post
const addComment = async (req, res, next) => {
  try {
    const postId = req.params.id;
    const userId = req.user.id;
    const { text } = req.body;

    if (!text) {
      return res.status(400).json({ success: false, error: 'Comment text is required' });
    }

    const commentId = crypto.randomUUID();
    await db.query(
      'INSERT INTO comments (id, post_id, author_id, text) VALUES (?, ?, ?, ?)',
      [commentId, postId, userId, text]
    );

    await db.query('UPDATE posts SET comments_count = comments_count + 1 WHERE id = ?', [postId]);

    // Award points for commenting (+10 points)
    await updateUserPointsAndRank(userId, 10, 'comment_post');

    // Fetch comment with user info
    const [comments] = await db.query(
      `SELECT c.*, u.name as author_name, u.avatar_url as author_avatar
       FROM comments c
       JOIN users u ON c.author_id = u.id
       WHERE c.id = ?`,
      [commentId]
    );

    res.status(201).json({
      success: true,
      comment: comments[0]
    });
  } catch (error) {
    next(error);
  }
};

// Get comments for post
const getComments = async (req, res, next) => {
  try {
    const postId = req.params.id;

    const [comments] = await db.query(
      `SELECT c.*, u.name as author_name, u.avatar_url as author_avatar
       FROM comments c
       JOIN users u ON c.author_id = u.id
       WHERE c.post_id = ?
       ORDER BY c.created_at ASC`,
      [postId]
    );

    res.json({
      success: true,
      comments
    });
  } catch (error) {
    next(error);
  }
};

// Delete post
const deletePost = async (req, res, next) => {
  try {
    const postId = req.params.id;
    const userId = req.user.id;

    // Check if post exists and belongs to user
    const [posts] = await db.query('SELECT author_id FROM posts WHERE id = ?', [postId]);
    if (posts.length === 0) {
      return res.status(404).json({ success: false, error: 'Post not found' });
    }

    if (posts[0].author_id !== userId) {
      return res.status(403).json({ success: false, error: 'Unauthorized to delete this post' });
    }

    // Delete post (MySQL Cascades likes/comments automatically)
    await db.query('DELETE FROM posts WHERE id = ?', [postId]);

    res.json({ success: true, message: 'Post deleted successfully' });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  createPost,
  getPosts,
  likePost,
  addComment,
  getComments,
  deletePost
};
