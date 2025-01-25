const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const studentStorySchema = new Schema({
    studentName: {
        type: String,
        required: true,
        trim: true
    },
    category: {
        type: String,
        required: true
    },
    title: {
        type: String,
        required: true
    },
    description: String,
    class: String,
    date: {
        type: Date,
        required: true
    },
    score: String,
    studentImage: {
        type: String,
        required: true
    },
    createdAt: {
        type: Date,
        default: Date.now
    }
});

const academicMilestoneSchema = new Schema({
    category: {
        type: String,
        required: true
    },
    number: {
        type: Number,
        required: true
    },
    title: {
        type: String,
        required: true
    },
    description: String,
    createdAt: {
        type: Date,
        default: Date.now
    }
});

const recentUpdateSchema = new Schema({
    date: {
        type: Date,
        required: true
    },
    examType: String,
    title: {
        type: String,
        required: true
    },
    description: String,
    createdAt: {
        type: Date,
        default: Date.now
    }
});

module.exports = {
    StudentStory: mongoose.model('StudentStory', studentStorySchema),
    AcademicMilestone: mongoose.model('AcademicMilestone', academicMilestoneSchema),
    RecentUpdate: mongoose.model('RecentUpdate', recentUpdateSchema)
};