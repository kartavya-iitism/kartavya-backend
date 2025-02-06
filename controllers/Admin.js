const User = require('../models/User');
const Donation = require('../models/Donation');
const mongoose = require('mongoose');
const archiver = require('archiver');

const sanitizeDocument = (doc) => {
    const sanitized = { ...doc };
    delete sanitized.hash;
    delete sanitized.salt;
    delete sanitized.password;
    delete sanitized.otp;
    delete sanitized.otpExpiry;
    delete sanitized.resetPasswordToken;
    delete sanitized.resetPasswordExpires;
    return sanitized;
};

module.exports.backup = async (req, res) => {
    try {
        const user = await User.findOne({ username: req.user.username });
        if (!user || user.role !== 'admin') {
            return res.status(403).json({ message: 'Admin access required' });
        }

        res.setHeader('Content-Type', 'application/zip');
        res.setHeader('Content-Disposition', 'attachment; filename=database-backup.zip');

        const archive = archiver('zip', { zlib: { level: 9 } });
        archive.pipe(res);

        const collections = await mongoose.connection.db.collections();

        for (const collection of collections) {
            const documents = await collection.find({}).toArray();
            const sanitizedDocs = documents.map(doc => sanitizeDocument(doc));

            archive.append(JSON.stringify(sanitizedDocs, null, 2), {
                name: `${collection.collectionName}.json`
            });
        }

        archive.finalize();

    } catch (error) {
        console.error('Backup error:', error);
        res.status(500).json({
            message: 'Failed to create backup',
            error: error.message
        });
    }
};

module.exports.getStats = async (req, res) => {
    try {
        const user = await User.findOne({ username: req.user.username });
        if (!user || user.role !== 'admin') {
            return res.status(403).json({ message: 'Admin access required' });
        }

        const thirtyDaysAgo = new Date();
        thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

        const [
            totalUsers,
            activeUsers,
            verifiedDonations,
            pendingDonations
        ] = await Promise.all([
            User.countDocuments(),
            User.countDocuments({ lastDonationDate: { $gte: thirtyDaysAgo } }),
            Donation.find({ verified: true }),
            Donation.countDocuments({ verified: false })
        ]);

        // Calculate total amount and children only from verified donations
        const totalAmount = verifiedDonations.reduce((acc, donation) =>
            acc + (donation.amount || 0), 0);

        const totalSponsored = verifiedDonations.reduce((acc, donation) =>
            acc + (donation.numChild || 0), 0);

        return res.status(200).json({
            success: true,
            stats: {
                users: {
                    total: totalUsers,
                    active: activeUsers
                },
                donations: {
                    total: verifiedDonations.length + pendingDonations,
                    verified: verifiedDonations.length,
                    pending: pendingDonations,
                    amount: totalAmount
                },
                sponsorship: {
                    totalChildren: totalSponsored
                }
            }
        });

    } catch (error) {
        console.error('Stats error:', error);
        return res.status(500).json({
            success: false,
            message: 'Failed to fetch stats',
            error: error.message
        });
    }
};