const express = require("express");
const router = express.Router();
const Donation = require("../controllers/Donation")
const catchAsync = require("../utils/catchAsync");
const { checkToken } = require("../middleware")
const multer = require("multer");
const uploadToAzureBlob = require("../azureStorage");

const upload = multer({
    storage: multer.memoryStorage(),
    limits: { fileSize: 5 * 1024 * 1024 } // Limit file size to 5MB
});

router.route("/")
    .post(upload.single('reciept'),
        catchAsync(uploadToAzureBlob),
        catchAsync(async (req, res) => {
            const recieptUrl = req.fileUrl;
            await Donation.donate(req, res, recieptUrl)
        })
    )
router.route("/viewSingleDonation/:donationId").get(Donation.viewSingleDonation)
router.route("/viewAllDonation").get(Donation.viewAllDonations)

module.exports = router;