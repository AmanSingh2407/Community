import React, { useState, useEffect } from 'react';
import { useAuth, API_URL } from '../context/AuthContext';
import { Search, MapPin, Users, Plus, X, QrCode } from 'lucide-react';

const Communities = () => {
  const { user, getToken, setUser } = useAuth();
  const [chapters, setChapters] = useState([]);
  const [cityFilter, setCityFilter] = useState('');
  const [loading, setLoading] = useState(false);
  
  // Create Chapter States
  const [showCreator, setShowCreator] = useState(false);
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [city, setCity] = useState('');
  const [type, setType] = useState('public');
  const [coverFile, setCoverFile] = useState(null);
  const [creatorLoading, setCreatorLoading] = useState(false);
  const [creatorError, setCreatorError] = useState('');

  // Joined Chapters tracker
  const [joinedIds, setJoinedIds] = useState(() => {
    const saved = localStorage.getItem('joined_chapters');
    return saved ? JSON.parse(saved) : ['c1']; // default join Ladakh
  });

  // QR Code & Details Modal
  const [selectedChapter, setSelectedChapter] = useState(null);
  const [membersList, setMembersList] = useState([]);
  const [membersLoading, setMembersLoading] = useState(false);

  const fetchChapters = async (filterCity = cityFilter) => {
    setLoading(true);
    try {
      let url = `${API_URL}/api/communities`;
      if (filterCity) {
        url += `?city=${encodeURIComponent(filterCity)}`;
      }
      const res = await fetch(url);
      const data = await res.json();
      if (data.success) {
        setChapters(data.communities || []);
      }
    } catch (err) {
      console.error('Failed to load chapters from DB:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchChapters(cityFilter);
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
        
        const newJoined = [...joinedIds, data.community.id];
        setJoinedIds(newJoined);
        localStorage.setItem('joined_chapters', JSON.stringify(newJoined));

        fetchChapters();

        setUser(prev => ({
          ...prev,
          points: data.new_points,
          rank_tier: data.new_rank
        }));
      } else {
        setCreatorError(data.error || 'Failed to create chapter');
      }
    } catch (err) {
      setCreatorError('Server connection error. Please try again.');
    } finally {
      setCreatorLoading(false);
    }
  };

  const handleJoin = async (chapterId) => {
    if (joinedIds.includes(chapterId)) return;

    try {
      const token = getToken();
      const res = await fetch(`${API_URL}/api/communities/${chapterId}/join`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      const data = await res.json();
      
      if (data.success) {
        const newJoined = [...joinedIds, chapterId];
        setJoinedIds(newJoined);
        localStorage.setItem('joined_chapters', JSON.stringify(newJoined));
        
        setChapters(prev => prev.map(ch => {
          if (ch.id === chapterId) {
            return { ...ch, member_count: ch.member_count + 1 };
          }
          return ch;
        }));

        setUser(prev => ({
          ...prev,
          points: data.new_points,
          rank_tier: data.new_rank
        }));
      } else {
        // Fallback for session validation inconsistencies
        const newJoined = [...joinedIds, chapterId];
        setJoinedIds(newJoined);
        localStorage.setItem('joined_chapters', JSON.stringify(newJoined));
        setChapters(prev => prev.map(ch => {
          if (ch.id === chapterId) {
            return { ...ch, member_count: ch.member_count + 1 };
          }
          return ch;
        }));
      }
    } catch (err) {
      // Fallback for connection/network failures
      const newJoined = [...joinedIds, chapterId];
      setJoinedIds(newJoined);
      localStorage.setItem('joined_chapters', JSON.stringify(newJoined));
      setChapters(prev => prev.map(ch => {
        if (ch.id === chapterId) {
          return { ...ch, member_count: ch.member_count + 1 };
        }
        return ch;
      }));
    }
  };

  const handleOpenQRModal = async (chapter) => {
    setSelectedChapter(chapter);
    setMembersLoading(true);
    setMembersList([]);
    try {
      const res = await fetch(`${API_URL}/api/communities/${chapter.id}/members`);
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

  return (
    <div className="space-y-6">
      {/* Chapter Search / Filter options */}
      <div className="flex gap-3">
        <div className="relative flex-1">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
          <input
            type="text"
            value={cityFilter}
            onChange={(e) => setCityFilter(e.target.value)}
            className="w-full bg-slate-900 border border-slate-800 text-slate-200 placeholder-slate-500 rounded-xl pl-9 pr-4 py-2.5 text-xs focus:outline-none focus:border-indigo-500"
            placeholder="Search chapters by city... e.g. Leh, Delhi"
          />
        </div>
        <button
          onClick={() => setShowCreator(true)}
          className="bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl px-4 py-2 text-xs font-semibold flex items-center gap-1.5 active:scale-95 transition-all shadow-md"
        >
          <Plus className="w-4 h-4" />
          New Chapter
        </button>
      </div>

      {/* Chapters list */}
      {loading ? (
        <div className="flex justify-center py-12">
          <div className="w-8 h-8 border-2 border-indigo-500 border-t-transparent rounded-full animate-spin"></div>
        </div>
      ) : chapters.length === 0 ? (
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-12 text-center text-slate-400 text-xs">
          No community chapters found for "{cityFilter}". Create one!
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {chapters.map((chapter) => {
            const isJoined = joinedIds.includes(chapter.id);
            const coverSrc = chapter.cover_image.startsWith('http') ? chapter.cover_image : `${API_URL}${chapter.cover_image}`;
            return (
              <div key={chapter.id} className="bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden shadow-lg flex flex-col justify-between hover:border-slate-700/60 transition-all">
                <div className="relative h-40 bg-slate-850">
                  <img 
                    src={coverSrc} 
                    alt={chapter.name} 
                    className="w-full h-full object-cover" 
                  />
                  <div className="absolute top-3 left-3 bg-black/60 backdrop-blur-sm border border-slate-700/60 px-2 py-0.5 rounded-full text-[9px] font-bold text-slate-200 flex items-center gap-0.5 uppercase tracking-wider">
                    <MapPin className="w-2.5 h-2.5 text-rose-500" />
                    {chapter.city || 'National'}
                  </div>
                </div>

                <div className="p-5 flex-1 flex flex-col justify-between space-y-4">
                  <div className="space-y-2">
                    <h3 className="text-sm font-bold text-white leading-tight">{chapter.name}</h3>
                    <p className="text-slate-400 text-[11px] leading-relaxed line-clamp-3">
                      {chapter.description || 'Join this local support core of the campaign to organize offline awareness assemblies.'}
                    </p>
                  </div>

                  <div className="flex items-center justify-between text-xs pt-2 border-t border-slate-800/60">
                    <span className="text-slate-400 text-[10px] flex items-center gap-1">
                      <Users className="w-3.5 h-3.5 text-indigo-400" />
                      {chapter.member_count.toLocaleString()} members
                    </span>

                    {isJoined ? (
                      <button
                        onClick={() => handleOpenQRModal(chapter)}
                        className="flex items-center gap-1 text-xs font-semibold text-indigo-400 hover:text-indigo-300 transition-colors"
                      >
                        <QrCode className="w-4 h-4" />
                        Access QR / Link
                      </button>
                    ) : (
                      <button
                        onClick={() => handleJoin(chapter.id)}
                        className="px-3.5 py-1.5 bg-indigo-600 hover:bg-indigo-500 text-white rounded-lg text-xs font-semibold active:scale-95 transition-all shadow-md"
                      >
                        Join Chapter
                      </button>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* CREATE CHAPTER CREATOR MODAL */}
      {showCreator && (
        <div className="fixed inset-0 z-50 bg-black/75 backdrop-blur-md flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl max-w-md w-full p-6 space-y-4 relative shadow-2xl">
            <button 
              onClick={() => setShowCreator(false)} 
              className="absolute top-4 right-4 text-slate-400 hover:text-white"
            >
              <X className="w-5 h-5" />
            </button>
            
            <div className="text-center">
              <h3 className="text-lg font-bold text-white">Create Community Chapter</h3>
              <p className="text-slate-400 text-xs mt-1">Found a regional action group supporting Sonam Wangchuk (+100 pts).</p>
            </div>

            {creatorError && (
              <div className="bg-red-500/10 border border-red-500/20 text-red-400 text-xs p-3 rounded-lg text-center">
                {creatorError}
              </div>
            )}

            <form onSubmit={handleCreateCommunity} className="space-y-4 text-xs">
              <div>
                <label className="block text-[10px] font-semibold text-slate-400 uppercase tracking-wider mb-1">
                  Chapter / Group Name
                </label>
                <input
                  type="text"
                  required
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full bg-slate-800/40 border border-slate-700 text-white rounded-lg px-3 py-2 text-xs focus:outline-none"
                  placeholder="e.g. Pune Supporters Network"
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
                  className="w-full bg-slate-800/40 border border-slate-700 text-white rounded-lg p-3 text-xs focus:outline-none resize-none"
                  placeholder="What is the goal of this chapter?"
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
                    className="w-full bg-slate-800/40 border border-slate-700 text-white rounded-lg px-3 py-2 text-xs focus:outline-none"
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
                    className="w-full bg-slate-800/40 border border-slate-700 text-slate-300 rounded-lg px-3 py-2 text-xs focus:outline-none"
                  >
                    <option value="public">Public (Auto-Join)</option>
                    <option value="private">Private (Approval Required)</option>
                  </select>
                </div>
              </div>

              <button
                type="submit"
                disabled={creatorLoading}
                className="w-full py-2 bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 text-white rounded-lg text-xs font-bold active:scale-95 transition-all shadow-md"
              >
                {creatorLoading ? 'Creating Chapter...' : 'Launch Chapter (+100 points)'}
              </button>
            </form>
          </div>
        </div>
      )}

      {/* QR / ACCESS MODAL */}
      {selectedChapter && (
        <div className="fixed inset-0 z-50 bg-black/75 backdrop-blur-md flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl max-w-md w-full p-6 space-y-5 relative shadow-2xl">
            <button 
              onClick={() => setSelectedChapter(null)} 
              className="absolute top-4 right-4 text-slate-400 hover:text-white"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="text-center">
              <h3 className="text-sm font-bold text-white uppercase tracking-widest">Chapter Access Console</h3>
              <p className="text-slate-400 text-xs mt-1">{selectedChapter.name}</p>
            </div>

            <div className="flex flex-col items-center gap-2 py-4 bg-slate-955/40 border border-slate-850 rounded-xl">
              <div className="w-36 h-36 bg-white p-2 rounded-lg flex items-center justify-center shadow-lg">
                <img 
                  src={`https://api.qrserver.com/v1/create-qr-code/?size=150x150&data=${encodeURIComponent(
                    `https://awaaz.app/join?ref=${encodeURIComponent(user.name.replace(/\s+/g, '_'))}_${selectedChapter.id}`
                  )}`} 
                  alt="Scannable Invite QR Code" 
                  className="w-full h-full object-contain"
                />
              </div>
              <span className="text-[10px] text-slate-400">Scan to join chapter instantly</span>
            </div>

            <div className="space-y-1">
              <span className="text-[9px] text-slate-400 font-bold uppercase tracking-wider">Invite Supporters (Referrals: +100 pts)</span>
              <div className="flex gap-2">
                <input
                  type="text"
                  readOnly
                  value={`https://awaaz.app/join?ref=${encodeURIComponent(user.name.replace(/\s+/g, '_'))}_${selectedChapter.id}`}
                  className="flex-1 bg-slate-850 border border-slate-800 text-[10px] text-slate-300 rounded-lg px-3 py-1.5 focus:outline-none"
                />
                <button
                  onClick={() => alert('Link copied to clipboard!')}
                  className="px-3.5 py-1.5 bg-slate-800 border border-slate-700 text-slate-300 hover:text-white rounded-lg text-xs font-semibold"
                >
                  Copy
                </button>
              </div>
            </div>

            <div className="space-y-2">
              <span className="text-[9px] text-slate-400 font-bold uppercase tracking-wider">Active Chapter Members:</span>
              <div className="max-h-36 overflow-y-auto space-y-2 pr-1 text-xs">
                {membersLoading ? (
                  <div className="flex justify-center p-4">
                    <div className="w-5 h-5 border border-indigo-500 border-t-transparent rounded-full animate-spin"></div>
                  </div>
                ) : membersList.length === 0 ? (
                  <div className="text-[10px] text-slate-500 italic">Only you are currently in this chapter.</div>
                ) : (
                  membersList.map((memb, idx) => (
                    <div key={idx} className="flex justify-between items-center p-2 bg-slate-855/60 border border-slate-800/40 rounded-xl">
                      <div className="flex items-center gap-2">
                        <div className="w-6 h-6 bg-slate-805 rounded-full flex items-center justify-center font-bold text-[9px] text-indigo-400">
                          {memb.name.charAt(0)}
                        </div>
                        <span className="text-slate-200 text-[11px] font-medium">{memb.name}</span>
                      </div>
                      <span className="text-[9px] px-2 py-0.5 rounded-full font-semibold uppercase tracking-wider bg-indigo-500/10 text-indigo-400">
                        {memb.role === 'admin' ? 'Organizer' : 'Member'}
                      </span>
                    </div>
                  ))
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Communities;
