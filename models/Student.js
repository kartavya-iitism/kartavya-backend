const mongoose = require("mongoose");
const Schema = mongoose.Schema;

const studentSchema = new Schema(
  {
    studentName: {
      type: String,
      required: [true, "Student name is required"],
      trim: true,
    },
    rollNumber: {
      type: String,
      required: [true, "Roll number is required"],
      unique: true,
    },
    gender: {
      type: String,
      required: [true, "Gender is required"],
      enum: ["Male", "Female", "Other"],
    },
    dob: {
      type: Date,
      required: [true, "Date of birth is required"],
    },
    profilePhoto: {
      type: String,
    },
    result: [
      {
        session: String,
        url: String,
      },
    ],
    class: String,
    school: String,
    fathersName: {
      type: String,
      required: [true, "Father's name is required"],
      trim: true,
    },
    fathersOccupation: String,
    mothersName: String,
    mothersOccupation: String,
    centre: {
      type: String,
      required: [true, "Centre is required"],
    },
    address: String,
    contactNumber: {
      type: String,
      validate: {
        validator: function (v) {
          return /\d{10}/.test(v);
        },
        message: (props) => `${props.value} is not a valid phone number!`,
      },
    },
    annualIncome: {
      type: Number,
      min: [0, "Annual income cannot be negative"],
    },
    currentSession: String,
    sponsorshipStatus: {
      type: Boolean,
      default: false,
    },
    annualFees: {
      type: Number,
      min: [0, "Annual fees cannot be negative"],
    },
    sponsorId: {
      type: Schema.Types.ObjectId,
      ref: "User",
    },
    sponsorshipPercent: {
      type: Number,
      default: 0,
      min: [0, "Sponsorship percentage cannot be negative"],
      max: [100, "Sponsorship percentage cannot exceed 100"],
    },
    activeStatus: {
      type: Boolean,
      default: true,
    },
    aadhar: {
      type: Boolean,
      default: false,
    },
    domicile: {
      type: Boolean,
      default: false,
    },
    birthCertificate: {
      type: Boolean,
      default: false,
    },
    disability: {
      type: Boolean,
      default: false,
    },
    singleParent: {
      type: Boolean,
      default: false,
    },
    relevantCertificate: {
      type: Boolean,
      default: false,
    },
  },
  {
    timestamps: true,
  },
);

// Add indexes
studentSchema.index({ rollNumber: 1 }, { unique: true });
studentSchema.index({ centre: 1 });
studentSchema.index({ sponsorId: 1 });

const Student = mongoose.model("Student", studentSchema);
module.exports = Student;
