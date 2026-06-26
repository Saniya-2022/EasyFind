require('dotenv').config();
const cloudinary = require('cloudinary').v2;
const { CloudinaryStorage } = require('multer-storage-cloudinary');
const multer = require('multer');

// Configure Cloudinary using environment variables
cloudinary.config({
    cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
    api_key: process.env.CLOUDINARY_API_KEY,
    api_secret: process.env.CLOUDINARY_API_SECRET
});

// Configure CloudinaryStorage
const storage = new CloudinaryStorage({
    cloudinary: cloudinary,
    params: {
        folder: 'EasyFind-items',
        allowed_formats: ['jpg', 'jpeg', 'png','webp'],
        transformation: [{ width: 500, height: 500, crop: 'limit' }]
    }
});

// Configure Multer
const upload = multer({ 
    storage: storage,
    limits: {
        fileSize: 5 * 1024 * 1024 // 5MB limit
    }
});

module.exports = { 
    cloudinary, 
    upload 
};