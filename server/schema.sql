-- Create database if not exists
CREATE DATABASE IF NOT EXISTS mindmanthan;
USE mindmanthan;

-- 1. Users Table
CREATE TABLE IF NOT EXISTS users (
    id VARCHAR(36) PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    email VARCHAR(255) UNIQUE NOT NULL,
    phone VARCHAR(20) UNIQUE,
    password_hash VARCHAR(255) NOT NULL,
    avatar_url VARCHAR(255),
    city VARCHAR(100),
    points INT DEFAULT 0,
    rank_tier VARCHAR(50) DEFAULT 'Bronze',
    role VARCHAR(50) DEFAULT 'user',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

-- 2. Posts Table (Vlogs, Blogs, Photos)
CREATE TABLE IF NOT EXISTS posts (
    id VARCHAR(36) PRIMARY KEY,
    author_id VARCHAR(36),
    type VARCHAR(20) NOT NULL,
    title VARCHAR(255) NOT NULL,
    body TEXT,
    media_url VARCHAR(255),
    cover_image VARCHAR(255),
    hashtags TEXT,
    likes_count INT DEFAULT 0,
    comments_count INT DEFAULT 0,
    shares_count INT DEFAULT 0,
    status VARCHAR(20) DEFAULT 'published',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (author_id) REFERENCES users(id) ON DELETE CASCADE
);

-- 3. Comments Table
CREATE TABLE IF NOT EXISTS comments (
    id VARCHAR(36) PRIMARY KEY,
    post_id VARCHAR(36) NOT NULL,
    author_id VARCHAR(36) NOT NULL,
    text TEXT NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (post_id) REFERENCES posts(id) ON DELETE CASCADE,
    FOREIGN KEY (author_id) REFERENCES users(id) ON DELETE CASCADE
);

-- 4. Likes Table
CREATE TABLE IF NOT EXISTS likes (
    id VARCHAR(36) PRIMARY KEY,
    post_id VARCHAR(36) NOT NULL,
    user_id VARCHAR(36) NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE KEY unique_post_user (post_id, user_id),
    FOREIGN KEY (post_id) REFERENCES posts(id) ON DELETE CASCADE,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

-- 5. Stories Table
CREATE TABLE IF NOT EXISTS stories (
    id VARCHAR(36) PRIMARY KEY,
    author_id VARCHAR(36) NOT NULL,
    media_url VARCHAR(255) NOT NULL,
    media_type VARCHAR(20) DEFAULT 'photo',
    stickers JSON,
    views_count INT DEFAULT 0,
    expires_at TIMESTAMP NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (author_id) REFERENCES users(id) ON DELETE CASCADE
);

-- 6. Communities Table
CREATE TABLE IF NOT EXISTS communities (
    id VARCHAR(36) PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    type VARCHAR(20) DEFAULT 'public',
    description TEXT,
    cover_image VARCHAR(255),
    city VARCHAR(100),
    member_count INT DEFAULT 1,
    created_by VARCHAR(36),
    qr_token VARCHAR(255),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (created_by) REFERENCES users(id) ON DELETE SET NULL
);

-- 7. Community Members Table
CREATE TABLE IF NOT EXISTS community_members (
    id VARCHAR(36) PRIMARY KEY,
    community_id VARCHAR(36) NOT NULL,
    user_id VARCHAR(36) NOT NULL,
    role VARCHAR(20) DEFAULT 'member',
    status VARCHAR(20) DEFAULT 'joined',
    joined_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE KEY unique_comm_user (community_id, user_id),
    FOREIGN KEY (community_id) REFERENCES communities(id) ON DELETE CASCADE,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

-- 8. Badges Table
CREATE TABLE IF NOT EXISTS badges (
    id VARCHAR(36) PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    icon_url VARCHAR(255),
    criteria JSON
);

-- 9. User Badges Table
CREATE TABLE IF NOT EXISTS user_badges (
    id VARCHAR(36) PRIMARY KEY,
    user_id VARCHAR(36) NOT NULL,
    badge_id VARCHAR(36) NOT NULL,
    earned_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE KEY unique_user_badge (user_id, badge_id),
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    FOREIGN KEY (badge_id) REFERENCES badges(id) ON DELETE CASCADE
);

-- 10. Points Transactions Table
CREATE TABLE IF NOT EXISTS points_transactions (
    id VARCHAR(36) PRIMARY KEY,
    user_id VARCHAR(36) NOT NULL,
    action_type VARCHAR(100) NOT NULL,
    points INT NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

-- 11. Notifications Table
CREATE TABLE IF NOT EXISTS notifications (
    id VARCHAR(36) PRIMARY KEY,
    user_id VARCHAR(36) NOT NULL,
    type VARCHAR(50) NOT NULL,
    actor_id VARCHAR(36),
    target_id VARCHAR(36),
    target_type VARCHAR(50),
    is_read BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    FOREIGN KEY (actor_id) REFERENCES users(id) ON DELETE SET NULL
);

-- 12. Reports Table
CREATE TABLE IF NOT EXISTS reports (
    id VARCHAR(36) PRIMARY KEY,
    content_id VARCHAR(36) NOT NULL,
    content_type VARCHAR(20) NOT NULL,
    reason VARCHAR(255) NOT NULL,
    reported_by VARCHAR(36) NOT NULL,
    status VARCHAR(20) DEFAULT 'pending',
    reviewed_by VARCHAR(36),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (reported_by) REFERENCES users(id) ON DELETE CASCADE,
    FOREIGN KEY (reviewed_by) REFERENCES users(id) ON DELETE SET NULL
);

-- 13. Audit Logs Table
CREATE TABLE IF NOT EXISTS audit_logs (
    id VARCHAR(36) PRIMARY KEY,
    admin_id VARCHAR(36) NOT NULL,
    action VARCHAR(255) NOT NULL,
    target_type VARCHAR(50),
    target_id VARCHAR(36),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (admin_id) REFERENCES users(id) ON DELETE CASCADE
);

-- Clean old seeds to avoid primary key collisions on re-runs
DELETE FROM user_badges;
DELETE FROM badges;
DELETE FROM community_members;
DELETE FROM communities;
DELETE FROM likes;
DELETE FROM comments;
DELETE FROM posts;
DELETE FROM stories;
DELETE FROM points_transactions;
DELETE FROM users;

-- Seed Badges
INSERT INTO badges (id, name, icon_url, criteria) VALUES
('b1', 'Early Supporter', '✊', '{"points_needed": 0}'),
('b2', 'Voice of Ladakh', '📢', '{"vlogs_needed": 5}'),
('b3', 'Community Builder', '🤝', '{"referrals_needed": 10}'),
('b4', 'Elite Guardian', '🛡️', '{"points_needed": 5000}');

-- Seed Users (default password: 'password123')
INSERT INTO users (id, name, email, password_hash, avatar_url, city, points, rank_tier, role) VALUES
('m1', 'Sonam Wangchuk', 'sonam@awaaz.org', '$2a$10$h.B/J59qHqpx3sR5tQ8Etuq9i72bpxsJ7Qn9rR1zR/QpA09GveTq.', 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=80&q=80', 'Leh', 5800, 'Platinum', 'user'),
('m2', 'Pema Tsering', 'pema@awaaz.org', '$2a$10$h.B/J59qHqpx3sR5tQ8Etuq9i72bpxsJ7Qn9rR1zR/QpA09GveTq.', 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=80&q=80', 'Leh', 2980, 'Gold', 'user'),
('m3', 'Tashi Dorjay', 'tashi@awaaz.org', '$2a$10$h.B/J59qHqpx3sR5tQ8Etuq9i72bpxsJ7Qn9rR1zR/QpA09GveTq.', 'https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?auto=format&fit=crop&w=80&q=80', 'Leh', 1950, 'Silver', 'user'),
('m4', 'Kartik Sharma', 'kartik@awaaz.org', '$2a$10$h.B/J59qHqpx3sR5tQ8Etuq9i72bpxsJ7Qn9rR1zR/QpA09GveTq.', 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&w=80&q=80', 'Delhi', 2450, 'Silver', 'user'),
('m5', 'Rigzin Angmo', 'rigzin@awaaz.org', '$2a$10$h.B/J59qHqpx3sR5tQ8Etuq9i72bpxsJ7Qn9rR1zR/QpA09GveTq.', 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&w=80&q=80', 'Leh', 1200, 'Silver', 'user'),
('m6', 'Aman Singh', 'amansingh24072005@gmail.com', '$2a$10$oAT5T0eeeqaCaO3syiCN4eQogVfvtv1BQmB0AgVn.zcnZiyjpbf4O', null, 'Leh', 500, 'Silver', 'admin');

-- Seed User Badges
INSERT INTO user_badges (id, user_id, badge_id) VALUES
('ub1', 'm1', 'b1'),
('ub2', 'm1', 'b4'),
('ub3', 'm2', 'b1'),
('ub4', 'm3', 'b1'),
('ub5', 'm4', 'b1');

-- Seed Communities & Members
-- Purged dummy communities and memberships to keep system clean.

-- Seed Posts
-- No dummy posts seeded to keep feed clean.


-- Seed Comments
-- No dummy comments seeded to keep feed clean.


-- Seed Stories (expires in future)
-- No dummy stories seeded to keep feed clean.

