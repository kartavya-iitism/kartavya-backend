const { StudentStory, AcademicMilestone, RecentUpdate } = require('../models/NewsAchievements');
const jwt = require('jsonwebtoken');
const User = require('../models/User');
const deleteFromAzureBlob = require('../utils/deleteFromBlob');

module.exports.addContent = async (req, res) => {
    try {
        const authorizedData = await jwt.verify(req.token, process.env.JWT_KEY);
        const user = await User.findOne({ username: authorizedData.username });

        if (!user || user.role !== 'admin') {
            return res.status(403).json({ message: 'Unauthorized access' });
        }

        const { type } = req.body;
        let Model, content;
        switch (type) {
            case 'story':
                Model = StudentStory;
                content = {
                    ...req.body,
                    studentImage: req.fileUrl || ''
                };
                break;
            case 'milestone':
                Model = AcademicMilestone;
                content = req.body;
                break;
            case 'update':
                Model = RecentUpdate;
                content = req.body;
                break;
            default:
                throw new Error('Invalid content type');
        }

        const newContent = new Model(content);
        await newContent.save();

        res.status(201).json({
            message: `${type} added successfully`,
            content: newContent
        });
    } catch (error) {
        console.log(error)
        if (req.containerClient && req.blobName) {
            try {
                const blockBlobClient = req.containerClient.getBlockBlobClient(req.blobName);
                await blockBlobClient.delete();
            } catch (deleteError) {
                console.error('Failed to delete uploaded file:', deleteError);
            }
        }
        res.status(500).json({ error: error.message });
    }
};

module.exports.getAll = async (req, res) => {
    try {
        const [studentStories, academicMilestones, recentUpdates] = await Promise.all([
            StudentStory.find().sort({ date: -1 }),
            AcademicMilestone.find().sort({ createdAt: -1 }),
            RecentUpdate.find().sort({ date: -1 })
        ]);

        res.status(200).json({
            studentStories,
            academicMilestones,
            recentUpdates
        });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

module.exports.deleteContent = async (req, res) => {
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
                    message: "Only admin can delete content"
                });
            }

            const { type, id } = req.params;
            let Model;
            switch (type) {
                case 'story':
                    Model = StudentStory;
                    break;
                case 'milestone':
                    Model = AcademicMilestone;
                    break;
                case 'update':
                    Model = RecentUpdate;
                    break;
                default:
                    return res.status(400).json({
                        message: "Invalid content type"
                    });
            }
            const content = await Model.findById(id);
            if (!content) {
                return res.status(404).json({
                    message: "Content not found"
                });
            }
            if (type === 'story' && content.studentImage) {
                try {
                    await deleteFromAzureBlob(content.studentImage);
                } catch (error) {
                    console.error('Failed to delete image:', error);
                }
            }
            await Model.deleteOne({ _id: id });

            res.status(200).json({
                message: `${type} deleted successfully`
            });
        });
    } catch (error) {
        console.error(error);
        res.status(500).json({
            message: "Failed to delete content",
            error: error.message
        });
    }
};