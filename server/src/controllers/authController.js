const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const crypto = require('crypto');
const db = require('../config/database');
const { verifyFirebaseToken } = require('./firebaseAdmin');

const JWT_SECRET = process.env.JWT_SECRET || 'mindmanthan_secret_key_jwt_2026_safe';

// Strict email validator
const isValidEmail = (email) => {
  const regex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return regex.test(email);
};

// Helper to generate JWT
const generateToken = (user) => {
  return jwt.sign(
    { id: user.id, email: user.email, role: user.role },
    JWT_SECRET,
    { expiresIn: '7d' }
  );
};

// Signup Controller
const signup = async (req, res, next) => {
  try {
    const { name, email, password, phone, city } = req.body;

    if (!name || !email || !password) {
      return res.status(400).json({ success: false, error: 'Name, email and password are required' });
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return res.status(400).json({ success: false, error: 'Please enter a valid email address format' });
    }

    // Check if email already exists
    const [existingUsers] = await db.query('SELECT id FROM users WHERE email = ?', [email]);
    if (existingUsers.length > 0) {
      return res.status(400).json({ success: false, error: 'Email already registered' });
    }

    // Check phone unique if provided
    if (phone) {
      const [existingPhone] = await db.query('SELECT id FROM users WHERE phone = ?', [phone]);
      if (existingPhone.length > 0) {
        return res.status(400).json({ success: false, error: 'Phone number already registered' });
      }
    }

    // Hash password
    const salt = await bcrypt.genSalt(10);
    const passwordHash = await bcrypt.hash(password, salt);

    // Create user object
    const userId = crypto.randomUUID();
    const role = email.toLowerCase() === 'amansingh24072005@gmail.com' ? 'admin' : 'user'; 
    const rankTier = 'Bronze'; // default rank

    // Insert user into DB
    await db.query(
      'INSERT INTO users (id, name, email, phone, password_hash, city, role, rank_tier) VALUES (?, ?, ?, ?, ?, ?, ?, ?)',
      [userId, name, email, phone || null, passwordHash, city || null, role, rankTier]
    );

    // Auto-award "Early Supporter" badge
    const badgeId = 'b1'; // Early Supporter
    const userBadgeId = crypto.randomUUID();
    await db.query(
      'INSERT INTO user_badges (id, user_id, badge_id) VALUES (?, ?, ?)',
      [userBadgeId, userId, badgeId]
    );

    // Create transactional logging for starting points
    const transactionId = crypto.randomUUID();
    await db.query(
      'INSERT INTO points_transactions (id, user_id, action_type, points) VALUES (?, ?, ?, ?)',
      [transactionId, userId, 'welcome_bonus', 100] // Give 100 welcome points
    );

    // Update user points
    await db.query('UPDATE users SET points = 100 WHERE id = ?', [userId]);

    const newUser = {
      id: userId,
      name,
      email,
      phone,
      city,
      points: 100,
      role,
      rank_tier: rankTier
    };

    const token = generateToken(newUser);

    res.status(201).json({
      success: true,
      message: 'User registered successfully',
      token,
      user: newUser
    });
  } catch (error) {
    next(error);
  }
};

// Login Controller
const login = async (req, res, next) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ success: false, error: 'Email and password are required' });
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return res.status(400).json({ success: false, error: 'Please enter a valid email address format' });
    }

    // Find user in DB
    const [users] = await db.query('SELECT * FROM users WHERE email = ?', [email]);
    if (users.length === 0) {
      return res.status(401).json({ success: false, error: 'Invalid email or password' });
    }

    const user = users[0];

    // Verify password
    const isMatch = await bcrypt.compare(password, user.password_hash);
    if (!isMatch) {
      return res.status(401).json({ success: false, error: 'Invalid email or password' });
    }

    // Exclude password hash from response
    const userResponse = {
      id: user.id,
      name: user.name,
      email: user.email,
      phone: user.phone,
      city: user.city,
      avatar_url: user.avatar_url,
      points: user.points,
      rank_tier: user.rank_tier,
      role: user.role
    };

    const token = generateToken(userResponse);

    res.json({
      success: true,
      message: 'Logged in successfully',
      token,
      user: userResponse
    });
  } catch (error) {
    next(error);
  }
};

// Social Login Controller — verifies Firebase ID token, upserts user in MySQL
const socialLogin = async (req, res, next) => {
  try {
    const { idToken, email: clientEmail, name: clientName, photoURL, provider } = req.body;

    if (!provider) {
      return res.status(400).json({ success: false, error: 'Provider is required' });
    }

    let verifiedEmail = clientEmail;
    let verifiedName = clientName;
    let verifiedPhotoURL = photoURL;

    // Attempt Firebase token verification
    if (idToken) {
      const decoded = await verifyFirebaseToken(idToken);
      if (decoded) {
        // Use the verified Firebase data — trusted server-side
        verifiedEmail = decoded.email;
        verifiedName = decoded.name || decoded.display_name || clientName;
        verifiedPhotoURL = decoded.picture || photoURL;
      }
      // If decoded is null, Firebase Admin not configured (dev mode) — use client-supplied values
    }

    // Strict email validation
    if (!verifiedEmail || !isValidEmail(verifiedEmail)) {
      return res.status(400).json({ 
        success: false, 
        error: 'A valid email address is required for social login. Please use a provider with a verified email.' 
      });
    }

    if (!verifiedName) {
      verifiedName = verifiedEmail.split('@')[0];
    }

    // Check if user already exists
    const [existingUsers] = await db.query('SELECT * FROM users WHERE email = ?', [verifiedEmail]);
    
    if (existingUsers.length > 0) {
      const user = existingUsers[0];
      
      // Update avatar if we have a new one from social provider
      if (verifiedPhotoURL && !user.avatar_url) {
        await db.query('UPDATE users SET avatar_url = ? WHERE id = ?', [verifiedPhotoURL, user.id]);
        user.avatar_url = verifiedPhotoURL;
      }

      const userResponse = {
        id: user.id,
        name: user.name,
        email: user.email,
        phone: user.phone,
        city: user.city,
        avatar_url: user.avatar_url,
        points: user.points,
        rank_tier: user.rank_tier,
        role: user.role
      };
      const token = generateToken(userResponse);
      return res.json({
        success: true,
        message: `Logged in successfully via ${provider}`,
        token,
        user: userResponse
      });
    }

    // New user — register automatically from social profile
    const userId = crypto.randomUUID();
    const role = 'user'; 
    const rankTier = 'Bronze';
    // Generate a secure random password (user can never use it — only social login)
    const randomPassword = crypto.randomBytes(32).toString('hex');
    const salt = await bcrypt.genSalt(10);
    const passwordHash = await bcrypt.hash(randomPassword, salt);

    // Insert user into DB
    await db.query(
      'INSERT INTO users (id, name, email, password_hash, avatar_url, role, rank_tier) VALUES (?, ?, ?, ?, ?, ?, ?)',
      [userId, verifiedName, verifiedEmail, passwordHash, verifiedPhotoURL || null, role, rankTier]
    );

    // Auto-award "Early Supporter" badge
    const userBadgeId = crypto.randomUUID();
    await db.query(
      'INSERT INTO user_badges (id, user_id, badge_id) VALUES (?, ?, ?)',
      [userBadgeId, userId, 'b1']
    );

    // Welcome bonus points
    const transactionId = crypto.randomUUID();
    await db.query(
      'INSERT INTO points_transactions (id, user_id, action_type, points) VALUES (?, ?, ?, ?)',
      [transactionId, userId, 'welcome_bonus', 100]
    );
    await db.query('UPDATE users SET points = 100 WHERE id = ?', [userId]);

    const newUser = {
      id: userId,
      name: verifiedName,
      email: verifiedEmail,
      avatar_url: verifiedPhotoURL || null,
      points: 100,
      role,
      rank_tier: rankTier
    };

    const token = generateToken(newUser);

    res.status(201).json({
      success: true,
      message: `Welcome! Registered and logged in via ${provider}`,
      token,
      user: newUser
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  signup,
  login,
  socialLogin
};

