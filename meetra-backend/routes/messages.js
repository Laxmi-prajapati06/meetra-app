// routes/messages.js
const express = require('express');
const { protect } = require('../middleware/auth');
const {
    getMessages,
    getConversations,
    markMessagesAsRead
} = require('../controllers/messageController');

const router = express.Router();

router.get('/conversations', protect, getConversations);
router.get('/:userId', protect, getMessages);
router.put('/read', protect, markMessagesAsRead);

// Send message via REST (fallback when socket is unavailable)
router.post('/', protect, require('../controllers/messageController').sendMessage);

module.exports = router;