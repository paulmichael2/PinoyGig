import { createContext, useContext, useEffect, useState, useCallback } from 'react';
import { io } from 'socket.io-client';
import { useAuth } from './AuthContext';

const SocketContext = createContext(null);

export const useSocket = () => {
    const context = useContext(SocketContext);
    if (!context) {
        throw new Error('useSocket must be used within a SocketProvider');
    }
    return context;
};

export const SocketProvider = ({ children }) => {
    const [socket, setSocket] = useState(null);
    const [notifications, setNotifications] = useState([]);
    const [isConnected, setIsConnected] = useState(false);
    const { user, isAuthenticated } = useAuth();

    useEffect(() => {
        if (isAuthenticated && user) {
            // Connect to socket server using environment variable
            const SOCKET_URL = import.meta.env.VITE_SOCKET_URL || 'http://localhost:5000';

            const newSocket = io(SOCKET_URL, {
                withCredentials: true,
                transports: ['websocket', 'polling'],
            });

            newSocket.on('connect', () => {
                console.log('Socket connected');
                setIsConnected(true);
                // Join user's room for personalized notifications
                newSocket.emit('join', user._id);
            });

            newSocket.on('disconnect', () => {
                console.log('Socket disconnected');
                setIsConnected(false);
            });

            // Listen for hire notifications
            newSocket.on('hired', (data) => {
                const notification = {
                    id: Date.now(),
                    type: 'hired',
                    message: `🎉 You have been hired for "${data.gigTitle}"!`,
                    gigId: data.gigId,
                    timestamp: new Date(),
                };
                setNotifications((prev) => [notification, ...prev]);
            });

            // Listen for bid received notifications (for gig owners)
            newSocket.on('newBid', (data) => {
                const notification = {
                    id: Date.now(),
                    type: 'newBid',
                    message: `📩 New bid received on "${data.gigTitle}"`,
                    gigId: data.gigId,
                    timestamp: new Date(),
                };
                setNotifications((prev) => [notification, ...prev]);
            });

            setSocket(newSocket);

            return () => {
                newSocket.close();
            };
        } else {
            if (socket) {
                socket.close();
                setSocket(null);
                setIsConnected(false);
            }
        }
    }, [isAuthenticated, user?._id]);

    const clearNotification = useCallback((id) => {
        setNotifications((prev) => prev.filter((n) => n.id !== id));
    }, []);

    const clearAllNotifications = useCallback(() => {
        setNotifications([]);
    }, []);

    const value = {
        socket,
        isConnected,
        notifications,
        clearNotification,
        clearAllNotifications,
    };

    return (
        <SocketContext.Provider value={value}>
            {children}
        </SocketContext.Provider>
    );
};

export default SocketContext;
