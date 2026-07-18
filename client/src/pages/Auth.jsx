import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { isGoogleConfigured } from '../config/firebase';

// ── Setup Guide Modal ──────────────────────────────────────────────────────────
const SetupModal = ({ onClose }) => (
  <div className="fixed inset-0 z-50 bg-black/85 backdrop-blur-sm flex items-center justify-center p-4">
    <div className="bg-slate-900 border border-slate-700 rounded-2xl max-w-lg w-full shadow-2xl overflow-hidden">
      <div className="bg-gradient-to-r from-indigo-900/50 to-slate-900 border-b border-slate-800 p-5 flex items-center justify-between">
        <div>
          <h3 className="text-white font-bold text-sm">Enable Google Login – 2 Steps</h3>
          <p className="text-slate-400 text-xs mt-0.5">One-time setup, takes ~2 minutes</p>
        </div>
        <button onClick={onClose} className="w-8 h-8 flex items-center justify-center text-slate-400 hover:text-white text-2xl font-bold cursor-pointer">×</button>
      </div>
      <div className="p-5 space-y-5 max-h-[70vh] overflow-y-auto">
        <div className="bg-emerald-500/10 border border-emerald-500/30 rounded-xl p-3 text-emerald-300 text-xs">
          ✅ Just a free Google Cloud Client ID needed to enable Google sign-in.
        </div>
        <div className="flex gap-3">
          <div className="w-7 h-7 bg-indigo-600 text-white rounded-full text-xs font-black flex items-center justify-center flex-shrink-0">1</div>
          <div className="flex-1">
            <p className="text-white text-xs font-bold">Open Google Cloud Console</p>
            <a href="https://console.cloud.google.com/apis/credentials" target="_blank" rel="noreferrer"
              className="mt-1 block font-mono text-xs bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-indigo-400 underline">
              console.cloud.google.com/apis/credentials
            </a>
          </div>
        </div>
        <div className="flex gap-3">
          <div className="w-7 h-7 bg-indigo-600 text-white rounded-full text-xs font-black flex items-center justify-center flex-shrink-0">2</div>
          <div className="flex-1">
            <p className="text-white text-xs font-bold">Create OAuth 2.0 Client ID</p>
            <p className="text-slate-400 text-xs mt-0.5">Create Credentials → OAuth 2.0 Client ID → Web application</p>
            <code className="mt-1 block font-mono text-xs bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-emerald-400">Authorized JavaScript origin: http://localhost:5173</code>
          </div>
        </div>
        <div className="flex gap-3">
          <div className="w-7 h-7 bg-indigo-600 text-white rounded-full text-xs font-black flex items-center justify-center flex-shrink-0">3</div>
          <div className="flex-1">
            <p className="text-white text-xs font-bold">Paste Client ID into client/.env</p>
            <div className="mt-1 bg-slate-800 border border-slate-700 rounded-lg p-3 font-mono text-[11px]">
              <span className="text-emerald-400">VITE_GOOGLE_CLIENT_ID=</span>
              <span className="text-slate-300">your_google_client_id_here</span>
            </div>
            <code className="mt-2 block font-mono text-xs bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-amber-300">npm run dev  ← then restart</code>
          </div>
        </div>
      </div>
      <div className="border-t border-slate-800 p-4 flex gap-3">
        <a href="https://console.cloud.google.com/apis/credentials" target="_blank" rel="noreferrer"
          className="flex-1 py-2.5 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl text-xs font-bold text-center transition-all active:scale-95 cursor-pointer">
          Open Google Cloud Console →
        </a>
        <button onClick={onClose} className="px-5 py-2.5 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-xl text-xs font-bold cursor-pointer">Close</button>
      </div>
    </div>
  </div>
);

// ── Main Auth Page ─────────────────────────────────────────────────────────────
const Auth = () => {
  const [isLogin, setIsLogin] = useState(true);
  const { login, signup, loginWithGoogle } = useAuth();

  const [email, setEmail]       = useState('');
  const [password, setPassword] = useState('');
  const [name, setName]         = useState('');
  const [phone, setPhone]       = useState('');
  const [city, setCity]         = useState('');
  const [error, setError]       = useState('');
  const [loading, setLoading]   = useState(false);
  const [googleLoading, setGoogleLoading] = useState(false);
  const [showSetup, setShowSetup] = useState(false);

  const isValidEmail = (v) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v);

  // ── Official Google JavaScript Popup flow ──
  const handleGoogleLogin = () => {
    if (!isGoogleConfigured) {
      setShowSetup(true);
      return;
    }

    if (!window.google?.accounts?.oauth2) {
      setError('Google library is still loading. Please wait or refresh the page.');
      return;
    }

    setGoogleLoading(true);
    setError('');

    try {
      const client = window.google.accounts.oauth2.initTokenClient({
        client_id: import.meta.env.VITE_GOOGLE_CLIENT_ID,
        scope: 'openid email profile',
        callback: async (tokenResponse) => {
          if (tokenResponse.error) {
            setError(tokenResponse.error_description || tokenResponse.error);
            setGoogleLoading(false);
            return;
          }

          try {
            // Retrieve Google user info using the access token
            const userInfo = await fetch('https://www.googleapis.com/oauth2/v3/userinfo', {
              headers: { Authorization: `Bearer ${tokenResponse.access_token}` }
            }).then(r => r.json());

            if (userInfo?.email) {
              await loginWithGoogle({
                credential: tokenResponse.access_token,
                email: userInfo.email,
                name: userInfo.name || userInfo.email.split('@')[0],
                picture: userInfo.picture || null
              });
            } else {
              setError('Failed to fetch profile info from Google.');
            }
          } catch (err) {
            setError(err.message || 'Google verification failed.');
          } finally {
            setGoogleLoading(false);
          }
        },
        error_callback: (err) => {
          setGoogleLoading(false);
          if (err.type === 'popup_closed') {
            setError('Sign-in popup was closed.');
          } else {
            setError(err.message || 'Sign-in failed.');
          }
        }
      });

      // Request standard access token (opens native popup with origin check only)
      client.requestAccessToken({ prompt: 'select_account' });
    } catch (err) {
      setGoogleLoading(false);
      setError('Failed to initialize Google login client.');
    }
  };

  // ── Email / Password submit ──
  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    if (!isValidEmail(email)) {
      setError('Please enter a valid email address (e.g. yourname@gmail.com)');
      return;
    }
    if (password.length < 6) {
      setError('Password must be at least 6 characters');
      return;
    }
    if (!isLogin && !name.trim()) {
      setError('Full name is required');
      return;
    }

    setLoading(true);
    try {
      if (isLogin) {
        await login(email, password);
      } else {
        await signup({ name, email, password, phone, city });
      }
    } catch (err) {
      setError(err.message || 'Something went wrong. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-950 px-4 py-12">
      <div className="max-w-md w-full bg-slate-900 border border-slate-800 rounded-2xl p-8 shadow-2xl relative overflow-hidden">

        {/* Decorative glows */}
        <div className="absolute top-0 right-0 w-40 h-40 bg-indigo-600/10 rounded-full blur-3xl -mr-10 -mt-10 pointer-events-none" />
        <div className="absolute bottom-0 left-0 w-40 h-40 bg-amber-500/8 rounded-full blur-3xl -ml-10 -mb-10 pointer-events-none" />

        {/* Logo */}
        <div className="text-center flex flex-col items-center mb-7">
          <img src="/logo.png" alt="Awaaz" className="w-16 h-16 object-contain mb-3" />
          <h1 className="text-3xl font-extrabold text-white tracking-tight">Awaaz</h1>
          <p className="mt-1.5 text-sm text-slate-400">
            {isLogin ? 'Sign in to support the campaign' : 'Join the movement — create an account'}
          </p>
        </div>

        {/* Email / Password Form */}
        <form className="space-y-4" onSubmit={handleSubmit}>
          {!isLogin && (
            <div>
              <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1.5">Full Name *</label>
              <input type="text" required value={name} onChange={(e) => setName(e.target.value)}
                className="w-full bg-slate-800/60 border border-slate-700 text-white rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500"
                placeholder="Sonam Supporter" />
            </div>
          )}

          <div>
            <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1.5">Email Address *</label>
            <input type="email" required value={email} onChange={(e) => setEmail(e.target.value)}
              className={`w-full bg-slate-800/60 border text-white rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-1 transition-colors ${
                email && !isValidEmail(email)
                  ? 'border-red-500/70 focus:border-red-500 focus:ring-red-500'
                  : 'border-slate-700 focus:border-indigo-500 focus:ring-indigo-500'
              }`}
              placeholder="yourname@gmail.com" />
            {email && !isValidEmail(email) && (
              <p className="text-red-400 text-[10px] mt-1 font-semibold">⚠ Enter a valid email (e.g. name@example.com)</p>
            )}
          </div>

          {!isLogin && (
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1.5">Phone</label>
                <input type="tel" value={phone} onChange={(e) => setPhone(e.target.value)}
                  className="w-full bg-slate-800/60 border border-slate-700 text-white rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:border-indigo-500"
                  placeholder="+91 98765..." />
              </div>
              <div>
                <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1.5">City</label>
                <input type="text" value={city} onChange={(e) => setCity(e.target.value)}
                  className="w-full bg-slate-800/60 border border-slate-700 text-white rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:border-indigo-500"
                  placeholder="Leh / Delhi" />
              </div>
            </div>
          )}

          <div>
            <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1.5">Password *</label>
            <input type="password" required value={password} onChange={(e) => setPassword(e.target.value)}
              className="w-full bg-slate-800/60 border border-slate-700 text-white rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 transition-colors"
              placeholder="••••••••  (min 6 characters)" minLength={6} />
          </div>

          {/* Error */}
          {error && (
            <div className="bg-red-500/10 border border-red-500/20 text-red-400 rounded-xl p-3 text-xs font-medium">
              {error}
            </div>
          )}

          <button type="submit" disabled={loading || googleLoading}
            className="w-full flex justify-center items-center gap-2 py-3 rounded-xl text-sm font-bold text-white bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 transition-all active:scale-95 shadow-lg shadow-indigo-950/40 cursor-pointer">
            {loading && <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />}
            {loading ? 'Processing...' : isLogin ? 'Sign In' : 'Create Account'}
          </button>
        </form>

        {/* Divider */}
        <div className="relative flex items-center my-5">
          <div className="flex-grow border-t border-slate-800" />
          <span className="mx-4 text-slate-500 text-[10px] font-bold uppercase tracking-widest">or continue with</span>
          <div className="flex-grow border-t border-slate-800" />
        </div>

        {/* Google Sign-In Custom Button (Always Visible) */}
        <button
          type="button"
          onClick={handleGoogleLogin}
          disabled={googleLoading || loading}
          className="w-full flex items-center justify-center gap-3 py-3 px-4 bg-white hover:bg-gray-50 text-gray-700 rounded-xl text-sm font-bold transition-all active:scale-95 shadow-sm border border-gray-200 cursor-pointer relative"
        >
          {googleLoading ? (
            <div className="w-5 h-5 border-2 border-gray-300 border-t-gray-600 rounded-full animate-spin" />
          ) : (
            <svg className="w-5 h-5 flex-shrink-0" viewBox="0 0 24 24">
              <path fill="#ea4335" d="M12 5.04c1.72 0 3.28.59 4.49 1.76l3.35-3.35C17.81 1.55 15.11 1 12 1 7.22 1 3.19 3.73 1.25 7.74l3.86 3C6.07 7.78 8.78 5.04 12 5.04z"/>
              <path fill="#4285f4" d="M23.5 12.25c0-.82-.07-1.61-.21-2.38H12v4.51h6.45c-.28 1.46-1.1 2.69-2.33 3.51l3.6 2.79c2.1-1.93 3.78-5.18 3.78-8.43z"/>
              <path fill="#fbbc05" d="M5.11 14.74c-.23-.69-.36-1.43-.36-2.2s.13-1.51.36-2.2l-3.86-3C.45 8.93 0 10.42 0 12s.45 3.07 1.25 4.66l3.86-3z"/>
              <path fill="#34a853" d="M12 18.96c3.22 0 5.92-1.07 7.9-2.9l-3.6-2.79c-1.1.74-2.5 1.18-4.3 1.18-3.22 0-5.93-2.74-6.89-5.7l-3.86 3c1.94 4.01 5.97 6.74 10.75 6.74z"/>
            </svg>
          )}
          <span>{googleLoading ? 'Signing in with Google...' : 'Continue with Google'}</span>

          {!isGoogleConfigured && (
            <span className="absolute -top-2 -right-2 bg-amber-400 text-slate-900 text-[9px] font-black px-1.5 py-0.5 rounded-full shadow-md">
              Setup
            </span>
          )}
        </button>

        {/* Toggle login / signup */}
        <div className="text-center mt-5">
          <button type="button" onClick={() => { setIsLogin(!isLogin); setError(''); }}
            className="text-xs font-semibold text-indigo-400 hover:text-indigo-300 transition-colors cursor-pointer">
            {isLogin ? "Don't have an account? Sign Up →" : '← Already have an account? Sign In'}
          </button>
        </div>
      </div>

      {showSetup && <SetupModal onClose={() => setShowSetup(false)} />}
    </div>
  );
};

export default Auth;
