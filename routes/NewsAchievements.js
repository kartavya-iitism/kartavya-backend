const express = require('express');
const router = express.Router();
const NewsAchievements = require('../controllers/NewsAchievements');
const { checkToken } = require('../middleware');
const multer = require('multer');
const uploadToAzureBlob = require('../azureStorage');
const catchAsync = require('../utils/catchAsync');

const upload = multer({
    storage: multer.memoryStorage(),
    limits: { fileSize: 5 * 1024 * 1024 }
});

router.get('/all', catchAsync(NewsAchievements.getAll));
router.post('/add',
    checkToken,
    upload.single('studentImage'),
    catchAsync(uploadToAzureBlob),
    catchAsync(NewsAchievements.addContent)
);
router.delete('/:id', checkToken, catchAsync(NewsAchievements.deleteContent));

module.exports = router;