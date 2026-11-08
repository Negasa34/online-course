const mongoose = require("mongoose");

const learningModuleSchema = new mongoose.Schema(
  {
    seedKey: { type: String, required: true, unique: true, trim: true },
    path: { type: mongoose.Schema.Types.ObjectId, ref: "LearningPath", required: true, index: true },
    title: { type: String, required: true, trim: true, maxlength: 160 },
    slug: { type: String, required: true, lowercase: true, trim: true },
    order: { type: Number, required: true, min: 1 },
    summary: { type: String, required: true, trim: true, maxlength: 2000 },
    objectives: { type: [String], required: true, validate: [(items) => items.length > 0, "At least one objective is required"] },
  },
  { timestamps: true }
);

learningModuleSchema.index({ path: 1, slug: 1 }, { unique: true });
learningModuleSchema.index({ path: 1, order: 1 });

module.exports = mongoose.model("LearningModule", learningModuleSchema);
