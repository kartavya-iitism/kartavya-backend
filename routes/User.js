const express = require("express");
const router = express.Router();
const User = require("../controllers/User");
const catchAsync = require("../utils/catchAsync");
const { checkToken, checkVerified } = require("../middleware")
const multer = require("multer");
const uploadToAzureBlob = require("../azureStorage");
const passport = require('passport');
require('../utils/passport');
const path = require('path');
const crypto = require("crypto");

const sanitizeFilename = (originalname) => {
    const ext = path.extname(originalname).toLowerCase(); // Get file extension
    const timestamp = Date.now(); // Current time in milliseconds
    const uniqueId = crypto.randomBytes(8).toString("hex"); // Generate a safe, random 16-character string
    return `user_${timestamp}_${uniqueId}${ext}`;
};

const upload = multer({
    storage: multer.memoryStorage(),
    limits: { fileSize: 10 * 1024 * 1024 }, // 10MB limit
    fileFilter: (req, file, cb) => {
        file.originalname = sanitizeFilename(file.originalname);
        cb(null, true);
    }
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

router.route("/:username/edit")
    .put(checkToken, checkVerified, User.editUser);

router.route("/:username/changePassword")
    .put(checkToken, checkVerified, User.changePassword);

router.route("/verify")
    .post(User.verifyOtp);

router.route('/resend-otp')
    .post(checkToken, catchAsync(User.resendOtp));

router.route("/getAllUsers")
    .get(checkToken, checkVerified, User.getAllUsers)

router.route("/dashboard")
    .get(checkToken, checkVerified, User.getDashboard)

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

router.post('/send-mails',
    checkToken,
    checkVerified,
    catchAsync(User.sendBulkEmails)
);

router.delete('/delete/:userToDelete',
    checkToken,
    checkVerified,
    catchAsync(User.deleteUser)
);


module.exports = router;