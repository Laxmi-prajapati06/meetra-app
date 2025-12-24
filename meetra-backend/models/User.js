// models/User.js
const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const userSchema = new mongoose.Schema({
    username: {
        type: String,
        required: [true, 'Username is required'],
        unique: true,
        trim: true,
        minlength: [3, 'Username must be at least 3 characters long'],
        maxlength: [30, 'Username cannot exceed 30 characters'],
        match: [/^[a-zA-Z0-9_]+$/, 'Username can only contain letters, numbers and underscores']
    },
    email: {
        type: String,
        required: [true, 'Email is required'],
        unique: true,
        lowercase: true,
        trim: true,
        validate: {
            validator: function(email) {
                return /^[a-zA-Z0-9._%+-]+@medicaps\.ac\.in$/.test(email);
            },
            message: 'Email must be a valid Medicaps University email address (@medicaps.ac.in)'
        }
    },
    collegeId: {
        type: String,
        required: [true, 'College ID is required'],
        unique: true,
        uppercase: true,
        match: [/^\d{7}$/, 'College ID must be exactly 7 digits']
    },
    enrollmentNumber: {
        type: String,
        required: [true, 'Enrollment number is required'],
        unique: true,
        validate: {
            validator: function(enrollment) {
                return /^EN22IT\d{6}$/.test(enrollment);
            },
            message: 'Enrollment number must be in format: EN22ITXXXXXX'
        }
    },
    password: {
        type: String,
        required: [true, 'Password is required'],
        minlength: [6, 'Password must be at least 6 characters long'],
        select: false // Don't return password in queries by default
    },
    profile: {
        fullName: {
            type: String,
            trim: true,
            maxlength: [50, 'Full name cannot exceed 50 characters']
        },
        branch: {
            type: String,
            enum: ['Computer Science', 'Information Technology', 'Electronics', 'Mechanical', 'Civil', 'Business', 'Other'],
            default: 'Computer Science'
        },
        specialization: {
            type: String,
            trim: true,
            maxlength: [50, 'Specialization cannot exceed 50 characters']
        },
        year: {
            type: String,
            enum: ['First', 'Second', 'Third', 'Fourth', 'Graduate'],
            default: 'First'
        },
        about: {
            type: String,
            maxlength: [500, 'About cannot exceed 500 characters'],
            default: ''
        },
        interests: [{
            type: String,
            trim: true,
            maxlength: [100, 'Interest cannot exceed 100 characters']
        }],
        profilePicture: {
            type: String,
            default: ''
        },
        socialLinks: {
            instagram: String,
            linkedin: String,
            github: String
        }
    },
    connections: [{
        user: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'User'
        },
        connectedAt: {
            type: Date,
            default: Date.now
        }
    }],
    eventsJoined: [{
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Event'
    }],
    eventsCreated: [{
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Event'
    }],
    plannedVisits: [{
        placeId: { type: String },
        name: { type: String },
        category: { type: String },
        notes: { type: String, default: '' },
        plannedAt: { type: Date, default: Date.now }
    }],
    isVerified: {
        type: Boolean,
        default: false
    },
    lastActive: {
        type: Date,
        default: Date.now
    }
}, {
    timestamps: true
});

// Index for better query performance
userSchema.index({ email: 1 });
userSchema.index({ collegeId: 1 });
userSchema.index({ 'profile.branch': 1 });
userSchema.index({ 'profile.interests': 1 });

// Hash password before saving
userSchema.pre('save', async function(next) {
    if (!this.isModified('password')) {
        next();
    }
    
    const salt = await bcrypt.genSalt(12);
    this.password = await bcrypt.hash(this.password, salt);
    next();
});

// Update lastActive timestamp before saving
userSchema.pre('save', function(next) {
    this.lastActive = new Date();
    next();
});

// Compare password method
userSchema.methods.matchPassword = async function(enteredPassword) {
    return await bcrypt.compare(enteredPassword, this.password);
};

// Get public profile (remove sensitive data)
userSchema.methods.getPublicProfile = function() {
    const userObject = this.toObject();
    delete userObject.password;
    delete userObject.__v;
    return userObject;
};

module.exports = mongoose.model('User', userSchema);