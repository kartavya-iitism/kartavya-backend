const express = require("express");
const router = express.Router();
const Donation = require("../controllers/Donation")
const catchAsync = require("../utils/catchAsync");
const { checkToken, checkVerified } = require("../middleware")
const multer = require("multer");
const uploadToAzureBlob = require("../azureStorage");
const path = require('path');
const crypto = require("crypto");

const sanitizeFilename = (originalname) => {
    const ext = path.extname(originalname).toLowerCase(); // Get file extension
    const timestamp = Date.now(); // Current time in milliseconds
    const uniqueId = crypto.randomBytes(8).toString("hex"); // Generate a safe, random 16-character string
    return `rec_${timestamp}_${uniqueId}${ext}`;
};

const upload = multer({
    storage: multer.memoryStorage(),
    limits: { fileSize: 10 * 1024 * 1024 }, // 10MB limit
    fileFilter: (req, file, cb) => {
        file.originalname = sanitizeFilename(file.originalname);
        cb(null, true);
    }
});

router.route("/new")
    .post(upload.single('reciept'),
        catchAsync(uploadToAzureBlob),
        catchAsync(async (req, res) => {
            const recieptUrl = req.fileUrl;
            await Donation.donate(req, res, recieptUrl)
        })
    )
router.route("/viewSingleDonation/:donationId")
    .get(Donation.viewSingleDonation)
router.route("/verify/:donationId")
    .put(checkToken, checkVerified, Donation.verifyDonation)
router.route("/reject/:donationId")
    .put(checkToken, checkVerified, Donation.rejectDonation)
router.route("/viewAllDonation")
    .get(checkToken, checkVerified, Donation.viewAllDonations)
router.delete('/bulk-delete',
    checkToken,
    checkVerified,
    catchAsync(Donation.bulkDeleteDonations)
);

module.exports = router;