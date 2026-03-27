import express from 'express';
import {
    canAccessGigChat,
    deleteGigChatMessage,
    getChatConversations,
    getChatSummary,
    getGigChatMessages,
    markGigChatRead,
    sendGigChatMessage,
} from '../controllers/chatController.js';
import { protect } from '../middleware/auth.js';

const router = express.Router();

router.get('/summary', protect, getChatSummary);
router.get('/conversations', protect, getChatConversations);
router.get('/gig/:gigId/access', protect, canAccessGigChat);
router.get('/gig/:gigId', protect, getGigChatMessages);
router.patch('/gig/:gigId/read', protect, markGigChatRead);
router.post('/gig/:gigId', protect, sendGigChatMessage);
router.delete('/gig/:gigId/:messageId', protect, deleteGigChatMessage);

export default router;