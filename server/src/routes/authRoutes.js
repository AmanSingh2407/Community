const express = require('express');
const router = express.Router();
const { signup, login, socialLogin } = require('../controllers/authController');
const { verifyToken } = require('../middleware/authMiddleware');
const db = require('../config/database');
const multer = require('multer');
const path = require('path');

// Multer configuration for profile picture upload
const avatarStorage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, path.join(__dirname, '../../uploads'));
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1e9);
    cb(null, 'avatar-' + uniqueSuffix + path.extname(file.originalname));
  }
});

const avatarUpload = multer({
  storage: avatarStorage,
  limits: { fileSize: 5 * 1024 * 1024 } // 5MB
});

// Signup
router.post('/signup', signup);

// Login
router.post('/login', login);

// Social Login
router.post('/social-login', socialLogin);

// Get current logged-in user profile
router.get('/me', verifyToken, async (req, res, next) => {
  try {
    const [users] = await db.query(
      'SELECT id, name, email, phone, city, avatar_url, points, rank_tier, role, created_at FROM users WHERE id = ?',
      [req.user.id]
    );

    if (users.length === 0) {
      return res.status(404).json({ success: false, error: 'User not found' });
    }

    res.json({
      success: true,
      user: users[0]
    });
  } catch (error) {
    next(error);
  }
});

// Update profile
router.put('/update', verifyToken, async (req, res, next) => {
  try {
    const { name, phone, city, avatar_url } = req.body;
    
    if (!name || !name.trim()) {
      return res.status(400).json({ success: false, error: 'Name is required' });
    }

    await db.query(
      'UPDATE users SET name = ?, phone = ?, city = ?, avatar_url = ? WHERE id = ?',
      [name.trim(), phone || null, city || null, avatar_url || null, req.user.id]
    );

    // Fetch updated user
    const [users] = await db.query(
      'SELECT id, name, email, phone, city, avatar_url, points, rank_tier, role, created_at FROM users WHERE id = ?',
      [req.user.id]
    );

    res.json({
      success: true,
      message: 'Profile updated successfully',
      user: users[0]
    });
  } catch (error) {
    next(error);
  }
});

// Upload profile avatar picture
router.post('/upload-avatar', verifyToken, avatarUpload.single('avatar'), async (req, res, next) => {
  try {
    if (!req.file) {
      return res.status(400).json({ success: false, error: 'No image file uploaded' });
    }

    const publicUrl = `/uploads/${req.file.filename}`;

    // Update user avatar in DB
    await db.query('UPDATE users SET avatar_url = ? WHERE id = ?', [publicUrl, req.user.id]);

    res.json({
      success: true,
      message: 'Avatar uploaded successfully',
      avatarUrl: publicUrl
    });
  } catch (error) {
    next(error);
  }
});

module.exports = router;


