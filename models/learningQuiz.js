const mongoose = require("mongoose");

const quizChoiceSchema = new mongoose.Schema(
  {
    id: { type: String, required: true, trim: true, maxlength: 20 },
    text: { type: String, required: true, trim: true, maxlength: 2000 },
  },
  { _id: false }
);

const quizQuestionSchema = new mongoose.Schema(
  {
    questionKey: { type: String, required: true, trim: true, maxlength: 100 },
    type: { type: String, enum: ["multiple-choice", "true-false", "code-output", "practical"], required: true },
    prompt: { type: String, required: true, trim: true, maxlength: 4000 },
    choices: { type: [quizChoiceSchema], default: [] },
    correctChoiceId: { type: String, trim: true, maxlength: 20 },
    explanation: { type: String, required: true, trim: true, maxlength: 3000 },
    starterCode: { type: String, maxlength: 12000 },
    requirements: { type: [String], default: [] },
    hints: { type: [String], default: [] },
    rubric: { type: [String], default: [] },
    solutionCode: { type: String, maxlength: 20000 },
  },
  { _id: false }
);

quizQuestionSchema.pre("validate", function validateQuestion() {
  const choiceBased = ["multiple-choice", "true-false", "code-output"].includes(this.type);
  if (choiceBased && (this.choices.length < 2 || !this.choices.some((choice) => choice.id === this.correctChoiceId))) {
    this.invalidate("correctChoiceId", "Choice-based questions need choices and one matching correct answer");
  }
  if (new Set(this.choices.map((choice) => choice.id)).size !== this.choices.length) {
    this.invalidate("choices", "Choice IDs must be unique within a question");
  }
  if (this.type === "practical" && (!this.requirements.length || !this.rubric.length)) {
    this.invalidate("rubric", "Practical questions need requirements and an evaluation rubric");
  }
});

const learningQuizSchema = new mongoose.Schema(
  {
    seedKey: { type: String, required: true, unique: true, trim: true },
    path: { type: mongoose.Schema.Types.ObjectId, ref: "LearningPath", required: true, index: true },
    scope: { type: String, enum: ["lesson", "module", "final"], required: true, index: true },
    module: { type: mongoose.Schema.Types.ObjectId, ref: "LearningModule", default: null, index: true },
    lesson: { type: mongoose.Schema.Types.ObjectId, ref: "LearningLesson", default: null, index: true },
    title: { type: String, required: true, trim: true, maxlength: 180 },
    passingScore: { type: Number, min: 0, max: 100, default: 70 },
    contentVersion: { type: Number, required: true, min: 1, default: 1 },
    questions: { type: [quizQuestionSchema], required: true, validate: [(items) => items.length >= 3, "A quiz needs at least three questions"] },
  },
  { timestamps: true }
);

learningQuizSchema.index({ lesson: 1, scope: 1 }, { unique: true, partialFilterExpression: { scope: "lesson" } });
learningQuizSchema.index({ module: 1, scope: 1 }, { unique: true, partialFilterExpression: { scope: "module" } });

module.exports = mongoose.model("LearningQuiz", learningQuizSchema);
