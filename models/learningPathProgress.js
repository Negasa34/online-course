const mongoose = require("mongoose");

const learningPathProgressSchema = new mongoose.Schema(
  {
    user: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    path: { type: mongoose.Schema.Types.ObjectId, ref: "LearningPath", required: true },
    lastVisitedLesson: { type: mongoose.Schema.Types.ObjectId, ref: "LearningLesson", default: null },
    completedAt: { type: Date, default: null },
  },
  { timestamps: true }
);

learningPathProgressSchema.index({ user: 1, path: 1 }, { unique: true });

module.exports = mongoose.model("LearningPathProgress", learningPathProgressSchema);
