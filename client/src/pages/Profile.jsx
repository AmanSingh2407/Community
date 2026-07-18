import React, { useState, useEffect, useRef } from 'react';
import { useAuth, API_URL } from '../context/AuthContext';
import { User, Mail, Phone, MapPin, Award, Edit3, Save, ArrowLeft, CheckCircle, Shield, Camera, UploadCloud, Trash2, Plus } from 'lucide-react';

const Profile = ({ onNavigate }) => {
  const { user, updateProfile, uploadAvatar } = useAuth();

  // Edit form states
  const [name, setName] = useState(user?.name || '');
  const [phone, setPhone] = useState(user?.phone || '');
  const [city, setCity] = useState(user?.city || '');
  const [themeClass, setThemeClass] = useState(user?.avatar_url && !user.avatar_url.startsWith('/uploads') ? user.avatar_url : 'bg-indigo-600 text-white');

  // Dynamic badges fetched from database
  const [badges, setBadges] = useState([]);
  const [badgesLoading, setBadgesLoading] = useState(true);

  // User posts states
  const [myPosts, setMyPosts] = useState([]);
  const [postsLoading, setPostsLoading] = useState(true);

  const [isEditing, setIsEditing] = useState(false);
  const [loading, setLoading] = useState(false);
  const [avatarLoading, setAvatarLoading] = useState(false);
  const [error, setError] = useState('');
  const [successMsg, setSuccessMsg] = useState('');

  const fileInputRef = useRef(null);

  // Fetch dynamic user badges and user posts from backend MySQL database
  useEffect(() => {
    if (!user) return;
    
    const fetchUserBadges = async () => {
      try {
        const token = localStorage.getItem('token');
        const res = await fetch(`${API_URL}/api/gamification/user/${user.id}`, {
          headers: { 'Authorization': `Bearer ${token}` }
        });
        const data = await res.json();
        if (data.success) {
          setBadges(data.badges || []);
        }
      } catch (err) {
        console.error('Failed to fetch user badges:', err);
      } finally {
        setBadgesLoading(false);
      }
    };

    const fetchMyPosts = async () => {
      try {
        const token = localStorage.getItem('token');
        const res = await fetch(`${API_URL}/api/posts?author_id=${user.id}`, {
          headers: { 'Authorization': `Bearer ${token}` }
        });
        const data = await res.json();
        if (data.success) {
          setMyPosts(data.posts || []);
        }
      } catch (err) {
        console.error('Failed to fetch user posts:', err);
      } finally {
        setPostsLoading(false);
      }
    };

    fetchUserBadges();
    fetchMyPosts();
  }, [user]);


  if (!user) {
    return (
      <div className="min-h-[60vh] flex flex-col items-center justify-center text-center p-6 bg-slate-900/40 border border-slate-800 rounded-3xl">
        <User className="w-16 h-16 text-slate-500 mb-4 animate-pulse" />
        <h3 className="text-xl font-bold text-white mb-2">Access Denied</h3>
        <p className="text-slate-400 text-sm max-w-sm mb-6">
          Please log in or sign up to view and customize your campaign profile.
        </p>
        <button
          onClick={() => onNavigate('auth')}
          className="px-6 py-2.5 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl text-xs font-bold transition-all active:scale-95 shadow-md shadow-indigo-950"
        >
          Go to Sign In
        </button>
      </div>
    );
  }

  // Handle saving details
  const handleSave = async (e) => {
    e.preventDefault();
    setError('');
    setSuccessMsg('');

    if (!name.trim()) {
      setError('Full name is required');
      return;
    }

    setLoading(true);
    try {
      // If we don't have a custom uploaded image, save the theme class in avatar_url column
      const currentAvatar = user.avatar_url?.startsWith('/uploads') ? user.avatar_url : themeClass;
      await updateProfile({
        name: name.trim(),
        phone: phone.trim() || null,
        city: city.trim() || null,
        avatar_url: currentAvatar
      });
      setSuccessMsg('Profile details updated!');
      setIsEditing(false);
      setTimeout(() => setSuccessMsg(''), 4000);
    } catch (err) {
      setError(err.message || 'Failed to update profile. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  // Handle uploading avatar picture from device
  const handleFileChange = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validate type
    if (!file.type.startsWith('image/')) {
      setError('Only image files are allowed');
      return;
    }

    // Validate size (max 5MB)
    if (file.size > 5 * 1024 * 1024) {
      setError('Image must be smaller than 5MB');
      return;
    }

    setError('');
    setAvatarLoading(true);
    try {
      await uploadAvatar(file);
      setSuccessMsg('Profile picture uploaded successfully!');
      setTimeout(() => setSuccessMsg(''), 4000);
    } catch (err) {
      setError(err.message || 'Image upload failed. Please try again.');
    } finally {
      setAvatarLoading(false);
    }
  };

  // Handle deleting a post
  const handleDeletePost = async (postId) => {
    if (!window.confirm('Are you sure you want to delete this campaign post?')) return;
    try {
      const token = localStorage.getItem('token');
      const res = await fetch(`${API_URL}/api/posts/${postId}`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${token}` }
      });
      const data = await res.json();
      if (data.success) {
        setMyPosts(prev => prev.filter(p => p.id !== postId));
        setSuccessMsg('Post deleted successfully!');
        setTimeout(() => setSuccessMsg(''), 4000);
      } else {
        setError(data.error || 'Failed to delete post');
      }
    } catch (err) {
      console.error('Error deleting post:', err);
      setError('Failed to delete post. Please check connection and try again.');
    }
  };


  const triggerFilePicker = () => {
    if (fileInputRef.current) {
      fileInputRef.current.click();
    }
  };

  const avatarOptions = [
    { label: 'Indigo', color: 'bg-indigo-600 text-white' },
    { label: 'Amber', color: 'bg-amber-500 text-slate-950' },
    { label: 'Emerald', color: 'bg-emerald-500 text-white' },
    { label: 'Rose', color: 'bg-rose-500 text-white' },
    { label: 'Cyan', color: 'bg-cyan-500 text-slate-950' },
    { label: 'Violet', color: 'bg-violet-500 text-white' }
  ];

  // Helper to determine if custom profile picture exists
  const hasUploadedAvatar = user.avatar_url && user.avatar_url.startsWith('/uploads');
  const avatarImageSrc = hasUploadedAvatar ? `${API_URL}${user.avatar_url}` : null;

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Header bar with Back button */}
      <div className="flex items-center justify-between pb-2">
        <button
          onClick={() => onNavigate('home')}
          className="flex items-center gap-2 text-slate-400 hover:text-white transition-colors text-xs font-bold cursor-pointer"
        >
          <ArrowLeft className="w-4 h-4" />
          Back to Home Feed
        </button>
        <span className="text-[10px] text-slate-500 font-bold uppercase tracking-widest">
          Campaign Profile console
        </span>
      </div>

      {/* Main Profile Info Card */}
      <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 md:p-8 shadow-xl relative overflow-hidden">
        {/* Glow Effects */}
        <div className="absolute top-0 right-0 w-48 h-48 bg-indigo-500/10 rounded-full blur-3xl -mr-12 -mt-12 pointer-events-none" />
        <div className="absolute bottom-0 left-0 w-48 h-48 bg-amber-500/5 rounded-full blur-3xl -ml-12 -mb-12 pointer-events-none" />

        <div className="flex flex-col md:flex-row items-center md:items-start gap-6 relative z-10">
          {/* Avatar Picture Area */}
          <div className="flex flex-col items-center gap-3">
            <div className="relative group cursor-pointer" onClick={triggerFilePicker}>
              {/* Photo circular renderer */}
              <div className={`w-24 h-24 rounded-full overflow-hidden flex items-center justify-center font-bold text-3xl uppercase shadow-lg shadow-black/40 border border-slate-700/60 transition-all ${
                hasUploadedAvatar ? 'bg-slate-850' : (user.avatar_url && !user.avatar_url.startsWith('/uploads') ? user.avatar_url : themeClass)
              }`}>
                {hasUploadedAvatar ? (
                  <img
                    src={avatarImageSrc}
                    alt={user.name}
                    className="w-full h-full object-cover"
                    onError={(e) => {
                      e.target.onerror = null;
                      e.target.style.display = 'none';
                    }}
                  />
                ) : (
                  user.name.charAt(0)
                )}

                {/* Loading overlay */}
                {avatarLoading && (
                  <div className="absolute inset-0 bg-black/70 flex items-center justify-center rounded-full">
                    <div className="w-6 h-6 border-2 border-slate-400 border-t-white rounded-full animate-spin" />
                  </div>
                )}

                {/* Hover overlay to change picture */}
                <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 flex flex-col items-center justify-center text-white transition-opacity rounded-full">
                  <Camera className="w-5 h-5 text-indigo-400 mb-0.5" />
                  <span className="text-[8px] font-bold uppercase tracking-wider">Change photo</span>
                </div>
              </div>
            </div>

            {/* Hidden Input File Picker */}
            <input
              type="file"
              ref={fileInputRef}
              onChange={handleFileChange}
              accept="image/*"
              className="hidden"
            />

            <span className="text-[10px] bg-slate-800 border border-slate-700 text-slate-400 font-bold px-2 py-0.5 rounded-full">
              {user.role === 'admin' ? '🛡️ Administrator' : user.role === 'moderator' ? '👮 Moderator' : '🌱 Campaigner'}
            </span>
          </div>

          {/* Details Overview */}
          <div className="flex-1 text-center md:text-left space-y-2">
            <h2 className="text-3xl font-extrabold text-white tracking-tight">{user.name}</h2>
            <p className="text-slate-400 text-sm font-medium flex items-center justify-center md:justify-start gap-2">
              <Mail className="w-4 h-4 text-indigo-400" />
              {user.email}
            </p>
            <div className="flex flex-wrap items-center justify-center md:justify-start gap-4 pt-1 text-xs text-slate-400">
              {user.phone && (
                <span className="flex items-center gap-1.5">
                  <Phone className="w-3.5 h-3.5 text-emerald-400" />
                  {user.phone}
                </span>
              )}
              {user.city && (
                <span className="flex items-center gap-1.5">
                  <MapPin className="w-3.5 h-3.5 text-rose-400" />
                  {user.city}
                </span>
              )}
            </div>

            {/* Score & Badge Pill Section */}
            <div className="flex flex-wrap items-center justify-center md:justify-start gap-3 pt-3">
              <div className="bg-indigo-500/10 border border-indigo-500/25 px-3 py-1.5 rounded-xl flex items-center gap-2">
                <Award className="w-4 h-4 text-indigo-400" />
                <span className="text-xs font-bold text-white">Points Balance:</span>
                <span className="text-xs font-black text-indigo-400 bg-indigo-500/10 px-2 py-0.5 rounded-md">
                  {user.points} pts
                </span>
              </div>

              <div className="bg-amber-500/10 border border-amber-500/25 px-3 py-1.5 rounded-xl flex items-center gap-2">
                <Shield className="w-4 h-4 text-amber-400" />
                <span className="text-xs font-bold text-white">Rank Tier:</span>
                <span className="text-xs font-black text-amber-400 bg-amber-500/10 px-2 py-0.5 rounded-md">
                  {user.rank_tier || 'Bronze'}
                </span>
              </div>
            </div>
          </div>

          {/* Action Trigger */}
          {!isEditing && (
            <button
              onClick={() => setIsEditing(true)}
              className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-white rounded-xl text-xs font-bold flex items-center gap-2 transition-all cursor-pointer shadow-md shadow-black/20"
            >
              <Edit3 className="w-4 h-4" />
              Edit Profile
            </button>
          )}
        </div>
      </div>

      {/* Main Grid: Details Form OR Campaign Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 items-stretch">
        
        {/* Left 2 Cols: Profile Form or Achievements details */}
        <div className="md:col-span-2 flex flex-col h-full">
          {isEditing ? (
            <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 shadow-lg h-full flex flex-col justify-between">
              <h3 className="text-base font-bold text-white mb-4">Edit Profile details</h3>
              
              {error && (
                <div className="mb-4 bg-red-500/10 border border-red-500/20 text-red-400 p-3 rounded-xl text-xs">
                  {error}
                </div>
              )}

              <form onSubmit={handleSave} className="space-y-4">
                <div>
                  <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1.5">
                    Full Name *
                  </label>
                  <input
                    type="text"
                    required
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    className="w-full bg-slate-800/60 border border-slate-700 text-white rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500"
                    placeholder="Enter your name"
                  />
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1.5">
                      Phone Number
                    </label>
                    <input
                      type="tel"
                      value={phone}
                      onChange={(e) => setPhone(e.target.value)}
                      className="w-full bg-slate-800/60 border border-slate-700 text-white rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:border-indigo-500"
                      placeholder="+91 98765..."
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1.5">
                      City / Region
                    </label>
                    <input
                      type="text"
                      value={city}
                      onChange={(e) => setCity(e.target.value)}
                      className="w-full bg-slate-800/60 border border-slate-700 text-white rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:border-indigo-500"
                      placeholder="e.g. Leh, Ladakh"
                    />
                  </div>
                </div>

                {!hasUploadedAvatar && (
                  <div>
                    <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1.5">
                      Choose Default Theme (when no custom photo is uploaded)
                    </label>
                    <div className="grid grid-cols-3 sm:grid-cols-6 gap-2">
                      {avatarOptions.map((opt) => (
                        <button
                          key={opt.label}
                          type="button"
                          onClick={() => setThemeClass(opt.color)}
                          className={`py-2 text-[10px] font-bold rounded-xl border transition-all cursor-pointer ${
                            (themeClass === opt.color || (!themeClass && opt.label === 'Indigo'))
                              ? 'border-indigo-500 ring-2 ring-indigo-500/20 ' + opt.color
                              : 'border-slate-800 bg-slate-850 hover:bg-slate-800 text-slate-400'
                          }`}
                        >
                          {opt.label}
                        </button>
                      ))}
                    </div>
                  </div>
                )}

                <div className="flex gap-3 pt-2">
                  <button
                    type="submit"
                    disabled={loading}
                    className="flex-1 flex justify-center items-center gap-2 py-2.5 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl text-xs font-bold transition-all active:scale-95 disabled:opacity-50 cursor-pointer"
                  >
                    {loading ? (
                      <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    ) : (
                      <Save className="w-4 h-4" />
                    )}
                    Save Changes
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setName(user.name);
                      setPhone(user.phone || '');
                      setCity(user.city || '');
                      setThemeClass(user.avatar_url && !user.avatar_url.startsWith('/uploads') ? user.avatar_url : 'bg-indigo-600 text-white');
                      setIsEditing(false);
                    }}
                    className="px-5 py-2.5 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-xl text-xs font-bold transition-all cursor-pointer"
                  >
                    Cancel
                  </button>
                </div>
              </form>
            </div>
          ) : (
            <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 shadow-lg h-full flex flex-col justify-between space-y-6">
              <div className="space-y-6 flex-1">
                <div>
                  <h3 className="text-base font-bold text-white mb-3">User Campaign Status</h3>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div className="bg-slate-950/40 border border-slate-800/80 p-4 rounded-2xl flex flex-col justify-center">
                      <span className="text-[10px] text-slate-500 font-bold uppercase tracking-wider">Account Creation Date</span>
                      <span className="text-sm font-semibold text-white mt-1">
                        {user.created_at ? new Date(user.created_at).toLocaleDateString(undefined, {
                          year: 'numeric', month: 'long', day: 'numeric'
                        }) : 'Awaaz Supporter'}
                      </span>
                    </div>
                    <div className="bg-slate-950/40 border border-slate-800/80 p-4 rounded-2xl flex flex-col justify-center">
                      <span className="text-[10px] text-slate-500 font-bold uppercase tracking-wider">Rank Status</span>
                      <span className="text-sm font-semibold text-indigo-400 mt-1">
                        👑 {user.rank_tier || 'Bronze'} Member
                      </span>
                    </div>
                  </div>
                </div>

                <div>
                  <h3 className="text-base font-bold text-white mb-3">Pledge Support</h3>
                  <div className="bg-indigo-600/10 border border-indigo-500/20 p-4 rounded-2xl flex items-start gap-3">
                    <div className="w-10 h-10 rounded-full bg-indigo-500/20 flex items-center justify-center text-indigo-400 font-bold flex-shrink-0">
                      🤝
                    </div>
                    <div>
                      <h4 className="text-xs font-bold text-white">Sonam Wangchuk Campaign Pledge</h4>
                      <p className="text-[11px] text-slate-400 mt-1">
                        By participating, you have joined the action for ecological safety, climate preservation of the Himalayas, and constitutional rights.
                      </p>
                    </div>
                  </div>
                </div>
              </div>

              {/* My Published Posts Section */}
              <div className="border-t border-slate-800/80 pt-5 space-y-3 flex flex-col">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2.5">
                    <h3 className="text-base font-bold text-white">My Posts & Activity</h3>
                    <span className="text-[10px] bg-slate-800 border border-slate-700 text-slate-400 px-2 py-0.5 rounded-full font-bold">
                      {myPosts.length} {myPosts.length === 1 ? 'post' : 'posts'}
                    </span>
                  </div>
                  
                  <button
                    onClick={() => onNavigate('vlogs')}
                    className="px-3 py-1.5 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl text-[10px] font-extrabold flex items-center gap-1 transition-all active:scale-95 shadow-md cursor-pointer"
                  >
                    <Plus className="w-3 h-3" />
                    New Post
                  </button>
                </div>

                {postsLoading ? (
                  <div className="flex justify-center py-6">
                    <div className="w-5 h-5 border-2 border-indigo-500 border-t-transparent rounded-full animate-spin" />
                  </div>
                ) : myPosts.length > 0 ? (
                  <div className="overflow-y-auto max-h-[190px] pr-1.5 space-y-2.5 custom-scrollbar">
                    {myPosts.map((post) => (
                      <div key={post.id} className="bg-slate-950/40 border border-slate-855 p-3 rounded-2xl flex items-center justify-between gap-4 hover:border-slate-800/60 transition-colors">
                        <div className="min-w-0 flex-1 space-y-1">
                          <div className="flex items-center gap-2">
                            <span className={`text-[8px] font-black uppercase px-2 py-0.5 rounded-full ${
                              post.type === 'vlog' ? 'bg-amber-500/10 text-amber-400 border border-amber-500/20' : 'bg-indigo-500/10 text-indigo-400 border border-indigo-500/20'
                            }`}>
                              {post.type}
                            </span>
                            <span className="text-[9px] text-slate-500">{new Date(post.created_at).toLocaleDateString()}</span>
                          </div>
                          <h4 className="text-xs font-bold text-slate-200 truncate">{post.title}</h4>
                        </div>
                        
                        <div className="flex items-center gap-4 flex-shrink-0">
                          <div className="flex items-center gap-2 text-[10px] text-slate-400 font-bold">
                            <span className="flex items-center gap-0.5">💙 {post.likes_count}</span>
                            <span className="flex items-center gap-0.5">💬 {post.comments_count}</span>
                          </div>
                          
                          <button
                            onClick={() => handleDeletePost(post.id)}
                            className="p-1.5 rounded-lg bg-slate-900 border border-slate-800 text-slate-400 hover:text-red-400 hover:border-red-500/30 hover:bg-red-500/5 transition-all cursor-pointer"
                            title="Delete Post"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="flex flex-col items-center justify-center py-8 text-center text-slate-500 border border-dashed border-slate-800 rounded-2xl">
                    <span className="text-xs italic">You haven't published any posts yet.</span>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>

        {/* Right Col: Badges & Rewards Balance info */}
        <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 shadow-lg space-y-6">
          <div>
            <h3 className="text-base font-bold text-white">Earned Badges</h3>
            <p className="text-[10px] text-slate-500 font-bold uppercase tracking-widest mt-0.5">Campaign Achievements</p>
          </div>

          <div className="space-y-3">
            {badgesLoading ? (
              <div className="flex items-center justify-center py-6">
                <div className="w-5 h-5 border-2 border-slate-400 border-t-white rounded-full animate-spin" />
              </div>
            ) : badges.length > 0 ? (
              badges.map((badge, idx) => (
                <div key={idx} className="bg-slate-950/50 border border-slate-850 p-3 rounded-2xl flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-amber-500/15 border border-amber-500/25 flex items-center justify-center text-amber-400 text-lg">
                    {badge.icon_url || '🏅'}
                  </div>
                  <div className="flex-1 min-w-0">
                    <span className="block text-xs font-bold text-white truncate">{badge.name}</span>
                    <span className="block text-[9px] text-slate-500 mt-0.5 truncate">{badge.criteria}</span>
                  </div>
                </div>
              ))
            ) : (
              <div className="text-center py-6 text-xs text-slate-500 bg-slate-950/30 rounded-2xl border border-slate-850">
                No badges earned yet.
              </div>
            )}
          </div>

          {/* Quick info upload helper */}
          <div className="bg-slate-950/40 border border-slate-800/80 p-4 rounded-2xl space-y-2">
            <h4 className="text-xs font-bold text-indigo-400 flex items-center gap-1.5">
              <UploadCloud className="w-4 h-4 text-indigo-400 animate-bounce" />
              Add Profile Picture
            </h4>
            <p className="text-[10px] text-slate-400 leading-relaxed">
              Click on your avatar circle on top to upload a real custom photo from your device!
            </p>
          </div>

          <div className="bg-slate-950/40 border border-slate-800/80 p-4 rounded-2xl space-y-2">
            <h4 className="text-xs font-bold text-indigo-400">Want more rewards?</h4>
            <p className="text-[10px] text-slate-400 leading-relaxed">
              Post daily campaign stories, upload videos/blogs about local mountain climate challenges, or coordinate meetings in local chapters to collect more points!
            </p>
            <button
              onClick={() => onNavigate('rewards')}
              className="mt-2 text-[10px] font-bold text-white hover:text-indigo-400 transition-colors flex items-center gap-1 cursor-pointer"
            >
              Check My Rewards →
            </button>
          </div>
        </div>

      </div>

      {/* Success Notification Alert */}
      {successMsg && (
        <div className="fixed bottom-6 right-6 bg-slate-900 border border-emerald-500/40 text-emerald-400 px-4 py-3 rounded-2xl shadow-2xl flex items-center gap-2.5 z-50 animate-bounce">
          <CheckCircle className="w-5 h-5 text-emerald-400" />
          <span className="text-xs font-bold">{successMsg}</span>
        </div>
      )}
    </div>
  );
};

export default Profile;
