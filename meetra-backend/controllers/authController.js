// controllers/authController.js - Fix this file
const User = require('../models/User');
const { generateToken } = require('../middleware/auth');

// @desc    Register user
// @route   POST /api/auth/register
// @access  Public
const registerUser = async (req, res) => {
    try {
        const { username, email, collegeId, enrollmentNumber, password } = req.body;

        console.log('Registration attempt:', { username, email, collegeId, enrollmentNumber });

        // Check if user already exists
        const existingUser = await User.findOne({
            $or: [
                { email: email.toLowerCase() },
                { username: username.toLowerCase() },
                { collegeId: collegeId.toUpperCase() },
                { enrollmentNumber }
            ]
        });

        if (existingUser) {
            let field = 'user';
            if (existingUser.email === email.toLowerCase()) field = 'email';
            else if (existingUser.username === username.toLowerCase()) field = 'username';
            else if (existingUser.collegeId === collegeId.toUpperCase()) field = 'college ID';
            else if (existingUser.enrollmentNumber === enrollmentNumber) field = 'enrollment number';

            return res.status(400).json({
                success: false,
                message: `User with this ${field} already exists`
            });
        }

        // Create user
        const user = await User.create({
            username: username.toLowerCase(),
            email: email.toLowerCase(),
            collegeId: collegeId.toUpperCase(),
            enrollmentNumber,
            password
        });

        if (user) {
            res.status(201).json({
                success: true,
                message: 'User registered successfully',
                data: {
                    _id: user._id,
                    username: user.username,
                    email: user.email,
                    collegeId: user.collegeId,
                    profile: user.profile,
                    token: generateToken(user._id)
                }
            });
        }
    } catch (error) {
        console.error('Registration error:', error);
        
        if (error.name === 'ValidationError') {
            const errors = Object.values(error.errors).map(err => err.message);
            return res.status(400).json({
                success: false,
                message: 'Validation failed',
                errors
            });
        }

        res.status(500).json({
            success: false,
            message: 'Server error during registration'
        });
    }
};

// @desc    Login user
// @route   POST /api/auth/login
// @access  Public
const loginUser = async (req, res) => {
    try {
        const { email, password } = req.body;

        console.log('Login attempt:', { email });

        if (!email || !password) {
            return res.status(400).json({
                success: false,
                message: 'Please provide email and password'
            });
        }

        // Check for user with password
        const user = await User.findOne({ email: email.toLowerCase() }).select('+password');

        if (!user) {
            return res.status(401).json({
                success: false,
                message: 'Invalid email or password'
            });
        }

        // Check password
        const isPasswordMatch = await user.matchPassword(password);
        
        if (!isPasswordMatch) {
            return res.status(401).json({
                success: false,
                message: 'Invalid email or password'
            });
        }

        // Update last active
        user.lastActive = new Date();
        await user.save();

        res.json({
            success: true,
            message: 'Login successful',
            data: {
                _id: user._id,
                username: user.username,
                email: user.email,
                collegeId: user.collegeId,
                profile: user.profile,
                token: generateToken(user._id)
            }
        });
    } catch (error) {
        console.error('Login error:', error);
        res.status(500).json({
            success: false,
            message: 'Server error during login'
        });
    }
};

// @desc    Get current user
// @route   GET /api/auth/me
// @access  Private
const getMe = async (req, res) => {
    try {
        const user = await User.findById(req.user._id)
            .select('-password')
            .populate('connections.user', 'username profile')
            .populate('eventsJoined', 'title date location')
            .populate('eventsCreated', 'title date location');

        res.json({
            success: true,
            data: user
        });
    } catch (error) {
        console.error('Get user error:', error);
        res.status(500).json({
            success: false,
            message: 'Server error while fetching user data'
        });
    }
};

const updateProfile = async (req, res) => {
    try {
        const { fullName, branch, specialization, year, about, interests, socialLinks } = req.body;

        const user = await User.findByIdAndUpdate(
            req.user._id,
            {
                $set: {
                    'profile.fullName': fullName,
                    'profile.branch': branch,
                    'profile.specialization': specialization,
                    'profile.year': year,
                    'profile.about': about,
                    'profile.interests': interests,
                    'profile.socialLinks': socialLinks
                }
            },
            { new: true, runValidators: true }
        ).select('-password');

        res.json({
            success: true,
            message: 'Profile updated successfully',
            data: user
        });
    } catch (error) {
        console.error('Update profile error:', error);
        // Return validation errors with details when possible
        if (error.name === 'ValidationError') {
            const errors = Object.values(error.errors).map(err => err.message);
            return res.status(400).json({
                success: false,
                message: 'Validation failed',
                errors
            });
        }

        // Return error message for easier debugging (do not expose in production)
        res.status(500).json({
            success: false,
            message: 'Server error while updating profile',
            error: error.message
        });
    }
};

module.exports = {
    registerUser,
    loginUser,
    getMe,
    updateProfile
};