const express = require('express');
const multer = require('multer');
const path = require('path');
const { 
  createCommunity, 
  getCommunities, 
  joinCommunity, 
  getCommunityMembers,
  getJoinRequests,
  approveJoinRequest,
  declineJoinRequest,
  getCommunityMessages,
  sendCommunityMessage,
  deleteCommunityMessage
} = require('../controllers/communityController');
const { verifyToken } = require('../middleware/authMiddleware');

const router = express.Router();

// Multer Storage Configuration for community covers and chat media
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
  limits: { fileSize: 10 * 1024 * 1024 } // 10MB limit for media attachments
});

const communityUpload = upload.fields([
  { name: 'cover', maxCount: 1 }
]);

const chatUpload = upload.fields([
  { name: 'chatMedia', maxCount: 1 }
]);

// Routes
router.get('/', getCommunities);
router.post('/', verifyToken, communityUpload, createCommunity);
router.post('/:id/join', verifyToken, joinCommunity);
router.get('/:id/members', getCommunityMembers);

// Request Approval Routes
router.get('/:id/requests', verifyToken, getJoinRequests);
router.post('/:id/requests/:userId/approve', verifyToken, approveJoinRequest);
router.post('/:id/requests/:userId/decline', verifyToken, declineJoinRequest);

// Chat / Message Board Routes (Ephemeral 24h)
router.get('/:id/messages', verifyToken, getCommunityMessages);
router.post('/:id/messages', verifyToken, chatUpload, sendCommunityMessage);
router.delete('/:id/messages/:messageId', verifyToken, deleteCommunityMessage);

module.exports = router;
