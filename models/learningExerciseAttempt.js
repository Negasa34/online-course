const mongoose = require("mongoose");

const learningExerciseAttemptSchema = new mongoose.Schema(
  {
    user: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    path: { type: mongoose.Schema.Types.ObjectId, ref: "LearningPath", required: true },
    module: { type: mongoose.Schema.Types.ObjectId, ref: "LearningModule", required: true },
    lesson: { type: mongoose.Schema.Types.ObjectId, ref: "LearningLesson", required: true },
    exercise: { type: mongoose.Schema.Types.ObjectId, ref: "LearningExercise", required: true },
    passed: { type: Boolean, required: true },
    requirementResults: [{ requirementIndex: { type: Number, required: true, min: 0 }, passed: { type: Boolean, required: true } }],
    submittedAt: { type: Date, default: Date.now },
  },
  { timestamps: true }
);

learningExerciseAttemptSchema.index({ user: 1, exercise: 1, submittedAt: -1 });
learningExerciseAttemptSchema.index({ user: 1, path: 1, passed: 1 });

module.exports = mongoose.model("LearningExerciseAttempt", learningExerciseAttemptSchema);
