import React, { useState, useEffect } from 'react';
import { useAuth, API_URL } from '../context/AuthContext';
import { Search, Plus, Video, BookOpen, Heart, MessageCircle, Bookmark, Share2, Upload, FileText, X } from 'lucide-react';

const VlogsBlogs = ({ onNavigate }) => {
  const { user, getToken, setUser } = useAuth();
  const [activeSubTab, setActiveSubTab] = useState('vlog'); // 'vlog' or 'blog'
  const [posts, setPosts] = useState([]);
  const [hashtag, setHashtag] = useState('');
  const [loading, setLoading] = useState(false);

  // Creator Form states
  const [showCreator, setShowCreator] = useState(false);
  const [title, setTitle] = useState('');
  const [body, setBody] = useState('');
  const [tags, setTags] = useState('');
  const [mediaFile, setMediaFile] = useState(null);
  const [coverFile, setCoverFile] = useState(null);
  const [creatorLoading, setCreatorLoading] = useState(false);
  const [creatorError, setCreatorError] = useState('');
  
  // Comments section state
  const [activePostComments, setActivePostComments] = useState(null); // ID of post currently showing comments
  const [commentsList, setCommentsList] = useState([]);
  const [newCommentText, setNewCommentText] = useState('');
  const [commentLoading, setCommentLoading] = useState(false);

  // Bookmarks local storage emulation
  const [bookmarks, setBookmarks] = useState(() => {
    const saved = localStorage.getItem('bookmarks');
    return saved ? JSON.parse(saved) : [];
  });

  const fetchPosts = async (typeFilter = activeSubTab, tagFilter = hashtag) => {
    setLoading(true);
    try {
      let url = `${API_URL}/api/posts?type=${typeFilter}`;
      if (tagFilter) {
        url += `&hashtag=${encodeURIComponent(tagFilter)}`;
      }
      const res = await fetch(url);
      const data = await res.json();
      if (data.success) {
        setPosts(data.posts);
      }
    } catch (err) {
      console.error('Error fetching posts:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPosts(activeSubTab, hashtag);
  }, [activeSubTab]);

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    fetchPosts(activeSubTab, hashtag);
  };

  const handleCreatePost = async (e) => {
    e.preventDefault();
    setCreatorLoading(true);
    setCreatorError('');

    try {
      const token = getToken();
      const formData = new FormData();
      formData.append('type', activeSubTab);
      formData.append('title', title);
      formData.append('body', body);
      formData.append('hashtags', tags);
      
      if (mediaFile) formData.append('media', mediaFile);
      if (coverFile) formData.append('cover', coverFile);

      const res = await fetch(`${API_URL}/api/posts`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`
        },
        body: formData
      });

      const data = await res.json();
      if (data.success) {
        // Reset form
        setTitle('');
        setBody('');
        setTags('');
        setMediaFile(null);
        setCoverFile(null);
        setShowCreator(false);
        
        // Refresh feed list
        fetchPosts(activeSubTab, hashtag);

        // Update user state with new points and rank
        setUser(prev => ({
          ...prev,
          points: data.new_points,
          rank_tier: data.new_rank
        }));
      } else {
        setCreatorError(data.error || 'Failed to publish post');
      }
    } catch (err) {
      setCreatorError('Server connection error. Please verify uploads directory.');
    } finally {
      setCreatorLoading(false);
    }
  };

  const handleLike = async (postId) => {
    if (!user) {
      if (onNavigate) onNavigate('auth');
      return;
    }
    try {
      const token = getToken();
      const res = await fetch(`${API_URL}/api/posts/${postId}/like`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      const data = await res.json();
      if (data.success) {
        setPosts(prev => prev.map(p => {
          if (p.id === postId) {
            return {
              ...p,
              likes_count: data.liked ? p.likes_count + 1 : Math.max(p.likes_count - 1, 0)
            };
          }
          return p;
        }));
      }
    } catch (err) {
      console.error('Error liking post:', err);
    }
  };

  const handleToggleBookmark = (postId) => {
    let updated;
    if (bookmarks.includes(postId)) {
      updated = bookmarks.filter(id => id !== postId);
    } else {
      updated = [...bookmarks, postId];
    }
    setBookmarks(updated);
    localStorage.setItem('bookmarks', JSON.stringify(updated));
  };

  // Comments Actions
  const handleOpenComments = async (postId) => {
    if (activePostComments === postId) {
      setActivePostComments(null);
      return;
    }
    
    setActivePostComments(postId);
    setCommentsList([]);
    try {
      const res = await fetch(`${API_URL}/api/posts/${postId}/comments`);
      const data = await res.json();
      if (data.success) {
        setCommentsList(data.comments);
      }
    } catch (err) {
      console.error('Error fetching comments:', err);
    }
  };

  const handleAddComment = async (e, postId) => {
    e.preventDefault();
    if (!user) {
      if (onNavigate) onNavigate('auth');
      return;
    }
    if (!newCommentText.trim()) return;

    setCommentLoading(true);
    try {
      const token = getToken();
      const res = await fetch(`${API_URL}/api/posts/${postId}/comments`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ text: newCommentText })
      });
      const data = await res.json();
      if (data.success) {
        setCommentsList(prev => [...prev, data.comment]);
        setNewCommentText('');
        // Update comments count on post card
        setPosts(prev => prev.map(p => {
          if (p.id === postId) {
            return { ...p, comments_count: p.comments_count + 1 };
          }
          return p;
        }));
      }
    } catch (err) {
      console.error('Error adding comment:', err);
    } finally {
      setCommentLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Search Header */}
      <form onSubmit={handleSearchSubmit} className="flex gap-2">
        <div className="relative flex-1">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
          <input
            type="text"
            value={hashtag}
            onChange={(e) => setHashtag(e.target.value)}
            className="w-full bg-slate-900 border border-slate-800 text-slate-200 placeholder-slate-500 rounded-xl pl-9 pr-4 py-2.5 text-xs focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500"
            placeholder="Search hashtags... e.g. SaveLadakh"
          />
        </div>
        <button
          type="submit"
          className="bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl px-4 py-2 text-xs font-semibold active:scale-95 transition-all shadow-md"
        >
          Filter
        </button>
      </form>

      {/* Tabs Header */}
      <div className="flex border-b border-slate-800/80">
        <button
          onClick={() => { setActiveSubTab('vlog'); setShowCreator(false); }}
          className={`flex-1 pb-3 text-xs font-semibold flex items-center justify-center gap-1.5 border-b-2 transition-colors ${
            activeSubTab === 'vlog' ? 'border-indigo-500 text-indigo-400' : 'border-transparent text-slate-400 hover:text-slate-200'
          }`}
        >
          <Video className="w-4 h-4" />
          Vlogs (Video Feed)
        </button>
        
        <button
          onClick={() => { setActiveSubTab('blog'); setShowCreator(false); }}
          className={`flex-1 pb-3 text-xs font-semibold flex items-center justify-center gap-1.5 border-b-2 transition-colors ${
            activeSubTab === 'blog' ? 'border-indigo-500 text-indigo-400' : 'border-transparent text-slate-400 hover:text-slate-200'
          }`}
        >
          <BookOpen className="w-4 h-4" />
          Blogs (Articles)
        </button>
      </div>

      {/* Create Button */}
      {!showCreator && (
        <button
          onClick={() => {
            if (!user) {
              if (onNavigate) onNavigate('auth');
            } else {
              setShowCreator(true);
            }
          }}
          className="w-full flex items-center justify-center gap-2 bg-slate-900/60 hover:bg-slate-900 border border-slate-800/80 hover:border-slate-700/80 rounded-xl p-4 text-xs text-slate-300 font-semibold transition-all shadow-sm"
        >
          <Plus className="w-4 h-4 text-indigo-400" />
          {activeSubTab === 'vlog' ? 'Upload a Campaign Vlog (+50 pts)' : 'Publish a Campaign Blog (+50 pts)'}
        </button>
      )}

      {/* Creator Form */}
      {showCreator && (
        <form onSubmit={handleCreatePost} className="bg-slate-900 border border-slate-850 rounded-2xl p-5 space-y-4 shadow-xl relative">
          <button 
            type="button" 
            onClick={() => setShowCreator(false)} 
            className="absolute top-4 right-4 text-slate-500 hover:text-white"
          >
            <X className="w-4 h-4" />
          </button>
          
          <h3 className="text-sm font-bold text-white uppercase tracking-wider">
            {activeSubTab === 'vlog' ? 'New Vlog Upload' : 'New Blog Article'}
          </h3>

          {creatorError && (
            <div className="bg-red-500/10 border border-red-500/20 text-red-400 text-xs p-3 rounded-lg text-center">
              {creatorError}
            </div>
          )}

          <div>
            <label className="block text-[10px] font-semibold text-slate-400 uppercase tracking-wider mb-1">
              Title
            </label>
            <input
              type="text"
              required
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="w-full bg-slate-800/40 border border-slate-700/80 text-white rounded-lg px-3 py-2 text-xs focus:outline-none focus:border-indigo-500"
              placeholder={activeSubTab === 'vlog' ? 'My thoughts on Ladakh development' : 'A Deep Dive into Glacial Retreat'}
            />
          </div>

          <div>
            <label className="block text-[10px] font-semibold text-slate-400 uppercase tracking-wider mb-1">
              {activeSubTab === 'vlog' ? 'Video Description (optional)' : 'Article Body Content'}
            </label>
            <textarea
              required={activeSubTab === 'blog'}
              rows={4}
              value={body}
              onChange={(e) => setBody(e.target.value)}
              className="w-full bg-slate-800/40 border border-slate-700/80 text-white rounded-lg p-3 text-xs focus:outline-none focus:border-indigo-500 resize-none"
              placeholder="Provide detailed campaign summaries or description..."
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-[10px] font-semibold text-slate-400 uppercase tracking-wider mb-1">
                Hashtags (comma separated)
              </label>
              <input
                type="text"
                value={tags}
                onChange={(e) => setTags(e.target.value)}
                className="w-full bg-slate-800/40 border border-slate-700/80 text-white rounded-lg px-3 py-2 text-xs focus:outline-none"
                placeholder="SaveLadakh, SonamWangchuk"
              />
            </div>

            <div>
              <label className="block text-[10px] font-semibold text-slate-400 uppercase tracking-wider mb-1">
                {activeSubTab === 'vlog' ? 'Video Attachment' : 'Cover Image'}
              </label>
              <div className="flex items-center gap-2">
                <label className="flex-1 flex items-center justify-center gap-2 bg-slate-800/60 border border-slate-700/80 rounded-lg px-3 py-2 text-xs cursor-pointer hover:bg-slate-750 transition-colors text-slate-300">
                  <Upload className="w-4 h-4 text-indigo-400" />
                  <span className="truncate">
                    {activeSubTab === 'vlog' 
                      ? (mediaFile ? mediaFile.name : 'Choose Video') 
                      : (coverFile ? coverFile.name : 'Choose Image')}
                  </span>
                  <input
                    type="file"
                    accept={activeSubTab === 'vlog' ? 'video/*' : 'image/*'}
                    onChange={(e) => {
                      if (activeSubTab === 'vlog') {
                        setMediaFile(e.target.files[0]);
                      } else {
                        setCoverFile(e.target.files[0]);
                      }
                    }}
                    className="hidden"
                  />
                </label>
              </div>
            </div>
          </div>

          <button
            type="submit"
            disabled={creatorLoading}
            className="w-full py-2 bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 text-white rounded-lg text-xs font-bold transition-all shadow-md shadow-indigo-950"
          >
            {creatorLoading ? 'Uploading media...' : 'Publish Content (+50 points)'}
          </button>
        </form>
      )}

      {/* Feed Loading state */}
      {loading ? (
        <div className="flex justify-center p-12">
          <div className="w-8 h-8 border-2 border-indigo-500 border-t-transparent rounded-full animate-spin"></div>
        </div>
      ) : posts.length === 0 ? (
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-12 text-center text-slate-400 text-xs">
          No campaign posts found. Be the first to create one!
        </div>
      ) : (
        /* Feed List */
        <div className="space-y-6">
          {posts.map((post) => (
            <div key={post.id} className="bg-slate-900 border border-slate-800 rounded-2xl p-5 space-y-4 shadow-md">
              {/* Header */}
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-full overflow-hidden flex items-center justify-center bg-indigo-900/30 border border-slate-700/60 font-bold text-xs text-indigo-300 uppercase">
                    {post.author_avatar ? (
                      <img 
                        src={post.author_avatar.startsWith('http') ? post.author_avatar : `${API_URL}${post.author_avatar}`} 
                        alt={post.author_name} 
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      post.author_name ? post.author_name.charAt(0) : 'U'
                    )}
                  </div>
                  <div>
                    <h4 className="text-xs font-bold text-white">{post.author_name || 'Anonymous Supporter'}</h4>
                    <span className="text-[9px] text-slate-500">
                      {new Date(post.created_at).toLocaleDateString()}
                    </span>
                  </div>
                </div>
                <button 
                  onClick={() => handleToggleBookmark(post.id)}
                  className={`text-slate-500 hover:text-white transition-colors ${bookmarks.includes(post.id) ? 'text-amber-500' : ''}`}
                >
                  <Bookmark className={`w-4.5 h-4.5 ${bookmarks.includes(post.id) ? 'fill-amber-500' : ''}`} />
                </button>
              </div>

              {/* Title & Body */}
              <div className="space-y-2">
                <h3 className="text-sm font-bold text-slate-200">{post.title}</h3>
                {post.body && (
                  <p className="text-xs md:text-sm text-slate-400 leading-relaxed whitespace-pre-line">
                    {post.body}
                  </p>
                )}
              </div>

              {/* Media attachments */}
              {post.type === 'vlog' && post.media_url ? (
                <div className="rounded-xl overflow-hidden bg-black max-h-96 border border-slate-800 flex justify-center">
                  <video 
                    controls 
                    className="w-full max-h-96"
                    src={`${API_URL}${post.media_url}`}
                  />
                </div>
              ) : post.type === 'blog' && post.cover_image ? (
                <div className="rounded-xl overflow-hidden bg-slate-950 border border-slate-800 max-h-60">
                  <img 
                    src={`${API_URL}${post.cover_image}`} 
                    alt="Cover" 
                    className="w-full h-full object-cover"
                  />
                </div>
              ) : null}

              {/* Hashtag badges */}
              {post.hashtags && (
                <div className="flex flex-wrap gap-1.5 pt-1">
                  {post.hashtags.split(',').map((tag, idx) => (
                    <span key={idx} className="text-[9px] px-2 py-0.5 bg-slate-800 border border-slate-700/60 text-slate-300 rounded-full font-medium">
                      #{tag.trim()}
                    </span>
                  ))}
                </div>
              )}

              {/* Actions footer bar */}
              <div className="flex items-center justify-between pt-2 border-t border-slate-800/80 text-slate-400 text-xs">
                <button
                  onClick={() => handleLike(post.id)}
                  className="flex items-center gap-1 hover:text-red-400 transition-colors"
                >
                  <Heart className="w-4 h-4 hover:fill-red-500/20" />
                  <span>{post.likes_count}</span>
                </button>

                <button
                  onClick={() => handleOpenComments(post.id)}
                  className={`flex items-center gap-1 hover:text-indigo-400 transition-colors ${activePostComments === post.id ? 'text-indigo-400' : ''}`}
                >
                  <MessageCircle className="w-4 h-4" />
                  <span>{post.comments_count}</span>
                </button>

                <button className="flex items-center gap-1 hover:text-indigo-400 transition-colors">
                  <Share2 className="w-4 h-4" />
                  <span>Share</span>
                </button>
              </div>

              {/* Comments drawer pane */}
              {activePostComments === post.id && (
                <div className="pt-4 border-t border-slate-800/50 space-y-4">
                  <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider">Comments</h4>
                  
                  {/* Comments list */}
                  <div className="space-y-3 max-h-48 overflow-y-auto pr-1">
                    {commentsList.length === 0 ? (
                      <p className="text-[10px] text-slate-500 italic">No comments yet. Support this post!</p>
                    ) : (
                      commentsList.map((comm) => (
                        <div key={comm.id} className="bg-slate-850 border border-slate-800/60 rounded-xl p-2.5 space-y-1">
                          <div className="flex justify-between items-center text-[9px] text-slate-400">
                            <span className="font-bold text-slate-300">{comm.author_name}</span>
                            <span>{new Date(comm.created_at).toLocaleDateString()}</span>
                          </div>
                          <p className="text-xs text-slate-300">{comm.text}</p>
                        </div>
                      ))
                    )}
                  </div>

                  {/* Add comment form */}
                  <form onSubmit={(e) => handleAddComment(e, post.id)} className="flex gap-2">
                    <input
                      type="text"
                      required
                      value={newCommentText}
                      onChange={(e) => setNewCommentText(e.target.value)}
                      placeholder="Add a comment... (+10 pts)"
                      className="flex-1 bg-slate-850 border border-slate-800 rounded-lg px-3 py-1.5 text-xs text-white focus:outline-none focus:border-indigo-500"
                    />
                    <button
                      type="submit"
                      disabled={commentLoading}
                      className="bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 text-white text-xs px-3 py-1.5 rounded-lg font-bold"
                    >
                      Post
                    </button>
                  </form>
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default VlogsBlogs;
