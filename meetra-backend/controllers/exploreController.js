// controllers/exploreController.js
const Place = require('../models/Place');

// @desc    Get all places with filtering
// @route   GET /api/explore
// @access  Public
const getPlaces = async (req, res) => {
    try {
        const { 
            category, 
            search, 
            page = 1, 
            limit = 10 
        } = req.query;

        let query = {};

        // Filter by category
        if (category && category !== 'All') {
            query.category = category;
        }

        // Search in name and description
        if (search) {
            query.$or = [
                { name: { $regex: search, $options: 'i' } },
                { description: { $regex: search, $options: 'i' } },
                { tags: { $in: [new RegExp(search, 'i')] } }
            ];
        }

        const places = await Place.find(query)
            .sort({ rating: -1, name: 1 })
            .limit(limit * 1)
            .skip((page - 1) * limit);

        const total = await Place.countDocuments(query);

        res.json({
            success: true,
            data: places,
            pagination: {
                currentPage: parseInt(page),
                totalPages: Math.ceil(total / limit),
                totalPlaces: total
            }
        });
    } catch (error) {
        console.error('Get places error:', error);
        res.status(500).json({
            success: false,
            message: 'Server error while fetching places'
        });
    }
};

// @desc    Get place by ID
// @route   GET /api/explore/:id
// @access  Public
const getPlace = async (req, res) => {
    try {
        const place = await Place.findById(req.params.id);

        if (!place) {
            return res.status(404).json({
                success: false,
                message: 'Place not found'
            });
        }

        res.json({
            success: true,
            data: place
        });
    } catch (error) {
        console.error('Get place error:', error);
        res.status(500).json({
            success: false,
            message: 'Server error while fetching place'
        });
    }
};

// @desc    Add review to place
// @route   POST /api/explore/:id/reviews
// @access  Private
const addReview = async (req, res) => {
    try {
        const { rating, comment } = req.body;

        const place = await Place.findById(req.params.id);

        if (!place) {
            return res.status(404).json({
                success: false,
                message: 'Place not found'
            });
        }

        // Check if user already reviewed
        const existingReview = place.reviews.find(
            review => review.user.toString() === req.user._id.toString()
        );

        if (existingReview) {
            return res.status(400).json({
                success: false,
                message: 'You have already reviewed this place'
            });
        }

        // Add review
        place.reviews.push({
            user: req.user._id,
            rating,
            comment,
            createdAt: new Date()
        });

        // Recalculate average rating
        const totalRating = place.reviews.reduce((sum, review) => sum + review.rating, 0);
        place.rating = totalRating / place.reviews.length;

        await place.save();

        const updatedPlace = await Place.findById(req.params.id)
            .populate('reviews.user', 'username profile');

        res.json({
            success: true,
            message: 'Review added successfully',
            data: updatedPlace
        });
    } catch (error) {
        console.error('Add review error:', error);
        res.status(500).json({
            success: false,
            message: 'Server error while adding review'
        });
    }
};

module.exports = {
    getPlaces,
    getPlace,
    addReview
};