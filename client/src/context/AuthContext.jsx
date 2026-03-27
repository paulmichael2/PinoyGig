import React, { createContext, useState, useContext, useEffect } from 'react';
import api, { getStoredToken, setStoredToken, usersAPI } from '../services/api';

const AuthContext = createContext();

const AUTH_USER_KEY = 'pinoygig.auth.user';

const getStoredUser = () => {
  if (typeof window === 'undefined') {
    return null;
  }

  const rawUser = window.localStorage.getItem(AUTH_USER_KEY);

  if (!rawUser) {
    return null;
  }

  try {
    return JSON.parse(rawUser);
  } catch (error) {
    window.localStorage.removeItem(AUTH_USER_KEY);
    return null;
  }
};

const setStoredUser = (user) => {
  if (typeof window === 'undefined') {
    return;
  }

  if (user) {
    window.localStorage.setItem(AUTH_USER_KEY, JSON.stringify(user));
    return;
  }

  window.localStorage.removeItem(AUTH_USER_KEY);
};

const normalizeAuthUser = (payload) => payload?.user || payload || null;

export const useAuth = () => {
  return useContext(AuthContext);
};

export const AuthProvider = ({ children }) => {
  const [currentUser, setCurrentUser] = useState(() => getStoredUser());
  const [loading, setLoading] = useState(true);

  const persistAuth = (payload, fallbackToken = null) => {
    const normalizedUser = normalizeAuthUser(payload);
    const token = payload?.token || fallbackToken || null;

    setCurrentUser(normalizedUser);
    setStoredUser(normalizedUser);

    if (token) {
      setStoredToken(token);
    }

    return normalizedUser;
  };

  const clearAuth = () => {
    setCurrentUser(null);
    setStoredUser(null);
    setStoredToken(null);
  };

  const checkAuth = async () => {
    try {
      const response = await api.get('/auth/me');
      persistAuth(response.data, getStoredToken());
    } catch (error) {
      clearAuth();
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    checkAuth();
  }, []);

  const login = async (email, password) => {
    const response = await api.post('/auth/login', { email, password });
    const user = persistAuth(response.data);
    return user;
  };

  const register = async (name, email, password) => {
    const response = await api.post('/auth/register', { name, email, password });
    const user = persistAuth(response.data);
    return user;
  };

  const logout = async () => {
    try {
      await api.post('/auth/logout');
    } catch (error) {
      console.error("Logout failed", error);
    } finally {
      clearAuth();
    }
  };

  const updateProfile = async (data) => {
    try {
      const response = await usersAPI.updateProfile(data);
      const user = normalizeAuthUser(response.data);
      setCurrentUser(user);
      setStoredUser(user);
      return user;
    } catch (error) {
      console.error('Update profile failed:', error);
      throw error;
    }
  };

  const value = {
    currentUser,
    login,
    register,
    logout,
    updateProfile,
    loading
  };

  return (
    <AuthContext.Provider value={value}>
      {!loading && children}
    </AuthContext.Provider>
  );
};