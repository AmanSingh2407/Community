const express = require('express');
const cors = require('cors');
const path = require('path');
require('dotenv').config();

// Initialize DB connection test
require('./config/database');

const app = express();
const PORT = process.env.PORT || 5000;

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Serve uploaded media files
app.use('/uploads', express.static(path.join(__dirname, '../uploads')));

// Register Routes
const authRoutes = require('./routes/authRoutes');
const statsRoutes = require('./routes/statsRoutes');
const postRoutes = require('./routes/postRoutes');
const storyRoutes = require('./routes/storyRoutes');
const communityRoutes = require('./routes/communityRoutes');
const rewardRoutes = require('./routes/rewardRoutes');
const adminRoutes = require('./routes/adminRoutes');
app.use('/api/auth', authRoutes);
app.use('/api/stats', statsRoutes);
app.use('/api/posts', postRoutes);
app.use('/api/stories', storyRoutes);
app.use('/api/communities', communityRoutes);
app.use('/api/gamification', rewardRoutes);
app.use('/api/admin', adminRoutes);

// Simple status route
app.get('/api/health', (req, res) => {
  res.json({
    status: 'healthy',
    timestamp: new Date(),
    service: 'Awaaz API Service'
  });
});

// Global Error Handler
app.use((err, req, res, next) => {
  console.error('Unhandled Server Error:', err);
  res.status(err.status || 500).json({
    success: false,
    error: err.message || 'Internal Server Error'
  });
});

// Start Server
app.listen(PORT, () => {
  console.log(`Awaaz backend server running on port ${PORT}`);
});

module.exports = app;
