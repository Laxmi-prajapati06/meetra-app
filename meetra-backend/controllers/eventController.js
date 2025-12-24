// controllers/eventController.js
const Event = require('../models/Event');
const User = require('../models/User');

// @desc    Create new event
// @route   POST /api/events
// @access  Private
const createEvent = async (req, res) => {
    try {
        const {
            title,
            description,
            category,
            date,
            time,
            location,
            maxAttendees,
            tags,
            price,
            requirements,
            visibility,
            coordinates,
            images
        } = req.body;

        const event = await Event.create({
            title,
            description,
            category,
            date,
            time,
            location,
            maxAttendees: parseInt(maxAttendees),
            organizer: req.user._id,
            tags: tags || [],
            price: price || { type: 'free', amount: 0, currency: 'INR' },
            requirements: requirements || '',
            visibility: visibility || 'public',
            coordinates: coordinates || null,
            images: images || []
        });

        // Add event to user's created events
        await User.findByIdAndUpdate(req.user._id, {
            $push: { eventsCreated: event._id }
        });

        const populatedEvent = await Event.findById(event._id)
            .populate('organizer', 'username profile')
            .populate('attendees.user', 'username profile');

        res.status(201).json({
            success: true,
            message: 'Event created successfully',
            data: populatedEvent
        });
    } catch (error) {
        console.error('Create event error:', error);
        
        if (error.name === 'ValidationError') {
            const errors = Object.values(error.errors).map(err => err.message);
            console.error('Validation errors:', errors);
            return res.status(400).json({
                success: false,
                message: 'Event validation failed',
                errors
            });
        }

        console.error('Full error:', error);
        res.status(500).json({
            success: false,
            message: 'Server error while creating event',
            details: process.env.NODE_ENV === 'development' ? error.message : undefined
        });
    }
};

// @desc    Get all events with filtering and pagination
// @route   GET /api/events
// @access  Public
const getEvents = async (req, res) => {
    try {
        const { 
            category, 
            page = 1, 
            limit = 10, 
            search, 
            location,
            dateFrom,
            dateTo,
            sortBy = 'date',
            sortOrder = 'asc'
        } = req.query;

        let query = { status: 'active' };

        // Filter by category
        if (category && category !== 'All') {
            query.category = category;
        }

        // Search in title and description
        if (search) {
            query.$or = [
                { title: { $regex: search, $options: 'i' } },
                { description: { $regex: search, $options: 'i' } },
                { tags: { $in: [new RegExp(search, 'i')] } }
            ];
        }

        // Filter by location
        if (location) {
            query.location = { $regex: location, $options: 'i' };
        }

        // Filter by date range
        if (dateFrom || dateTo) {
            query.date = {};
            if (dateFrom) query.date.$gte = new Date(dateFrom);
            if (dateTo) query.date.$lte = new Date(dateTo);
        }

        // Sort options
        const sortOptions = {};
        sortOptions[sortBy] = sortOrder === 'desc' ? -1 : 1;

        const events = await Event.find(query)
            .populate('organizer', 'username profile')
            .populate('attendees.user', 'username profile')
            .sort(sortOptions)
            .limit(limit * 1)
            .skip((page - 1) * limit);

        const total = await Event.countDocuments(query);

        res.json({
            success: true,
            data: events,
            pagination: {
                currentPage: parseInt(page),
                totalPages: Math.ceil(total / limit),
                totalEvents: total,
                hasNext: page < Math.ceil(total / limit),
                hasPrev: page > 1
            }
        });
    } catch (error) {
        console.error('Get events error:', error);
        res.status(500).json({
            success: false,
            message: 'Server error while fetching events'
        });
    }
};

// @desc    Get single event
// @route   GET /api/events/:id
// @access  Public
const getEvent = async (req, res) => {
    try {
        const event = await Event.findById(req.params.id)
            .populate('organizer', 'username profile collegeId')
            .populate('attendees.user', 'username profile branch');

        if (!event) {
            return res.status(404).json({
                success: false,
                message: 'Event not found'
            });
        }

        res.json({
            success: true,
            data: event
        });
    } catch (error) {
        console.error('Get event error:', error);
        res.status(500).json({
            success: false,
            message: 'Server error while fetching event'
        });
    }
};

// @desc    Join event
// @route   POST /api/events/:id/join
// @access  Private
const joinEvent = async (req, res) => {
    try {
        const event = await Event.findById(req.params.id);

        if (!event) {
            return res.status(404).json({
                success: false,
                message: 'Event not found'
            });
        }

        // Check if user is the organizer
        if (event.organizer.toString() === req.user._id.toString()) {
            return res.status(400).json({
                success: false,
                message: 'You cannot join your own event'
            });
        }

        // Check if user is already attending
        const isAttending = event.attendees.some(
            attendee => attendee.user.toString() === req.user._id.toString()
        );

        if (isAttending) {
            return res.status(400).json({
                success: false,
                message: 'You are already attending this event'
            });
        }

        // Check if event is full
        if (event.isFull) {
            return res.status(400).json({
                success: false,
                message: 'Event is full'
            });
        }

        // Check event visibility
        if (event.visibility === 'connections-only') {
            // TODO: Implement connections check
            // For now, allow joining
        }

        // Add user to attendees
        event.attendees.push({ 
            user: req.user._id,
            status: 'going'
        });
        
        await event.save();

        // Add event to user's joined events
        await User.findByIdAndUpdate(req.user._id, {
            $push: { eventsJoined: event._id }
        });

        const updatedEvent = await Event.findById(req.params.id)
            .populate('organizer', 'username profile')
            .populate('attendees.user', 'username profile');

        res.json({
            success: true,
            message: 'Successfully joined the event',
            data: updatedEvent
        });
    } catch (error) {
        console.error('Join event error:', error);
        res.status(500).json({
            success: false,
            message: 'Server error while joining event'
        });
    }
};

// @desc    Leave event
// @route   POST /api/events/:id/leave
// @access  Private
const leaveEvent = async (req, res) => {
    try {
        const event = await Event.findById(req.params.id);

        if (!event) {
            return res.status(404).json({
                success: false,
                message: 'Event not found'
            });
        }

        // Remove user from attendees
        event.attendees = event.attendees.filter(
            attendee => attendee.user.toString() !== req.user._id.toString()
        );
        await event.save();

        // Remove event from user's joined events
        await User.findByIdAndUpdate(req.user._id, {
            $pull: { eventsJoined: event._id }
        });

        res.json({
            success: true,
            message: 'Successfully left the event'
        });
    } catch (error) {
        console.error('Leave event error:', error);
        res.status(500).json({
            success: false,
            message: 'Server error while leaving event'
        });
    }
};

// @desc    Get user's events (created and joined)
// @route   GET /api/events/my-events
// @access  Private
const getMyEvents = async (req, res) => {
    try {
        const user = await User.findById(req.user._id)
            .populate({
                path: 'eventsCreated',
                populate: { 
                    path: 'attendees.user', 
                    select: 'username profile' 
                }
            })
            .populate({
                path: 'eventsJoined',
                populate: { 
                    path: 'organizer', 
                    select: 'username profile' 
                }
            });

        res.json({
            success: true,
            data: {
                created: user.eventsCreated,
                joined: user.eventsJoined
            }
        });
    } catch (error) {
        console.error('Get my events error:', error);
        res.status(500).json({
            success: false,
            message: 'Server error while fetching your events'
        });
    }
};

// @desc    Update event
// @route   PUT /api/events/:id
// @access  Private
const updateEvent = async (req, res) => {
    try {
        let event = await Event.findById(req.params.id);

        if (!event) {
            return res.status(404).json({
                success: false,
                message: 'Event not found'
            });
        }

        // Check if user is the organizer
        if (event.organizer.toString() !== req.user._id.toString()) {
            return res.status(403).json({
                success: false,
                message: 'Not authorized to update this event'
            });
        }

        event = await Event.findByIdAndUpdate(
            req.params.id,
            req.body,
            { new: true, runValidators: true }
        ).populate('organizer', 'username profile')
         .populate('attendees.user', 'username profile');

        res.json({
            success: true,
            message: 'Event updated successfully',
            data: event
        });
    } catch (error) {
        console.error('Update event error:', error);
        res.status(500).json({
            success: false,
            message: 'Server error while updating event'
        });
    }
};

// @desc    Delete event
// @route   DELETE /api/events/:id
// @access  Private
const deleteEvent = async (req, res) => {
    try {
        const event = await Event.findById(req.params.id);

        if (!event) {
            return res.status(404).json({
                success: false,
                message: 'Event not found'
            });
        }

        // Check if user is the organizer
        if (event.organizer.toString() !== req.user._id.toString()) {
            return res.status(403).json({
                success: false,
                message: 'Not authorized to delete this event'
            });
        }

        // Remove event from all users' joined events
        await User.updateMany(
            { eventsJoined: event._id },
            { $pull: { eventsJoined: event._id } }
        );

        // Remove event from organizer's created events
        await User.findByIdAndUpdate(req.user._id, {
            $pull: { eventsCreated: event._id }
        });

        await Event.findByIdAndDelete(req.params.id);

        res.json({
            success: true,
            message: 'Event deleted successfully'
        });
    } catch (error) {
        console.error('Delete event error:', error);
        res.status(500).json({
            success: false,
            message: 'Server error while deleting event'
        });
    }
};

module.exports = {
    createEvent,
    getEvents,
    getEvent,
    joinEvent,
    leaveEvent,
    getMyEvents,
    updateEvent,
    deleteEvent
};