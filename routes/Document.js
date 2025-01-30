const express = require('express');
const router = express.Router();
const Document = require('../controllers/Document');
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
    return `doc_${timestamp}_${uniqueId}${ext}`;
};

const upload = multer({
    storage: multer.memoryStorage(),
    limits: { fileSize: 10 * 1024 * 1024 }, // 10MB limit
    fileFilter: (req, file, cb) => {
        file.originalname = sanitizeFilename(file.originalname);
        cb(null, true);
    }
});

router.post('/upload',
    checkToken,
    checkVerified,
    upload.single('document'),
    catchAsync(uploadToAzureBlob),
    catchAsync(Document.uploadDocument)
);

router.get('/all', checkToken, checkVerified, catchAsync(Document.getAllDocuments));
router.delete('/:id', checkToken, checkVerified, catchAsync(Document.deleteDocument));

module.exports = router;