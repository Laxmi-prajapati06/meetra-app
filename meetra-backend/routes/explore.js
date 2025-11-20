// routes/explore.js
const express = require('express');
const {
    getPlaces,
    getPlace,
    addReview
} = require('../controllers/exploreController');
const { protect, optionalAuth } = require('../middleware/auth');

const router = express.Router();

router.get('/', optionalAuth, getPlaces);
router.get('/:id', optionalAuth, getPlace);
router.post('/:id/reviews', protect, addReview);

module.exports = router;