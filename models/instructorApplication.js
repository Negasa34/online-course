const mongoose = require("mongoose");

const instructorApplicationSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      unique: true,
    },
    profileImage: { type: String, trim: true, maxlength: 2048, default: "" },
    professionalTitle: { type: String, required: true, trim: true, maxlength: 120 },
    biography: { type: String, required: true, trim: true, maxlength: 2000 },
    expertise: { type: [String], required: true },
    teachingExperience: { type: String, required: true, trim: true, maxlength: 2000 },
    qualifications: { type: [String], required: true },
    portfolioLinks: { type: [String], default: [] },
    status: {
      type: String,
      enum: ["PENDING", "APPROVED", "REJECTED"],
      default: "PENDING",
      index: true,
    },
    reviewedBy: { type: mongoose.Schema.Types.ObjectId, ref: "User", default: null },
    reviewedAt: { type: Date, default: null },
    reviewNote: { type: String, trim: true, maxlength: 1000, default: "" },
  },
  { timestamps: true }
);

module.exports = mongoose.model("InstructorApplication", instructorApplicationSchema);
