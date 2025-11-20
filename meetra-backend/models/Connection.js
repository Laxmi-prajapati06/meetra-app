// models/Connection.js
const mongoose = require('mongoose');

const connectionSchema = new mongoose.Schema({
    user1: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    user2: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    status: {
        type: String,
        enum: ['pending', 'accepted', 'rejected', 'blocked'],
        default: 'pending'
    },
    initiatedBy: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    lastInteraction: {
        type: Date,
        default: Date.now
    }
}, {
    timestamps: true
});

// Ensure unique connection between two users
connectionSchema.index({ user1: 1, user2: 1 }, { unique: true });

// Virtual for connection strength (based on common interests, events, etc.)
connectionSchema.virtual('connectionStrength').get(function() {
    // This would be calculated based on various factors
    return 0.5; // Placeholder
});

module.exports = mongoose.model('Connection', connectionSchema);