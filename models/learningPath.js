const mongoose = require("mongoose");

const learningPathSchema = new mongoose.Schema(
  {
    seedKey: { type: String, required: true, unique: true, trim: true },
    title: { type: String, required: true, trim: true, maxlength: 160 },
    slug: { type: String, required: true, unique: true, lowercase: true, trim: true },
    subtitle: { type: String, required: true, trim: true, maxlength: 300 },
    description: { type: String, required: true, trim: true, maxlength: 5000 },
    language: { type: String, required: true, default: "English" },
    targetAudience: { type: [String], required: true, validate: [(items) => items.length > 0, "At least one audience is required"] },
    status: { type: String, enum: ["DRAFT", "PUBLISHED"], default: "DRAFT", index: true },
    contentVersion: { type: Number, required: true, min: 1, default: 1 },
  },
  { timestamps: true }
);

module.exports = mongoose.model("LearningPath", learningPathSchema);
