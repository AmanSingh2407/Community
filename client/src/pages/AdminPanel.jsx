import React, { useState, useEffect } from 'react';
import { useAuth, API_URL } from '../context/AuthContext';
import { Shield, AlertTriangle, Users, TrendingUp, Check, Trash2, ShieldAlert } from 'lucide-react';

const AdminPanel = () => {
  const { getToken, user } = useAuth();
  const [activeSubTab, setActiveSubTab] = useState('moderation'); // 'moderation', 'analytics', 'users'
  const [stats, setStats] = useState({
    totalSupporters: 0,
    activeReports: 0,
    newUsersToday: 0,
    pendingModeration: 0
  });
  const [reports, setReports] = useState([]);
  const [usersList, setUsersList] = useState([]);
  const [loading, setLoading] = useState(false);
  const [usersLoading, setUsersLoading] = useState(false);
  const [resolvingId, setResolvingId] = useState(null);

  const fetchAdminStats = async () => {
    try {
      const token = getToken();
      const res = await fetch(`${API_URL}/api/admin/dashboard`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      const data = await res.json();
      if (data.success) {
        setStats(data.stats);
      }
    } catch (err) {
      console.error('Failed to load admin stats:', err);
    }
  };

  const fetchReports = async () => {
    setLoading(true);
    try {
      const token = getToken();
      const res = await fetch(`${API_URL}/api/admin/reports`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      const data = await res.json();
      if (data.success) {
        setReports(data.reports || []);
      }
    } catch (err) {
      console.error('Failed to fetch reports:', err);
    } finally {
      setLoading(false);
    }
  };

  const fetchUsers = async () => {
    setUsersLoading(true);
    try {
      const token = getToken();
      const res = await fetch(`${API_URL}/api/admin/users`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      const data = await res.json();
      if (data.success) {
        setUsersList(data.users || []);
      }
    } catch (err) {
      console.error('Failed to fetch admin users list:', err);
    } finally {
      setUsersLoading(false);
    }
  };

  useEffect(() => {
    fetchAdminStats();
    fetchReports();
    fetchUsers();
  }, []);

  const handleResolve = async (reportId, action) => {
    setResolvingId(reportId);
    try {
      const token = getToken();
      const res = await fetch(`${API_URL}/api/admin/reports/${reportId}/resolve`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ action })
      });
      const data = await res.json();
      if (data.success) {
        setReports(prev => prev.filter(r => r.id !== reportId));
        setStats(prev => ({
          ...prev,
          activeReports: Math.max(prev.activeReports - 1, 0),
          pendingModeration: Math.max(prev.pendingModeration - 1, 0)
        }));
        alert(data.message);
      }
    } catch (err) {
      console.error('Failed to resolve report:', err);
    } finally {
      setResolvingId(null);
    }
  };

  const handleRoleChange = async (userId, newRole) => {
    try {
      const token = getToken();
      const res = await fetch(`${API_URL}/api/admin/users/${userId}/role`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ role: newRole })
      });
      const data = await res.json();
      if (data.success) {
        setUsersList(prev => prev.map(u => u.id === userId ? { ...u, role: newRole } : u));
        fetchAdminStats();
        alert('User role updated successfully!');
      } else {
        alert(data.error || 'Failed to update role');
      }
    } catch (err) {
      console.error(err);
      alert('Failed to update role');
    }
  };

  const handleDeleteUser = async (userId, userName) => {
    if (userId === user.id) {
      alert('You cannot delete your own admin account.');
      return;
    }
    if (!window.confirm(`Are you sure you want to permanently delete supporter "${userName}"? This action cannot be undone.`)) {
      return;
    }

    try {
      const token = getToken();
      const res = await fetch(`${API_URL}/api/admin/users/${userId}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      const data = await res.json();
      if (data.success) {
        setUsersList(prev => prev.filter(u => u.id !== userId));
        fetchAdminStats();
        alert('User deleted successfully.');
      } else {
        alert(data.error || 'Failed to delete user');
      }
    } catch (err) {
      console.error(err);
      alert('Failed to delete user');
    }
  };

  // Only allow Admin or Moderator role to access the panels
  if (user.role !== 'admin' && user.role !== 'moderator') {
    return (
      <div className="bg-red-500/10 border border-red-500/20 text-red-400 p-8 rounded-2xl text-center space-y-2">
        <ShieldAlert className="w-12 h-12 mx-auto" />
        <h2 className="text-lg font-bold">Access Denied</h2>
        <p className="text-xs text-slate-400">You must have administrator privileges to view this section.</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      
      {/* KPI Cards section */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <button
          onClick={() => user.role === 'admin' && setActiveSubTab('users')}
          className={`bg-slate-900 border border-slate-800 p-4 rounded-2xl flex items-center gap-3 text-left transition-all active:scale-95 duration-200 ${
            user.role === 'admin' ? 'hover:border-indigo-500/50 hover:bg-slate-850/40 cursor-pointer' : 'cursor-default'
          }`}
        >
          <div className="w-10 h-10 bg-indigo-500/10 text-indigo-400 rounded-xl flex items-center justify-center flex-shrink-0">
            <Users className="w-5 h-5" />
          </div>
          <div>
            <span className="text-[10px] text-slate-500 font-bold uppercase tracking-wider block">Total Supporters</span>
            <span className="text-base font-extrabold text-white tabular-nums">{stats.totalSupporters.toLocaleString()}</span>
          </div>
        </button>

        <button
          onClick={() => setActiveSubTab('moderation')}
          className="bg-slate-900 border border-slate-800 p-4 rounded-2xl flex items-center gap-3 text-left transition-all hover:border-rose-500/50 hover:bg-slate-850/40 active:scale-95 duration-200 cursor-pointer"
        >
          <div className="w-10 h-10 bg-rose-500/10 text-rose-400 rounded-xl flex items-center justify-center flex-shrink-0">
            <AlertTriangle className="w-5 h-5" />
          </div>
          <div>
            <span className="text-[10px] text-slate-500 font-bold uppercase tracking-wider block">Active Reports</span>
            <span className="text-base font-extrabold text-white tabular-nums">{stats.activeReports}</span>
          </div>
        </button>

        <button
          onClick={() => user.role === 'admin' && setActiveSubTab('users')}
          className={`bg-slate-900 border border-slate-800 p-4 rounded-2xl flex items-center gap-3 text-left transition-all active:scale-95 duration-200 ${
            user.role === 'admin' ? 'hover:border-emerald-500/50 hover:bg-slate-850/40 cursor-pointer' : 'cursor-default'
          }`}
        >
          <div className="w-10 h-10 bg-emerald-500/10 text-emerald-400 rounded-xl flex items-center justify-center flex-shrink-0">
            <TrendingUp className="w-5 h-5" />
          </div>
          <div>
            <span className="text-[10px] text-slate-500 font-bold uppercase tracking-wider block">Joined Today</span>
            <span className="text-base font-extrabold text-white tabular-nums">+{stats.newUsersToday}</span>
          </div>
        </button>

        <button
          onClick={() => setActiveSubTab('moderation')}
          className="bg-slate-900 border border-slate-800 p-4 rounded-2xl flex items-center gap-3 text-left transition-all hover:border-amber-500/50 hover:bg-slate-850/40 active:scale-95 duration-200 cursor-pointer"
        >
          <div className="w-10 h-10 bg-amber-500/10 text-amber-400 rounded-xl flex items-center justify-center flex-shrink-0">
            <Shield className="w-5 h-5" />
          </div>
          <div>
            <span className="text-[10px] text-slate-500 font-bold uppercase tracking-wider block">Pending Actions</span>
            <span className="text-base font-extrabold text-white tabular-nums">{stats.pendingModeration}</span>
          </div>
        </button>
      </div>

      {/* Admin Tab Switchers */}
      <div className="flex border-b border-slate-800 text-xs">
        <button
          onClick={() => setActiveSubTab('moderation')}
          className={`px-4 py-2.5 font-bold transition-all border-b-2 ${
            activeSubTab === 'moderation' ? 'border-indigo-500 text-indigo-400' : 'border-transparent text-slate-400 hover:text-slate-200'
          }`}
        >
          Moderation Queue ({reports.length})
        </button>

        {user.role === 'admin' && (
          <button
            onClick={() => setActiveSubTab('users')}
            className={`px-4 py-2.5 font-bold transition-all border-b-2 ${
              activeSubTab === 'users' ? 'border-indigo-500 text-indigo-400' : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            User Roles ({usersList.length})
          </button>
        )}
      </div>

      {/* RENDER ACTIVE TAB */}
      {activeSubTab === 'moderation' && (
        <div className="space-y-4">
          <h3 className="text-xs font-bold text-slate-300 uppercase tracking-wider">Flagged Content Reviews</h3>
          
          {loading ? (
            <div className="flex justify-center p-8">
              <div className="w-6 h-6 border-2 border-indigo-500 border-t-transparent rounded-full animate-spin"></div>
            </div>
          ) : reports.length === 0 ? (
            <div className="bg-slate-900 border border-slate-800 rounded-2xl p-12 text-center text-slate-500 text-xs italic">
              All reported items are resolved. Moderation queue is clear!
            </div>
          ) : (
            <div className="bg-slate-900 border border-slate-800 rounded-xl overflow-hidden">
              <div className="overflow-x-auto text-xs">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="bg-slate-950 border-b border-slate-800 text-slate-400 text-[10px] font-bold uppercase tracking-wider">
                      <th className="px-5 py-3">Content ID</th>
                      <th className="px-5 py-3">Type</th>
                      <th className="px-5 py-3">Reason</th>
                      <th className="px-5 py-3">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-850">
                    {reports.map((report) => (
                      <tr key={report.id} className="hover:bg-slate-850/20 text-slate-300">
                        <td className="px-5 py-4 font-mono font-semibold text-[11px] text-white">
                          {report.content_id.slice(0, 8)}...
                        </td>
                        <td className="px-5 py-4">
                          <span className={`text-[9px] px-2 py-0.5 rounded-full font-bold uppercase tracking-wider ${
                            report.content_type === 'post' ? 'bg-indigo-500/10 text-indigo-400' : 'bg-amber-500/10 text-amber-400'
                          }`}>
                            {report.content_type}
                          </span>
                        </td>
                        <td className="px-5 py-4 text-slate-400 max-w-xs truncate">{report.reason}</td>
                        <td className="px-5 py-4 flex gap-2">
                          <button
                            onClick={() => handleResolve(report.id, 'approved')}
                            disabled={resolvingId === report.id}
                            className="p-1 bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-400 border border-emerald-500/20 rounded transition-colors"
                            title="Approve & Keep"
                          >
                            <Check className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => handleResolve(report.id, 'removed')}
                            disabled={resolvingId === report.id}
                            className="p-1 bg-red-500/10 hover:bg-red-500/20 text-red-400 border border-red-500/20 rounded transition-colors"
                            title="Delete Content"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>
      )}

      {activeSubTab === 'users' && (
        <div className="space-y-4">
          <h3 className="text-xs font-bold text-slate-300 uppercase tracking-wider">User Directory & Permissions</h3>
          
          {usersLoading ? (
            <div className="flex justify-center p-8">
              <div className="w-6 h-6 border-2 border-indigo-500 border-t-transparent rounded-full animate-spin"></div>
            </div>
          ) : usersList.length === 0 ? (
            <div className="bg-slate-900 border border-slate-800 rounded-2xl p-12 text-center text-slate-500 text-xs italic">
              No users registered in the database.
            </div>
          ) : (
            <div className="bg-slate-900 border border-slate-800 rounded-xl overflow-hidden">
              <div className="overflow-x-auto text-xs">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="bg-slate-950 border-b border-slate-800 text-slate-400 text-[10px] font-bold uppercase tracking-wider">
                      <th className="px-5 py-3">User Name</th>
                      <th className="px-5 py-3">Email</th>
                      <th className="px-5 py-3">City</th>
                      <th className="px-5 py-3">Security Role</th>
                      <th className="px-5 py-3 text-right pr-8">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-850">
                    {usersList.map((usr) => (
                      <tr key={usr.id} className="hover:bg-slate-850/20 text-slate-300">
                        <td className="px-5 py-4 font-bold text-white">{usr.name}</td>
                        <td className="px-5 py-4 text-slate-400">{usr.email}</td>
                        <td className="px-5 py-4">{usr.city || 'Leh'}</td>
                        <td className="px-5 py-4">
                          <span className={`text-[9px] px-2.5 py-0.5 rounded-full font-semibold uppercase tracking-wider ${
                            usr.role === 'admin' 
                              ? 'bg-red-500/10 text-red-400 border border-red-500/20' 
                              : usr.role === 'moderator'
                                ? 'bg-amber-500/10 text-amber-400 border border-amber-500/20'
                                : 'bg-slate-800 text-slate-400'
                          }`}>
                            {usr.role}
                          </span>
                        </td>
                        <td className="px-5 py-4 flex items-center justify-end gap-2 pr-6">
                          {/* Role Picker (Edit role option) */}
                          <select
                            value={usr.role}
                            onChange={(e) => handleRoleChange(usr.id, e.target.value)}
                            disabled={usr.id === user.id} // Disable editing self
                            className="bg-slate-950 border border-slate-800 rounded px-2 py-1 text-slate-350 focus:outline-none focus:border-indigo-500 text-[10px] font-bold cursor-pointer"
                          >
                            <option value="user">User</option>
                            <option value="moderator">Moderator</option>
                            <option value="admin">Admin</option>
                          </select>

                          {/* Delete Button */}
                          <button
                            onClick={() => handleDeleteUser(usr.id, usr.name)}
                            disabled={usr.id === user.id} // Disable deleting self
                            className={`p-1.5 border rounded transition-colors ${
                              usr.id === user.id 
                                ? 'border-slate-800 text-slate-700 cursor-not-allowed' 
                                : 'border-red-500/20 bg-red-500/10 text-red-400 hover:bg-red-500/20 cursor-pointer'
                            }`}
                            title={usr.id === user.id ? "Cannot delete yourself" : "Delete Supporter Account"}
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default AdminPanel;
