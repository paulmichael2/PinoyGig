import express from 'express';
import dotenv from 'dotenv';
import cookieParser from 'cookie-parser';
import cors from 'cors';
import { createServer } from 'http';
import { Server } from 'socket.io';
import connectDB from './config/db.js';
import { errorHandler, notFound } from './middleware/errorMiddleware.js';

// Routes
import authRoutes from './routes/authRoutes.js';
import gigRoutes from './routes/gigRoutes.js';
import bidRoutes from './routes/bidRoutes.js';
import reviewRoutes from './routes/reviewRoutes.js'; // <--- ADDED THIS
import chatRoutes from './routes/chatRoutes.js';
import adminRoutes from './routes/adminRoutes.js';

dotenv.config();
connectDB();

const app = express();

// 1. Create HTTP server
const httpServer = createServer(app);

// Allowed origins for CORS
const allowedOrigins = [
    "http://localhost:5173",
    "http://127.0.0.1:5173",
    process.env.CLIENT_URL
].filter(Boolean);

// 2. Initialize Socket.IO
const io = new Server(httpServer, {
    cors: {
        origin: allowedOrigins,
        credentials: true,
        methods: ["GET", "POST", "PUT", "PATCH", "DELETE"]
    }
});

const onlineUsers = new Map();

const broadcastPresence = (userId, isOnline) => {
    io.emit('presence:update', { userId, isOnline });
};

// 3. Socket Connection Logic
io.on('connection', (socket) => {
    console.log('New client connected:', socket.id);

    // Allow user to join a room with their unique User ID
    socket.on('join_room', (userId) => {
        if (userId) {
            socket.join(userId);
            socket.data.userId = userId;
            const currentCount = onlineUsers.get(userId) || 0;
            onlineUsers.set(userId, currentCount + 1);
            if (currentCount === 0) {
                broadcastPresence(userId, true);
            }
            console.log(`User ${userId} joined room ${userId}`);
        }
    });

    socket.on('join_gig_chat', (gigId) => {
        if (gigId) {
            const roomName = `gig:${gigId}`;
            socket.join(roomName);
            console.log(`Socket ${socket.id} joined room ${roomName}`);
        }
    });

    socket.on('leave_gig_chat', (gigId) => {
        if (gigId) {
            const roomName = `gig:${gigId}`;
            socket.leave(roomName);
            console.log(`Socket ${socket.id} left room ${roomName}`);
        }
    });

    socket.on('gig_chat_typing', ({ gigId, userId, isTyping }) => {
        if (!gigId || !userId) {
            return;
        }

        socket.to(`gig:${gigId}`).emit('gig_chat_typing', {
            gigId,
            userId,
            isTyping: Boolean(isTyping),
        });
    });

    socket.on('disconnect', () => {
        const userId = socket.data.userId;
        if (userId) {
            const currentCount = onlineUsers.get(userId) || 0;
            if (currentCount <= 1) {
                onlineUsers.delete(userId);
                broadcastPresence(userId, false);
            } else {
                onlineUsers.set(userId, currentCount - 1);
            }
        }
        console.log('Client disconnected:', socket.id);
    });
});

// Middleware
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));
app.use(cookieParser());
app.use(cors({
    origin: allowedOrigins,
    credentials: true
}));

// 4. Attach IO to Request so controllers can use it
app.use((req, res, next) => {
    req.io = io;
    req.onlineUsers = onlineUsers;
    next();
});

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/gigs', gigRoutes);
app.use('/api/bids', bidRoutes);
app.use('/api/reviews', reviewRoutes); // <--- ADDED THIS
app.use('/api/chats', chatRoutes);
app.use('/api/admin', adminRoutes);

app.get('/', (req, res) => {
    res.send('API is running...');
});

app.use(notFound);
app.use(errorHandler);

const PORT = process.env.PORT || 5000;

// 5. Change app.listen to httpServer.listen
httpServer.listen(PORT, () => console.log(`Server running on port ${PORT}`));