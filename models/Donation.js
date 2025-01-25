const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const DonationSchema = new Schema({
    amount: {
        type: Number,
        required: true
    },
    donationDate: {
        type: Date,
        default: Date.now
    },
    name: {
        type: String,
        required: true
    },
    contactNumber: {
        type: String,
        required: true
    },
    email: {
        type: String,
        required: true
    },
    user: {
        type: Schema.Types.ObjectId,
        ref: 'User'
    },
    verified: {
        type: Boolean,
        default: false,
        required: true
    },
    rejected: {
        type: Boolean,
        default: false,
        required: true
    },
    rejectionReason: String,
    recieptUrl: String,
    numChild: {
        type: Number,
        default: 0
    }
});

module.exports = mongoose.model('Donation', DonationSchema);

