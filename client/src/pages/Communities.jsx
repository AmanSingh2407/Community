import React, { useState, useEffect, useRef } from 'react';
import { useAuth, API_URL } from '../context/AuthContext';
import { 
  Search, 
  MapPin, 
  Users, 
  Plus, 
  X, 
  QrCode, 
  MessageSquare, 
  Send, 
  Paperclip, 
  Clock, 
  Check, 
  Trash2, 
  UserCheck, 
  UserX,
  FileVideo,
  FileImage,
  Loader
} from 'lucide-react';

const Communities = () => {
  const { user, getToken, setUser } = useAuth();
  const [communities, setCommunities] = useState([]);
  const [cityFilter, setCityFilter] = useState('');
  const [loading, setLoading] = useState(false);
  
  // Create Community States
  const [showCreator, setShowCreator] = useState(false);
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [city, setCity] = useState('');
  const [type, setType] = useState('public');
  const [coverFile, setCoverFile] = useState(null);
  const [creatorLoading, setCreatorLoading] = useState(false);
  const [creatorError, setCreatorError] = useState('');

  // Active Console Modal
  const [selectedCommunity, setSelectedCommunity] = useState(null);
  const [activeConsoleTab, setActiveConsoleTab] = useState('chat'); // 'chat', 'members', 'requests'
  const [membersList, setMembersList] = useState([]);
  const [membersLoading, setMembersLoading] = useState(false);
  
  // Requests list
  const [joinRequests, setJoinRequests] = useState([]);
  const [requestsLoading, setRequestsLoading] = useState(false);

  // Chat States
  const [chatMessages, setChatMessages] = useState([]);
  const [chatLoading, setChatLoading] = useState(false);
  const [typedMessage, setTypedMessage] = useState('');
  const [attachedFile, setAttachedFile] = useState(null);
  const [sendingMessage, setSendingMessage] = useState(false);

  const messagesEndRef = useRef(null);

  const fetchCommunities = async (filterCity = cityFilter) => {
    setLoading(true);
    try {
      let url = `${API_URL}/api/communities`;
      if (filterCity) {
        url += `?city=${encodeURIComponent(filterCity)}`;
      }
      
      const token = getToken();
      const headers = {};
      if (token) {
        headers['Authorization'] = `Bearer ${token}`;
      }

      const res = await fetch(url, { headers });
      const data = await res.json();
      if (data.success) {
        setCommunities(data.communities || []);
      }
    } catch (err) {
      console.error('Failed to load communities from DB:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCommunities(cityFilter);
  }, [cityFilter]);

  const handleCreateCommunity = async (e) => {
    e.preventDefault();
    setCreatorLoading(true);
    setCreatorError('');

    try {
      const token = getToken();
      const formData = new FormData();
      formData.append('name', name);
      formData.append('description', description);
      formData.append('city', city);
      formData.append('type', type);
      if (coverFile) {
        formData.append('cover', coverFile);
      }

      const res = await fetch(`${API_URL}/api/communities`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`
        },
        body: formData
      });

      const data = await res.json();
      if (data.success) {
        setName('');
        setDescription('');
        setCity('');
        setCoverFile(null);
        setShowCreator(false);
        fetchCommunities();
      } else {
        setCreatorError(data.error || 'Failed to create community');
      }
    } catch (err) {
      setCreatorError('Server connection error. Please try again.');
    } finally {
      setCreatorLoading(false);
    }
  };

  const handleSendJoinRequest = async (communityId) => {
    try {
      const token = getToken();
      const res = await fetch(`${API_URL}/api/communities/${communityId}/join`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      const data = await res.json();
      if (data.success) {
        alert(data.message);
        fetchCommunities();
      } else {
        alert(data.error || 'Failed to request joining');
      }
    } catch (err) {
      console.error(err);
      alert('Error requesting join');
    }
  };

  // Fetch requests (Admins only)
  const fetchJoinRequests = async (communityId) => {
    setRequestsLoading(true);
    try {
      const token = getToken();
      const res = await fetch(`${API_URL}/api/communities/${communityId}/requests`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      const data = await res.json();
      if (data.success) {
        setJoinRequests(data.requests || []);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setRequestsLoading(false);
    }
  };

  const handleResolveJoinRequest = async (communityId, targetUserId, action) => {
    try {
      const token = getToken();
      const res = await fetch(`${API_URL}/api/communities/${communityId}/requests/${targetUserId}/${action}`, {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${token}` }
      });
      const data = await res.json();
      if (data.success) {
        alert(`Request ${action === 'approve' ? 'approved' : 'declined'} successfully!`);
        fetchJoinRequests(communityId);
        fetchMembers(communityId);
      } else {
        alert(data.error || 'Failed to resolve request');
      }
    } catch (err) {
      console.error(err);
      alert('Error resolving request');
    }
  };

  // Fetch members
  const fetchMembers = async (communityId) => {
    setMembersLoading(true);
    try {
      const res = await fetch(`${API_URL}/api/communities/${communityId}/members`);
      const data = await res.json();
      if (data.success) {
        setMembersList(data.members || []);
      }
    } catch (err) {
      console.error('Failed to load members:', err);
    } finally {
      setMembersLoading(false);
    }
  };

  // Fetch chat logs
  const fetchChatMessages = async (communityId) => {
    try {
      const token = getToken();
      const res = await fetch(`${API_URL}/api/communities/${communityId}/messages`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      const data = await res.json();
      if (data.success) {
        setChatMessages(data.messages || []);
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleSendChatMessage = async (e) => {
    e.preventDefault();
    if (!typedMessage.trim() && !attachedFile) return;

    setSendingMessage(true);
    try {
      const token = getToken();
      const formData = new FormData();
      if (typedMessage.trim()) {
        formData.append('message', typedMessage);
      }
      if (attachedFile) {
        formData.append('chatMedia', attachedFile);
      }

      const res = await fetch(`${API_URL}/api/communities/${selectedCommunity.id}/messages`, {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${token}` },
        body: formData
      });
      const data = await res.json();
      if (data.success) {
        setTypedMessage('');
        setAttachedFile(null);
        fetchChatMessages(selectedCommunity.id);
      } else {
        alert(data.error || 'Failed to send message');
      }
    } catch (err) {
      console.error(err);
      alert('Error sending message');
    } finally {
      setSendingMessage(false);
    }
  };

  const handleDeleteMessage = async (messageId) => {
    if (!window.confirm('Are you sure you want to delete this message?')) return;
    try {
      const token = getToken();
      const res = await fetch(`${API_URL}/api/communities/${selectedCommunity.id}/messages/${messageId}`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${token}` }
      });
      const data = await res.json();
      if (data.success) {
        fetchChatMessages(selectedCommunity.id);
      } else {
        alert(data.error || 'Failed to delete message');
      }
    } catch (err) {
      console.error(err);
      alert('Error deleting message');
    }
  };

  // Poll chat messages
  useEffect(() => {
    if (!selectedCommunity) return;
    
    // Initial fetch
    fetchChatMessages(selectedCommunity.id);

    // Scroll to bottom
    setTimeout(() => {
      messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, 200);

    const interval = setInterval(() => {
      fetchChatMessages(selectedCommunity.id);
    }, 4000);

    return () => clearInterval(interval);
  }, [selectedCommunity]);

  // Scroll on message updates
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [chatMessages]);

  const handleOpenConsole = (community) => {
    setSelectedCommunity(community);
    setActiveConsoleTab('chat');
    fetchMembers(community.id);
    if (community.created_by === user?.id) {
      fetchJoinRequests(community.id);
    }
  };

  return (
    <div className="space-y-6">
      {/* Community Search / Filter options */}
      <div className="flex gap-3">
        <div className="relative flex-1">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
          <input
            type="text"
            value={cityFilter}
            onChange={(e) => setCityFilter(e.target.value)}
            className="w-full bg-slate-900 border border-slate-800 text-slate-200 placeholder-slate-500 rounded-xl pl-9 pr-4 py-2.5 text-xs focus:outline-none focus:border-indigo-500"
            placeholder="Search communities by city... e.g. Leh, Delhi"
          />
        </div>
        {user && (
          <button
            onClick={() => setShowCreator(true)}
            className="bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl px-4 py-2 text-xs font-semibold flex items-center gap-1.5 active:scale-95 transition-all shadow-md cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            New Community
          </button>
        )}
      </div>

      {/* Communities list */}
      {loading ? (
        <div className="flex justify-center py-12">
          <div className="w-8 h-8 border-2 border-indigo-500 border-t-transparent rounded-full animate-spin"></div>
        </div>
      ) : communities.length === 0 ? (
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-12 text-center text-slate-400 text-xs">
          No local communities found for "{cityFilter}". Create one!
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {communities.map((comm) => {
            const isJoined = comm.my_membership_status === 'joined';
            const isPending = comm.my_membership_status === 'pending';
            const isCreator = comm.created_by === user?.id;
            const coverSrc = comm.cover_image.startsWith('http') ? comm.cover_image : `${API_URL}${comm.cover_image}`;

            return (
              <div key={comm.id} className="bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden shadow-lg flex flex-col justify-between hover:border-slate-700/60 transition-all">
                <div className="relative h-40 bg-slate-850">
                  <img 
                    src={coverSrc} 
                    alt={comm.name} 
                    className="w-full h-full object-cover" 
                  />
                  <div className="absolute top-3 left-3 bg-black/60 backdrop-blur-sm border border-slate-700/60 px-2 py-0.5 rounded-full text-[9px] font-bold text-slate-200 flex items-center gap-0.5 uppercase tracking-wider">
                    <MapPin className="w-2.5 h-2.5 text-rose-500" />
                    {comm.city || 'National'}
                  </div>
                  {isCreator && (
                    <div className="absolute top-3 right-3 bg-indigo-600/90 text-white font-extrabold text-[8px] px-2 py-0.5 rounded uppercase tracking-wider">
                      Organizer
                    </div>
                  )}
                </div>

                <div className="p-5 flex-1 flex flex-col justify-between space-y-4">
                  <div className="space-y-2">
                    <h3 className="text-sm font-bold text-white leading-tight">{comm.name}</h3>
                    <p className="text-slate-400 text-[11px] leading-relaxed line-clamp-3">
                      {comm.description || 'Join this local support community of the campaign to organize offline assemblies.'}
                    </p>
                  </div>

                  <div className="flex items-center justify-between text-xs pt-2 border-t border-slate-800/60">
                    <span className="text-slate-400 text-[10px] flex items-center gap-1">
                      <Users className="w-3.5 h-3.5 text-indigo-400" />
                      {comm.member_count.toLocaleString()} members
                    </span>

                    {!user ? (
                      <span className="text-[10px] text-slate-500 italic">Login to join</span>
                    ) : isJoined ? (
                      <button
                        onClick={() => handleOpenConsole(comm)}
                        className="px-3.5 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg text-xs font-semibold active:scale-95 transition-all shadow-md cursor-pointer flex items-center gap-1"
                      >
                        <MessageSquare className="w-3.5 h-3.5" />
                        Enter Community
                      </button>
                    ) : isPending ? (
                      <button
                        disabled
                        className="px-3.5 py-1.5 bg-slate-800 border border-slate-700/50 text-slate-500 rounded-lg text-xs font-semibold cursor-not-allowed"
                      >
                        Request Pending
                      </button>
                    ) : (
                      <button
                        onClick={() => handleSendJoinRequest(comm.id)}
                        className="px-3.5 py-1.5 bg-indigo-600 hover:bg-indigo-500 text-white rounded-lg text-xs font-semibold active:scale-95 transition-all shadow-md cursor-pointer"
                      >
                        Request to Join
                      </button>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* CREATE COMMUNITY CREATOR MODAL */}
      {showCreator && (
        <div className="fixed inset-0 z-50 bg-black/75 backdrop-blur-md flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl max-w-md w-full p-6 space-y-4 relative shadow-2xl animate-scale-up">
            <button 
              onClick={() => setShowCreator(false)} 
              className="absolute top-4 right-4 text-slate-400 hover:text-white cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
            
            <div className="text-center">
              <h3 className="text-lg font-bold text-white">Create Local Community</h3>
              <p className="text-slate-400 text-xs mt-1">Found a regional action community supporting Sonam Wangchuk (+100 pts).</p>
            </div>

            {creatorError && (
              <div className="bg-red-500/10 border border-red-500/20 text-red-400 text-xs p-3 rounded-lg text-center">
                {creatorError}
              </div>
            )}

            <form onSubmit={handleCreateCommunity} className="space-y-4 text-xs">
              <div>
                <label className="block text-[10px] font-semibold text-slate-400 uppercase tracking-wider mb-1">
                  Community Name
                </label>
                <input
                  type="text"
                  required
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full bg-slate-800/40 border border-slate-700 text-white rounded-lg px-3 py-2 text-xs focus:outline-none focus:border-indigo-500"
                  placeholder="e.g. Pune Campaign Volunteers"
                />
              </div>

              <div>
                <label className="block text-[10px] font-semibold text-slate-400 uppercase tracking-wider mb-1">
                  Description
                </label>
                <textarea
                  required
                  rows={3}
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  className="w-full bg-slate-800/40 border border-slate-700 text-white rounded-lg p-3 text-xs focus:outline-none resize-none focus:border-indigo-500"
                  placeholder="What is the goal of this community?"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-[10px] font-semibold text-slate-400 uppercase tracking-wider mb-1">
                    City / Location
                  </label>
                  <input
                    type="text"
                    required
                    value={city}
                    onChange={(e) => setCity(e.target.value)}
                    className="w-full bg-slate-800/40 border border-slate-700 text-white rounded-lg px-3 py-2 text-xs focus:outline-none focus:border-indigo-500"
                    placeholder="Pune"
                  />
                </div>

                <div>
                  <label className="block text-[10px] font-semibold text-slate-400 uppercase tracking-wider mb-1">
                    Privacy Type
                  </label>
                  <select
                    value={type}
                    onChange={(e) => setType(e.target.value)}
                    className="w-full bg-slate-800/40 border border-slate-700 text-slate-300 rounded-lg px-3 py-2 text-xs focus:outline-none focus:border-indigo-500 cursor-pointer"
                  >
                    <option value="private">Approval Required (All Users)</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-[10px] font-semibold text-slate-400 uppercase tracking-wider mb-1">
                  Cover Image
                </label>
                <input
                  type="file"
                  accept="image/*"
                  onChange={(e) => setCoverFile(e.target.files[0])}
                  className="w-full text-slate-400 text-xs mt-1"
                />
              </div>

              <button
                type="submit"
                disabled={creatorLoading}
                className="w-full py-2.5 bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 text-white rounded-lg text-xs font-bold active:scale-95 transition-all shadow-md cursor-pointer"
              >
                {creatorLoading ? 'Creating Community...' : 'Launch Community (+100 points)'}
              </button>
            </form>
          </div>
        </div>
      )}

      {/* COMMUNITY CONSOLE MODAL (CHAT & ADMIN PANEL) */}
      {selectedCommunity && (
        <div className="fixed inset-0 z-50 bg-black/75 backdrop-blur-md flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl max-w-4xl w-full h-[85vh] flex flex-col relative shadow-2xl animate-scale-up">
            
            {/* Header */}
            <div className="p-4 border-b border-slate-800/80 flex justify-between items-center bg-slate-950/25 rounded-t-2xl">
              <div>
                <h3 className="text-sm font-bold text-white uppercase tracking-widest flex items-center gap-1.5">
                  <Users className="w-4 h-4 text-indigo-400" />
                  {selectedCommunity.name}
                </h3>
                <span className="text-[10px] text-slate-400 mt-0.5 block">{selectedCommunity.city} Community Hub</span>
              </div>
              <button 
                onClick={() => setSelectedCommunity(null)} 
                className="p-1 rounded-full bg-slate-800/40 text-slate-400 hover:text-white cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Tabs */}
            <div className="flex border-b border-slate-800 bg-slate-950/10 px-4 text-xs">
              <button
                onClick={() => setActiveConsoleTab('chat')}
                className={`px-4 py-2.5 font-bold transition-all border-b-2 cursor-pointer ${
                  activeConsoleTab === 'chat' ? 'border-indigo-500 text-indigo-450' : 'border-transparent text-slate-400 hover:text-slate-200'
                }`}
              >
                Chat Messages
              </button>
              <button
                onClick={() => setActiveConsoleTab('members')}
                className={`px-4 py-2.5 font-bold transition-all border-b-2 cursor-pointer ${
                  activeConsoleTab === 'members' ? 'border-indigo-500 text-indigo-450' : 'border-transparent text-slate-400 hover:text-slate-200'
                }`}
              >
                Members ({membersList.length})
              </button>
              {selectedCommunity.created_by === user?.id && (
                <button
                  onClick={() => setActiveConsoleTab('requests')}
                  className={`px-4 py-2.5 font-bold transition-all border-b-2 cursor-pointer flex items-center gap-1 ${
                    activeConsoleTab === 'requests' ? 'border-indigo-500 text-indigo-450' : 'border-transparent text-slate-400 hover:text-slate-200'
                  }`}
                >
                  Join Requests
                  {joinRequests.length > 0 && (
                    <span className="bg-red-500 text-white font-extrabold text-[8px] px-1.5 py-0.5 rounded-full">
                      {joinRequests.length}
                    </span>
                  )}
                </button>
              )}
            </div>

            {/* Content Body */}
            <div className="flex-1 overflow-hidden flex flex-col p-4">
              
              {/* CHAT TAB */}
              {activeConsoleTab === 'chat' && (
                <div className="flex-1 flex flex-col overflow-hidden justify-between space-y-3">
                  
                  {/* Warning label */}
                  <div className="bg-indigo-950/20 border border-indigo-500/25 px-3 py-2 rounded-xl flex items-center gap-2 text-indigo-400 text-[10px] font-bold">
                    <Clock className="w-4 h-4 text-indigo-400 animate-pulse flex-shrink-0" />
                    <span>💬 Ephemeral Chat Room: Messages, images, and videos posted here automatically expire and are deleted within 24 hours.</span>
                  </div>

                  {/* Messages container */}
                  <div className="flex-1 overflow-y-auto space-y-3 custom-scrollbar pr-1">
                    {chatMessages.length > 0 ? (
                      chatMessages.map((msg) => {
                        const isSelf = msg.user_id === user?.id;
                        return (
                          <div key={msg.id} className={`flex gap-3 max-w-[85%] ${isSelf ? 'ml-auto flex-row-reverse' : 'mr-auto'}`}>
                            {/* Avatar */}
                            <div className="w-8 h-8 rounded-full flex items-center justify-center font-bold text-[10px] uppercase bg-slate-800 border border-slate-700/60 flex-shrink-0 overflow-hidden">
                              {msg.sender_avatar ? (
                                <img src={`${API_URL}${msg.sender_avatar}`} alt={msg.sender_name} className="w-full h-full object-cover" />
                              ) : (
                                msg.sender_name ? msg.sender_name.charAt(0) : 'U'
                              )}
                            </div>

                            {/* Bubble */}
                            <div className="space-y-1">
                              <div className={`text-[9px] text-slate-505 font-bold ${isSelf ? 'text-right' : ''}`}>
                                {msg.sender_name} • {new Date(msg.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                              </div>

                              <div className="flex items-center gap-2 group">
                                {!isSelf && (msg.user_id === user?.id || selectedCommunity.created_by === user?.id) && (
                                  <button
                                    onClick={() => handleDeleteMessage(msg.id)}
                                    className="p-1 rounded bg-slate-850 hover:bg-red-500/20 text-slate-400 hover:text-red-400 opacity-0 group-hover:opacity-100 transition-all cursor-pointer"
                                    title="Delete message"
                                  >
                                    <Trash2 className="w-3.5 h-3.5" />
                                  </button>
                                )}

                                <div className={`p-3 rounded-2xl border text-xs leading-relaxed ${
                                  isSelf 
                                    ? 'bg-indigo-600 border-indigo-550 text-white rounded-tr-none' 
                                    : 'bg-slate-850 border-slate-800 text-slate-100 rounded-tl-none'
                                }`}>
                                  {msg.message && <p>{msg.message}</p>}

                                  {/* Render images */}
                                  {msg.media_type === 'image' && msg.media_url && (
                                    <div className="rounded-lg overflow-hidden border border-black/25 mt-2 max-w-xs">
                                      <img src={`${API_URL}${msg.media_url}`} alt="Chat Attachment" className="w-full object-contain" />
                                    </div>
                                  )}

                                  {/* Render videos */}
                                  {msg.media_type === 'video' && msg.media_url && (
                                    <div className="rounded-lg overflow-hidden border border-black/25 mt-2 max-w-xs bg-black">
                                      <video src={`${API_URL}${msg.media_url}`} controls className="w-full max-h-48 object-contain" />
                                    </div>
                                  )}
                                </div>

                                {isSelf && (msg.user_id === user?.id || selectedCommunity.created_by === user?.id) && (
                                  <button
                                    onClick={() => handleDeleteMessage(msg.id)}
                                    className="p-1 rounded bg-slate-850 hover:bg-red-500/20 text-slate-400 hover:text-red-400 opacity-0 group-hover:opacity-100 transition-all cursor-pointer"
                                    title="Delete message"
                                  >
                                    <Trash2 className="w-3.5 h-3.5" />
                                  </button>
                                )}
                              </div>
                            </div>
                          </div>
                        );
                      })
                    ) : (
                      <div className="h-full flex flex-col items-center justify-center text-slate-500 text-xs italic space-y-2">
                        <MessageSquare className="w-8 h-8 text-slate-600" />
                        <span>No messages yet. Send a message to start conversation!</span>
                      </div>
                    )}
                    <div ref={messagesEndRef} />
                  </div>

                  {/* Send Form */}
                  <form onSubmit={handleSendChatMessage} className="border-t border-slate-800/85 pt-3 flex gap-2 items-center">
                    
                    {/* Media File Attachment trigger */}
                    <div className="relative">
                      <input
                        type="file"
                        id="chatMediaFile"
                        accept="image/*,video/*"
                        onChange={(e) => setAttachedFile(e.target.files[0])}
                        className="hidden"
                      />
                      <label
                        htmlFor="chatMediaFile"
                        className={`p-2 rounded-xl border flex items-center justify-center cursor-pointer transition-all active:scale-95 ${
                          attachedFile 
                            ? 'bg-emerald-500/10 border-emerald-500/40 text-emerald-400' 
                            : 'bg-slate-900 border-slate-800 text-slate-400 hover:text-white'
                        }`}
                        title="Attach image/video"
                      >
                        <Paperclip className="w-4.5 h-4.5" />
                      </label>
                    </div>

                    {/* Typed Message Input */}
                    <input
                      type="text"
                      value={typedMessage}
                      onChange={(e) => setTypedMessage(e.target.value)}
                      placeholder={attachedFile ? `Media attached: ${attachedFile.name}` : "Send text or media..."}
                      className="flex-1 bg-slate-950 border border-slate-800 text-white rounded-xl px-3 py-2 text-xs focus:outline-none focus:border-indigo-500"
                    />

                    {/* Submit Button */}
                    <button
                      type="submit"
                      disabled={sendingMessage}
                      className="p-2 bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 text-white rounded-xl active:scale-95 transition-all cursor-pointer flex items-center justify-center"
                    >
                      {sendingMessage ? (
                        <Loader className="w-4 h-4 animate-spin" />
                      ) : (
                        <Send className="w-4.5 h-4.5" />
                      )}
                    </button>
                  </form>
                </div>
              )}

              {/* MEMBERS TAB */}
              {activeConsoleTab === 'members' && (
                <div className="flex-1 overflow-y-auto space-y-2 pr-1">
                  <h4 className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">Approved Members List</h4>
                  {membersLoading ? (
                    <div className="flex justify-center p-8">
                      <div className="w-6 h-6 border-2 border-indigo-500 border-t-transparent rounded-full animate-spin"></div>
                    </div>
                  ) : membersList.length === 0 ? (
                    <div className="text-center py-8 text-slate-500 text-xs italic">Only you are in this community.</div>
                  ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3 pt-1">
                      {membersList.map((memb, idx) => (
                        <div key={idx} className="flex justify-between items-center p-3 bg-slate-900 border border-slate-800/80 rounded-xl">
                          <div className="flex items-center gap-2">
                            <div className="w-7 h-7 bg-slate-800 rounded-full flex items-center justify-center font-bold text-[10px] text-indigo-400 overflow-hidden">
                              {memb.avatar_url ? (
                                <img src={`${API_URL}${memb.avatar_url}`} alt={memb.name} className="w-full h-full object-cover" />
                              ) : (
                                memb.name.charAt(0)
                              )}
                            </div>
                            <div>
                              <span className="text-slate-200 text-xs font-bold block">{memb.name}</span>
                              <span className="text-[9px] text-slate-505 block">{memb.city || 'Leh'}</span>
                            </div>
                          </div>
                          <span className={`text-[8px] px-2 py-0.5 rounded uppercase font-black tracking-wider ${
                            memb.role === 'admin' 
                              ? 'bg-amber-500/10 text-amber-400 border border-amber-500/20' 
                              : 'bg-indigo-500/10 text-indigo-455 border border-indigo-500/15'
                          }`}>
                            {memb.role === 'admin' ? 'Organizer' : 'Member'}
                          </span>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}

              {/* REQUESTS TAB (ADMINS ONLY) */}
              {activeConsoleTab === 'requests' && (
                <div className="flex-1 overflow-y-auto space-y-2 pr-1">
                  <h4 className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">Pending Join Requests</h4>
                  
                  {requestsLoading ? (
                    <div className="flex justify-center p-8">
                      <div className="w-6 h-6 border-2 border-indigo-500 border-t-transparent rounded-full animate-spin"></div>
                    </div>
                  ) : joinRequests.length === 0 ? (
                    <div className="text-center py-12 text-slate-505 text-xs italic bg-slate-900/40 border border-slate-800/55 rounded-2xl">
                      No pending requests. All joining requests are resolved!
                    </div>
                  ) : (
                    <div className="space-y-3 pt-1">
                      {joinRequests.map((req) => (
                        <div key={req.user_id} className="flex justify-between items-center p-4 bg-slate-900 border border-slate-800 rounded-xl">
                          <div className="flex items-center gap-3">
                            <div className="w-8 h-8 bg-slate-800 rounded-full flex items-center justify-center font-bold text-xs text-indigo-400 overflow-hidden">
                              {req.avatar_url ? (
                                <img src={`${API_URL}${req.avatar_url}`} alt={req.name} className="w-full h-full object-cover" />
                              ) : (
                                req.name.charAt(0)
                              )}
                            </div>
                            <div>
                              <span className="text-slate-200 text-xs font-bold block">{req.name}</span>
                              <span className="text-[10px] text-slate-400 block">{req.email}</span>
                            </div>
                          </div>

                          <div className="flex gap-2">
                            <button
                              onClick={() => handleResolveJoinRequest(selectedCommunity.id, req.user_id, 'approve')}
                              className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg text-[10px] font-bold flex items-center gap-1 active:scale-95 transition-all cursor-pointer"
                            >
                              <UserCheck className="w-3.5 h-3.5" />
                              Approve
                            </button>
                            <button
                              onClick={() => handleResolveJoinRequest(selectedCommunity.id, req.user_id, 'decline')}
                              className="px-3 py-1.5 bg-red-600 hover:bg-red-500 text-white rounded-lg text-[10px] font-bold flex items-center gap-1 active:scale-95 transition-all cursor-pointer"
                            >
                              <UserX className="w-3.5 h-3.5" />
                              Decline
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}

            </div>
          </div>
        </div>
      )}

    </div>
  );
};

export default Communities;
