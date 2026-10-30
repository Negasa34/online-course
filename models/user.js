
const mongoose = require("mongoose");

const userSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
      trim: true,
      minlength: 2,
      maxlength: 80,
    },

    email: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true,
    },

    passwordHash: {
      type: String,
      required: true,
      select: false,
    },

    role: {
      type: String,
      enum: ["STUDENT", "INSTRUCTOR", "ADMIN"],
      default: "STUDENT",
    },

    instructorApprovedAt: {
      type: Date,
      default: null,
    },

    accountStatus: {
      type: String,
      enum: ["ACTIVE", "DEACTIVATED"],
      default: "ACTIVE",
    },

    accountStatusChangedAt: {
      type: Date,
      default: null,
    },

    accountStatusChangedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      default: null,
    },

    profileImage: {
      type: String,
      trim: true,
      maxlength: 2048,
      default: "",
    },

    bio: {
      type: String,
      trim: true,
      maxlength: 2000,
      default: "",
    },

    location: {
      type: String,
      trim: true,
      maxlength: 120,
      default: "",
    },

    interests: {
      type: [String],
      default: [],
    },

    professionalTitle: {
      type: String,
      trim: true,
      maxlength: 120,
      default: "",
    },

    expertise: {
      type: [String],
      default: [],
    },

    teachingExperience: {
      type: String,
      trim: true,
      maxlength: 2000,
      default: "",
    },

    qualifications: {
      type: [String],
      default: [],
    },

    portfolioLinks: {
      type: [String],
      default: [],
    },

    termsAcceptedAt: {
      type: Date,
      default: null,
    },

    emailVerifiedAt: {
      type: Date,
      default: null,
    },
  },
  {
    timestamps: true,
  }
);

module.exports = mongoose.model("User", userSchema);
