const express = require('express');
const router = express.Router();
const Document = require('../controllers/Document');
const { checkToken, checkVerified } = require('../middleware');
const multer = require('multer');
const uploadToAzureBlob = require('../azureStorage');
const catchAsync = require('../utils/catchAsync');

const upload = multer({
    storage: multer.memoryStorage(),
    limits: { fileSize: 10 * 1024 * 1024 } // 10MB limit
});

router.post('/upload',
    checkToken,
    checkVerified,
    upload.single('document'),
    catchAsync(uploadToAzureBlob),
    catchAsync(Document.uploadDocument)
);

router.get('/all', checkToken, checkVerified, catchAsync(Document.getAllDocuments));

module.exports = router;