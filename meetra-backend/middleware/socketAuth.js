// middleware/socketAuth.js
const jwt = require('jsonwebtoken');
const User = require('../models/User');

const protectSocket = async (token) => {
    try {
        if (!token) {
            throw new Error('No token provided');
        }

        // Verify token
        const decoded = jwt.verify(token, process.env.JWT_SECRET);

        // Get user from token
        const user = await User.findById(decoded.id).select('-password');

        if (!user) {
            throw new Error('User not found');
        }

        return user;
    } catch (error) {
        throw new Error('Not authorized');
    }
};

module.exports = { protectSocket };