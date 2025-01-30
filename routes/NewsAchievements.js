const express = require('express');
const router = express.Router();
const NewsAchievements = require('../controllers/NewsAchievements');
const { checkToken, checkVerified } = require('../middleware');
const multer = require('multer');
const uploadToAzureBlob = require('../azureStorage');
const catchAsync = require('../utils/catchAsync');
const path = require('path');
const crypto = require("crypto");

const sanitizeFilename = (originalname) => {
    const ext = path.extname(originalname).toLowerCase(); // Get file extension
    const timestamp = Date.now(); // Current time in milliseconds
    const uniqueId = crypto.randomBytes(8).toString("hex"); // Generate a safe, random 16-character string
    return `news_${timestamp}_${uniqueId}${ext}`;
};

const upload = multer({
    storage: multer.memoryStorage(),
    limits: { fileSize: 10 * 1024 * 1024 }, // 10MB limit
    fileFilter: (req, file, cb) => {
        file.originalname = sanitizeFilename(file.originalname);
        cb(null, true);
    }
});


router.get('/all', catchAsync(NewsAchievements.getAll));
router.post('/add',
    checkToken,
    checkVerified,
    upload.single('studentImage'),
    catchAsync(uploadToAzureBlob),
    catchAsync(NewsAchievements.addContent)
);
router.delete('/delete/:type/:id',
    checkToken,
    checkVerified,
    catchAsync(NewsAchievements.deleteContent)
);

module.exports = router;