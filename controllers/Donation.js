const Donation = require('../models/Donation');
const User = require('../models/User');
const jwt = require('jsonwebtoken');

module.exports.donate = async (req, res, recieptUrl) => {
    try {
        const {
            amount,
            donationDate,
            name,
            contactNumber,
            email,
            numChild
        } = req.body;

        const user = await User.findOne({ email: email });
        const donation = new Donation({
            amount,
            donationDate,
            name,
            contactNumber,
            email,
            numChild,
            recieptUrl,
            user: user ? user._id : null
        });
        const savedDonation = await donation.save();
        if (user) {
            user.donations.push(savedDonation._id);
            await user.save();
        }
        res.status(201).json({ message: 'Donation made successfully', donation: savedDonation });

    } catch (error) {
        console.error('Error making donation:', error);
        res.status(500).json({ error: 'Something went wrong' });
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

        if (!donations || donations.length === 0) {
            return res.status(404).json({ message: 'No donations found' });
        }

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
                res.status(403).json({
                    message: "protected Route"
                });
            } else {
                if (authorizedData) {
                    const user = await User.findOne({ username: authorizedData.username })
                    if (user.role !== 'admin') {
                        res.status(403).json({ message: "Non admin account detected." });
                    }
                    const donationId = req.params.donationId;
                    const donation = await Donation.findOne({ _id: donationId });
                    donation.verified = true;
                    await donation.save();
                    return res.status(200).json({ message: 'Donation Verified' })
                } else {
                    res.status(401).json({ message: "Unauthorized access to user's profile" });
                }
            }
        });
    } catch (error) {
        console.log(error)
        return res.status(500).json({ message: 'Server error' })
    }
}

module.exports.rejectDonation = async (req, res) => {
    try {

        jwt.verify(req.token, process.env.JWT_KEY, async (err, authorizedData) => {
            if (err) {
                res.status(403).json({
                    message: "protected Route"
                });
            } else {
                if (authorizedData) {
                    const user = await User.findOne({ username: authorizedData.username })
                    if (user.role !== 'admin') {
                        res.status(403).json({ message: "Non admin account detected." });
                    }
                    const donationId = req.params.donationId;
                    const message = req.body.message;
                    const donation = await Donation.findOne({ _id: donationId });
                    donation.rejected = true;
                    donation.rejectionReason = message;
                    await donation.save();
                    return res.status(200).json({ message: 'Donation Rejected' })
                } else {
                    res.status(401).json({ message: "Unauthorized access to user's profile" });
                }
            }
        });

        return res.status(200).json({ message: 'Donation Rejected' })
    } catch (error) {
        console.log(error)
        return res.status(500).json({ message: 'Server error' })
    }
}