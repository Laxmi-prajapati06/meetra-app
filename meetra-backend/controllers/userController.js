// controllers/userController.js
const User = require('../models/User');
const Event = require('../models/Event');

// @desc    Get user profile by ID
// @route   GET /api/users/:id
// @access  Public
const getUserProfile = async (req, res) => {
    try {
        const user = await User.findById(req.params.id)
            .select('-password -email -collegeId -enrollmentNumber')
            .populate('connections.user', 'username profile')
            .populate('eventsJoined', 'title date category')
            .populate('eventsCreated', 'title date category');

        if (!user) {
            return res.status(404).json({
                success: false,
                message: 'User not found'
            });
        }

        res.json({
            success: true,
            data: user
        });
    } catch (error) {
        console.error('Get user profile error:', error);
        res.status(500).json({
            success: false,
            message: 'Server error while fetching user profile'
        });
    }
};

// @desc    Get all users with filtering
// @route   GET /api/users
// @access  Private
const getUsers = async (req, res) => {
    try {
        const { 
            branch, 
            year, 
            interests, 
            search, 
            page = 1, 
            limit = 10 
        } = req.query;

        let query = { _id: { $ne: req.user._id } }; // Exclude current user

        // Filter by branch
        if (branch) {
            query['profile.branch'] = branch;
        }

        // Filter by year
        if (year) {
            query['profile.year'] = year;
        }

        // Filter by interests
        if (interests) {
            const interestsArray = interests.split(',');
            query['profile.interests'] = { $in: interestsArray };
        }

        // Search in username and fullName
        if (search) {
            query.$or = [
                { username: { $regex: search, $options: 'i' } },
                { 'profile.fullName': { $regex: search, $options: 'i' } }
            ];
        }

        const users = await User.find(query)
            .select('username profile connections eventsJoined')
            .limit(limit * 1)
            .skip((page - 1) * limit)
            .sort({ 'profile.fullName': 1 });

        const total = await User.countDocuments(query);

        res.json({
            success: true,
            data: users,
            pagination: {
                currentPage: parseInt(page),
                totalPages: Math.ceil(total / limit),
                totalUsers: total
            }
        });
    } catch (error) {
        console.error('Get users error:', error);
        res.status(500).json({
            success: false,
            message: 'Server error while fetching users'
        });
    }
};

// @desc    Connect with user
// @route   POST /api/users/:id/connect
// @access  Private
const connectUser = async (req, res) => {
    try {
        const targetUserId = req.params.id;
        
        if (targetUserId === req.user._id.toString()) {
            return res.status(400).json({
                success: false,
                message: 'Cannot connect with yourself'
            });
        }

        const targetUser = await User.findById(targetUserId);
        if (!targetUser) {
            return res.status(404).json({
                success: false,
                message: 'User not found'
            });
        }

        const currentUser = await User.findById(req.user._id);

        // Check if already connected
        const isAlreadyConnected = currentUser.connections.some(
            conn => conn.user.toString() === targetUserId
        );

        if (isAlreadyConnected) {
            return res.status(400).json({
                success: false,
                message: 'Already connected with this user'
            });
        }

        // Add to both users' connections
        await User.findByIdAndUpdate(req.user._id, {
            $push: { 
                connections: { 
                    user: targetUserId,
                    connectedAt: new Date()
                } 
            }
        });

        await User.findByIdAndUpdate(targetUserId, {
            $push: { 
                connections: { 
                    user: req.user._id,
                    connectedAt: new Date()
                } 
            }
        });

        // Return updated user with populated connections so frontend persists across refresh
        const updatedUser = await User.findById(req.user._id)
            .select('-password')
            .populate('connections.user', 'username profile')
            .populate('eventsJoined', 'title date location')
            .populate('eventsCreated', 'title date location');

        res.json({
            success: true,
            message: 'Successfully connected with user',
            data: updatedUser
        });
    } catch (error) {
        console.error('Connect user error:', error);
        res.status(500).json({
            success: false,
            message: 'Server error while connecting with user'
        });
    }
};

// @desc    Disconnect from user
// @route   POST /api/users/:id/disconnect
// @access  Private
const disconnectUser = async (req, res) => {
    try {
        const targetUserId = req.params.id;

        // Remove from both users' connections
        await User.findByIdAndUpdate(req.user._id, {
            $pull: { connections: { user: targetUserId } }
        });

        await User.findByIdAndUpdate(targetUserId, {
            $pull: { connections: { user: req.user._id } }
        });

        res.json({
            success: true,
            message: 'Successfully disconnected from user'
        });
    } catch (error) {
        console.error('Disconnect user error:', error);
        res.status(500).json({
            success: false,
            message: 'Server error while disconnecting from user'
        });
    }
};

// @desc    Get user suggestions based on interests and branch
// @route   GET /api/users/suggestions
// @access  Private
const getUserSuggestions = async (req, res) => {
    try {
        const currentUser = await User.findById(req.user._id);
        
        // Find users with similar interests or same branch, excluding already connected
        const connectedUserIds = currentUser.connections.map(conn => conn.user);
        connectedUserIds.push(req.user._id); // Exclude self

        const suggestions = await User.aggregate([
            {
                $match: {
                    _id: { $nin: connectedUserIds },
                    $or: [
                        { 'profile.interests': { $in: currentUser.profile.interests } },
                        { 'profile.branch': currentUser.profile.branch }
                    ]
                }
            },
            {
                $addFields: {
                    commonInterests: {
                        $size: {
                            $setIntersection: ['$profile.interests', currentUser.profile.interests]
                        }
                    },
                    sameBranch: {
                        $cond: [{ $eq: ['$profile.branch', currentUser.profile.branch] }, 1, 0]
                    }
                }
            },
            {
                $sort: {
                    sameBranch: -1,
                    commonInterests: -1,
                    'profile.fullName': 1
                }
            },
            {
                $limit: 10
            },
            {
                $project: {
                    username: 1,
                    profile: 1,
                    commonInterests: 1,
                    sameBranch: 1
                }
            }
        ]);

        res.json({
            success: true,
            data: suggestions
        });
    } catch (error) {
        console.error('Get user suggestions error:', error);
        res.status(500).json({
            success: false,
            message: 'Server error while fetching user suggestions'
        });
    }
};

module.exports = {
    getUserProfile,
    getUsers,
    connectUser,
    disconnectUser,
    getUserSuggestions
};
// @desc    Plan a visit (add place to user's planned visits)
// @route   POST /api/users/plan-visit
// @access  Private
const planVisit = async (req, res) => {
    try {
        const { placeId, name, category, notes } = req.body;

        if (!name) {
            return res.status(400).json({ success: false, message: 'Place name is required' });
        }

        // Prevent duplicate planned visits for same placeId
        const current = await User.findById(req.user._id).select('plannedVisits');
        const exists = current.plannedVisits && current.plannedVisits.some(p => p.placeId === (placeId ? placeId.toString() : undefined));

        if (exists) {
            return res.json({ success: true, message: 'Planned visit already exists', data: current.plannedVisits });
        }

        const update = {
            $push: { plannedVisits: { placeId: placeId ? placeId.toString() : undefined, name, category, notes: notes || '' } }
        };

        const user = await User.findByIdAndUpdate(req.user._id, update, { new: true }).select('-password');

        res.json({ success: true, message: 'Planned visit added', data: user.plannedVisits });
    } catch (error) {
        console.error('Plan visit error:', error);
        res.status(500).json({ success: false, message: 'Server error while planning visit' });
    }
};

// @desc    Remove a planned visit by placeId
// @route   DELETE /api/users/plan-visit/:placeId
// @access  Private
const removePlannedVisit = async (req, res) => {
    try {
        const { placeId } = req.params;

        if (!placeId) {
            return res.status(400).json({ success: false, message: 'placeId is required' });
        }

        const user = await User.findByIdAndUpdate(
            req.user._id,
            { $pull: { plannedVisits: { placeId: placeId.toString() } } },
            { new: true }
        ).select('-password');

        res.json({ success: true, message: 'Planned visit removed', data: user.plannedVisits });
    } catch (error) {
        console.error('Remove planned visit error:', error);
        res.status(500).json({ success: false, message: 'Server error while removing planned visit' });
    }
};

module.exports = {
    getUserProfile,
    getUsers,
    connectUser,
    disconnectUser,
    getUserSuggestions,
    planVisit,
    removePlannedVisit
};