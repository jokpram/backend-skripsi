import express from 'express';
import { verifyToken } from '../middleware/authMiddleware.js';
import { fetchConversations, fetchMessages, sendMessage } from '../controllers/chatController.js';

const router = express.Router();

router.use(verifyToken);

// Get distinctive conversations
router.get('/conversations', fetchConversations);

// Get messages for a specific conversation
router.get('/messages/:otherRole/:otherId', fetchMessages);

// Send a message
router.post('/messages', sendMessage);

export default router;
