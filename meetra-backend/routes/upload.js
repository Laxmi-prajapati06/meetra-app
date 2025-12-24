// routes/upload.js
const express = require('express');
const { protect } = require('../middleware/auth');
const { upload, handleUploadErrors, uploadToCloudinary } = require('../middleware/upload');
const User = require('../models/User');

const router = express.Router();

// @desc    Upload profile picture
// @route   POST /api/upload/profile-picture
// @access  Private
router.post('/profile-picture', 
    protect, 
    upload.single('profilePicture'),
    handleUploadErrors,
    async (req, res) => {
        try {
            if (!req.file) {
                return res.status(400).json({
                    success: false,
                    message: 'Please select a file to upload'
                });
            }

            // Check if Cloudinary is configured
            if (!process.env.CLOUDINARY_CLOUD_NAME || !process.env.CLOUDINARY_API_KEY || !process.env.CLOUDINARY_API_SECRET) {
                return res.status(500).json({
                    success: false,
                    message: 'Cloudinary is not properly configured. Please set CLOUDINARY_CLOUD_NAME, CLOUDINARY_API_KEY, and CLOUDINARY_API_SECRET in .env file'
                });
            }

            // Set response timeout to 60 seconds for large uploads
            req.setTimeout(60000);

            // Upload to Cloudinary (30 second timeout)
            console.log('[Upload] Uploading to Cloudinary...');
            const result = await uploadToCloudinary(req.file, 'meetra/profile-pictures', 30000);
            console.log(`[Upload] Cloudinary upload successful: ${result.public_id}`);

            // Update user's profile picture
            const updatedUser = await User.findByIdAndUpdate(req.user._id, {
                'profile.profilePicture': result.secure_url
            }, { new: true });

            console.log('[Upload] User profile updated successfully');

            res.json({
                success: true,
                message: 'Profile picture uploaded successfully',
                data: updatedUser,
                user: updatedUser
            });
        } catch (error) {
            console.error('[Upload] Error:', error);
            
            // Handle timeout errors
            if (error.message && error.message.includes('timed out')) {
                return res.status(408).json({
                    success: false,
                    message: 'Upload timed out. The file may be too large or your connection is slow. Try with a smaller image.',
                    error: error.message
                });
            }

            res.status(500).json({
                success: false,
                message: error.message || 'Server error while uploading profile picture',
                error: error.message
            });
        }
    }
);

// @desc    Upload event images
// @route   POST /api/upload/event-images
// @access  Private
router.post('/event-images',
    protect,
    upload.array('eventImages', 5),
    handleUploadErrors,
    async (req, res) => {
        try {
            if (!req.files || req.files.length === 0) {
                return res.status(400).json({
                    success: false,
                    message: 'Please select files to upload'
                });
            }

            // Upload all files to Cloudinary
            const uploadPromises = req.files.map(file => 
                uploadToCloudinary(file, 'meetra/event-images')
            );

            const results = await Promise.all(uploadPromises);

            const uploadedFiles = results.map(result => ({
                url: result.secure_url,
                publicId: result.public_id,
                format: result.format,
                bytes: result.bytes
            }));

            res.json({
                success: true,
                message: 'Event images uploaded successfully',
                data: uploadedFiles
            });
        } catch (error) {
            console.error('Upload event images error:', error);
            res.status(500).json({
                success: false,
                message: 'Server error while uploading event images'
            });
        }
    }
);

// @desc    Upload general files
// @route   POST /api/upload/files
// @access  Private
router.post('/files',
    protect,
    upload.single('file'),
    handleUploadErrors,
    async (req, res) => {
        try {
            if (!req.file) {
                return res.status(400).json({
                    success: false,
                    message: 'Please select a file to upload'
                });
            }

            const result = await uploadToCloudinary(req.file, 'meetra/files');

            res.json({
                success: true,
                message: 'File uploaded successfully',
                data: {
                    url: result.secure_url,
                    publicId: result.public_id,
                    format: result.format,
                    bytes: result.bytes,
                    resourceType: result.resource_type
                }
            });
        } catch (error) {
            console.error('Upload file error:', error);
            res.status(500).json({
                success: false,
                message: 'Server error while uploading file'
            });
        }
    }
);

module.exports = router;