const express = require('express');
const multer = require('multer');
const path = require('path');
const { createStory, getStoriesFeed } = require('../controllers/storyController');
const { verifyToken } = require('../middleware/authMiddleware');

const router = express.Router();

// Multer Storage Configuration
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, path.join(__dirname, '../../uploads'));
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, file.fieldname + '-' + uniqueSuffix + path.extname(file.originalname));
  }
});

const upload = multer({ 
  storage,
  limits: { fileSize: 10 * 1024 * 1024 } // 10MB limit
});

const mediaUpload = upload.fields([
  { name: 'media', maxCount: 1 }
]);

// Routes
router.get('/feed', getStoriesFeed);
router.post('/', verifyToken, mediaUpload, createStory);

module.exports = router;
