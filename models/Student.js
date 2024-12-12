const mongoose = require('mongoose');
const Schema = mongoose.Schema;


const StudentSchema = new Schema({
    serialNumber: String,
    name: String,
    fatherName: String,
    motherName: String,
    address: String,
    school: String,
    dateOfBirth: Date,
    gender: String,
    grade: String,
    familyIncome: Number,
    profileImage: String,
    results: [
        {
            term: String,
            subject: String,
            marks: Number,
            remarks: String
        }
    ],
    comment: String,
    sponsored: {
        type: Boolean,
        default: false
    },
    sponsor: {
        type: Schema.Types.ObjectId,
        ref: 'Sponsor'
    }
});

module.exports = mongoose.model('Student', StudentSchema);