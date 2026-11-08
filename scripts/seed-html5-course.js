require("dotenv").config();

const mongoose = require("mongoose");
const course = require("../data/html5Course");
const practicalQuestions = require("../data/html5Assessments");
const LearningPath = require("../models/learningPath");
const LearningModule = require("../models/learningModule");
const LearningLesson = require("../models/learningLesson");
const LearningExercise = require("../models/learningExercise");
const LearningQuiz = require("../models/learningQuiz");
const LearningLessonProgress = require("../models/learningLessonProgress");
const LearningExerciseAttempt = require("../models/learningExerciseAttempt");
const LearningQuizAttempt = require("../models/learningQuizAttempt");
const LearningPathProgress = require("../models/learningPathProgress");

const SEED_NAMESPACE = "learnhub-html5-v1";
const REQUIRED_MODULES = [
  ["introduction-to-html", 10],
  ["html-document-structure", 10],
  ["html-text-elements", 13],
  ["links-and-navigation", 11],
  ["images-and-graphics", 10],
  ["html-lists", 7],
  ["html-tables", 10],
  ["html-forms", 23],
  ["semantic-html5", 14],
  ["html-multimedia", 10],
  ["html-advanced-elements", 12],
  ["accessibility-and-seo", 12],
  ["html-best-practices", 10],
  ["practical-html-projects", 10],
  ["final-html-assessment", 0],
];
const models = {
  LearningPath,
  LearningModule,
  LearningLesson,
  LearningExercise,
  LearningQuiz,
  LearningLessonProgress,
  LearningExerciseAttempt,
  LearningQuizAttempt,
  LearningPathProgress,
};

function stableKey(kind, slug) {
  return `${SEED_NAMESPACE}:${kind}:${slug}`;
}

function assessmentQuestion(question, questionKey) {
  return {
    questionKey,
    type: question.type,
    prompt: question.prompt,
    choices: question.choices || [],
    correctChoiceId: question.correctChoiceId,
    explanation: question.explanation,
  };
}

function questionsForModule(module) {
  const questions = module.lessons.flatMap((lesson) =>
    lesson.quiz.map((question, index) => ({
      ...question,
      questionKey: `${lesson.slug}-q${index + 1}`,
    }))
  );
  if (questions.length < 10) {
    throw new Error(`Module "${module.title}" needs at least 10 lesson quiz questions for its assessment`);
  }
  return questions.slice(0, 10).map((question) =>
    assessmentQuestion(question, `module-${module.slug}-${question.questionKey}`)
  );
}

function finalAssessmentQuestions(modules) {
  const questions = modules.flatMap((module) =>
    module.lessons.flatMap((lesson) =>
      lesson.quiz.map((question, index) => ({
        ...question,
        questionKey: `${lesson.slug}-q${index + 1}`,
      }))
    )
  );
  const counts = [
    ["multiple-choice", 30],
    ["true-false", 10],
    ["code-output", 10],
  ];
  const selected = [];
  for (const [type, count] of counts) {
    const matches = questions.filter((question) => question.type === type);
    if (matches.length < count) {
      throw new Error(`The final assessment needs ${count} ${type} questions; found ${matches.length}`);
    }
    selected.push(...matches.slice(0, count).map((question, index) =>
      assessmentQuestion(question, `final-${type}-${index + 1}`)
    ));
  }
  selected.push(...practicalQuestions.map((question) => ({
    questionKey: question.questionKey,
    type: question.type,
    prompt: question.prompt,
    explanation: question.explanation,
    starterCode: question.starterCode,
    requirements: question.requirements,
    hints: question.hints,
    rubric: question.rubric,
    solutionCode: question.solutionCode,
  })));
  return selected;
}

function validateCourseData(courseData) {
  if (
    !courseData ||
    !courseData.slug ||
    !courseData.title ||
    !courseData.subtitle ||
    !courseData.description ||
    !Array.isArray(courseData.targetAudience) ||
    courseData.targetAudience.length === 0 ||
    !Array.isArray(courseData.modules)
  ) {
    throw new Error("Course metadata and module content are required");
  }
  if (courseData.modules.length !== REQUIRED_MODULES.length) {
    throw new Error(`The HTML5 path must include exactly ${REQUIRED_MODULES.length} modules`);
  }
  const moduleSlugs = new Set();
  const lessonSlugs = new Set();
  for (const [index, [slug, lessonCount]] of REQUIRED_MODULES.entries()) {
    const module = courseData.modules[index];
    if (module.slug !== slug || module.lessons.length !== lessonCount) {
      throw new Error(`Module ${index + 1} must be ${slug} with ${lessonCount} lessons`);
    }
    if (!module.title || !module.summary || module.objectives.length < 2) {
      throw new Error(`Module ${slug} is missing its title, summary, or objectives`);
    }
    if (moduleSlugs.has(module.slug)) throw new Error(`Duplicate module slug: ${module.slug}`);
    moduleSlugs.add(module.slug);
    for (const lesson of module.lessons) {
      if (lessonSlugs.has(lesson.slug)) throw new Error(`Duplicate lesson slug: ${lesson.slug}`);
      lessonSlugs.add(lesson.slug);
      if (
        !lesson.title ||
        !lesson.introduction ||
        lesson.objectives.length < 2 ||
        lesson.explanation.length < 2 ||
        lesson.explanation.join(" ").split(/\s+/).length < 70 ||
        lesson.terminology.length < 1 ||
        !lesson.syntax ||
        !lesson.codeExample?.code ||
        lesson.codeExample.lines.length < 1 ||
        !lesson.codeExample.output ||
        lesson.commonMistakes.length < 2 ||
        lesson.bestPractices.length < 2 ||
        !lesson.summary ||
        !lesson.exercise?.title ||
        !lesson.exercise.instructions ||
        !["beginner", "intermediate", "advanced"].includes(lesson.exercise.difficulty) ||
        !lesson.exercise.starterCode ||
        lesson.exercise.requirements.length < 1 ||
        lesson.exercise.hints.length < 2 ||
        !lesson.exercise.solutionCode ||
        lesson.quiz.length < 3 ||
        lesson.quiz.length > 5
      ) {
        throw new Error(`Lesson ${lesson.slug} is missing required teaching or exercise content`);
      }
      for (const question of lesson.quiz) {
        if (
          !["multiple-choice", "true-false", "code-output"].includes(question.type) ||
          question.choices.length < 2 ||
          !question.choices.some((choice) => choice.id === question.correctChoiceId) ||
          !question.explanation
        ) {
          throw new Error(`Lesson ${lesson.slug} has an incomplete quiz question`);
        }
      }
      if (module.slug === "practical-html-projects") {
        const project = lesson.project || lesson.exercise.project;
        if (
          !project ||
          project.learningObjectives?.length < 2 ||
          project.requirements?.length < 3 ||
          project.steps?.length < 4 ||
          !project.expectedOutput ||
          !project.solutionCode ||
          !project.solutionExplanation ||
          project.evaluationChecklist?.length < 3
        ) {
          throw new Error(`Project lesson ${lesson.slug} is missing a required project section`);
        }
      }
    }
  }
  const finalModule = courseData.modules[courseData.modules.length - 1];
  if (!finalModule.isFinalAssessmentModule) {
    throw new Error("The final module must be marked as the final-assessment module");
  }
  for (const module of courseData.modules.slice(0, -1)) questionsForModule(module);
  finalAssessmentQuestions(courseData.modules);
}

function createSummary() {
  return {
    succeeded: { paths: 0, modules: 0, lessons: 0, exercises: 0, quizzes: 0 },
    failed: [],
    skipped: [],
  };
}

async function upsertOwnedRecord(Model, seedKey, fields, summary, kind) {
  try {
    const document = await Model.findOneAndUpdate(
      { seedKey },
      { $set: { ...fields, seedKey } },
      { upsert: true, returnDocument: "after", runValidators: true, setDefaultsOnInsert: true }
    );
    summary.succeeded[kind] += 1;
    return document;
  } catch (error) {
    summary.failed.push({ kind, seedKey, message: error.message });
    return null;
  }
}

function skipRecord(summary, kind, seedKey, reason) {
  summary.skipped.push({ kind, seedKey, reason });
}

function skipModuleChildren(summary, moduleData, reason) {
  for (const lesson of moduleData.lessons) {
    skipRecord(summary, "lesson", stableKey("lesson", lesson.slug), reason);
    skipRecord(summary, "exercise", stableKey("exercise", lesson.slug), reason);
    skipRecord(summary, "lesson quiz", stableKey("lesson-quiz", lesson.slug), reason);
  }
  if (moduleData.lessons.length) {
    skipRecord(summary, "module quiz", stableKey("module-quiz", moduleData.slug), reason);
  }
}

async function seedHtml5Course({
  modelSet = models,
  courseData = course,
  logger = console,
} = {}) {
  const summary = createSummary();
  try {
    validateCourseData(courseData);
  } catch (error) {
    summary.failed.push({ kind: "course content validation", seedKey: stableKey("path", courseData?.slug || "missing"), message: error.message });
    logger.error("HTML5 seed stopped: course content validation failed.", summary);
    return summary;
  }

  const indexErrors = [];
  for (const [name, Model] of Object.entries(modelSet)) {
    try {
      await Model.createIndexes();
    } catch (error) {
      indexErrors.push({ kind: "index", seedKey: name, message: error.message });
    }
  }
  if (indexErrors.length) {
    summary.failed.push(...indexErrors);
    skipRecord(summary, "course", stableKey("path", courseData.slug), "Learning indexes could not be verified");
    for (const moduleData of courseData.modules) {
      skipRecord(summary, "module", stableKey("module", moduleData.slug), "Learning indexes could not be verified");
      skipModuleChildren(summary, moduleData, "Learning indexes could not be verified");
    }
    skipRecord(summary, "final quiz", stableKey("final-quiz", courseData.slug), "Learning indexes could not be verified");
    logger.error("HTML5 seed stopped: one or more learning indexes could not be verified.");
    return summary;
  }

  const path = await upsertOwnedRecord(
    modelSet.LearningPath,
    stableKey("path", courseData.slug),
    {
      title: courseData.title,
      slug: courseData.slug,
      subtitle: courseData.subtitle,
      description: courseData.description,
      language: courseData.language,
      targetAudience: courseData.targetAudience,
      status: "PUBLISHED",
      contentVersion: courseData.contentVersion,
    },
    summary,
    "paths"
  );
  if (!path) {
    for (const module of courseData.modules) {
      skipRecord(summary, "module", stableKey("module", module.slug), "The learning path could not be seeded");
      skipModuleChildren(summary, module, "The learning path could not be seeded");
    }
    skipRecord(summary, "final quiz", stableKey("final-quiz", courseData.slug), "The learning path could not be seeded");
    logger.error("HTML5 seed finished with failures.", summary);
    return summary;
  }

  const moduleDocuments = [];
  for (const [moduleIndex, moduleData] of courseData.modules.entries()) {
    const module = await upsertOwnedRecord(
      modelSet.LearningModule,
      stableKey("module", moduleData.slug),
      {
        path: path._id,
        title: moduleData.title,
        slug: moduleData.slug,
        order: moduleIndex + 1,
        summary: moduleData.summary,
        objectives: moduleData.objectives,
      },
      summary,
      "modules"
    );
    if (!module) {
      skipModuleChildren(summary, moduleData, "Module upsert failed");
      continue;
    }
    moduleDocuments.push({ data: moduleData, document: module });

    for (const [lessonIndex, lessonData] of moduleData.lessons.entries()) {
      const lesson = await upsertOwnedRecord(
        modelSet.LearningLesson,
        stableKey("lesson", lessonData.slug),
        {
          path: path._id,
          module: module._id,
          title: lessonData.title,
          slug: lessonData.slug,
          order: lessonIndex + 1,
          estimatedMinutes: lessonData.minutes,
          content: {
            introduction: lessonData.introduction,
            objectives: lessonData.objectives,
            explanation: lessonData.explanation,
            terminology: lessonData.terminology,
            syntax: lessonData.syntax,
            codeExample: lessonData.codeExample,
            commonMistakes: lessonData.commonMistakes,
            bestPractices: lessonData.bestPractices,
            summary: lessonData.summary,
          },
          ...(lessonData.project ? { project: lessonData.project } : {}),
        },
        summary,
        "lessons"
      );
      if (!lesson) {
        skipRecord(summary, "exercise", stableKey("exercise", lessonData.slug), "Lesson upsert failed");
        skipRecord(summary, "lesson quiz", stableKey("lesson-quiz", lessonData.slug), "Lesson upsert failed");
        continue;
      }

      const exerciseData = lessonData.exercise;
      const exercise = await upsertOwnedRecord(
        modelSet.LearningExercise,
        stableKey("exercise", lessonData.slug),
        {
          path: path._id,
          module: module._id,
          lesson: lesson._id,
          title: exerciseData.title,
          difficulty: exerciseData.difficulty,
          instructions: exerciseData.instructions,
          starterCode: exerciseData.starterCode,
          requirements: exerciseData.requirements,
          hints: exerciseData.hints,
          solutionCode: exerciseData.solutionCode,
          solutionExplanation: exerciseData.solutionExplanation,
          ...((exerciseData.project || lessonData.project)
            ? { project: exerciseData.project || lessonData.project }
            : {}),
        },
        summary,
        "exercises"
      );
      if (!exercise) {
        skipRecord(summary, "exercise relation", stableKey("exercise", lessonData.slug), "Exercise upsert failed");
      }

      const quiz = await upsertOwnedRecord(
        modelSet.LearningQuiz,
        stableKey("lesson-quiz", lessonData.slug),
        {
          path: path._id,
          module: module._id,
          lesson: lesson._id,
          scope: "lesson",
          title: `${lessonData.title} quiz`,
          contentVersion: courseData.contentVersion,
          questions: lessonData.quiz.map((question, index) =>
            assessmentQuestion(question, `${lessonData.slug}-q${index + 1}`)
          ),
        },
        summary,
        "quizzes"
      );
      if (!quiz) {
        skipRecord(summary, "lesson quiz relation", stableKey("lesson-quiz", lessonData.slug), "Lesson quiz upsert failed");
      }
    }
  }

  for (const { data: moduleData, document: module } of moduleDocuments) {
    if (!moduleData.lessons.length) continue;
    const seedKey = stableKey("module-quiz", moduleData.slug);
    let questions;
    try {
      questions = questionsForModule(moduleData);
    } catch (error) {
      summary.failed.push({ kind: "quiz content", seedKey, message: error.message });
      continue;
    }
    await upsertOwnedRecord(
      modelSet.LearningQuiz,
      seedKey,
      {
        path: path._id,
        module: module._id,
        lesson: null,
        scope: "module",
        title: `${moduleData.title} assessment`,
        contentVersion: courseData.contentVersion,
        questions,
      },
      summary,
      "quizzes"
    );
  }

  const finalModule = moduleDocuments.find(({ data }) => data.isFinalAssessmentModule);
  if (!finalModule) {
    summary.failed.push({
      kind: "final assessment",
      seedKey: stableKey("final-quiz", courseData.slug),
      message: "The course data must include the final-assessment module",
    });
  } else {
    try {
      const questions = finalAssessmentQuestions(courseData.modules);
      await upsertOwnedRecord(
        modelSet.LearningQuiz,
        stableKey("final-quiz", courseData.slug),
        {
          path: path._id,
          module: finalModule.document._id,
          lesson: null,
          scope: "final",
          title: "HTML5 complete course final assessment",
          passingScore: 70,
          contentVersion: courseData.contentVersion,
          questions,
        },
        summary,
        "quizzes"
      );
    } catch (error) {
      summary.failed.push({
        kind: "final assessment content",
        seedKey: stableKey("final-quiz", courseData.slug),
        message: error.message,
      });
    }
  }

  if (summary.failed.length) {
    logger.error("HTML5 seed finished with partial failures.", summary);
  } else {
    logger.info("HTML5 learning path seed completed.", summary);
  }
  return summary;
}

async function main() {
  if (!process.env.MONGODB_URI) {
    throw new Error("MONGODB_URI is missing from .env");
  }
  await mongoose.connect(process.env.MONGODB_URI, {
    dbName: process.env.MONGODB_DB_NAME || "olinecourse",
    serverSelectionTimeoutMS: 15000,
  });
  const summary = await seedHtml5Course();
  if (summary.failed.length) process.exitCode = 1;
}

if (require.main === module) {
  main()
    .catch((error) => {
      console.error(`HTML5 seed could not start: ${error.message}`);
      process.exitCode = 1;
    })
    .finally(async () => {
      if (mongoose.connection.readyState) await mongoose.disconnect();
    });
}

module.exports = {
  finalAssessmentQuestions,
  questionsForModule,
  seedHtml5Course,
  stableKey,
  validateCourseData,
};
