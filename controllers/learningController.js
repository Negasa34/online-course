const mongoose = require("mongoose");
const LearningExercise = require("../models/learningExercise");
const LearningExerciseAttempt = require("../models/learningExerciseAttempt");
const LearningLesson = require("../models/learningLesson");
const LearningLessonBookmark = require("../models/learningLessonBookmark");
const LearningLessonProgress = require("../models/learningLessonProgress");
const LearningModule = require("../models/learningModule");
const LearningPath = require("../models/learningPath");
const LearningPathProgress = require("../models/learningPathProgress");
const LearningQuiz = require("../models/learningQuiz");
const LearningQuizAttempt = require("../models/learningQuizAttempt");
const { checkHtmlRequirements, MAX_HTML_LENGTH } = require("../services/learningHtmlChecker");
const {
  completeLesson,
  recordLessonVisit,
  recomputePathCompletion,
  saveExerciseAttempt,
  saveQuizAttempt,
} = require("../services/learningProgressService");
const { getLearningPathAccess } = require("../services/learningPathAccess");

function respondError(res, error, message) {
  if (error.status) {
    return res.status(error.status).json({ success: false, message: error.message });
  }
  console.error(`${message}:`, error.message);
  return res.status(500).json({ success: false, message });
}

function publicDocument(document) {
  const data = document?.toObject ? document.toObject() : { ...document };
  delete data.seedKey;
  return data;
}

function publicExercise(exercise) {
  if (!exercise) return null;
  return {
    id: String(exercise._id),
    lesson: exercise.lesson,
    module: exercise.module,
    path: exercise.path,
    title: exercise.title,
    language: exercise.language || "html",
    difficulty: exercise.difficulty,
    instructions: exercise.instructions,
    starterCode: exercise.starterCode,
    selfChecks: exercise.selfChecks || [],
    hints: exercise.hints,
    ...(exercise.project ? {
      project: {
        description: exercise.project.description,
        learningObjectives: exercise.project.learningObjectives,
        requirements: exercise.project.requirements,
        steps: exercise.project.steps,
        expectedOutput: exercise.project.expectedOutput,
        evaluationChecklist: exercise.project.evaluationChecklist,
      },
    } : {}),
  };
}

function publicLesson(lesson) {
  const data = { ...lesson };
  delete data.seedKey;
  if (data.project) {
    const { solutionCode, solutionExplanation, ...project } = data.project;
    data.project = project;
  }
  return data;
}

function publicQuiz(quiz) {
  return {
    id: String(quiz._id),
    title: quiz.title,
    scope: quiz.scope,
    passingScore: quiz.passingScore,
    contentVersion: quiz.contentVersion,
    questions: quiz.questions.map((question) => ({
      questionKey: question.questionKey,
      type: question.type,
      prompt: question.prompt,
      choices: question.choices.map(({ id, text }) => ({ id, text })),
      ...(question.type === "practical" ? {
        starterCode: question.starterCode,
        hints: question.hints,
      } : {}),
      ...(question.type === "short-answer" ? { hints: question.hints } : {}),
    })),
  };
}

function validId(id) {
  return mongoose.isValidObjectId(id);
}

async function allowPathAccess(req, res, path) {
  const access = await getLearningPathAccess(path, req.user);
  if (access.allowed) return true;
  const authenticationRequired = access.requiresAuthentication;
  res.status(authenticationRequired ? 401 : 403).json({
    success: false,
    code: authenticationRequired ? "STUDENT_AUTHENTICATION_REQUIRED" : "LEARNING_PREREQUISITE_REQUIRED",
    message: authenticationRequired
      ? "Log in as a student to access this learning path."
      : "Complete the required Python Fundamentals path before opening this content.",
    data: {
      requiredPrerequisites: access.requiredSlugs,
      incompletePrerequisites: access.incompleteSlugs,
    },
  });
  return false;
}

function validateAnswers(body, quiz) {
  if (
    !body ||
    typeof body !== "object" ||
    Array.isArray(body) ||
    Object.keys(body).some((key) => key !== "answers") ||
    !Array.isArray(body.answers)
  ) {
    return "Answers must be provided as a list";
  }
  if (body.answers.length !== quiz.questions.length) {
    return "Submit one answer for every quiz question";
  }
  const questionKeys = new Set(quiz.questions.map((question) => question.questionKey));
  const received = new Set();
  for (const answer of body.answers) {
    if (
      !answer ||
      typeof answer !== "object" ||
      Array.isArray(answer) ||
      Object.keys(answer).some((key) => !["questionKey", "choiceId", "response"].includes(key)) ||
      typeof answer.questionKey !== "string" ||
      !questionKeys.has(answer.questionKey) ||
      received.has(answer.questionKey)
    ) {
      return "Each answer must identify one valid question exactly once";
    }
    received.add(answer.questionKey);
    const question = quiz.questions.find((item) => item.questionKey === answer.questionKey);
    if (["practical", "short-answer"].includes(question.type)) {
      if (Object.keys(answer).some((key) => !["questionKey", "response"].includes(key))) {
        return "Review answers must contain only a question key and response";
      }
      if (typeof answer.response !== "string" || !answer.response.trim()) {
        return "Review questions require a non-empty response";
      }
      if (Buffer.byteLength(answer.response, "utf8") > 12000) {
        return "Practical responses must be 12000 bytes or fewer";
      }
    } else {
      if (Object.keys(answer).some((key) => !["questionKey", "choiceId"].includes(key))) {
        return "Choice answers must contain only a question key and selected choice";
      }
      if (typeof answer.choiceId !== "string" || !question.choices.some((choice) => choice.id === answer.choiceId)) {
        return "Select one of the available answer choices for each question";
      }
    }
  }
  return "";
}

async function findPublishedPathBySlug(slug) {
  return LearningPath.findOne({ slug, status: "PUBLISHED" });
}

async function listPaths(req, res) {
  try {
    const paths = await LearningPath.find({ status: "PUBLISHED" })
      .select("-seedKey")
      .sort({ title: 1 })
      .lean();
    const pathIds = paths.map((path) => path._id);
    const [moduleCounts, lessonCounts] = await Promise.all([
      LearningModule.aggregate([
        { $match: { path: { $in: pathIds } } },
        { $group: { _id: "$path", count: { $sum: 1 } } },
      ]),
      LearningLesson.aggregate([
        { $match: { path: { $in: pathIds } } },
        { $group: { _id: "$path", count: { $sum: 1 } } },
      ]),
    ]);
    const countMap = (rows) => new Map(rows.map((row) => [String(row._id), row.count]));
    const modulesByPath = countMap(moduleCounts);
    const lessonsByPath = countMap(lessonCounts);
    return res.status(200).json({
      success: true,
      data: await Promise.all(paths.map(async (path) => ({
        ...path,
        moduleCount: modulesByPath.get(String(path._id)) || 0,
        lessonCount: lessonsByPath.get(String(path._id)) || 0,
        access: await getLearningPathAccess(path, req.user),
      }))),
    });
  } catch (error) {
    return respondError(res, error, "Could not fetch learning paths");
  }
}

async function getPath(req, res) {
  try {
    const path = await findPublishedPathBySlug(req.params.pathSlug);
    if (!path) return res.status(404).json({ success: false, message: "Learning path not found" });
    const [modules, lessonCount] = await Promise.all([
      LearningModule.find({ path: path._id }).select("-seedKey").sort({ order: 1 }).lean(),
      LearningLesson.countDocuments({ path: path._id }),
    ]);
    return res.status(200).json({
      success: true,
      data: {
        path: publicDocument(path),
        access: await getLearningPathAccess(path, req.user),
        moduleCount: modules.length,
        lessonCount,
        modules,
      },
    });
  } catch (error) {
    return respondError(res, error, "Could not fetch learning path");
  }
}

async function listModules(req, res) {
  try {
    const path = await findPublishedPathBySlug(req.params.pathSlug);
    if (!path) return res.status(404).json({ success: false, message: "Learning path not found" });
    const modules = await LearningModule.find({ path: path._id })
      .select("-seedKey")
      .sort({ order: 1 })
      .lean();
    const moduleIds = modules.map((module) => module._id);
    const lessons = await LearningLesson.find({ module: { $in: moduleIds } })
      .select("_id module path title slug order estimatedMinutes")
      .sort({ module: 1, order: 1 })
      .lean();
    const lessonsByModule = new Map();
    for (const lesson of lessons) {
      const key = String(lesson.module);
      if (!lessonsByModule.has(key)) lessonsByModule.set(key, []);
      lessonsByModule.get(key).push(lesson);
    }
    return res.status(200).json({
      success: true,
      data: modules.map((module) => ({
        ...module,
        lessonCount: (lessonsByModule.get(String(module._id)) || []).length,
        lessons: lessonsByModule.get(String(module._id)) || [],
      })),
    });
  } catch (error) {
    return respondError(res, error, "Could not fetch learning modules");
  }
}

async function getModule(req, res) {
  const { moduleId } = req.params;
  if (!validId(moduleId)) return res.status(400).json({ success: false, message: "Invalid module ID" });
  try {
    const module = await LearningModule.findById(moduleId).select("-seedKey").lean();
    if (!module) return res.status(404).json({ success: false, message: "Learning module not found" });
    const path = await LearningPath.findOne({ _id: module.path, status: "PUBLISHED" })
      .select("_id slug title prerequisiteSlugs")
      .lean();
    if (!path) return res.status(404).json({ success: false, message: "Learning module not found" });
    if (!(await allowPathAccess(req, res, path))) return;
    const lessons = await LearningLesson.find({ module: module._id })
      .select("_id module path title slug order estimatedMinutes content.introduction content.objectives")
      .sort({ order: 1 })
      .lean();
    return res.status(200).json({ success: true, data: { module, path, lessons } });
  } catch (error) {
    return respondError(res, error, "Could not fetch learning module");
  }
}

async function listModuleLessons(req, res) {
  const { moduleId } = req.params;
  if (!validId(moduleId)) return res.status(400).json({ success: false, message: "Invalid module ID" });
  try {
    const module = await LearningModule.findById(moduleId).select("_id path");
    const path = module && await LearningPath.findOne({ _id: module.path, status: "PUBLISHED" })
      .select("_id slug prerequisiteSlugs")
      .lean();
    if (!module || !path) {
      return res.status(404).json({ success: false, message: "Learning module not found" });
    }
    if (!(await allowPathAccess(req, res, path))) return;
    const lessons = await LearningLesson.find({ module: module._id })
      .select("_id module path title slug order estimatedMinutes content.introduction content.objectives")
      .sort({ order: 1 })
      .lean();
    return res.status(200).json({ success: true, data: lessons });
  } catch (error) {
    return respondError(res, error, "Could not fetch module lessons");
  }
}

async function getLesson(req, res) {
  const { lessonId } = req.params;
  if (!validId(lessonId)) return res.status(400).json({ success: false, message: "Invalid lesson ID" });
  try {
    const lesson = await LearningLesson.findById(lessonId).lean();
    const path = lesson && await LearningPath.findOne({ _id: lesson.path, status: "PUBLISHED" })
      .select("_id slug title prerequisiteSlugs")
      .lean();
    if (!lesson || !path) {
      return res.status(404).json({ success: false, message: "Learning lesson not found" });
    }
    if (!(await allowPathAccess(req, res, path))) return;
    const [module, exercise] = await Promise.all([
      LearningModule.findById(lesson.module).select("_id path title slug order").lean(),
      LearningExercise.findOne({ lesson: lesson._id }).lean(),
    ]);
    return res.status(200).json({ success: true, data: { ...publicLesson(lesson), module, path, exercise: publicExercise(exercise) } });
  } catch (error) {
    return respondError(res, error, "Could not fetch learning lesson");
  }
}

async function listExercises(req, res) {
  const { lessonId } = req.params;
  if (!validId(lessonId)) return res.status(400).json({ success: false, message: "Invalid lesson ID" });
  try {
    const lesson = await LearningLesson.findById(lessonId).select("_id path");
    const path = lesson && await LearningPath.findOne({ _id: lesson.path, status: "PUBLISHED" })
      .select("_id slug prerequisiteSlugs")
      .lean();
    if (!lesson || !path) {
      return res.status(404).json({ success: false, message: "Learning lesson not found" });
    }
    if (!(await allowPathAccess(req, res, path))) return;
    const exercises = await LearningExercise.find({ lesson: lessonId }).lean();
    return res.status(200).json({ success: true, data: exercises.map(publicExercise) });
  } catch (error) {
    return respondError(res, error, "Could not fetch learning exercises");
  }
}

async function submitExercise(req, res) {
  const { exerciseId } = req.params;
  if (!validId(exerciseId)) return res.status(400).json({ success: false, message: "Invalid exercise ID" });
  if (!req.body || typeof req.body !== "object" || Array.isArray(req.body) ||
    Object.keys(req.body).some((key) => key !== "html") || typeof req.body.html !== "string") {
    return res.status(400).json({ success: false, message: "Submit HTML in the html field" });
  }
  try {
    const exercise = await LearningExercise.findById(exerciseId);
    const path = exercise && await LearningPath.findOne({ _id: exercise.path, status: "PUBLISHED" })
      .select("_id slug prerequisiteSlugs")
      .lean();
    if (!exercise || !path) {
      return res.status(404).json({ success: false, message: "Learning exercise not found" });
    }
    if (!(await allowPathAccess(req, res, path))) return;
    if (exercise.language === "python") {
      return res.status(400).json({ success: false, message: "Python practice is completed locally and is not submitted to LearnHub." });
    }
    const result = checkHtmlRequirements(req.body.html, exercise.requirements);
    const attempt = await saveExerciseAttempt(req.user.id, exercise, result);
    await recomputePathCompletion(req.user.id, exercise.path);
    return res.status(200).json({
      success: true,
      message: result.passed ? "All exercise requirements passed" : "Some requirements are not met yet",
      data: {
        passed: result.passed,
        results: result.results,
        attemptId: attempt._id,
      },
    });
  } catch (error) {
    return respondError(res, error, "Could not check the exercise");
  }
}

async function getExerciseReferenceSolution(req, res) {
  const { exerciseId } = req.params;
  if (!validId(exerciseId)) return res.status(400).json({ success: false, message: "Invalid exercise ID" });
  if (
    !req.body ||
    typeof req.body !== "object" ||
    Array.isArray(req.body) ||
    Object.keys(req.body).length !== 1 ||
    req.body.confirmSelfCheck !== true
  ) {
    return res.status(400).json({ success: false, message: "Confirm that you attempted the local self-check first" });
  }
  try {
    const exercise = await LearningExercise.findById(exerciseId);
    if (!exercise || exercise.language !== "python") {
      return res.status(404).json({ success: false, message: "Python reference solution not found" });
    }
    const path = await LearningPath.findOne({ _id: exercise.path, status: "PUBLISHED" })
      .select("_id slug prerequisiteSlugs")
      .lean();
    if (!path) return res.status(404).json({ success: false, message: "Learning exercise not found" });
    if (!(await allowPathAccess(req, res, path))) return;
    const lesson = await LearningLesson.findById(exercise.lesson)
      .select("project.solutionCode project.solutionExplanation")
      .lean();
    return res.status(200).json({
      success: true,
      data: {
        solutionCode: lesson?.project?.solutionCode || exercise.solutionCode,
        solutionExplanation: lesson?.project?.solutionExplanation || exercise.solutionExplanation,
      },
    });
  } catch (error) {
    return respondError(res, error, "Could not fetch the reference solution");
  }
}

async function getQuizByFilter(req, res, filter, missingMessage) {
  try {
    const quiz = await LearningQuiz.findOne(filter).lean();
    const path = quiz && await LearningPath.findOne({ _id: quiz.path, status: "PUBLISHED" })
      .select("_id slug prerequisiteSlugs")
      .lean();
    if (!quiz || !path) {
      return res.status(404).json({ success: false, message: missingMessage });
    }
    if (!(await allowPathAccess(req, res, path))) return;
    return res.status(200).json({ success: true, data: publicQuiz(quiz) });
  } catch (error) {
    return respondError(res, error, "Could not fetch the quiz");
  }
}

async function getLessonQuiz(req, res) {
  if (!validId(req.params.lessonId)) return res.status(400).json({ success: false, message: "Invalid lesson ID" });
  return getQuizByFilter(req, res, { lesson: req.params.lessonId, scope: "lesson" }, "Lesson quiz not found");
}

async function getQuiz(req, res) {
  if (!validId(req.params.quizId)) return res.status(400).json({ success: false, message: "Invalid quiz ID" });
  return getQuizByFilter(req, res, { _id: req.params.quizId }, "Quiz not found");
}

async function getModuleAssessment(req, res) {
  if (!validId(req.params.moduleId)) return res.status(400).json({ success: false, message: "Invalid module ID" });
  return getQuizByFilter(req, res, { module: req.params.moduleId, scope: "module" }, "Module assessment not found");
}

async function getFinalAssessment(req, res) {
  try {
    const path = await findPublishedPathBySlug(req.params.pathSlug);
    if (!path) return res.status(404).json({ success: false, message: "Learning path not found" });
    return getQuizByFilter(req, res, { path: path._id, scope: "final" }, "Final assessment not found");
  } catch (error) {
    return respondError(res, error, "Could not fetch final assessment");
  }
}

async function submitQuiz(req, res) {
  const { quizId } = req.params;
  if (!validId(quizId)) return res.status(400).json({ success: false, message: "Invalid quiz ID" });
  try {
    const quiz = await LearningQuiz.findById(quizId);
    const path = quiz && await LearningPath.findOne({ _id: quiz.path, status: "PUBLISHED" })
      .select("_id slug prerequisiteSlugs")
      .lean();
    if (!quiz || !path) {
      return res.status(404).json({ success: false, message: "Quiz not found" });
    }
    if (!(await allowPathAccess(req, res, path))) return;
    const validationMessage = validateAnswers(req.body, quiz);
    if (validationMessage) return res.status(400).json({ success: false, message: validationMessage });

    const answerByKey = new Map(req.body.answers.map((answer) => [answer.questionKey, answer]));
    const objectiveQuestions = quiz.questions.filter((question) => !["practical", "short-answer"].includes(question.type));
    let correctCount = 0;
    const answers = quiz.questions.map((question) => {
      const submitted = answerByKey.get(question.questionKey);
      if (["practical", "short-answer"].includes(question.type)) {
        return {
          questionKey: question.questionKey,
          response: submitted.response,
          correct: false,
        };
      }
      const correct = submitted.choiceId === question.correctChoiceId;
      if (correct) correctCount += 1;
      return { questionKey: question.questionKey, choiceId: submitted.choiceId, correct };
    });
    const questionCount = objectiveQuestions.length;
    const score = questionCount ? Math.round((correctCount / questionCount) * 100) : 0;
    const passed = score >= quiz.passingScore;
    const attempt = await saveQuizAttempt(req.user.id, quiz, {
      score,
      correctCount,
      questionCount,
      passed,
      answers,
    });
    await recomputePathCompletion(req.user.id, quiz.path);
    return res.status(200).json({
      success: true,
      message: passed ? "Assessment passed" : "Assessment submitted",
      data: {
        attemptId: attempt._id,
        score,
        correctCount,
        questionCount,
        passed,
        answers: quiz.questions.map((question) => {
          const submitted = answerByKey.get(question.questionKey);
          const saved = answers.find((answer) => answer.questionKey === question.questionKey);
          return {
            questionKey: question.questionKey,
            ...(["practical", "short-answer"].includes(question.type) ? { submitted: Boolean(submitted.response.trim()) } : {
              correct: saved.correct,
              correctChoiceId: question.correctChoiceId,
              selectedChoiceId: submitted.choiceId,
            }),
            explanation: question.explanation,
          };
        }),
        practicalQuestionCount: quiz.questions.filter((question) => question.type === "practical").length,
        shortAnswerQuestionCount: quiz.questions.filter((question) => question.type === "short-answer").length,
        practicalReview: quiz.questions.some((question) => ["practical", "short-answer"].includes(question.type))
          ? "Short-answer and practical responses are saved for learner review and are not included in the automatically scored percentage."
          : null,
      },
    });
  } catch (error) {
    return respondError(res, error, "Could not submit the quiz");
  }
}

async function getMyProgress(req, res) {
  try {
    const paths = await LearningPath.find({ status: "PUBLISHED" }).select("-seedKey").sort({ title: 1 }).lean();
    const data = await Promise.all(paths.map(async (path) => {
      const [modules, lessons, completedLessons, pathProgress, quizAttempts, exerciseAttempts, bookmarks] = await Promise.all([
        LearningModule.find({ path: path._id }).select("_id title slug order").sort({ order: 1 }).lean(),
        LearningLesson.find({ path: path._id }).select("_id module title slug order").sort({ order: 1 }).lean(),
        LearningLessonProgress.find({ user: req.user.id, path: path._id, completed: true }).select("lesson completedAt").lean(),
        LearningPathProgress.findOne({ user: req.user.id, path: path._id }).select("lastVisitedLesson completedAt").lean(),
        LearningQuizAttempt.find({ user: req.user.id, path: path._id }).populate("quiz", "title").sort({ submittedAt: -1 }).lean(),
        LearningExerciseAttempt.find({ user: req.user.id, path: path._id }).populate("exercise", "title").sort({ submittedAt: -1 }).lean(),
        LearningLessonBookmark.find({ user: req.user.id, path: path._id }).select("lesson").lean(),
      ]);
      const completedSet = new Set(completedLessons.map((item) => String(item.lesson)));
      const bookmarkedSet = new Set(bookmarks.map((item) => String(item.lesson)));
      const passedQuizSet = new Set(quizAttempts.filter((attempt) => attempt.passed).map((attempt) => String(attempt.quiz?._id)));
      const moduleProgress = await Promise.all(modules.map(async (module) => {
        const moduleLessons = lessons.filter((lesson) => String(lesson.module) === String(module._id));
        const moduleQuiz = await LearningQuiz.findOne({ module: module._id, scope: "module" }).select("_id").lean();
        const completedCount = moduleLessons.filter((lesson) => completedSet.has(String(lesson._id))).length;
        return {
          id: module._id,
          title: module.title,
          slug: module.slug,
          order: module.order,
          totalLessons: moduleLessons.length,
          completedLessons: completedCount,
          completed: moduleLessons.length > 0 && completedCount === moduleLessons.length &&
            Boolean(moduleQuiz && passedQuizSet.has(String(moduleQuiz._id))),
        };
      }));
      const finalQuiz = await LearningQuiz.findOne({ path: path._id, scope: "final" }).select("_id").lean();
      const totalLessons = lessons.length;
      const completedCount = completedSet.size;
      return {
        path: { id: path._id, title: path.title, slug: path.slug },
        completedLessons: completedCount,
        totalLessons,
        percentage: totalLessons ? Math.round((completedCount / totalLessons) * 100) : 0,
        completedModules: moduleProgress.filter((module) => module.completed).length,
        totalModules: modules.filter((module) => lessons.some((lesson) => String(lesson.module) === String(module._id))).length,
        modules: moduleProgress,
        completedLessonIds: [...completedSet],
        bookmarkedLessonIds: [...bookmarkedSet],
        lastVisitedLesson: pathProgress?.lastVisitedLesson || null,
        completedAt: pathProgress?.completedAt || null,
        finalAssessmentPassed: Boolean(finalQuiz && passedQuizSet.has(String(finalQuiz._id))),
        quizAttempts: quizAttempts.map((attempt) => ({
          id: attempt._id,
          title: attempt.quiz?.title || "Learning assessment",
          scope: attempt.scope,
          score: attempt.score,
          passed: attempt.passed,
          submittedAt: attempt.submittedAt,
        })),
        exerciseAttempts: exerciseAttempts.map((attempt) => ({
          id: attempt._id,
          title: attempt.exercise?.title || "Learning exercise",
          passed: attempt.passed,
          submittedAt: attempt.submittedAt,
        })),
      };
    }));
    return res.status(200).json({ success: true, data });
  } catch (error) {
    return respondError(res, error, "Could not fetch learning progress");
  }
}

async function markLessonVisited(req, res) {
  const { lessonId } = req.params;
  if (!validId(lessonId)) return res.status(400).json({ success: false, message: "Invalid lesson ID" });
  try {
    const lesson = await LearningLesson.findById(lessonId).select("_id path module");
    const path = lesson && await LearningPath.findOne({ _id: lesson.path, status: "PUBLISHED" })
      .select("_id slug prerequisiteSlugs")
      .lean();
    if (!lesson || !path) {
      return res.status(404).json({ success: false, message: "Learning lesson not found" });
    }
    if (!(await allowPathAccess(req, res, path))) return;
    await recordLessonVisit(req.user.id, lesson);
    return res.status(200).json({ success: true, message: "Learning position updated" });
  } catch (error) {
    return respondError(res, error, "Could not update learning position");
  }
}

async function markLessonCompleted(req, res) {
  const { lessonId } = req.params;
  if (!validId(lessonId)) return res.status(400).json({ success: false, message: "Invalid lesson ID" });
  if (!req.body || typeof req.body !== "object" || Array.isArray(req.body) || Object.keys(req.body).length) {
    return res.status(400).json({ success: false, message: "Lesson completion does not accept request fields" });
  }
  try {
    const lesson = await LearningLesson.findById(lessonId).select("_id path module title slug");
    const path = lesson && await LearningPath.findOne({ _id: lesson.path, status: "PUBLISHED" })
      .select("_id slug prerequisiteSlugs")
      .lean();
    if (!lesson || !path) {
      return res.status(404).json({ success: false, message: "Learning lesson not found" });
    }
    if (!(await allowPathAccess(req, res, path))) return;
    await completeLesson(req.user.id, lesson);
    const [progress, completedLessons, totalLessons] = await Promise.all([
      LearningLessonProgress.findOne({ user: req.user.id, lesson: lesson._id }).select("completed completedAt lastViewedAt").lean(),
      LearningLessonProgress.countDocuments({ user: req.user.id, path: lesson.path, completed: true }),
      LearningLesson.countDocuments({ path: lesson.path }),
    ]);
    return res.status(200).json({
      success: true,
      message: "Lesson marked complete",
      data: {
        lessonId,
        completed: progress.completed,
        completedAt: progress.completedAt,
        completedLessons,
        totalLessons,
        percentage: totalLessons ? Math.round((completedLessons / totalLessons) * 100) : 0,
      },
    });
  } catch (error) {
    return respondError(res, error, "Could not mark lesson complete");
  }
}

async function setLessonBookmark(req, res) {
  const { lessonId } = req.params;
  if (!validId(lessonId)) return res.status(400).json({ success: false, message: "Invalid lesson ID" });
  if (
    !req.body ||
    typeof req.body !== "object" ||
    Array.isArray(req.body) ||
    Object.keys(req.body).length !== 1 ||
    typeof req.body.bookmarked !== "boolean"
  ) {
    return res.status(400).json({ success: false, message: "Set bookmarked to true or false" });
  }
  try {
    const lesson = await LearningLesson.findById(lessonId).select("_id path");
    const path = lesson && await LearningPath.findOne({ _id: lesson.path, status: "PUBLISHED" })
      .select("_id slug prerequisiteSlugs")
      .lean();
    if (!lesson || !path) {
      return res.status(404).json({ success: false, message: "Learning lesson not found" });
    }
    if (!(await allowPathAccess(req, res, path))) return;
    if (req.body.bookmarked) {
      try {
        await LearningLessonBookmark.findOneAndUpdate(
          { user: req.user.id, lesson: lesson._id },
          { $setOnInsert: { user: req.user.id, path: lesson.path, lesson: lesson._id } },
          { upsert: true, returnDocument: "after", runValidators: true, setDefaultsOnInsert: true }
        );
      } catch (error) {
        if (error.code !== 11000) throw error;
        await LearningLessonBookmark.updateOne(
          { user: req.user.id, lesson: lesson._id },
          { $set: { path: lesson.path } },
          { runValidators: true }
        );
      }
    } else {
      await LearningLessonBookmark.deleteOne({ user: req.user.id, lesson: lesson._id });
    }
    return res.status(200).json({
      success: true,
      message: req.body.bookmarked ? "Lesson saved to bookmarks" : "Lesson removed from bookmarks",
      data: { lessonId, bookmarked: req.body.bookmarked },
    });
  } catch (error) {
    return respondError(res, error, "Could not update lesson bookmark");
  }
}

async function getMyBookmarks(req, res) {
  try {
    const bookmarks = await LearningLessonBookmark.find({ user: req.user.id })
      .sort({ updatedAt: -1 })
      .lean();
    const lessonIds = bookmarks.map((bookmark) => bookmark.lesson);
    const lessons = await LearningLesson.find({ _id: { $in: lessonIds } })
      .select("_id path module title slug order estimatedMinutes")
      .lean();
    const modules = await LearningModule.find({
      _id: { $in: lessons.map((lesson) => lesson.module) },
    }).select("_id path title").lean();
    const paths = await LearningPath.find({
      _id: { $in: bookmarks.map((bookmark) => bookmark.path) },
      status: "PUBLISHED",
    }).select("_id title slug").lean();
    const lessonById = new Map(lessons.map((lesson) => [String(lesson._id), lesson]));
    const moduleById = new Map(modules.map((module) => [String(module._id), module]));
    const pathById = new Map(paths.map((path) => [String(path._id), path]));
    return res.status(200).json({
      success: true,
      data: bookmarks.flatMap((bookmark) => {
        const lesson = lessonById.get(String(bookmark.lesson));
        const module = lesson && moduleById.get(String(lesson.module));
        const path = pathById.get(String(bookmark.path));
        return lesson && module && path ? [{ lesson, module, path, bookmarkedAt: bookmark.createdAt }] : [];
      }),
    });
  } catch (error) {
    return respondError(res, error, "Could not fetch bookmarks");
  }
}

async function getFinalProjects(req, res) {
  try {
    const path = await findPublishedPathBySlug(req.params.pathSlug);
    if (!path) return res.status(404).json({ success: false, message: "Learning path not found" });
    if (!(await allowPathAccess(req, res, path))) return;
    const module = await LearningModule.findOne({
      path: path._id,
      slug: path.finalProjectModuleSlug || "practical-html-projects",
    }).select("_id title");
    if (!module) return res.status(404).json({ success: false, message: "Final projects are not available" });
    const lessons = await LearningLesson.find({ module: module._id })
      .select("_id module path title slug order estimatedMinutes project.description project.learningObjectives project.requirements project.steps project.expectedOutput project.evaluationChecklist")
      .sort({ order: 1 })
      .lean();
    const exercises = await LearningExercise.find({ module: module._id }).lean();
    const exerciseByLesson = new Map(exercises.map((exercise) => [String(exercise.lesson), exercise]));
    const attempts = req.user
      ? await LearningExerciseAttempt.find({
        user: req.user.id,
        module: module._id,
        exercise: { $in: exercises.map((exercise) => exercise._id) },
      }).select("exercise passed submittedAt").sort({ submittedAt: -1 }).lean()
      : [];
    const latestAttempt = new Map();
    for (const attempt of attempts) {
      if (!latestAttempt.has(String(attempt.exercise))) latestAttempt.set(String(attempt.exercise), attempt);
    }
    return res.status(200).json({
      success: true,
      data: {
        module: publicDocument(module),
        projects: lessons.map((lesson) => {
          const exercise = exerciseByLesson.get(String(lesson._id));
          const attempt = exercise ? latestAttempt.get(String(exercise._id)) : null;
          return {
            lesson: publicLesson(lesson),
            exercise: publicExercise(exercise),
            submission: attempt ? {
              submitted: true,
              passed: attempt.passed,
              submittedAt: attempt.submittedAt,
            } : { submitted: false, passed: false, submittedAt: null },
          };
        }),
      },
    });
  } catch (error) {
    return respondError(res, error, "Could not fetch final projects");
  }
}

module.exports = {
  getFinalAssessment,
  getFinalProjects,
  getExerciseReferenceSolution,
  getLesson,
  getLessonQuiz,
  getMyBookmarks,
  getModule,
  getModuleAssessment,
  getMyProgress,
  getPath,
  getQuiz,
  listExercises,
  listModuleLessons,
  listModules,
  listPaths,
  markLessonCompleted,
  markLessonVisited,
  submitExercise,
  submitQuiz,
  setLessonBookmark,
};
