const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const Counter = new Schema({
    prefix: {
      type: String,
      default: "K/DHN/",
    },
    name: {
        type: String,
        enum: ["Donation Receipt", "Student Roll Number"],
        required: true,
        unique: true
    },
    sequenceNumber: {
        type: Number,
        default: 800,
        required: true,
    },

}, {timestamps: true});

module.exports = mongoose.model("Counter", Counter);