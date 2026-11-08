const mongoose = require("mongoose");

const learningLessonProgressSchema = new mongoose.Schema(
  {
    user: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    path: { type: mongoose.Schema.Types.ObjectId, ref: "LearningPath", required: true },
    module: { type: mongoose.Schema.Types.ObjectId, ref: "LearningModule", required: true },
    lesson: { type: mongoose.Schema.Types.ObjectId, ref: "LearningLesson", required: true },
    completed: { type: Boolean, default: false },
    completedAt: { type: Date, default: null },
    lastViewedAt: { type: Date, default: Date.now },
  },
  { timestamps: true }
);

learningLessonProgressSchema.index({ user: 1, lesson: 1 }, { unique: true });
learningLessonProgressSchema.index({ user: 1, path: 1, lastViewedAt: -1 });

module.exports = mongoose.model("LearningLessonProgress", learningLessonProgressSchema);
