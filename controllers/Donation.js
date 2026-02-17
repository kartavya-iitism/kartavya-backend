const Donation = require('../models/Donation');
const User = require('../models/User');
const jwt = require('jsonwebtoken');
const { sendEmail } = require('../utils/mailer');
const generateEmailTemplate = require('../utils/mailTemplate');
const deleteFromAzureBlob = require('../utils/deleteFromBlob');

module.exports.donate = async (req, res, recieptUrl) => {
    try {
        const {
            amount,
            donationDate,
            name,
            contactNumber,
            email,
            numChild,
            academicYear,
            reductionReason
        } = req.body;

        const user = await User.findOne({ email: email });
        const donation = new Donation({
            amount,
            donationDate,
            name,
            contactNumber,
            email,
            numChild,
            academicYear,
            recieptUrl,
            reductionReason,
            user: user ? user._id : null
        });
        const savedDonation = await donation.save();
        if (user) {
            user.donations.push(savedDonation._id);
            await user.save();
        }

        // Generate donor email template
        const donorEmailTemplate = generateEmailTemplate({
            title: 'Thank You for Your Donation',
            message: `Dear ${name}, Thank you for your generous donation to Kartavya.`,
            highlightBox: true,
            highlightContent: `₹${amount}`,
            additionalContent: `
                <h3>Donation Details:</h3>
                <p>Date: ${new Date(donationDate).toLocaleDateString()}</p>
                <p>Amount: ₹${amount}</p>
                <p>Children Sponsored: ${numChild || 0}</p>
                <p>Reference ID: ${savedDonation._id}</p>
                <p>Status: Pending Verification</p>
                <p>We will verify your donation and send you a confirmation email.</p>
            `
        });

        // Generate admin notification email
        const adminEmailTemplate = generateEmailTemplate({
            title: 'New Donation Received',
            message: 'A new donation has been submitted:',
            highlightBox: true,
            highlightContent: `
                Donor: ${name}
                Amount: ₹${amount}
                Contact: ${contactNumber}
                Email: ${email}
                Children: ${numChild || 0}
                Academic Year: ${academicYear || 'N/A'}
            `,
            additionalContent: `
                <h3>Donation Details:</h3>
                <p>Date: ${new Date(donationDate).toLocaleDateString()}</p>
                <p>Reference ID: ${savedDonation._id}</p>
                <p>Receipt: ${recieptUrl ? 'Uploaded' : 'Not uploaded'}</p>
            `
        });

        // Send emails in parallel
        await Promise.all([
            sendEmail({
                to: email,
                subject: 'Kartavya - Donation Received',
                html: donorEmailTemplate
            }, 'admin'),
            sendEmail({
                to: process.env.EMAIL_ADMIN,
                subject: 'New Donation Submission',
                html: adminEmailTemplate
            }, 'admin')
        ]);

        return res.status(201).json({
            message: 'Donation made successfully. Please check your email for confirmation.',
            donation: savedDonation
        });

    } catch (error) {
        console.error('Error making donation:', error);
        return res.status(500).json({ error: 'Something went wrong' });
    }
};

module.exports.viewSingleDonation = async (req, res) => {
    try {
        const donationId = req.params.donationId;

        const donation = await Donation.findById(donationId).populate('user', 'name email username');  // Populate user data if necessary

        if (!donation) {
            return res.status(404).json({ message: 'Donation not found' });
        }

        return res.status(200).json({ donation });
    } catch (error) {
        console.error(error);
        return res.status(500).json({ message: 'Server error' });
    }
};

module.exports.viewAllDonations = async (req, res) => {
    try {
        const donations = await Donation.find()
            .select('-user')
            .populate({
                path: 'user',
                select: 'name email username -_id'
            })
            .sort({ donationDate: -1 });
        return res.status(200).json({ donations });
    } catch (error) {
        console.error(error);
        return res.status(500).json({ message: 'Server error' });
    }
};

module.exports.verifyDonation = async (req, res) => {
    try {
        jwt.verify(req.token, process.env.JWT_KEY, async (err, authorizedData) => {
            if (err) {
                return res.status(403).json({ message: "Protected Route" });
            }

            const user = await User.findOne({ username: authorizedData.username });
            if (!user || user.role !== 'admin') {
                return res.status(403).json({ message: "Non admin account detected." });
            }

            const donationId = req.params.donationId;
            const donation = await Donation.findOne({ _id: donationId }).populate('user');
            const donor = await User.findOne({ _id: donation.user })
            // user.totalDonation += (donation.amount);
            if (donor) {
                donor.totalDonation += (donation.amount);
                donor.lastDonationDate = Date.now();
                await donor.save();
            }

            user.lastDonationDate = Date.now();
            donation.verified = true;
            donation.expiryDate = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000);
            await donation.save();

            const emailTemplate = generateEmailTemplate({
                title: 'Donation Verified',
                message: `Hello ${donation.name}, Your donation of ₹${donation.amount} has been verified.`,
                highlightBox: true,
                highlightContent: `₹${donation.amount}`,
                additionalContent: `
                    <p>Thank you for your contribution to Kartavya.</p>
                    <p>Date: ${new Date().toLocaleString()}</p>
                    <p>Reference ID: ${donation._id}</p>
                `
            });

            await sendEmail({
                to: donation.email,
                subject: 'Kartavya - Donation Verified',
                html: emailTemplate,
                text: `Your donation of ₹${donation.amount} has been verified.`
            }, 'admin');

            return res.status(200).json({ message: 'Donation Verified' });
        });
    } catch (error) {
        console.log(error);
        return res.status(500).json({ message: 'Server error' });
    }
};

module.exports.rejectDonation = async (req, res) => {
    try {
        jwt.verify(req.token, process.env.JWT_KEY, async (err, authorizedData) => {
            if (err) {
                return res.status(403).json({ message: "Protected Route" });
            }

            const user = await User.findOne({ username: authorizedData.username });
            if (!user || user.role !== 'admin') {
                return res.status(403).json({ message: "Non admin account detected." });
            }

            const donationId = req.params.donationId;
            const message = req.body.message;
            const donation = await Donation.findOne({ _id: donationId }).populate('user');

            donation.rejected = true;
            donation.rejectionReason = message;
            await donation.save();

            const emailTemplate = generateEmailTemplate({
                title: 'Donation Rejected',
                message: `Hello ${donation.name}, Your donation of ₹${donation.amount} has been rejected.`,
                highlightBox: true,
                highlightContent: 'Rejected',
                additionalContent: `
                    <p>Reason: ${message}</p>
                    <p>Please submit a new donation with correct details.</p>
                    <p>Reference ID: ${donation._id}</p>
                    <p>Date: ${new Date().toLocaleString()}</p>
                `
            });

            await sendEmail({
                to: donation.email,
                subject: 'Kartavya - Donation Rejected',
                html: emailTemplate,
                text: `
                    Your donation of ₹${donation.amount} was rejected. 
                    Reason: ${message}
                    
                    If you have any questions or concerns, please contact us:
                    Email: support@kartavya.org
                    Phone: +91-8709899923
                    
                    Thank you for your understanding.
                `
            }, 'admin');

            return res.status(200).json({ message: 'Donation Rejected' });
        });
    } catch (error) {
        console.log(error);
        return res.status(500).json({ message: 'Server error' });
    }
};

module.exports.bulkDeleteDonations = async (req, res) => {
    try {
        jwt.verify(req.token, process.env.JWT_KEY, async (err, authorizedData) => {
            if (err) {
                return res.status(403).json({ message: "Protected Route" });
            }

            const admin = await User.findOne({ username: authorizedData.username });
            if (!admin || admin.role !== 'admin') {
                return res.status(403).json({ message: "Only admin can delete donations" });
            }

            const { donationIds } = req.body;
            if (!donationIds || !Array.isArray(donationIds)) {
                return res.status(400).json({ message: "Please provide array of donation IDs" });
            }

            const donations = await Donation.find({ _id: { $in: donationIds } }).populate('user');
            let successCount = 0;
            let failureCount = 0;

            for (const donation of donations) {
                try {
                    await User.findByIdAndUpdate(
                        donation.user._id,
                        { $pull: { donations: donation._id } }
                    );
                    if (donation.recieptUrl) {
                        await deleteFromAzureBlob(donation.recieptUrl);
                    }
                    await Donation.deleteOne({ _id: donation._id });
                    successCount++;
                } catch (error) {
                    console.error(`Failed to delete donation ${donation._id}:`, error);
                    failureCount++;
                }
            }
            return res.status(200).json({
                message: "Bulk deletion completed",
                totalProcessed: donations.length,
                successCount,
                failureCount
            });
        });
    } catch (error) {
        console.error('Bulk delete error:', error);
        return res.status(500).json({ message: 'Server error' });
    }
};

module.exports.donateItem = async (req, res) => {
    try {
        const {
            name,
            email,
            contactNumber,
            itemType,
            itemDescription,
            quantity,
            pickupAddress
        } = req.body;

        if (!name || !email || !contactNumber || !itemType || !itemDescription || !quantity || !pickupAddress) {
            return res.status(400).json({
                success: false,
                message: 'All fields are required'
            });
        }

        const adminEmailTemplate = generateEmailTemplate({
            title: 'New Item Donation Offer',
            message: 'A new item donation has been offered:',
            highlightBox: true,
            highlightContent: `
                Donor: ${name}<br/>
                Contact: ${contactNumber}<br/>
                Email: ${email}<br/>
            `,
            additionalContent: `
                <h3>Donation Details:</h3>
                <p>Item Type: ${Array.isArray(itemType) ? itemType.join(', ') : itemType}</p>
                <p>Description: ${itemDescription}</p>
                <p>Quantity: ${quantity}</p>
                <p>Pickup Address: ${pickupAddress}</p>
            `
        });

        const donorEmailTemplate = generateEmailTemplate({
            title: 'Thank You for Your Donation Offer',
            message: `Dear ${name}, Thank you for offering to donate items to Kartavya.`,
            highlightBox: true,
            highlightContent: 'Our team will contact you shortly to arrange pickup.',
            additionalContent: `
                <h3>Your Donation Details:</h3>
                <p>Item Type: ${Array.isArray(itemType) ? itemType.join(', ') : itemType}</p>
                <p>Description: ${itemDescription}</p>
                <p>Quantity: ${quantity}</p>
                <p>Pickup Address: ${pickupAddress}</p>
            `
        });

        await Promise.all([
            sendEmail({
                to: process.env.EMAIL_ADMIN,
                subject: 'New Item Donation Offer',
                html: adminEmailTemplate
            }),
            sendEmail({
                to: email,
                subject: 'Kartavya - Item Donation Confirmation',
                html: donorEmailTemplate
            })
        ]);

        return res.status(200).json({
            success: true,
            message: 'Thank you for your donation offer. We will contact you shortly.'
        });

    } catch (error) {
        console.error('Item donation notification error:', error);
        return res.status(500).json({
            success: false,
            message: 'Failed to process donation offer'
        });
    }
};