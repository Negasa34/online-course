require("dotenv").config();

const mongoose = require("mongoose");
const curriculum = require("../data/pythonFundamentals");
const LearningPath = require("../models/learningPath");
const LearningModule = require("../models/learningModule");
const LearningLesson = require("../models/learningLesson");
const LearningExercise = require("../models/learningExercise");
const LearningQuiz = require("../models/learningQuiz");

const SEED_NAMESPACE = "learnhub-python-v1";
const models = { LearningPath, LearningModule, LearningLesson, LearningExercise, LearningQuiz };

function stableKey(kind, slug) {
  return `${SEED_NAMESPACE}:${kind}:${slug}`;
}

function createSummary() {
  return { succeeded: { paths: 0, modules: 0, lessons: 0, exercises: 0, quizzes: 0 }, failed: [] };
}

function quizQuestions(items, prefix) {
  return items.map((item, index) => ({
    questionKey: `${prefix}-q${index + 1}`,
    type: item.type,
    prompt: item.prompt,
    choices: item.choices,
    correctChoiceId: item.correctChoiceId,
    explanation: item.explanation,
    ...(item.type === "short-answer" ? {
      requirements: item.requirements,
      rubric: item.rubric,
      hints: item.hints,
    } : {}),
  }));
}

function moduleAssessment(moduleData) {
  const questions = moduleData.lessons.flatMap((lesson) => lesson.quiz);
  if (questions.length < 3) throw new Error(`Module ${moduleData.slug} needs at least three quiz questions`);
  return quizQuestions(questions.slice(0, 5), `module-${moduleData.slug}`);
}

function finalAssessment(courseData) {
  const questions = courseData.modules.flatMap((module) => module.lessons.flatMap((lesson) => lesson.quiz));
  if (questions.length < 3) throw new Error("Python Fundamentals needs at least three questions for its final assessment");
  return quizQuestions(questions.slice(0, 15), `final-${courseData.slug}`);
}

function validateCourseData(courseData) {
  if (
    courseData?.slug !== "python-fundamentals" ||
    courseData.subject !== "python" ||
    courseData.trackKey !== "fundamentals" ||
    courseData.trackOrder !== 1 ||
    courseData.prerequisiteSlugs?.length !== 0 ||
    courseData.minimumPythonVersion !== "3.11" ||
    courseData.completionPolicy !== "all-lessons-and-assessments" ||
    !Array.isArray(courseData.modules) || courseData.modules.length !== 5
  ) {
    throw new Error("Python Fundamentals path metadata or module structure is incomplete");
  }

  const moduleSlugs = new Set();
  const lessonSlugs = new Set();
  let lessonCount = 0;
  for (const [moduleIndex, module] of courseData.modules.entries()) {
    if (!module.slug || moduleSlugs.has(module.slug) || module.order !== undefined && module.order !== moduleIndex + 1) {
      throw new Error(`Module ${module.slug || moduleIndex + 1} has a missing or duplicate slug/order`);
    }
    moduleSlugs.add(module.slug);
    if (!module.title || !module.summary || module.objectives?.length < 2 || !module.lessons?.length) {
      throw new Error(`Module ${module.slug} is missing objectives, summary, or lessons`);
    }

    for (const [lessonIndex, lesson] of module.lessons.entries()) {
      lessonCount += 1;
      if (!lesson.slug || lessonSlugs.has(lesson.slug) || lesson.order !== undefined && lesson.order !== lessonIndex + 1) {
        throw new Error(`Lesson ${lesson.slug || lessonIndex + 1} has a missing or duplicate slug/order`);
      }
      lessonSlugs.add(lesson.slug);
      const content = lesson.content;
      const exercise = lesson.exercise;
      if (
        !lesson.title || !Number.isInteger(lesson.minutes) || lesson.minutes < 1 ||
        !content?.introduction || content.objectives?.length < 2 || content.explanation?.length < 2 ||
        content.terminology?.length < 1 || !content.syntax || !content.codeExample?.code ||
        !content.codeExample.output || content.codeExample.lines?.length < 1 ||
        content.commonMistakes?.length < 2 || content.bestPractices?.length < 2 || !content.summary ||
        content.selfCheckQuestions?.length < 2 || content.references?.length < 1 ||
        exercise?.language !== "python" || !exercise.instructions || !exercise.starterCode ||
        exercise.hints?.length < 2 || exercise.selfChecks?.length < 2 || !exercise.solutionCode ||
        !exercise.solutionExplanation || lesson.quiz?.length < 3
      ) {
        throw new Error(`Lesson ${lesson.slug} is missing substantive Python content`);
      }
      const questionKeys = new Set();
      for (const [questionIndex, question] of lesson.quiz.entries()) {
        const key = `${lesson.slug}-q${questionIndex + 1}`;
        const validShortAnswer = question.type === "short-answer" && question.requirements?.length > 0 && question.rubric?.length > 0;
        const validChoiceQuestion = ["multiple-choice", "true-false", "code-output"].includes(question.type) &&
          question.choices?.length >= 2 && question.choices.some((choice) => choice.id === question.correctChoiceId);
        if (questionKeys.has(key) || !question.prompt || !question.explanation || !(validShortAnswer || validChoiceQuestion)) {
          throw new Error(`Lesson ${lesson.slug} has an invalid quiz question`);
        }
        questionKeys.add(key);
      }
      if (lesson.project && (
        lesson.project.learningObjectives?.length < 2 || lesson.project.requirements?.length < 3 ||
        lesson.project.steps?.length < 4 || !lesson.project.expectedOutput ||
        !lesson.project.solutionCode || !lesson.project.solutionExplanation ||
        lesson.project.evaluationChecklist?.length < 3
      )) {
        throw new Error(`Project lesson ${lesson.slug} is missing its project brief or self-check requirements`);
      }
    }
    moduleAssessment(module);
  }

  if (lessonCount !== 25 || !moduleSlugs.has(courseData.finalProjectModuleSlug)) {
    throw new Error("Python Fundamentals must contain 25 lessons and a valid final project module");
  }
  finalAssessment(courseData);
}

async function upsertOwnedRecord(Model, seedKey, fields, summary, kind) {
  try {
    await Model.findOneAndUpdate(
      { seedKey },
      { $set: { ...fields, seedKey } },
      { upsert: true, returnDocument: "after", runValidators: true, setDefaultsOnInsert: true }
    );
    summary.succeeded[kind] += 1;
  } catch (error) {
    summary.failed.push({ kind, seedKey, message: error.message });
  }
}

async function seedPythonFundamentals({ modelSet = models, courseData = curriculum, logger = console } = {}) {
  const summary = createSummary();
  try {
    validateCourseData(courseData);
  } catch (error) {
    summary.failed.push({ kind: "course content validation", message: error.message });
    logger.error("Python Fundamentals seed stopped: validation failed.");
    return summary;
  }

  const pathSeedKey = stableKey("path", courseData.slug);
  try {
    const existing = await modelSet.LearningPath.findOne({ slug: courseData.slug }).select("_id seedKey").lean();
    if (existing && existing.seedKey !== pathSeedKey) {
      summary.failed.push({ kind: "path conflict", message: `Slug ${courseData.slug} is owned by a different Learning Path seed.` });
      logger.error("Python Fundamentals seed stopped: path slug conflict.");
      return summary;
    }
  } catch (error) {
    summary.failed.push({ kind: "path preflight", message: error.message });
    logger.error("Python Fundamentals seed stopped: path preflight failed.");
    return summary;
  }

  let path;
  try {
    path = await modelSet.LearningPath.findOneAndUpdate(
      { seedKey: pathSeedKey },
      { $set: {
        seedKey: pathSeedKey,
        title: courseData.title,
        slug: courseData.slug,
        subtitle: courseData.subtitle,
        description: courseData.description,
        language: courseData.language,
        targetAudience: courseData.targetAudience,
        subject: courseData.subject,
        trackKey: courseData.trackKey,
        trackOrder: courseData.trackOrder,
        prerequisiteSlugs: courseData.prerequisiteSlugs,
        estimatedHours: courseData.estimatedHours,
        minimumPythonVersion: courseData.minimumPythonVersion,
        completionPolicy: courseData.completionPolicy,
        finalProjectModuleSlug: courseData.finalProjectModuleSlug,
        status: "PUBLISHED",
        contentVersion: courseData.contentVersion,
      } },
      { upsert: true, returnDocument: "after", runValidators: true, setDefaultsOnInsert: true }
    );
    summary.succeeded.paths += 1;
  } catch (error) {
    summary.failed.push({ kind: "path", seedKey: pathSeedKey, message: error.message });
    logger.error("Python Fundamentals seed stopped while saving the path.");
    return summary;
  }

  for (const [moduleIndex, moduleData] of courseData.modules.entries()) {
    const moduleSeedKey = stableKey("module", moduleData.slug);
    const module = await modelSet.LearningModule.findOneAndUpdate(
      { seedKey: moduleSeedKey },
      { $set: {
        seedKey: moduleSeedKey,
        path: path._id,
        title: moduleData.title,
        slug: moduleData.slug,
        order: moduleIndex + 1,
        summary: moduleData.summary,
        objectives: moduleData.objectives,
      } },
      { upsert: true, returnDocument: "after", runValidators: true, setDefaultsOnInsert: true }
    ).catch((error) => {
      summary.failed.push({ kind: "module", seedKey: moduleSeedKey, message: error.message });
      return null;
    });
    if (!module) continue;
    summary.succeeded.modules += 1;

    for (const [lessonIndex, lessonData] of moduleData.lessons.entries()) {
      const lessonSeedKey = stableKey("lesson", lessonData.slug);
      const lesson = await modelSet.LearningLesson.findOneAndUpdate(
        { seedKey: lessonSeedKey },
        { $set: {
          seedKey: lessonSeedKey,
          path: path._id,
          module: module._id,
          title: lessonData.title,
          slug: lessonData.slug,
          order: lessonIndex + 1,
          estimatedMinutes: lessonData.minutes,
          content: lessonData.content,
          ...(lessonData.project ? { project: lessonData.project } : {}),
        } },
        { upsert: true, returnDocument: "after", runValidators: true, setDefaultsOnInsert: true }
      ).catch((error) => {
        summary.failed.push({ kind: "lesson", seedKey: lessonSeedKey, message: error.message });
        return null;
      });
      if (!lesson) continue;
      summary.succeeded.lessons += 1;

      const exerciseData = lessonData.exercise;
      await upsertOwnedRecord(modelSet.LearningExercise, stableKey("exercise", lessonData.slug), {
        path: path._id,
        module: module._id,
        lesson: lesson._id,
        title: exerciseData.title,
        language: "python",
        difficulty: exerciseData.difficulty || "beginner",
        instructions: exerciseData.instructions,
        starterCode: exerciseData.starterCode,
        requirements: [],
        selfChecks: exerciseData.selfChecks,
        hints: exerciseData.hints,
        solutionCode: exerciseData.solutionCode,
        solutionExplanation: exerciseData.solutionExplanation,
      }, summary, "exercises");

      await upsertOwnedRecord(modelSet.LearningQuiz, stableKey("lesson-quiz", lessonData.slug), {
        path: path._id,
        module: module._id,
        lesson: lesson._id,
        scope: "lesson",
        title: `${lessonData.title} quiz`,
        contentVersion: courseData.contentVersion,
        questions: quizQuestions(lessonData.quiz, lessonData.slug),
      }, summary, "quizzes");
    }

    await upsertOwnedRecord(modelSet.LearningQuiz, stableKey("module-quiz", moduleData.slug), {
      path: path._id,
      module: module._id,
      lesson: null,
      scope: "module",
      title: `${moduleData.title} assessment`,
      contentVersion: courseData.contentVersion,
      questions: moduleAssessment(moduleData),
    }, summary, "quizzes");
  }

  const finalModule = courseData.modules.find((module) => module.slug === courseData.finalProjectModuleSlug);
  await upsertOwnedRecord(modelSet.LearningQuiz, stableKey("final-quiz", courseData.slug), {
    path: path._id,
    module: null,
    lesson: null,
    scope: "final",
    title: "Python Fundamentals final assessment",
    passingScore: 70,
    contentVersion: courseData.contentVersion,
    questions: finalAssessment(courseData),
  }, summary, "quizzes");
  if (!finalModule) summary.failed.push({ kind: "final project", message: "Final project module is missing." });

  if (summary.failed.length) logger.error("Python Fundamentals seed finished with failures.");
  else logger.info("Python Fundamentals seed completed.");
  return summary;
}

async function main() {
  if (!process.env.MONGODB_URI) throw new Error("MONGODB_URI is missing from .env");
  await mongoose.connect(process.env.MONGODB_URI, {
    dbName: process.env.MONGODB_DB_NAME || "olinecourse",
    serverSelectionTimeoutMS: 15000,
  });
  const summary = await seedPythonFundamentals();
  if (summary.failed.length) process.exitCode = 1;
}

if (require.main === module) {
  main()
    .catch((error) => {
      console.error(`Python Fundamentals seed could not start: ${error.message}`);
      process.exitCode = 1;
    })
    .finally(async () => {
      if (mongoose.connection.readyState) await mongoose.disconnect();
    });
}

module.exports = {
  SEED_NAMESPACE,
  finalAssessment,
  moduleAssessment,
  seedPythonFundamentals,
  stableKey,
  validateCourseData,
};