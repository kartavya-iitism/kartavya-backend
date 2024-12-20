const jwt = require('jsonwebtoken');
const User = require('../models/User');
const crypto = require('crypto');
const { ContainerSASPermissions } = require('@azure/storage-blob');

module.exports.registerUser = async (req, res, profilePictureUrl) => {
    try {
        const {
            username,
            password,
            name,
            email,
            contactNumber,
            address,
            dateOfBirth,
            gender,
            governmentOfficial,
            ismPassout,
            batch,
            kartavyaVolunteer,
            yearsOfServiceStart,
            yearsOfServiceEnd,
            typeOfSponsor
        } = req.body;

        const otpMobile = crypto.randomInt(100000, 999999);
        const otpEmail = crypto.randomInt(100000, 999999);

        const user = new User({
            username: username,
            name: name,
            email: email,
            contactNumber: contactNumber,
            address: address,
            dateOfBirth: dateOfBirth,
            gender: gender,
            governmentOfficial: governmentOfficial,
            ismPassout: ismPassout,
            batch: batch,
            kartavyaVolunteer: kartavyaVolunteer,
            yearsOfServiceStart: yearsOfServiceStart,
            yearsOfServiceEnd: yearsOfServiceEnd,
            typeOfSponsor: typeOfSponsor,
            profileImage: profilePictureUrl,
            otp: {
                otpMobile: otpMobile,
                otpEmail: otpEmail
            },
            otpExpiry: Date.now() + 60 * 60 * 1000, // 60 minutes expiry
            isVerified: false
        });
        console.log(user)

        await User.register(user, password);

        //mailer and otp service

        //send otp to mobile

        //send otp to email

        res.status(201).json({
            message: 'Registration successful! Please verify your account using the OTP sent to your email and mobile.',
        });
    } catch (err) {
        if (req.containerClient && req.blobName) {
            try {
                const blockBlobClient = req.containerClient.getBlockBlobClient(req.blobName);
                await blockBlobClient.delete();
                console.log('Uploaded file deleted due to registration failure.');
            } catch (deleteError) {
                console.error('Failed to delete uploaded file:', deleteError);
            }
            console.log(err.name)
        }
        res.status(500).json({
            name: err.name,
            error: err.message
        })
    }
}


module.exports.loginUser = async (req, res) => {
    try {
        const { username } = req.body;

        const user = await User.findOne({ username });

        if (!user) {
            return res.status(404).json({
                message: 'User not found',
            });
        }

        if (!user.isVerified) {
            return res.status(403).json({
                message: 'Account not verified. Please verify your account before logging in.',
            });
        }
        const sanitizedUser = {
            username: user.username,
            name: user.name,
            email: user.email,
            contactNumber: user.contactNumber,
            address: user.address,
            dateOfBirth: user.dateOfBirth,
            gender: user.gender,
            governmentOfficial: user.governmentOfficial,
            ismPassout: user.ismPassout,
            batch: user.batch,
            kartavyaVolunteer: user.kartavyaVolunteer,
            yearsOfService: user.yearsOfService,
            typeOfSponsor: user.typeOfSponsor,
            role: user.role
        }
        jwt.sign(
            sanitizedUser,
            process.env.JWT_KEY,
            { expiresIn: '1d' },
            (err, token) => {
                if (err) {
                    return res.status(403).json({
                        message: 'Token generation failed',
                    });
                }

                res.status(200).json({
                    message: 'Login successful',
                    token: token,
                    user: sanitizedUser
                });
            }
        );
    } catch (err) {
        res.status(500).json({
            name: err.name,
            error: err.message
        });
    }
};


module.exports.verifyOtp = async (req, res) => {
    try {
        const { username, otpEmail } = req.body;
        const user = await User.findOne({ username });
        console.log(req.body)
        if (!user) {
            return res.status(404).json({
                message: 'User not found',
            });
        }
        if (String(user.otp.otpEmail) !== String(otpEmail) || Date.now() > user.otpExpiry) {
            return res.status(400).json({
                message: 'Invalid or expired OTP',
            });
        }
        user.isVerified = true;
        user.otp = undefined;
        user.otpExpiry = undefined;
        await user.save();
        res.status(200).json({
            message: 'Account verified successfully! Please Login.',
        });
    } catch (err) {
        res.status(500).json({
            name: err.name,
            error: err.message,
        });
    }
};


module.exports.viewUser = async (req, res) => {
    try {
        jwt.verify(req.token, process.env.JWT_KEY, async (err, authorizedData) => {
            if (err) {
                res.status(403).json({
                    message: "protected Route"
                });
            } else {
                if (authorizedData) {
                    const user = await User.findOne({ username: authorizedData.username }).select('-salt -hash -_id');
                    if (user.isVerified === false) {
                        res.status(403).json({ message: "Account not verified. Please verify your account before accessing your profile." });
                    }
                    res.status(200).send(user);
                } else {
                    res.status(401).json({ message: "Unauthorized access to user's profile" });
                }
            }
        });
    } catch (e) {
        res.status(401).json({ name: e.name, message: e.message });
    }
}


module.exports.editUser = async (req, res) => {
    try {
        const { id } = req.params;
        const updates = req.body;
        const user = await User.findOne({ _id: id });
        // jwt.verify(req.token, process.env.JWT_KEY, async (err, authorizedData) => {
        //     if (err) {
        //         res.status(403).json({
        //             message: "protected Route"
        //         });
        //     } else {
        //         if (authorizedData) {
        //             if (authorizedData.username !== user.username) {
        //                 res.status(403).json({ message: "Unauthorized access to edit user's profile" });
        //             }
        //         } else {
        //             res.status(401).json({ message: "Unauthorized access to edit user's profile" });
        //         }
        //     }
        // });

        if (!updates || Object.keys(updates).length === 0) {
            return res.status(400).json({
                message: "No fields provided for update",
            });
        }
        if (user.isVerified === false) {
            res.status(403).json({ message: "Account not verified. Please verify your account before editing your profile." });
        }
        const updatedUser = await User.findOneAndUpdate(
            { _id: id },
            { $set: updates },
            { new: true, runValidators: true }
        );

        if (!updatedUser) {
            return res.status(404).json({
                message: "User not found",
            });
        }

        jwt.sign(
            {
                username: updatedUser.username,
                name: updatedUser.name,
                email: updatedUser.email,
                contactNumber: updatedUser.contactNumber,
                address: updatedUser.address,
                dateOfBirth: updatedUser.dateOfBirth,
                gender: updatedUser.gender,
                governmentOfficial: updatedUser.governmentOfficial,
                ismPassout: updatedUser.ismPassout,
                batch: updatedUser.batch,
                kartavyaVolunteer: updatedUser.kartavyaVolunteer,
                yearsOfService: updatedUser.yearsOfService,
                typeOfSponsor: updatedUser.typeOfSponsor
            },
            process.env.JWT_KEY,
            { expiresIn: "30d" },
            (err, token) => {
                if (err) {
                    return res.status(403).json({
                        message: "Token generation failed",
                    });
                }

                res.status(200).json({
                    message: "User updated successfully",
                    updatedUser,
                    token
                });
            }
        );
    } catch (err) {
        res.status(500).json({
            name: err.name,
            error: err.message,
        });
    }
};


module.exports.changePassword = async (req, res) => {
    try {
        const { username } = req.params;
        const { oldPassword, newPassword } = req.body;

        const user = await User.findOne({ username: username });  // Use findOne instead of find

        if (!user) {
            return res.status(404).json({
                message: "User not found",
            });
        }

        jwt.verify(req.token, process.env.JWT_KEY, async (err, authorizedData) => {
            if (err) {
                return res.status(403).json({
                    message: "Protected Route. Unauthorized access",
                });
            }

            // Ensure this check is performed after JWT verification
            if (authorizedData.email !== user.email) {
                return res.status(403).json({ message: "Unauthorized access to change password" });
            }

            // Now proceed with password change logic
            if (!oldPassword || !newPassword) {
                return res.status(400).json({
                    message: "Old and new passwords are required",
                });
            }

            if (user.isVerified === false) {
                return res.status(403).json({ message: "Account not verified. Please verify your account before editing your password." });
            }

            // Authenticate old password
            user.authenticate(oldPassword, async (err, authenticatedUser) => {
                if (err || !authenticatedUser) {
                    return res.status(401).json({
                        message: "Incorrect old password",
                    });
                }

                // Set new password and save user
                await user.setPassword(newPassword);
                await user.save();

                return res.status(200).json({
                    message: "Password changed successfully",
                });
            });
        });

    } catch (err) {
        // Make sure to handle the error properly
        console.error(err);
        res.status(500).json({
            name: err.name,
            error: err.message,
        });
    }
};


module.exports.getAllUsers = async (req, res) => {
    try {
        const users = await User.find({}).select('-salt -hash');
        res.status(200).send(users);
    } catch (err) {
        res.status(500).json({
            name: err.name,
            error: err.message,
        });
    }
}