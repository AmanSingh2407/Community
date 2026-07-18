const express = require('express');
const multer = require('multer');
const path = require('path');
const { createPost, getPosts, likePost, addComment, getComments, deletePost } = require('../controllers/postController');
const { verifyToken } = require('../middleware/authMiddleware');

const router = express.Router();

// Configure local uploads destination
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
  limits: { fileSize: 15 * 1024 * 1024 } // 15MB limit
});

// Allow both video media files and blog cover images
const postUpload = upload.fields([
  { name: 'media', maxCount: 1 },
  { name: 'cover', maxCount: 1 }
]);

// Routes
router.get('/', getPosts);
router.post('/', verifyToken, postUpload, createPost);
router.post('/:id/like', verifyToken, likePost);
router.get('/:id/comments', getComments);
router.post('/:id/comments', verifyToken, addComment);
router.delete('/:id', verifyToken, deletePost);

module.exports = router;
