const mongoose = require("mongoose");

const terminologySchema = new mongoose.Schema(
  {
    term: { type: String, required: true, trim: true, maxlength: 100 },
    definition: { type: String, required: true, trim: true, maxlength: 1000 },
  },
  { _id: false }
);

const codeExampleSchema = new mongoose.Schema(
  {
    code: { type: String, required: true, maxlength: 12000 },
    lines: { type: [String], required: true, validate: [(items) => items.length > 0, "Explain important code lines"] },
    output: { type: String, required: true, trim: true, maxlength: 2000 },
  },
  { _id: false }
);

const lessonContentSchema = new mongoose.Schema(
  {
    introduction: { type: String, required: true, trim: true, maxlength: 2000 },
    objectives: { type: [String], required: true, validate: [(items) => items.length >= 2, "At least two objectives are required"] },
    explanation: { type: [String], required: true, validate: [(items) => items.length >= 2, "At least two explanation sections are required"] },
    terminology: { type: [terminologySchema], required: true, validate: [(items) => items.length > 0, "Terminology is required"] },
    syntax: { type: String, required: true, trim: true, maxlength: 3000 },
    codeExample: { type: codeExampleSchema, required: true },
    commonMistakes: { type: [String], required: true, validate: [(items) => items.length >= 2, "At least two common mistakes are required"] },
    bestPractices: { type: [String], required: true, validate: [(items) => items.length >= 2, "At least two best practices are required"] },
    summary: { type: String, required: true, trim: true, maxlength: 2000 },
  },
  { _id: false }
);

const learningLessonSchema = new mongoose.Schema(
  {
    seedKey: { type: String, required: true, unique: true, trim: true },
    path: { type: mongoose.Schema.Types.ObjectId, ref: "LearningPath", required: true, index: true },
    module: { type: mongoose.Schema.Types.ObjectId, ref: "LearningModule", required: true, index: true },
    title: { type: String, required: true, trim: true, maxlength: 180 },
    slug: { type: String, required: true, lowercase: true, trim: true },
    order: { type: Number, required: true, min: 1 },
    estimatedMinutes: { type: Number, required: true, min: 1, max: 600 },
    content: { type: lessonContentSchema, required: true },
    project: {
      description: { type: String, trim: true, maxlength: 2000 },
      learningObjectives: [String],
      requirements: [String],
      steps: [String],
      expectedOutput: { type: String, trim: true, maxlength: 2000 },
      solutionCode: { type: String, maxlength: 20000 },
      solutionExplanation: { type: String, trim: true, maxlength: 5000 },
      evaluationChecklist: [String],
    },
  },
  { timestamps: true }
);

learningLessonSchema.index({ module: 1, slug: 1 }, { unique: true });
learningLessonSchema.index({ module: 1, order: 1 });

module.exports = mongoose.model("LearningLesson", learningLessonSchema);
