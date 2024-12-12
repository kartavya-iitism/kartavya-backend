const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const DonationSchema = new Schema({
    amount: Number,
    date: Date,
    name: String,
    mobileNumber: String,
    // email
    user: {
        type: Schema.Types.ObjectId,
        ref: 'User'
    },
    typeOfDonation:{
        type: String,
        enum: ['Child', 'General'],
        require: true
    }
    // screenshot
    // type -> child or general
    // child in multiple of fix amount

});

module.exports = mongoose.model('Donation', DonationSchema);

