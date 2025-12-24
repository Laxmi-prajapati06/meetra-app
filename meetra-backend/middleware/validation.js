// middleware/validation.js
const validateSignup = (req, res, next) => {
    const { username, email, collegeId, enrollmentNumber, password } = req.body;

    const errors = [];

    // Check required fields
    if (!username) errors.push('Username is required');
    if (!email) errors.push('Email is required');
    if (!collegeId) errors.push('College ID is required');
    if (!enrollmentNumber) errors.push('Enrollment number is required');
    if (!password) errors.push('Password is required');

    if (errors.length > 0) {
        return res.status(400).json({
            success: false,
            message: 'Validation failed',
            errors
        });
    }

    // Validate email domain
    if (!email.endsWith('@medicaps.ac.in')) {
        return res.status(400).json({
            success: false,
            message: 'Only Medicaps University email addresses (@medicaps.ac.in) are allowed'
        });
    }

    // Validate password length
    if (password.length < 6) {
        return res.status(400).json({
            success: false,
            message: 'Password must be at least 6 characters long'
        });
    }

    // Validate college ID format
    if (!/^\d{7}$/.test(collegeId)) {
    return res.status(400).json({
        success: false,
        message: 'College ID must be exactly 7 digits'
    });
    }

    // Validate enrollment number format
    if (!/^EN22IT\d{6}$/.test(enrollmentNumber)) {
        return res.status(400).json({
            success: false,
            message: 'Enrollment number must be in format: EN22ITXXXXXX'
        });
    }

    next();
};

const validateEvent = (req, res, next) => {
    const { title, description, category, date, time, location, maxAttendees } = req.body;

    const errors = [];

    if (!title) errors.push('Event title is required');
    if (!description) errors.push('Event description is required');
    if (!category) errors.push('Category is required');
    if (!date) errors.push('Event date is required');
    if (!time || !time.start || !time.end) errors.push('Event start and end time are required');
    if (!location) errors.push('Event location is required');
    if (!maxAttendees) errors.push('Maximum attendees is required');

    if (errors.length > 0) {
        return res.status(400).json({
            success: false,
            message: 'Event validation failed',
            errors
        });
    }

    // Check if date is in the future (allow today)
    const eventDate = new Date(date);
    if (isNaN(eventDate.getTime())) {
        return res.status(400).json({
            success: false,
            message: 'Invalid date format. Use YYYY-MM-DD',
            errors: ['Date format is invalid']
        });
    }

    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    tomorrow.setHours(0, 0, 0, 0);

    if (eventDate < tomorrow) {
        return res.status(400).json({
            success: false,
            message: 'Event date must be today or in the future'
        });
    }

    if (maxAttendees < 1 || maxAttendees > 500) {
        return res.status(400).json({
            success: false,
            message: 'Maximum attendees must be between 1 and 500'
        });
    }

    next();
};

module.exports = { validateSignup, validateEvent };