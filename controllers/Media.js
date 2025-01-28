const Media = require('../models/Media');
const User = require('../models/User');
const jwt = require('jsonwebtoken');
const deleteFromAzureBlob = require('../utils/deleteFromBlob');

module.exports.addMedia = async (req, res) => {
    try {
        jwt.verify(req.token, process.env.JWT_KEY, async (err, authorizedData) => {
            if (err) {
                return res.status(403).json({
                    message: "Invalid token"
                });
            }

            // Verify admin
            const user = await User.findOne({ username: authorizedData.username });
            if (!user || user.role !== 'admin') {
                return res.status(403).json({
                    message: "Only admin can add media"
                });
            }

            const { type, title, category, description, tags } = req.body;

            const media = new Media({
                type,
                title,
                url: type === 'photo' ? req.fileUrl : req.body.url,
                category,
                description,
                tags: tags ? tags.split(',').map(tag => tag.trim()) : []
            });

            await media.save();

            res.status(201).json({
                message: "Media added successfully",
                media
            });
        });
    } catch (error) {
        if (req.fileUrl && req.containerClient && req.blobName) {
            try {
                await deleteFromAzureBlob(req.fileUrl);
            } catch (deleteError) {
                console.error('Failed to delete uploaded file:', deleteError);
            }
        }
        res.status(500).json({ error: error.message });
    }
};

module.exports.getAllMedia = async (req, res) => {
    try {
        const { category } = req.query;
        let query = {};

        if (category) query.category = category;

        const allMedia = await Media.find(query).sort({ date: -1 });

        const formatted = {
            photos: allMedia.filter(item => item.type === 'photo'),
            videos: allMedia.filter(item => item.type === 'video')
        };

        res.status(200).json(formatted);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

module.exports.deleteMedia = async (req, res) => {
    try {
        jwt.verify(req.token, process.env.JWT_KEY, async (err, authorizedData) => {
            if (err) {
                return res.status(403).json({
                    message: "Invalid token"
                });
            }

            const user = await User.findOne({ username: authorizedData.username });
            if (!user || user.role !== 'admin') {
                return res.status(403).json({
                    message: "Only admin can delete media"
                });
            }

            const media = await Media.findById(req.params.id);
            if (!media) {
                return res.status(404).json({
                    message: "Media not found"
                });
            }

            if (media.type === 'photo') {
                try {
                    await deleteFromAzureBlob(media.url);
                } catch (error) {
                    console.error('Failed to delete image:', error);
                }
            }

            await Media.deleteOne({ _id: req.params.id });
            res.status(200).json({
                message: "Media deleted successfully"
            });
        });
    } catch (error) {
        res.status(500).json({
            error: error.message
        });
    }
};