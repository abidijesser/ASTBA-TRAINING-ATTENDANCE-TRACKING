import express from 'express';
import { protect } from '../middleware/auth.js';
import { chat, getChatQuestions } from '../controllers/chatController.js';

const router = express.Router();

// GET /api/chat/questions
router.get('/questions', protect, getChatQuestions);

// POST /api/chat
router.post('/', protect, chat);

export default router;
