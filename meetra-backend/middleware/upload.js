// middleware/upload.js
const multer = require('multer');
const path = require('path');
const cloudinary = require('../config/cloudinary');
const { v4: uuidv4 } = require('uuid');

// Memory storage (we'll upload to Cloudinary directly from memory)
const storage = multer.memoryStorage();

// File filter
const fileFilter = (req, file, cb) => {
    // Check file types
    if (file.mimetype.startsWith('image/') || 
        file.mimetype === 'application/pdf' ||
        file.mimetype === 'application/msword' ||
        file.mimetype === 'application/vnd.openxmlformats-officedocument.wordprocessingml.document') {
        cb(null, true);
    } else {
        cb(new Error('Invalid file type. Only images and documents are allowed.'), false);
    }
};

const upload = multer({
    storage: storage,
    fileFilter: fileFilter,
    limits: {
        fileSize: 5 * 1024 * 1024, // 5MB limit
        files: 5 // Maximum 5 files
    }
});

// Upload to Cloudinary function with timeout handling
const uploadToCloudinary = (file, folder = 'meetra', timeoutMs = 30000) => {
    return new Promise((resolve, reject) => {
        let timeoutId;
        let streamEnded = false;

        // Set timeout
        timeoutId = setTimeout(() => {
            if (!streamEnded) {
                streamEnded = true;
                reject(new Error('Upload to Cloudinary timed out. Please try again with a smaller image.'));
            }
        }, timeoutMs);

        const uploadStream = cloudinary.uploader.upload_stream(
            {
                folder: folder,
                public_id: `${folder}_${uuidv4()}`,
                resource_type: 'auto',
                format: 'webp', // Convert images to webp for better performance
                quality: 'auto' // Auto optimize quality
            },
            (error, result) => {
                streamEnded = true;
                clearTimeout(timeoutId);
                
                if (error) {
                    reject(error);
                } else {
                    resolve(result);
                }
            }
        );

        // Handle stream errors
        uploadStream.on('error', (error) => {
            streamEnded = true;
            clearTimeout(timeoutId);
            reject(error);
        });

        uploadStream.end(file.buffer);
    });
};

// Error handling middleware for multer
const handleUploadErrors = (err, req, res, next) => {
    if (err instanceof multer.MulterError) {
        if (err.code === 'LIMIT_FILE_SIZE') {
            return res.status(400).json({
                success: false,
                message: 'File too large. Maximum size is 5MB.'
            });
        }
        if (err.code === 'LIMIT_FILE_COUNT') {
            return res.status(400).json({
                success: false,
                message: 'Too many files. Maximum 5 files allowed.'
            });
        }
        if (err.code === 'LIMIT_UNEXPECTED_FILE') {
            return res.status(400).json({
                success: false,
                message: 'Unexpected field name for file upload.'
            });
        }
    } else if (err) {
        return res.status(400).json({
            success: false,
            message: err.message
        });
    }
    next();
};

module.exports = { 
    upload, 
    handleUploadErrors, 
    uploadToCloudinary 
};