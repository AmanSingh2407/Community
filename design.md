# Design & Aesthetics Specifications - MindManthan

This document details the visual design system, color palettes, typography, UI components, and micro-animations rules for the MindManthan platform.

---

## 1. Visual Strategy

MindManthan's design focuses on a modern, high-engagement community support feel. Key design patterns include:
* **Glassmorphism**: Semi-transparent card panels with blur backdrops for admin dashboards and modal screens.
* **Premium Dark Elements**: Deep slate backgrounds (`bg-slate-900` or HSL equivalents) mixed with vibrant indigo accents for primary action panels.
* **Dynamic Animations**: Smooth transitions on hover states, story rings, and floating action button (FAB) actions.

---

## 2. Color Palette & Typography

### 2.1. Brand Colors
* **Primary Indigo**: `#4f46e5` (`indigo-600`) — Represents campaign strength and unity.
* **Support Campaign Gold**: `#f59e0b` (`amber-500`) — High-visibility color reserved for "Gold Supporter" badges, unseen Story Rings, and active leaderboards.
* **Background Dark**: `#0f172a` (`slate-900`) — Primary color for dark pages, full-screen stories, and preview headers.
* **Card Backing**: `#1e293b` (`slate-800`) / `#f8fafc` (`slate-50`) — High-contrast elements for widgets and feeds.
* **Alert & Warning**: `#ef4444` (`red-500`) — Used for reporting content or moderator action flags.

### 2.2. Typography
* **Primary Font**: `Outfit` or `Inter` (Google Fonts).
* **Headings**: Semibold or Bold weights with tracking adjustments for campaign slogans ("I SUPPORT SONAM WANGCHUK").
* **Body Text**: Regular weight Inter, size `14px` (mobile-first readability) to `16px`.

---

## 3. UI Component Specs

### 3.1. Bottom Navigation Bar
* **Location**: Fixed to the bottom of the screen with a frosted-glass backdrop filter (`backdrop-blur-md bg-white/70` or `bg-slate-950/70`).
* **Items**:
  * **Home**: House icon.
  * **Vlogs**: Video/Play icon.
  * **Create FAB**: Center circle button (`bg-indigo-600 text-white`) that scales up slightly on hover and triggers the post/story wizard.
  * **Communities**: Users-group icon.
  * **Profile**: User-avatar circle icon.

### 3.2. Story Ring Bar
* **Layout**: Horizontal scrollable container at the top of the Home feed.
* **Appearance**: Rounded avatar thumbnails. Unseen stories display a gradient border ring (`from-amber-400 via-pink-500 to-indigo-500`) with a rotation animation on load.

### 3.3. Stats Strip Grid
* **Layout**: 3x2 or 6x1 responsive grid.
* **Style**: Light gray borders or glass backing with individual icons matching each metric:
  * **Supporters**: Blue icon.
  * **Vlogs**: Green icon.
  * **Blogs**: Orange icon.
  * **Cities**: Red pin icon.
  * **Today's Growth**: Rising chart icon.
  * **Members**: Teal community icon.

### 3.4. Camera Overlay Filter UI
* **Simulation Layout**: Centered video/webcam box with rounded corners.
* **Filter Selectors**: Scrollable thumbnail strip at the bottom representing different overlays (e.g. gold banner, bottom banner, side flags).
* **Overlay Compositing**: Renders the active filter as a static PNG overlay on top of the video feed canvas.

---

## 4. UI Animations & Interaction States

* **Hover Scale**: All buttons and feed cards scale up by 1% (`transition-transform duration-200 hover:scale-[1.01]`).
* **Active Press**: Click states scale down slightly to indicate physical feedback.
* **Notification Pulse**: Unread notification count badge contains a subtle pulse effect (`animate-ping`).
* **Story Ring Spin**: Transition animations when active stories are selected.
