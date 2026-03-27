import React, { createContext, useState, useContext, useEffect } from 'react';
import api, { usersAPI } from '../services/api';

const AuthContext = createContext();

export const useAuth = () => {
  return useContext(AuthContext);
};

export const AuthProvider = ({ children }) => {
  const [currentUser, setCurrentUser] = useState(null);
  const [loading, setLoading] = useState(true);

  const checkAuth = async () => {
    try {
      const response = await api.get('/auth/me');
      setCurrentUser(response.data);
    } catch (error) {
      setCurrentUser(null);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    checkAuth();
  }, []);

  const login = async (email, password) => {
    const response = await api.post('/auth/login', { email, password });
    setCurrentUser(response.data);
    return response.data;
  };

  const register = async (name, email, password) => {
    const response = await api.post('/auth/register', { name, email, password });
    setCurrentUser(response.data);
    return response.data;
  };

  const logout = async () => {
    try {
      await api.post('/auth/logout');
      setCurrentUser(null);
    } catch (error) {
      console.error("Logout failed", error);
    }
  };

  const updateProfile = async (data) => {
    try {
      const response = await usersAPI.updateProfile(data);
      setCurrentUser(response.data);
      return response.data;
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