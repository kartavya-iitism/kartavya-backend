const express = require("express");
const router = express.Router();
const User = require("../controllers/User");
const catchAsync = require("../utils/catchAsync");
const passport = require('passport');
const { checkToken } = require("../middleware")
const multer = require("multer");
const uploadToAzureBlob = require("../azureStorage");

// Configure multer for file uploads
const upload = multer({
    storage: multer.memoryStorage(),
    limits: { fileSize: 5 * 1024 * 1024 } // Limit file size to 5MB
});

router.route("/register")
    .post(
        upload.single('profilePicture'), // Handle file upload
        catchAsync(uploadToAzureBlob),   // Upload file to Azure Blob Storage
        catchAsync(async (req, res) => {
            const profilePictureUrl = req.fileUrl; // Get the uploaded file's URL
            await User.registerUser(req, res, profilePictureUrl); // Pass URL to the controller
        })
    );

router.route("/login")
    .post(passport.authenticate("local", { failureRedirect: "/user/failure", failureMessage: true }), User.loginUser);

router.route("/view")
    .get(checkToken, User.viewUser);

router.route("/:id/edit")
    .put(checkToken, User.editUser);

router.route("/:id/changePassword")
    .put(checkToken, User.changePassword);

router.route("/verify")
    .post(User.verifyOtp);

router.route("/failure")
    .get((req, res) => res.status(401).json({ message: "Incorrect username or password" }));


module.exports = router;