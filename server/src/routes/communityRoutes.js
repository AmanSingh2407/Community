const express = require('express');
const multer = require('multer');
const path = require('path');
const { createCommunity, getCommunities, joinCommunity, getCommunityMembers } = require('../controllers/communityController');
const { verifyToken } = require('../middleware/authMiddleware');

const router = express.Router();

// Multer Storage Configuration for community covers
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
  limits: { fileSize: 5 * 1024 * 1024 } // 5MB limit
});

const communityUpload = upload.fields([
  { name: 'cover', maxCount: 1 }
]);

// Routes
router.get('/', getCommunities);
router.post('/', verifyToken, communityUpload, createCommunity);
router.post('/:id/join', verifyToken, joinCommunity);
router.get('/:id/members', getCommunityMembers);

module.exports = router;
