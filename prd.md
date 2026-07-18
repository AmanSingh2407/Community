# Product Requirement Document (PRD) - MindManthan

## 1. Project Overview
MindManthan is a community-driven platform designed to mobilize public support for critical social causes. The platform launches with a primary campaign in support of **Sonam Wangchuk**, focusing on education, environmental conservation, and the preservation of Ladakh's future. 

The application offers a rich social experience, enabling supporters to share content, join local community chapters, earn points and badges for their activism, and interact with other supporters.

---

## 2. Product Goals
* **Pledge & Mobilize**: Enable users to pledge their support instantly and visualize the scale of the movement (number of supporters, active cities, community members).
* **Advocacy Tools**: Provide easy-to-use content tools like camera filters, stories, vlogs, and blogs to empower supporters to amplify the campaign.
* **Community Building**: Organise supporters into local, regional, or interest-based chapters with easy joining mechanisms (QR codes & referral links).
* **Sustained Engagement**: Incentivise participation using gamification (points, milestones, leaderboards, and ranks).
* **Moderation & Safety**: Provide administrators and moderators with robust tools to manage reports, audit logs, and analytics.

---

## 3. Core Functional Requirements

### 3.1. User Onboarding & Profiles
* **Signup/Login**: Users can sign up with Name, Email, Password, City, and Phone.
* **Profile Management**: Users can update their avatar, profile details, view their total points, current rank tier (Bronze, Silver, Gold, Platinum), and list of earned badges.

### 3.2. Home Screen
* **Hero Banner Carousel**: Showcases campaign imagery, headlines, and call-to-actions (CTAs) like "Support Now" and "Join Community", along with real-time supporter avatars.
* **Real-time Stats Strip**: Displays live statistics including:
  * Total Supporters (Real-time count via database/sockets)
  * Total Vlogs
  * Total Blogs
  * Active Cities
  * Today's Growth
  * Active Members
* **Promo Camera Card**: Links directly to the branded camera feature.
* **Trending Vlogs Carousel**: Swipable display of highly liked vlogs with cover images, durations, titles, authors, and like counts.
* **Community Feed**: Displays recent text, photo, and video posts from the community, with like, comment, and options menus.

### 3.3. Stories Module
* **Story Ring Bar**: Located at the top of the feed showing active stories. Unseen stories are marked with a gold ring.
* **Full-Screen Viewer**: Tap-to-advance and swipe-to-skip controls.
* **Stickers & Interactions**: Overlay interactive stickers (e.g. "I Support" badges, polls, quick emoji reactions).
* **Auto-expiry**: Stories automatically expire and disappear 24 hours after creation.

### 3.4. Camera & Filters
* **Selfie Camera Preview**: Front/back camera toggle and photo capture.
* **Branded Overlays**: Swipeable frames and filters (e.g., "I SUPPORT SONAM WANGCHUK").
* **Share Sheet**: Options to post directly to the Community Feed, Stories, or download the image.

### 3.5. Vlogs & Blogs
* **Tabbed View**: Switch between Vlogs (short-form videos) and Blogs (rich-text articles).
* **Creation Flow**: Form to upload video files or write text, add cover images, category, and search-optimized hashtags.
* **Engagement Actions**: Like, comment, share, and bookmark (save) actions.

### 3.6. Communities & Local Chapters
* **Chapter Listings**: Filter local chapters based on city/region.
* **Public & Private Chapters**: Public chapters are free to join; private chapters require administrator/creator approval.
* **Referral Mechanics**: Every user has a referral code to invite others, incrementing their referral count and earning points.
* **QR Codes**: Automatically generated QR codes for chapters to enable quick scanning and instant joining.

### 3.7. Gamification System
* **Rank Tiers**: User ranks based on points accumulated:
  * **Bronze**: 0 - 999 pts
  * **Silver**: 1,000 - 2,499 pts
  * **Gold**: 2,500 - 4,999 pts
  * **Platinum**: 5,000+ pts
* **Point-Earning Actions**:
  * Daily Check-in (+10 pts)
  * Posting a Vlog/Blog (+50 pts)
  * Sharing a Post (+15 pts)
  * Referral Join (+100 pts)
* **Milestone Badges**: Awarded for achievements (e.g., "Early Supporter", "Vlogger", "Voice of Ladakh").
* **Leaderboards**: Display rankings globally, by city, or within specific communities.

### 3.8. Notifications Feed
* **Notification Types**: Social triggers (likes, comments, follows), badges unlocked, and community/admin broadcast announcements.
* **Read Status**: Visual indicator for unread notifications and a badge count on the main notification icon.

### 3.9. Admin Panel
* **Dashboard Overview**: Key metrics summary cards showing active reports, pending moderation, and growth charts.
* **Moderation Queue**: Dedicated feed for reported content (posts, comments, stories) allowing administrators to approve or remove content.
* **Role-Based Access Control (RBAC)**:
  * **Super Admin**: Assigns moderator roles, views audit logs.
  * **Moderator**: Resolves reported content, reviews new communities.
  * **Analyst**: Accesses growth graphs and campaign statistics.
* **Audit Logs**: Records all moderation actions (who, what, and when) for accountability.

---

## 4. Technical Specifications

### 4.1. Technology Stack
* **Frontend**: React.js, Vite, Tailwind CSS (reusing responsive flexbox/grid layout and high-fidelity custom design systems).
* **Backend**: Node.js, Express.js.
* **Database**: MySQL.
* **Real-time**: Socket.io / Polls for live supporter count increments.
* **Auth**: JSON Web Tokens (JWT) stored in HTTP-only cookies or localStorage.

### 4.2. Key API Outlines
* `/api/auth/*`: signup, login, logout, verify-token
* `/api/users/*`: profile fetching, badges, points
* `/api/posts/*`: feed lists, uploads, likes, comments, bookmarking
* `/api/stories/*`: story ring fetch, creation, views
* `/api/communities/*`: creation, joining, chapter lists, QR codes
* `/api/gamification/*`: leaderboards, badge definitions
* `/api/notifications/*`: notification lists, mark-as-read
* `/api/admin/*`: admin dashboard statistics, moderation review, audit log history

---

## 5. Security & Performance
* **Password Hashing**: Stored securely using `bcryptjs`.
* **RBAC Enforcement**: All `/api/admin/*` endpoints must be restricted using custom express middleware that checks the authenticated user's database role.
* **Database Optimization**: Core columns (`users.email`, `posts.author_id`, `likes.post_id`, `likes.user_id`) indexed for fast retrieval.
