const LearningExercise = require("../models/learningExercise");
const LearningExerciseAttempt = require("../models/learningExerciseAttempt");
const LearningLesson = require("../models/learningLesson");
const LearningLessonProgress = require("../models/learningLessonProgress");
const LearningModule = require("../models/learningModule");
const LearningPathProgress = require("../models/learningPathProgress");
const LearningQuiz = require("../models/learningQuiz");
const LearningQuizAttempt = require("../models/learningQuizAttempt");

async function findOwnedPathProgress(userId, pathId) {
  return LearningPathProgress.findOne({ user: userId, path: pathId }).lean();
}

async function updatePathPosition(userId, lesson) {
  try {
    await LearningPathProgress.findOneAndUpdate(
      { user: userId, path: lesson.path },
      { $set: { lastVisitedLesson: lesson._id }, $setOnInsert: { completedAt: null } },
      { upsert: true, returnDocument: "after", runValidators: true, setDefaultsOnInsert: true }
    );
  } catch (error) {
    if (error.code !== 11000) throw error;
    await LearningPathProgress.updateOne(
      { user: userId, path: lesson.path },
      { $set: { lastVisitedLesson: lesson._id } },
      { runValidators: true }
    );
  }
}

async function recomputePathCompletion(userId, pathId) {
  const [modules, lessons, completedLessons] = await Promise.all([
    LearningModule.find({ path: pathId }).select("_id").lean(),
    LearningLesson.find({ path: pathId }).select("_id").lean(),
    LearningLessonProgress.countDocuments({ user: userId, path: pathId, completed: true }),
  ]);
  if (!lessons.length) return false;

  const moduleIds = modules.map((module) => module._id);
  const [requiredQuizzes, passedQuizIds, projectExercises, passedProjectExerciseIds] = await Promise.all([
    LearningQuiz.find({
      path: pathId,
      $or: [{ scope: "final" }, { scope: "module", module: { $in: moduleIds } }],
    }).select("_id scope module").lean(),
    LearningQuizAttempt.distinct("quiz", { user: userId, path: pathId, passed: true }),
    LearningExercise.find({ path: pathId, "project.description": { $exists: true } }).select("_id").lean(),
    LearningExerciseAttempt.distinct("exercise", {
      user: userId,
      path: pathId,
      passed: true,
    }),
  ]);
  const passedQuizSet = new Set(passedQuizIds.map(String));
  const allAssessmentsPassed = requiredQuizzes.length > 0 &&
    requiredQuizzes.every((quiz) => passedQuizSet.has(String(quiz._id)));
  const passedProjectSet = new Set(passedProjectExerciseIds.map(String));
  const allProjectsPassed = projectExercises.length > 0 &&
    projectExercises.every((exercise) => passedProjectSet.has(String(exercise._id)));
  const complete = completedLessons === lessons.length && allAssessmentsPassed && allProjectsPassed;
  const existingProgress = await findOwnedPathProgress(userId, pathId);
  const completedAt = complete ? (existingProgress?.completedAt || new Date()) : null;

  try {
    await LearningPathProgress.findOneAndUpdate(
      { user: userId, path: pathId },
      { $set: { completedAt } },
      { upsert: true, returnDocument: "after", runValidators: true, setDefaultsOnInsert: true }
    );
  } catch (error) {
    if (error.code !== 11000) throw error;
    await LearningPathProgress.updateOne(
      { user: userId, path: pathId },
      { $set: { completedAt } },
      { runValidators: true }
    );
  }
  return complete;
}

async function recordLessonVisit(userId, lesson) {
  const now = new Date();
  try {
    await LearningLessonProgress.findOneAndUpdate(
      { user: userId, lesson: lesson._id },
      {
        $set: { path: lesson.path, module: lesson.module, lastViewedAt: now },
        $setOnInsert: { completed: false, completedAt: null },
      },
      { upsert: true, returnDocument: "after", runValidators: true, setDefaultsOnInsert: true }
    );
  } catch (error) {
    if (error.code !== 11000) throw error;
    await LearningLessonProgress.updateOne(
      { user: userId, lesson: lesson._id },
      { $set: { lastViewedAt: now } },
      { runValidators: true }
    );
  }
  await updatePathPosition(userId, lesson);
}

async function completeLesson(userId, lesson) {
  const now = new Date();
  const existingProgress = await LearningLessonProgress.findOne({
    user: userId,
    lesson: lesson._id,
  }).select("completed completedAt");
  const completedAt = existingProgress?.completed && existingProgress.completedAt
    ? existingProgress.completedAt
    : now;
  try {
    await LearningLessonProgress.findOneAndUpdate(
      { user: userId, lesson: lesson._id },
      {
        $set: {
          path: lesson.path,
          module: lesson.module,
          completed: true,
          completedAt,
          lastViewedAt: now,
        },
      },
      { upsert: true, returnDocument: "after", runValidators: true, setDefaultsOnInsert: true }
    );
  } catch (error) {
    if (error.code !== 11000) throw error;
    await LearningLessonProgress.updateOne(
      { user: userId, lesson: lesson._id },
      { $set: { completed: true, completedAt, lastViewedAt: now } },
      { runValidators: true }
    );
  }
  await updatePathPosition(userId, lesson);
  await recomputePathCompletion(userId, lesson.path);
}

async function saveExerciseAttempt(userId, exercise, result) {
  return LearningExerciseAttempt.create({
    user: userId,
    path: exercise.path,
    module: exercise.module,
    lesson: exercise.lesson,
    exercise: exercise._id,
    passed: result.passed,
    requirementResults: result.results,
  });
}

async function saveQuizAttempt(userId, quiz, result) {
  return LearningQuizAttempt.create({
    user: userId,
    path: quiz.path,
    quiz: quiz._id,
    scope: quiz.scope,
    contentVersion: quiz.contentVersion,
    score: result.score,
    correctCount: result.correctCount,
    questionCount: result.questionCount,
    passed: result.passed,
    answers: result.answers,
  });
}

module.exports = {
  completeLesson,
  findOwnedPathProgress,
  recordLessonVisit,
  recomputePathCompletion,
  saveExerciseAttempt,
  saveQuizAttempt,
};
