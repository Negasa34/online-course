const mongoose = require("mongoose");

const exerciseRequirementSchema = new mongoose.Schema(
  {
    type: { type: String, enum: ["element-exists", "element-text", "attribute-equals"], required: true },
    selector: { type: String, required: true, trim: true, maxlength: 200 },
    text: { type: String, trim: true, maxlength: 500 },
    attribute: { type: String, trim: true, maxlength: 80 },
    value: { type: String, trim: true, maxlength: 500 },
  },
  { _id: false }
);

const projectSchema = new mongoose.Schema(
  {
    description: { type: String, required: true, trim: true, maxlength: 2000 },
    learningObjectives: { type: [String], required: true, validate: [(items) => items.length >= 2, "Projects need at least two learning objectives"] },
    requirements: { type: [String], required: true, validate: [(items) => items.length >= 3, "Projects need at least three requirements"] },
    steps: { type: [String], required: true, validate: [(items) => items.length >= 4, "Projects need at least four steps"] },
    expectedOutput: { type: String, required: true, trim: true, maxlength: 2000 },
    solutionCode: { type: String, required: true, maxlength: 20000 },
    solutionExplanation: { type: String, required: true, trim: true, maxlength: 5000 },
    evaluationChecklist: { type: [String], required: true, validate: [(items) => items.length >= 3, "Projects need an evaluation checklist"] },
  },
  { _id: false }
);

const learningExerciseSchema = new mongoose.Schema(
  {
    seedKey: { type: String, required: true, unique: true, trim: true },
    path: { type: mongoose.Schema.Types.ObjectId, ref: "LearningPath", required: true, index: true },
    module: { type: mongoose.Schema.Types.ObjectId, ref: "LearningModule", required: true, index: true },
    lesson: { type: mongoose.Schema.Types.ObjectId, ref: "LearningLesson", required: true, index: true },
    title: { type: String, required: true, trim: true, maxlength: 180 },
    difficulty: { type: String, enum: ["beginner", "intermediate", "advanced"], required: true },
    instructions: { type: String, required: true, trim: true, maxlength: 4000 },
    starterCode: { type: String, required: true, maxlength: 12000 },
    requirements: { type: [exerciseRequirementSchema], required: true, validate: [(items) => items.length > 0, "At least one requirement is required"] },
    hints: { type: [String], required: true, validate: [(items) => items.length >= 2, "At least two hints are required"] },
    solutionCode: { type: String, required: true, maxlength: 20000 },
    solutionExplanation: { type: String, required: true, trim: true, maxlength: 5000 },
    project: { type: projectSchema },
  },
  { timestamps: true }
);

learningExerciseSchema.pre("validate", function validateRequirements() {
  for (const [index, requirement] of this.requirements.entries()) {
    if (requirement.type === "element-text" && !requirement.text) {
      this.invalidate(`requirements.${index}.text`, "Text requirements need expected text");
    }
    if (requirement.type === "attribute-equals" && !requirement.attribute) {
      this.invalidate(`requirements.${index}.attribute`, "Attribute requirements need an attribute name");
    }
    if (requirement.type === "attribute-equals" && requirement.value === undefined) {
      this.invalidate(`requirements.${index}.value`, "Attribute requirements need an expected value");
    }
  }
});

learningExerciseSchema.index({ lesson: 1, seedKey: 1 }, { unique: true });
learningExerciseSchema.index({ module: 1, lesson: 1 });

module.exports = mongoose.model("LearningExercise", learningExerciseSchema);
