const assert = require("node:assert/strict");
const jwt = require("jsonwebtoken");
const { after, before, test } = require("node:test");

process.env.JWT_SECRET = "learning-api-test-secret-with-at-least-32-characters";
process.env.CORS_ORIGINS = "http://localhost:5173";

const { app } = require("../server");
const { recomputePathCompletion } = require("../services/learningProgressService");
const User = require("../models/user");
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
const lessonId = "000000000000000000000005";
const moduleId = "000000000000000000000006";
const exerciseId = "000000000000000000000007";

const pathId = "000000000000000000000001";
const quizId = "000000000000000000000002";
const student = { _id: "000000000000000000000003", role: "STUDENT", name: "Student", email: "student@example.test" };
const instructor = { _id: "000000000000000000000004", role: "INSTRUCTOR", name: "Instructor", email: "instructor@example.test", instructorApprovedAt: new Date() };
const otherStudent = { _id: "000000000000000000000008", role: "STUDENT", name: "Other Student", email: "other@example.test" };
const rateLimitStudent = { _id: "000000000000000000000009", role: "STUDENT", name: "Rate Limit Student", email: "rate-limit@example.test" };
const quiz = {
  _id: quizId,
  path: pathId,
  scope: "lesson",
  title: "Test quiz",
  passingScore: 60,
  contentVersion: 1,
  questions: [
    { questionKey: "one", type: "multiple-choice", prompt: "Choose one.", choices: [{ id: "a", text: "A" }, { id: "b", text: "B" }], correctChoiceId: "a", explanation: "A is correct.", solutionCode: "secret" },
    { questionKey: "two", type: "true-false", prompt: "Choose two.", choices: [{ id: "yes", text: "Yes" }, { id: "no", text: "No" }], correctChoiceId: "no", explanation: "No is correct." },
    { questionKey: "three", type: "code-output", prompt: "Choose three.", choices: [{ id: "x", text: "X" }, { id: "y", text: "Y" }], correctChoiceId: "x", explanation: "X is correct." },
    { questionKey: "four", type: "short-answer", prompt: "Explain the idea.", choices: [], requirements: ["Use your own words."], rubric: ["Explains the idea."], hints: ["Recall the lesson."], explanation: "A clear answer identifies the concept.", solutionCode: "private answer" },
  ],
};

let server;
let baseUrl;
let lastSavedAttempt;
let lastSavedExerciseAttempt;
let progressUserFilters = [];
let sampleLesson;
let sampleExercise;
let sampleModule;
let completedProgress;
let lessonProgressUpdate;
const savedBookmarks = new Map();

function query(value) {
  return {
    select() { return this; },
    sort() { return this; },
    populate() { return this; },
    lean() { return Promise.resolve(value); },
    then(resolve, reject) { return Promise.resolve(value).then(resolve, reject); },
  };
}

function tokenFor(user) {
  return jwt.sign({ userId: user._id }, process.env.JWT_SECRET, { expiresIn: "1h" });
}

async function request(path, { user, body, method = "GET" } = {}) {
  const response = await fetch(`${baseUrl}${path}`, {
    method,
    headers: {
      ...(body !== undefined ? { "Content-Type": "application/json" } : {}),
      ...(user ? { Authorization: `Bearer ${tokenFor(user)}` } : {}),
    },
    ...(body !== undefined ? { body: JSON.stringify(body) } : {}),
  });
  return { response, body: await response.json() };
}

before(async () => {
  User.findById = (id) => {
    const user = [student, instructor, otherStudent, rateLimitStudent].find((item) => item._id === String(id)) || null;
    const result = Promise.resolve(user);
    result.select = () => result;
    return result;
  };
  LearningPath.exists = async () => ({ _id: pathId });
  LearningPath.findOne = () => query({ _id: pathId, slug: "html5", title: "HTML" });
  LearningQuiz.findOne = (filter) => query(filter?._id ? quiz : null);
  LearningQuiz.findById = async () => quiz;
  LearningQuiz.find = () => query([]);
  LearningQuizAttempt.create = async (attempt) => {
    lastSavedAttempt = attempt;
    return { _id: quizId, ...attempt };
  };
  LearningModule.find = () => query([]);
  LearningModule.findById = () => query(sampleModule);
  LearningLesson.find = () => query([]);
  LearningLesson.findById = () => query(sampleLesson);
  LearningLesson.countDocuments = async () => 2;
  LearningLessonProgress.findOneAndUpdate = async (filter, update) => {
    lessonProgressUpdate = { filter, update };
    return {};
  };
  LearningLessonProgress.findOne = () => query(completedProgress || null);
  LearningLessonBookmark.find = (filter = {}) => query(
    [...savedBookmarks.values()].filter((bookmark) =>
      (!filter.user || String(bookmark.user) === String(filter.user)) &&
      (!filter.path || String(bookmark.path) === String(filter.path))
    )
  );
  LearningLessonBookmark.findOneAndUpdate = async (filter, update) => {
    const key = `${filter.user}:${filter.lesson}`;
    if (!savedBookmarks.has(key)) savedBookmarks.set(key, { ...update.$setOnInsert, createdAt: new Date() });
    return savedBookmarks.get(key);
  };
  LearningLessonBookmark.updateOne = async (filter, update) => {
    const key = `${filter.user}:${filter.lesson}`;
    if (savedBookmarks.has(key)) Object.assign(savedBookmarks.get(key), update.$set);
    return { modifiedCount: 1 };
  };
  LearningLessonBookmark.deleteOne = async (filter) => {
    const key = `${filter.user}:${filter.lesson}`;
    const deleted = savedBookmarks.delete(key);
    return { deletedCount: Number(deleted) };
  };
  LearningExercise.find = () => query([]);
  LearningExercise.findById = () => query(sampleExercise);
  LearningExercise.findOne = () => query(sampleExercise);
  LearningExerciseAttempt.create = async (attempt) => {
    lastSavedExerciseAttempt = attempt;
    return { _id: exerciseId, ...attempt };
  };
  LearningLessonProgress.countDocuments = async () => 0;
  LearningPathProgress.findOneAndUpdate = async () => ({});

  LearningPath.find = () => query([{ _id: pathId, title: "HTML", slug: "html5" }]);
  LearningPathProgress.findOne = () => query(null);
  LearningLessonProgress.find = (filter) => {
    progressUserFilters.push(filter.user);
    return query(completedProgress ? [completedProgress] : []);
  };
  LearningQuizAttempt.find = () => query([]);
  LearningExerciseAttempt.find = () => query([]);
  LearningQuiz.findOne = (filter) => query(filter?._id ? quiz : null);
  LearningQuizAttempt.distinct = async () => [];
  LearningExerciseAttempt.distinct = async () => [];

  await new Promise((resolve) => {
    server = app.listen(0, "127.0.0.1", resolve);
  });
  baseUrl = `http://127.0.0.1:${server.address().port}`;
});

after(async () => {
  if (server) {
    await new Promise((resolve, reject) => {
      server.close((error) => error ? reject(error) : resolve());
    });
  }
});

test("learning writes require a student identity and role", async () => {
  const anonymous = await request(`/api/learning/quizzes/${quizId}/submit`, { method: "POST", body: { answers: [] } });
  assert.equal(anonymous.response.status, 401);

  const nonStudent = await request(`/api/learning/quizzes/${quizId}/submit`, {
    user: instructor,
    method: "POST",
    body: { answers: [] },
  });
  assert.equal(nonStudent.response.status, 403);
  const anonymousProgress = await request("/api/learning/progress/me");
  assert.equal(anonymousProgress.response.status, 401);
  const anonymousExercise = await request(`/api/learning/exercises/${exerciseId}/submit`, { method: "POST", body: { html: "<h1>x</h1>" } });
  assert.equal(anonymousExercise.response.status, 401);
});

test("public quiz payloads omit answer keys, explanations, and solutions", async () => {
  const result = await request(`/api/learning/quizzes/${quizId}`);
  assert.equal(result.response.status, 200);
  const serialized = JSON.stringify(result.body.data);
  assert.doesNotMatch(serialized, /correctChoiceId|explanation|solutionCode|requirements|rubric/);
  assert.deepEqual(result.body.data.questions[0].choices, [{ id: "a", text: "A" }, { id: "b", text: "B" }]);
});

test("lesson and exercise responses exclude private solutions", async () => {
  sampleModule = { _id: moduleId, path: pathId, title: "Foundations", slug: "foundations", order: 1 };
  sampleLesson = {
    _id: lessonId,
    path: pathId,
    module: moduleId,
    title: "A first page",
    slug: "first-page",
    order: 1,
    content: { introduction: "Create a page.", objectives: ["Use a heading."] },
    project: { description: "A small project", solutionCode: "private lesson solution", solutionExplanation: "private lesson notes" },
  };
  sampleExercise = {
    _id: exerciseId,
    path: pathId,
    module: moduleId,
    lesson: lessonId,
    title: "Add a heading",
    instructions: "Add a heading to the page.",
    starterCode: "<main></main>",
    requirements: [{ type: "element-exists", selector: "h1" }],
    hints: ["Use a heading element.", "Place it in main."],
    solutionCode: "private exercise solution",
    solutionExplanation: "private exercise notes",
    project: { description: "Project", solutionCode: "private project solution" },
  };
  const result = await request(`/api/learning/lessons/${lessonId}`);
  assert.equal(result.response.status, 200);
  const serialized = JSON.stringify(result.body.data);
  assert.doesNotMatch(serialized, /private .*solution|private .*notes|requirements/);
});

test("bookmarks persist per student and cannot be read across accounts", async () => {
  sampleLesson = { _id: lessonId, path: pathId };
  const saved = await request(`/api/learning/lessons/${lessonId}/bookmark`, {
    user: student,
    method: "PUT",
    body: { bookmarked: true },
  });
  assert.equal(saved.response.status, 200);
  assert.equal(saved.body.data.bookmarked, true);

  sampleLesson = { _id: lessonId, path: pathId, module: moduleId, title: "Saved lesson", slug: "saved-lesson", order: 1, estimatedMinutes: 10 };
  sampleModule = { _id: moduleId, path: pathId, title: "Module", slug: "module", order: 1 };
  LearningLesson.find = () => query([sampleLesson]);
  LearningModule.find = () => query([sampleModule]);
  LearningPath.find = () => query([{ _id: pathId, title: "HTML", slug: "html5" }]);
  const owned = await request("/api/learning/bookmarks/me", { user: student });
  assert.equal(owned.response.status, 200);
  assert.equal(owned.body.data.length, 1);
  assert.equal(owned.body.data[0].lesson.title, "Saved lesson");

  const isolated = await request("/api/learning/bookmarks/me", { user: otherStudent });
  assert.equal(isolated.response.status, 200);
  assert.deepEqual(isolated.body.data, []);

  const removed = await request(`/api/learning/lessons/${lessonId}/bookmark`, {
    user: student,
    method: "PUT",
    body: { bookmarked: false },
  });
  assert.equal(removed.response.status, 200);
  assert.equal(removed.body.data.bookmarked, false);
  const afterRemoval = await request("/api/learning/bookmarks/me", { user: student });
  assert.deepEqual(afterRemoval.body.data, []);
});

test("exercise answers are checked and recorded for the authenticated student", async () => {
  sampleExercise = {
    _id: exerciseId,
    path: pathId,
    module: moduleId,
    lesson: lessonId,
    requirements: [{ type: "element-exists", selector: "main > h1" }],
  };
  const result = await request(`/api/learning/exercises/${exerciseId}/submit`, {
    user: student,
    method: "POST",
    body: { html: "<main><h1>My page</h1></main>" },
  });
  assert.equal(result.response.status, 200);
  assert.equal(result.body.data.passed, true);
  assert.equal(result.body.data.results[0].passed, true);
  assert.equal(lastSavedExerciseAttempt.user, student._id);

  const tooLarge = await request(`/api/learning/exercises/${exerciseId}/submit`, {
    user: student,
    method: "POST",
    body: { html: `<p>${"x".repeat(21000)}</p>` },
  });
  assert.equal(tooLarge.response.status, 413);
});

test("quiz submissions validate shape and save the authenticated student's result", async () => {
  const invalid = await request(`/api/learning/quizzes/${quizId}/submit`, {
    user: student,
    method: "POST",
    body: { answers: [{ questionKey: "unknown", choiceId: "a" }] },
  });
  assert.equal(invalid.response.status, 400);
  const unexpectedField = await request(`/api/learning/quizzes/${quizId}/submit`, {
    user: student,
    method: "POST",
    body: { answers: [], admin: true },
  });
  assert.equal(unexpectedField.response.status, 400);
  const otherStudentTarget = await request(`/api/learning/quizzes/${quizId}/submit`, {
    user: student,
    method: "POST",
    body: { answers: [], user: otherStudent._id },
  });
  assert.equal(otherStudentTarget.response.status, 400);

  const answers = [
    { questionKey: "one", choiceId: "a" },
    { questionKey: "two", choiceId: "no" },
    { questionKey: "three", choiceId: "y" },
    { questionKey: "four", response: "It describes the idea in my own words." },
  ];
  const result = await request(`/api/learning/quizzes/${quizId}/submit`, {
    user: student,
    method: "POST",
    body: { answers },
  });
  assert.equal(result.response.status, 200);
  assert.equal(result.body.data.score, 67);
  assert.equal(result.body.data.passed, true);
  assert.equal(lastSavedAttempt.user, student._id);
  assert.equal(lastSavedAttempt.correctCount, 2);
  assert.equal(lastSavedAttempt.questionCount, 3);
  assert.equal(result.body.data.answers[0].correctChoiceId, "a");
  assert.equal(result.body.data.shortAnswerQuestionCount, 1);
  assert.equal(result.body.data.answers[3].submitted, true);
  assert.equal("correct" in result.body.data.answers[3], false);
});

test("progress queries are scoped to the authenticated student", async () => {
  progressUserFilters = [];
  sampleModule = { _id: moduleId, title: "Foundations", slug: "foundations", order: 1 };
  sampleLesson = { _id: lessonId, module: moduleId, title: "First lesson", slug: "first-lesson", order: 1 };
  completedProgress = { lesson: lessonId, completed: true, completedAt: new Date() };
  LearningModule.find = () => query([sampleModule]);
  LearningLesson.find = () => query([sampleLesson, { ...sampleLesson, _id: exerciseId, slug: "second-lesson" }]);
  LearningQuiz.findOne = () => query(null);
  const result = await request(`/api/learning/progress/me?user=${otherStudent._id}`, { user: student });
  assert.equal(result.response.status, 200);
  assert.deepEqual(progressUserFilters, [student._id]);
  assert.equal(result.body.data[0].completedLessons, 1);
  assert.equal(result.body.data[0].totalLessons, 2);
  assert.equal(result.body.data[0].percentage, 50);
});

test("submission rate limit is 20 requests per student per minute", async () => {
  for (let attempt = 0; attempt < 20; attempt += 1) {
    const result = await request(`/api/learning/quizzes/${quizId}/submit`, {
      user: rateLimitStudent,
      method: "POST",
      body: {},
    });
    assert.equal(result.response.status, 400);
  }
  const limited = await request(`/api/learning/quizzes/${quizId}/submit`, {
    user: rateLimitStudent,
    method: "POST",
    body: {},
  });
  assert.equal(limited.response.status, 429);
  assert.ok(Number(limited.response.headers.get("retry-after")) > 0);
});

test("lesson completion is idempotently scoped to the authenticated student", async () => {
  sampleLesson = { _id: lessonId, path: pathId, module: moduleId, title: "First lesson", slug: "first-lesson" };
  const completedAt = new Date("2025-01-02T03:04:05.000Z");
  completedProgress = { lesson: lessonId, completed: true, completedAt, lastViewedAt: new Date() };
  LearningModule.find = () => query([]);
  LearningLesson.find = () => query([]);
  LearningLessonProgress.countDocuments = async (filter) => {
    assert.equal(filter.user, student._id);
    return 1;
  };
  LearningPathProgress.findOneAndUpdate = async () => ({});
  const result = await request(`/api/learning/lessons/${lessonId}/complete`, {
    user: student,
    method: "POST",
    body: {},
  });
  assert.equal(result.response.status, 200);
  assert.equal(result.body.data.completed, true);
  assert.equal(result.body.data.completedLessons, 1);
  assert.equal(result.body.data.percentage, 50);
  assert.equal(lessonProgressUpdate.filter.user, student._id);
  assert.equal(lessonProgressUpdate.update.$set.completedAt.getTime(), completedAt.getTime());
});

test("Python Learning Path metadata is retrievable without creating an Instructor Course", async () => {
  const pythonPath = {
    _id: pathId,
    slug: "python-fundamentals",
    title: "Python Fundamentals",
    subtitle: "Python 3.11+ for beginners",
    description: "Learn to write basic Python programs.",
    subject: "python",
    trackKey: "fundamentals",
    trackOrder: 1,
    prerequisiteSlugs: [],
    estimatedHours: 42,
    minimumPythonVersion: "3.11",
    completionPolicy: "all-lessons-and-assessments",
  };
  const originalFindOne = LearningPath.findOne;
  const originalModuleFind = LearningModule.find;
  const originalLessonCount = LearningLesson.countDocuments;
  LearningPath.findOne = () => query(pythonPath);
  LearningModule.find = () => query([sampleModule]);
  LearningLesson.countDocuments = async () => 25;
  try {
    const result = await request("/api/learning/paths/python-fundamentals");
    assert.equal(result.response.status, 200);
    assert.equal(result.body.data.path.subject, "python");
    assert.equal(result.body.data.path.trackKey, "fundamentals");
    assert.equal(result.body.data.path.minimumPythonVersion, "3.11");
    assert.equal(result.body.data.access.allowed, true);
    assert.equal(result.body.data.lessonCount, 25);
  } finally {
    LearningPath.findOne = originalFindOne;
    LearningModule.find = originalModuleFind;
    LearningLesson.countDocuments = originalLessonCount;
  }
});

test("specialized Python content is locked on deep links and quiz submission until Fundamentals completes", async () => {
  const fundamentalsId = "000000000000000000000010";
  const gatedPath = {
    _id: pathId,
    slug: "python-web-development",
    title: "Python Web Development",
    prerequisiteSlugs: ["python-fundamentals"],
  };
  const originalPathFindOne = LearningPath.findOne;
  const originalPathFind = LearningPath.find;
  const originalProgressFind = LearningPathProgress.find;
  const originalModuleById = LearningModule.findById;
  const originalLessonFind = LearningLesson.find;
  const originalQuizById = LearningQuiz.findById;
  let fundamentalsCompleted = false;
  sampleModule = { _id: moduleId, path: pathId, title: "Web Foundations", slug: "web-foundations", order: 1 };
  LearningPath.findOne = () => query(gatedPath);
  LearningPath.find = () => query([{ _id: fundamentalsId, slug: "python-fundamentals" }]);
  LearningPathProgress.find = (filter) => {
    assert.equal(filter.user, student._id);
    return query(fundamentalsCompleted ? [{ path: fundamentalsId }] : []);
  };
  LearningModule.findById = () => query(sampleModule);
  LearningLesson.find = () => query([]);
  LearningQuiz.findById = async () => ({ ...quiz, path: pathId });
  try {
    const anonymousDeepLink = await request(`/api/learning/modules/${moduleId}`);
    assert.equal(anonymousDeepLink.response.status, 401);
    assert.equal(anonymousDeepLink.body.code, "STUDENT_AUTHENTICATION_REQUIRED");

    const instructorDeepLink = await request(`/api/learning/modules/${moduleId}`, { user: instructor });
    assert.equal(instructorDeepLink.response.status, 403);

    const incompleteDeepLink = await request(`/api/learning/modules/${moduleId}`, { user: student });
    assert.equal(incompleteDeepLink.response.status, 403);
    assert.equal(incompleteDeepLink.body.code, "LEARNING_PREREQUISITE_REQUIRED");
    assert.deepEqual(incompleteDeepLink.body.data.incompletePrerequisites, ["python-fundamentals"]);

    const blockedSubmission = await request(`/api/learning/quizzes/${quizId}/submit`, {
      user: student,
      method: "POST",
      body: { answers: [
        { questionKey: "one", choiceId: "a" },
        { questionKey: "two", choiceId: "no" },
        { questionKey: "three", choiceId: "x" },
      ] },
    });
    assert.equal(blockedSubmission.response.status, 403);
    assert.equal(blockedSubmission.body.code, "LEARNING_PREREQUISITE_REQUIRED");

    fundamentalsCompleted = true;
    const unlockedDeepLink = await request(`/api/learning/modules/${moduleId}`, { user: student });
    assert.equal(unlockedDeepLink.response.status, 200);
    assert.equal(unlockedDeepLink.body.data.module.title, "Web Foundations");
  } finally {
    LearningPath.findOne = originalPathFindOne;
    LearningPath.find = originalPathFind;
    LearningPathProgress.find = originalProgressFind;
    LearningModule.findById = originalModuleById;
    LearningLesson.find = originalLessonFind;
    LearningQuiz.findById = originalQuizById;
  }
});

test("Python exercise solutions are hidden until explicit student self-check request and are never HTML-graded", async () => {
  const originalPathFindOne = LearningPath.findOne;
  const originalLessonById = LearningLesson.findById;
  const originalModuleById = LearningModule.findById;
  const originalExerciseFindOne = LearningExercise.findOne;
  const originalExerciseById = LearningExercise.findById;
  const pythonPath = { _id: pathId, slug: "python-fundamentals", title: "Python Fundamentals", prerequisiteSlugs: [] };
  sampleModule = { _id: moduleId, path: pathId, title: "Getting Started", slug: "getting-started", order: 1 };
  sampleLesson = {
    _id: lessonId,
    path: pathId,
    module: moduleId,
    title: "Run Python Programs",
    slug: "run-python-programs",
    order: 1,
    content: { introduction: "Run a saved Python script.", objectives: ["Run a script.", "Inspect output."] },
  };
  sampleExercise = {
    _id: exerciseId,
    path: pathId,
    module: moduleId,
    lesson: lessonId,
    title: "Write a greeting",
    language: "python",
    instructions: "Write and run the code locally.",
    starterCode: "print('hello')",
    selfChecks: ["It prints hello.", "It runs in Python 3.11+."],
    hints: ["Use print.", "Use quotes around text."],
    requirements: [],
    solutionCode: "print('Hello, learner!')",
    solutionExplanation: "print displays the supplied string.",
  };
  LearningPath.findOne = () => query(pythonPath);
  LearningLesson.findById = () => query(sampleLesson);
  LearningModule.findById = () => query(sampleModule);
  LearningExercise.findOne = () => query(sampleExercise);
  LearningExercise.findById = () => query(sampleExercise);
  try {
    const lesson = await request(`/api/learning/lessons/${lessonId}`);
    assert.equal(lesson.response.status, 200);
    assert.equal(lesson.body.data.exercise.language, "python");
    assert.deepEqual(lesson.body.data.exercise.selfChecks, sampleExercise.selfChecks);
    assert.doesNotMatch(JSON.stringify(lesson.body.data), /solutionCode|solutionExplanation/);

    const anonymousSolution = await request(`/api/learning/exercises/${exerciseId}/reference-solution`, {
      method: "POST",
      body: { confirmSelfCheck: true },
    });
    assert.equal(anonymousSolution.response.status, 401);

    const unconfirmedSolution = await request(`/api/learning/exercises/${exerciseId}/reference-solution`, {
      user: student,
      method: "POST",
      body: {},
    });
    assert.equal(unconfirmedSolution.response.status, 400);

    const revealedSolution = await request(`/api/learning/exercises/${exerciseId}/reference-solution`, {
      user: student,
      method: "POST",
      body: { confirmSelfCheck: true },
    });
    assert.equal(revealedSolution.response.status, 200);
    assert.equal(revealedSolution.body.data.solutionCode, sampleExercise.solutionCode);

    const submittedToHtmlChecker = await request(`/api/learning/exercises/${exerciseId}/submit`, {
      user: student,
      method: "POST",
      body: { html: "print('Hello')" },
    });
    assert.equal(submittedToHtmlChecker.response.status, 400);
    assert.match(submittedToHtmlChecker.body.message, /not submitted to LearnHub/i);
  } finally {
    LearningPath.findOne = originalPathFindOne;
    LearningLesson.findById = originalLessonById;
    LearningModule.findById = originalModuleById;
    LearningExercise.findOne = originalExerciseFindOne;
    LearningExercise.findById = originalExerciseById;
  }
});

test("Python path completion requires lessons and assessments but not an unverified project pass", async () => {
  const secondQuizId = "000000000000000000000011";
  const projectId = "000000000000000000000012";
  const originalPathFindOne = LearningPath.findOne;
  const originalModuleFind = LearningModule.find;
  const originalLessonFind = LearningLesson.find;
  const originalLessonCount = LearningLessonProgress.countDocuments;
  const originalQuizFind = LearningQuiz.find;
  const originalQuizDistinct = LearningQuizAttempt.distinct;
  const originalExerciseFind = LearningExercise.find;
  const originalExerciseDistinct = LearningExerciseAttempt.distinct;
  const originalProgressFindOne = LearningPathProgress.findOne;
  const originalProgressUpsert = LearningPathProgress.findOneAndUpdate;
  let pythonAssessmentPassed = false;
  let projectPassed = false;
  let lastProgressUpdate;
  const module = { _id: moduleId };
  const requiredQuizzes = [
    { _id: quizId, scope: "module", module: moduleId },
    { _id: secondQuizId, scope: "final", module: null },
  ];
  LearningPath.findOne = () => query({ completionPolicy: "all-lessons-and-assessments" });
  LearningModule.find = () => query([module]);
  LearningLesson.find = () => query([{ _id: lessonId }]);
  LearningLessonProgress.countDocuments = async () => 1;
  LearningQuiz.find = () => query(requiredQuizzes);
  LearningQuizAttempt.distinct = async () => pythonAssessmentPassed ? [quizId, secondQuizId] : [];
  LearningExercise.find = () => query([{ _id: projectId, project: { description: "self-check project" } }]);
  LearningExerciseAttempt.distinct = async () => projectPassed ? [projectId] : [];
  LearningPathProgress.findOne = () => query(null);
  LearningPathProgress.findOneAndUpdate = async (filter, update) => { lastProgressUpdate = { filter, update }; };
  try {
    assert.equal(await recomputePathCompletion(student._id, pathId), false);
    assert.equal(lastProgressUpdate.update.$set.completedAt, null, "opened/completed lessons alone do not complete the path");
    pythonAssessmentPassed = true;
    assert.equal(await recomputePathCompletion(student._id, pathId), true, "Python does not require an online project pass");
    assert.ok(lastProgressUpdate.update.$set.completedAt instanceof Date);

    LearningPath.findOne = () => query({});
    pythonAssessmentPassed = true;
    projectPassed = false;
    assert.equal(await recomputePathCompletion(student._id, pathId), false, "legacy paths retain the project-pass requirement");
    projectPassed = true;
    assert.equal(await recomputePathCompletion(student._id, pathId), true);
  } finally {
    LearningPath.findOne = originalPathFindOne;
    LearningModule.find = originalModuleFind;
    LearningLesson.find = originalLessonFind;
    LearningLessonProgress.countDocuments = originalLessonCount;
    LearningQuiz.find = originalQuizFind;
    LearningQuizAttempt.distinct = originalQuizDistinct;
    LearningExercise.find = originalExerciseFind;
    LearningExerciseAttempt.distinct = originalExerciseDistinct;
    LearningPathProgress.findOne = originalProgressFindOne;
    LearningPathProgress.findOneAndUpdate = originalProgressUpsert;
  }
});
