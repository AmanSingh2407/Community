import React, { useState } from 'react';
import { AuthProvider, useAuth, API_URL } from './context/AuthContext';
import Auth from './pages/Auth';
import Home from './pages/Home';
import VlogsBlogs from './pages/VlogsBlogs';
import Communities from './pages/Communities';
import Rewards from './pages/Rewards';
import AdminPanel from './pages/AdminPanel';
import Profile from './pages/Profile';
import { Home as HomeIcon, Video, Plus, Users, Award, ShieldAlert, LogOut, Loader, User, Bell, CheckCheck } from 'lucide-react';

function NotificationBell({ onNavigate }) {
  const { user } = useAuth();
  const [notifications, setNotifications] = React.useState([]);
  const [showDropdown, setShowDropdown] = React.useState(false);
  const [unreadCount, setUnreadCount] = React.useState(0);

  const fetchNotifications = async () => {
    if (!user) return;
    try {
      const token = localStorage.getItem('token');
      const res = await fetch(`${API_URL}/api/notifications`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      const data = await res.json();
      if (data.success) {
        setNotifications(data.notifications || []);
        setUnreadCount(data.notifications.filter(n => !n.is_read).length);
      }
    } catch (err) {
      console.error('Error fetching notifications:', err);
    }
  };

  React.useEffect(() => {
    fetchNotifications();
    const interval = setInterval(fetchNotifications, 10000);
    return () => clearInterval(interval);
  }, [user]);

  const handleMarkAllRead = async () => {
    try {
      const token = localStorage.getItem('token');
      await fetch(`${API_URL}/api/notifications/mark-read`, {
        method: 'PUT',
        headers: { 'Authorization': `Bearer ${token}` }
      });
      setUnreadCount(0);
      setNotifications(prev => prev.map(n => ({ ...n, is_read: true })));
    } catch (err) {
      console.error(err);
    }
  };

  if (!user) return null;

  return (
    <div className="relative">
      <button
        onClick={() => setShowDropdown(!showDropdown)}
        className="p-2 rounded-xl bg-slate-900 border border-slate-800 hover:border-slate-700 text-slate-400 hover:text-white transition-all cursor-pointer relative active:scale-95"
        title="Notifications"
      >
        <Bell className="w-4.5 h-4.5" />
        {unreadCount > 0 && (
          <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-red-500 rounded-full border border-slate-950 animate-pulse"></span>
        )}
      </button>

      {showDropdown && (
        <>
          <div 
            className="fixed inset-0 z-40" 
            onClick={() => setShowDropdown(false)}
          />
          <div className="absolute right-0 mt-2 w-80 bg-slate-900 border border-slate-800 rounded-2xl shadow-2xl p-4 z-50 space-y-3 animate-fade-in max-h-[400px] flex flex-col">
            <div className="flex items-center justify-between border-b border-slate-800/80 pb-2">
              <h4 className="text-xs font-black uppercase text-slate-400 tracking-wider">Notifications</h4>
              {unreadCount > 0 && (
                <button
                  onClick={handleMarkAllRead}
                  className="text-[10px] font-bold text-indigo-400 hover:text-indigo-300 flex items-center gap-1 cursor-pointer"
                >
                  <CheckCheck className="w-3.5 h-3.5" />
                  Mark all read
                </button>
              )}
            </div>

            <div className="overflow-y-auto space-y-2.5 flex-1 custom-scrollbar pr-1">
              {notifications.length > 0 ? (
                notifications.map((notif) => (
                  <div
                    key={notif.id}
                    onClick={() => {
                      setShowDropdown(false);
                      onNavigate('vlogs');
                    }}
                    className={`flex items-start gap-3 p-2.5 rounded-xl border transition-colors cursor-pointer text-left ${
                      notif.is_read 
                        ? 'bg-slate-950/20 border-transparent hover:bg-slate-850/30' 
                        : 'bg-indigo-600/5 border-indigo-500/10 hover:bg-indigo-600/10'
                    }`}
                  >
                    <div className="w-8 h-8 rounded-full flex items-center justify-center font-bold text-xs uppercase bg-slate-800 border border-slate-700/60 flex-shrink-0 overflow-hidden">
                      {notif.actor_avatar ? (
                        <img src={`${API_URL}${notif.actor_avatar}`} alt={notif.actor_name} className="w-full h-full object-cover" />
                      ) : (
                        notif.actor_name ? notif.actor_name.charAt(0) : 'U'
                      )}
                    </div>

                    <div className="flex-1 min-w-0">
                      <p className="text-[11px] text-slate-200 leading-normal">
                        <span className="font-bold text-white mr-1">{notif.actor_name}</span>
                        {notif.type === 'new_vlog' ? 'uploaded a new vlog post!' : 'published a new blog post!'}
                      </p>
                      <span className="block text-[9px] text-slate-500 mt-1">
                        {new Date(notif.created_at).toLocaleDateString()} at {new Date(notif.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </span>
                    </div>
                  </div>
                ))
              ) : (
                <div className="text-center py-8 text-xs text-slate-500 italic">
                  No notifications yet.
                </div>
              )}
            </div>
          </div>
        </>
      )}
    </div>
  );
}

function Dashboard() {
  const { user, logout } = useAuth();
  const [activeTab, setActiveTab] = useState('home');
  const [showCreateModal, setShowCreateModal] = useState(false);

  React.useEffect(() => {
    if (user && activeTab === 'auth') {
      setActiveTab('home');
    }
  }, [user, activeTab]);

  const renderContent = () => {
    switch (activeTab) {
      case 'home':
        return <Home onNavigate={setActiveTab} />;
      case 'vlogs':
        return <VlogsBlogs onNavigate={setActiveTab} />;
      case 'communities':
        return <Communities />;
      case 'rewards':
        return <Rewards onNavigate={setActiveTab} />;
      case 'admin':
        return <AdminPanel />;
      case 'auth':
        return <Auth />;
      case 'profile':
        return <Profile onNavigate={setActiveTab} />;
      default:
        return <Home onNavigate={setActiveTab} />;
    }
  };


  const navItems = [
    { id: 'home', label: 'Home Feed', icon: HomeIcon },
    { id: 'vlogs', label: 'Vlogs & Blogs', icon: Video },
    { id: 'communities', label: 'Local Chapters', icon: Users },
    { id: 'rewards', label: 'My Rewards', icon: Award }
  ];

  return (
    <div className="min-h-screen bg-slate-950 text-white flex flex-col md:flex-row">
      
      {/* 1. DESKTOP FIXED SIDEBAR */}
      <aside className="hidden md:flex flex-col w-64 fixed left-0 top-0 bottom-0 bg-slate-900 border-r border-slate-800/80 p-5 z-40 justify-between">
        <div className="space-y-6">
          {/* Logo & Name */}
          <div className="flex items-center gap-3 px-2 py-1">
            <img src="/logo.png" alt="Awaaz Logo" className="w-10 h-10 object-contain" />
            <div className="flex flex-col">
              <span className="text-xl font-bold bg-gradient-to-r from-indigo-400 to-amber-400 bg-clip-text text-transparent">
                Awaaz
              </span>
              <span className="text-[9px] text-slate-500 font-medium tracking-wide uppercase">
                Sonam Wangchuk Campaign
              </span>
            </div>
          </div>

          {/* Create CTA Button */}
          <button
            onClick={() => {
              if (!user) {
                setActiveTab('auth');
              } else {
                setShowCreateModal(true);
              }
            }}
            className="w-full flex items-center justify-center gap-2 py-2.5 bg-gradient-to-tr from-indigo-600 to-indigo-500 hover:from-indigo-500 hover:to-indigo-400 text-white rounded-xl text-xs font-bold active:scale-95 transition-all shadow-lg shadow-indigo-950/20 cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            Create Campaign Post
          </button>

          {/* Navigation Links */}
          <nav className="space-y-1">
            {navItems.map((item) => {
              const Icon = item.icon;
              const isActive = activeTab === item.id;
              return (
                <button
                  key={item.id}
                  onClick={() => {
                    if (item.id === 'rewards' && !user) {
                      setActiveTab('auth');
                    } else {
                      setActiveTab(item.id);
                    }
                  }}
                  className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-xs font-semibold transition-all cursor-pointer ${
                    isActive
                      ? 'bg-indigo-600/15 border border-indigo-500/25 text-indigo-400'
                      : 'border border-transparent text-slate-400 hover:bg-slate-800/50 hover:text-slate-200'
                  }`}
                >
                  <Icon className="w-4.5 h-4.5" />
                  {item.label}
                </button>
              );
            })}
          </nav>
        </div>

        {/* Bottom User Card / Admin Controls */}
        <div className="space-y-4 pt-4 border-t border-slate-800/80">
          {/* Admin panel button */}
          {user && (user.role === 'admin' || user.role === 'moderator') && (
            <button
              onClick={() => setActiveTab('admin')}
              className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-xs font-semibold border transition-all cursor-pointer ${
                activeTab === 'admin'
                  ? 'bg-amber-500/10 border-amber-500/40 text-amber-400'
                  : 'bg-slate-850 border-slate-800/80 text-slate-400 hover:text-slate-200'
              }`}
            >
              <ShieldAlert className="w-4.5 h-4.5 text-amber-400" />
              Operations Center
            </button>
          )}

          {/* User footer profile card */}
          {!user ? (
            <button
              onClick={() => setActiveTab('auth')}
              className="w-full flex items-center justify-center gap-2 py-2.5 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl text-xs font-bold active:scale-95 transition-all shadow-md cursor-pointer"
            >
              <User className="w-4 h-4" />
              Login / Sign Up
            </button>
          ) : (
            <div className="flex items-center gap-3 bg-slate-950/40 border border-slate-800/80 p-3 rounded-xl">
              <div 
                onClick={() => setActiveTab('profile')}
                className="flex items-center gap-2.5 flex-1 min-w-0 cursor-pointer group"
                title="View Profile"
              >
                <div className={`w-8 h-8 rounded-full flex items-center justify-center font-bold text-xs uppercase transition-all overflow-hidden ${
                  user.avatar_url && user.avatar_url.startsWith('/uploads')
                    ? 'bg-slate-850'
                    : (user.avatar_url && !user.avatar_url.startsWith('/uploads') ? user.avatar_url : 'bg-slate-800 text-indigo-450 group-hover:bg-indigo-600/30 group-hover:text-indigo-400')
                }`}>
                  {user.avatar_url && user.avatar_url.startsWith('/uploads') ? (
                    <img src={`${API_URL}${user.avatar_url}`} alt={user.name} className="w-full h-full object-cover" />
                  ) : (
                    user.name.charAt(0)
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <span className="block text-xs font-bold text-white truncate group-hover:text-indigo-400 transition-colors">{user.name}</span>
                  <span className="block text-[10px] text-indigo-400 font-semibold">{user.points} points</span>
                </div>
              </div>
              <button 
                onClick={logout} 
                className="text-slate-400 hover:text-red-400 transition-colors cursor-pointer"
                title="Log Out"
              >
                <LogOut className="w-4 h-4" />
              </button>
            </div>
          )}
        </div>
      </aside>

      {/* 2. MOBILE TOP HEADER */}
      <header className="md:hidden sticky top-0 z-40 bg-slate-900/85 backdrop-blur-md border-b border-slate-800/80 px-4 py-3 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <img src="/logo.png" alt="Awaaz Logo" className="w-8 h-8 object-contain" />
          <span className="text-xl font-bold bg-gradient-to-r from-indigo-400 to-amber-400 bg-clip-text text-transparent">
            Awaaz
          </span>
        </div>

        <div className="flex items-center gap-3">
          {user && <NotificationBell onNavigate={setActiveTab} />}
          {!user ? (
            <button
              onClick={() => setActiveTab('auth')}
              className="px-3.5 py-1.5 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl text-[10px] font-bold active:scale-95 transition-all shadow-md cursor-pointer"
            >
              Login / Sign Up
            </button>
          ) : (
            <>
              {(user.role === 'admin' || user.role === 'moderator') && (
                <button
                  onClick={() => setActiveTab('admin')}
                  className={`p-1.5 rounded-lg border transition-colors cursor-pointer ${
                    activeTab === 'admin'
                      ? 'bg-amber-500/20 border-amber-500/40 text-amber-400'
                      : 'bg-slate-800/60 border-slate-700/60 text-slate-400 hover:text-white'
                  }`}
                  title="Admin Panel"
                >
                  <ShieldAlert className="w-5 h-5" />
                </button>
              )}

              <button
                onClick={logout}
                className="p-1.5 bg-slate-800/60 hover:bg-red-500/20 border border-slate-700/60 hover:border-red-500/30 text-slate-400 hover:text-red-400 rounded-lg transition-all cursor-pointer"
                title="Log Out"
              >
                <LogOut className="w-4 h-4" />
              </button>
            </>
          )}
        </div>
      </header>

      {/* 3. MAIN WIDE CONTENT AREA */}
      <main className="flex-1 md:ml-64 p-4 md:p-8 max-w-6xl w-full mx-auto pb-24 md:pb-8 transition-all">
        
        {/* Top-Right Header Info (Desktop) */}
        <div className="hidden md:flex justify-between items-center mb-6">
          <div>
            <h2 className="text-sm font-black text-slate-400 uppercase tracking-widest">
              {activeTab === 'home' ? 'Home Feed' : activeTab === 'vlogs' ? 'Vlogs & Blogs' : activeTab === 'communities' ? 'Local Chapters' : activeTab === 'rewards' ? 'My Rewards' : activeTab === 'admin' ? 'Operations Center' : activeTab === 'profile' ? 'My Profile' : 'Sign In'}
            </h2>
          </div>
          
          <div className="flex items-center gap-3">
            {user && <NotificationBell onNavigate={setActiveTab} />}
            {!user ? (
              <button
                onClick={() => setActiveTab('auth')}
                className="px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl text-xs font-bold active:scale-95 transition-all shadow-md flex items-center gap-1.5 cursor-pointer"
              >
                <User className="w-3.5 h-3.5" />
                Login / Sign Up
              </button>
            ) : (
              <button 
                onClick={() => setActiveTab('profile')}
                className="flex items-center gap-2.5 text-xs bg-slate-900 hover:bg-slate-850 hover:border-slate-700 border border-slate-800 px-4 py-2 rounded-xl text-slate-300 cursor-pointer active:scale-95 transition-all"
                title="View Profile"
              >
                {user.avatar_url && user.avatar_url.startsWith('/uploads') ? (
                  <div className="w-4 h-4 rounded-full overflow-hidden border border-slate-700/80 flex-shrink-0">
                    <img src={`${API_URL}${user.avatar_url}`} alt={user.name} className="w-full h-full object-cover" />
                  </div>
                ) : (
                  <div className={`w-4 h-4 rounded-full flex items-center justify-center font-bold text-[8px] uppercase flex-shrink-0 ${
                    user.avatar_url && !user.avatar_url.startsWith('/uploads') ? user.avatar_url : 'bg-slate-850 text-indigo-400'
                  }`}>
                    {user.name.charAt(0)}
                  </div>
                )}
                <span className="font-bold text-white">{user.name}</span>
                <span className="text-[10px] text-indigo-400 font-bold bg-indigo-500/10 px-2 py-0.5 rounded-md">{user.points} pts</span>
              </button>

            )}
          </div>
        </div>

        {renderContent()}
      </main>

      {/* 4. MOBILE BOTTOM NAVIGATION */}
      <nav className="md:hidden fixed bottom-0 left-0 right-0 z-40 bg-slate-900/90 backdrop-blur-lg border-t border-slate-800/80 px-6 py-2 flex items-center justify-around">
        {/* Home */}
        <button
          onClick={() => setActiveTab('home')}
          className={`flex flex-col items-center gap-1 transition-all cursor-pointer ${
            activeTab === 'home' ? 'text-indigo-400 scale-105' : 'text-slate-500 hover:text-slate-300'
          }`}
        >
          <HomeIcon className="w-5 h-5" />
          <span className="text-[9px] font-medium">Home</span>
        </button>

        {/* Vlogs */}
        <button
          onClick={() => setActiveTab('vlogs')}
          className={`flex flex-col items-center gap-1 transition-all cursor-pointer ${
            activeTab === 'vlogs' ? 'text-indigo-400 scale-105' : 'text-slate-500 hover:text-slate-300'
          }`}
        >
          <Video className="w-5 h-5" />
          <span className="text-[9px] font-medium">Vlogs</span>
        </button>

        {/* Add trigger */}
        <button
          onClick={() => {
            if (!user) {
              setActiveTab('auth');
            } else {
              setShowCreateModal(true);
            }
          }}
          className="flex flex-col items-center gap-1 -mt-4 cursor-pointer"
        >
          <div className="w-10 h-10 bg-indigo-600 text-white rounded-full flex items-center justify-center shadow-lg shadow-indigo-950">
            <Plus className="w-6 h-6" />
          </div>
          <span className="text-[9px] font-medium mt-1">Publish</span>
        </button>

        {/* Chapters */}
        <button
          onClick={() => setActiveTab('communities')}
          className={`flex flex-col items-center gap-1 transition-all cursor-pointer ${
            activeTab === 'communities' ? 'text-indigo-400 scale-105' : 'text-slate-500 hover:text-slate-300'
          }`}
        >
          <Users className="w-5 h-5" />
          <span className="text-[9px] font-medium">Chapters</span>
        </button>

        {/* Rewards */}
        <button
          onClick={() => {
            if (!user) {
              setActiveTab('auth');
            } else {
              setActiveTab('rewards');
            }
          }}
          className={`flex flex-col items-center gap-1 transition-all cursor-pointer ${
            activeTab === 'rewards' ? 'text-indigo-400 scale-105' : 'text-slate-500 hover:text-slate-300'
          }`}
        >
          <Award className="w-5 h-5" />
          <span className="text-[9px] font-medium">Rewards</span>
        </button>
      </nav>

      {/* 5. PUBLISHING CONSOLE TRIGGER POPUP (AUTHENTICATED ONLY) */}
      {showCreateModal && user && (
        <div className="fixed inset-0 z-50 bg-black/75 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-3xl max-w-sm w-full p-6 text-center shadow-2xl relative">
            <button 
              onClick={() => setShowCreateModal(false)}
              className="absolute top-4 right-4 text-slate-400 hover:text-white cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>

            <h3 className="text-sm font-bold uppercase tracking-wider text-slate-300 mb-6">Choose Campaign Action</h3>
            
            <div className="grid grid-cols-2 gap-4">
              <button
                onClick={() => {
                  setShowCreateModal(false);
                  setActiveTab('vlogs');
                }}
                className="bg-slate-800/80 border border-slate-700/60 hover:bg-slate-700/80 p-4 rounded-xl flex flex-col items-center gap-2 group transition-all text-center cursor-pointer"
              >
                <div className="w-10 h-10 bg-indigo-500/10 text-indigo-400 rounded-full flex items-center justify-center group-hover:scale-105 transition-all">
                  <Video className="w-5 h-5" />
                </div>
                <span className="text-xs font-semibold">Video/Blog</span>
              </button>

              <button
                onClick={() => {
                  setShowCreateModal(false);
                  setActiveTab('home');
                }}
                className="bg-slate-800/80 border border-slate-700/60 hover:bg-slate-700/80 p-4 rounded-xl flex flex-col items-center gap-2 group transition-all text-center cursor-pointer"
              >
                <div className="w-10 h-10 bg-amber-500/10 text-amber-400 rounded-full flex items-center justify-center group-hover:scale-105 transition-all">
                  <Award className="w-5 h-5" />
                </div>
                <span className="text-xs font-semibold">24h Story</span>
              </button>
            </div>

            <button
              onClick={() => setShowCreateModal(false)}
              className="mt-6 w-full text-center text-xs text-slate-500 hover:text-slate-300 font-semibold transition-colors cursor-pointer"
            >
              Cancel
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

function MainApp() {
  const { loading } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-950 flex flex-col items-center justify-center text-slate-400 gap-3">
        <Loader className="w-8 h-8 text-indigo-500 animate-spin" />
        <span className="text-xs tracking-wider font-semibold uppercase">Awaaz Loading...</span>
      </div>
    );
  }

  return <Dashboard />;
}

export default function App() {
  return (
    <AuthProvider>
      <MainApp />
    </AuthProvider>
  );
}
