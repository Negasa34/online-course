const mongoose = require("mongoose");

const answerSchema = new mongoose.Schema(
  {
    questionKey: { type: String, required: true, trim: true },
    choiceId: { type: String, trim: true },
    response: { type: String, maxlength: 12000 },
    correct: { type: Boolean, required: true },
  },
  { _id: false }
);

const learningQuizAttemptSchema = new mongoose.Schema(
  {
    user: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    path: { type: mongoose.Schema.Types.ObjectId, ref: "LearningPath", required: true },
    quiz: { type: mongoose.Schema.Types.ObjectId, ref: "LearningQuiz", required: true },
    scope: { type: String, enum: ["lesson", "module", "final"], required: true },
    contentVersion: { type: Number, required: true, min: 1 },
    score: { type: Number, required: true, min: 0, max: 100 },
    correctCount: { type: Number, required: true, min: 0 },
    questionCount: { type: Number, required: true, min: 1 },
    passed: { type: Boolean, required: true },
    answers: { type: [answerSchema], required: true },
    submittedAt: { type: Date, default: Date.now },
  },
  { timestamps: true }
);

learningQuizAttemptSchema.index({ user: 1, quiz: 1, submittedAt: -1 });
learningQuizAttemptSchema.index({ user: 1, path: 1, scope: 1, passed: 1 });

module.exports = mongoose.model("LearningQuizAttempt", learningQuizAttemptSchema);
