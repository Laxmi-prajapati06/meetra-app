// routes/auth.js
const express = require('express');
const { 
    registerUser, 
    loginUser, 
    getMe,
    updateProfile 
} = require('../controllers/authController');
const { protect } = require('../middleware/auth');
const { validateSignup } = require('../middleware/validation');

const router = express.Router();

router.post('/register', validateSignup, registerUser);
router.post('/login', loginUser);
router.get('/me', protect, getMe);
router.put('/profile', protect, updateProfile); // Make sure updateProfile is a function

module.exports = router;