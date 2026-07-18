import React, { createContext, useState, useEffect, useContext } from 'react';
import { firebaseSignOut } from '../config/firebase';

const AuthContext = createContext();

export const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000';

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const token = localStorage.getItem('token');
    if (token) {
      checkSession(token);
    } else {
      setLoading(false);
    }
  }, []);

  const checkSession = async (token) => {
    try {
      const res = await fetch(`${API_URL}/api/auth/me`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      const data = await res.json();
      if (data.success) {
        setUser(data.user);
      } else {
        localStorage.removeItem('token');
        setUser(null);
      }
    } catch (err) {
      console.error('Session verify failed:', err);
    } finally {
      setLoading(false);
    }
  };

  const login = async (email, password) => {
    setLoading(true);
    try {
      const res = await fetch(`${API_URL}/api/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password })
      });
      const data = await res.json();
      if (!data.success) throw new Error(data.error || 'Login failed');
      localStorage.setItem('token', data.token);
      setUser(data.user);
      return data.user;
    } finally {
      setLoading(false);
    }
  };

  const signup = async (signupData) => {
    setLoading(true);
    try {
      const res = await fetch(`${API_URL}/api/auth/signup`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(signupData)
      });
      const data = await res.json();
      if (!data.success) throw new Error(data.error || 'Registration failed');
      localStorage.setItem('token', data.token);
      setUser(data.user);
      return data.user;
    } finally {
      setLoading(false);
    }
  };

  /**
   * Called after Google's button returns a credential.
   * googleData = { credential, email, name, picture, email_verified }
   */
  const loginWithGoogle = async (googleData) => {
    setLoading(true);
    try {
      const { credential, email, name, picture } = googleData;

      if (!email) throw new Error('No email returned from Google.');

      const res = await fetch(`${API_URL}/api/auth/social-login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          idToken: credential,       // Google ID token for backend verification
          email,
          name: name || email.split('@')[0],
          photoURL: picture || null,
          provider: 'Google'
        })
      });

      const data = await res.json();
      if (!data.success) throw new Error(data.error || 'Google login failed');

      localStorage.setItem('token', data.token);
      setUser(data.user);
      return data.user;
    } catch (err) {
      throw err;
    } finally {
      setLoading(false);
    }
  };

  const updateProfile = async (profileData) => {
    setLoading(true);
    try {
      const token = localStorage.getItem('token');
      const res = await fetch(`${API_URL}/api/auth/update`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(profileData)
      });
      const data = await res.json();
      if (!data.success) throw new Error(data.error || 'Profile update failed');
      setUser(data.user);
      return data.user;
    } finally {
      setLoading(false);
    }
  };

  const uploadAvatar = async (file) => {
    setLoading(true);
    try {
      const token = localStorage.getItem('token');
      const formData = new FormData();
      formData.append('avatar', file);

      const res = await fetch(`${API_URL}/api/auth/upload-avatar`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`
        },
        body: formData
      });
      const data = await res.json();
      if (!data.success) throw new Error(data.error || 'Avatar upload failed');
      setUser(prev => ({ ...prev, avatar_url: data.avatarUrl }));
      return data.avatarUrl;
    } finally {
      setLoading(false);
    }
  };

  const logout = () => {
    localStorage.removeItem('token');
    setUser(null);
    firebaseSignOut().catch(() => {});
  };

  const getToken = () => localStorage.getItem('token');

  return (
    <AuthContext.Provider value={{ user, setUser, loading, login, signup, loginWithGoogle, updateProfile, uploadAvatar, logout, getToken }}>
      {children}
    </AuthContext.Provider>
  );
};



export const useAuth = () => useContext(AuthContext);
