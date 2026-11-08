const mongoose = require("mongoose");

const learningLessonBookmarkSchema = new mongoose.Schema(
  {
    user: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    path: { type: mongoose.Schema.Types.ObjectId, ref: "LearningPath", required: true },
    lesson: { type: mongoose.Schema.Types.ObjectId, ref: "LearningLesson", required: true },
  },
  { timestamps: true }
);

learningLessonBookmarkSchema.index({ user: 1, lesson: 1 }, { unique: true });
learningLessonBookmarkSchema.index({ user: 1, path: 1, updatedAt: -1 });

module.exports = mongoose.model("LearningLessonBookmark", learningLessonBookmarkSchema);
