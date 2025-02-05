const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const contactSchema = new Schema({
    name: {
        type: String,
        required: true
    },
    email: {
        type: String,
        required: true
    },
    contactNumber: {
        type: String,
        required: true
    },
    subject: {
        type: String,
        required: true
    },
    message: {
        type: String,
        required: true
    },
    date: {
        type: Date,
        default: Date.now
    },
    status: {
        type: String,
        enum: ['pending', 'in-progress', 'resolved', 'closed'],
        default: 'pending'
    },
    resolvedBy: {
        type: Schema.Types.ObjectId,
        ref: 'User',
        default: null
    },
    resolutionNotes: {
        type: String,
        default: null
    },
    resolvedAt: {
        type: Date,
        default: null
    }
}, { timestamps: true });

contactSchema.pre('save', function (next) {
    if (this.isModified('status') && this.status === 'resolved') {
        this.resolvedAt = new Date();
    }
    next();
});

module.exports = mongoose.model('Contact', contactSchema);