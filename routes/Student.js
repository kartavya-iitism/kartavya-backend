const express = require("express");
const router = express.Router();
const multer = require("multer");
const uploadToAzureBlob = require("../azureStorage"); // Azure Blob upload middleware
const Student = require("../controllers/Student");
const catchAsync = require("../utils/catchAsync");
const { checkToken } = require("../middleware")

const upload = multer({ storage: multer.memoryStorage(), limits: { fileSize: 5 * 1024 * 1024 } }); // Limit to 5MB file size

// Route for adding a student with an optional profile image upload
router.route("/add")
    .post(
        checkToken,
        upload.single('profilePicture'),  // Handle profile image upload (single file, named 'profileImage')
        catchAsync(uploadToAzureBlob),              // Upload to Azure Blob Storage
        catchAsync(async (req, res) => {
            const profilePictureUrl = req.fileUrl; // Get the uploaded file's URL
            await Student.addStudent(req, res, profilePictureUrl); // Pass URL to the controller
        })           // Add student data to database
    );

router.route("/:id/edit")
    .put(checkToken, Student.editStudent);

router.route("/:id/editresult")
    .put(checkToken, Student.editStudentResult);

router.route("/:id/editsponsor")
    .put(checkToken, Student.editStudentSponsor);
module.exports = router;