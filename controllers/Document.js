const Document = require('../models/Document');
const jwt = require('jsonwebtoken');
const User = require('../models/User');
const deleteFromAzureBlob = require('../utils/deleteFromBlob');

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

module.exports.deleteDocument = async (req, res) => {
    try {
        jwt.verify(req.token, process.env.JWT_KEY, async (err, authorizedData) => {
            if (err) {
                return res.status(403).json({ message: "Invalid token" });
            }

            const admin = await User.findOne({ username: authorizedData.username });
            if (!admin || admin.role !== 'admin') {
                return res.status(403).json({ message: "Only admin can delete documents" });
            }

            const document = await Document.findById(req.params.id);
            if (!document) {
                return res.status(404).json({ message: "Document not found" });
            }

            if (document.fileUrl) {
                try {
                    await deleteFromAzureBlob(document.fileUrl);
                } catch (error) {
                    console.error('Failed to delete file from Azure:', error);
                }
            }

            await Document.findByIdAndDelete(req.params.id);

            return res.status(200).json({
                success: true,
                message: "Document deleted successfully"
            });
        });
    } catch (error) {
        console.error('Delete document error:', error);
        return res.status(500).json({
            success: false,
            message: "Failed to delete document",
            error: error.message
        });
    }
};