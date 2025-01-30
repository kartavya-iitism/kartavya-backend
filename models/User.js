const mongoose = require('mongoose');
const Schema = mongoose.Schema;
const crypto = require('crypto');

const UserSchema = new Schema({
    name: String,
    email: {
        type: String,
        required: true,
        unique: true
    },
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
    yearsOfServiceStart: String,
    yearsOfServiceEnd: String,
    currentJob: String,
    sponsoredStudents: [
        {
            type: Schema.Types.ObjectId,
            ref: 'Student'
        }
    ],
    donations: [
        {
            type: Schema.Types.ObjectId,
            ref: 'Donation'
        }
    ],
    totalDonation: {
        type: Number,
        default: 0
    },
    username: {
        type: String,
        required: true,
        unique: true
    },
    profileImage: String,
    role: {
        type: String,
        default: 'regular'
    },
    dateOfRegistration: {
        type: Date,
        default: Date.now
    },
    lastDonationDate: {
        type: Date
    },
    resetPasswordToken: {
        type: String,
        required: false
    },
    resetPasswordExpires: {
        type: Date,
        required: false
    },
    hash: String,
    salt: String,
    googleId: {
        type: String,
        unique: true,
        sparse: true
    }
});

UserSchema.methods.setPassword = function (password) {
    this.salt = crypto.randomBytes(16).toString('hex');
    this.hash = crypto
        .pbkdf2Sync(password, this.salt, 10000, 512, 'sha512')
        .toString('hex');
};

UserSchema.methods.validatePassword = function (password) {
    const hash = crypto
        .pbkdf2Sync(password, this.salt, 10000, 512, 'sha512')
        .toString('hex');
    return this.hash === hash;
};

module.exports = mongoose.model('User', UserSchema);