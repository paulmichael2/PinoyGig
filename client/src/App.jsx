import React, { useEffect, useState } from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { io } from 'socket.io-client';


import { useAuth } from './context/AuthContext';


import Navbar from './components/Navbar';
import Footer from './components/Footer';
import Loader from './components/Loader';
import NotificationToast from './components/NotificationToast';

import Home from './pages/Home';
import Login from './pages/Login';
import Register from './pages/Register';
import BrowseGigs from './pages/BrowseGigs';
import GigDetails from './pages/GigDetails';
import PostGig from './pages/PostGig';
import MyGigs from './pages/MyGigs';
import MyBids from './pages/MyBids';
import Profile from './pages/Profile';
import Messages from './pages/Messages';
import Wallet from './pages/Wallet';
import AdminDashboard from './pages/AdminDashboard';
import { getSocket } from './services/socket';
import ProtectedRoute from './components/ProtectedRoute';


const socket = getSocket();

const AppContent = () => {
  const { currentUser, loading } = useAuth();
  const [notification, setNotification] = useState(null);

  useEffect(() => {
    if (currentUser) {
      console.log("Attempting to connect socket...");
      socket.connect();

      socket.on('connect', () => {
        console.log("✅ Socket Connected!", socket.id);
        const userId = currentUser._id || currentUser.user?._id;
        console.log("Joining room:", userId);
        socket.emit('join_room', userId);
      });

      socket.on('connect_error', (err) => {
        console.error("❌ Socket Connection Error:", err);
      });


      socket.on('notification', (data) => {
        console.log('🔔 Notification received:', data);

        const audio = new Audio('https://assets.mixkit.co/active_storage/sfx/2869/2869-preview.mp3');
        audio.play().catch(e => console.log('Audio play failed', e));

        setNotification(data);
      });
    }

    return () => {
      socket.off('connect');
      socket.off('connect_error');
      socket.off('notification');
      socket.disconnect();
    };
  }, [currentUser]);

  if (loading) return <Loader />;

  return (
    <>
      <Navbar />
      {notification && (
        <NotificationToast
          notification={notification}
          onClose={() => setNotification(null)}
        />
      )}

      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />
        <Route path="/gigs" element={<BrowseGigs />} />
        <Route path="/gigs/:id" element={<GigDetails />} />
        <Route path="/post-gig" element={<PostGig />} />
        <Route path="/my-gigs" element={<MyGigs />} />
        <Route path="/my-bids" element={<MyBids />} />
        <Route path="/profile" element={<Profile />} />
        <Route path="/profile/:id" element={<Profile />} />
        <Route path="/messages" element={<Messages />} />
        <Route path="/messages/:gigId" element={<Messages />} />
        <Route path="/wallet" element={<ProtectedRoute><Wallet /></ProtectedRoute>} />
        <Route path="/admin" element={<ProtectedRoute adminOnly><AdminDashboard /></ProtectedRoute>} />
      </Routes>
      <Footer />
    </>
  );
};

const App = () => {
  return (
    <Router>
      <AppContent />
    </Router>
  );
};

export default App;