const express = require('express');
const router = express.Router();
const Media = require('../controllers/Media');
const { checkToken, checkVerified } = require('../middleware');
const multer = require('multer');
const uploadToAzureBlob = require('../azureStorage');
const catchAsync = require('../utils/catchAsync');

const upload = multer({
    storage: multer.memoryStorage(),
    limits: { fileSize: 10 * 1024 * 1024 } // 10MB limit
});

// Get all media with optional filters
router.get('/all', catchAsync(Media.getAllMedia));

// Add new media
router.post('/add',
    checkToken,
    checkVerified,
    upload.single('media'),
    catchAsync(uploadToAzureBlob),
    catchAsync(Media.addMedia)
);

// Delete media
router.delete('/delete/:id',
    checkToken,
    checkVerified,
    catchAsync(Media.deleteMedia)
);

module.exports = router;