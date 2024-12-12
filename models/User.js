const mongoose = require('mongoose');
const Schema = mongoose.Schema;
const passportLocalMongoose = require('passport-local-mongoose');

const UserSchema = new Schema({
    name: String,
    email: String,
    contactNumber: String,
    address: String,
    dateOfBirth: Date,
    gender: String,
    otp: {
        otpMobile: {
            type: Number,
        },
        otpEmail: {
            type: Number,
        }
    },
    otpExpiry: {
        type: Date,
        required: false,
    },
    isVerified: {
        type: Boolean,
        default: false,
    },
    governmentOfficial: {
        type: Boolean,
        default: false
    },
    ismPassout: {
        type: Boolean,
        default: false
    },
    batch: String,
    kartavyaVolunteer: {
        type: Boolean,
        default: false
    },
    yearsOfService: String,
    typeOfSponsor: {
        type: String,
        enum: ['Student', 'General', 'Both'],
        default: 'General'
    },
    sponsoredStudents: [
        {
            type: Schema.Types.ObjectId,
            ref: 'Student'
        }
    ],
    dontations: [
        {
            type: Schema.Types.ObjectId,
            ref: 'Donation'
        }
    ],
    username: {
        type: String,
        required: true,
        unique: true
    },
    profileImage: String,
    role: {
        type: String,
        default: 'regular'
    }
});

UserSchema.plugin(passportLocalMongoose);
module.exports = mongoose.model('User', UserSchema);