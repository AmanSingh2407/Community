import React, { useState, useEffect } from 'react';
import { useAuth, API_URL } from '../context/AuthContext';
import { Award, Zap, Trophy, MapPin, Globe, X, ArrowRight, BookOpen } from 'lucide-react';

const Rewards = ({ onNavigate }) => {
  const { user, getToken } = useAuth();
  const [badges, setBadges] = useState([]);
  const [leaderboard, setLeaderboard] = useState([]);
  const [leaderboardScope, setLeaderboardScope] = useState('global');
  const [leaderboardLoading, setLeaderboardLoading] = useState(false);
  const [selectedBadge, setSelectedBadge] = useState(null);

  // Computes progress details
  const getProgressDetails = () => {
    const points = user?.points || 0;
    if (points >= 2000) {
      return { current: 'Diamond', next: 'Max Rank Reached', progress: 100, pointsNeeded: 0 };
    } else if (points >= 1500) {
      const needed = 2000 - points;
      const pct = ((points - 1500) / 500) * 100;
      return { current: 'Gold', next: 'Diamond', progress: pct, pointsNeeded: needed };
    } else if (points >= 1000) {
      const needed = 1500 - points;
      const pct = ((points - 1000) / 500) * 100;
      return { current: 'Silver', next: 'Gold', progress: pct, pointsNeeded: needed };
    } else if (points >= 500) {
      const needed = 1000 - points;
      const pct = ((points - 500) / 500) * 100;
      return { current: 'Bronze', next: 'Silver', progress: pct, pointsNeeded: needed };
    } else {
      const needed = 500 - points;
      const pct = (points / 500) * 100;
      return { current: 'Supporter', next: 'Bronze', progress: pct, pointsNeeded: needed };
    }
  };

  const { current, next, progress, pointsNeeded } = getProgressDetails();

  const fetchLeaderboard = async (scope = leaderboardScope) => {
    setLeaderboardLoading(true);
    try {
      const token = getToken();
      let url = `${API_URL}/api/gamification/leaderboard`;
      if (scope === 'city' && user.city) {
        url += `?city=${encodeURIComponent(user.city)}`;
      }
      const res = await fetch(url, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      const data = await res.json();
      if (data.success) {
        const enriched = (data.leaderboard || []).map(u => ({
          ...u,
          avatar_letter: u.name.charAt(0)
        }));
        setLeaderboard(enriched);
      }
    } catch (err) {
      console.error('Failed to load leaderboard:', err);
    } finally {
      setLeaderboardLoading(false);
    }
  };

  const fetchBadgesData = async () => {
    try {
      const token = getToken();
      
      const resAll = await fetch(`${API_URL}/api/gamification/badges`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      const dataAll = await resAll.json();
      
      const resUser = await fetch(`${API_URL}/api/gamification/user/${user.id}`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      const dataUser = await resUser.json();

      if (dataAll.success && dataUser.success) {
        const earnedNames = (dataUser.badges || []).map(b => b.name);
        const mapped = (dataAll.badges || []).map(badge => ({
          ...badge,
          icon: badge.id === 'b1' ? '✊' : badge.id === 'b2' ? '📢' : badge.id === 'b3' ? '🤝' : '🛡️',
          desc: badge.id === 'b1' ? 'Pledged support in the first week.' : badge.id === 'b2' ? 'Uploaded 5 or more video vlogs.' : badge.id === 'b3' ? 'Referred 10 or more supporters.' : 'Reached 5000+ points.',
          earned: earnedNames.includes(badge.name) || badge.id === 'b1'
        }));
        setBadges(mapped);
      }
    } catch (err) {
      console.error('Failed to load badges data:', err);
    }
  };

  useEffect(() => {
    fetchLeaderboard(leaderboardScope);
    fetchBadgesData();
  }, [leaderboardScope, user]);

  const handleBadgeAction = (badge) => {
    setSelectedBadge(null);
    if (!onNavigate) return;

    if (badge.id === 'b1') {
      onNavigate('home'); // Support Now is on home page
    } else if (badge.id === 'b2') {
      onNavigate('vlogs'); // Upload vlogs is on vlogs page
    } else if (badge.id === 'b3') {
      onNavigate('communities'); // Chapter invite links are on community page
    } else if (badge.id === 'b4') {
      onNavigate('home'); // points increase
    }
  };

  return (
    <div className="space-y-6">
      {/* 1. TIER PROGRESS CARD */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-xl relative overflow-hidden">
        <div className="absolute top-0 right-0 w-32 h-32 bg-amber-500/10 rounded-full blur-3xl -mr-8 -mt-8"></div>
        
        <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="space-y-2 text-center sm:text-left">
            <span className="text-[10px] text-amber-400 uppercase tracking-widest font-bold flex items-center justify-center sm:justify-start gap-1">
              <Zap className="w-3.5 h-3.5 fill-amber-400/20" />
              Campaign Supporter Rank
            </span>
            <h2 className="text-2xl font-extrabold text-white flex items-center justify-center sm:justify-start gap-2">
              {current} Tier
            </h2>
            <p className="text-xs text-slate-400 max-w-sm">
              {pointsNeeded > 0 
                ? `Accumulate ${pointsNeeded.toLocaleString()} more points to advance to the ${next} rank.` 
                : 'Congratulations! You have achieved the highest rank.'}
            </p>
          </div>

          <div className="text-center bg-slate-950/40 border border-slate-850 px-6 py-4 rounded-xl flex-shrink-0">
            <span className="text-[10px] text-slate-500 font-bold uppercase tracking-wider">Total Score</span>
            <div className="text-3xl font-extrabold text-white tabular-nums">{user?.points}</div>
            <span className="text-[10px] text-indigo-400 font-semibold">points</span>
          </div>
        </div>

        {/* Progress Bar */}
        <div className="mt-6 space-y-1.5">
          <div className="flex justify-between text-[10px] font-bold text-slate-400">
            <span>{current.toUpperCase()}</span>
            <span>{next.toUpperCase()}</span>
          </div>
          <div className="w-full h-2.5 bg-slate-950 rounded-full border border-slate-850 overflow-hidden">
            <div 
              className="h-full bg-gradient-to-r from-indigo-500 to-amber-500 rounded-full transition-all duration-1000"
              style={{ width: `${progress}%` }}
            ></div>
          </div>
        </div>
      </div>

      {/* 2. BADGES ARCHIVE */}
      <div className="space-y-3">
        <h3 className="text-sm font-bold text-slate-300 uppercase tracking-wider flex items-center gap-1.5">
          <Award className="w-4 h-4 text-indigo-400" />
          Milestone Badges
        </h3>
        
        {badges.length === 0 ? (
          <div className="bg-slate-900 border border-slate-800 rounded-xl p-6 text-center text-slate-500 text-xs italic">
            Loading badges...
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {badges.map((badge) => (
              <button 
                key={badge.id} 
                onClick={() => setSelectedBadge(badge)}
                className={`border rounded-xl p-4 flex gap-4 transition-all shadow-sm text-left hover:scale-[1.01] active:scale-95 duration-250 cursor-pointer ${
                  badge.earned 
                    ? 'bg-slate-900 border-slate-800 hover:border-slate-700/80' 
                    : 'bg-slate-900/30 border-slate-900/50 hover:border-slate-800/40 opacity-60'
                }`}
              >
                <div className="w-12 h-12 bg-slate-950 border border-slate-850 rounded-xl flex items-center justify-center text-2xl flex-shrink-0">
                  {badge.icon}
                </div>
                <div className="space-y-1 overflow-hidden">
                  <h4 className="text-xs font-bold text-white flex items-center gap-1.5">
                    {badge.name}
                    {badge.earned && <span className="text-[8px] px-1.5 py-0.5 bg-emerald-500/10 text-emerald-400 rounded-full border border-emerald-500/20">Earned</span>}
                  </h4>
                  <p className="text-[10px] text-slate-400 leading-relaxed truncate">{badge.desc}</p>
                </div>
              </button>
            ))}
          </div>
        )}
      </div>

      {/* 3. LEADERBOARD LIST */}
      <div className="space-y-3">
        <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-3">
          <h3 className="text-sm font-bold text-slate-300 uppercase tracking-wider flex items-center gap-1.5">
            <Trophy className="w-4 h-4 text-amber-400" />
            Top Activist Leaderboard
          </h3>

          <div className="flex border border-slate-800 bg-slate-900/80 rounded-lg p-0.5 max-w-xs self-start text-[10px]">
            <button
              onClick={() => setLeaderboardScope('global')}
              className={`px-3 py-1 rounded font-semibold flex items-center gap-1 transition-colors ${
                leaderboardScope === 'global' ? 'bg-indigo-600 text-white' : 'text-slate-400 hover:text-white'
              }`}
            >
              <Globe className="w-3 h-3" />
              Global
            </button>
            <button
              onClick={() => setLeaderboardScope('city')}
              className={`px-3 py-1 rounded font-semibold flex items-center gap-1 transition-colors ${
                leaderboardScope === 'city' ? 'bg-indigo-600 text-white' : 'text-slate-400 hover:text-white'
              }`}
            >
              <MapPin className="w-3 h-3" />
              City ({user.city || 'Leh'})
            </button>
          </div>
        </div>

        <div className="bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden shadow-md">
          {leaderboardLoading ? (
            <div className="flex justify-center p-12">
              <div className="w-6 h-6 border-2 border-indigo-500 border-t-transparent rounded-full animate-spin"></div>
            </div>
          ) : leaderboard.length === 0 ? (
            <div className="bg-slate-900 border border-slate-800 rounded-xl p-6 text-center text-slate-500 text-xs italic">
              Leaderboard is empty. Be the first to pledge support and score!
            </div>
          ) : (
            <div className="divide-y divide-slate-850">
              {leaderboard.map((item, index) => {
                const isMe = item.id === user.id;
                return (
                  <div 
                    key={item.id} 
                    className={`flex items-center justify-between px-5 py-3.5 transition-colors ${
                      isMe ? 'bg-indigo-500/5' : 'hover:bg-slate-850/40'
                    }`}
                  >
                    <div className="flex items-center gap-4">
                      <span className={`w-5 text-center text-xs font-bold ${
                        index === 0 ? 'text-amber-400' : index === 1 ? 'text-slate-300' : index === 2 ? 'text-amber-600' : 'text-slate-500'
                      }`}>
                        #{index + 1}
                      </span>
                      
                      <div className="w-8 h-8 bg-slate-800 border border-slate-700/60 rounded-full flex items-center justify-center font-bold text-xs text-indigo-300">
                        {item.avatar_letter}
                      </div>

                      <div>
                        <h4 className="text-xs font-bold text-white flex items-center gap-1.5">
                          {item.name}
                          {isMe && <span className="text-[8px] bg-indigo-600 text-white px-1.5 py-0.5 rounded-full">You</span>}
                        </h4>
                        <span className="text-[9px] text-slate-500 flex items-center gap-0.5">
                          <MapPin className="w-2.5 h-2.5" />
                          {item.city}
                        </span>
                      </div>
                    </div>

                    <div className="text-right">
                      <div className="text-xs font-extrabold text-white tabular-nums">{item.points.toLocaleString()}</div>
                      <span className="text-[8px] uppercase tracking-wider font-semibold text-amber-500">{item.rank_tier}</span>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>

      {/* DETAIL BADGE MODAL POPUP */}
      {selectedBadge && (
        <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl max-w-sm w-full p-6 space-y-5 relative shadow-2xl animate-fade-in">
            <button 
              onClick={() => setSelectedBadge(null)} 
              className="absolute top-4 right-4 text-slate-400 hover:text-white"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="flex flex-col items-center text-center space-y-3">
              <div className="w-20 h-20 bg-slate-950 border border-slate-800 rounded-2xl flex items-center justify-center text-5xl shadow-inner">
                {selectedBadge.icon}
              </div>
              <div>
                <h3 className="text-base font-bold text-white uppercase tracking-wider">{selectedBadge.name}</h3>
                <span className={`text-[9px] px-2 py-0.5 rounded-full font-bold uppercase tracking-wider ${
                  selectedBadge.earned 
                    ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20' 
                    : 'bg-amber-500/10 text-amber-400 border border-amber-500/20'
                }`}>
                  {selectedBadge.earned ? '✓ Unlocked' : '🔒 Locked'}
                </span>
              </div>
            </div>

            <div className="bg-slate-950/60 border border-slate-850 p-4 rounded-xl space-y-2 text-xs">
              <span className="text-[9px] font-bold text-slate-500 uppercase tracking-widest block">Requirements:</span>
              <p className="text-slate-300 font-medium leading-relaxed">{selectedBadge.desc}</p>
              
              <div className="pt-2 border-t border-slate-850 flex justify-between items-center text-[10px] text-slate-400">
                <span>Your Current Progress:</span>
                <span className="font-bold text-white">
                  {selectedBadge.id === 'b1' 
                    ? 'Completed' 
                    : selectedBadge.id === 'b4' 
                      ? `${user.points} / 5000 pts` 
                      : selectedBadge.earned 
                        ? '100% Completed' 
                        : 'In Progress'}
                </span>
              </div>
            </div>

            <button
              onClick={() => handleBadgeAction(selectedBadge)}
              className="w-full flex items-center justify-center gap-1.5 py-2.5 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl text-xs font-bold active:scale-95 transition-all shadow-md"
            >
              {selectedBadge.earned ? 'Explore Feature' : 'Go Start Challenge'}
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default Rewards;
