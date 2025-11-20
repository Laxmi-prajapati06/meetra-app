// routes/events.js
const express = require('express');
const {
    createEvent,
    getEvents,
    getEvent,
    joinEvent,
    leaveEvent,
    getMyEvents,
    updateEvent,
    deleteEvent
} = require('../controllers/eventController');
const { protect } = require('../middleware/auth');
const { validateEvent } = require('../middleware/validation');

const router = express.Router();

router.route('/')
    .get(getEvents)
    .post(protect, validateEvent, createEvent);

router.get('/my-events', protect, getMyEvents);
router.route('/:id')
    .get(getEvent)
    .put(protect, updateEvent)
    .delete(protect, deleteEvent);
router.post('/:id/join', protect, joinEvent);
router.post('/:id/leave', protect, leaveEvent);

module.exports = router;