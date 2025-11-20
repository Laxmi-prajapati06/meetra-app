// routes/users.js
const express = require('express');
const {
    getUserProfile,
    getUsers,
    connectUser,
    disconnectUser,
    getUserSuggestions,
    planVisit
} = require('../controllers/userController');
const { removePlannedVisit } = require('../controllers/userController');
const { protect } = require('../middleware/auth');

const router = express.Router();

router.get('/', protect, getUsers);
router.get('/suggestions', protect, getUserSuggestions);
router.get('/:id', getUserProfile);
router.post('/:id/connect', protect, connectUser);
router.post('/:id/disconnect', protect, disconnectUser);
router.post('/plan-visit', protect, planVisit);
router.delete('/plan-visit/:placeId', protect, removePlannedVisit);

module.exports = router;