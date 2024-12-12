const express = require("express");
const router = express.Router();
const Donation = require("../controllers/Donation")
const catchAsync = require("../utils/catchAsync");


router.route("/donate").post(Donation.donate)
router.route("/viewSingleDonation/:donationId").get(Donation.viewSingleDonation)
router.route("/viewAllDonation").get(Donation.viewAllDonations)

module.exports = router;