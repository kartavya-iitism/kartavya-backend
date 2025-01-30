const jwt = require('jsonwebtoken');
const User = require('../models/User');
const Document = require('../models/Document');
const crypto = require('crypto');
const { sendEmail } = require('../utils/mailer');
const generateEmailTemplate = require('../utils/mailTemplate');
const deleteFromAzureBlob = require('../utils/deleteFromBlob');

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

        return res.status(201).json({
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
        return res.status(500).json({
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

        return res.status(200).json({
            message: 'Login successful',
            token,
            user: sanitizedUser
        });
    } catch (err) {
        console.log(err)
        return res.status(500).json({
            name: err.name,
            error: err.message
        });
    }
};


module.exports.verifyOtp = async (req, res) => {
    try {
        const { username, otpEmail } = req.body;
        if (!username || !otpEmail) {
            return res.status(400).json({
                code: 'INVALID_INPUT',
                message: 'Username and OTP are required'
            });
        }
        const user = await User.findOne({ username });
        if (!user) {
            return res.status(404).json({
                code: 'USER_NOT_FOUND',
                message: 'User not found'
            });
        }
        if (!user.otp || !user.otp.otpEmail) {
            return res.status(400).json({
                code: 'NO_OTP',
                message: 'No OTP found. Please request a new OTP.'
            });
        }
        if (Date.now() > user.otpExpiry) {
            user.otp = undefined;
            user.otpExpiry = undefined;
            await user.save();

            return res.status(400).json({
                code: 'OTP_EXPIRED',
                message: 'OTP has expired. Please request a new OTP.'
            });
        }
        const providedOtp = String(otpEmail).trim();
        const storedOtp = String(user.otp.otpEmail).trim();
        if (providedOtp !== storedOtp) {
            return res.status(400).json({
                code: 'INVALID_OTP',
                message: 'Invalid OTP. Please try again.'
            });
        }
        user.isVerified = true;
        user.otp = undefined;
        user.otpExpiry = undefined;
        await user.save();
        return res.status(200).json({
            message: 'Account verified successfully! Please Login.',
        });
    } catch (err) {
        console.log(err)
        return res.status(500).json({
            name: err.name,
            error: err.message,
        });
    }
};


module.exports.viewUser = async (req, res) => {
    try {
        jwt.verify(req.token, process.env.JWT_KEY, async (err, authorizedData) => {
            if (err) {
                return res.status(403).json({
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
                    return res.status(200).send(user);
                } else {
                    return res.status(401).json({ message: "Unauthorized access to user's profile" });
                }
            }
        });
    } catch (e) {
        return res.status(401).json({ name: e.name, message: e.message });
    }
}

module.exports.editUser = async (req, res) => {
    try {
        const { username } = req.params;
        const updates = req.body;
        const user = await User.findOne({ username: username });
        jwt.verify(req.token, process.env.JWT_KEY, async (err, authorizedData) => {
            if (err) {
                return res.status(403).json({
                    message: "Protected Route"
                });
            }

            if (!authorizedData || authorizedData.username !== username) {
                return res.status(401).json({
                    message: "Unauthorized access to edit user's profile"
                });
            }

            if (!updates || Object.keys(updates).length === 0) {
                return res.status(400).json({
                    message: "No fields provided for update",
                });
            }

            if (user.isVerified === false) {
                return res.status(403).json({
                    message: "Account not verified. Please verify your account before editing your profile."
                });
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

            const token = jwt.sign(
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
                { expiresIn: "30d" }
            );

            return res.status(200).json({
                message: "User updated successfully",
                updatedUser,
                token
            });
        });
    } catch (err) {
        console.log(err)
        return res.status(500).json({
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
        return res.status(500).json({
            error: err.message
        });
    }
};

module.exports.getAllUsers = async (req, res) => {
    try {
        jwt.verify(req.token, process.env.JWT_KEY, async (err, authorizedData) => {
            if (err) {
                return res.status(403).json({
                    message: "Invalid token"
                });
            }

            // Verify admin privileges
            const admin = await User.findOne({ username: authorizedData.username });
            if (!admin || admin.role !== 'admin') {
                return res.status(403).json({
                    message: "Only admin can view all users"
                });
            }

            // Get all users with sensitive data removed
            const users = await User.find({})
                .select('-salt -hash -resetPasswordToken -resetPasswordExpires -otp -otpExpiry');

            return res.status(200).json({
                users,
                count: users.length
            });
        });
    } catch (err) {
        console.error('Get all users error:', err);
        return res.status(500).json({
            name: err.name,
            error: err.message
        });
    }
};

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

        return res.status(200).json({
            message: "Password reset email sent",
        });

    } catch (err) {
        console.error('Error in forgotPassword:', err);
        return res.status(500).json({
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

        return res.status(200).json({
            message: "Password reset successful",
        });

    } catch (err) {
        console.error('Error in resetPassword:', err);
        return res.status(500).json({
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
                return res.status(403).json({
                    message: "Protected Route"
                });
            }

            if (!authorizedData) {
                return res.status(401).json({
                    message: "Unauthorized access to user's profile"
                });
            }

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

            if (!user) {
                return res.status(404).json({
                    message: "User not found"
                });
            }

            if (user.isVerified === false) {
                return res.status(403).json({
                    message: "Account not verified. Please verify your account before accessing your profile."
                });
            }

            const documents = await Document.find({});
            const totalDonations = user.totalDonation

            const dashboardData = {
                totalDonations: totalDonations,
                childrenSponsored: user.sponsoredStudents.length,
                lastDonation: user.donations[0],
                recentDonations: user.donations
                    .sort((a, b) => b.donationDate - a.donationDate)
                    .slice(0, 5),
                documents: documents
            };

            return res.status(200).json(dashboardData);
        });
    } catch (e) {
        return res.status(500).json({
            name: e.name,
            message: e.message
        });
    }
};

module.exports.sendBulkEmails = async (req, res) => {
    try {
        jwt.verify(req.token, process.env.JWT_KEY, async (err, authorizedData) => {
            if (err) {
                return res.status(403).json({
                    message: "Invalid token"
                });
            }

            // Find user in database
            const user = await User.findOne({ username: authorizedData.username });
            if (!user || user.role === 'regular') {
                return res.status(403).json({
                    message: "Only admin users can send bulk emails"
                });
            }
            const { users, subject, message, templateOptions = {} } = req.body;

            if (!users || !Array.isArray(users) || !subject || !message) {
                return res.status(400).json({
                    message: "Please provide users array, subject and message"
                });
            }

            const targetUsers = await User.find({
                email: { $in: users }
            }).select('name email');

            if (!targetUsers.length) {
                return res.status(404).json({
                    message: "No valid users found"
                });
            }

            const emailPromises = targetUsers.map(user => {
                const emailTemplate = generateEmailTemplate({
                    title: subject,
                    message: `Hello ${user.name}, <p>${message}</p>`,
                    highlightBox: templateOptions.highlightBox || false,
                    highlightContent: templateOptions.highlightContent,
                    buttonLink: templateOptions.buttonLink,
                    buttonText: templateOptions.buttonText,
                    additionalContent: templateOptions.additionalContent || `
                    <p>This is an automated message from Kartavya.</p>
                    <p>Date: ${new Date().toLocaleString()}</p>
                `
                });

                return sendEmail({
                    to: user.email,
                    subject: `Kartavya - ${subject}`,
                    html: emailTemplate,
                    text: message
                });
            });

            await Promise.all(emailPromises);

            return res.status(200).json({
                message: `Emails sent successfully to ${targetUsers.length} users`,
                recipients: targetUsers.map(user => user.email)
            });
        });

    } catch (err) {
        console.error('Error sending emails:', err);
        return res.status(500).json({
            name: err.name,
            error: err.message
        });
    }
};

module.exports.deleteUser = async (req, res) => {
    try {
        jwt.verify(req.token, process.env.JWT_KEY, async (err, authorizedData) => {
            if (err) {
                return res.status(403).json({
                    message: "Invalid token"
                });
            }
            const adminUser = await User.findOne({ username: authorizedData.username });
            if (!adminUser || adminUser.role !== 'admin') {
                return res.status(403).json({
                    message: "Only admin users can delete accounts"
                });
            }

            const { userToDelete } = req.params;
            const targetUser = await User.findOne({ _id: userToDelete });
            if (!targetUser) {
                return res.status(404).json({
                    message: "User not found"
                });
            }

            if (targetUser.role !== 'regular') {
                return res.status(403).json({
                    message: "Cannot delete admin users"
                });
            }
            if (targetUser.profileImage) {
                try {
                    await deleteFromAzureBlob(targetUser.profileImage);
                } catch (blobError) {
                    console.error('Failed to delete profile image:', blobError);
                }
            }

            // Delete user document
            await User.deleteOne({ _id: targetUser._id });

            return res.status(200).json({
                message: `User ${userToDelete} and associated data deleted successfully`
            });
        });
    } catch (err) {
        console.error('Delete user error:', err);
        return res.status(500).json({
            name: err.name,
            error: err.message
        });
    }
};

module.exports.resendOtp = async (req, res) => {
    try {
        jwt.verify(req.token, process.env.JWT_KEY, async (err, authorizedData) => {
            if (err) {
                return res.status(403).json({
                    code: 'INVALID_TOKEN',
                    message: 'Invalid token'
                });
            }

            const { username } = req.body;
            if (!username || username !== authorizedData.username) {
                return res.status(400).json({
                    code: 'INVALID_INPUT',
                    message: 'Invalid username or unauthorized access'
                });
            }

            const user = await User.findOne({ username });
            if (!user) {
                return res.status(404).json({
                    code: 'USER_NOT_FOUND',
                    message: 'User not found'
                });
            }

            if (user.isVerified) {
                return res.status(400).json({
                    code: 'ALREADY_VERIFIED',
                    message: 'User is already verified'
                });
            }
            let otpEmail = user.otp.otpEmail;
            if (Date.now() > user.otpExpiry) {
                otpEmail = crypto.randomInt(100000, 999999);
                user.otp.otpEmail = otpEmail;
            }

            user.otpExpiry = Date.now() + 60 * 60 * 1000;
            await user.save();

            const emailTemplate = generateEmailTemplate({
                title: 'New OTP for Kartavya Account Verification',
                message: `Hello ${user.name}, Here is your new verification OTP:`,
                highlightBox: true,
                highlightContent: otpEmail,
                additionalContent: '<p>This OTP will expire in 60 minutes.</p>'
            });

            await sendEmail({
                to: user.email,
                subject: 'Kartavya - New Verification OTP',
                html: emailTemplate,
                text: `Your new email verification OTP is: ${otpEmail}. This OTP will expire in 60 minutes.`
            });

            return res.status(200).json({
                message: 'New OTP sent successfully'
            });
        });
    } catch (error) {
        console.error('Resend OTP error:', error);
        return res.status(500).json({
            name: error.name,
            error: error.message
        });
    }
};