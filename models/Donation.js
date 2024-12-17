const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const DonationSchema = new Schema({
    amount: {
        type: Number,
        required: true
    },
    donationDate: {
        type: Date,
        default: Date.now,
        required: true
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
    recieptUrl: String,
    numChild: Number
});

module.exports = mongoose.model('Donation', DonationSchema);

