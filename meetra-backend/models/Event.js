// models/Event.js
const mongoose = require('mongoose');

const eventSchema = new mongoose.Schema({
    title: {
        type: String,
        required: [true, 'Event title is required'],
        trim: true,
        maxlength: [100, 'Title cannot exceed 100 characters']
    },
    description: {
        type: String,
        required: [true, 'Event description is required'],
        maxlength: [1000, 'Description cannot exceed 1000 characters']
    },
    category: {
        type: String,
        required: [true, 'Category is required'],
        enum: [
            'Academic / Educational',
            'Cultural',
            'Entertainment',
            'Sports & Fitness',
            'Spiritual/Religious',
            'Social Gathering',
            'Workshop',
            'Conference'
        ]
    },
    date: {
        type: Date,
        required: [true, 'Event date is required'],
        validate: {
            validator: function(date) {
                return date > new Date();
            },
            message: 'Event date must be in the future'
        }
    },
    time: {
        start: {
            type: String,
            required: [true, 'Start time is required']
        },
        end: {
            type: String,
            required: [true, 'End time is required']
        }
    },
    location: {
        type: String,
        required: [true, 'Event location is required'],
        maxlength: [200, 'Location cannot exceed 200 characters']
    },
    coordinates: {
        latitude: Number,
        longitude: Number
    },
    maxAttendees: {
        type: Number,
        required: [true, 'Maximum attendees is required'],
        min: [1, 'Maximum attendees must be at least 1'],
        max: [500, 'Maximum attendees cannot exceed 500']
    },
    organizer: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    attendees: [{
        user: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'User'
        },
        joinedAt: {
            type: Date,
            default: Date.now
        },
        status: {
            type: String,
            enum: ['going', 'interested', 'not-going'],
            default: 'going'
        }
    }],
    tags: [{
        type: String,
        trim: true,
        maxlength: [20, 'Tag cannot exceed 20 characters']
    }],
    images: [{
        url: String,
        publicId: String
    }],
    price: {
        type: {
            type: String,
            enum: ['free', 'paid'],
            default: 'free'
        },
        amount: {
            type: Number,
            default: 0,
            min: [0, 'Price cannot be negative']
        },
        currency: {
            type: String,
            default: 'INR'
        }
    },
    requirements: {
        type: String,
        maxlength: [200, 'Requirements cannot exceed 200 characters']
    },
    status: {
        type: String,
        enum: ['active', 'cancelled', 'completed', 'full'],
        default: 'active'
    },
    visibility: {
        type: String,
        enum: ['public', 'private', 'connections-only'],
        default: 'public'
    },
    chatEnabled: {
        type: Boolean,
        default: true
    }
}, {
    timestamps: true
});

// Virtual for attendees count
eventSchema.virtual('attendeesCount').get(function() {
    return this.attendees.filter(attendee => attendee.status === 'going').length;
});

// Virtual for available spots
eventSchema.virtual('availableSpots').get(function() {
    return Math.max(0, this.maxAttendees - this.attendeesCount);
});

// Check if event is full
eventSchema.virtual('isFull').get(function() {
    return this.attendeesCount >= this.maxAttendees;
});

// Indexes for better query performance
eventSchema.index({ category: 1, date: 1 });
eventSchema.index({ organizer: 1 });
eventSchema.index({ status: 1 });
// Location stored as string, not GeoJSON, so use text index instead of 2dsphere
eventSchema.index({ location: 'text' });
eventSchema.index({ tags: 1 });

// Update status based on attendees count and date
eventSchema.pre('save', function(next) {
    if (this.attendeesCount >= this.maxAttendees && this.status === 'active') {
        this.status = 'full';
    }
    
    if (this.date < new Date() && this.status === 'active') {
        this.status = 'completed';
    }
    next();
});

module.exports = mongoose.model('Event', eventSchema);