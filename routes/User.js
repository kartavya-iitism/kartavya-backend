const express = require("express");
const router = express.Router();
const User = require("../controllers/User");
const catchAsync = require("../utils/catchAsync");
const { checkToken } = require("../middleware")
const multer = require("multer");
const uploadToAzureBlob = require("../azureStorage");
const passport = require('passport');
require('../utils/passport');

// Configure multer for file uploads
const upload = multer({
    storage: multer.memoryStorage(),
    limits: { fileSize: 5 * 1024 * 1024 } // Limit file size to 5MB
});


// mail otp
router.route("/register")
    .post(
        upload.single('profilePicture'), // Handle file upload
        catchAsync(uploadToAzureBlob),   // Upload file to Azure Blob Storage
        catchAsync(async (req, res) => {
            const profilePictureUrl = req.fileUrl ? req.fileUrl : ''; // Get the uploaded file's URL
            await User.registerUser(req, res, profilePictureUrl); // Pass URL to the controller
        })
    );

router.post("/login", User.loginUser);

router.route("/forgot-password")
    .post(catchAsync(User.forgotPassword));

router.route("/reset-password/:token")
    .post(catchAsync(User.resetPassword));

router.route("/view")
    .get(checkToken, User.viewUser);

router.route("/:id/edit")
    .put(checkToken, User.editUser);

router.route("/:username/changePassword")
    .put(checkToken, User.changePassword);

router.route("/verify")
    .post(User.verifyOtp);

router.route("/getAllUsers")
    .get(User.getAllUsers)

router.route("/failure")
    .get((req, res) => res.status(401).json({ message: "Incorrect username or password" }));

router.get('/auth/google',
    passport.authenticate('google', {
        scope: ['profile', 'email']
    })
);

router.get('/auth/google/callback',
    passport.authenticate('google', {
        session: false,
        failureRedirect: '/login',
        scope: ['profile', 'email']
    }),
    catchAsync(User.googleCallback)
);


module.exports = router;