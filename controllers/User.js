const jwt = require('jsonwebtoken');
const User = require('../models/User');
const crypto = require('crypto');
const { sendEmail } = require('../utils/mailer');
const generateEmailTemplate = require('../utils/mailTemplate');

module.exports.registerUser = async (req, res, profilePictureUrl) => {
    try {
        const {
            username,
            password,
            name,
            email,
            contactNumber,
            currentJob,
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
            currentJob: currentJob,
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

        const emailTemplate = generateEmailTemplate({
            title: 'Welcome to Kartavya IIT(ISM)',
            message: `Hello ${name}, Thank you for registering. Please verify your email using the OTP below:`,
            highlightBox: true,
            highlightContent: otpEmail,
            additionalContent: '<p>This OTP will expire in 60 minutes.</p><p>If you didn\'t request this registration, please ignore this email.</p>'
        });

        await sendEmail({
            to: email,
            subject: 'Kartavya - Verify Your Email',
            html: emailTemplate,
            text: `Your email verification OTP is: ${otpEmail}. This OTP will expire in 60 minutes.`
        });
        user.setPassword(password);
        await user.save();

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
        const { username, password } = req.body;
        const user = await User.findOne({ username });
        if (!user) {
            return res.status(401).json({
                message: 'Invalid credentials'
            });
        }
        if (!user.validatePassword(password)) {
            return res.status(401).json({
                message: 'Invalid credentials'
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
            currentJob: user.currentJob,
            governmentOfficial: user.governmentOfficial,
            ismPassout: user.ismPassout,
            batch: user.batch,
            kartavyaVolunteer: user.kartavyaVolunteer,
            yearsOfService: user.yearsOfService,
            typeOfSponsor: user.typeOfSponsor,
            role: user.role
        }
        const token = jwt.sign(
            sanitizedUser,
            process.env.JWT_KEY,
            { expiresIn: '1d' }
        );

        res.status(200).json({
            message: 'Login successful',
            token,
            user: sanitizedUser
        });
    } catch (err) {
        console.log(err)
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
        console.log(err)
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
                    const user = await User.findOne({ username: authorizedData.username })
                        .select('-salt -hash -_id')
                        .populate({
                            path: 'donations',
                            select: '-_id -user'
                        })
                        .populate({
                            path: 'sponsoredStudents',
                            select: '-_id -sponsor'
                        });
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
        const { username } = req.params;
        const updates = req.body;
        const user = await User.findOne({ username: username });
        console.log(req.body)
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
            { _id: user._id },
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
                currentJob: updatedUser.currentJob,
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
        console.log(err)
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

        const user = await User.findOne({ username });

        if (!user) {
            return res.status(404).json({
                message: "User not found"
            });
        }

        if (!user.isVerified) {
            return res.status(403).json({
                message: "Account not verified. Please verify your account before changing password."
            });
        }

        if (!oldPassword || !newPassword) {
            return res.status(400).json({
                message: "Old and new passwords are required"
            });
        }

        // Verify JWT token
        jwt.verify(req.token, process.env.JWT_KEY, async (err, authorizedData) => {
            if (err || authorizedData.email !== user.email) {
                return res.status(403).json({
                    message: "Unauthorized access"
                });
            }

            // Validate old password
            if (!user.validatePassword(oldPassword)) {
                return res.status(401).json({
                    message: "Incorrect old password"
                });
            }

            try {
                // Set new password
                user.setPassword(newPassword);
                await user.save();

                // Send email notification
                const emailTemplate = generateEmailTemplate({
                    title: 'Password Changed Successfully',
                    message: `Hello ${user.name}, Your password was recently changed.`,
                    additionalContent: `
                        <p>If you did not make this change, please contact us immediately.</p>
                        <p>Time of change: ${new Date().toLocaleString()}</p>
                    `
                });

                await sendEmail({
                    to: user.email,
                    subject: 'Kartavya - Password Changed',
                    html: emailTemplate,
                    text: `Your password was recently changed. If you did not make this change, please contact us immediately.`
                });

                return res.status(200).json({
                    message: "Password changed successfully"
                });
            } catch (error) {
                console.error('Password change error:', error);
                return res.status(500).json({
                    message: "Failed to change password"
                });
            }
        });
    } catch (err) {
        console.error('Change password error:', err);
        res.status(500).json({
            error: err.message
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

module.exports.forgotPassword = async (req, res) => {
    try {
        const { email } = req.body;
        const user = await User.findOne({ email });

        if (!user) {
            return res.status(404).json({
                message: "No account found with this email",
            });
        }

        const resetToken = crypto.randomBytes(32).toString('hex');
        const hashedToken = crypto
            .createHash('sha256')
            .update(resetToken)
            .digest('hex');

        user.resetPasswordToken = hashedToken;
        user.resetPasswordExpires = Date.now() + 60 * 60 * 1000; // 60 minutes
        await user.save();

        const resetUrl = `${process.env.FRONTEND_URL}/reset-password/${resetToken}`;

        const emailTemplate = generateEmailTemplate({
            title: 'Reset Your Password',
            message: `Hello ${user.name}, You requested to reset your password.`,
            highlightBox: true,
            highlightContent: 'Reset Password',
            buttonLink: resetUrl,
            buttonText: 'Reset Password',
            additionalContent: `
                <p>Click the button above to reset your password.</p>
                <p>This link will expire in 10 minutes.</p>
                <p>If you didn't request this, please ignore this email.</p>
            `
        });

        await sendEmail({
            to: user.email,
            subject: 'Kartavya - Password Reset Request',
            html: emailTemplate,
            text: `To reset your password, visit: ${resetUrl}\nThis link will expire in 10 minutes.`
        });

        res.status(200).json({
            message: "Password reset email sent",
        });

    } catch (err) {
        console.error('Error in forgotPassword:', err);
        res.status(500).json({
            name: err.name,
            error: err.message,
        });
    }
};

module.exports.resetPassword = async (req, res) => {
    try {
        const { token } = req.params;
        const { password } = req.body;

        // Hash token from params
        const hashedToken = crypto
            .createHash('sha256')
            .update(token)
            .digest('hex');

        // Find user with valid token
        const user = await User.findOne({
            resetPasswordToken: hashedToken,
            resetPasswordExpires: { $gt: Date.now() }
        });

        if (!user) {
            return res.status(400).json({
                message: "Invalid or expired reset token",
            });
        }

        // Set new password
        await user.setPassword(password);

        // Clear reset token fields
        user.resetPasswordToken = undefined;
        user.resetPasswordExpires = undefined;
        await user.save();

        // Send confirmation email
        const emailTemplate = generateEmailTemplate({
            title: 'Password Reset Successful',
            message: `Hello ${user.name}, Your password has been successfully reset.`,
            additionalContent: `
                <p>If you did not make this change, please contact us immediately.</p>
                <p>Time of change: ${new Date().toLocaleString()}</p>
            `
        });

        await sendEmail({
            to: user.email,
            subject: 'Kartavya - Password Reset Successful',
            html: emailTemplate,
            text: `Your password has been successfully reset. If you did not make this change, please contact us immediately.`
        });

        res.status(200).json({
            message: "Password reset successful",
        });

    } catch (err) {
        console.error('Error in resetPassword:', err);
        res.status(500).json({
            name: err.name,
            error: err.message,
        });
    }
};

module.exports.googleCallback = async (req, res) => {
    try {
        const user = req.user;
        const sanitizedUser = {
            username: user.username,
            name: user.name,
            email: user.email,
            role: user.role
        };

        const token = jwt.sign(
            sanitizedUser,
            process.env.JWT_KEY,
            { expiresIn: '1d' }
        );

        res.redirect(`${process.env.FRONTEND_URL}/auth/callback?token=${token}`);
    } catch (error) {
        console.error('Google auth error:', error);
        res.redirect(`${process.env.FRONTEND_URL}/login?error=auth_failed`);
    }
};


module.exports.getDashboard = async (req, res) => {
    try {
        jwt.verify(req.token, process.env.JWT_KEY, async (err, authorizedData) => {
            if (err) {
                res.status(403).json({
                    message: "protected Route"
                });
            } else {
                if (authorizedData) {
                    const user = await User.findOne({ username: authorizedData.username })
                        .select('-salt -hash -_id')
                        .populate({
                            path: 'donations',
                            select: '-_id -user'
                        })
                        .populate({
                            path: 'sponsoredStudents',
                            select: '-_id -sponsor'
                        });
                    if (user.isVerified === false) {
                        res.status(403).json({ message: "Account not verified. Please verify your account before accessing your profile." });
                    }
                    const totalDonations = user.donations
                        .filter(donation => donation.verified === true)
                        .reduce((sum, donation) => sum + (donation.amount || 0), 0);

                    const dashboardData = {
                        totalDonations: totalDonations,
                        childrenSponsored: user.sponsoredStudents.length,
                        lastDonation: user.donations[0],
                        recentDonations: user.donations
                            .sort((a, b) => b.donationDate - a.donationDate)
                            .slice(0, 5)
                    };
                    res.status(200).json(dashboardData);

                } else {
                    res.status(401).json({ message: "Unauthorized access to user's profile" });
                }
            }
        });
    } catch (e) {
        res.status(401).json({ name: e.name, message: e.message });
    }
}