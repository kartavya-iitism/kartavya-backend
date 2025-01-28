const Document = require('../models/Document');
const jwt = require('jsonwebtoken');
const User = require('../models/User');

module.exports.uploadDocument = async (req, res) => {
    try {
        const { title, description, type } = req.body;

        const authorizedData = await jwt.verify(req.token, process.env.JWT_KEY);
        const user = await User.findOne({ username: authorizedData.username });

        if (!user || user.role !== 'admin') {
            return res.status(403).json({ message: 'Unauthorized access' });
        }

        if (!req.fileUrl) {
            return res.status(400).json({ message: 'No file uploaded' });
        }

        const document = new Document({
            title,
            description,
            type,
            fileUrl: req.fileUrl,
            uploadedBy: user._id
        });

        await document.save();

        return res.status(201).json({
            message: 'Document uploaded successfully',
            document
        });

    } catch (error) {
        if (req.containerClient && req.blobName) {
            try {
                const blockBlobClient = req.containerClient.getBlockBlobClient(req.blobName);
                await blockBlobClient.delete();
            } catch (deleteError) {
                console.error('Failed to delete uploaded file:', deleteError);
            }
        }
        return res.status(500).json({ error: error.message });
    }
};

module.exports.getAllDocuments = async (req, res) => {
    try {
        const documents = await Document.find()
            .sort({ createdAt: -1 })
            .populate('uploadedBy', 'username name');

        const authorizedData = await jwt.verify(req.token, process.env.JWT_KEY);
        const user = await User.findOne({ username: authorizedData.username });

        if (!user) {
            return res.status(403).json({ message: 'Unauthorized access' });
        }
        return res.status(200).json(documents);
    } catch (error) {
        return res.status(500).json({ error: error.message });
    }
};