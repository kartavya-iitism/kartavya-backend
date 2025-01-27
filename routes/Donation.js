const express = require("express");
const router = express.Router();
const Donation = require("../controllers/Donation")
const catchAsync = require("../utils/catchAsync");
const { checkToken } = require("../middleware")
const multer = require("multer");
const uploadToAzureBlob = require("../azureStorage");

const upload = multer({
    storage: multer.memoryStorage(),
    limits: { fileSize: 10 * 1024 * 1024 } // Limit file size to 5MB
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
    .put(checkToken, Donation.verifyDonation)
router.route("/reject/:donationId")
    .put(checkToken, Donation.rejectDonation)
router.route("/viewAllDonation")
    .get(Donation.viewAllDonations)
router.delete('/bulk-delete',
    checkToken,
    catchAsync(Donation.bulkDeleteDonations)
);

module.exports = router;