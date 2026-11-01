const mongoose = require("mongoose");

const lessonProgressSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    course: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Course",
      required: true,
    },
    section: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "CourseSection",
      required: true,
    },
    lesson: {
      type: mongoose.Schema.Types.ObjectId,
      required: true,
    },
    completed: { type: Boolean, default: false },
    completedAt: { type: Date, default: null },
    lastViewedAt: { type: Date, default: Date.now },
  },
  { timestamps: true }
);

lessonProgressSchema.index(
  { user: 1, course: 1, lesson: 1 },
  { unique: true }
);
lessonProgressSchema.index({ user: 1, course: 1, lastViewedAt: -1 });

module.exports = mongoose.model("LessonProgress", lessonProgressSchema);
