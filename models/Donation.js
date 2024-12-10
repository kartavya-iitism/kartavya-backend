const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const DonationSchema = new Schema({
    amount: Number,
    transactionId: String,
    date: Date,
    donationType: {
        type: String,
        enum: ['General', 'Sponsor'],
        required: true
    },
    paymentMode: {
        type: String,
        Enumerator: ['Credit Card', 'Debit Card', 'Net Banking', 'UPI', 'Paytm', 'PhonePe', 'Google Pay', 'Other'],
        required: true
    },
    user: {
        type: Schema.Types.ObjectId,
        ref: 'User'
    }
});

module.exports = mongoose.model('Donation', DonationSchema);